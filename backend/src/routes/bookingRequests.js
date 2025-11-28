import express from 'express';
import bookingRequestController from '../controllers/bookingRequestController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get pending booking requests for tutor (requires auth)
router.get('/requests/pending', authenticateToken, bookingRequestController.getPendingBookingRequests);

// Respond to a booking request (accept/decline)
router.put('/requests/:requestId/respond', authenticateToken, bookingRequestController.respondToBookingRequest);

// Create a new booking request (from student)
router.post('/requests', authenticateToken, bookingRequestController.createBookingRequest);

export default router;