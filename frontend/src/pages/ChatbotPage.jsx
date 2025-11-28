import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { aiChatService } from '../services/aiChatService';

const ChatbotPage = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load chat history on component mount
    useEffect(() => {
        fetchChatHistory();
    }, []);

    const fetchChatHistory = async () => {
        try {
            setLoading(true);
            const result = await aiChatService.getChatHistory(50);

            if (result.success) {
                const formattedMessages = result.data.map((msg, index) => ({
                    id: index + 1,
                    type: msg.role === 'user' ? 'user' : 'bot',
                    text: msg.message,
                    timestamp: new Date(msg.created_at).toLocaleTimeString()
                }));

                setMessages(formattedMessages);

                if (formattedMessages.length === 0) {
                    setMessages([{
                        id: 1,
                        type: 'bot',
                        text: `Hello ${user?.full_name || user?.name || 'there'}! 👋 I'm your AI assistant powered by Grok. I can help you with tutoring questions, learning strategies, scheduling help, and much more. How can I assist you today?`,
                        timestamp: new Date().toLocaleTimeString()
                    }]);
                }
            } else {
                setError(result.message || 'Failed to load chat history');
            }
        } catch (err) {
            console.error('Error fetching chat history:', err);
            setError('Failed to connect to AI service');
            setMessages([{
                id: 1,
                type: 'bot',
                text: `Hello ${user?.full_name || user?.name || 'there'}! 👋 I'm your AI assistant. How can I help you today?`,
                timestamp: new Date().toLocaleTimeString()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isTyping) return;

        const userMessageText = inputText.trim();
        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            text: userMessageText,
            timestamp: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);
        setError(null);

        try {
            const result = await aiChatService.sendMessage(userMessageText);

            if (result.success) {
                const botResponse = {
                    id: messages.length + 2,
                    type: 'bot',
                    text: result.data.aiResponse.message,
                    timestamp: new Date(result.data.aiResponse.created_at).toLocaleTimeString()
                };

                setMessages(prev => [...prev, botResponse]);
            } else {
                setError(result.message || 'Failed to get AI response');
                setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
            setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        } finally {
            setIsTyping(false);
        }
    };

    const quickQuestions = user?.account_type === 'tutor'
        ? [
            "How can I improve my teaching methods?",
            "Tips for managing my tutoring schedule",
            "How to prepare lesson materials?",
            "Strategies for engaging students",
            "Help with responding to reviews",
            "Growing my tutoring business"
        ]
        : [
            "Help me understand a concept",
            "Study tips for my exams",
            "How to find the right tutor?",
            "Prepare for a tutoring session",
            "Explain a difficult topic",
            "Time management strategies"
        ];

    const handleQuickQuestion = (question) => {
        setInputText(question);
    };

    const handleClearHistory = async () => {
        if (!confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
            return;
        }

        try {
            const result = await aiChatService.clearChatHistory();

            if (result.success) {
                setMessages([{
                    id: 1,
                    type: 'bot',
                    text: `Hello ${user?.full_name || user?.name || 'there'}! 👋 I'm your AI assistant. How can I help you today?`,
                    timestamp: new Date().toLocaleTimeString()
                }]);
            } else {
                setError(result.message || 'Failed to clear chat history');
            }
        } catch (err) {
            console.error('Error clearing chat history:', err);
            setError('Failed to clear chat history');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-3xl">✨</span>
                    </div>
                    <p className="text-slate-400">Loading your AI assistant...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                            <span className="text-2xl">✨</span>
                        </div>
                        <span>AI Assistant</span>
                    </h1>
                    <div className="flex items-center justify-center space-x-4">
                        <p className="text-slate-400 text-lg">Powered by Grok AI</p>
                        {messages.length > 1 && (
                            <button
                                onClick={handleClearHistory}
                                className="text-sm text-slate-500 hover:text-red-400 transition-colors"
                            >
                                Clear History
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Chat Container */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
                        {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-3xl flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user'
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                                        : 'bg-gradient-to-r from-purple-500 to-pink-600'
                                        }`}>
                                        <span className="text-white text-sm">
                                            {message.type === 'user' ? '👤' : '✨'}
                                        </span>
                                    </div>

                                    {/* Message */}
                                    <div className={`px-4 py-3 rounded-2xl ${message.type === 'user'
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                        : 'bg-slate-800/50 border border-slate-700/50 text-white'
                                        }`}>
                                        <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:text-white prose-code:text-purple-300 prose-code:bg-slate-900/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                                            <ReactMarkdown>{message.text}</ReactMarkdown>
                                        </div>
                                        <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-slate-400'
                                            }`}>
                                            {message.timestamp}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="max-w-3xl flex items-start space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm">✨</span>
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Questions */}
                    {messages.length <= 1 && (
                        <div className="px-6 py-4 border-t border-slate-800/50">
                            <h3 className="text-slate-300 text-sm font-medium mb-3">Quick questions to get started:</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {quickQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleQuickQuestion(question)}
                                        className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 text-sm hover:bg-slate-700/50 transition-colors text-left"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-6 border-t border-slate-800/50">
                        <div className="flex items-center space-x-3">
                            <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors">
                                <span className="text-xl">📎</span>
                            </button>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask me anything..."
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 pr-12"
                                    disabled={isTyping}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim() || isTyping}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-purple-400 hover:text-purple-300 transition-colors disabled:text-slate-500 disabled:cursor-not-allowed"
                                >
                                    <span className="text-xl">➤</span>
                                </button>
                            </div>
                            <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors">
                                <span className="text-xl">🎤</span>
                            </button>
                        </div>
                        <div className="mt-2 text-center">
                            <p className="text-slate-500 text-xs">
                                AI can make mistakes. Please verify important information and use your judgment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatbotPage;