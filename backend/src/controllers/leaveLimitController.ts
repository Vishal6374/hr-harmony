import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import LeaveLimit from '../models/LeaveLimit';
import { AppError } from '../middleware/errorHandler';

// Get leave limits
export const getLeaveLimits = async (_req: AuthRequest, res: Response): Promise<void> => {
    // Get the first (and only) record
    let limits = await LeaveLimit.findOne();

    // If no limits exist, create default
    if (!limits) {
        limits = await LeaveLimit.create({
            casual_leave: 12,
            sick_leave: 12,
            earned_leave: 15,
        });
    }

    res.json(limits);
};

// Update leave limits (HR only)
export const updateLeaveLimits = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can update leave limits');
    }

    const { casual_leave, sick_leave, earned_leave } = req.body;

    // Validate inputs
    if (casual_leave < 0 || sick_leave < 0 || earned_leave < 0) {
        throw new AppError(400, 'Leave limits cannot be negative');
    }

    // Get or create limits
    let limits = await LeaveLimit.findOne();

    if (!limits) {
        limits = await LeaveLimit.create({
            casual_leave: casual_leave || 12,
            sick_leave: sick_leave || 12,
            earned_leave: earned_leave || 15,
        });
    } else {
        // Update existing limits
        if (casual_leave !== undefined) limits.casual_leave = casual_leave;
        if (sick_leave !== undefined) limits.sick_leave = sick_leave;
        if (earned_leave !== undefined) limits.earned_leave = earned_leave;
        await limits.save();
    }

    res.json({
        message: 'Leave limits updated successfully',
        limits,
    });
};
