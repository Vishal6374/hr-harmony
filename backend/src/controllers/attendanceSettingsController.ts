import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AttendanceSettings from '../models/AttendanceSettings';
import { AppError } from '../middleware/errorHandler';

export const getAttendanceSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Get the first (and should be only) settings record
        let settings = await AttendanceSettings.findOne();

        // If no settings exist, create default settings
        if (!settings) {
            settings = await AttendanceSettings.create({
                standard_work_hours: 8.00,
                half_day_threshold: 4.00,
                allow_self_clock_in: true,
            });
        }

        res.json(settings);
    } catch (error: any) {
        console.error('Error fetching attendance settings:', error);
        res.status(500).json({
            message: 'Failed to fetch attendance settings',
            error: error.message || String(error)
        });
    }
};

export const updateAttendanceSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Only HR or Admin can update settings
        if (req.user?.role !== 'hr' && req.user?.role !== 'admin') {
            throw new AppError(403, 'Permission denied');
        }

        const { standard_work_hours, half_day_threshold, allow_self_clock_in } = req.body;

        // Validate inputs
        if (standard_work_hours !== undefined && (standard_work_hours < 0 || standard_work_hours > 24)) {
            throw new AppError(400, 'Standard work hours must be between 0 and 24');
        }

        if (half_day_threshold !== undefined && (half_day_threshold < 0 || half_day_threshold > 24)) {
            throw new AppError(400, 'Half day threshold must be between 0 and 24');
        }

        if (half_day_threshold !== undefined && standard_work_hours !== undefined && half_day_threshold > standard_work_hours) {
            throw new AppError(400, 'Half day threshold cannot be greater than standard work hours');
        }

        // Get or create settings
        let settings = await AttendanceSettings.findOne();

        if (!settings) {
            settings = await AttendanceSettings.create({
                standard_work_hours: standard_work_hours || 8.00,
                half_day_threshold: half_day_threshold || 4.00,
                allow_self_clock_in: allow_self_clock_in !== undefined ? allow_self_clock_in : true,
            });
        } else {
            await settings.update({
                standard_work_hours: standard_work_hours !== undefined ? standard_work_hours : settings.standard_work_hours,
                half_day_threshold: half_day_threshold !== undefined ? half_day_threshold : settings.half_day_threshold,
                allow_self_clock_in: allow_self_clock_in !== undefined ? allow_self_clock_in : settings.allow_self_clock_in,
            });
        }

        res.json({
            message: 'Attendance settings updated successfully',
            settings,
        });
    } catch (error: any) {
        console.error('Error updating attendance settings:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({
                message: 'Failed to update attendance settings',
                error: error.message || String(error)
            });
        }
    }
};
