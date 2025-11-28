import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AIChatIcon.css';

const AIChatIcon = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show the icon on the chatbot page itself
    if (location.pathname === '/chatbot') {
        return null;
    }

    const handleChatClick = () => {
        navigate('/chatbot');
    };

    return (
        <div className="ai-chat-container" onClick={handleChatClick}>
            <div className="ai-chat-button">
                {/* Modern AI chat icon SVG */}
                <svg className="ai-chat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>

                {/* AI indicator with sparkle effect */}
                <div className="ai-indicator-outer"></div>
                <div className="ai-indicator-inner"></div>
            </div>

            {/* Tooltip */}
            <div className="ai-chat-tooltip">
                AI Assistant
                <div className="ai-chat-tooltip-arrow"></div>
            </div>
        </div>
    );
};

export default AIChatIcon;