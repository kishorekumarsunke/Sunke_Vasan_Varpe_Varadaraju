import express from 'express';
import SubjectController from '../controllers/subjectController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes - anyone can view subjects
router.get('/', SubjectController.getSubjects);
router.get('/by-category', SubjectController.getSubjectsByCategory);

// Protected routes - require authentication for admin operations
router.post('/', authenticateToken, SubjectController.createSubject);
router.put('/:subjectId', authenticateToken, SubjectController.updateSubject);
router.delete('/:subjectId', authenticateToken, SubjectController.deleteSubject);

export default router;