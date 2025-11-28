import aiChatService from '../services/aiChatService.js';

// Get chat history
export const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 50;

        const history = await aiChatService.getChatHistory(userId, limit);

        res.status(200).json({
            success: true,
            data: history,
            message: 'Chat history retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getChatHistory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve chat history',
            error: error.message
        });
    }
};

// Send a message to AI and get response
export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Get user info for context
        const userInfo = await aiChatService.getUserInfo(userId);

        // Save user message
        await aiChatService.saveMessage(userId, 'user', message);

        // Get last 3 messages for context
        const lastMessages = await aiChatService.getLastMessages(userId, 6); // Get 6 to include the just-saved message

        // Build system prompt
        const systemPrompt = aiChatService.buildSystemPrompt(userInfo);

        // Prepare messages for Grok API
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...lastMessages.map(msg => ({
                role: msg.role,
                content: msg.message
            }))
        ];

        // Get API key from environment variable
        const apiKey = process.env.GROK_API_KEY;
        if (!apiKey) {
            throw new Error('GROK_API_KEY not configured');
        }

        // Call Grok API
        const aiResponse = await aiChatService.callGrokAPI(apiMessages, apiKey);

        // Save AI response
        const savedResponse = await aiChatService.saveMessage(userId, 'assistant', aiResponse);

        res.status(200).json({
            success: true,
            data: {
                userMessage: {
                    role: 'user',
                    message: message,
                    created_at: new Date()
                },
                aiResponse: savedResponse
            },
            message: 'Message sent successfully'
        });
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process message',
            error: error.message
        });
    }
};

// Clear chat history
export const clearChatHistory = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await aiChatService.deleteChatHistory(userId);

        res.status(200).json({
            success: true,
            data: result,
            message: 'Chat history cleared successfully'
        });
    } catch (error) {
        console.error('Error in clearChatHistory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear chat history',
            error: error.message
        });
    }
};
