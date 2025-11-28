import DatabaseUtils from '../utils/database.js';

class TaskController {
    /**
     * Get all tasks for current user
     */
    static async getTasks(req, res) {
        try {
            const userId = req.user.userId;

            const result = await DatabaseUtils.query(`
                SELECT * FROM tasks 
                WHERE user_id = $1 
                ORDER BY created_at DESC
            `, [userId]);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching tasks:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching tasks',
                error: error.message
            });
        }
    }

    /**
     * Create a new task
     */
    static async createTask(req, res) {
        try {
            const userId = req.user.userId;
            const {
                title,
                description,
                subject,
                priority,
                estimatedTime,
                dueDate
            } = req.body;

            if (!title || !subject || !dueDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, subject, and due date are required'
                });
            }

            const result = await DatabaseUtils.query(`
                INSERT INTO tasks (
                    user_id, title, description, subject, priority, 
                    estimated_time, due_date, status, progress
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                userId, title, description, subject, 
                priority || 'medium', estimatedTime, dueDate, 
                'pending', 0
            ]);

            res.json({
                success: true,
                message: 'Task created successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error creating task:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating task',
                error: error.message
            });
        }
    }

    /**
     * Update a task
     */
    static async updateTask(req, res) {
        try {
            const userId = req.user.userId;
            const { taskId } = req.params;
            const {
                title,
                description,
                subject,
                priority,
                estimatedTime,
                dueDate,
                status,
                progress
            } = req.body;

            const result = await DatabaseUtils.query(`
                UPDATE tasks SET
                    title = COALESCE($3, title),
                    description = COALESCE($4, description),
                    subject = COALESCE($5, subject),
                    priority = COALESCE($6, priority),
                    estimated_time = COALESCE($7, estimated_time),
                    due_date = COALESCE($8, due_date),
                    status = COALESCE($9, status),
                    progress = COALESCE($10, progress),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND user_id = $2
                RETURNING *
            `, [
                taskId, userId, title, description, subject,
                priority, estimatedTime, dueDate, status, progress
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            res.json({
                success: true,
                message: 'Task updated successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error updating task:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating task',
                error: error.message
            });
        }
    }

    /**
     * Delete a task
     */
    static async deleteTask(req, res) {
        try {
            const userId = req.user.userId;
            const { taskId } = req.params;

            const result = await DatabaseUtils.query(`
                DELETE FROM tasks 
                WHERE id = $1 AND user_id = $2
                RETURNING *
            `, [taskId, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            res.json({
                success: true,
                message: 'Task deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting task',
                error: error.message
            });
        }
    }
}

export default TaskController;