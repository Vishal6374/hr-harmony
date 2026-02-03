import app from './app';
import { config } from './config';
import { testConnection, syncDatabase } from './config/database';
import './models'; // Import models to register associations
import { scheduleAutoAbsent } from './utils/autoAbsentScheduler';

const startServer = async () => {
    try {
        // Test database connection
        await testConnection();

        // Sync database: automatically alter tables in development, safe mode otherwise
        await syncDatabase(false, config.env === 'development');
        console.log('✅ Database sync completed successfully');

        // Check if DB needs seeding
        const User = (await import('./models/User')).default;
        const userCount = await User.count();
        if (userCount === 0) {
            console.log('🌱 User table is empty, running auto-seeder...');
            const { runMegaSeeder } = await import('./scripts/megaSeed');
            await runMegaSeeder();
        }

        // Initialize auto-absent scheduler
        scheduleAutoAbsent();

        // Start server
        app.listen(config.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Catalyr HRMS Backend Server                    ║
║                                                            ║
║   Environment: ${config.env.padEnd(43)}║
║   Port:        ${config.port.toString().padEnd(43)}║
║   Database:    ${config.database.name.padEnd(43)}║
║                                                            ║
║   API:         http://localhost:${config.port}/api${' '.repeat(19)}║
║   Health:      http://localhost:${config.port}/api/health${' '.repeat(12)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

startServer();
