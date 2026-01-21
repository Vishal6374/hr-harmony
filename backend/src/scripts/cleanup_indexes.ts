import { sequelize } from '../config/database';

const cleanupIndexes = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const [indexes]: any[] = await sequelize.query('SHOW INDEX FROM users');
        const indexNames = indexes.map((idx: any) => idx.Key_name);

        // Identify likely duplicates (ending in _2, _3, etc., or specific ones we know are issues)
        // We will keep 'PRIMARY', 'employee_id', 'email', 'department_id', 'designation_id', 'reporting_manager_id'
        // And drop anything else that looks like a duplicate.

        const duplicates = indexNames.filter((name: string) => {
            if (name === 'PRIMARY') return false;
            // Keep the "base" expected indexes if they exist (though Sequelize might name them differently)
            // Common sequelize naming: table_col_foreign_idx

            // We want to drop indexes that end in specific patterns or are just excessive.
            // Let's drop ALL indexes that are not PRIMARY, and let Sequelize recreate what it needs?
            // That might fail due to FK constraints.

            // Safer: Drop indexes ending in _\d+ (e.g. _2, _3)
            return /_\d+$/.test(name) || name.includes('users_ibfk'); // often auto-named constraints
        });

        // Filter unique names to avoid trying to drop same index twice if multiple columns
        const uniqueDuplicates = [...new Set(duplicates)];

        console.log('Found potential duplicate indexes:', uniqueDuplicates);

        if (uniqueDuplicates.length === 0) {
            console.log('No obvious duplicate indexes found.');
        } else {
            for (const indexName of uniqueDuplicates) {
                try {
                    console.log(`Dropping index: ${indexName}`);
                    await sequelize.query(`DROP INDEX \`${indexName}\` ON users`);
                } catch (err: any) {
                    console.error(`Failed to drop index ${indexName}:`, err.message);
                    // Continue even if fail (e.g., if needed by FK)
                }
            }
        }

        // Also, specifically check for 'employee_id' repeated indexes if they don't match the regex
        // Sometimes they pile up as 'employee_id', 'employee_id_unique', etc.
        // We'll trust the /_\d+$/ regex for now as it captures the most common accumulation.

        console.log('Cleanup finished.');
        process.exit(0);
    } catch (error) {
        console.error('Error cleaning indexes:', error);
        process.exit(1);
    }
};

cleanupIndexes();
