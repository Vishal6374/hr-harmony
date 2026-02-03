import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import SystemSettings from '../models/SystemSettings';
import { AppError } from '../middleware/errorHandler';
import { getFileUrl } from '../utils/fileUpload';
import { logAudit } from '../utils/auditLogger';

export const getSystemSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            // Create default settings if not exists
            settings = await SystemSettings.create();
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching system settings:', error);
        res.status(500).json({ message: 'Internal server error fetching system settings' });
    }
};

export const updateSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'admin') {
            throw new AppError(403, 'Only Admin can update system settings');
        }

        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create();
        }

        const oldValues = settings.toJSON();

        // Update fields from body
        const allowedFields = [
            'company_name',
            'site_title',
            'company_logo_url',
            'favicon_url',
            'sidebar_logo_url',
            'login_bg_url',
            'login_logo_url',
            'login_title',
            'login_subtitle',
            'payslip_header_name',
            'payslip_logo_url',
            'payslip_address',
            'hr_can_manage_employees',
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                (settings as any)[field] = req.body[field];
            }
        }

        // Handle file uploads
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            for (const field in files) {
                if (files[field] && files[field][0]) {
                    const url = getFileUrl(req, files[field][0].filename);
                    (settings as any)[field] = url;
                }
            }
        }

        await settings.save();

        await logAudit({
            action: 'UPDATE_SETTINGS',
            module: 'SYSTEM',
            entity_type: 'SYSTEM_SETTINGS',
            entity_id: settings.id,
            performed_by: req.user.id,
            old_value: oldValues,
            new_value: settings.toJSON(),
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
        });

        res.json({
            message: 'System settings updated successfully',
            settings,
        });

    } catch (error) {
        console.error('Error updating system settings:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error updating system settings' });
        }
    }
};
