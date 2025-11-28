import { pool } from '../config/database.js';

const checkTutorProfiles = async () => {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'tutor_profiles' 
            ORDER BY ordinal_position;
        `);
        
        console.log('Tutor profiles table columns:');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Check if there are any records
        const countResult = await pool.query('SELECT COUNT(*) FROM tutor_profiles');
        console.log(`\nTotal tutor profiles: ${countResult.rows[0].count}`);
        
    } catch (error) {
        console.error('Error checking tutor_profiles:', error);
    } finally {
        process.exit(0);
    }
};

checkTutorProfiles();