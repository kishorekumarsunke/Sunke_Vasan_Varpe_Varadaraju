import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';

const MarkCompleteButton = ({ booking, onCompleted, className = '' }) => {
    const [isCompleting, setIsCompleting] = useState(false);
    const [canComplete, setCanComplete] = useState(false);
    const [timeUntilComplete, setTimeUntilComplete] = useState(null);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [completionNotes, setCompletionNotes] = useState('');

    // Check completion status and update timer
    useEffect(() => {
        const checkCompletionStatus = () => {
            // Add debugging
            console.log('MarkCompleteButton - checking status for booking:', {
                id: booking.id,
                status: booking.status,
                date: booking.date,
                endTime: booking.endTime || booking.end_time
            });

            const canMark = bookingService.canMarkComplete(booking);
            const timeUntil = bookingService.getTimeUntilComplete(booking);

            console.log('MarkCompleteButton - status check result:', { canMark, timeUntil });

            setCanComplete(canMark);
            setTimeUntilComplete(timeUntil);
        };

        // Check immediately
        checkCompletionStatus();

        // Update every minute if session is not yet completable
        const interval = setInterval(checkCompletionStatus, 60000);

        return () => clearInterval(interval);
    }, [booking]);

    const handleMarkComplete = async () => {
        try {
            setIsCompleting(true);

            console.log('MarkCompleteButton - attempting to mark complete:', {
                bookingId: booking.id,
                status: booking.status,
                date: booking.date,
                endTime: booking.endTime || booking.end_time,
                completionNotes
            });

            const result = await bookingService.markSessionComplete(booking.id, completionNotes);

            console.log('MarkCompleteButton - success:', result);

            setShowNotesModal(false);
            setCompletionNotes('');

            // Call the parent callback with updated booking data
            if (onCompleted) {
                onCompleted({
                    ...booking,
                    status: 'completed',
                    completedAt: result.booking.completedAt,
                    sessionNotes: result.booking.sessionNotes
                });
            }

        } catch (error) {
            console.error('MarkCompleteButton - Error details:', error);

            // Show more detailed error message
            const errorMessage = error?.message || error?.error || 'Failed to mark session as complete';
            alert(`Error: ${errorMessage}\n\nBooking ID: ${booking.id}\nStatus: ${booking.status}`);
        } finally {
            setIsCompleting(false);
        }
    };

    const formatTimeUntil = (minutes) => {
        if (minutes <= 0) return '';

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    // Don't show button if already completed
    if (booking.status === 'completed') {
        return (
            <div className="flex items-center space-x-2 text-green-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Completed</span>
            </div>
        );
    }

    // Don't show for cancelled or other statuses
    if (!['scheduled', 'confirmed'].includes(booking.status)) {
        return null;
    }

    return (
        <>
            {canComplete ? (
                <button
                    onClick={() => setShowNotesModal(true)}
                    disabled={isCompleting}
                    className={`px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                >
                    {isCompleting ? (
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full"></div>
                            <span>Completing...</span>
                        </div>
                    ) : (
                        'Mark Complete'
                    )}
                </button>
            ) : (
                <div className="px-4 py-2 bg-gray-500/20 border border-gray-500/30 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                    {timeUntilComplete > 0 && (
                        <span>Complete in {formatTimeUntil(timeUntilComplete)}</span>
                    )}
                </div>
            )}

            {/* Completion Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-md w-full">
                        <h3 className="text-white text-xl font-semibold mb-4">
                            Complete Session
                        </h3>

                        <div className="mb-4">
                            <p className="text-slate-300 text-sm mb-2">
                                {booking.subject || 'Session'} with {booking.tutorName || booking.studentName}
                            </p>
                            <p className="text-slate-400 text-sm">
                                {new Date(booking.date).toLocaleDateString()} at {booking.startTime} - {booking.endTime}
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-slate-300 text-sm font-medium mb-2">
                                Session Notes (optional)
                            </label>
                            <textarea
                                value={completionNotes}
                                onChange={(e) => setCompletionNotes(e.target.value)}
                                placeholder="Add any notes about the session..."
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowNotesModal(false);
                                    setCompletionNotes('');
                                }}
                                disabled={isCompleting}
                                className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkComplete}
                                disabled={isCompleting}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isCompleting ? 'Completing...' : 'Mark Complete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MarkCompleteButton;