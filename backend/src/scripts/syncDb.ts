import { syncDatabase, testConnection } from '../config/database';
import '../models'; // Import models to register associations

const sync = async () => {
    try {
        await testConnection();

        console.log('⚠️  This will synchronize the database schema.');
        console.log('⚠️  Use with caution in production!');

        // Set to true to drop all tables and recreate
        const force = process.argv.includes('--force');
        // Set to true to alter existing tables
        const alter = process.argv.includes('--alter');

        if (force) {
            console.log('🔥 Force mode: Dropping all tables...');
        } else if (alter) {
            console.log('⚠️  Alter mode: Updating table schemas...');
        }

        await syncDatabase(force, alter);

        console.log('✅ Database synchronized successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database synchronization failed:', error);
        process.exit(1);
    }
};

sync();
