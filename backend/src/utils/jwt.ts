import jwt from 'jsonwebtoken';
import { config } from '../config';

export const generateToken = (payload: {
    id: string;
    email: string;
    role: 'hr' | 'employee';
}): string => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as string,
    });
};

export const generateRefreshToken = (payload: {
    id: string;
    email: string;
}): string => {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn as string,
    });
};

export const verifyRefreshToken = (token: string): any => {
    return jwt.verify(token, config.jwt.refreshSecret);
};
