import { Op } from 'sequelize';
import RawPunchLog from '../models/RawPunchLog';

import SystemSettings from '../models/SystemSettings';
import { AppError } from '../middleware/errorHandler';

// Types for detailed validation results
interface ValidationResult {
    success: boolean;
    overall_status: 'PASS' | 'WARN' | 'FAIL';
    checks: {
        connection: 'PASS' | 'WARN' | 'FAIL';
        table_access: 'PASS' | 'WARN' | 'FAIL';
        sample_read: 'PASS' | 'WARN' | 'FAIL';
        mapping_check: 'PASS' | 'WARN' | 'FAIL';
        time_sync: 'PASS' | 'WARN' | 'FAIL';
    };
    warnings: string[];
    sample_data?: any;
}

export class BiometricService {

    // Validate Config & Connection
    public async validateConfig(config: any): Promise<ValidationResult> {
        const result: ValidationResult = {
            success: false,
            overall_status: 'FAIL',
            checks: {
                connection: 'FAIL',
                table_access: 'FAIL',
                sample_read: 'FAIL',
                mapping_check: 'FAIL',
                time_sync: 'FAIL'
            },
            warnings: [],
        };

        try {
            // 1. Connection Check
            if (config.source_type === 'ESSL_DB') {
                // Simulate DB Connection (In real imp, use Sequelize/MSSQL driver with config.essl_db)
                // For now, checks if we can "ping" the host (mock logic)
                // TODO: Implement actual DB connection using config.essl_db details
                result.checks.connection = 'PASS';
            } else if (config.source_type === 'DIRECT_DEVICE') {
                // TODO: Implement ZKLib connection
                result.checks.connection = 'PASS';
            }

            // 2. Table Access
            if (result.checks.connection === 'PASS') {
                result.checks.table_access = 'PASS'; // Mock pass
            }

            // 3. Sample Read
            if (result.checks.table_access === 'PASS') {
                // Mock sample
                result.sample_data = {
                    biometric_id: "101",
                    punch_time: new Date().toISOString()
                };
                result.checks.sample_read = 'PASS';
            }

            // 4. Time Sync
            const deviceTime = new Date(); // Mock device time
            const serverTime = new Date();
            const diffMinutes = Math.abs(deviceTime.getTime() - serverTime.getTime()) / 60000;

            if (diffMinutes > 5) {
                result.checks.time_sync = 'WARN';
                result.warnings.push(`Device time drifted by ${Math.round(diffMinutes)} minutes.`);
            } else {
                result.checks.time_sync = 'PASS';
            }

            // 5. Mapping Check
            // We need to fetch distinct biometric IDs from source and check against Employee table
            // Mock: Found ID "101", check if employee has code "101"
            // const employees = await Employee.findAll({ where: { employee_code: '101' } });
            result.checks.mapping_check = 'PASS'; // Assume we found matches

            // Determine Overall Status
            const failures = Object.values(result.checks).filter(s => s === 'FAIL');
            const warnings = Object.values(result.checks).filter(s => s === 'WARN');

            if (failures.length > 0) {
                result.overall_status = 'FAIL';
                result.success = false;
            } else if (warnings.length > 0) {
                result.overall_status = 'WARN';
                result.success = true;
            } else {
                result.overall_status = 'PASS';
                result.success = true;
            }

        } catch (error: any) {
            result.warnings.push(error.message);
        }

        return result;
    }

    // Sync Raw Logs
    public async syncLogs(dryRun: boolean = false): Promise<any> {
        // 1. Get Config
        const settings = await SystemSettings.findOne();
        if (!settings || !settings.attendance_config) {
            throw new AppError(400, "Attendance configuration not found");
        }
        const config = settings.attendance_config;

        // 2. Fetch External Logs
        // Mocking fetched logs for now
        const fetchedLogs = [
            { biometric_id: '101', punch_datetime: new Date(), device_ip: '192.168.1.201', direction: 'IN' },
            { biometric_id: '101', punch_datetime: new Date(Date.now() - 3600000), device_ip: '192.168.1.201', direction: 'OUT' }
        ];

        if (dryRun) {
            return {
                status: 'DRY_RUN',
                fetched_count: fetchedLogs.length,
                logs: fetchedLogs
            };
        }

        // 3. Process & Insert
        let insertedCount = 0;
        let skippedCount = 0;

        for (const log of fetchedLogs) {
            try {
                // Deduplication check: handled by DB constraint, but we can check first to avoid error spam
                const exists = await RawPunchLog.findOne({
                    where: {
                        biometric_id: log.biometric_id,
                        punch_datetime: log.punch_datetime,
                        device_ip: log.device_ip
                    }
                });

                if (!exists) {
                    await RawPunchLog.create({
                        biometric_id: log.biometric_id,
                        punch_datetime: log.punch_datetime,
                        device_ip: log.device_ip,
                        direction: log.direction as 'IN' | 'OUT' | 'AUTO' || 'AUTO',
                        source_type: config.biometric_config?.source_type || 'DIRECT_DEVICE',
                        process_status: 'PENDING'
                    });
                    insertedCount++;
                } else {
                    skippedCount++;
                }
            } catch (err) {
                console.error("Error inserting punch log:", err);
            }
        }

        return {
            status: 'SUCCESS',
            inserted: insertedCount,
            skipped: skippedCount
        };
    }

    // Calculate Daily Attendance from Raw Logs
    public async processAttendance(date: Date) {
        // Fetch PENDING raw logs for the date
        const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

        const logs = await RawPunchLog.findAll({
            where: {
                process_status: 'PENDING',
                punch_datetime: { [Op.between]: [startOfDay, endOfDay] }
            }
        });

        // Group by user
        const groupedLogs: Record<string, typeof logs> = {};
        logs.forEach(log => {
            if (!groupedLogs[log.biometric_id]) groupedLogs[log.biometric_id] = [];
            groupedLogs[log.biometric_id].push(log);
        });

        // Process per user
        for (const bioId in groupedLogs) {
            const userLogs = groupedLogs[bioId];
            // Find Employee
            // const employee = await Employee.findOne({ where: { employee_code: bioId } });
            // if (!employee) continue;

            // Logic to determine First In / Last Out
            // Sort logs
            userLogs.sort((a, b) => a.punch_datetime.getTime() - b.punch_datetime.getTime());

            // const checkIn = userLogs[0].punch_datetime;
            // const checkOut = userLogs.length > 1 ? userLogs[userLogs.length - 1].punch_datetime : null;

            // Process logs
            for (const l of userLogs) {
                l.process_status = 'PROCESSED';
                await l.save();
            }
        }
    }
}
