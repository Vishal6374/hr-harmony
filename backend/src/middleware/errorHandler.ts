import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'sequelize';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export const errorHandler = (
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
        return;
    }

    if (err instanceof ValidationError) {
        res.status(400).json({
            status: 'error',
            message: 'Validation error',
            errors: err.errors.map((e) => ({
                field: e.path,
                message: e.message,
            })),
        });
        return;
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({
            status: 'error',
            message: 'Resource already exists',
        });
        return;
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        res.status(400).json({
            status: 'error',
            message: 'Invalid reference to related resource',
        });
        return;
    }

    // Default error
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
};

export const notFound = (req: Request, res: Response): void => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`,
    });
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
