import { pool } from '../../config/database.js';

// Helper function to check if tutor profile is complete
const isProfileComplete = (tutor) => {
    // Required fields for a complete tutor profile
    const requiredFields = [
        tutor.full_name,
        tutor.hourly_rate,
        tutor.subjects,
        tutor.available_days // Availability is required
    ];

    // Check if all required fields are present and not empty
    const hasRequiredFields = requiredFields.every(field =>
        field !== null && field !== undefined &&
        (typeof field === 'string' ? field.trim() !== '' : true) &&
        (Array.isArray(field) ? field.length > 0 : true)
    );

    // Additional validation for specific fields
    const hasValidRate = tutor.hourly_rate && tutor.hourly_rate > 0;
    const hasValidSubjects = tutor.subjects && Array.isArray(tutor.subjects) && tutor.subjects.length > 0;

    return hasRequiredFields && hasValidRate && hasValidSubjects;
};

// Get all tutors with their profiles (only show completed profiles)
export const getAllTutors = async (req, res) => {
    try {
        const { search, subject, minPrice, maxPrice, sortBy = 'rating' } = req.query;

        let query = `
            SELECT 
                a.id,
                a.username,
                a.full_name,
                a.email,
                a.created_at,
                a.profile_image,
                a.bio as account_bio,
                tp.bio,
                tp.hourly_rate,
                tp.subjects_taught as subjects,
                tp.is_online,
                tp.rating,
                tp.total_reviews,
                tp.response_time_avg,
                tp.available_days,
                COALESCE(
                    (SELECT COUNT(*) 
                     FROM bookings b 
                     WHERE b.tutor_id = a.id), 
                    0
                ) as total_bookings,
                COALESCE(
                    (SELECT COUNT(*) 
                     FROM bookings b 
                     WHERE b.tutor_id = a.id AND b.status = 'completed'), 
                    0
                ) as completed_sessions,
                COALESCE(
                    (SELECT COUNT(*) 
                     FROM bookings b 
                     WHERE b.tutor_id = a.id AND b.status = 'pending'), 
                    0
                ) as pending_requests
            FROM accounts a
            JOIN tutor_profiles tp ON a.id = tp.account_id
            WHERE a.account_type = 'tutor' 
                AND a.is_active = true 
                AND tp.approval_status = 'approved'
        `;

        const params = [];
        let paramCount = 1;

        // Add search filter
        if (search) {
            query += ` AND (
                LOWER(a.full_name) LIKE LOWER($${paramCount}) OR
                LOWER(a.username) LIKE LOWER($${paramCount}) OR
                EXISTS (
                    SELECT 1 FROM unnest(tp.subjects_taught) as subject 
                    WHERE LOWER(subject) LIKE LOWER($${paramCount})
                )
            )`;
            params.push(`%${search}%`);
            paramCount++;
        }

        // Add subject filter
        if (subject && subject !== 'all') {
            query += ` AND $${paramCount} = ANY(tp.subjects_taught)`;
            params.push(subject);
            paramCount++;
        }

        // Add price filters
        if (minPrice) {
            query += ` AND tp.hourly_rate >= $${paramCount}`;
            params.push(parseFloat(minPrice));
            paramCount++;
        }

        if (maxPrice) {
            query += ` AND tp.hourly_rate <= $${paramCount}`;
            params.push(parseFloat(maxPrice));
            paramCount++;
        }

        // Add sorting
        switch (sortBy) {
            case 'rating':
                query += ' ORDER BY tp.rating DESC NULLS LAST, tp.total_reviews DESC';
                break;
            case 'price-low':
                query += ' ORDER BY tp.hourly_rate ASC';
                break;
            case 'price-high':
                query += ' ORDER BY tp.hourly_rate DESC';
                break;
            case 'reviews':
                query += ' ORDER BY tp.total_reviews DESC';
                break;
            default:
                query += ' ORDER BY tp.rating DESC NULLS LAST';
        }

        const result = await pool.query(query, params);

        // Filter out tutors with incomplete profiles and transform the data
        const completeTutors = result.rows.filter(tutor => isProfileComplete(tutor));
        const tutors = completeTutors.map(tutor => {
            const fullName = tutor.full_name || tutor.username;
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Convert response time from average minutes to readable format
            const responseTimeMinutes = tutor.response_time_avg || 60;
            let responseTime = '< 1 hour';
            if (responseTimeMinutes < 60) {
                responseTime = `< ${responseTimeMinutes} min`;
            } else if (responseTimeMinutes < 1440) {
                const hours = Math.ceil(responseTimeMinutes / 60);
                responseTime = `< ${hours} hour${hours > 1 ? 's' : ''}`;
            } else {
                const days = Math.ceil(responseTimeMinutes / 1440);
                responseTime = `< ${days} day${days > 1 ? 's' : ''}`;
            }

            return {
                id: tutor.id,
                name: fullName,
                firstName: firstName,
                lastName: lastName,
                username: tutor.username,
                email: tutor.email,
                avatar: tutor.profile_image || `${firstName.charAt(0)}${lastName.charAt(0)}` || tutor.username.substring(0, 2).toUpperCase(),
                subjects: tutor.subjects || [],
                rating: parseFloat(tutor.rating) || 0,
                reviews: tutor.total_reviews || 0,
                totalBookings: parseInt(tutor.total_bookings) || 0,
                completedSessions: parseInt(tutor.completed_sessions) || 0,
                pendingRequests: parseInt(tutor.pending_requests) || 0,
                hourlyRate: parseFloat(tutor.hourly_rate) || 0,
                qualifications: [], // Default since we don't have this field
                bio: tutor.bio || tutor.account_bio || 'Professional tutor ready to help you achieve your learning goals.',
                availability: 'Available for scheduling',
                languages: ['English'], // Default
                responseTime: responseTime,
                online: tutor.is_online || false,
                specialties: [], // Default since we don't have this field
                createdAt: tutor.created_at
            };
        });

        res.json({
            success: true,
            data: tutors,
            count: tutors.length
        });

    } catch (error) {
        console.error('Error fetching tutors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tutors',
            error: error.message
        });
    }
};

