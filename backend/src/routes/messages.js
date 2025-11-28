import express from 'express';
import MessageController from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/messages/users
 * @desc    Get all users for conversation list
 * @access  Private
 */
router.get('/users', authenticateToken, MessageController.getAllUsers);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get conversations for current user
 * @access  Private
 */
router.get('/conversations', authenticateToken, MessageController.getConversations);

/**
 * @route   GET /api/messages/:otherUserId
 * @desc    Get messages between current user and another user
 * @access  Private
 */
router.get('/:otherUserId', authenticateToken, MessageController.getMessages);

/**
 * @route   POST /api/messages/send
 * @desc    Send a message
 * @access  Private
 */
router.post('/send', authenticateToken, MessageController.sendMessage);

export default router;
