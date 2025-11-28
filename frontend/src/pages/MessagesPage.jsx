import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const MessagesPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Fetch all users on component mount
    useEffect(() => {
        fetchAllUsers();
    }, []);

    // Handle navigation from tutor search
    useEffect(() => {
        if (location.state?.selectedUser) {
            const userFromNavigation = location.state.selectedUser;
            setSelectedUser(userFromNavigation);

            // Add the user to allUsers if not already present
            setAllUsers(prevUsers => {
                const userExists = prevUsers.some(u => u.id === userFromNavigation.id);
                if (!userExists) {
                    return [...prevUsers, userFromNavigation];
                }
                return prevUsers;
            });
        }
    }, [location.state]);

    // Filter users based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredUsers(allUsers);
        } else {
            const filtered = allUsers.filter(u =>
                u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.user_role?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, allUsers]);

    // Fetch messages when a user is selected
    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);
        }
    }, [selectedUser]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchAllUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/messages/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAllUsers(data.data || []);
            } else {
                console.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (otherUserId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/messages/${otherUserId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(data.data || []);
            } else {
                console.error('Failed to fetch messages');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() && selectedUser && !sending) {
            setSending(true);
            const messageText = newMessage.trim();
            setNewMessage(''); // Clear input immediately for better UX

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/messages/send`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        recipientId: selectedUser.id,
                        content: messageText
                    })
                });

                if (response.ok) {
                    // Refresh messages to get the new message with proper timestamp
                    fetchMessages(selectedUser.id);
                } else {
                    console.error('Failed to send message');
                    setNewMessage(messageText); // Restore message on failure
                }
            } catch (error) {
                console.error('Error sending message:', error);
                setNewMessage(messageText); // Restore message on failure
            } finally {
                setSending(false);
            }
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString();
        }
    };

    const getRoleDisplay = (user) => {
        const role = user.user_role || user.role || 'user';
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        💬 Messages
                    </h1>
                    <p className="text-slate-400 text-lg">Connect with tutors and students.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
                    {/* People List */}
                    <div className="lg:col-span-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-800/50">
                            <h2 className="text-xl font-semibold text-white mb-4">People</h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search people..."
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                                />
                                <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {filteredUsers.length === 0 ? (
                                <div className="p-6 text-center text-slate-400">
                                    {searchTerm ? 'No people found' : 'No users available'}
                                </div>
                            ) : (
                                filteredUsers.map((person) => (
                                    <div
                                        key={person.id}
                                        onClick={() => setSelectedUser(person)}
                                        className={`p-4 border-b border-slate-800/30 cursor-pointer hover:bg-slate-800/30 transition-colors ${selectedUser?.id === person.id ? 'bg-slate-800/50 border-l-4 border-l-blue-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                {getInitials(person.full_name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-medium truncate">{person.full_name || person.email}</h3>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${person.user_role === 'tutor'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {getRoleDisplay(person)}
                                                    </span>
                                                </div>
                                                {person.subjects_taught && (
                                                    <p className="text-slate-400 text-xs mt-1 truncate">
                                                        Subjects: {person.subjects_taught}
                                                    </p>
                                                )}
                                                {person.current_school && (
                                                    <p className="text-slate-400 text-xs mt-1 truncate">
                                                        School: {person.current_school}
                                                    </p>
                                                )}
                                                {person.location_city && (
                                                    <p className="text-slate-400 text-xs mt-1 truncate">
                                                        📍 {person.location_city}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="lg:col-span-8 bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur-sm flex flex-col overflow-hidden">
                        {selectedUser ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                            {getInitials(selectedUser.full_name)}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{selectedUser.full_name || selectedUser.email}</h3>
                                            <p className="text-slate-400 text-sm">
                                                {getRoleDisplay(selectedUser)}
                                                {selectedUser.subjects_taught && ` • ${selectedUser.subjects_taught}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages - Chat Timeline */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                                                    <span className="text-2xl">👋</span>
                                                </div>
                                                <p className="text-slate-400 text-sm">
                                                    Start a conversation with {selectedUser.full_name || selectedUser.email}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            {messages.map((message, index) => {
                                                const isOwn = message.sender_id === user?.id;
                                                const messageDate = new Date(message.created_at);
                                                const showDateHeader = index === 0 ||
                                                    new Date(messages[index - 1].created_at).toDateString() !== messageDate.toDateString();

                                                return (
                                                    <div key={message.id} className="relative">
                                                        {/* Date Header */}
                                                        {showDateHeader && (
                                                            <div className="flex justify-center mb-4">
                                                                <div className="px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                                                                    <span className="text-xs text-slate-400">
                                                                        {messageDate.toLocaleDateString('en-US', {
                                                                            weekday: 'short',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className={`flex items-end gap-3 mb-6 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                            {/* Avatar for receiver messages */}
                                                            {!isOwn && (
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mb-1">
                                                                    {getInitials(selectedUser.full_name)}
                                                                </div>
                                                            )}

                                                            {/* Message Bubble */}
                                                            <div className={`relative max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
                                                                {/* Message Content */}
                                                                <div className={`px-4 py-3 rounded-2xl shadow-lg ${isOwn
                                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                                                                        : 'bg-slate-800/70 border border-slate-700/50 text-white rounded-bl-md backdrop-blur-sm'
                                                                    }`}>
                                                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                                                </div>

                                                                {/* Timestamp */}
                                                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                                    <span className="text-xs text-slate-500">
                                                                        {formatTime(message.created_at)}
                                                                    </span>
                                                                    {isOwn && (
                                                                        <span className="text-xs text-slate-500">
                                                                            ✓✓
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Message Tail */}
                                                                <div className={`absolute top-3 w-0 h-0 ${isOwn
                                                                        ? 'right-0 translate-x-1 border-l-8 border-l-blue-500 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                                                                        : 'left-0 -translate-x-1 border-r-8 border-r-slate-800 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                                                                    }`}></div>
                                                            </div>

                                                            {/* Avatar for sender messages */}
                                                            {isOwn && (
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mb-1">
                                                                    {getInitials(user?.name)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Auto-scroll anchor */}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </div>

                                {/* Message Input */}
                                <div className="p-6 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                placeholder={`Message ${selectedUser.full_name || selectedUser.email}...`}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 pr-12 transition-all"
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all ${newMessage.trim() && !sending
                                                        ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                                                        : 'text-slate-600 cursor-not-allowed'
                                                    }`}
                                                disabled={!newMessage.trim() || sending}
                                            >
                                                {sending ? (
                                                    <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2.94 6.412A2 2 0 004.414 5h11.172a2 2 0 001.474 1.412L12 10l5.06 3.588A2 2 0 0015.586 15H4.414a2 2 0 00-1.474-1.412L8 10 2.94 6.412z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="text-xs text-slate-500">
                                            Press Enter to send
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${selectedUser ? 'bg-green-400' : 'bg-slate-600'}`}></div>
                                            <span className="text-xs text-slate-500">
                                                {selectedUser ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* No Chat Selected */
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                                        <span className="text-3xl">💬</span>
                                    </div>
                                    <h3 className="text-white font-medium mb-2">Select a person to chat</h3>
                                    <p className="text-slate-400 text-sm">Choose someone from the list to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;