import DatabaseUtils from '../utils/database.js';

class MessageController {
    /**
     * Get all users (tutors and students) for conversation list
     */
    static async getAllUsers(req, res) {
        try {
            const currentUserId = req.user.userId;
            
            // Get all users except current user, with their role information
            const result = await DatabaseUtils.query(`
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
                    sp.current_school
                FROM accounts a
                LEFT JOIN tutor_profiles tp ON a.id = tp.account_id
                LEFT JOIN student_profiles sp ON a.id = sp.account_id
                WHERE a.id != $1 AND a.is_active = true
                ORDER BY a.full_name ASC
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

            // Get conversations with last message
            const result = await DatabaseUtils.query(`
                SELECT DISTINCT
                    CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END as other_user_id,
                    a.full_name,
                    a.profile_image,
                    a.account_type as role,
                    CASE 
                        WHEN tp.account_id IS NOT NULL THEN 'tutor'
                        WHEN sp.account_id IS NOT NULL THEN 'student'
                        ELSE a.account_type
                    END as user_role,
                    m.content as last_message,
                    m.created_at as last_message_time,
                    tp.subjects_taught
                FROM messages m
                LEFT JOIN accounts a ON (CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END) = a.id
                LEFT JOIN tutor_profiles tp ON a.id = tp.account_id
                LEFT JOIN student_profiles sp ON a.id = sp.account_id
                WHERE m.sender_id = $1 OR m.recipient_id = $1
                ORDER BY m.created_at DESC
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
