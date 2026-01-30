import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Meeting, User } from '../models';
import { AppError } from '../middleware/errorHandler';

export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, description, type, meeting_url, location, date, start_time, end_time, attendees } = req.body;

    const meeting = await Meeting.create({
        title,
        description,
        type,
        meeting_url,
        location,
        date,
        start_time,
        end_time,
        attendees: JSON.stringify(attendees || []),
        created_by: req.user!.id,
    });

    res.status(201).json({
        message: 'Meeting scheduled successfully',
        meeting,
    });
};

export const getMyMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
    const allMeetings = await Meeting.findAll({
        order: [['date', 'ASC'], ['start_time', 'ASC']],
    });

    // Filter meetings where user is either the creator or an attendee
    const myMeetings = allMeetings.filter(m => {
        if (m.created_by === req.user!.id) return true;
        try {
            const attendeesList = JSON.parse(m.attendees);
            return attendeesList.includes(req.user!.id);
        } catch (e) {
            return false;
        }
    });

    res.json(myMeetings);
};

export const getAllMeetings = async (_req: AuthRequest, res: Response): Promise<void> => {
    const meetings = await Meeting.findAll({
        include: [{ model: User, as: 'creator', attributes: ['name', 'employee_id'] }],
        order: [['date', 'ASC'], ['start_time', 'ASC']],
    });
    res.json(meetings);
};

export const updateMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const meeting = await Meeting.findByPk(id);
    if (!meeting) throw new AppError(404, 'Meeting not found');

    if (meeting.created_by !== req.user!.id && req.user!.role !== 'hr' && req.user!.role !== 'admin') {
        throw new AppError(403, 'Permission denied');
    }

    if (req.body.attendees) {
        req.body.attendees = JSON.stringify(req.body.attendees);
    }

    await meeting.update(req.body);
    res.json({ message: 'Meeting updated successfully', meeting });
};

export const deleteMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const meeting = await Meeting.findByPk(id);
    if (!meeting) throw new AppError(404, 'Meeting not found');

    if (meeting.created_by !== req.user!.id && req.user!.role !== 'hr' && req.user!.role !== 'admin') {
        throw new AppError(403, 'Permission denied');
    }

    await meeting.destroy();
    res.json({ message: 'Meeting deleted successfully' });
};
