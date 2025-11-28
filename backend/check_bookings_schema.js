import pg from 'pg';

const pool = new pg.Pool({
    host: 'localhost',
    port: 5432,
    database: 'TutorTogether',
    user: 'postgres',
    password: 'admin'
});

async function checkBookingsSchema() {
    try {
        // Get table structure
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'bookings'
            ORDER BY ordinal_position
        `);

        console.log('Bookings table columns:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'}`);
        });

        // Get sample data
        const data = await pool.query('SELECT * FROM bookings LIMIT 5');
        console.log('\nSample bookings data:');
        console.log(data.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkBookingsSchema();
