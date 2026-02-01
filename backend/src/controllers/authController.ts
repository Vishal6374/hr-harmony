import { Response } from 'express';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { sendEmail } from '../utils/email';
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

    // Restriction: Employees can only edit profile within 48 hours of onboarding
    if (user.role === 'employee') {
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const diffInHours = Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (diffInHours > 48) {
            throw new AppError(403, 'Profile editing is locked after 48 hours of onboarding. Please contact HR for updates.');
        }
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

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
        throw new AppError(400, 'Please provide your email address');
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
        throw new AppError(404, 'There is no user with that email address');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Token expires in 10 minutes
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.reset_password_token = passwordResetToken;
    user.reset_password_expires = passwordResetExpires;
    await user.save();

    // Create reset URL
    // In production, this should be an environment variable
    const origin = req.get('origin') || 'http://localhost:5173';
    const resetURL = `${origin}/reset-password?token=${resetToken}`;

    const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Password Reset Request</h2>
            <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
            <p>Please click on the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetURL}">${resetURL}</a></p>
            <p>This link is valid for 10 minutes.</p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        </div>
    `;

    // DEV: Log URL
    if (process.env.NODE_ENV === 'development') {
        console.log('RESET URL (DEV ONLY):', resetURL);
    }

    try {
        await sendEmail({
            to: user.email,
            subject: 'Your Password Reset Token (valid for 10 min)',
            html: message,
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!',
        });
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Email sending failed in development', err);
            // In dev, we pretend it worked so we can use the console link
            res.status(200).json({
                status: 'success',
                message: 'Token generated! Check backend console for link (Email failed).',
            });
            return;
        }

        user.reset_password_token = undefined;
        user.reset_password_expires = undefined;
        await user.save({ validate: false });

        throw new AppError(500, 'There was an error sending the email. Try again later!');
    }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const { token, password } = req.body;

    if (!token || !password) {
        throw new AppError(400, 'Token and new password are required');
    }

    // Hash the token to compare with DB
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        where: {
            reset_password_token: hashedToken,
            reset_password_expires: { [Op.gt]: new Date() },
        },
    });

    if (!user) {
        throw new AppError(400, 'Token is invalid or has expired');
    }

    user.password = password;
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();

    // Log the user in directly? Or ask them to login?
    // Usually asking to login is safer/simpler stateless wise, but sending token works too.
    // Let's just return success and let frontend redirect to login.

    res.status(200).json({
        status: 'success',
        message: 'Password reset successful! Please log in.',
    });
};
