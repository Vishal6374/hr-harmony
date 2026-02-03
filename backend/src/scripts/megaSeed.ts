import { sequelize, testConnection } from '../config/database';
import {
    User,
    Department,
    Designation,
    AttendanceLog,
    AttendanceSettings,
    LeaveRequest,
    LeaveBalance,
    LeaveLimit,
    PayrollBatch,
    SalarySlip,
    Complaint,
    Policy,
    Holiday,
    TaskLog,
    Meeting,
    LeaveType,
    PayrollSettings,
    SystemSettings,
    SalaryStructure,
    PayGroup,
    TaxSlab
} from '../models';
import { subDays } from 'date-fns';

const IS_CLEAN_MODE = process.argv.includes('--clean');

const seedTable = async (model: any, name: string, data: any[]) => {
    try {
        if (IS_CLEAN_MODE) {
            console.log(`🧹 Truncating ${name}...`);
            await model.destroy({ where: {}, truncate: true, cascade: false });
        }

        const count = await model.count();
        if (count >= data.length && !IS_CLEAN_MODE) { // Check against data length not hardcoded 10
            console.log(`ℹ️  Skipping ${name}: Already has ${count} records.`);
            return;
        }

        const itemsToCreate = IS_CLEAN_MODE ? data : data.slice(0, Math.max(0, data.length - count));
        if (itemsToCreate.length > 0) {
            await model.bulkCreate(itemsToCreate, { ignoreDuplicates: true, individualHooks: true });
            console.log(`✅ ${name} populated with ${itemsToCreate.length} records.`);
        }
    } catch (error: any) {
        console.error(`❌ FAILED seeding ${name}:`, error.message);
    }
};

