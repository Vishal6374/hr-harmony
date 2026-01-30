import jwt from 'jsonwebtoken';
import { config } from '../config';

export const generateToken = (payload: {
    id: string;
    email: string;
    role: 'admin' | 'hr' | 'employee';
}): string => {
    return jwt.sign(payload, config.jwt.secret as any, {
        expiresIn: config.jwt.expiresIn as any,
    });
};

export const generateRefreshToken = (payload: {
    id: string;
    email: string;
}): string => {
    return jwt.sign(payload, config.jwt.refreshSecret as any, {
        expiresIn: config.jwt.refreshExpiresIn as any,
    });
};

export const verifyRefreshToken = (token: string): any => {
    return jwt.verify(token, config.jwt.refreshSecret);
};
