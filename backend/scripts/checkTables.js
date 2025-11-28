import { pool } from '../config/database.js';

const checkTables = async () => {
    try {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        console.log('Existing tables:');
        result.rows.forEach(row => {
            console.log(`- ${row.table_name}`);
        });
        
        // Check accounts table structure if it exists
        if (result.rows.some(row => row.table_name === 'accounts')) {
            const accountsStructure = await pool.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'accounts' 
                ORDER BY ordinal_position;
            `);
            
            console.log('\nAccounts table structure:');
            accountsStructure.rows.forEach(row => {
                console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
        } else {
            console.log('\nAccounts table does not exist');
        }
        
    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        process.exit(0);
    }
};

checkTables();