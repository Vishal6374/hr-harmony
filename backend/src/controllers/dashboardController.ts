import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';
import User from '../models/User';
import Department from '../models/Department';
import AttendanceLog from '../models/AttendanceLog';
import LeaveRequest from '../models/LeaveRequest';
import PayrollBatch from '../models/PayrollBatch';
import SalarySlip from '../models/SalarySlip';
import Resignation from '../models/Resignation';
import TaskLog from '../models/TaskLog';
import AuditLog from '../models/AuditLog';
import LeaveBalance from '../models/LeaveBalance';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const sequelize = User.sequelize;
    if (!sequelize) throw new Error('Sequelize instance not found');

    try {
        if (req.user?.role === 'admin') {
            // 1. ADMIN DASHBOARD - SYSTEM & BUSINESS VIEW
            const [
                activeEmployees,
                newHiresMTD,
                totalExitsMTD,
                departmentsCount,
                activeToday,
                batches,
                workforceTrend,
                attritionByDept,
                recentActivity
            ] = await Promise.all([
                User.count({ where: { status: 'active' } }),
                User.count({ where: { created_at: { [Op.gte]: startOfMonthDate } } }),
                Resignation.count({
                    where: {
                        status: 'approved',
                        approved_last_working_day: { [Op.gte]: startOfMonthDate }
                    }
                }),
                Department.count(),
                AttendanceLog.count({
                    where: {
                        date: { [Op.eq]: today },
                        status: { [Op.in]: ['present', 'half_day'] }
                    }
                }),
                PayrollBatch.findAll({
                    where: { month: today.getMonth() + 1, year: today.getFullYear() },
                    attributes: ['id']
                }),
                User.findAll({
                    attributes: [
                        [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'],
                        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                    ],
                    group: ['month'],
                    order: [['month', 'ASC']],
                    limit: 12
                }),
                Resignation.findAll({
                    include: [{
                        model: User,
                        as: 'employee',
                        include: [{ model: Department, as: 'department' }]
                    }],
                    where: { created_at: { [Op.gte]: startOfMonthDate } }
                }),
                AuditLog.findAll({
                    limit: 10,
                    order: [['created_at', 'DESC']],
                    include: [{ model: User, as: 'performer', attributes: ['name'] }]
                })
            ]);

            const batchIds = batches.map(b => b.id);
            const payrollMTD = batchIds.length > 0 ? await SalarySlip.sum('net_salary', { where: { batch_id: batchIds } }) : 0;

            // Process Attrition by Dept
            const attritionStats: any = {};
            attritionByDept.forEach((r: any) => {
                const deptName = r.employee?.department?.name || 'Unknown';
                attritionStats[deptName] = (attritionStats[deptName] || 0) + 1;
            });

            // Fill gaps in workforce growth (last 12 months)
            const filledWorkforceTrend = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                const match = (workforceTrend as any[]).find(row => {
                    const rowMonth = typeof row.month === 'string' ? row.month : row.get('month');
                    return rowMonth === monthStr;
                });
                filledWorkforceTrend.push({
                    month: monthStr,
                    count: match ? parseInt(match.dataValues?.count || match.get('count') || 0) : 0
                });
            }

            res.json({
                role: 'admin',
                kpis: {
                    totalEmployees: activeEmployees,
                    newHiresMTD,
                    attritionRate: activeEmployees > 0 ? ((totalExitsMTD / activeEmployees) * 100).toFixed(1) : 0,
                    departments: departmentsCount,
                    activeUsersToday: activeToday,
                    payrollCostMTD: payrollMTD || 0
                },
                charts: {
                    workforceGrowth: filledWorkforceTrend,
                    attritionByDept: Object.keys(attritionStats).map(name => ({ name, count: attritionStats[name] })),
                    payrollDistribution: [] // TODO: Group payroll by dept
                },
                recentActivity
            });

        } else if (req.user?.role === 'hr') {
            // 2. HR DASHBOARD - PEOPLE OPERATIONS VIEW
            const [
                totalEmployees,
                presentToday,
                pendingLeaves,
                currentBatch,
                upcomingExits,
                attendanceTrend,
                leaveTypeDist
            ] = await Promise.all([
                User.count({ where: { status: 'active', role: { [Op.ne]: 'admin' } } }),
                AttendanceLog.count({
                    where: {
                        date: { [Op.eq]: today },
                        status: { [Op.in]: ['present', 'half_day'] }
                    }
                }),
                LeaveRequest.count({ where: { status: 'pending' } }),
                PayrollBatch.findOne({ where: { month: today.getMonth() + 1, year: today.getFullYear() } }),
                Resignation.count({
                    where: {
                        [Op.or]: [
                            { status: 'pending' },
                            {
                                status: 'approved',
                                approved_last_working_day: { [Op.gt]: today }
                            }
                        ]
                    }
                }),
                AttendanceLog.findAll({
                    where: {
                        date: { [Op.gte]: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
                        status: { [Op.in]: ['present', 'half_day'] }
                    },
                    attributes: ['date', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                    group: ['date'],
                    order: [['date', 'ASC']]
                }),
                LeaveRequest.findAll({
                    attributes: ['leave_type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                    group: ['leave_type']
                })
            ]);

            // Fill gaps in attendance trend (last 7 days)
            const filledAttendanceTrend = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                // attendanceTrend is an array of Sequelize models with dataValues or raw results
                const match = (attendanceTrend as any[]).find(row => {
                    const rowDate = typeof row.date === 'string' ? row.date : row.get('date');
                    return rowDate === dateStr;
                });

                filledAttendanceTrend.push({
                    date: dateStr,
                    count: match ? parseInt(match.dataValues?.count || match.get('count') || 0) : 0
                });
            }

            res.json({
                role: 'hr',
                kpis: {
                    totalEmployees,
                    presentToday,
                    pendingLeaves,
                    payrollStatus: currentBatch?.status || 'not_started',
                    upcomingExits
                },
                charts: {
                    attendanceTrend: filledAttendanceTrend,
                    leaveTypeDist
                }
            });

        } else {
            // 3. EMPLOYEE DASHBOARD - SELF-SERVICE VIEW
            const employeeId = req.user?.id;
            const [
                todayLog,
                leaveBalances,
                lastSalary,
                tasksMTD,
                monthlyAttendance
            ] = await Promise.all([
                AttendanceLog.findOne({ where: { employee_id: employeeId, date: today } }),
                LeaveBalance.findOne({ where: { employee_id: employeeId } }),
                SalarySlip.findOne({ where: { employee_id: employeeId }, order: [['year', 'DESC'], ['month', 'DESC']] }),
                TaskLog.findAll({ where: { employee_id: employeeId, date: { [Op.gte]: startOfMonthDate } } }),
                AttendanceLog.findAll({
                    where: { employee_id: employeeId, date: { [Op.gte]: startOfMonthDate } },
                    order: [['date', 'ASC']]
                })
            ]);

            const completedTasks = tasksMTD.filter((t: any) => t.status === 'completed').length;
            const totalTasks = tasksMTD.length;
            const performanceScore = totalTasks > 0 ? ((completedTasks / totalTasks) * 10).toFixed(1) : 'N/A';

            const todayStatus = (todayLog?.status === 'present' || todayLog?.status === 'half_day') ? 'Checked In' : (todayLog?.status || 'Not Checked In');

            res.json({
                role: 'employee',
                kpis: {
                    todayStatus: todayStatus,
                    workedHours: todayLog?.work_hours || '00:00',
                    leaveBalance: leaveBalances,
                    lastSalary: lastSalary?.net_salary || 0,
                    performanceScore
                },
                charts: {
                    monthlyAttendance: monthlyAttendance.map(log => ({
                        date: log.date,
                        hours: log.work_hours ? parseFloat(log.work_hours.toString()) : 0
                    }))
                }
            });
        }
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
