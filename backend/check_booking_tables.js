import pg from 'pg';

const pool = new pg.Pool({
    host: 'localhost',
    port: 5432,
    database: 'TutorTogether',
    user: 'postgres',
    password: 'admin'
});

async function checkTables() {
    try {
        const result = await pool.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `);

        console.log('All tables in database:');
        result.rows.forEach(row => console.log('  -', row.tablename));

        const bookingResult = await pool.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename LIKE '%book%'
        `);

        console.log('\nBooking-related tables:');
        bookingResult.rows.forEach(row => console.log('  -', row.tablename));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTables();
