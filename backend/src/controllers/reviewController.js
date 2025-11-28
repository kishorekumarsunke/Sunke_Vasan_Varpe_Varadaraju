import { pool } from '../../config/database.js';

const reviewController = {
    // Create a new review for a completed session
    createReview: async (req, res) => {
        try {
            // Require authentication
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const studentId = req.user.userId;
            console.log('🔍 createReview called by studentId:', studentId);

            const { bookingId } = req.params;
            const {
                rating,
                reviewText,
                wouldRecommend = true,
                sessionQualityRating,
                communicationRating,
                punctualityRating,
                helpfulnessRating
            } = req.body;

            // Validate required fields
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    error: 'Rating is required and must be between 1 and 5'
                });
            }

            // Check if booking exists and belongs to the student
            const bookingCheck = await pool.query(`
                SELECT b.*, a.full_name as tutor_name
                FROM bookings b
                JOIN accounts a ON b.tutor_id = a.id
                WHERE b.id = $1 AND b.student_id = $2 AND b.status = 'completed'
            `, [bookingId, studentId]);

            if (bookingCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'Booking not found, not owned by you, or not completed'
                });
            }

            const booking = bookingCheck.rows[0];

            // Check if review already exists
            const existingReview = await pool.query(
                'SELECT id FROM reviews WHERE booking_id = $1',
                [bookingId]
            );

            if (existingReview.rows.length > 0) {
                return res.status(400).json({
                    error: 'Review has already been submitted for this session'
                });
            }

            // Create the review
            const reviewResult = await pool.query(`
                INSERT INTO reviews (
                    booking_id, student_id, tutor_id, rating, review_text, 
                    would_recommend, session_quality_rating, communication_rating, 
                    punctuality_rating, helpfulness_rating
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                bookingId, studentId, booking.tutor_id, rating, reviewText,
                wouldRecommend, sessionQualityRating, communicationRating,
                punctualityRating, helpfulnessRating
            ]);

            // Update booking to mark review as submitted
            await pool.query(`
                UPDATE bookings 
                SET review_submitted = true, review_submitted_at = CURRENT_TIMESTAMP 
                WHERE id = $1
            `, [bookingId]);

            console.log('✅ Review created successfully for booking:', bookingId);

            res.status(201).json({
                message: 'Review submitted successfully',
                review: reviewResult.rows[0],
                tutorName: booking.tutor_name
            });

        } catch (error) {
            console.error('❌ Error creating review:', error);
            res.status(500).json({
                error: 'Failed to submit review',
                details: error.message
            });
        }
    },

    // Get reviews for a tutor
    getTutorReviews: async (req, res) => {
        try {
            const { tutorId } = req.params;
            const { limit = 10, offset = 0, sortBy = 'created_at', order = 'DESC' } = req.query;

            console.log('🔍 getTutorReviews called for tutorId:', tutorId);

            const result = await pool.query(`
                SELECT 
                    r.*,
                    a.full_name as student_name,
                    b.subject,
                    b.booking_date,
                    b.start_time
                FROM reviews r
                JOIN accounts a ON r.student_id = a.id
                JOIN bookings b ON r.booking_id = b.id
                WHERE r.tutor_id = $1
                ORDER BY r.${sortBy} ${order}
                LIMIT $2 OFFSET $3
            `, [tutorId, limit, offset]);

            // Get review statistics
            const stats = await pool.query(`
                SELECT 
                    COUNT(*) as total_reviews,
                    ROUND(AVG(rating), 2) as average_rating,
                    COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
                    COUNT(*) FILTER (WHERE rating = 4) as four_star_count,
                    COUNT(*) FILTER (WHERE rating = 3) as three_star_count,
                    COUNT(*) FILTER (WHERE rating = 2) as two_star_count,
                    COUNT(*) FILTER (WHERE rating = 1) as one_star_count,
                    COUNT(*) FILTER (WHERE would_recommend = true) as recommendations,
                    ROUND(AVG(session_quality_rating), 2) as avg_session_quality,
                    ROUND(AVG(communication_rating), 2) as avg_communication,
                    ROUND(AVG(punctuality_rating), 2) as avg_punctuality,
                    ROUND(AVG(helpfulness_rating), 2) as avg_helpfulness
                FROM reviews 
                WHERE tutor_id = $1
            `, [tutorId]);

            res.json({
                reviews: result.rows,
                statistics: stats.rows[0],
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: parseInt(stats.rows[0].total_reviews)
                }
            });

        } catch (error) {
            console.error('❌ Error fetching tutor reviews:', error);
            res.status(500).json({
                error: 'Failed to fetch reviews',
                details: error.message
            });
        }
    },

    // Get student's submitted reviews
    getStudentReviews: async (req, res) => {
        try {
            const studentId = req.user?.id || 'cb38b155-c51a-4246-9bcc-1eaa4445c0e1'; // Mock student ID for testing
            const { limit = 10, offset = 0 } = req.query;

            console.log('🔍 getStudentReviews called for studentId:', studentId);

            const result = await pool.query(`
                SELECT 
                    r.*,
                    a.full_name as tutor_name,
                    b.subject,
                    b.booking_date,
                    b.start_time
                FROM reviews r
                JOIN accounts a ON r.tutor_id = a.id
                JOIN bookings b ON r.booking_id = b.id
                WHERE r.student_id = $1
                ORDER BY r.created_at DESC
                LIMIT $2 OFFSET $3
            `, [studentId, limit, offset]);

            const countResult = await pool.query(
                'SELECT COUNT(*) as total FROM reviews WHERE student_id = $1',
                [studentId]
            );

            res.json({
                reviews: result.rows,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: parseInt(countResult.rows[0].total)
                }
            });

        } catch (error) {
            console.error('❌ Error fetching student reviews:', error);
            res.status(500).json({
                error: 'Failed to fetch student reviews',
                details: error.message
            });
        }
    },

    // Get completed sessions that need reviews
    getSessionsNeedingReview: async (req, res) => {
        try {
            const studentId = req.user?.id || 'cb38b155-c51a-4246-9bcc-1eaa4445c0e1'; // Mock student ID for testing

            console.log('🔍 getSessionsNeedingReview called for studentId:', studentId);

            const result = await pool.query(`
                SELECT 
                    b.*,
                    a.full_name as tutor_name,
                    tp.rating as tutor_rating
                FROM bookings b
                JOIN accounts a ON b.tutor_id = a.id
                LEFT JOIN tutor_profiles tp ON b.tutor_id = tp.account_id
                WHERE b.student_id = $1 
                AND b.status = 'completed'
                AND b.review_submitted = false
                ORDER BY b.booking_date DESC, b.start_time DESC
            `, [studentId]);

            console.log(`📤 Found ${result.rows.length} sessions needing review`);

            res.json({
                sessions: result.rows.map(session => ({
                    id: session.id,
                    tutorId: session.tutor_id,
                    tutorName: session.tutor_name,
                    tutorRating: session.tutor_rating,
                    subject: session.subject,
                    date: session.booking_date,
                    startTime: session.start_time,
                    duration: session.duration_minutes,
                    totalAmount: session.total_amount,
                    meetingType: session.meeting_type,
                    location: session.location,
                    completedAt: session.updated_at
                }))
            });

        } catch (error) {
            console.error('❌ Error fetching sessions needing review:', error);
            res.status(500).json({
                error: 'Failed to fetch sessions needing review',
                details: error.message
            });
        }
    },

    // Update an existing review
    updateReview: async (req, res) => {
        try {
            const studentId = req.user?.id || 'cb38b155-c51a-4246-9bcc-1eaa4445c0e1'; // Mock student ID for testing
            const { reviewId } = req.params;
            const {
                rating,
                reviewText,
                wouldRecommend,
                sessionQualityRating,
                communicationRating,
                punctualityRating,
                helpfulnessRating
            } = req.body;

            console.log('🔍 updateReview called for reviewId:', reviewId);

            // Validate required fields
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    error: 'Rating is required and must be between 1 and 5'
                });
            }

            // Check if review exists and belongs to the student
            const reviewCheck = await pool.query(
                'SELECT * FROM reviews WHERE id = $1 AND student_id = $2',
                [reviewId, studentId]
            );

            if (reviewCheck.rows.length === 0) {
                return res.status(404).json({
                    error: 'Review not found or you do not have permission to update it'
                });
            }

            // Update the review
            const result = await pool.query(`
                UPDATE reviews 
                SET 
                    rating = $1,
                    review_text = $2,
                    would_recommend = $3,
                    session_quality_rating = $4,
                    communication_rating = $5,
                    punctuality_rating = $6,
                    helpfulness_rating = $7,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $8 AND student_id = $9
                RETURNING *
            `, [
                rating, reviewText, wouldRecommend,
                sessionQualityRating, communicationRating,
                punctualityRating, helpfulnessRating,
                reviewId, studentId
            ]);

            console.log('✅ Review updated successfully');

            res.json({
                message: 'Review updated successfully',
                review: result.rows[0]
            });

        } catch (error) {
            console.error('❌ Error updating review:', error);
            res.status(500).json({
                error: 'Failed to update review',
                details: error.message
            });
        }
    }
};

export default reviewController;