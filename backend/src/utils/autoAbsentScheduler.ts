import cron from 'node-cron';
import AttendanceLog from '../models/AttendanceLog';
import User from '../models/User';
import Holiday from '../models/Holiday';
import LeaveRequest from '../models/LeaveRequest';
import { Op } from 'sequelize';

/**
 * Auto-mark employees as absent if they haven't clocked in by 5 PM
 * Runs every day at 5:00 PM (17:00)
 */
export const scheduleAutoAbsent = () => {
    // Run at 5:00 PM every day
    cron.schedule('0 17 * * *', async () => {
        try {
            console.log('Running auto-absent scheduler at 5:00 PM...');

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Check if today is Sunday (0)
            if (today.getDay() === 0) {
                console.log('Today is Sunday (Week Off), skipping auto-absent check.');
                return;
            }

            // 2. Check if today is a Holiday
            const holiday = await Holiday.findOne({
                where: {
                    date: today,
                },
            });

            if (holiday) {
                console.log(`Today is a holiday (${holiday.name}), skipping auto-absent check.`);
                return;
            }

            // Get all active employees
            const activeEmployees = await User.findAll({
                where: {
                    role: { [Op.ne]: 'hr' }, // Exclude HR
                    status: 'active',
                },
            });

            let markedAbsentCount = 0;

            for (const employee of activeEmployees) {
                // Check if employee has attendance record for today
                const existingAttendance = await AttendanceLog.findOne({
                    where: {
                        employee_id: employee.id,
                        date: today,
                    },
                });

                if (existingAttendance) continue;

                // 3. Check if employee is on Approved Leave
                const leaveRequest = await LeaveRequest.findOne({
                    where: {
                        employee_id: employee.id,
                        status: 'approved',
                        start_date: { [Op.lte]: today },
                        end_date: { [Op.gte]: today },
                    },
                });

                if (leaveRequest) {
                    // Create an 'on_leave' attendance record instead of skipping?
                    // Usually leave system handles this, but attendance log might be needed.
                    // For now, let's just create 'on_leave' record if not exists to be safe and consistent
                    await AttendanceLog.create({
                        employee_id: employee.id,
                        date: today,
                        status: 'on_leave',
                        check_in: undefined,
                        check_out: undefined,
                    });
                    console.log(`Marked ${employee.name} as on_leave (Approved Leave)`);
                    continue;
                }

                // If no record, no holiday, no Sunday, no leave -> Mark Absent
                await AttendanceLog.create({
                    employee_id: employee.id,
                    date: today,
                    status: 'absent',
                    check_in: undefined,
                    check_out: undefined,
                });
                markedAbsentCount++;
                console.log(`Marked ${employee.name} (${employee.employee_id}) as absent`);
            }

            console.log(`Auto-absent completed: ${markedAbsentCount} employees marked absent`);
        } catch (error) {
            console.error('Error in auto-absent scheduler:', error);
        }
    });

    console.log('Auto-absent scheduler initialized (runs daily at 5:00 PM)');
};
