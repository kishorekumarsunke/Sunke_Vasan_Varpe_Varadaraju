import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
    getDashboardStats,
    getTutorApplications,
    getTutorApplication,
    updateTutorStatus,
    getAllSessions,
    getEarningsSummary,
    getAllUsers,
    updateUserStatus
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Tutor applications
router.get('/tutors/applications', getTutorApplications);
router.get('/tutors/applications/:tutorId', getTutorApplication);
router.put('/tutors/applications/:tutorId/status', updateTutorStatus);

// Sessions
router.get('/sessions', getAllSessions);

// Earnings
router.get('/earnings', getEarningsSummary);

// User management
router.get('/users', getAllUsers);
router.put('/users/:userId/status', updateUserStatus);

export default router;
