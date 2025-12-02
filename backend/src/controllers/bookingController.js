import { pool } from '../../config/database.js';

// Helper function to add hours to time string
const addHours = (timeString, hours) => {
    const [hourStr, minuteStr] = timeString.split(':');
    const hour = parseInt(hourStr) + hours;
    const minute = parseInt(minuteStr);

    if (hour >= 24) {
        return '24:00:00'; // End of day
    }

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
};

const bookingController = {
    // Test endpoint
    testEndpoint: async (req, res) => {
        res.json({ message: 'Test endpoint working', tutorId: req.params.tutorId });
    },

    // Get tutor availability
    getTutorAvailability: async (req, res) => {
        try {
            console.log('🔍 getTutorAvailability called with tutorId:', req.params.tutorId);
            const { tutorId } = req.params;
            const { date } = req.query; // Optional date filter

            let query = `
                SELECT 
                    tp.available_days,
                    a.full_name as tutor_name
                FROM tutor_profiles tp
                JOIN accounts a ON tp.account_id = a.id
                WHERE tp.account_id = $1
            `;

            console.log('📋 Executing query with tutorId:', tutorId);
            const result = await pool.query(query, [tutorId]);
            console.log('📊 Query result rows:', result.rows.length);

            if (result.rows.length === 0) {
                console.log('❌ Tutor not found');
                return res.status(404).json({
                    success: false,
                    message: 'Tutor not found'
                });
            }

            const tutorData = result.rows[0];
            const availableDays = tutorData.available_days || [];
            const availabilityByDay = {};

            console.log('📅 Available days:', availableDays);

            // Create availability structure for frontend compatibility
            // Each available day has hourly slots from 9:00 AM - 5:00 PM (9 hours)
            availableDays.forEach(day => {
                const daySlots = [];
                // Generate hourly slots from 9 AM to 5 PM
                for (let hour = 9; hour < 17; hour++) {
                    const startTime = `${hour.toString().padStart(2, '0')}:00`;
                    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                    daySlots.push({
                        startTime: startTime,
                        endTime: endTime
                    });
                }
                availabilityByDay[day] = daySlots;
            });

            const responseData = {
                tutorId: tutorId,
                tutorName: tutorData.tutor_name || 'Unknown',
                availability: availabilityByDay,
                availableDays: availableDays,
                defaultHours: { start: '09:00', end: '17:00' }
            };

            console.log('✅ Returning availability data:', JSON.stringify(responseData, null, 2));
            res.json(responseData);

        } catch (error) {
            console.error('❌ Error fetching tutor availability:', error);
            res.status(500).json({
                error: 'Failed to fetch tutor availability',
                details: error.message
            });
        }
    },

    // Create a booking request (first step in booking process)
    createBookingRequest: async (req, res) => {
        try {
            const { tutorId, bookingDate, startTime, endTime, sessionType, notes, meetingType, meetingLink, location } = req.body;

            // Require authentication
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const studentId = req.user.userId;

            // Validate required fields
            if (!tutorId || !bookingDate || !startTime || !endTime) {
                return res.status(400).json({
                    error: 'Missing required fields: tutorId, bookingDate, startTime, endTime'
                });
            }

            // Validate meeting type
            const validMeetingTypes = ['virtual', 'in_person'];
            const finalMeetingType = meetingType && validMeetingTypes.includes(meetingType) ? meetingType : 'virtual';

            // Validate location for in-person meetings
            if (finalMeetingType === 'in_person' && (!location || !location.trim())) {
                return res.status(400).json({
                    error: 'Location is required for in-person meetings'
                });
            }

            // Get tutor details and rate
            const tutorQuery = `
                SELECT tp.hourly_rate, a.full_name as tutor_name, a.email as tutor_email
                FROM tutor_profiles tp
                JOIN accounts a ON tp.account_id = a.id
                WHERE a.id = $1
            `;
            const tutorResult = await pool.query(tutorQuery, [tutorId]);

            if (tutorResult.rows.length === 0) {
                return res.status(404).json({ error: 'Tutor not found' });
            }

            const { hourly_rate, tutor_name, tutor_email } = tutorResult.rows[0];

            // Calculate session duration
            const start = new Date(`${bookingDate} ${startTime}`);
            const end = new Date(`${bookingDate} ${endTime}`);
            const durationMinutes = (end - start) / (1000 * 60);

            // Check for existing bookings that might conflict
            const conflictCheck = `
                SELECT id FROM bookings 
                WHERE tutor_id = $1 AND booking_date = $2 
                AND status IN ('scheduled', 'pending')
                AND (
                    (start_time <= $3 AND end_time > $3) OR
                    (start_time < $4 AND end_time >= $4) OR
                    (start_time >= $3 AND end_time <= $4)
                )
            `;

            const conflictResult = await pool.query(conflictCheck, [
                tutorId, bookingDate, startTime, endTime
            ]);

            if (conflictResult.rows.length > 0) {
                return res.status(400).json({
                    error: 'Time slot is already booked or has a pending booking'
                });
            }

            // Calculate total amount
            const totalAmount = (hourly_rate * durationMinutes / 60).toFixed(2);

            // Determine the location/meeting link based on meeting type
            const meetingLocation = finalMeetingType === 'in_person' ? location : (meetingLink || null);

            // Create the booking request directly in bookings table with pending status
            const insertRequest = `
                INSERT INTO bookings (
                    student_id, tutor_id, booking_date, start_time, end_time,
                    duration_minutes, subject, session_type, meeting_type, location, 
                    hourly_rate, total_amount, student_notes, status, payment_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', 'pending')
                RETURNING *
            `;

            const requestResult = await pool.query(insertRequest, [
                studentId,                              // student_id
                tutorId,                                // tutor_id  
                bookingDate,                            // booking_date
                startTime,                              // start_time
                endTime,                                // end_time
                durationMinutes,                        // duration_minutes
                req.body.subject || 'General',         // subject
                sessionType || 'general',              // session_type
                finalMeetingType,                       // meeting_type
                meetingLocation,                        // location (stores meeting link for virtual)
                hourly_rate,                            // hourly_rate
                totalAmount,                            // total_amount
                notes || ''                             // student_notes
            ]);

            const request = requestResult.rows[0];

            res.status(201).json({
                message: 'Booking request sent successfully! The tutor will review and respond.',
                request: {
                    id: request.id,
                    tutorName: tutor_name,
                    date: bookingDate,
                    startTime: startTime,
                    endTime: endTime,
                    duration: durationMinutes / 60,
                    sessionType: sessionType || 'general',
                    meetingType: finalMeetingType,
                    meetingLink: finalMeetingType === 'virtual' ? meetingLocation : null,
                    location: finalMeetingType === 'in_person' ? meetingLocation : null,
                    notes: notes || '',
                    status: request.status,
                    createdAt: request.created_at
                }
            });

        } catch (error) {
            console.error('Error creating booking request:', error);
            res.status(500).json({
                error: 'Failed to create booking request',
                details: error.message
            });
        }
    },

    // Legacy createBooking method - now creates request instead
    createBooking: async (req, res) => {
        // Redirect to booking request creation for now
        return bookingController.createBookingRequest(req, res);
    },

    // Get tutor's pending booking requests
    getTutorBookingRequests: async (req, res) => {
        try {
            // Require authentication
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const tutorId = req.user.userId;
            const { status = 'pending', limit = 10, offset = 0 } = req.query;

            const query = `
                SELECT 
                    b.*,
                    a.full_name as student_name,
                    a.email as student_email,
                    a.profile_image as student_avatar
                FROM bookings b
                JOIN accounts a ON b.student_id = a.id
                WHERE b.tutor_id = $1
                AND b.status = $2
                ORDER BY b.created_at DESC
                LIMIT $3 OFFSET $4
            `;

            const result = await pool.query(query, [tutorId, status, limit, offset]);

            const requests = result.rows.map(request => {
                return {
                    id: request.id,
                    studentId: request.student_id,
                    studentName: request.student_name,
                    studentEmail: request.student_email,
                    studentAvatar: request.student_avatar,
                    tutorId: request.tutor_id,
                    availabilityId: request.availability_id,
                    date: request.booking_date,
                    startTime: request.start_time,
                    endTime: request.end_time,
                    duration: request.duration_minutes / 60, // Convert minutes to hours
                    sessionType: request.session_type,
                    subject: request.subject,
                    meetingType: request.meeting_type,
                    location: request.location,
                    notes: request.student_notes,
                    hourlyRate: parseFloat(request.hourly_rate),
                    totalAmount: parseFloat(request.total_amount),
                    status: request.status,
                    responseMessage: request.tutor_response_message,
                    createdAt: request.created_at,
                    respondedAt: request.responded_at
                };
            });

            res.json({
                requests,
                total: requests.length,
                hasMore: requests.length === parseInt(limit)
            });

        } catch (error) {
            console.error('Error fetching tutor booking requests:', error);
            res.status(500).json({
                error: 'Failed to fetch booking requests',
                details: error.message
            });
        }
    },

    // Respond to a booking request (approve or decline)
    respondToBookingRequest: async (req, res) => {
        try {
            console.log('🎯 respondToBookingRequest called');
            console.log('📝 Request params:', req.params);
            console.log('📝 Request body:', req.body);

            const { requestId } = req.params;
            const { action, responseMessage } = req.body; // action: 'accept' or 'decline'

            // Require authentication
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const tutorId = req.user.userId;

            console.log('📝 Using tutor ID:', tutorId);
            console.log('📝 Action:', action);

            if (!['accept', 'decline'].includes(action)) {
                console.log('❌ Invalid action provided:', action);
                return res.status(400).json({
                    error: 'Invalid action. Must be "accept" or "decline"'
                });
            }

            // Get the pending booking details
            const bookingQuery = `
                SELECT * FROM bookings 
                WHERE id = $1 AND tutor_id = $2 AND status = 'pending'
            `;
            const bookingResult = await pool.query(bookingQuery, [requestId, tutorId]);

            if (bookingResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Booking request not found or already processed'
                });
            }

            const booking = bookingResult.rows[0];

            if (action === 'accept') {
                // Update booking status to scheduled
                const updateQuery = `
                    UPDATE bookings 
                    SET status = 'scheduled', 
                        tutor_response_message = $1, 
                        responded_at = NOW(),
                        updated_at = NOW()
                    WHERE id = $2
                    RETURNING *
                `;

                const result = await pool.query(updateQuery, [
                    responseMessage || 'Booking accepted',
                    requestId
                ]);

                const updatedBooking = result.rows[0];

                // Mark the availability slot as booked if applicable
                if (booking.availability_id) {
                    await pool.query(
                        'UPDATE tutor_availability SET is_booked = TRUE, booking_id = $1 WHERE id = $2',
                        [requestId, booking.availability_id]
                    );
                }

                res.json({
                    message: 'Booking request accepted and session scheduled!',
                    booking: {
                        id: updatedBooking.id,
                        date: updatedBooking.booking_date,
                        startTime: updatedBooking.start_time,
                        endTime: updatedBooking.end_time,
                        status: updatedBooking.status,
                        subject: updatedBooking.subject,
                        totalAmount: updatedBooking.total_amount
                    }
                });
            } else {
                // Decline the request
                await pool.query(
                    'UPDATE bookings SET status = $1, tutor_response_message = $2, responded_at = NOW(), updated_at = NOW() WHERE id = $3',
                    ['rejected', responseMessage || 'Booking declined', requestId]
                );

                res.json({
                    message: 'Booking request declined',
                    requestId: requestId
                });
            }

        } catch (error) {
            console.error('Error responding to booking request:', error);
            res.status(500).json({
                error: 'Failed to respond to booking request',
                details: error.message
            });
        }
    },

    // Get student's booking requests
    getStudentBookingRequests: async (req, res) => {
        try {
            const studentId = req.user.userId;
            const { status, limit = 10, offset = 0 } = req.query;

            let query = `
                SELECT 
                    br.*,
                    a.full_name as tutor_name,
                    a.email as tutor_email
                FROM booking_requests br
                JOIN accounts a ON SUBSTRING(br.availability_id FROM 1 FOR 36)::uuid = a.id
                WHERE br.student_id = $1
            `;

            const queryParams = [studentId];

            if (status) {
                query += ` AND br.status = $${queryParams.length + 1}`;
                queryParams.push(status);
            }

            query += ` ORDER BY br.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(query, queryParams);

            const requests = result.rows.map(request => {
                let bookingDetails = {};
                try {
                    bookingDetails = JSON.parse(request.notes);
                } catch (e) {
                    console.error('Error parsing booking details:', e);
                }

                return {
                    id: request.id,
                    tutorName: request.tutor_name,
                    tutorEmail: request.tutor_email,
                    date: bookingDetails.bookingDate,
                    startTime: bookingDetails.startTime,
                    endTime: bookingDetails.endTime,
                    duration: request.duration / 60,
                    sessionType: bookingDetails.sessionType,
                    subject: bookingDetails.subject || 'General',
                    meetingType: bookingDetails.meetingType,
                    location: bookingDetails.location,
                    notes: bookingDetails.notes,
                    status: request.status,
                    responseMessage: request.response_message,
                    createdAt: request.created_at,
                    respondedAt: request.responded_at
                };
            });

            res.json({
                requests,
                total: requests.length,
                hasMore: requests.length === parseInt(limit)
            });

        } catch (error) {
            console.error('Error fetching student booking requests:', error);
            res.status(500).json({
                error: 'Failed to fetch booking requests',
                details: error.message
            });
        }
    },

    // Get student's bookings"}
    getStudentBookings: async (req, res) => {
        try {
            // Require authentication
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const studentId = req.user.userId;
            console.log('🔍 getStudentBookings called with studentId:', studentId);
            const { status, limit = 10, offset = 0 } = req.query;

            let query = `
                SELECT 
                    b.*,
                    a.full_name as tutor_name,
                    a.email as tutor_email,
                    a.profile_image as tutor_avatar,
                    r.id as review_id,
                    r.rating,
                    r.review_text,
                    r.would_recommend,
                    r.created_at as review_date
                FROM bookings b
                JOIN accounts a ON b.tutor_id = a.id
                LEFT JOIN tutor_profiles tp ON b.tutor_id = tp.account_id
                LEFT JOIN reviews r ON b.id = r.booking_id
                WHERE b.student_id = $1
            `;

            const queryParams = [studentId];

            if (status) {
                query += ` AND b.status = $${queryParams.length + 1}`;
                queryParams.push(status);
            }

            query += ` ORDER BY b.booking_date DESC, b.start_time DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(query, queryParams);

            const bookings = result.rows.map(booking => {
                // Format booking_date to YYYY-MM-DD for calendar compatibility
                // Use local date parts to avoid timezone shift issues
                const bookingDate = new Date(booking.booking_date);
                const year = bookingDate.getFullYear();
                const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
                const day = String(bookingDate.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                // For virtual meetings, location field stores the meeting link
                const meetingType = booking.meeting_type || 'virtual';
                const isVirtual = meetingType === 'virtual';

                return {
                    id: booking.id,
                    tutorId: booking.tutor_id,
                    tutorName: booking.tutor_name,
                    tutorEmail: booking.tutor_email,
                    tutorAvatar: booking.tutor_avatar,
                    date: formattedDate,
                    startTime: booking.start_time,
                    endTime: booking.end_time,
                    duration: booking.duration_minutes / 60, // Convert minutes to hours for display
                    totalAmount: booking.total_amount,
                    subject: booking.subject,
                    sessionType: booking.subject, // Use subject field
                    meetingType: meetingType,
                    meetingLink: isVirtual ? booking.location : null,
                    location: !isVirtual ? booking.location : null,
                    status: booking.status,
                    notes: booking.message, // Use message field
                    reviewSubmitted: !!booking.review_id,
                    review: booking.review_id ? {
                        id: booking.review_id,
                        rating: booking.rating,
                        reviewText: booking.review_text,
                        wouldRecommend: booking.would_recommend,
                        reviewDate: booking.review_date
                    } : null,
                    createdAt: booking.created_at,
                    updatedAt: booking.updated_at
                };
            });

            res.json({
                bookings,
                totalCount: result.rows.length
            });

        } catch (error) {
            console.error('Error fetching student bookings:', error);
            res.status(500).json({
                error: 'Failed to fetch bookings',
                details: error.message
            });
        }
    },

    // Get tutor's bookings
    getTutorBookings: async (req, res) => {
        try {
            // Require authentication
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const tutorId = req.user.userId;
            console.log('🔍 getTutorBookings called with tutorId:', tutorId);
            const { status, limit = 10, offset = 0 } = req.query;

            let query = `
                SELECT 
                    b.*,
                    a.full_name as student_name,
                    a.email as student_email,
                    r.id as review_id,
                    r.rating,
                    r.review_text,
                    r.would_recommend,
                    r.created_at as review_date
                FROM bookings b
                JOIN accounts a ON b.student_id = a.id
                LEFT JOIN reviews r ON b.id = r.booking_id
                WHERE b.tutor_id = $1
            `;

            const queryParams = [tutorId];

            if (status) {
                query += ` AND b.status = $${queryParams.length + 1}`;
                queryParams.push(status);
            }

            query += ` ORDER BY b.booking_date ASC, b.start_time ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(query, queryParams);

            const bookings = result.rows.map(booking => {
                // Format booking_date to YYYY-MM-DD for calendar compatibility
                // Use local date parts to avoid timezone shift issues
                const bookingDate = new Date(booking.booking_date);
                const year = bookingDate.getFullYear();
                const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
                const day = String(bookingDate.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                return {
                    id: booking.id,
                    studentId: booking.student_id,
                    studentName: booking.student_name,
                    studentEmail: booking.student_email,
                    date: formattedDate,
                    startTime: booking.start_time,
                    endTime: booking.end_time,
                    duration: booking.duration_minutes ? booking.duration_minutes / 60 : booking.duration_hours,
                    totalAmount: booking.total_amount,
                    subject: booking.subject,
                    sessionType: booking.subject || booking.session_type,
                    meetingType: booking.meeting_type || 'virtual',
                    location: booking.location,
                    status: booking.status,
                    notes: booking.message || booking.notes,
                    reviewSubmitted: !!booking.review_id,
                    review: booking.review_id ? {
                        id: booking.review_id,
                        rating: booking.rating,
                        reviewText: booking.review_text,
                        wouldRecommend: booking.would_recommend,
                        reviewDate: booking.review_date
                    } : null,
                    createdAt: booking.created_at,
                    updatedAt: booking.updated_at
                };
            });

            console.log(`📤 getTutorBookings sending ${bookings.length} bookings:`, bookings.map(b => ({
                id: b.id, date: b.date, subject: b.subject, studentName: b.studentName
            })));

            res.json({
                bookings,
                totalCount: result.rows.length
            });

        } catch (error) {
            console.error('Error fetching tutor bookings:', error);
            res.status(500).json({
                error: 'Failed to fetch bookings',
                details: error.message
            });
        }
    },

    // Update booking status
    updateBookingStatus: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { status, notes } = req.body;
            const userId = req.user.userId;

            // Valid statuses
            const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
                });
            }

            // Check if user has permission to update this booking
            const permissionCheck = `
                SELECT b.*, a1.full_name as student_name, a2.full_name as tutor_name
                FROM bookings b
                JOIN accounts a1 ON b.student_id = a1.id
                JOIN accounts a2 ON b.tutor_id = a2.id
                WHERE b.id = $1 AND (b.student_id = $2 OR b.tutor_id = $2)
            `;

            const permissionResult = await pool.query(permissionCheck, [bookingId, userId]);

            if (permissionResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Booking not found or you do not have permission to update it'
                });
            }

            const booking = permissionResult.rows[0];

            // Update the booking
            const updateQuery = `
                UPDATE bookings 
                SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `;

            const updateResult = await pool.query(updateQuery, [status, notes, bookingId]);
            const updatedBooking = updateResult.rows[0];

            res.json({
                message: 'Booking updated successfully',
                booking: {
                    id: updatedBooking.id,
                    studentName: booking.student_name,
                    tutorName: booking.tutor_name,
                    date: updatedBooking.booking_date,
                    startTime: updatedBooking.start_time,
                    endTime: updatedBooking.end_time,
                    meetingType: updatedBooking.meeting_type,
                    location: updatedBooking.location,
                    status: updatedBooking.status,
                    notes: updatedBooking.message || updatedBooking.notes,
                    updatedAt: updatedBooking.updated_at
                }
            });

        } catch (error) {
            console.error('Error updating booking:', error);
            res.status(500).json({
                error: 'Failed to update booking',
                details: error.message
            });
        }
    },

    // Mark session as complete (for both tutors and students after session end time)
    markSessionComplete: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { completionNotes } = req.body;
            const userId = req.user?.userId || req.user?.id || req.headers['user-id']; // Support both auth methods

            console.log('🎯 markSessionComplete called:', { bookingId, userId, completionNotes, reqUser: req.user });

            if (!userId) {
                console.error('❌ No userId found in request');
                return res.status(401).json({
                    error: 'User authentication required',
                    details: 'No user ID found in token'
                });
            }

            // Get booking details and verify user permission
            const bookingQuery = `
                SELECT b.*, a1.full_name as student_name, a2.full_name as tutor_name
                FROM bookings b
                JOIN accounts a1 ON b.student_id = a1.id
                JOIN accounts a2 ON b.tutor_id = a2.id
                WHERE b.id = $1 AND (b.student_id = $2 OR b.tutor_id = $2)
            `;

            console.log('🔍 Querying booking with:', { bookingId, userId });
            const bookingResult = await pool.query(bookingQuery, [bookingId, userId]);
            console.log('📊 Booking query result rows:', bookingResult.rows.length);

            if (bookingResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Booking not found or you do not have permission to mark it complete',
                    details: { bookingId, userId }
                });
            }

            const booking = bookingResult.rows[0];

            // Check if session is in the right status
            if (!['scheduled', 'confirmed'].includes(booking.status)) {
                return res.status(400).json({
                    error: `Cannot mark session as complete. Current status: ${booking.status}`
                });
            }

            // Check if session end time has passed
            const sessionEndTime = new Date(`${booking.booking_date}T${booking.end_time}`);
            const now = new Date();

            if (now < sessionEndTime) {
                return res.status(400).json({
                    error: 'Cannot mark session as complete before the scheduled end time',
                    sessionEndTime: sessionEndTime.toISOString(),
                    currentTime: now.toISOString()
                });
            }

            // Update booking status to completed
            const updateQuery = `
                UPDATE bookings 
                SET status = 'completed', 
                    session_notes = COALESCE($1, session_notes),
                    completed_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            const updateResult = await pool.query(updateQuery, [completionNotes, bookingId]);
            const updatedBooking = updateResult.rows[0];

            console.log('✅ Session marked as complete:', updatedBooking.id);

            res.json({
                message: 'Session marked as complete successfully',
                booking: {
                    id: updatedBooking.id,
                    studentName: booking.student_name,
                    tutorName: booking.tutor_name,
                    date: updatedBooking.booking_date,
                    startTime: updatedBooking.start_time,
                    endTime: updatedBooking.end_time,
                    subject: updatedBooking.subject,
                    status: updatedBooking.status,
                    completedAt: updatedBooking.completed_at,
                    sessionNotes: updatedBooking.session_notes,
                    totalAmount: updatedBooking.total_amount
                }
            });

        } catch (error) {
            console.error('❌ Error marking session complete:', error);
            res.status(500).json({
                error: 'Failed to mark session as complete',
                details: error.message
            });
        }
    },

    // Get tutor sessions formatted for dashboard
    getTutorSessions: async (req, res) => {
        try {
            // Require authentication
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const tutorId = req.user.userId;
            console.log('🔍 getTutorSessions called with tutorId:', tutorId);

            const query = `
                SELECT 
                    b.*,
                    a.full_name as student_name,
                    a.email as student_email
                FROM bookings b
                JOIN accounts a ON b.student_id = a.id
                WHERE b.tutor_id = $1
                ORDER BY 
                    CASE 
                        WHEN b.booking_date = CURRENT_DATE THEN 1
                        WHEN b.booking_date > CURRENT_DATE THEN 2
                        ELSE 3
                    END,
                    b.booking_date ASC, 
                    b.start_time ASC
            `;

            console.log('🔍 Executing query:', query);
            console.log('🔍 Query params:', [tutorId]);
            const result = await pool.query(query, [tutorId]);
            console.log('✅ Query result rows:', result.rows.length);

            const sessions = result.rows.map(booking => {
                // Format booking_date to YYYY-MM-DD for calendar compatibility
                // Use local date parts to avoid timezone shift issues
                const bookingDate = new Date(booking.booking_date);
                const year = bookingDate.getFullYear();
                const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
                const day = String(bookingDate.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                // For virtual meetings, location field stores the meeting link
                const meetingType = booking.meeting_type || 'virtual';
                const isVirtual = meetingType === 'virtual';

                return {
                    id: `session-${booking.id}`,
                    studentId: booking.student_id,
                    studentName: booking.student_name,
                    studentAvatar: '/api/placeholder/40/40',
                    subject: booking.subject || 'General Tutoring',
                    topic: booking.message || 'General session',
                    date: formattedDate,
                    time: booking.start_time,
                    duration: booking.duration_minutes || Math.round((new Date(`2000-01-01 ${booking.end_time}`) - new Date(`2000-01-01 ${booking.start_time}`)) / 60000),
                    status: booking.status === 'confirmed' ? 'scheduled' : booking.status,
                    notes: booking.message || booking.notes || '',
                    meetingLink: isVirtual ? booking.location : null,
                    meetingType: meetingType,
                    location: !isVirtual ? booking.location : null
                };
            });

            console.log('📤 Sending response with sessions:', sessions.length);
            res.json({
                sessions,
                totalCount: sessions.length
            });

        } catch (error) {
            console.error('❌ Error fetching tutor sessions:', error);
            console.error('❌ Error stack:', error.stack);
            res.status(500).json({
                error: 'Failed to fetch sessions',
                details: error.message
            });
        }
    },

    // Reschedule a booking
    rescheduleBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { newDate, newStartTime, newEndTime, reason } = req.body;
            const userId = req.user.userId;

            console.log('Reschedule request:', { bookingId, newDate, newStartTime, newEndTime, reason, userId });

            // Validate required fields
            if (!newDate || !newStartTime || !newEndTime) {
                return res.status(400).json({
                    error: 'New date, start time, and end time are required'
                });
            }

            // Check if user has permission to reschedule this booking (must be student)
            const permissionCheck = `
                SELECT b.*, a1.full_name as student_name, a2.full_name as tutor_name
                FROM bookings b
                JOIN accounts a1 ON b.student_id = a1.id
                JOIN accounts a2 ON b.tutor_id = a2.id
                WHERE b.id = $1 AND b.student_id = $2
            `;

            const permissionResult = await pool.query(permissionCheck, [bookingId, userId]);

            if (permissionResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Booking not found or you do not have permission to reschedule it'
                });
            }

            const booking = permissionResult.rows[0];
            console.log('Found booking:', booking);

            // Check if the booking is in a state that allows rescheduling
            if (!['pending', 'confirmed', 'scheduled'].includes(booking.status)) {
                return res.status(400).json({
                    error: `This booking cannot be rescheduled (current status: ${booking.status})`
                });
            }

            // Update the booking directly without complex validation for now
            const updateQuery = `
                UPDATE bookings 
                SET 
                    booking_date = $1, 
                    start_time = $2, 
                    end_time = $3,
                    message = COALESCE($4, message),
                    status = 'reschedule_pending',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING *
            `;

            const updateResult = await pool.query(updateQuery, [
                newDate, newStartTime, newEndTime, reason || '', bookingId
            ]);
            
            if (updateResult.rows.length === 0) {
                return res.status(500).json({
                    error: 'Failed to update booking'
                });
            }
            
            const updatedBooking = updateResult.rows[0];
            console.log('Updated booking:', updatedBooking);

            res.json({
                success: true,
                message: 'Reschedule request sent to tutor successfully',
                booking: {
                    id: updatedBooking.id,
                    newDate: updatedBooking.booking_date,
                    newStartTime: updatedBooking.start_time,
                    newEndTime: updatedBooking.end_time,
                    status: updatedBooking.status,
                    reason: updatedBooking.message,
                    studentName: booking.student_name,
                    tutorName: booking.tutor_name,
                    updatedAt: updatedBooking.updated_at
                }
            });

        } catch (error) {
            console.error('Error rescheduling booking:', error);
            res.status(500).json({
                error: 'Failed to reschedule booking',
                details: error.message
            });
        }
    },

    // Cancel a booking
    cancelBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { reason } = req.body;
            const userId = req.user.userId;

            // Check if user has permission to cancel this booking (must be student)
            const permissionCheck = `
                SELECT b.*, a1.full_name as student_name, a2.full_name as tutor_name
                FROM bookings b
                JOIN accounts a1 ON b.student_id = a1.id
                JOIN accounts a2 ON b.tutor_id = a2.id
                WHERE b.id = $1 AND b.student_id = $2
            `;

            const permissionResult = await pool.query(permissionCheck, [bookingId, userId]);

            if (permissionResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Booking not found or you do not have permission to cancel it'
                });
            }

            const booking = permissionResult.rows[0];

            // Check if the booking is in a state that allows cancellation
            if (!['pending', 'scheduled'].includes(booking.status)) {
                return res.status(400).json({
                    error: 'This booking cannot be cancelled in its current status'
                });
            }

            // Update booking status to cancelled
            const updateQuery = `
                UPDATE bookings 
                SET 
                    status = 'cancelled',
                    student_notes = COALESCE($1, student_notes),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            const updateResult = await pool.query(updateQuery, [reason, bookingId]);
            const cancelledBooking = updateResult.rows[0];

            // TODO: Send notification to tutor about cancellation
            // TODO: Process refund based on cancellation policy

            res.json({
                success: true,
                message: 'Booking cancelled successfully. Tutor has been notified.',
                booking: {
                    id: cancelledBooking.id,
                    status: cancelledBooking.status,
                    cancelledAt: cancelledBooking.updated_at,
                    cancelReason: cancelledBooking.student_notes,
                    studentName: booking.student_name,
                    tutorName: booking.tutor_name
                }
            });

        } catch (error) {
            console.error('Error cancelling booking:', error);
            res.status(500).json({
                error: 'Failed to cancel booking',
                details: error.message
            });
        }
    },

    // Cancel booking as tutor
    cancelBookingAsTutor: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { reason } = req.body;

            // Require authentication
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const tutorId = req.user.userId;

            // Check if user has permission to cancel this booking (must be tutor)
            const permissionCheck = `
                SELECT b.*, a1.full_name as student_name, a2.full_name as tutor_name
                FROM bookings b
                JOIN accounts a1 ON b.student_id = a1.id
                JOIN accounts a2 ON b.tutor_id = a2.id
                WHERE b.id = $1 AND b.tutor_id = $2
            `;

            const permissionResult = await pool.query(permissionCheck, [bookingId, tutorId]);

            if (permissionResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Booking not found or you do not have permission to cancel it'
                });
            }

            const booking = permissionResult.rows[0];

            // Check if the booking is in a state that allows cancellation
            if (!['pending', 'scheduled'].includes(booking.status)) {
                return res.status(400).json({
                    error: 'This booking cannot be cancelled in its current status'
                });
            }

            // Update booking status to cancelled
            const updateQuery = `
                UPDATE bookings 
                SET 
                    status = 'cancelled',
                    tutor_response_message = COALESCE($1, tutor_response_message),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            const updateResult = await pool.query(updateQuery, [reason, bookingId]);
            const cancelledBooking = updateResult.rows[0];

            res.json({
                success: true,
                message: 'Booking cancelled successfully. Student has been notified.',
                booking: {
                    id: cancelledBooking.id,
                    status: cancelledBooking.status,
                    cancelledAt: cancelledBooking.updated_at,
                    cancelReason: reason,
                    studentName: booking.student_name,
                    tutorName: booking.tutor_name
                }
            });

        } catch (error) {
            console.error('Error cancelling booking as tutor:', error);
            res.status(500).json({
                error: 'Failed to cancel booking',
                details: error.message
            });
        }
    },

    // Get available slots for rescheduling
    getAvailableRescheduleSlots: async (req, res) => {
        try {
            const { tutorId } = req.params;
            const { date, excludeBooking } = req.query;

            // Get tutor's availability
            const availabilityQuery = `
                SELECT available_days
                FROM tutor_profiles 
                WHERE account_id = $1
            `;

            const availabilityResult = await pool.query(availabilityQuery, [tutorId]);

            if (availabilityResult.rows.length === 0) {
                return res.json({
                    tutorId,
                    availableSlots: []
                });
            }

            const availableDays = availabilityResult.rows[0].available_days || [];

            // Generate available slots for the next 14 days
            const slots = [];
            const today = new Date();

            for (let i = 1; i <= 14; i++) { // Start from tomorrow
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);

                const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
                const dateString = currentDate.toISOString().split('T')[0];

                // Check if tutor is available on this day
                if (availableDays.includes(dayName)) {
                    // Check for existing bookings on this date (excluding the booking being rescheduled)
                    let existingBookingsQuery = `
                        SELECT start_time, end_time 
                        FROM bookings 
                        WHERE tutor_id = $1 
                        AND booking_date = $2 
                        AND status IN ('confirmed', 'pending')
                    `;

                    const queryParams = [tutorId, dateString];

                    if (excludeBooking) {
                        existingBookingsQuery += ` AND id != $3`;
                        queryParams.push(excludeBooking);
                    }

                    const existingBookings = await pool.query(existingBookingsQuery, queryParams);

                    // Generate time slots for this day (9 AM - 5 PM)
                    const daySlots = [];
                    const startTime = '09:00:00';
                    const endTime = '17:00:00';

                    // Generate 1-hour slots within availability window
                    let currentHour = 9;
                    while (currentHour < 17) {
                        const slotStart = `${currentHour.toString().padStart(2, '0')}:00:00`;
                        const slotEnd = `${(currentHour + 1).toString().padStart(2, '0')}:00:00`;
                        // Check for conflicts with existing bookings
                        const hasConflict = existingBookings.rows.some(booking =>
                            (slotStart < booking.end_time && slotEnd > booking.start_time)
                        );

                        if (!hasConflict) {
                            daySlots.push({
                                startTime: slotStart,
                                endTime: slotEnd
                            });
                        }

                        currentHour++;
                    }

                    if (daySlots.length > 0) {
                        slots.push({
                            date: dateString,
                            slots: daySlots
                        });
                    }
                }
            }

            res.json({
                tutorId,
                availableSlots: slots
            });

        } catch (error) {
            console.error('Error fetching available reschedule slots:', error);
            res.status(500).json({
                error: 'Failed to fetch available slots',
                details: error.message
            });
        }
    },

    // Get tutor earnings
    getTutorEarnings: async (req, res) => {
        try {
            // Require authentication
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const tutorId = req.user.userId;
            console.log('💰 getTutorEarnings called with tutorId:', tutorId);

            // Get tutor profile information (hourly rate, total sessions, rating)
            const profileQuery = `
                SELECT 
                    hourly_rate,
                    total_sessions,
                    rating,
                    total_reviews
                FROM tutor_profiles
                WHERE account_id = $1
            `;
            const profileResult = await pool.query(profileQuery, [tutorId]);

            // If no tutor profile exists, return empty earnings data instead of 404
            const tutorProfile = profileResult.rows[0] || {
                hourly_rate: 0,
                total_sessions: 0,
                rating: 0,
                total_reviews: 0
            };

            // Get all completed bookings with earnings data
            const bookingsQuery = `
                SELECT 
                    b.id,
                    b.booking_date,
                    b.start_time,
                    b.end_time,
                    b.duration_minutes,
                    b.subject,
                    b.hourly_rate,
                    b.total_amount,
                    b.completed_at,
                    a.full_name as student_name,
                    r.rating as review_rating,
                    r.review_text
                FROM bookings b
                JOIN accounts a ON b.student_id = a.id
                LEFT JOIN reviews r ON b.id = r.booking_id
                WHERE b.tutor_id = $1 AND b.status = 'completed'
                ORDER BY b.booking_date DESC, b.start_time DESC
            `;
            const bookingsResult = await pool.query(bookingsQuery, [tutorId]);

            // Calculate earnings statistics
            const completedSessions = bookingsResult.rows;
            const totalEarnings = completedSessions.reduce((sum, session) =>
                sum + parseFloat(session.total_amount || 0), 0
            );

            // Calculate earnings by date
            const earningsByDate = {};
            completedSessions.forEach(session => {
                // Use local date parts to avoid timezone shift issues
                const bookingDate = new Date(session.booking_date);
                const year = bookingDate.getFullYear();
                const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
                const day = String(bookingDate.getDate()).padStart(2, '0');
                const date = `${year}-${month}-${day}`;
                if (!earningsByDate[date]) {
                    earningsByDate[date] = {
                        date,
                        sessions: [],
                        totalAmount: 0,
                        sessionCount: 0
                    };
                }
                earningsByDate[date].sessions.push({
                    id: session.id,
                    subject: session.subject,
                    studentName: session.student_name,
                    startTime: session.start_time,
                    endTime: session.end_time,
                    duration: session.duration_minutes,
                    amount: parseFloat(session.total_amount),
                    reviewRating: session.review_rating
                });
                earningsByDate[date].totalAmount += parseFloat(session.total_amount || 0);
                earningsByDate[date].sessionCount++;
            });

            // Calculate time-based earnings
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            const oneWeekAgo = new Date(now);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

            const todayEarnings = earningsByDate[today]?.totalAmount || 0;

            const thisWeekEarnings = completedSessions
                .filter(s => new Date(s.booking_date) >= oneWeekAgo)
                .reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

            const thisMonthEarnings = completedSessions
                .filter(s => s.booking_date.toISOString().startsWith(currentMonth))
                .reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

            // Calculate earnings by subject
            const earningsBySubject = {};
            completedSessions.forEach(session => {
                const subject = session.subject || 'Other';
                if (!earningsBySubject[subject]) {
                    earningsBySubject[subject] = {
                        subject,
                        totalAmount: 0,
                        sessionCount: 0,
                        averageAmount: 0
                    };
                }
                earningsBySubject[subject].totalAmount += parseFloat(session.total_amount || 0);
                earningsBySubject[subject].sessionCount++;
            });

            // Calculate averages
            Object.values(earningsBySubject).forEach(subjectData => {
                subjectData.averageAmount = subjectData.totalAmount / subjectData.sessionCount;
            });

            const response = {
                profile: {
                    hourlyRate: parseFloat(tutorProfile.hourly_rate || 0),
                    totalSessions: tutorProfile.total_sessions || 0,
                    rating: parseFloat(tutorProfile.rating || 0),
                    totalReviews: tutorProfile.total_reviews || 0
                },
                summary: {
                    totalEarnings,
                    todayEarnings,
                    thisWeekEarnings,
                    thisMonthEarnings,
                    completedSessionsCount: completedSessions.length,
                    averagePerSession: completedSessions.length > 0 ? totalEarnings / completedSessions.length : 0
                },
                earningsByDate: Object.values(earningsByDate).sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                ),
                earningsBySubject: Object.values(earningsBySubject).sort((a, b) =>
                    b.totalAmount - a.totalAmount
                ),
                recentSessions: completedSessions.slice(0, 20).map(s => ({
                    id: s.id,
                    date: s.booking_date,
                    subject: s.subject,
                    studentName: s.student_name,
                    duration: s.duration_minutes,
                    amount: parseFloat(s.total_amount),
                    reviewRating: s.review_rating,
                    reviewText: s.review_text,
                    completedAt: s.completed_at
                }))
            };

            res.json(response);

        } catch (error) {
            console.error('Error fetching tutor earnings:', error);
            res.status(500).json({
                error: 'Failed to fetch earnings',
                details: error.message
            });
        }
    },

    // Get tutor overview statistics
    getTutorOverview: async (req, res) => {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const tutorId = req.user.userId;

            // Get today's date
            const today = new Date().toISOString().split('T')[0];

            // Get tutor profile info
            const profileQuery = `
                SELECT hourly_rate, rating, total_reviews, total_sessions
                FROM tutor_profiles
                WHERE account_id = $1
            `;
            const profileResult = await pool.query(profileQuery, [tutorId]);
            const profile = profileResult.rows[0] || {};

            // Get session counts by status
            const sessionsQuery = `
                SELECT 
                    status,
                    COUNT(*) as count
                FROM bookings
                WHERE tutor_id = $1
                GROUP BY status
            `;
            const sessionsResult = await pool.query(sessionsQuery, [tutorId]);
            const sessionCounts = sessionsResult.rows.reduce((acc, row) => {
                acc[row.status] = parseInt(row.count);
                return acc;
            }, {});

            // Get today's earnings
            const todayEarningsQuery = `
                SELECT COALESCE(SUM(total_amount), 0) as amount
                FROM bookings
                WHERE tutor_id = $1 AND booking_date = $2 AND status = 'completed'
            `;
            const todayEarningsResult = await pool.query(todayEarningsQuery, [tutorId, today]);
            const todayEarnings = parseFloat(todayEarningsResult.rows[0]?.amount || 0);

            // Get this month's earnings
            const currentMonth = new Date().toISOString().slice(0, 7);
            const monthEarningsQuery = `
                SELECT COALESCE(SUM(total_amount), 0) as amount
                FROM bookings
                WHERE tutor_id = $1 
                AND TO_CHAR(booking_date, 'YYYY-MM') = $2 
                AND status = 'completed'
            `;
            const monthEarningsResult = await pool.query(monthEarningsQuery, [tutorId, currentMonth]);
            const monthEarnings = parseFloat(monthEarningsResult.rows[0]?.amount || 0);

            // Get unique student count
            const studentsQuery = `
                SELECT COUNT(DISTINCT student_id) as count
                FROM bookings
                WHERE tutor_id = $1
            `;
            const studentsResult = await pool.query(studentsQuery, [tutorId]);
            const totalStudents = parseInt(studentsResult.rows[0]?.count || 0);

            res.json({
                profile: {
                    hourlyRate: parseFloat(profile.hourly_rate || 0),
                    rating: parseFloat(profile.rating || 0),
                    totalReviews: profile.total_reviews || 0,
                    totalSessions: profile.total_sessions || 0
                },
                stats: {
                    pendingRequests: sessionCounts.pending || 0,
                    scheduledSessions: (sessionCounts.scheduled || 0) + (sessionCounts.confirmed || 0),
                    completedSessions: sessionCounts.completed || 0,
                    totalStudents,
                    todayEarnings,
                    monthEarnings
                }
            });

        } catch (error) {
            console.error('Error fetching tutor overview:', error);
            res.status(500).json({
                error: 'Failed to fetch overview',
                details: error.message
            });
        }
    },

    // Get student overview statistics
    getStudentOverview: async (req, res) => {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const studentId = req.user.userId;

            // Get booking counts by status
            const bookingsQuery = `
                SELECT 
                    status,
                    COUNT(*) as count
                FROM bookings
                WHERE student_id = $1
                GROUP BY status
            `;
            const bookingsResult = await pool.query(bookingsQuery, [studentId]);
            const bookingCounts = bookingsResult.rows.reduce((acc, row) => {
                acc[row.status] = parseInt(row.count);
                return acc;
            }, {});

            // Get total spent
            const spentQuery = `
                SELECT COALESCE(SUM(total_amount), 0) as amount
                FROM bookings
                WHERE student_id = $1 AND status = 'completed'
            `;
            const spentResult = await pool.query(spentQuery, [studentId]);
            const totalSpent = parseFloat(spentResult.rows[0]?.amount || 0);

            // Get this month's sessions
            const currentMonth = new Date().toISOString().slice(0, 7);
            const monthSessionsQuery = `
                SELECT COUNT(*) as count
                FROM bookings
                WHERE student_id = $1 
                AND TO_CHAR(booking_date, 'YYYY-MM') = $2
                AND status IN ('completed', 'scheduled', 'confirmed')
            `;
            const monthSessionsResult = await pool.query(monthSessionsQuery, [studentId, currentMonth]);
            const monthSessions = parseInt(monthSessionsResult.rows[0]?.count || 0);

            // Get unique tutors count
            const tutorsQuery = `
                SELECT COUNT(DISTINCT tutor_id) as count
                FROM bookings
                WHERE student_id = $1
            `;
            const tutorsResult = await pool.query(tutorsQuery, [studentId]);
            const totalTutors = parseInt(tutorsResult.rows[0]?.count || 0);

            // Get reviews given count
            const reviewsQuery = `
                SELECT COUNT(*) as count
                FROM reviews
                WHERE student_id = $1
            `;
            const reviewsResult = await pool.query(reviewsQuery, [studentId]);
            const reviewsGiven = parseInt(reviewsResult.rows[0]?.count || 0);

            res.json({
                stats: {
                    upcomingSessions: (bookingCounts.scheduled || 0) + (bookingCounts.confirmed || 0),
                    completedSessions: bookingCounts.completed || 0,
                    pendingSessions: bookingCounts.pending || 0,
                    totalSpent,
                    monthSessions,
                    totalTutors,
                    reviewsGiven
                }
            });

        } catch (error) {
            console.error('Error fetching student overview:', error);
            res.status(500).json({
                error: 'Failed to fetch overview',
                details: error.message
            });
        }
    },

    // Set tutor availability
    setTutorAvailability: async (req, res) => {
        try {
            const tutorId = req.user.userId;
            const { availableDays } = req.body; // Array of day names

            // Validate input
            if (!Array.isArray(availableDays)) {
                return res.status(400).json({
                    error: 'Available days must be an array of day names'
                });
            }

            // Validate that all days are valid day names
            const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const invalidDays = availableDays.filter(day => !validDays.includes(day));

            if (invalidDays.length > 0) {
                return res.status(400).json({
                    error: `Invalid day names: ${invalidDays.join(', ')}. Valid days are: ${validDays.join(', ')}`
                });
            }

            // Update tutor profile with new available days
            await pool.query(
                `UPDATE tutor_profiles 
                 SET available_days = $2, updated_at = CURRENT_TIMESTAMP 
                 WHERE account_id = $1`,
                [tutorId, availableDays]
            );

            res.json({
                message: 'Availability updated successfully',
                availableDays: availableDays,
                defaultHours: { start: '09:00', end: '17:00' }
            });

        } catch (error) {
            console.error('Error setting tutor availability:', error);
            res.status(500).json({
                error: 'Failed to set availability',
                details: error.message
            });
        }
    }
};

export default bookingController;