export const runMegaSeeder = async () => {
    console.log('🚀 Running Humanized Mega Seeder v2.2 (Fixed Validation)...');

    if (IS_CLEAN_MODE) await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Core Config
    await seedTable(SystemSettings, 'SystemSettings', [
        { key: 'COMPANY_NAME', value: 'Catalyr HRMS', category: 'general' },
        { key: 'COMPANY_EMAIL', value: 'contact@catalyr.com', category: 'general' },
        { key: 'CURRENCY', value: 'INR', category: 'finance' },
        { key: 'TIMEZONE', value: 'Asia/Kolkata', category: 'general' },
        { key: 'FISCAL_MONTH', value: '4', category: 'finance' },
        { key: 'ALLOW_REMOTE', value: 'true', category: 'hr' },
        { key: 'MAINTENANCE_MODE', value: 'false', category: 'system' },
        { key: 'SUPPORT_PHONE', value: '+91 9876543210', category: 'general' },
        { key: 'MAX_FILE_SIZE', value: '10485760', category: 'system' },
        { key: 'NOTIFY_LEAVE', value: 'true', category: 'hr' },
    ]);

    await seedTable(PayrollSettings, 'PayrollSettings', [{
        default_pf_percentage: 12, default_esi_percentage: 0.75, default_absent_deduction_type: 'percentage', default_absent_deduction_value: 3.33
    }]);

    await seedTable(AttendanceSettings, 'AttendanceSettings', [{
        standard_work_hours: 8, half_day_threshold: 4, allow_self_clock_in: true, auto_half_day_time: '19:00'
    }]);

    await seedTable(LeaveLimit, 'LeaveLimit', [{
        casual_leave: 12, sick_leave: 10, earned_leave: 15, maternity_leave: 90, paternity_leave: 10
    }]);

    await seedTable(LeaveType, 'LeaveType', [
        { name: 'Casual Leave', code: 'CL', is_paid: true, default_days_per_year: 12, status: 'active' },
        { name: 'Sick Leave', code: 'SL', is_paid: true, default_days_per_year: 10, status: 'active' },
        { name: 'Earned Leave', code: 'EL', is_paid: true, default_days_per_year: 15, status: 'active' },
        { name: 'Maternity Leave', code: 'ML', is_paid: true, default_days_per_year: 90, status: 'active' },
        { name: 'Loss of Pay', code: 'LOP', is_paid: false, default_days_per_year: 0, status: 'active' },
        { name: 'Paternity Leave', code: 'PL', is_paid: true, default_days_per_year: 10, status: 'active' },
        { name: 'Marriage Leave', code: 'MAR', is_paid: true, default_days_per_year: 5, status: 'active' },
        { name: 'Study Leave', code: 'STU', is_paid: false, default_days_per_year: 30, status: 'active' },
        { name: 'Bereavement', code: 'BER', is_paid: true, default_days_per_year: 3, status: 'active' },
        { name: 'Comp Off', code: 'CO', is_paid: true, default_days_per_year: 5, status: 'active' },
    ]);

    // Fixed TaxSlab structure: 1 record per regime with JSON slabs
    await seedTable(TaxSlab, 'TaxSlab', [
        {
            regime: 'new',
            financial_year: '2025-2026',
            tax_rate: 0, // Base/dummy rate since slabs hold the logic
            slabs: [
                { min: 0, max: 300000, rate: 0 },
                { min: 300001, max: 600000, rate: 5 },
                { min: 600001, max: 900000, rate: 10 },
                { min: 900001, max: 1200000, rate: 15 },
                { min: 1200001, max: 1500000, rate: 20 },
                { min: 1500001, max: null, rate: 30 }
            ]
        },
        {
            regime: 'old',
            financial_year: '2025-2026',
            tax_rate: 0,
            slabs: [
                { min: 0, max: 250000, rate: 0 },
                { min: 250001, max: 500000, rate: 5 },
                { min: 500001, max: 1000000, rate: 20 },
                { min: 1000001, max: null, rate: 30 }
            ]
        }
    ]);

    // 2. Organization Structure
    await seedTable(Department, 'Department', [
        { name: 'Management', code: 'MGMT', is_active: true },
        { name: 'Human Resources', code: 'HR', is_active: true },
        { name: 'Engineering', code: 'ENG', is_active: true },
        { name: 'Finance', code: 'FIN', is_active: true },
        { name: 'Marketing', code: 'MKTG', is_active: true },
        { name: 'Sales', code: 'SALE', is_active: true },
        { name: 'Product', code: 'PROD', is_active: true },
        { name: 'Design', code: 'DSGN', is_active: true },
        { name: 'Customer Support', code: 'SUPP', is_active: true },
        { name: 'Operations', code: 'OPS', is_active: true },
    ]);

    const departments = await Department.findAll();
    await seedTable(Designation, 'Designation', departments.flatMap(d => [
        { name: `${d.name} Lead`, department_id: d.id, level: 1 },
        { name: `Senior ${d.name} Analyst`, department_id: d.id, level: 2 },
    ]));

    const designations = await Designation.findAll();

    // 3. User Accounts (Exactly 10 with realistic names)
    if (IS_CLEAN_MODE) {
        console.log('🧹 Truncating Users...');
        await User.destroy({ where: {}, truncate: true });
    }

    const usersCount = await User.count();
    if (usersCount === 0 || IS_CLEAN_MODE) {
        const users = [
            {
                employee_id: 'CAT001',
                name: 'System Admin',
                email: 'admin@catalyr.com',
                password: 'admin123',
                role: 'admin',
                date_of_joining: subDays(new Date(), 500),
                salary: 200000,
                department_id: departments.find(d => d.code === 'MGMT')?.id,
                designation_id: designations.find(des => des.name.includes('Lead'))?.id
            },
            {
                employee_id: 'CAT002',
                name: 'Sarah HR',
                email: 'hr@catalyr.com',
                password: 'hr123',
                role: 'hr',
                date_of_joining: subDays(new Date(), 400),
                salary: 95000,
                department_id: departments.find(d => d.code === 'HR')?.id,
                designation_id: designations.find(des => des.name.includes('HR Lead'))?.id
            },
            {
                employee_id: 'CAT003',
                name: 'John Smith',
                email: 'john.smith@catalyr.com',
                password: 'emp123',
                role: 'employee',
                date_of_joining: subDays(new Date(), 300),
                salary: 85000,
                department_id: departments.find(d => d.code === 'ENG')?.id,
                designation_id: designations.find(des => des.name.includes('Engineering Lead'))?.id
            },
            {
                employee_id: 'CAT004',
                name: 'Emily Davis',
                email: 'emily.davis@catalyr.com',
                password: 'password123',
                role: 'employee',
                date_of_joining: subDays(new Date(), 250),
                salary: 75000,
                department_id: departments.find(d => d.code === 'DSGN')?.id,
                designation_id: designations.find(des => des.name.includes('Design Lead'))?.id
            },
            {
                employee_id: 'CAT005',
                name: 'Michael Chen',
                email: 'michael.chen@catalyr.com',
                password: 'password123',
                role: 'employee',
                date_of_joining: subDays(new Date(), 200),
                salary: 120000,
                department_id: departments.find(d => d.code === 'ENG')?.id,
                designation_id: designations.find(des => des.name.includes('Senior Engineering Analyst'))?.id
            },
            {
                employee_id: 'CAT006',
                name: 'Sarah Wilson',
                email: 'sarah.wilson@catalyr.com',
                password: 'password123',
                role: 'employee',
                date_of_joining: subDays(new Date(), 180),
                salary: 65000,
                department_id: departments.find(d => d.code === 'MKTG')?.id,
                designation_id: designations.find(des => des.name.includes('Marketing Lead'))?.id
            },
            {
                employee_id: 'CAT007',
                name: 'Robert Taylor',
                email: 'robert.taylor@catalyr.com',
                password: 'password123',
                role: 'employee',
                date_of_joining: subDays(new Date(), 150),
                salary: 70000,
                department_id: departments.find(d => d.code === 'FIN')?.id,
                designation_id: designations.find(des => des.name.includes('Finance Lead'))?.id
            },
            {
                employee_id: 'CAT008',
                name: 'Jessica Brown',
                email: 'jessica.brown@catalyr.com',
                password: 'password123',
                role: 'employee',
                date_of_joining: subDays(new Date(), 120),
                salary: 55000,
                department_id: departments.find(d => d.code === 'SUPP')?.id,
                designation_id: designations.find(des => des.name.includes('Support Lead'))?.id
            },
            {
                employee_id: 'CAT009',
                name: 'David Miller',
                email: 'david.miller@catalyr.com',
                password: 'password123',
                role: 'employee',
                date_of_joining: subDays(new Date(), 100),
                salary: 95000,
                department_id: departments.find(d => d.code === 'PROD')?.id,
                designation_id: designations.find(des => des.name.includes('Product Lead'))?.id
            },
            {
                employee_id: 'CAT010',
                name: 'Lisa Anderson',
                email: 'lisa.anderson@catalyr.com',
                password: 'password123',
                role: 'employee',
                date_of_joining: subDays(new Date(), 60),
                salary: 60000,
                department_id: departments.find(d => d.code === 'SALE')?.id,
                designation_id: designations.find(des => des.name.includes('Sales Lead'))?.id
            },
        ];
        await User.bulkCreate(users as any[], { individualHooks: true });
        console.log('✅ 10 realistic users created.');
    }
    const allUsers = await User.findAll();

    // 4. Activity Logs
    const today = new Date();
    await seedTable(AttendanceLog, 'AttendanceLog', allUsers.flatMap(u =>
        Array.from({ length: 10 }).map((_, i) => ({
            employee_id: u.id,
            date: subDays(today, i),
            status: 'present',
            work_hours: 8
        }))
    ));

    await seedTable(LeaveBalance, 'LeaveBalance', allUsers.map(u => ({
        employee_id: u.id, leave_type: 'casual', total: 12, used: 2, remaining: 10, year: 2026
    })));

    // Fixed LeaveRequest: Added 'days'
    await seedTable(LeaveRequest, 'LeaveRequest', Array.from({ length: 10 }).map((_, i) => ({
        employee_id: allUsers[i % allUsers.length].id,
        leave_type: 'casual',
        start_date: today,
        end_date: today,
        days: 1, // REQUIRED
        status: 'approved',
        reason: 'Personal errands'
    })));

    // Fixed TaskLog: Added 'description'
    await seedTable(TaskLog, 'TaskLog', Array.from({ length: 10 }).map((_, i) => ({
        employee_id: allUsers[i % allUsers.length].id,
        date: today,
        task_name: ['Module Revamp', 'Bug Fixing', 'Daily Standup', 'Client Call', 'Documentation', 'Code Review', 'Testing', 'Deployment', 'UX Audit', 'Meeting'][i],
        description: 'Completed task with standard efficiency.', // REQUIRED
        status: 'completed',
        hours_spent: 2.5
    })));

    // 5. Finance
    await seedTable(SalaryStructure, 'SalaryStructure', [
        { name: 'Executive Package', components: { basic: { percentage: 50 }, hra: { percentage: 20 }, da: { percentage: 10 } }, deduction_rules: { pf: { percentage: 12 }, esi: { percentage: 0.75 }, professional_tax: { amount: 200 } } },
        { name: 'Standard Staff', components: { basic: { percentage: 40 }, hra: { percentage: 20 }, da: { percentage: 15 } }, deduction_rules: { pf: { percentage: 12 }, esi: { percentage: 0.75 }, professional_tax: { amount: 200 } } },
        { name: 'Contractor', components: { basic: { percentage: 80 }, hra: { percentage: 0 }, da: { percentage: 0 } }, deduction_rules: { pf: { percentage: 0 }, esi: { percentage: 0 }, professional_tax: { amount: 200 } } },
        { name: 'Probationary', components: { basic: { percentage: 45 }, hra: { percentage: 15 }, da: { percentage: 10 } }, deduction_rules: { pf: { percentage: 12 }, esi: { percentage: 0.75 }, professional_tax: { amount: 200 } } },
        { name: 'Technical Lead', components: { basic: { percentage: 55 }, hra: { percentage: 25 }, da: { percentage: 5 } }, deduction_rules: { pf: { percentage: 12 }, esi: { percentage: 0.75 }, professional_tax: { amount: 200 } } },
        { name: 'Sales Intensive', components: { basic: { percentage: 30 }, hra: { percentage: 20 }, da: { percentage: 10 } }, deduction_rules: { pf: { percentage: 12 }, esi: { percentage: 0.75 }, professional_tax: { amount: 200 } } },
        { name: 'Internship', components: { basic: { percentage: 100 }, hra: { percentage: 0 }, da: { percentage: 0 } }, deduction_rules: { pf: { percentage: 0 }, esi: { percentage: 0 }, professional_tax: { amount: 0 } } },
        { name: 'Senior Management', components: { basic: { percentage: 60 }, hra: { percentage: 30 }, da: { percentage: 0 } }, deduction_rules: { pf: { percentage: 12 }, esi: { percentage: 0.75 }, professional_tax: { amount: 200 } } },
        { name: 'Junior Support', components: { basic: { percentage: 40 }, hra: { percentage: 10 }, da: { percentage: 20 } }, deduction_rules: { pf: { percentage: 12 }, esi: { percentage: 0.75 }, professional_tax: { amount: 200 } } },
        { name: 'Special Project', components: { basic: { percentage: 50 }, hra: { percentage: 50 }, da: { percentage: 0 } }, deduction_rules: { pf: { percentage: 12 }, esi: { percentage: 0.75 }, professional_tax: { amount: 200 } } },
    ]);
    const structures = await SalaryStructure.findAll();

    await seedTable(PayGroup, 'PayGroup', structures.map((s) => ({
        name: `Group ${s.name}`,
        salary_structure_id: s.id
    })));

    await seedTable(PayrollBatch, 'PayrollBatch', Array.from({ length: 10 }).map((_, i) => ({
        month: ((today.getMonth() - i + 12) % 12) + 1,
        year: today.getFullYear(),
        status: 'paid',
        processed_by: allUsers[0].id
    })));
    const batches = await PayrollBatch.findAll();

    await seedTable(SalarySlip, 'SalarySlip', batches.flatMap(b =>
        allUsers.slice(0, 3).map(u => ({
            batch_id: b.id,
            employee_id: u.id,
            month: b.month,
            year: b.year,
            basic_salary: 25000,
            gross_salary: 50000,
            net_salary: 45000,
            status: 'paid',
            generated_at: b.created_at || today,
            deductions: { pf: 3000, tax: 2000, loss_of_pay: 0, other: 0, esi: 0 }
        }))
    ));

    // 6. Documents & Social
    // Fixed Policy: Added category, version, document_url, effective_date
    await seedTable(Policy, 'Policy', [
        { title: 'Work From Home Policy', content: 'Guidelines for remote work...', is_published: true, category: 'HR', version: '1.0', document_url: 'docs/wfh.pdf', effective_date: '2025-01-01' },
        { title: 'Code of Conduct', content: 'Ethics and behavioral standards...', is_published: true, category: 'HR', version: '2.0', document_url: 'docs/coc.pdf', effective_date: '2025-01-01' },
        { title: 'Travel Policy', content: 'Expense and reimbursement rules for travel...', is_published: true, category: 'Finance', version: '1.2', document_url: 'docs/travel.pdf', effective_date: '2025-01-01' },
        { title: 'Leave Policy', content: 'Categorization and encashment of leaves...', is_published: true, category: 'HR', version: '1.5', document_url: 'docs/leave.pdf', effective_date: '2025-01-01' },
        { title: 'IT Security Policy', content: 'Data protection and device usage rules...', is_published: true, category: 'IT', version: '3.0', document_url: 'docs/security.pdf', effective_date: '2025-01-01' },
        { title: 'POSH Policy', content: 'Prevention of sexual harassment guidelines...', is_published: true, category: 'Legal', version: '1.0', document_url: 'docs/posh.pdf', effective_date: '2025-01-01' },
        { title: 'Performance Appraisal', content: 'Evaluation cycle and promotion criteria...', is_published: true, category: 'HR', version: '2.1', document_url: 'docs/appraisal.pdf', effective_date: '2025-01-01' },
        { title: 'Overtime Policy', content: 'Rules for extra working hours compensation...', is_published: true, category: 'HR', version: '1.1', document_url: 'docs/overtime.pdf', effective_date: '2025-01-01' },
        { title: 'Health & Safety', content: 'Workplace safety and medical benefits...', is_published: true, category: 'Admin', version: '1.0', document_url: 'docs/safety.pdf', effective_date: '2025-01-01' },
        { title: 'Data Privacy Policy', content: 'Employee personal data handling...', is_published: true, category: 'IT', version: '1.3', document_url: 'docs/privacy.pdf', effective_date: '2025-01-01' },
    ]);

    await seedTable(Holiday, 'Holiday', [
        { name: 'Republic Day', date: new Date(2026, 0, 26), year: 2026, type: 'national' },
        { name: 'Holi', date: new Date(2026, 2, 5), year: 2026, type: 'regional' },
        { name: 'Maharashtra Day', date: new Date(2026, 4, 1), year: 2026, type: 'regional' },
        { name: 'Labor Day', date: new Date(2026, 4, 1), year: 2026, type: 'national' },
        { name: 'Eid-ul-Fitr', date: new Date(2026, 2, 31), year: 2026, type: 'national' },
        { name: 'Independence Day', date: new Date(2026, 7, 15), year: 2026, type: 'national' },
        { name: 'Ganesh Chaturthi', date: new Date(2026, 8, 17), year: 2026, type: 'regional' },
        { name: 'Gandhi Jayanti', date: new Date(2026, 9, 2), year: 2026, type: 'national' },
        { name: 'Diwali', date: new Date(2026, 9, 21), year: 2026, type: 'national' },
        { name: 'Christmas', date: new Date(2026, 11, 25), year: 2026, type: 'national' },
    ]);

    // Fixed Meeting: Added description and stringified attendees
    await seedTable(Meeting, 'Meeting', [
        { title: 'Weekly Townhall', description: 'All hands meeting.', date: today, start_time: '10:00', end_time: '11:00', created_by: allUsers[0].id, type: 'physical', attendees: JSON.stringify([allUsers[1].id, allUsers[2].id]) },
        { title: 'Tech Architecture Review', description: 'Reviewing the new microservices architecture.', date: today, start_time: '14:00', end_time: '15:30', created_by: allUsers[0].id, type: 'virtual', attendees: JSON.stringify([allUsers[3].id]) },
        { title: 'Product Sprint Planning', description: 'Planning for next sprint.', date: subDays(today, 1), start_time: '11:00', end_time: '12:30', created_by: allUsers[1].id, type: 'physical', attendees: JSON.stringify([]) },
        { title: 'HR Policy Briefing', description: 'Updates on new leave policies.', date: subDays(today, 2), start_time: '16:00', end_time: '17:00', created_by: allUsers[1].id, type: 'virtual', attendees: JSON.stringify([]) },
        { title: 'Marketing Strategy Sync', description: 'Q3 Marketing goals.', date: subDays(today, 3), start_time: '10:30', end_time: '11:30', created_by: allUsers[0].id, type: 'physical', attendees: JSON.stringify([]) },
        { title: 'One-on-One Michael', description: 'Monthly connect.', date: subDays(today, 4), start_time: '15:00', end_time: '15:30', created_by: allUsers[0].id, type: 'virtual', attendees: JSON.stringify([]) },
        { title: 'Quarterly Budget Review', description: 'Finance review with heads.', date: subDays(today, 5), start_time: '12:00', end_time: '13:00', created_by: allUsers[0].id, type: 'physical', attendees: JSON.stringify([]) },
        { title: 'Customer Feedback Session', description: 'Reviewing recent client feedback.', date: subDays(today, 6), start_time: '17:00', end_time: '18:00', created_by: allUsers[1].id, type: 'virtual', attendees: JSON.stringify([]) },
        { title: 'Security Audit Kickoff', description: 'Initial compliance check.', date: subDays(today, 7), start_time: '14:00', end_time: '15:00', created_by: allUsers[0].id, type: 'physical', attendees: JSON.stringify([]) },
        { title: 'Happy Hour Social', description: 'Team bonding event.', date: subDays(today, 8), start_time: '18:00', end_time: '19:00', created_by: allUsers[1].id, type: 'physical', attendees: JSON.stringify([]) },
    ]);

    // Fixed Complaint: Added category, Corrected status
    await seedTable(Complaint, 'Complaint', [
        { employee_id: allUsers[2].id, subject: 'AC issue in Block A', description: 'The AC is leaking...', status: 'closed', category: 'Maintenance', priority: 'medium' },
        { employee_id: allUsers[3].id, subject: 'Laptop lag', description: 'Development tools are very slow...', status: 'open', category: 'IT', priority: 'high' },
        { employee_id: allUsers[4].id, subject: 'Cafeteria cleanliness', description: 'Tables are not cleaned regularly...', status: 'closed', category: 'Admin', priority: 'low' },
        { employee_id: allUsers[5].id, subject: 'Access card issue', description: 'Entry gate is not recognizing card...', status: 'closed', category: 'Security', priority: 'high' },
        { employee_id: allUsers[6].id, subject: 'Payroll query', description: 'TDS seems higher this month...', status: 'open', category: 'Finance', priority: 'medium' },
        { employee_id: allUsers[7].id, subject: 'Internet speed', description: 'Fluctuating speeds in evening...', status: 'closed', category: 'IT', priority: 'medium' },
        { employee_id: allUsers[8].id, subject: 'Seating upgrade', description: 'Requesting ergonomic chair...', status: 'open', category: 'Admin', priority: 'low' },
        { employee_id: allUsers[9].id, subject: 'Profile update', description: 'Please update my last name...', status: 'closed', category: 'HR', priority: 'low' },
        { employee_id: allUsers[2].id, subject: 'Parking slot', description: 'Requesting reserved slot...', status: 'open', category: 'Admin', priority: 'medium' },
        { employee_id: allUsers[3].id, subject: 'Software license', description: 'Need JetBrains license...', status: 'closed', category: 'IT', priority: 'high' },
    ]);

    if (IS_CLEAN_MODE) await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✨ Humanized Mega Seeder completed!');
};

if (require.main === module) {
    (async () => {
        try {
            await testConnection();
            await runMegaSeeder();
            process.exit(0);
        } catch (err) {
            console.error('🔥 FATAL ERROR:', err);
            process.exit(1);
        }
    })();
}
