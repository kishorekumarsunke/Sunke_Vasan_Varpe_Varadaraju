import express from 'express';
import { 
    getTutorAvailability, 
    addAvailabilitySlot, 
    updateAvailabilitySlot, 
    deleteAvailabilitySlot,
    setTutorAvailability
} from '../controllers/availabilityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Test route to verify availability routes are loaded
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Availability routes are working!', 
        timestamp: new Date().toISOString() 
    });
});

// Get tutor availability (temporarily without auth for testing)
router.get('/tutor/availability/:tutorId?', getTutorAvailability);

// Add single availability slot (temporarily without auth for testing)
router.post('/tutor/availability', addAvailabilitySlot);

// Update availability slot
router.put('/tutor/availability/:slotId', authenticateToken, updateAvailabilitySlot);

// Delete availability slot
router.delete('/tutor/availability/:slotId', authenticateToken, deleteAvailabilitySlot);

// Set bulk availability (replace all)
router.post('/tutor/availability/bulk', authenticateToken, setTutorAvailability);

export default router;