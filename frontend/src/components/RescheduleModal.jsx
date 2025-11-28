import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import { bookingService } from '../services/bookingService';
import './RescheduleModal.css';

export const RescheduleModal = ({ 
    isOpen, 
    onClose, 
    booking, 
    onRescheduleSuccess 
}) => {
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && booking) {
            loadAvailableSlots();
        }
    }, [isOpen, booking]);

    const loadAvailableSlots = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await bookingService.getAvailableRescheduleSlots(
                booking.tutorId, 
                booking.id
            );
            setAvailableSlots(response.availableSlots || []);
        } catch (error) {
            setError('Failed to load available time slots');
        } finally {
            setLoading(false);
        }
    };

    const handleReschedule = async () => {
        if (!selectedSlot) {
            setError('Please select a new time slot');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await bookingService.rescheduleBooking(
                booking.id,
                selectedSlot.date,
                selectedSlot.startTime,
                selectedSlot.endTime,
                reason
            );

            if (response.success) {
                onRescheduleSuccess(response.booking);
                onClose();
                resetForm();
            } else {
                setError(response.message || 'Failed to reschedule booking');
            }
        } catch (error) {
            setError('Failed to reschedule booking');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedSlot(null);
        setReason('');
        setError('');
        setAvailableSlots([]);
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
        <Modal isOpen={isOpen} onClose={handleClose} className="reschedule-modal">
            <div className="reschedule-modal-content">
                <div className="reschedule-header">
                    <h2 className="reschedule-title">Reschedule Session</h2>
                    <button onClick={handleClose} className="close-button">
                        ×
                    </button>
                </div>

                <div className="current-booking-info">
                    <h3>Current Session</h3>
                    <div className="booking-details">
                        <p><strong>Tutor:</strong> {booking.tutorName}</p>
                        <p><strong>Subject:</strong> {booking.subject}</p>
                        <p><strong>Current Date:</strong> {formatDate(booking.date)}</p>
                        <p><strong>Current Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                        <p><strong>Duration:</strong> {booking.duration} hour(s)</p>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading available time slots...</p>
                    </div>
                ) : (
                    <div className="available-slots-section">
                        <h3>Available Time Slots</h3>
                        {availableSlots.length === 0 ? (
                            <div className="no-slots">
                                <p>No available slots found for this tutor.</p>
                                <Button 
                                    onClick={loadAvailableSlots}
                                    variant="outline"
                                    size="sm"
                                >
                                    Refresh
                                </Button>
                            </div>
                        ) : (
                            <div className="slots-grid">
                                {availableSlots.map((daySlots) => (
                                    <div key={daySlots.date} className="day-slots">
                                        <h4 className="day-header">
                                            {formatDate(daySlots.date)}
                                        </h4>
                                        <div className="time-slots">
                                            {daySlots.slots.map((slot, index) => (
                                                <button
                                                    key={index}
                                                    className={`time-slot ${
                                                        selectedSlot?.date === daySlots.date && 
                                                        selectedSlot?.startTime === slot.startTime
                                                            ? 'selected' 
                                                            : ''
                                                    }`}
                                                    onClick={() => setSelectedSlot({
                                                        date: daySlots.date,
                                                        startTime: slot.startTime,
                                                        endTime: slot.endTime
                                                    })}
                                                >
                                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {selectedSlot && (
                    <div className="selected-slot-info">
                        <h4>New Session Time</h4>
                        <p>
                            <strong>{formatDate(selectedSlot.date)}</strong> at{' '}
                            <strong>{formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}</strong>
                        </p>
                    </div>
                )}

                <div className="reason-section">
                    <label htmlFor="reschedule-reason">
                        Reason for Rescheduling (Optional)
                    </label>
                    <textarea
                        id="reschedule-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please provide a reason for rescheduling..."
                        rows="3"
                        className="reason-textarea"
                    />
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="modal-actions">
                    <Button 
                        onClick={handleClose}
                        variant="outline"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleReschedule}
                        disabled={loading || !selectedSlot}
                        className="reschedule-btn"
                    >
                        {loading ? 'Requesting...' : 'Request Reschedule'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};