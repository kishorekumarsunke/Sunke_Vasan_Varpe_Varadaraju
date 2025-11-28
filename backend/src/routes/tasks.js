import express from 'express';
import TaskController from '../controllers/taskController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for current user
 * @access  Private
 */
router.get('/', authenticateToken, TaskController.getTasks);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', authenticateToken, TaskController.createTask);

/**
 * @route   PUT /api/tasks/:taskId
 * @desc    Update a task
 * @access  Private
 */
router.put('/:taskId', authenticateToken, TaskController.updateTask);

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    Delete a task
 * @access  Private
 */
router.delete('/:taskId', authenticateToken, TaskController.deleteTask);

export default router;