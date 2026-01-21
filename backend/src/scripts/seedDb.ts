import { testConnection, syncDatabase, sequelize } from '../config/database';
import User from '../models/User';
import Department from '../models/Department';
import Designation from '../models/Designation';
import LeaveBalance from '../models/LeaveBalance';
import Holiday from '../models/Holiday';
import Policy from '../models/Policy';

const seed = async () => {
    try {
        await testConnection();

        // Disable foreign key checks to allow table drops
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await syncDatabase(true); // Force recreate tables
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('🌱 Seeding database...');

        // Create departments
        const departments = await Department.bulkCreate([
            { name: 'Human Resources', code: 'HR', employee_count: 0, is_active: true },
            { name: 'Engineering', code: 'ENG', employee_count: 0, is_active: true },
            { name: 'Sales', code: 'SLS', employee_count: 0, is_active: true },
            { name: 'Marketing', code: 'MKT', employee_count: 0, is_active: true },
            { name: 'Finance', code: 'FIN', employee_count: 0, is_active: true },
        ]);

        console.log('✅ Departments created');

        // Create designations
        const designations = await Designation.bulkCreate([
            { name: 'HR Manager', department_id: departments[0].id, level: 1, salary_range_min: 80000, salary_range_max: 120000, is_active: true },
            { name: 'HR Executive', department_id: departments[0].id, level: 2, salary_range_min: 40000, salary_range_max: 60000, is_active: true },
            { name: 'Engineering Manager', department_id: departments[1].id, level: 1, salary_range_min: 140000, salary_range_max: 200000, is_active: true },
            { name: 'Senior Software Engineer', department_id: departments[1].id, level: 2, salary_range_min: 100000, salary_range_max: 150000, is_active: true },
            { name: 'Software Engineer', department_id: departments[1].id, level: 3, salary_range_min: 60000, salary_range_max: 100000, is_active: true },
            { name: 'Sales Manager', department_id: departments[2].id, level: 1, salary_range_min: 90000, salary_range_max: 130000, is_active: true },
        ]);

        console.log('✅ Designations created');

        // Create HR user
        const hrUser = await User.create({
            employee_id: 'EMP2026-0001',
            name: 'Sarah Johnson',
            email: 'hr@company.com',
            password: 'hr123',
            phone: '+1 555-0101',
            date_of_birth: new Date('1988-03-15'),
            date_of_joining: new Date('2020-01-15'),
            department_id: departments[0].id,
            designation_id: designations[0].id,
            salary: 95000,
            role: 'hr',
            status: 'active',
            address: '123 Main St, New York, NY 10001',
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        });

        console.log('✅ HR user created');

        // Create sample employees
        const employees = await User.bulkCreate([
            {
                employee_id: 'EMP2026-0002',
                name: 'John Smith',
                email: 'john.smith@company.com',
                password: 'emp123',
                phone: '+1 555-0102',
                date_of_birth: new Date('1992-07-22'),
                date_of_joining: new Date('2022-03-01'),
                department_id: departments[1].id,
                designation_id: designations[3].id,
                salary: 120000,
                role: 'employee',
                status: 'active',
                address: '456 Oak Ave, San Francisco, CA 94102',
                avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            },
            {
                employee_id: 'EMP2026-0003',
                name: 'Emily Chen',
                email: 'emily.chen@company.com',
                password: 'emp123',
                phone: '+1 555-0103',
                date_of_birth: new Date('1995-11-08'),
                date_of_joining: new Date('2023-06-15'),
                department_id: departments[1].id,
                designation_id: designations[4].id,
                salary: 85000,
                role: 'employee',
                status: 'active',
                address: '789 Pine Rd, Seattle, WA 98101',
                avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
            },
            {
                employee_id: 'EMP2026-0004',
                name: 'Michael Brown',
                email: 'michael.brown@company.com',
                password: 'emp123',
                phone: '+1 555-0104',
                date_of_birth: new Date('1985-04-20'),
                date_of_joining: new Date('2019-09-01'),
                department_id: departments[2].id,
                designation_id: designations[5].id,
                salary: 110000,
                role: 'employee',
                status: 'active',
                address: '321 Elm St, Chicago, IL 60601',
                avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            },
        ]);

        console.log('✅ Sample employees created');

        // Create leave balances for all employees
        const currentYear = new Date().getFullYear();
        const allEmployees = [hrUser, ...employees];

        const leaveBalances = [];
        for (const emp of allEmployees) {
            leaveBalances.push(
                { employee_id: emp.id, leave_type: 'casual', total: 12, used: 0, remaining: 12, year: currentYear },
                { employee_id: emp.id, leave_type: 'sick', total: 10, used: 0, remaining: 10, year: currentYear },
                { employee_id: emp.id, leave_type: 'earned', total: 15, used: 0, remaining: 15, year: currentYear }
            );
        }

        await LeaveBalance.bulkCreate(leaveBalances as any[]);
        console.log('✅ Leave balances created');

        // Create holidays
        await Holiday.bulkCreate([
            { name: "New Year's Day", date: new Date('2026-01-01'), type: 'national', is_optional: false, year: 2026 },
            { name: 'Republic Day', date: new Date('2026-01-26'), type: 'national', is_optional: false, year: 2026 },
            { name: 'Independence Day', date: new Date('2026-08-15'), type: 'national', is_optional: false, year: 2026 },
            { name: 'Gandhi Jayanti', date: new Date('2026-10-02'), type: 'national', is_optional: false, year: 2026 },
            { name: 'Christmas Day', date: new Date('2026-12-25'), type: 'national', is_optional: false, year: 2026 },
        ]);

        console.log('✅ Holidays created');

        // Create sample policies
        await Policy.bulkCreate([
            {
                title: 'Employee Handbook 2026',
                category: 'General',
                version: '3.0',
                document_url: '/policies/handbook.pdf',
                is_active: true,
                effective_date: new Date('2026-01-01'),
            },
            {
                title: 'Leave Policy',
                category: 'HR',
                version: '2.1',
                document_url: '/policies/leave.pdf',
                is_active: true,
                effective_date: new Date('2026-01-01'),
            },
            {
                title: 'Code of Conduct',
                category: 'General',
                version: '1.5',
                document_url: '/policies/code-of-conduct.pdf',
                is_active: true,
                effective_date: new Date('2026-01-01'),
            },
        ]);

        console.log('✅ Policies created');

        console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ✅ Database seeded successfully!                        ║
║                                                            ║
║   Login Credentials:                                       ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                            ║
║   HR Account:                                              ║
║   Email:    hr@company.com                                 ║
║   Password: hr123                                          ║
║                                                            ║
║   Employee Account:                                        ║
║   Email:    john.smith@company.com                         ║
║   Password: emp123                                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    }
};

seed();
