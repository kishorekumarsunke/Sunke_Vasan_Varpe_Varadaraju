import { pool } from '../../config/database.js';

class AdminService {
    // Get dashboard statistics
    async getDashboardStats() {
        try {
            const stats = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM accounts WHERE account_type = 'student') as total_students,
                    (SELECT COUNT(*) FROM accounts WHERE account_type = 'tutor') as total_tutors,
                    (SELECT COUNT(*) FROM tutor_profiles WHERE approval_status = 'pending') as pending_applications,
                    (SELECT COUNT(*) FROM bookings WHERE status IN ('scheduled', 'confirmed')) as total_sessions,
                    (SELECT COUNT(*) FROM bookings WHERE status = 'completed') as completed_sessions,
                    (SELECT COALESCE(SUM(b.total_amount), 0) 
                     FROM bookings b 
                     WHERE b.status = 'completed') as total_earnings
            `);

            // Get recent activity
            const recentActivity = await pool.query(`
                SELECT 
                    'session' as type,
                    b.id,
                    a.full_name as student_name,
                    t.full_name as tutor_name,
                    b.status,
                    b.created_at
                FROM bookings b
                JOIN accounts a ON b.student_id = a.id
                JOIN accounts t ON b.tutor_id = t.id
                ORDER BY b.created_at DESC
                LIMIT 10
            `);

            return {
                stats: stats.rows[0],
                recentActivity: recentActivity.rows
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }

    // Get all tutor applications
    async getTutorApplications(status = null) {
        try {
            let query = `
                SELECT 
                    tp.id,
                    tp.account_id,
                    a.full_name,
                    a.email,
                    a.phone_number,
                    a.location_city,
                    a.location_state,
                    tp.bio,
                    tp.hourly_rate,
                    tp.subjects_taught,
                    tp.available_days,
                    tp.approval_status,
                    tp.admin_notes,
                    tp.created_at,
                    tp.approved_at,
                    tp.rating,
                    tp.total_reviews,
                    tp.total_sessions
                FROM tutor_profiles tp
                JOIN accounts a ON tp.account_id = a.id
            `;

            const params = [];
            if (status) {
                query += ' WHERE tp.approval_status = $1';
                params.push(status);
            }

            query += ' ORDER BY tp.created_at DESC';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error fetching tutor applications:', error);
            throw error;
        }
    }

    // Get single tutor application
    async getTutorApplication(tutorId) {
        try {
            const result = await pool.query(`
                SELECT 
                    tp.*,
                    a.full_name,
                    a.email,
                    a.phone_number,
                    a.location_city,
                    a.location_state,
                    a.created_at as account_created_at,
                    approver.full_name as approved_by_name
                FROM tutor_profiles tp
                JOIN accounts a ON tp.account_id = a.id
                LEFT JOIN accounts approver ON tp.approved_by = approver.id
                WHERE tp.account_id = $1
            `, [tutorId]);

            return result.rows[0];
        } catch (error) {
            console.error('Error fetching tutor application:', error);
            throw error;
        }
    }

    // Approve or reject tutor application
    async updateTutorStatus(tutorId, status, adminId, notes = null) {
        try {
            console.log('Updating tutor status:', { tutorId, status, adminId, notes });

            const result = await pool.query(`
                UPDATE tutor_profiles
                SET 
                    approval_status = $1::varchar,
                    admin_notes = $2,
                    approved_by = $3,
                    approved_at = CASE WHEN $1::varchar = 'approved' THEN NOW() ELSE NULL END
                WHERE account_id = $4
                RETURNING *
            `, [status, notes, adminId, tutorId]);

            console.log('Update result:', result.rows);

            if (result.rows.length === 0) {
                throw new Error(`No tutor profile found with account_id: ${tutorId}`);
            }

            // If approved, set is_verified to true
            if (status === 'approved') {
                await pool.query(`
                    UPDATE tutor_profiles
                    SET is_verified = true
                    WHERE account_id = $1
                `, [tutorId]);
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error updating tutor status:', error);
            throw error;
        }
    }

    // Get all sessions with details
    async getAllSessions(limit = 50, offset = 0) {
        try {
            const result = await pool.query(`
                SELECT 
                    b.id,
                    b.status,
                    b.booking_date as session_date,
                    b.start_time as session_time,
                    ROUND(b.duration_minutes / 60.0, 2) as duration_hours,
                    b.subject,
                    b.student_notes as notes,
                    b.created_at,
                    s.full_name as student_name,
                    s.email as student_email,
                    t.full_name as tutor_name,
                    t.email as tutor_email,
                    b.hourly_rate,
                    b.total_amount as session_cost
                FROM bookings b
                JOIN accounts s ON b.student_id = s.id
                JOIN accounts t ON b.tutor_id = t.id
                ORDER BY b.created_at DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

            const countResult = await pool.query('SELECT COUNT(*) FROM bookings');

            return {
                sessions: result.rows,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            console.error('Error fetching sessions:', error);
            throw error;
        }
    }

