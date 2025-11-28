import { pool } from '../config/database.js';

const updateTutors = async () => {
    try {
        // Update existing tutor profile
        await pool.query(`
            UPDATE tutor_profiles 
            SET 
                bio = 'Experienced tutor specializing in multiple subjects. Ready to help students achieve their goals.',
                hourly_rate = 50.00,
                subjects_taught = ARRAY['Mathematics', 'Computer Science'],
                rating = 4.8,
                total_reviews = 95,
                is_online = true,
                response_time_avg = 45
            WHERE account_id = (SELECT id FROM accounts WHERE email = 'abhinaykotla@gmail.com')
        `);
        
        console.log('Updated existing tutor profile');
        
        // Add more sample tutors
        const tutors = [
            { username: 'sarah_bio', email: 'sarah@example.com', name: 'Sarah Johnson', subjects: ['Biology', 'Chemistry'], rate: 42, rating: 4.7, reviews: 78 },
            { username: 'mike_eng', email: 'mike@example.com', name: 'Mike Chen', subjects: ['English', 'Literature'], rate: 38, rating: 4.6, reviews: 56 },
            { username: 'lisa_stats', email: 'lisa@example.com', name: 'Lisa Rodriguez', subjects: ['Statistics', 'Mathematics'], rate: 48, rating: 4.9, reviews: 134 }
        ];
        
        for (const tutor of tutors) {
            const accountResult = await pool.query(`
                INSERT INTO accounts (username, email, password_hash, account_type, is_active, full_name)
                VALUES ($1, $2, 'password', 'tutor', true, $3)
                ON CONFLICT (email) DO NOTHING
                RETURNING id
            `, [tutor.username, tutor.email, tutor.name]);
            
            if (accountResult.rows.length > 0) {
                await pool.query(`
                    INSERT INTO tutor_profiles (account_id, bio, hourly_rate, subjects_taught, rating, total_reviews, is_online, response_time_avg)
                    VALUES ($1, $2, $3, $4, $5, $6, true, 60)
                `, [accountResult.rows[0].id, `Professional ${tutor.subjects[0]} tutor`, tutor.rate, tutor.subjects, tutor.rating, tutor.reviews]);
                
                console.log(`Added tutor: ${tutor.name}`);
            }
        }
        
        // Show final results
        const result = await pool.query(`
            SELECT a.full_name, a.email, tp.subjects_taught, tp.hourly_rate, tp.rating, tp.total_reviews
            FROM accounts a 
            JOIN tutor_profiles tp ON a.id = tp.account_id 
            WHERE a.account_type = 'tutor'
        `);
        
        console.log('\nFinal tutor list:');
        result.rows.forEach(t => {
            console.log(`- ${t.full_name}: ${t.subjects_taught?.join(', ')} - $${t.hourly_rate}/hr - ⭐${t.rating} (${t.total_reviews} reviews)`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

updateTutors();