import app from './app';
import { config } from './config';
import { testConnection, syncDatabase } from './config/database';
import './models'; // Import models to register associations

const startServer = async () => {
    try {
        // Test database connection
        await testConnection();

        // Temporarily skip database sync due to ALTER TABLE issues
        // await syncDatabase(false); // Set to true to drop and recreate tables
        console.log('⚠️  Database sync skipped - tables must exist or be created manually');

        // Start server
        app.listen(config.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 HR Harmony Backend Server                            ║
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
