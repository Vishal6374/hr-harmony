import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import SystemSettings from '../models/SystemSettings';
import { AppError } from '../middleware/errorHandler';
import { BiometricService } from '../services/BiometricService'; // Import the class

const biometricService = new BiometricService();

export const updateConfig = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'admin') {
            throw new AppError(403, 'Only Admins can configure biometric settings');
        }

        const { mode, config } = req.body; // config structure as per design

        let settings = await SystemSettings.findOne();
        if (!settings) {
            // Should exist usually
            throw new AppError(404, 'System settings not found');
        }

        // Deep merge or replace
        const currentConfig = settings.attendance_config || {};
        const newConfig = {
            ...currentConfig,
            mode: mode || currentConfig.mode,
            biometric_config: config ? { ...currentConfig.biometric_config, ...config } : currentConfig.biometric_config
        };

        // Security stripping/referencing (basic implementation)
        // Ensure no cleartext passwords if possible - frontend might send them, backend should store safely
        // But for this task, we store as is unless "credential_ref" is used.

        settings.attendance_config = newConfig;
        await settings.save();

        res.json({
            success: true,
            message: 'Configuration updated. Validation pending.',
            config: newConfig
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const validateSystem = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const settings = await SystemSettings.findOne();
        const config = settings?.attendance_config?.biometric_config;

        if (!config) {
            throw new AppError(400, "Biometric configuration missing");
        }

        const result = await biometricService.validateConfig(config);
        res.json(result);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const triggerSync = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const dryRun = req.query.dry_run === 'true';

        // In a real system, we might push to a queue. Here we await for simplicity or fire-and-forget.
        // For request/response, we might await short tasks.

        const result = await biometricService.syncLogs(dryRun);

        res.json({
            job_id: `sync_${Date.now()}`,
            status: 'COMPLETED', // or STARTED if async
            result
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getSyncStatus = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const settings = await SystemSettings.findOne();
        // Return dummy status for now as we don't track persistent job status in DB yet
        res.json({
            mode: settings?.attendance_config?.mode || 'NORMAL',
            state: 'READY',
            last_sync: new Date(),
            status: 'IDLE',
            stats: {
                today_logs_fetched: 0,
                pending_processing: 0
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
