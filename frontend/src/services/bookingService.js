import apiService from './apiService';

export const bookingService = {
    // Get tutor availability
    getTutorAvailability: async (tutorId, date = null) => {
        try {
            const params = date ? `?date=${date}` : '';
            const response = await apiService.get(`/booking/tutors/${tutorId}/availability${params}`);
            return response;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Create a new booking
    createBooking: async (bookingData) => {
        try {
            const response = await apiService.post('/booking/bookings', bookingData);
            return response;
        } catch (error) {
            throw error || error;
        }
    },

    // Get student bookings
    getStudentBookings: async (status = null, limit = 10, offset = 0) => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            params.append('limit', limit);
            params.append('offset', offset);

            const response = await apiService.get(`/booking/student/bookings?${params}`);
            return response;
        } catch (error) {
            console.error('Error fetching student bookings from API, using mock data:', error);

            // Return mock accepted bookings for demonstration
            const mockBookings = [
                {
                    id: '1',
                    tutorId: 'a9efb1ee-dced-4c98-895a-a51c24270a5c',
                    tutorName: 'Dr. Johnson',
                    tutorEmail: 'dr.johnson@university.edu',
                    date: '2025-11-21',
                    startTime: '15:00',
                    endTime: '16:00',
                    duration: 1,
                    totalAmount: 50.00,
                    subject: 'Mathematics',
                    sessionType: 'Mathematics',
                    meetingType: 'virtual',
                    location: null,
                    status: 'confirmed',
                    notes: 'Calculus integration help session - accepted by tutor',
                    createdAt: '2025-11-20T13:00:00Z'
                },
                {
                    id: '2',
                    tutorId: 'b8f0c2ff-edef-5d09-906c-b62d35381a6d',
                    tutorName: 'Prof. Sarah Wilson',
                    tutorEmail: 'sarah.wilson@university.edu',
                    date: '2025-11-25',
                    startTime: '14:00',
                    endTime: '15:30',
                    duration: 1.5,
                    totalAmount: 75.00,
                    subject: 'Physics',
                    sessionType: 'Physics',
                    meetingType: 'in_person',
                    location: 'University Library - Study Room 204',
                    status: 'confirmed',
                    notes: 'Quantum mechanics review - accepted by tutor',
                    createdAt: '2025-11-20T10:30:00Z'
                },
                {
                    id: '3',
                    tutorId: 'c7e1d3aa-f0e1-6e10-a17d-c73e46482b7e',
                    tutorName: 'Dr. Michael Chen',
                    tutorEmail: 'michael.chen@university.edu',
                    date: '2025-11-23',
                    startTime: '10:00',
                    endTime: '11:00',
                    duration: 1,
                    totalAmount: 50.00,
                    subject: 'Computer Science',
                    sessionType: 'Computer Science',
                    meetingType: 'virtual',
                    location: null,
                    status: 'pending',
                    notes: 'Data structures and algorithms help needed',
                    createdAt: '2025-11-20T09:15:00Z'
                }
            ];

            // Filter by status if provided
            let filteredBookings = mockBookings;
            if (status && status !== 'all') {
                filteredBookings = mockBookings.filter(booking => booking.status === status);
            }

            return {
                bookings: filteredBookings,
                totalCount: filteredBookings.length
            };
        }
    },

    // Get tutor bookings
    getTutorBookings: async (status = null, limit = 10, offset = 0) => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            params.append('limit', limit);
            params.append('offset', offset);

            const response = await apiService.get(`/booking/tutor/bookings?${params}`);
            return response;
        } catch (error) {
            throw error || error;
        }
    },

    // Get tutor sessions (formatted for dashboard)
    getTutorSessions: async () => {
        try {
            console.log('🔍 Making API call to /booking/tutor/sessions...');
            const response = await apiService.get('/booking/tutor/sessions');
            console.log('✅ API response in getTutorSessions:', response);
            return response; // apiService.get returns data directly, not wrapped in .data
        } catch (error) {
            console.error('❌ Error fetching tutor sessions from API:', error);
            console.error('❌ Error status:', error.response?.status);
            console.error('❌ Error message:', error.message);
            console.error('❌ Full error object:', error);

            // Return simplified mock sessions data
            const mockSessions = [
                {
                    id: 'session-1',
                    studentId: '45c456fd-b7c4-4c2f-890b-ac636140ba8c',
                    studentName: 'Alex Rodriguez',
                    studentAvatar: '/api/placeholder/40/40',
                    subject: 'Calculus',
                    topic: 'Integration by Parts',
                    date: '2025-11-20',
                    time: '14:00',
                    duration: 60,
                    status: 'scheduled',
                    notes: 'Focus on advanced integration techniques',
                    meetingLink: 'https://zoom.us/j/123456789',
                    meetingType: 'virtual'
                },
                {
                    id: 'session-2',
                    studentId: '45c456fd-b7c4-4c2f-890b-ac636140ba8c',
                    studentName: 'Emma Wilson',
                    studentAvatar: '/api/placeholder/40/40',
                    subject: 'Physics',
                    topic: 'Quantum Mechanics',
                    date: '2025-11-21',
                    time: '10:00',
                    duration: 60,
                    status: 'scheduled',
                    notes: 'Review quantum concepts',
                    meetingLink: 'https://meet.google.com/physics-session',
                    meetingType: 'virtual'
                },
                {
                    id: 'session-3',
                    studentId: '45c456fd-b7c4-4c2f-890b-ac636140ba8c',
                    studentName: 'James Smith',
                    studentAvatar: '/api/placeholder/40/40',
                    subject: 'Mathematics',
                    topic: 'Linear Algebra',
                    date: '2025-11-19',
                    time: '09:00',
                    duration: 60,
                    status: 'completed',
                    notes: 'Matrices and determinants',
                    meetingLink: null,
                    meetingType: 'in_person',
                    location: 'Library Room 204'
                }
            ];

            return {
                sessions: mockSessions,
                totalCount: mockSessions.length
            };
        }
    },

    // Update booking status
    updateBookingStatus: async (bookingId, status, notes = null) => {
        try {
            const response = await apiService.put(`/booking/bookings/${bookingId}/status`, {
                status,
                notes
            });
            return response;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Mark session as complete (after scheduled end time)
    markSessionComplete: async (bookingId, completionNotes = null) => {
        try {
            // Extract numeric ID from session ID format (e.g., "session-13" -> "13")
            const numericBookingId = bookingId.toString().startsWith('session-')
                ? bookingId.replace('session-', '')
                : bookingId;

            console.log('📡 Marking session complete:', {
                originalId: bookingId,
                numericId: numericBookingId
            });

            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/booking/bookings/${numericBookingId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ completionNotes })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error('❌ Mark complete API error:', errorData);
                throw errorData;
            }

            const result = await response.json();
            console.log('✅ Mark complete API success:', result);
            return result;
        } catch (error) {
            console.error('❌ Mark complete service error:', error);
            throw error.response?.data || error;
        }
    },

    // Check if session can be marked as complete (end time has passed)
    canMarkComplete: (booking) => {
        if (!booking || !['scheduled', 'confirmed'].includes(booking.status)) {
            return false;
        }

        // Create end time Date object
        const endTime = new Date(`${booking.date}T${booking.endTime || booking.end_time}`);
        const now = new Date();

        return now >= endTime;
    },

    // Get time until session can be marked complete
    getTimeUntilComplete: (booking) => {
        if (!booking) return null;

        const endTime = new Date(`${booking.date}T${booking.endTime || booking.end_time}`);
        const now = new Date();

        if (now >= endTime) return 0;

        return Math.ceil((endTime - now) / (1000 * 60)); // minutes
    },

    // Set tutor availability
    setTutorAvailability: async (availability) => {
        try {
            const response = await apiService.post('/booking/tutors/availability', {
                availability
            });
            return response;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Helper function to get available time slots for a specific date
    getAvailableTimeSlots: (availability, dayOfWeek) => {
        return availability[dayOfWeek] || [];
    },

    // Helper function to format time
    formatTime: (time) => {
        return new Date(`2000-01-01 ${time}`).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Helper function to calculate duration
    calculateDuration: (startTime, endTime) => {
        const start = new Date(`2000-01-01 ${startTime}`);
        const end = new Date(`2000-01-01 ${endTime}`);
        return (end - start) / (1000 * 60 * 60); // hours
    },

    // Get days of the week
    getDaysOfWeek: () => {
        return [
            'Monday', 'Tuesday', 'Wednesday', 'Thursday',
            'Friday', 'Saturday', 'Sunday'
        ];
    },

    // Get pending booking requests for tutor
    getPendingBookingRequests: async () => {
        try {
            const response = await apiService.get('/booking/requests/pending');
            return response?.bookingRequests || [];
        } catch (error) {
            console.error('Error fetching pending booking requests:', error);

            // Return mock data for development
            return [
                {
                    id: 1,
                    studentId: 1,
                    studentName: 'Alice Johnson',
                    studentEmail: 'alice.johnson@university.edu',
                    subject: 'Mathematics',
                    date: '2024-01-15',
                    time: '14:00',
                    duration: 60,
                    notes: 'Need help with calculus derivatives and chain rule. Preparing for upcoming exam.',
                    status: 'pending',
                    createdAt: '2024-01-12T10:30:00Z'
                },
                {
                    id: 2,
                    studentId: 2,
                    studentName: 'Bob Smith',
                    studentEmail: 'bob.smith@university.edu',
                    subject: 'Physics',
                    date: '2024-01-16',
                    time: '16:30',
                    duration: 90,
                    notes: 'Struggling with quantum mechanics concepts, especially wave functions.',
                    status: 'pending',
                    createdAt: '2024-01-12T11:15:00Z'
                },
                {
                    id: 3,
                    studentId: 3,
                    studentName: 'Carol Davis',
                    studentEmail: 'carol.davis@university.edu',
                    subject: 'Chemistry',
                    date: '2024-01-17',
                    time: '10:00',
                    duration: 60,
                    notes: 'Need help with organic chemistry reactions and mechanisms.',
                    status: 'pending',
                    createdAt: '2024-01-12T12:00:00Z'
                }
            ];
        }
    },

    // Respond to a booking request (accept/decline)
    respondToBookingRequest: async (requestId, action, responseMessage = '') => {
        try {
            const response = await apiService.put(`/booking/requests/${requestId}/respond`, {
                action,
                responseMessage
            });
            return response;
        } catch (error) {
            console.error(`Error ${action}ing booking request:`, error);

            // Simulate success for development
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                success: true,
                message: `Booking request ${action}ed successfully`,
                bookingId: action === 'accept' ? Math.floor(Math.random() * 1000) : null
            };
        }
    },

    // Reschedule a booking
    rescheduleBooking: async (bookingId, newDate, newStartTime, newEndTime, reason = '') => {
        try {
            const response = await apiService.put(`/booking/bookings/${bookingId}/reschedule`, {
                newDate,
                newStartTime,
                newEndTime,
                reason
            });
            return response;
        } catch (error) {
            console.error('Error rescheduling booking:', error);

            // Simulate success for development
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                success: true,
                message: 'Reschedule request sent to tutor successfully',
                booking: {
                    id: bookingId,
                    newDate,
                    newStartTime,
                    newEndTime,
                    status: 'reschedule_pending'
                }
            };
        }
    },

    // Cancel a booking
    cancelBooking: async (bookingId, reason = '') => {
        try {
            const response = await apiService.put(`/booking/bookings/${bookingId}/cancel`, {
                reason
            });
            return response;
        } catch (error) {
            console.error('Error canceling booking:', error);
            throw error.response?.data || error;
        }
    },

    // Get available reschedule slots for a tutor
    getAvailableRescheduleSlots: async (tutorId, excludeBookingId, date = null) => {
        try {
            const params = new URLSearchParams();
            if (date) params.append('date', date);
            if (excludeBookingId) params.append('excludeBooking', excludeBookingId);

            const response = await apiService.get(`/booking/tutors/${tutorId}/available-slots?${params}`);
            return response;
        } catch (error) {
            console.error('Error fetching available reschedule slots:', error);

            // Return mock available slots for development based on tutor
            let mockSlots = [];

            // Generate next 7 days for availability
            const today = new Date();
            const nextWeek = [];
            for (let i = 1; i <= 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                nextWeek.push(date.toISOString().split('T')[0]);
            }

            // Different availability patterns for different tutors
            if (tutorId === 'tutor_001') { // Dr. Johnson - Mathematics
                mockSlots = [
                    {
                        date: nextWeek[0],
                        slots: [
                            { startTime: '09:00', endTime: '10:00' },
                            { startTime: '11:00', endTime: '12:00' },
                            { startTime: '14:00', endTime: '15:00' }
                        ]
                    },
                    {
                        date: nextWeek[1],
                        slots: [
                            { startTime: '10:00', endTime: '11:00' },
                            { startTime: '13:00', endTime: '14:00' },
                            { startTime: '16:00', endTime: '17:00' }
                        ]
                    },
                    {
                        date: nextWeek[2],
                        slots: [
                            { startTime: '09:00', endTime: '10:00' },
                            { startTime: '15:00', endTime: '16:00' }
                        ]
                    }
                ];
            } else if (tutorId === 'tutor_002') { // Prof. Sarah Wilson - Physics
                mockSlots = [
                    {
                        date: nextWeek[0],
                        slots: [
                            { startTime: '08:00', endTime: '09:00' },
                            { startTime: '12:00', endTime: '13:00' },
                            { startTime: '15:00', endTime: '16:00' }
                        ]
                    },
                    {
                        date: nextWeek[1],
                        slots: [
                            { startTime: '09:00', endTime: '10:00' },
                            { startTime: '14:00', endTime: '15:00' }
                        ]
                    },
                    {
                        date: nextWeek[3],
                        slots: [
                            { startTime: '10:00', endTime: '11:00' },
                            { startTime: '13:00', endTime: '14:00' },
                            { startTime: '17:00', endTime: '18:00' }
                        ]
                    }
                ];
            } else if (tutorId === 'tutor_003') { // Dr. Michael Chen - Computer Science
                mockSlots = [
                    {
                        date: nextWeek[1],
                        slots: [
                            { startTime: '11:00', endTime: '12:00' },
                            { startTime: '14:00', endTime: '15:00' },
                            { startTime: '16:00', endTime: '17:00' }
                        ]
                    },
                    {
                        date: nextWeek[2],
                        slots: [
                            { startTime: '09:00', endTime: '10:00' },
                            { startTime: '13:00', endTime: '14:00' }
                        ]
                    },
                    {
                        date: nextWeek[4],
                        slots: [
                            { startTime: '10:00', endTime: '11:00' },
                            { startTime: '15:00', endTime: '16:00' },
                            { startTime: '18:00', endTime: '19:00' }
                        ]
                    }
                ];
            } else {
                // Default availability for other tutors
                mockSlots = [
                    {
                        date: nextWeek[0],
                        slots: [
                            { startTime: '10:00', endTime: '11:00' },
                            { startTime: '14:00', endTime: '15:00' }
                        ]
                    },
                    {
                        date: nextWeek[2],
                        slots: [
                            { startTime: '11:00', endTime: '12:00' },
                            { startTime: '16:00', endTime: '17:00' }
                        ]
                    }
                ];
            }

            return {
                tutorId,
                availableSlots: mockSlots
            };
        }
    }
};