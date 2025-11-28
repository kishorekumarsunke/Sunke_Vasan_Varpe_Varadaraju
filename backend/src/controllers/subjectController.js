import DatabaseUtils from '../utils/database.js';

class SubjectController {
    /**
     * Get all subjects
     */
    static async getSubjects(req, res) {
        try {
            const result = await DatabaseUtils.query(`
                SELECT id, name, description, category, created_at
                FROM subjects 
                ORDER BY category, name
            `);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching subjects:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching subjects',
                error: error.message
            });
        }
    }

    /**
     * Get subjects by category
     */
    static async getSubjectsByCategory(req, res) {
        try {
            const result = await DatabaseUtils.query(`
                SELECT 
                    category,
                    json_agg(
                        json_build_object(
                            'id', id,
                            'name', name,
                            'description', description
                        ) ORDER BY name
                    ) as subjects
                FROM subjects 
                GROUP BY category
                ORDER BY category
            `);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching subjects by category:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching subjects by category',
                error: error.message
            });
        }
    }

    /**
     * Create a new subject (admin only)
     */
    static async createSubject(req, res) {
        try {
            const { name, description, category } = req.body;

            if (!name || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and category are required'
                });
            }

            const result = await DatabaseUtils.query(`
                INSERT INTO subjects (name, description, category)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [name, description || null, category]);

            res.json({
                success: true,
                message: 'Subject created successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error creating subject:', error);

            // Handle duplicate name error
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'Subject with this name already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creating subject',
                error: error.message
            });
        }
    }

    /**
     * Update a subject (admin only)
     */
    static async updateSubject(req, res) {
        try {
            const { subjectId } = req.params;
            const { name, description, category } = req.body;

            const result = await DatabaseUtils.query(`
                UPDATE subjects SET
                    name = COALESCE($2, name),
                    description = COALESCE($3, description),
                    category = COALESCE($4, category)
                WHERE id = $1
                RETURNING *
            `, [subjectId, name, description, category]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Subject not found'
                });
            }

            res.json({
                success: true,
                message: 'Subject updated successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error updating subject:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating subject',
                error: error.message
            });
        }
    }

    /**
     * Delete a subject (admin only)
     */
    static async deleteSubject(req, res) {
        try {
            const { subjectId } = req.params;

            // Check if subject is being used in tasks
            const taskCheck = await DatabaseUtils.query(`
                SELECT COUNT(*) as count FROM tasks WHERE subject = (
                    SELECT name FROM subjects WHERE id = $1
                )
            `, [subjectId]);

            if (parseInt(taskCheck.rows[0].count) > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete subject that is being used in tasks'
                });
            }

            const result = await DatabaseUtils.query(`
                DELETE FROM subjects WHERE id = $1 RETURNING *
            `, [subjectId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Subject not found'
                });
            }

            res.json({
                success: true,
                message: 'Subject deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting subject:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting subject',
                error: error.message
            });
        }
    }
}

export default SubjectController;