import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TaskLog, User } from '../models';
import { AppError } from '../middleware/errorHandler';

export const logTask = async (req: AuthRequest, res: Response): Promise<void> => {
    const { task_name, description, date, start_time, end_time, hours_spent, status } = req.body;

    const task = await TaskLog.create({
        employee_id: req.user!.id,
        task_name,
        description,
        date: date || new Date(),
        start_time,
        end_time,
        hours_spent: hours_spent || 0,
        status: status || 'completed',
    });

    res.status(201).json({
        message: 'Task logged successfully',
        task,
    });
};

export const getMyTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    const { date } = req.query;
    const where: any = { employee_id: req.user!.id };
    if (date) where.date = date;

    const tasks = await TaskLog.findAll({
        where,
        order: [['date', 'DESC'], ['created_at', 'DESC']],
    });
    res.json(tasks);
};

export const getAllTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    const { date, employee_id } = req.query;
    const where: any = {};
    if (date) where.date = date;
    if (employee_id) where.employee_id = employee_id;

    const tasks = await TaskLog.findAll({
        where,
        include: [{ model: User, as: 'employee', attributes: ['name', 'employee_id'] }],
        order: [['date', 'DESC'], ['created_at', 'DESC']],
    });
    res.json(tasks);
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const task = await TaskLog.findByPk(id);
    if (!task) throw new AppError(404, 'Task not found');

    if (task.employee_id !== req.user!.id && req.user!.role === 'employee') {
        throw new AppError(403, 'Permission denied');
    }

    await task.update(req.body);
    res.json({ message: 'Task updated successfully', task });
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const task = await TaskLog.findByPk(id);
    if (!task) throw new AppError(404, 'Task not found');

    if (task.employee_id !== req.user!.id && req.user!.role === 'employee') {
        throw new AppError(403, 'Permission denied');
    }

    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
};
