import { sequelize } from '../config/database';

const checkIndexes = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const [results] = await sequelize.query('SHOW INDEX FROM users');
        console.log('Indexes on users table:', results);

        process.exit(0);
    } catch (error) {
        console.error('Error checking indexes:', error);
        process.exit(1);
    }
};

checkIndexes();
