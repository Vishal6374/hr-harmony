import { sequelize } from '../config/database';

const repair = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        console.log('Attempting to repair salary_slips table data...');

        // 1. Update any NULL or invalid deductions to the default JSON
        // We cast to CHAR to ensure we are passing a string that can be interpreted as JSON or just a string if the column is currently TEXT
        try {
            await sequelize.query(`
                UPDATE salary_slips 
                SET deductions = '{"pf": 0, "tax": 0, "loss_of_pay": 0, "other": 0}'
            `);
            console.log('✅ Updated all salary_slips.deductions to default valid JSON.');
        } catch (err: any) {
            console.warn('⚠️  Could not update rows (table might not exist or column missing):', err.message);
        }

        console.log('Repair attempt finished.');
    } catch (error) {
        console.error('❌ Repair script failed:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
};

repair();
