import express from 'express';
import { getAllTutors, getTutorById, getTutorSubjects } from '../controllers/tutorController.js';

const router = express.Router();

// Get all tutors with optional filters
router.get('/', getAllTutors);

// Get tutor subjects
router.get('/subjects', getTutorSubjects);

// Get tutor by ID
router.get('/:id', getTutorById);

export default router;