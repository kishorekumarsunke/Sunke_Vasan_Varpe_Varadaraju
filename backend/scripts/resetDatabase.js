import { pool } from '../config/database.js';

async function resetDatabase() {
    const client = await pool.connect();

    try {
        console.log('🗑️  Resetting database...');

        // Drop all tables (except migrations which we'll recreate)
        const tablesResult = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' AND tablename != 'migrations'
        `);

        for (const table of tablesResult.rows) {
            console.log(`   Dropping table: ${table.tablename}`);
            await client.query(`DROP TABLE IF EXISTS ${table.tablename} CASCADE`);
        }

        // Reset migrations table
        await client.query('DROP TABLE IF EXISTS migrations CASCADE');
        await client.query(`
            CREATE TABLE migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database reset complete');
        console.log('🔄 Run "npm run migrate" to apply migrations');

    } catch (error) {
        console.error('❌ Reset failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

resetDatabase();