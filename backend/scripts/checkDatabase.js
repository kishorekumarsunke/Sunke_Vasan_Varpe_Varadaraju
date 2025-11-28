import { pool } from '../config/database.js';

async function checkDatabase() {
    const client = await pool.connect();

    try {
        // Check tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('📊 Current tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });

        // Check migrations
        if (tablesResult.rows.some(row => row.table_name === 'migrations')) {
            const migrationsResult = await client.query('SELECT name FROM migrations ORDER BY executed_at');
            console.log('\n📋 Executed migrations:');
            migrationsResult.rows.forEach(row => {
                console.log(`   • ${row.name}`);
            });
        }

    } finally {
        client.release();
        await pool.end();
    }
}

checkDatabase();