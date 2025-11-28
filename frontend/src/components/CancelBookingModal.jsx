import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { bookingService } from '../services/bookingService';
import './CancelBookingModal.css';

export const CancelBookingModal = ({ 
    isOpen, 
    onClose, 
    booking, 
    onCancelSuccess 
}) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCancel = async () => {
        if (!reason.trim()) {
            setError('Please provide a reason for cancellation');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await bookingService.cancelBooking(booking.id, reason);

            if (response.success) {
                onCancelSuccess(response.booking);
                onClose();
                resetForm();
            } else {
                setError(response.message || 'Failed to cancel booking');
            }
        } catch (error) {
            setError('Failed to cancel booking');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setReason('');
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
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
        return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (!booking) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="cancel-modal">
            <div className="cancel-modal-content">
                <div className="cancel-header">
                    <div className="cancel-icon">
                        ⚠️
                    </div>
                    <h2 className="cancel-title">Cancel Session</h2>
                    <button onClick={handleClose} className="close-button">
                        ×
                    </button>
                </div>

                <div className="cancel-warning">
                    <p>Are you sure you want to cancel this tutoring session?</p>
                    <div className="warning-note">
                        <strong>Note:</strong> Your tutor will be notified immediately, and you may be subject to our cancellation policy.
                    </div>
                </div>

                <div className="session-details">
                    <h3>Session Details</h3>
                    <div className="booking-info">
                        <div className="info-row">
                            <span className="label">Tutor:</span>
                            <span className="value">{booking.tutorName}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Subject:</span>
                            <span className="value">{booking.subject}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Date:</span>
                            <span className="value">{formatDate(booking.date)}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Time:</span>
                            <span className="value">
                                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="label">Duration:</span>
                            <span className="value">{booking.duration} hour(s)</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Amount:</span>
                            <span className="value">${booking.totalAmount}</span>
                        </div>
                    </div>
                </div>

                <div className="reason-section">
                    <label htmlFor="cancel-reason">
                        Reason for Cancellation <span className="required">*</span>
                    </label>
                    <textarea
                        id="cancel-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please explain why you need to cancel this session..."
                        rows="4"
                        className="reason-textarea"
                        required
                    />
                    <div className="reason-options">
                        <div className="quick-reasons">
                            <p>Quick reasons:</p>
                            <div className="reason-buttons">
                                <button 
                                    type="button"
                                    className="reason-btn"
                                    onClick={() => setReason('Schedule conflict - cannot attend at this time')}
                                >
                                    Schedule Conflict
                                </button>
                                <button 
                                    type="button"
                                    className="reason-btn"
                                    onClick={() => setReason('Personal emergency - need to cancel')}
                                >
                                    Emergency
                                </button>
                                <button 
                                    type="button"
                                    className="reason-btn"
                                    onClick={() => setReason('Illness - unable to attend session')}
                                >
                                    Illness
                                </button>
                                <button 
                                    type="button"
                                    className="reason-btn"
                                    onClick={() => setReason('No longer need tutoring for this subject')}
                                >
                                    No Longer Needed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="cancellation-policy">
                    <h4>Cancellation Policy</h4>
                    <ul>
                        <li>Cancellations made 24+ hours in advance: Full refund</li>
                        <li>Cancellations made 4-24 hours in advance: 50% refund</li>
                        <li>Cancellations made less than 4 hours: No refund</li>
                        <li>Emergency cancellations will be reviewed case-by-case</li>
                    </ul>
                </div>

                <div className="modal-actions">
                    <Button 
                        onClick={handleClose}
                        variant="outline"
                        disabled={loading}
                    >
                        Keep Session
                    </Button>
                    <Button 
                        onClick={handleCancel}
                        disabled={loading || !reason.trim()}
                        className="cancel-btn"
                        variant="danger"
                    >
                        {loading ? 'Cancelling...' : 'Cancel Session'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};