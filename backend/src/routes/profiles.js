import express from 'express';
import StudentProfileController from '../controllers/studentProfileController.js';
import TutorProfileController from '../controllers/tutorProfileController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Student Profile Routes
 */

/**
 * @route   GET /api/profiles/student
 * @desc    Get current student's profile
 * @access  Private (Students only)
 */
router.get('/student', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Students only.'
        });
    }
    return StudentProfileController.getProfile(req, res);
});

/**
 * @route   PUT /api/profiles/student
 * @desc    Update current student's profile
 * @access  Private (Students only)
 */
router.put('/student', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Students only.'
        });
    }
    return StudentProfileController.updateProfile(req, res);
});

/**
 * Tutor Profile Routes
 */

/**
 * @route   GET /api/profiles/tutor
 * @desc    Get current tutor's profile
 * @access  Private (Tutors only)
 */
router.get('/tutor', authenticateToken, async (req, res) => {
    if (req.user.role !== 'tutor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Tutors only.'
        });
    }
    return TutorProfileController.getProfile(req, res);
});

/**
 * @route   PUT /api/profiles/tutor
 * @desc    Update current tutor's profile
 * @access  Private (Tutors only)
 */
router.put('/tutor', authenticateToken, async (req, res) => {
    if (req.user.role !== 'tutor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Tutors only.'
        });
    }
    return TutorProfileController.updateProfile(req, res);
});

/**
 * @route   GET /api/profiles/tutor/status
 * @desc    Get tutor profile completion status
 * @access  Private (Tutors only)
 */
router.get('/tutor/status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'tutor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Tutors only.'
        });
    }
    return TutorProfileController.getProfileStatus(req, res);
});

/**
 * @route   GET /api/profiles/tutor/:tutorId
 * @desc    Get public tutor profile  
 * @access  Public
 * @todo    Implement getPublicProfile method
 */
// router.get('/tutor/:tutorId', TutorProfileController.getPublicProfile);

export default router;