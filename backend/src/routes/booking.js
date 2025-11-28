import express from 'express';
import bookingController from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required) - only availability check
router.get('/tutors/:tutorId/test', bookingController.testEndpoint);
router.get('/tutors/:tutorId/availability', bookingController.getTutorAvailability);

// All other booking routes require authentication
router.use(authenticateToken);

// Protected booking request routes
router.post('/requests', bookingController.createBookingRequest);
router.get('/tutor/requests', bookingController.getTutorBookingRequests);
router.post('/requests/:requestId/respond', bookingController.respondToBookingRequest);

// Protected booking management routes
router.post('/bookings/:bookingId/complete', bookingController.markSessionComplete);
router.get('/student/bookings', bookingController.getStudentBookings);
router.get('/tutor/sessions', bookingController.getTutorSessions);
router.get('/tutor/earnings', bookingController.getTutorEarnings);
router.get('/tutor/overview', bookingController.getTutorOverview);
router.get('/student/overview', bookingController.getStudentOverview);
router.post('/tutors/availability', bookingController.setTutorAvailability);

// Booking request routes (moved above for no auth)
router.get('/student/requests', bookingController.getStudentBookingRequests);

// Booking routes  
router.post('/bookings', bookingController.createBooking); // Legacy - now creates request
// Get student's bookings
router.get('/student/bookings', bookingController.getStudentBookings);
// Get tutor's bookings (filtered by authenticated tutor)
router.get('/tutor/bookings', bookingController.getTutorBookings);

// Reschedule and cancel routes
router.put('/bookings/:bookingId/reschedule', bookingController.rescheduleBooking);
router.put('/bookings/:bookingId/cancel', bookingController.cancelBooking);
router.put('/tutor/bookings/:bookingId/cancel', bookingController.cancelBookingAsTutor);

// Available slots for rescheduling
router.get('/tutors/:tutorId/available-slots', bookingController.getAvailableRescheduleSlots);

router.put('/bookings/:bookingId/status', bookingController.updateBookingStatus);

export default router;