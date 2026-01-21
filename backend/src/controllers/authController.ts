import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError(400, 'Email and password are required');
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
        throw new AppError(401, 'Invalid credentials');
    }

    if (user.status !== 'active') {
        throw new AppError(403, 'Account is not active');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError(401, 'Invalid credentials');
    }

    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
    });

    res.json({
        message: 'Login successful',
        token,
        refreshToken,
        user: user.toJSON(),
    });
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }

    const user = await User.findByPk(req.user.id, {
        include: [
            { association: 'department' },
            { association: 'designation' },
            { association: 'reportingManager', attributes: ['id', 'name', 'email'] },
        ],
    });

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    res.json(user.toJSON());
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }

    const { phone, address, avatar_url } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    // Only allow updating specific fields
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;

    await user.save();

    res.json({
        message: 'Profile updated successfully',
        user: user.toJSON(),
    });
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new AppError(400, 'Current and new password are required');
    }

    if (newPassword.length < 6) {
        throw new AppError(400, 'Password must be at least 6 characters');
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
        throw new AppError(401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
};
