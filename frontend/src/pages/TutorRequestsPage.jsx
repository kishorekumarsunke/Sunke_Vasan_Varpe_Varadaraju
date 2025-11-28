import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingRequestService } from '../services/bookingRequestService';

const TutorRequestsPage = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [processingRequest, setProcessingRequest] = useState(null);

    // Load booking requests
    useEffect(() => {
        const loadRequests = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await bookingRequestService.getTutorBookingRequests(statusFilter);
                setRequests(data.requests || []);
            } catch (error) {
                console.error('Error loading booking requests:', error);
                setError(error.error || 'Failed to load booking requests');
                // Mock data for demo
                setRequests([
                    {
                        id: 1,
                        studentName: 'John Doe',
                        studentEmail: 'john@example.com',
                        date: '2024-11-25',
                        startTime: '10:00',
                        endTime: '11:00',
                        duration: 1,
                        sessionType: 'general',
                        subject: 'Mathematics',
                        meetingType: 'virtual',
                        notes: 'Need help with calculus',
                        hourlyRate: 50,
                        totalAmount: 50,
                        status: 'pending',
                        createdAt: '2024-11-22T10:00:00Z'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        loadRequests();
    }, [statusFilter]);

    // Handle approve/decline request
    const handleRequestResponse = async (requestId, action, responseMessage = '') => {
        try {
            setProcessingRequest(requestId);
            await bookingRequestService.respondToBookingRequest(requestId, action, responseMessage);

            // Remove from list or update status
            setRequests(prev => prev.filter(req => req.id !== requestId));

            // Show success message
            alert(`Booking request ${action}d successfully!`);
        } catch (error) {
            console.error(`Error ${action}ing request:`, error);
            alert(`Failed to ${action} request: ${error.error || 'Unknown error'}`);
        } finally {
            setProcessingRequest(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        const [hour, minute] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hour), parseInt(minute));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
                    <div className="animate-pulse text-center">
                        <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4"></div>
                        <div className="w-32 h-4 bg-slate-700 rounded mx-auto mb-2"></div>
                        <div className="w-24 h-3 bg-slate-700 rounded mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Booking Requests
                    </h1>
                    <p className="text-slate-400">Review and respond to student booking requests</p>
                </div>

                {/* Status Filter */}
                <div className="mb-6">
                    <div className="flex space-x-4">
                        {['pending', 'approved', 'declined'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg border transition-colors capitalize ${statusFilter === status
                                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                        : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                                    }`}
                            >
                                {status} ({requests.length})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Requests List */}
                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-slate-400 mb-2">No {statusFilter} requests found</div>
                            <div className="text-slate-500 text-sm">
                                {statusFilter === 'pending'
                                    ? 'New booking requests will appear here'
                                    : `No ${statusFilter} requests to show`}
                            </div>
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div key={request.id} className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Request Details */}
                                    <div className="lg:col-span-2">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-semibold text-white mb-1">
                                                    {request.studentName}
                                                </h3>
                                                <p className="text-slate-400">{request.studentEmail}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                                    request.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                                                        'bg-red-500/20 text-red-300'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <div className="text-slate-400 text-sm">Date & Time</div>
                                                <div className="text-white font-medium">
                                                    {formatDate(request.date)}
                                                </div>
                                                <div className="text-slate-300">
                                                    {formatTime(request.startTime)} - {formatTime(request.endTime)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-slate-400 text-sm">Session Details</div>
                                                <div className="text-white font-medium">
                                                    {request.duration}h {request.sessionType} session
                                                </div>
                                                <div className="text-slate-300">
                                                    Subject: {request.subject || 'General'}
                                                </div>
                                                <div className="text-slate-300 capitalize">
                                                    {request.meetingType}
                                                    {request.location && ` at ${request.location}`}
                                                </div>
                                            </div>
                                        </div>

                                        {request.notes && (
                                            <div className="mb-4">
                                                <div className="text-slate-400 text-sm mb-1">Student Notes</div>
                                                <div className="text-slate-300 bg-slate-800/50 rounded-lg p-3">
                                                    {request.notes}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions & Pricing */}
                                    <div className="lg:col-span-1">
                                        <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-white mb-1">
                                                    ${request.totalAmount}
                                                </div>
                                                <div className="text-slate-400 text-sm">
                                                    ${request.hourlyRate}/hr × {request.duration}h
                                                </div>
                                            </div>
                                        </div>

                                        {request.status === 'pending' && (
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => handleRequestResponse(request.id, 'approve')}
                                                    disabled={processingRequest === request.id}
                                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                                >
                                                    {processingRequest === request.id ? 'Processing...' : 'Accept Request'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const message = prompt('Optional message for declining:');
                                                        if (message !== null) { // User didn't cancel
                                                            handleRequestResponse(request.id, 'decline', message);
                                                        }
                                                    }}
                                                    disabled={processingRequest === request.id}
                                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-600/50 rounded-lg font-medium transition-colors disabled:opacity-50"
                                                >
                                                    Decline Request
                                                </button>
                                            </div>
                                        )}

                                        {request.responseMessage && (
                                            <div className="mt-4">
                                                <div className="text-slate-400 text-sm mb-1">Your Response</div>
                                                <div className="text-slate-300 bg-slate-800/50 rounded-lg p-3 text-sm">
                                                    {request.responseMessage}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TutorRequestsPage;