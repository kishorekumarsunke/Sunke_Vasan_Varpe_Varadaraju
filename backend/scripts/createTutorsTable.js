import { pool } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const createTutorProfilesTable = async () => {
    try {
        // Create tutor_profiles table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS tutor_profiles (
                profile_id SERIAL PRIMARY KEY,
                account_id INTEGER REFERENCES accounts(account_id) ON DELETE CASCADE,
                bio TEXT,
                hourly_rate DECIMAL(10,2),
                subjects TEXT[] DEFAULT '{}',
                qualifications TEXT[] DEFAULT '{}',
                experience_years INTEGER DEFAULT 0,
                languages TEXT[] DEFAULT '{"English"}',
                availability TEXT DEFAULT 'Contact for availability',
                response_time TEXT DEFAULT '< 24 hours',
                specialties TEXT[] DEFAULT '{}',
                is_online BOOLEAN DEFAULT false,
                rating DECIMAL(3,2) DEFAULT 0.00,
                total_reviews INTEGER DEFAULT 0,
                profile_picture_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await pool.query(createTableQuery);
        console.log('✅ Tutor profiles table created successfully');

        // Create some sample tutor accounts first
        const tutorAccounts = [
            {
                firstName: 'Rahul',
                lastName: 'Varadaraju',
                email: 'rahul.v@tutortogether.com',
                bio: 'Passionate mathematics tutor with expertise in calculus and statistics. I help students overcome math anxiety and achieve their academic goals.',
                hourlyRate: 45,
                subjects: ['Mathematics', 'Calculus', 'Statistics'],
                qualifications: ['PhD in Mathematics', 'MIT Graduate'],
                experienceYears: 8,
                languages: ['English', 'Hindi'],
                availability: 'Available now',
                responseTime: '< 1 hour',
                specialties: ['Exam Prep', 'Homework Help', 'Advanced Topics'],
                isOnline: true,
                rating: 4.9,
                totalReviews: 127
            },
            {
                firstName: 'Chandrasekar',
                lastName: 'Vasan',
                email: 'chandra.v@tutortogether.com',
                bio: 'University professor specializing in physics and engineering concepts. I make complex topics accessible and engaging.',
                hourlyRate: 55,
                subjects: ['Physics', 'Chemistry', 'Engineering'],
                qualifications: ['PhD in Physics', 'Stanford Graduate'],
                experienceYears: 12,
                languages: ['English', 'Tamil'],
                availability: 'Available today',
                responseTime: '< 2 hours',
                specialties: ['University Level', 'Research Support', 'Lab Work'],
                isOnline: false,
                rating: 4.8,
                totalReviews: 89
            },
            {
                firstName: 'Kishore',
                lastName: 'Kumar Sunke',
                email: 'kishore.s@tutortogether.com',
                bio: 'Chemistry expert with a passion for teaching. I specialize in making chemistry fun and understandable for all levels.',
                hourlyRate: 40,
                subjects: ['Chemistry', 'Biology', 'Organic Chemistry'],
                qualifications: ['PhD in Chemistry', 'Harvard Graduate'],
                experienceYears: 6,
                languages: ['English', 'Telugu'],
                availability: 'Available tomorrow',
                responseTime: '< 30 min',
                specialties: ['Lab Techniques', 'MCAT Prep', 'AP Chemistry'],
                isOnline: true,
                rating: 4.7,
                totalReviews: 156
            },
            {
                firstName: 'Pranav',
                lastName: 'Varpe',
                email: 'pranav.v@tutortogether.com',
                bio: 'Professional software engineer turned tutor. I teach programming languages, algorithms, and data science concepts.',
                hourlyRate: 60,
                subjects: ['Computer Science', 'Programming', 'Data Science'],
                qualifications: ['MS Computer Science', 'Google Software Engineer'],
                experienceYears: 10,
                languages: ['English', 'Marathi'],
                availability: 'Available now',
                responseTime: '< 15 min',
                specialties: ['Interview Prep', 'Project Help', 'Career Guidance'],
                isOnline: true,
                rating: 4.9,
                totalReviews: 203
            },
            {
                firstName: 'Anna',
                lastName: 'Kim',
                email: 'anna.k@tutortogether.com',
                bio: 'Economics professor with real-world business experience. I help students understand economic principles and their applications.',
                hourlyRate: 50,
                subjects: ['Economics', 'Business', 'Finance'],
                qualifications: ['PhD in Economics', 'Wharton Graduate'],
                experienceYears: 7,
                languages: ['English', 'Korean'],
                availability: 'Available this week',
                responseTime: '< 3 hours',
                specialties: ['Business Strategy', 'Financial Analysis', 'Market Research'],
                isOnline: false,
                rating: 4.6,
                totalReviews: 74
            },
            {
                firstName: 'Mark',
                lastName: 'Thompson',
                email: 'mark.t@tutortogether.com',
                bio: 'English literature expert and published author. I help students improve their writing skills and understand literary works.',
                hourlyRate: 35,
                subjects: ['English', 'Literature', 'Writing'],
                qualifications: ['MA in English Literature', 'Published Author'],
                experienceYears: 9,
                languages: ['English'],
                availability: 'Available now',
                responseTime: '< 1 hour',
                specialties: ['Essay Writing', 'Literary Analysis', 'Creative Writing'],
                isOnline: true,
                rating: 4.8,
                totalReviews: 142
            }
        ];

        // Insert tutor accounts and profiles
        for (const tutor of tutorAccounts) {
            // Check if account already exists
            const existingAccount = await pool.query(
                'SELECT account_id FROM accounts WHERE email = $1',
                [tutor.email]
            );

            let accountId;

            if (existingAccount.rows.length > 0) {
                accountId = existingAccount.rows[0].account_id;
                console.log(`Account already exists for ${tutor.email}`);
            } else {
                // Create account
                const accountResult = await pool.query(`
                    INSERT INTO accounts (first_name, last_name, email, password_hash, role, is_active)
                    VALUES ($1, $2, $3, $4, 'tutor', true)
                    RETURNING account_id
                `, [tutor.firstName, tutor.lastName, tutor.email, 'hashed_password_placeholder']);

                accountId = accountResult.rows[0].account_id;
                console.log(`✅ Created account for ${tutor.firstName} ${tutor.lastName}`);
            }

            // Check if tutor profile already exists
            const existingProfile = await pool.query(
                'SELECT profile_id FROM tutor_profiles WHERE account_id = $1',
                [accountId]
            );

            if (existingProfile.rows.length === 0) {
                // Create tutor profile
                await pool.query(`
                    INSERT INTO tutor_profiles (
                        account_id, bio, hourly_rate, subjects, qualifications,
                        experience_years, languages, availability, response_time,
                        specialties, is_online, rating, total_reviews
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    accountId,
                    tutor.bio,
                    tutor.hourlyRate,
                    tutor.subjects,
                    tutor.qualifications,
                    tutor.experienceYears,
                    tutor.languages,
                    tutor.availability,
                    tutor.responseTime,
                    tutor.specialties,
                    tutor.isOnline,
                    tutor.rating,
                    tutor.totalReviews
                ]);

                console.log(`✅ Created tutor profile for ${tutor.firstName} ${tutor.lastName}`);
            } else {
                console.log(`Tutor profile already exists for ${tutor.firstName} ${tutor.lastName}`);
            }
        }

        console.log('🎉 All tutor data setup completed successfully!');

    } catch (error) {
        console.error('❌ Error setting up tutor data:', error);
        throw error;
    }
};

// Run the setup
createTutorProfilesTable()
    .then(() => {
        console.log('Setup completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Setup failed:', error);
        process.exit(1);
    });