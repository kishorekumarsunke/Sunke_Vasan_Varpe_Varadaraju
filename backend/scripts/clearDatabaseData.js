import { pool } from '../config/database.js';

async function clearDatabaseData() {
    const client = await pool.connect();

    try {
        console.log('🧹 Preparing to truncate all public tables...');

        const { rows } = await client.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
              AND tablename != 'migrations'
        `);

        if (rows.length === 0) {
            console.log('⚠️  No tables found to truncate.');
            return;
        }

        const tableList = rows.map((row) => `"${row.tablename}"`).join(', ');
        console.log(`🗑️  Truncating tables: ${tableList}`);

        await client.query('BEGIN');
        await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
        await client.query('COMMIT');

        console.log('✅ All data cleared while preserving schema.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to clear database data:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

clearDatabaseData();