// Get tutor by ID
export const getTutorById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                a.id,
                a.username,
                a.full_name,
                a.email,
                a.created_at,
                a.profile_image,
                a.bio as account_bio,
                tp.bio,
                tp.hourly_rate,
                tp.subjects_taught as subjects,
                tp.is_online,
                tp.rating,
                tp.total_reviews,
                tp.response_time_avg,
                tp.available_days
            FROM accounts a
            JOIN tutor_profiles tp ON a.id = tp.account_id
            WHERE a.id = $1 
                AND a.account_type = 'tutor' 
                AND a.is_active = true 
                AND tp.approval_status = 'approved'
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tutor not found'
            });
        }

        const tutor = result.rows[0];
        const fullName = tutor.full_name || tutor.username;
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const responseTimeMinutes = tutor.response_time_avg || 60;
        let responseTime = '< 1 hour';
        if (responseTimeMinutes < 60) {
            responseTime = `< ${responseTimeMinutes} min`;
        } else if (responseTimeMinutes < 1440) {
            const hours = Math.ceil(responseTimeMinutes / 60);
            responseTime = `< ${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            const days = Math.ceil(responseTimeMinutes / 1440);
            responseTime = `< ${days} day${days > 1 ? 's' : ''}`;
        }

        const tutorData = {
            id: tutor.id,
            name: fullName,
            firstName: firstName,
            lastName: lastName,
            username: tutor.username,
            email: tutor.email,
            avatar: tutor.profile_image || `${firstName.charAt(0)}${lastName.charAt(0)}` || tutor.username.substring(0, 2).toUpperCase(),
            subjects: tutor.subjects || [],
            rating: parseFloat(tutor.rating) || 0,
            reviews: tutor.total_reviews || 0,
            hourlyRate: parseFloat(tutor.hourly_rate) || 0,
            experience: '5+ years',
            experienceYears: 5,
            qualifications: [],
            bio: tutor.bio || tutor.account_bio || 'Professional tutor ready to help you achieve your learning goals.',
            availability: 'Available for scheduling',
            languages: ['English'],
            responseTime: responseTime,
            online: tutor.is_online || false,
            specialties: [],
            createdAt: tutor.created_at
        };

        res.json({
            success: true,
            data: tutorData
        });

    } catch (error) {
        console.error('Error fetching tutor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tutor',
            error: error.message
        });
    }
};

// Get unique subjects from all tutors
export const getTutorSubjects = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT unnest(subjects_taught) as subject
            FROM tutor_profiles
            WHERE subjects_taught IS NOT NULL
            ORDER BY subject
        `;

        const result = await pool.query(query);
        const subjects = result.rows.map(row => row.subject);

        res.json({
            success: true,
            data: subjects
        });

    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subjects',
            error: error.message
        });
    }
};