import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Holiday from '../models/Holiday';
import { AppError } from '../middleware/errorHandler';

export const getHolidays = async (req: AuthRequest, res: Response): Promise<void> => {
    const { year, type } = req.query;

    const where: any = {};

    if (year) {
        where.year = year;
    } else {
        where.year = new Date().getFullYear();
    }

    if (type) {
        where.type = type;
    }

    const holidays = await Holiday.findAll({
        where,
        order: [['date', 'ASC']],
    });

    res.json(holidays);
};

export const getHolidayById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const holiday = await Holiday.findByPk(id);

    if (!holiday) {
        throw new AppError(404, 'Holiday not found');
    }

    res.json(holiday);
};

export const createHoliday = async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, date, type, is_optional } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can create holidays');
    }

    const holidayDate = new Date(date);

    const holiday = await Holiday.create({
        name,
        date: holidayDate,
        type,
        is_optional: is_optional || false,
        year: holidayDate.getFullYear(),
    });

    res.status(201).json({
        message: 'Holiday created successfully',
        holiday,
    });
};

export const updateHoliday = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, date, type, is_optional } = req.body;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can update holidays');
    }

    const holiday = await Holiday.findByPk(id);

    if (!holiday) {
        throw new AppError(404, 'Holiday not found');
    }

    if (name !== undefined) holiday.name = name;
    if (date !== undefined) {
        const holidayDate = new Date(date);
        holiday.date = holidayDate;
        holiday.year = holidayDate.getFullYear();
    }
    if (type !== undefined) holiday.type = type;
    if (is_optional !== undefined) holiday.is_optional = is_optional;

    await holiday.save();

    res.json({
        message: 'Holiday updated successfully',
        holiday,
    });
};

export const deleteHoliday = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    if (req.user?.role !== 'hr') {
        throw new AppError(403, 'Only HR can delete holidays');
    }

    const holiday = await Holiday.findByPk(id);

    if (!holiday) {
        throw new AppError(404, 'Holiday not found');
    }

    await holiday.destroy();

    res.json({ message: 'Holiday deleted successfully' });
};
