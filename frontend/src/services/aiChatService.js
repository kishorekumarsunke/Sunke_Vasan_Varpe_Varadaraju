const API_BASE_URL = 'http://localhost:5000/api';

class AIChatService {
    // Get authentication headers
    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // Get chat history
    async getChatHistory(limit = 50) {
        try {
            const response = await fetch(`${API_BASE_URL}/ai-chat/history?limit=${limit}`, {
                headers: this.getHeaders()
            });

            const result = await response.json();

            if (response.ok && result.success) {
                return {
                    success: true,
                    data: result.data
                };
            } else {
                return {
                    success: false,
                    message: result.message || 'Failed to load chat history'
                };
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return {
                success: false,
                message: 'Failed to connect to AI service'
            };
        }
    }

    // Send a message to AI
    async sendMessage(message) {
        try {
            const response = await fetch(`${API_BASE_URL}/ai-chat/message`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ message })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                return {
                    success: true,
                    data: result.data
                };
            } else {
                return {
                    success: false,
                    message: result.message || 'Failed to get AI response'
                };
            }
        } catch (error) {
            console.error('Error sending message:', error);
            return {
                success: false,
                message: 'Failed to send message. Please try again.'
            };
        }
    }

    // Clear chat history
    async clearChatHistory() {
        try {
            const response = await fetch(`${API_BASE_URL}/ai-chat/history`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            const result = await response.json();

            if (response.ok && result.success) {
                return {
                    success: true,
                    data: result.data
                };
            } else {
                return {
                    success: false,
                    message: result.message || 'Failed to clear chat history'
                };
            }
        } catch (error) {
            console.error('Error clearing chat history:', error);
            return {
                success: false,
                message: 'Failed to clear chat history'
            };
        }
    }
}

export const aiChatService = new AIChatService();
