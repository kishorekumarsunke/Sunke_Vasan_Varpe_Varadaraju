import { pool } from '../../config/database.js';

class AIChatService {
    // Save a message to the database
    async saveMessage(userId, role, message) {
        const query = `
            INSERT INTO ai_chat_messages (user_id, role, message)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, role, message, created_at
        `;

        try {
            const result = await pool.query(query, [userId, role, message]);
            return result.rows[0];
        } catch (error) {
            console.error('Error saving AI chat message:', error);
            throw error;
        }
    }

    // Get chat history for a user
    async getChatHistory(userId, limit = 50) {
        const query = `
            SELECT id, user_id, role, message, created_at
            FROM ai_chat_messages
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `;

        try {
            const result = await pool.query(query, [userId, limit]);
            return result.rows.reverse(); // Return in chronological order
        } catch (error) {
            console.error('Error fetching chat history:', error);
            throw error;
        }
    }

    // Get last N messages for context
    async getLastMessages(userId, count = 3) {
        const query = `
            SELECT id, user_id, role, message, created_at
            FROM ai_chat_messages
            WHERE user_id = $1 AND role != 'system'
            ORDER BY created_at DESC
            LIMIT $2
        `;

        try {
            const result = await pool.query(query, [userId, count]);
            return result.rows.reverse(); // Return in chronological order
        } catch (error) {
            console.error('Error fetching last messages:', error);
            throw error;
        }
    }

    // Delete all chat history for a user
    async deleteChatHistory(userId) {
        const query = `
            DELETE FROM ai_chat_messages
            WHERE user_id = $1
        `;

        try {
            const result = await pool.query(query, [userId]);
            return { deleted: result.rowCount };
        } catch (error) {
            console.error('Error deleting chat history:', error);
            throw error;
        }
    }

    // Call Grok API
    async callGrokAPI(messages, apiKey) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile', // Updated to current Groq model
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1024,
                    top_p: 1,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Grok API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling Grok API:', error);
            throw error;
        }
    }

    // Build system prompt based on user type
    buildSystemPrompt(user) {
        const basePrompt = `You are an AI assistant for Tutor Together, a tutoring platform. Be helpful, friendly, and professional.`;

        if (user.account_type === 'tutor') {
            return `${basePrompt}

You are assisting a tutor named ${user.full_name}.
Tutor Profile:
- Subjects: ${user.subjects_taught?.join(', ') || 'Not specified'}
- Hourly Rate: $${user.hourly_rate || 'Not set'}
- Rating: ${user.rating || 'No ratings yet'}
- Total Sessions: ${user.total_sessions || 0}

Help them with:
- Managing their tutoring schedule
- Preparing lesson materials
- Handling student inquiries
- Improving their teaching methods
- Growing their tutoring business
- Responding to student reviews

Be supportive and provide actionable advice for tutors.`;
        } else if (user.account_type === 'student') {
            return `${basePrompt}

You are assisting a student named ${user.full_name}.
Student Profile:
- Location: ${user.location_city || 'Not specified'}${user.location_state ? ', ' + user.location_state : ''}

Help them with:
- Finding the right tutor
- Preparing for tutoring sessions
- Understanding concepts and homework
- Study tips and learning strategies
- Managing their learning schedule
- Getting the most value from tutoring

Be encouraging and provide helpful learning advice.`;
        }

        return basePrompt;
    }

    // Get user information for prompt context
    async getUserInfo(userId) {
        const query = `
            SELECT 
                a.id,
                a.full_name,
                a.email,
                a.account_type,
                a.location_city,
                a.location_state,
                t.hourly_rate,
                t.subjects_taught,
                t.rating,
                t.total_sessions
            FROM accounts a
            LEFT JOIN tutor_profiles t ON a.id = t.account_id
            WHERE a.id = $1
        `;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw error;
        }
    }
}

export default new AIChatService();
