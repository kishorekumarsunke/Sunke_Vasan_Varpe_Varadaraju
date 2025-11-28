import { pool } from '../config/database.js';

const createBookingTables = async () => {
    try {
        // Create tutor_availability table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tutor_availability (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tutor_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
                day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ... 6=Saturday
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                is_available BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create bookings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                student_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
                tutor_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
                booking_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                duration_minutes INTEGER DEFAULT 60,
                subject VARCHAR(100),
                message TEXT,
                status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
                total_amount DECIMAL(10,2),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes for better performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_day 
            ON tutor_availability(tutor_id, day_of_week);
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_bookings_tutor_date 
            ON bookings(tutor_id, booking_date);
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_bookings_student 
            ON bookings(student_id);
        `);

        console.log('✅ Booking tables created successfully');

        // Add sample availability for existing tutors
        const tutors = await pool.query(`
            SELECT id, full_name FROM accounts 
            WHERE account_type = 'tutor'
        `);

        console.log(`Found ${tutors.rows.length} tutors to add availability for`);

        for (const tutor of tutors.rows) {
            // Add sample availability (Monday, Wednesday, Friday 3-5 PM, Tuesday, Thursday 6-8 PM)
            const availabilitySlots = [
                { day: 1, start: '15:00', end: '17:00' }, // Monday 3-5 PM
                { day: 2, start: '18:00', end: '20:00' }, // Tuesday 6-8 PM
                { day: 3, start: '15:00', end: '17:00' }, // Wednesday 3-5 PM
                { day: 4, start: '18:00', end: '20:00' }, // Thursday 6-8 PM
                { day: 5, start: '15:00', end: '17:00' }, // Friday 3-5 PM
            ];

            for (const slot of availabilitySlots) {
                await pool.query(`
                    INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT DO NOTHING
                `, [tutor.id, slot.day, slot.start, slot.end]);
            }

            console.log(`✅ Added availability for ${tutor.full_name}`);
        }

        // Show current availability
        const availability = await pool.query(`
            SELECT 
                a.full_name,
                ta.day_of_week,
                ta.start_time,
                ta.end_time
            FROM tutor_availability ta
            JOIN accounts a ON ta.tutor_id = a.id
            ORDER BY a.full_name, ta.day_of_week, ta.start_time
        `);

        console.log('\n📅 Current tutor availability:');
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        availability.rows.forEach(slot => {
            console.log(`${slot.full_name}: ${dayNames[slot.day_of_week]} ${slot.start_time} - ${slot.end_time}`);
        });

    } catch (error) {
        console.error('❌ Error creating booking tables:', error);
        throw error;
    } finally {
        process.exit(0);
    }
};

createBookingTables();