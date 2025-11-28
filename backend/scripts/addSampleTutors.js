import { pool } from '../config/database.js';

const checkAndAddTutors = async () => {
    try {
        // Check existing tutors
        const existingTutors = await pool.query('SELECT COUNT(*) FROM tutor_profiles');
        console.log('Existing tutor profiles:', existingTutors.rows[0].count);
        
        if (existingTutors.rows[0].count === '0') {
            console.log('No tutors found, creating sample data...');
            
            // Create sample tutor accounts and profiles
            const sampleTutors = [
                {
                    username: 'rahul_math',
                    email: 'rahul@example.com',
                    fullName: 'Rahul Varadaraju',
                    bio: 'Mathematics expert with 8+ years of experience',
                    profileBio: 'Passionate mathematics tutor with expertise in calculus and statistics. I help students overcome math anxiety.',
                    hourlyRate: 45.00,
                    subjects: ['Mathematics', 'Calculus', 'Statistics'],
                    rating: 4.9,
                    reviews: 127,
                    online: true,
                    responseTime: 30
                },
                {
                    username: 'chandra_physics',
                    email: 'chandra@example.com',
                    fullName: 'Chandrasekar Vasan',
                    bio: 'Physics professor with 12+ years of experience',
                    profileBio: 'University professor specializing in physics and engineering. I make complex topics accessible.',
                    hourlyRate: 55.00,
                    subjects: ['Physics', 'Chemistry', 'Engineering'],
                    rating: 4.8,
                    reviews: 89,
                    online: false,
                    responseTime: 120
                },
                {
                    username: 'pranav_cs',
                    email: 'pranav@example.com',
                    fullName: 'Pranav Varpe',
                    bio: 'Software engineer and CS tutor',
                    profileBio: 'Professional software engineer turned tutor. I teach programming and data science.',
                    hourlyRate: 60.00,
                    subjects: ['Computer Science', 'Programming', 'Data Science'],
                    rating: 4.9,
                    reviews: 203,
                    online: true,
                    responseTime: 15
                }
            ];
            
            for (const tutor of sampleTutors) {
                // Create account
                const accountResult = await pool.query(`
                    INSERT INTO accounts (username, email, password_hash, account_type, is_active, full_name, bio)
                    VALUES ($1, $2, $3, 'tutor', true, $4, $5)
                    ON CONFLICT (email) DO NOTHING
                    RETURNING id
                `, [tutor.username, tutor.email, 'hashed_password', tutor.fullName, tutor.bio]);
                
                let accountId;
                if (accountResult.rows.length > 0) {
                    accountId = accountResult.rows[0].id;
                } else {
                    // Account already exists, get its ID
                    const existing = await pool.query('SELECT id FROM accounts WHERE email = $1', [tutor.email]);
                    if (existing.rows.length > 0) {
                        accountId = existing.rows[0].id;
                    } else {
                        console.log(`Could not create or find account for ${tutor.email}`);
                        continue;
                    }
                }
                
                // Create tutor profile
                await pool.query(`
                    INSERT INTO tutor_profiles (account_id, bio, hourly_rate, subjects_taught, rating, total_reviews, is_online, response_time_avg)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (account_id) DO UPDATE SET
                        bio = EXCLUDED.bio,
                        hourly_rate = EXCLUDED.hourly_rate,
                        subjects_taught = EXCLUDED.subjects_taught,
                        rating = EXCLUDED.rating,
                        total_reviews = EXCLUDED.total_reviews,
                        is_online = EXCLUDED.is_online,
                        response_time_avg = EXCLUDED.response_time_avg
                `, [
                    accountId,
                    tutor.profileBio,
                    tutor.hourlyRate,
                    tutor.subjects,
                    tutor.rating,
                    tutor.reviews,
                    tutor.online,
                    tutor.responseTime
                ]);
                
                console.log(`✅ Created tutor: ${tutor.fullName}`);
            }
            
            console.log('Sample tutors created successfully!');
        }
        
        // Show current tutors
        const tutors = await pool.query(`
            SELECT a.username, a.full_name, tp.subjects_taught, tp.hourly_rate, tp.rating 
            FROM accounts a 
            JOIN tutor_profiles tp ON a.id = tp.account_id 
            WHERE a.account_type = 'tutor'
        `);
        
        console.log('\nCurrent tutors:');
        tutors.rows.forEach(t => {
            console.log(`- ${t.full_name} (${t.username}): ${t.subjects_taught?.join(', ')} - $${t.hourly_rate}/hr - ⭐${t.rating}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

checkAndAddTutors();