import express from 'express';
import StudentProfileController from '../controllers/studentProfileController.js';
import TutorProfileController from '../controllers/tutorProfileController.js';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * Admin Profile Routes
 */

/**
 * @route   GET /api/profiles/admin
 * @desc    Get current admin's profile
 * @access  Private (Admins only)
 */
router.get('/admin', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admins only.'
        });
    }
    
    try {
        const result = await pool.query(
            `SELECT id, username, email, full_name, phone_number, bio, 
                    location_city, location_state, profile_image, role, 
                    is_active, created_at, updated_at 
             FROM accounts WHERE id = $1`,
            [req.user.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }
        
        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching admin profile'
        });
    }
});

/**
 * @route   PUT /api/profiles/admin
 * @desc    Update current admin's profile
 * @access  Private (Admins only)
 */
router.put('/admin', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admins only.'
        });
    }
    
    try {
        const { full_name, phone_number, bio, location_city, location_state, profile_image } = req.body;
        
        const result = await pool.query(
            `UPDATE accounts 
             SET full_name = COALESCE($1, full_name),
                 phone_number = COALESCE($2, phone_number),
                 bio = COALESCE($3, bio),
                 location_city = COALESCE($4, location_city),
                 location_state = COALESCE($5, location_state),
                 profile_image = COALESCE($6, profile_image),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING id, username, email, full_name, phone_number, bio, 
                       location_city, location_state, profile_image, role, 
                       is_active, created_at, updated_at`,
            [full_name, phone_number, bio, location_city, location_state, profile_image, req.user.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }
        
        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating admin profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating admin profile'
        });
    }
});

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