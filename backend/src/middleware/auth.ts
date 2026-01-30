import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import User from '../models/User';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'admin' | 'hr' | 'employee';
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, config.jwt.secret) as {
                id: string;
                email: string;
                role: 'admin' | 'hr' | 'employee';
            };

            // Verify user still exists
            const user = await User.findByPk(decoded.id);
            if (!user || user.status !== 'active') {
                res.status(401).json({ message: 'User not found or inactive' });
                return;
            }

            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Invalid or expired token' });
            return;
        }
    } catch (error) {
        res.status(500).json({ message: 'Authentication error' });
        return;
    }
};

export const requireHR = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }

    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
        res.status(403).json({ message: 'HR or Admin access required' });
        return;
    }

    next();
};

export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({ message: 'Admin access required' });
        return;
    }

    next();
};

export const requireSelfOrHR = (idParam: string = 'id') => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const resourceId = req.params[idParam];

        if (req.user.role === 'hr' || req.user.role === 'admin' || req.user.id === resourceId) {
            next();
            return;
        }

        res.status(403).json({ message: 'Access denied' });
        return;
    };
};
