import DatabaseUtils from '../utils/database.js';

class MessageController {
    /**
     * Get all users (tutors and students) for conversation list
     * Sorted by most recent message first, then by name
     */
    static async getAllUsers(req, res) {
        try {
            const currentUserId = req.user.userId;
            
            // Get all users except current user, with their role information
            // Users with recent messages appear first
            const result = await DatabaseUtils.query(`
                WITH user_last_message AS (
                    SELECT 
                        CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END as user_id,
                        MAX(created_at) as last_message_time
                    FROM messages
                    WHERE sender_id = $1 OR recipient_id = $1
                    GROUP BY CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END
                )
                SELECT 
                    a.id,
                    a.full_name,
                    a.email,
                    a.account_type as role,
                    a.profile_image,
                    a.location_city,
                    a.bio,
                    CASE 
                        WHEN tp.account_id IS NOT NULL THEN 'tutor'
                        WHEN sp.account_id IS NOT NULL THEN 'student'
                        ELSE a.account_type
                    END as user_role,
                    tp.subjects_taught,
                    tp.hourly_rate,
                    sp.current_school,
                    ulm.last_message_time
                FROM accounts a
                LEFT JOIN tutor_profiles tp ON a.id = tp.account_id
                LEFT JOIN student_profiles sp ON a.id = sp.account_id
                LEFT JOIN user_last_message ulm ON a.id = ulm.user_id
                WHERE a.id != $1 AND a.is_active = true
                ORDER BY ulm.last_message_time DESC NULLS LAST, a.full_name ASC
            `, [currentUserId]);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching users',
                error: error.message
            });
        }
    }

    /**
     * Get conversations for current user
     */
    static async getConversations(req, res) {
        try {
            const userId = req.user.userId;

            // Get conversations with last message - properly ordered by most recent
            const result = await DatabaseUtils.query(`
                WITH latest_messages AS (
                    SELECT DISTINCT ON (
                        CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END
                    )
                        CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END as other_user_id,
                        content as last_message,
                        created_at as last_message_time
                    FROM messages
                    WHERE sender_id = $1 OR recipient_id = $1
                    ORDER BY 
                        CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END,
                        created_at DESC
                )
                SELECT 
                    lm.other_user_id,
                    lm.last_message,
                    lm.last_message_time,
                    a.full_name,
                    a.profile_image,
                    a.account_type as role,
                    a.location_city,
                    CASE 
                        WHEN tp.account_id IS NOT NULL THEN 'tutor'
                        WHEN sp.account_id IS NOT NULL THEN 'student'
                        ELSE a.account_type
                    END as user_role,
                    tp.subjects_taught
                FROM latest_messages lm
                LEFT JOIN accounts a ON lm.other_user_id = a.id
                LEFT JOIN tutor_profiles tp ON a.id = tp.account_id
                LEFT JOIN student_profiles sp ON a.id = sp.account_id
                ORDER BY lm.last_message_time DESC
            `, [userId]);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching conversations:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching conversations',
                error: error.message
            });
        }
    }

    /**
     * Get messages between two users
     */
    static async getMessages(req, res) {
        try {
            const userId = req.user.userId;
            const { otherUserId } = req.params;

            const result = await DatabaseUtils.query(`
                SELECT 
                    m.*,
                    sender.full_name as sender_name,
                    recipient.full_name as recipient_name
                FROM messages m
                LEFT JOIN accounts sender ON m.sender_id = sender.id
                LEFT JOIN accounts recipient ON m.recipient_id = recipient.id
                WHERE 
                    (m.sender_id = $1 AND m.recipient_id = $2) OR 
                    (m.sender_id = $2 AND m.recipient_id = $1)
                ORDER BY m.created_at ASC
            `, [userId, otherUserId]);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching messages',
                error: error.message
            });
        }
    }

    /**
     * Send a message
     */
    static async sendMessage(req, res) {
        try {
            const senderId = req.user.userId;
            const { recipientId, content } = req.body;

            if (!recipientId || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Recipient ID and content are required'
                });
            }

            const result = await DatabaseUtils.query(`
                INSERT INTO messages (sender_id, recipient_id, content)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [senderId, recipientId, content]);

            res.json({
                success: true,
                message: 'Message sent successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({
                success: false,
                message: 'Error sending message',
                error: error.message
            });
        }
    }
}

export default MessageController;
