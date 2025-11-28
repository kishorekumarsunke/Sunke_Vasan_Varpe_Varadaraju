import express from 'express';
import reviewController from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (require authentication)
router.use(authenticateToken);

// Create a new review for a completed session
router.post('/bookings/:bookingId/review', reviewController.createReview);

// Get reviews for a specific tutor
router.get('/tutors/:tutorId/reviews', reviewController.getTutorReviews);

// Get student's submitted reviews
router.get('/student/reviews', reviewController.getStudentReviews);

// Get completed sessions that need reviews
router.get('/student/sessions-needing-review', reviewController.getSessionsNeedingReview);

// Update an existing review
router.put('/reviews/:reviewId', reviewController.updateReview);

export default router;