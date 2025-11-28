import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

// Create a connection pool
// Support both connection string (DATABASE_URL) and individual parameters
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            // Connection pool settings
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        }
        : {
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'TutorTogether',
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 5432,
            ssl: { rejectUnauthorized: false },
            // Connection pool settings
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        }
);

const connectDB = async () => {
    try {
        // Test the connection
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as version');

        console.log('🐘 PostgreSQL Connected Successfully!');
        console.log(`🗃️  Database: ${process.env.DB_NAME || 'TutorTogether'}`);
        console.log(`🕐 Server Time: ${result.rows[0].current_time}`);
        console.log(`📋 Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);

        client.release();

        // Handle pool errors
        pool.on('error', (err) => {
            console.error('❌ PostgreSQL pool error:', err);
        });

        // Graceful shutdown handlers - only for actual process termination
        let isShuttingDown = false;

        const gracefulShutdown = async (signal) => {
            if (isShuttingDown) return;
            isShuttingDown = true;

            console.log(`🛑 ${signal} received - initiating graceful shutdown...`);
            console.log('🔄 Closing PostgreSQL connection pool...');

            try {
                await pool.end();
                console.log('📴 PostgreSQL connection pool closed');
            } catch (error) {
                console.error('❌ Error closing pool:', error);
            }

            process.exit(0);
        };

        // Temporarily disable signal handlers for testing
        // process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        // if (process.env.NODE_ENV === 'production') {
        //     process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // }

    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        console.error('🔍 Connection details:', {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'TutorTogether',
            user: process.env.DB_USER || 'postgres'
        });
        process.exit(1);
    }
};

// Export both the connection function and the pool for queries
export { pool };
export default connectDB;