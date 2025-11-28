import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getChatHistory, sendMessage, clearChatHistory } from '../controllers/aiChatController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get chat history
router.get('/history', getChatHistory);

// Send a message to AI
router.post('/message', sendMessage);

// Clear chat history
router.delete('/history', clearChatHistory);

export default router;
