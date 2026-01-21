import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import User from '../models/User';
import AttendanceLog from '../models/AttendanceLog';
import LeaveRequest from '../models/LeaveRequest';
import Reimbursement from '../models/Reimbursement';
import Complaint from '../models/Complaint';
import PayrollBatch from '../models/PayrollBatch';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (req.user?.role === 'hr') {
        // HR Dashboard
        const [
            totalEmployees,
            activeEmployees,
            presentToday,
            absentToday,
            onLeaveToday,
            pendingLeaves,
            pendingReimbursements,
            activeComplaints,
            currentPayroll,
        ] = await Promise.all([
            User.count(),
            User.count({ where: { status: 'active' } }),
            AttendanceLog.count({
                where: {
                    date: today,
                    status: 'present',
                },
            }),
            AttendanceLog.count({
                where: {
                    date: today,
                    status: 'absent',
                },
            }),
            User.count({ where: { status: 'on_leave' } }),
            LeaveRequest.count({ where: { status: 'pending' } }),
            Reimbursement.count({ where: { status: 'pending' } }),
            Complaint.count({
                where: {
                    status: {
                        [Op.in]: ['open', 'in_progress'],
                    },
                },
            }),
            PayrollBatch.findOne({
                where: {
                    month: today.getMonth() + 1,
                    year: today.getFullYear(),
                },
            }),
        ]);

        res.json({
            totalEmployees,
            activeEmployees,
            presentToday,
            absentToday,
            onLeaveToday,
            pendingLeaves,
            pendingReimbursements,
            activeComplaints,
            payrollStatus: currentPayroll?.status || 'not_started',
            totalPayroll: currentPayroll?.total_amount || 0,
        });
    } else {
        // Employee Dashboard
        const employeeId = req.user?.id;

        const [
            myAttendance,
            myLeaves,
            myReimbursements,
            myComplaints,
            mySalarySlips,
        ] = await Promise.all([
            AttendanceLog.count({
                where: {
                    employee_id: employeeId,
                    date: {
                        [Op.gte]: new Date(today.getFullYear(), today.getMonth(), 1),
                    },
                    status: 'present',
                },
            }),
            LeaveRequest.findAll({
                where: { employee_id: employeeId },
                order: [['created_at', 'DESC']],
                limit: 5,
            }),
            Reimbursement.findAll({
                where: { employee_id: employeeId },
                order: [['created_at', 'DESC']],
                limit: 5,
            }),
            Complaint.findAll({
                where: { employee_id: employeeId },
                order: [['created_at', 'DESC']],
                limit: 5,
            }),
            User.findByPk(employeeId, {
                include: [{ association: 'salarySlips', limit: 6, order: [['year', 'DESC'], ['month', 'DESC']] }],
            }),
        ]);

        res.json({
            presentDaysThisMonth: myAttendance,
            recentLeaves: myLeaves,
            recentReimbursements: myReimbursements,
            recentComplaints: myComplaints,
            recentSalarySlips: (mySalarySlips as any)?.salarySlips || [],
        });
    }
};