    // Get earnings summary
    async getEarningsSummary() {
        try {
            const result = await pool.query(`
                SELECT 
                    COUNT(*) as total_sessions,
                    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
                    SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END) as total_earnings,
                    SUM(CASE WHEN b.status IN ('scheduled', 'confirmed') THEN b.total_amount ELSE 0 END) as pending_earnings,
                    AVG(CASE WHEN b.status = 'completed' THEN b.total_amount END) as avg_session_value
                FROM bookings b
            `);

            // Get earnings by tutor
            const topTutors = await pool.query(`
                SELECT 
                    a.full_name,
                    a.email,
                    COUNT(*) as session_count,
                    SUM(b.total_amount) as total_earned,
                    b.hourly_rate
                FROM bookings b
                JOIN accounts a ON b.tutor_id = a.id
                WHERE b.status = 'completed'
                GROUP BY a.full_name, a.email, b.hourly_rate
                ORDER BY total_earned DESC
                LIMIT 10
            `);

            return {
                summary: result.rows[0],
                topTutors: topTutors.rows
            };
        } catch (error) {
            console.error('Error fetching earnings summary:', error);
            throw error;
        }
    }

    // Get all users with filters
    async getAllUsers({ role = null, status = null, limit = 100, offset = 0 }) {
        try {
            let query = `
                SELECT 
                    a.id,
                    a.full_name,
                    a.email,
                    a.phone_number,
                    a.account_type as role,
                    a.is_active,
                    a.created_at,
                    a.location_city,
                    a.location_state
                FROM accounts a
                WHERE a.account_type != 'admin'
            `;

            const params = [];
            let paramIndex = 1;

            if (role && role !== 'all') {
                query += ` AND a.account_type = $${paramIndex}`;
                params.push(role);
                paramIndex++;
            }

            if (status && status !== 'all') {
                const isActive = status === 'active';
                query += ` AND a.is_active = $${paramIndex}`;
                params.push(isActive);
                paramIndex++;
            }

            query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            // Get total count
            let countQuery = 'SELECT COUNT(*) FROM accounts a WHERE a.account_type != \'admin\'';
            const countParams = [];
            let countParamIndex = 1;

            if (role && role !== 'all') {
                countQuery += ` AND a.account_type = $${countParamIndex}`;
                countParams.push(role);
                countParamIndex++;
            }

            if (status && status !== 'all') {
                const isActive = status === 'active';
                countQuery += ` AND a.is_active = $${countParamIndex}`;
                countParams.push(isActive);
            }

            const countResult = await pool.query(countQuery, countParams);

            return result.rows;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    // Update user active status (suspend/activate)
    async updateUserStatus(userId, isActive, adminId, reason = null) {
        try {
            const result = await pool.query(`
                UPDATE accounts
                SET 
                    is_active = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `, [isActive, userId]);

            if (result.rows.length === 0) {
                throw new Error(`No user found with id: ${userId}`);
            }

            // Log the action (you could create an admin_actions table for this)
            console.log(`Admin ${adminId} ${isActive ? 'activated' : 'suspended'} user ${userId}. Reason: ${reason}`);

            return result.rows[0];
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    }
}

export default new AdminService();
