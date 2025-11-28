import pool from '../src/utils/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupBookingRequestsSchema = async () => {
    try {
        console.log('🔄 Setting up booking requests schema...');
        
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, '../docs/booking_requests_schema.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Execute the SQL
        await pool.query(sql);
        
        console.log('✅ Booking requests schema setup completed successfully');
        
        // Insert some sample data for testing
        console.log('🔄 Inserting sample booking requests...');
        
        const sampleBookingRequests = `
            -- Insert sample booking requests (only if they don't exist)
            INSERT INTO booking_requests (student_id, availability_id, notes, duration, status, created_at)
            SELECT 
                (SELECT id FROM users WHERE email = 'alice.johnson@university.edu' LIMIT 1),
                (SELECT id FROM tutor_availability WHERE tutor_id = (SELECT id FROM users WHERE user_role = 'tutor' LIMIT 1) LIMIT 1),
                'Need help with calculus derivatives and chain rule. Preparing for upcoming exam.',
                60,
                'pending',
                CURRENT_TIMESTAMP - INTERVAL '1 hour'
            WHERE NOT EXISTS (
                SELECT 1 FROM booking_requests WHERE notes LIKE '%calculus derivatives%'
            );
            
            INSERT INTO booking_requests (student_id, availability_id, notes, duration, status, created_at)
            SELECT 
                (SELECT id FROM users WHERE email = 'bob.smith@university.edu' LIMIT 1),
                (SELECT id FROM tutor_availability WHERE tutor_id = (SELECT id FROM users WHERE user_role = 'tutor' LIMIT 1) OFFSET 1 LIMIT 1),
                'Struggling with quantum mechanics concepts, especially wave functions.',
                90,
                'pending',
                CURRENT_TIMESTAMP - INTERVAL '30 minutes'
            WHERE NOT EXISTS (
                SELECT 1 FROM booking_requests WHERE notes LIKE '%quantum mechanics%'
            );
            
            INSERT INTO booking_requests (student_id, availability_id, notes, duration, status, created_at)
            SELECT 
                (SELECT id FROM users WHERE email = 'carol.davis@university.edu' LIMIT 1),
                (SELECT id FROM tutor_availability WHERE tutor_id = (SELECT id FROM users WHERE user_role = 'tutor' LIMIT 1) OFFSET 2 LIMIT 1),
                'Need help with organic chemistry reactions and mechanisms.',
                60,
                'pending',
                CURRENT_TIMESTAMP - INTERVAL '15 minutes'
            WHERE NOT EXISTS (
                SELECT 1 FROM booking_requests WHERE notes LIKE '%organic chemistry%'
            );
        `;
        
        await pool.query(sampleBookingRequests);
        
        console.log('✅ Sample booking requests inserted successfully');
        
        // Show current status
        const countResult = await pool.query('SELECT COUNT(*) as count FROM booking_requests WHERE status = $1', ['pending']);
        console.log(`📊 Current pending booking requests: ${countResult.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Error setting up booking requests schema:', error);
        throw error;
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupBookingRequestsSchema()
        .then(() => {
            console.log('🎉 Booking requests setup completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Setup failed:', error);
            process.exit(1);
        });
}

export default setupBookingRequestsSchema;