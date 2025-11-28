import pool from '../utils/database.js';

const bookingRequestController = {
    // Get pending booking requests for a tutor
    getPendingBookingRequests: async (req, res) => {
        try {
            const tutorId = req.user.userId; // From auth middleware

            const query = `
                SELECT 
                    br.*,
                    s.full_name as student_name,
                    s.email as student_email,
                    ta.subject,
                    ta.start_time,
                    ta.end_time,
                    ta.date
                FROM booking_requests br
                JOIN users s ON br.student_id = s.id
                JOIN tutor_availability ta ON br.availability_id = ta.id
                WHERE ta.tutor_id = $1 AND br.status = 'pending'
                ORDER BY br.created_at ASC
            `;

            const result = await pool.query(query, [tutorId]);

            const bookingRequests = result.rows.map(row => ({
                id: row.id,
                studentId: row.student_id,
                studentName: row.student_name,
                studentEmail: row.student_email,
                subject: row.subject,
                date: row.date,
                time: row.start_time,
                endTime: row.end_time,
                duration: row.duration || 60,
                notes: row.notes,
                status: row.status,
                createdAt: row.created_at
            }));

            res.json({
                success: true,
                bookingRequests
            });

        } catch (error) {
            console.error('Error fetching pending booking requests:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch booking requests',
                error: error.message
            });
        }
    },

    // Respond to a booking request (accept/decline)
    respondToBookingRequest: async (req, res) => {
        try {
            const { requestId } = req.params;
            const { action, responseMessage } = req.body;
            const tutorId = req.user.userId;

            // Validate action
            if (!['accept', 'decline'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Must be "accept" or "decline"'
                });
            }

            // Check if the booking request belongs to this tutor
            const checkQuery = `
                SELECT br.*, ta.tutor_id
                FROM booking_requests br
                JOIN tutor_availability ta ON br.availability_id = ta.id
                WHERE br.id = $1 AND ta.tutor_id = $2 AND br.status = 'pending'
            `;

            const checkResult = await pool.query(checkQuery, [requestId, tutorId]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking request not found or already processed'
                });
            }

            const bookingRequest = checkResult.rows[0];

            // Start transaction
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // Update booking request status
                const updateRequestQuery = `
                    UPDATE booking_requests 
                    SET status = $1, response_message = $2, responded_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `;

                await client.query(updateRequestQuery, [action === 'accept' ? 'accepted' : 'declined', responseMessage, requestId]);

                let bookingId = null;

                if (action === 'accept') {
                    // Create a booking entry
                    const createBookingQuery = `
                        INSERT INTO bookings (
                            student_id, 
                            tutor_id, 
                            availability_id,
                            subject, 
                            date, 
                            start_time, 
                            end_time,
                            duration,
                            status, 
                            notes,
                            created_at
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', $9, CURRENT_TIMESTAMP)
                        RETURNING id
                    `;

                    const bookingResult = await client.query(createBookingQuery, [
                        bookingRequest.student_id,
                        tutorId,
                        bookingRequest.availability_id,
                        bookingRequest.subject || 'General Tutoring',
                        bookingRequest.date,
                        bookingRequest.start_time,
                        bookingRequest.end_time,
                        bookingRequest.duration || 60,
                        bookingRequest.notes
                    ]);

                    bookingId = bookingResult.rows[0].id;

                    // Mark the availability slot as booked (optional - depends on your business logic)
                    const updateAvailabilityQuery = `
                        UPDATE tutor_availability 
                        SET is_booked = true, booking_id = $1
                        WHERE id = $2
                    `;

                    await client.query(updateAvailabilityQuery, [bookingId, bookingRequest.availability_id]);
                }

                // Create notification for student
                const createNotificationQuery = `
                    INSERT INTO notifications (
                        user_id, 
                        type, 
                        title, 
                        message, 
                        data,
                        created_at
                    )
                    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                `;

                const notificationTitle = action === 'accept'
                    ? 'Booking Request Accepted!'
                    : 'Booking Request Declined';

                const notificationMessage = action === 'accept'
                    ? `Your tutoring session has been confirmed${responseMessage ? ': ' + responseMessage : ''}`
                    : `Your booking request was declined${responseMessage ? ': ' + responseMessage : ''}`;

                await client.query(createNotificationQuery, [
                    bookingRequest.student_id,
                    'booking_response',
                    notificationTitle,
                    notificationMessage,
                    JSON.stringify({
                        requestId: parseInt(requestId),
                        action,
                        bookingId,
                        responseMessage
                    })
                ]);

                await client.query('COMMIT');

                res.json({
                    success: true,
                    message: `Booking request ${action}ed successfully`,
                    bookingId,
                    action
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error(`Error ${req.body.action}ing booking request:`, error);
            res.status(500).json({
                success: false,
                message: `Failed to ${req.body.action} booking request`,
                error: error.message
            });
        }
    },

    // Create a new booking request
    createBookingRequest: async (req, res) => {
        try {
            const studentId = req.user.userId;
            const { availabilityId, notes, duration } = req.body;

            // Check if availability slot exists and is not booked
            const availabilityQuery = `
                SELECT ta.*, u.full_name as tutor_name
                FROM tutor_availability ta
                JOIN users u ON ta.tutor_id = u.id
                WHERE ta.id = $1 AND ta.is_available = true AND ta.is_booked = false
            `;

            const availabilityResult = await pool.query(availabilityQuery, [availabilityId]);

            if (availabilityResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Availability slot not found or already booked'
                });
            }

            const availability = availabilityResult.rows[0];

            // Check if student already has a pending request for this slot
            const existingRequestQuery = `
                SELECT id FROM booking_requests 
                WHERE student_id = $1 AND availability_id = $2 AND status = 'pending'
            `;

            const existingResult = await pool.query(existingRequestQuery, [studentId, availabilityId]);

            if (existingResult.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have a pending request for this time slot'
                });
            }

            // Create booking request
            const createRequestQuery = `
                INSERT INTO booking_requests (
                    student_id, 
                    availability_id, 
                    notes, 
                    duration,
                    status,
                    created_at
                )
                VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)
                RETURNING id
            `;

            const result = await pool.query(createRequestQuery, [
                studentId,
                availabilityId,
                notes || '',
                duration || 60
            ]);

            const requestId = result.rows[0].id;

            // Create notification for tutor
            const notificationQuery = `
                INSERT INTO notifications (
                    user_id, 
                    type, 
                    title, 
                    message, 
                    data,
                    created_at
                )
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            `;

            await pool.query(notificationQuery, [
                availability.tutor_id,
                'booking_request',
                'New Booking Request',
                `${req.user.full_name} wants to book a session`,
                JSON.stringify({
                    requestId,
                    studentId,
                    availabilityId,
                    studentName: req.user.full_name
                })
            ]);

            res.status(201).json({
                success: true,
                message: 'Booking request created successfully',
                requestId,
                tutorName: availability.tutor_name
            });

        } catch (error) {
            console.error('Error creating booking request:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create booking request',
                error: error.message
            });
        }
    }
};

export default bookingRequestController;