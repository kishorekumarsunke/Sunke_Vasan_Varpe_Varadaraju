import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function seedDatabase() {
    let client;

    try {
        console.log('🌱 Starting database seeding...');

        // Get a client from the pool
        client = await pool.connect();

        // Check if any tables exist to seed
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name != 'migrations'
        `);

        if (tablesResult.rows.length === 0) {
            console.log('⚠️  No tables found to seed. Run migrations first.');
            return;
        }

        console.log('🔄 Creating seed data...');

        // Start transaction
        await client.query('BEGIN');

        // Create admin account
        const adminPasswordHash = await bcrypt.hash('admin123', 12);
        const adminResult = await client.query(`
            INSERT INTO accounts (username, email, password_hash, account_type, account_status, email_confirmed)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, ['admin', 'admin@tutortogether.com', adminPasswordHash, 'admin', 'active', true]);

        const adminId = adminResult.rows[0].id;

        // Create admin user details
        await client.query(`
            INSERT INTO user_details (account_id, display_name, full_name, about_me)
            VALUES ($1, $2, $3, $4)
        `, [adminId, 'Admin User', 'System Administrator', 'System administrator for Tutor Together platform']);

        // Create sample tutor account
        const tutorPasswordHash = await bcrypt.hash('tutor123', 12);
        const tutorResult = await client.query(`
            INSERT INTO accounts (username, email, password_hash, account_type, account_status, email_confirmed)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, ['john_tutor', 'john@example.com', tutorPasswordHash, 'tutor', 'active', true]);

        const tutorId = tutorResult.rows[0].id;

        // Create tutor user details
        await client.query(`
            INSERT INTO user_details (account_id, display_name, full_name, location_city, location_country, about_me)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [tutorId, 'John Smith', 'John Smith', 'New York', 'USA', 'Experienced math and science tutor with 5+ years of teaching experience']);

        // Create tutor profile
        await client.query(`
            INSERT INTO tutors (account_id, hourly_rate, availability_status, total_sessions, average_rating, total_earnings)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [tutorId, 35.00, 'available', 0, 0.0, 0.0]);

        // Create sample student account
        const studentPasswordHash = await bcrypt.hash('student123', 12);
        const studentResult = await client.query(`
            INSERT INTO accounts (username, email, password_hash, account_type, account_status, email_confirmed)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, ['sarah_student', 'sarah@example.com', studentPasswordHash, 'student', 'active', true]);

        const studentId = studentResult.rows[0].id;

        // Create student user details
        await client.query(`
            INSERT INTO user_details (account_id, display_name, full_name, location_city, location_country, about_me)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [studentId, 'Sarah Johnson', 'Sarah Johnson', 'Los Angeles', 'USA', 'High school student looking for help with math and science']);

        // Create student profile
        await client.query(`
            INSERT INTO students (account_id, total_sessions, total_spent)
            VALUES ($1, $2, $3)
        `, [studentId, 0, 0.0]);

        // Create some sample subjects
        const subjects = [
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'English',
            'History',
            'Computer Science',
            'Spanish'
        ];

        for (const subject of subjects) {
            await client.query(`
                INSERT INTO subjects (name, description, is_active)
                VALUES ($1, $2, $3)
            `, [subject, `Learn ${subject} with experienced tutors`, true]);
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log('✅ Database seeded successfully!');
        console.log('\n👤 Sample accounts created:');
        console.log('   • Admin: admin@tutortogether.com / admin123');
        console.log('   • Tutor: john@example.com / tutor123');
        console.log('   • Student: sarah@example.com / student123');
        console.log('\n📚 Sample subjects created:');
        subjects.forEach(subject => console.log(`   • ${subject}`));

    } catch (error) {
        console.error('❌ Database seeding failed:', error.message);

        if (client) {
            await client.query('ROLLBACK');
        }

        process.exit(1);
    } finally {
        // Release the client back to the pool
        if (client) {
            client.release();
        }

        // Close the pool
        await pool.end();
    }
}

// Run the seeding
seedDatabase();