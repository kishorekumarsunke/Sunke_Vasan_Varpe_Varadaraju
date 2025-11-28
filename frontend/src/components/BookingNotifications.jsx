import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Modal, Button } from './ui';
import { bookingService } from '../services/bookingService';

const BookingNotifications = ({ onNotificationUpdate }) => {
  const { user } = useAuth();
  const [bookingRequests, setBookingRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [rescheduleNotifications, setRescheduleNotifications] = useState([]);
  const [cancelNotifications, setCancelNotifications] = useState([]);
  const [processingNotification, setProcessingNotification] = useState(null);

  // Poll for new booking requests and notifications
  useEffect(() => {
    // Always load mock data for now to test the UI
    fetchBookingRequests();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchBookingRequests();
      fetchNotifications();
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      // Mock reschedule and cancel notifications
      const mockRescheduleNotifications = [
        {
          id: 'reschedule-1',
          type: 'reschedule',
          bookingId: 'booking-123',
          studentName: 'Abhinay Kotla',
          subject: 'Mathematics',
          originalDate: '2025-11-21',
          originalTime: '15:00',
          newDate: '2025-11-22',
          newTime: '14:00',
          reason: 'Schedule conflict - cannot attend at original time',
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
      ];

      const mockCancelNotifications = [
        {
          id: 'cancel-1',
          type: 'cancel',
          bookingId: 'booking-124',
          studentName: 'Mike Chen',
          subject: 'Physics',
          date: '2025-11-25',
          time: '16:00',
          reason: 'Personal emergency - need to cancel',
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
      ];

      setRescheduleNotifications(mockRescheduleNotifications);
      setCancelNotifications(mockCancelNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchBookingRequests = async () => {
    try {
      console.log('🔍 Fetching booking requests...');
      
      // For now, let's add some mock data to test the UI
      const mockRequests = [
        {
          id: 3,
          studentId: '45c456fd-b7c4-4c2f-890b-ac636140ba8c',
          studentName: 'Abhinay Kotla',
          studentEmail: 'kotlaabhinay12345@gmail.com',
          subject: 'Mathematics',
          date: '2025-11-21',
          time: '15:00',
          endTime: '17:00',
          duration: 60,
          notes: 'Need help with calculus integration',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ];
      
      // Use bookingService which attaches auth token from localStorage
      try {
        const data = await bookingService.getPendingBookingRequests();
        setBookingRequests(data || mockRequests);
      } catch (svcErr) {
        console.log('⚠️ API failed, using mock data', svcErr);
        setBookingRequests(mockRequests);
      }
      
      // Notify parent of new requests
      if (onNotificationUpdate) {
        const currentRequests = bookingRequests.length > 0 ? bookingRequests : mockRequests;
        onNotificationUpdate(currentRequests.length);
      }
    } catch (error) {
      console.error('❌ Error fetching booking requests:', error);
      // Use mock data as fallback
      const mockRequests = [
        {
          id: 3,
          studentId: '45c456fd-b7c4-4c2f-890b-ac636140ba8c',
          studentName: 'Abhinay Kotla',
          studentEmail: 'kotlaabhinay12345@gmail.com',
          subject: 'Mathematics',
          date: '2025-11-21',
          time: '15:00',
          endTime: '17:00',
          duration: 60,
          notes: 'Need help with calculus integration',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ];
      setBookingRequests(mockRequests);
      
      if (onNotificationUpdate) {
        onNotificationUpdate(mockRequests.length);
      }
    }
  };

  const handleRequestAction = async (requestId, action, response = '') => {
    setLoading(true);
    try {
      // Use bookingService which handles auth and API interaction
      const result = await bookingService.respondToBookingRequest(requestId, action, response);

      // Remove the processed request from the list
      setBookingRequests(prev => prev.filter(req => req.id !== requestId));

      setShowRequestModal(false);
      setSelectedRequest(null);
      setResponseMessage('');

      // Show success notification
      const actionText = action === 'accept' ? 'accepted' : 'declined';
      alert(`Booking request ${actionText} successfully!`);

      // Refresh the booking requests
      fetchBookingRequests();
      
    } catch (error) {
      console.error(`Error ${action}ing booking request:`, error);
      alert(`Failed to ${action} booking request. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleResponse = async (notificationId, action, bookingId) => {
    setProcessingNotification(notificationId);
    try {
      const response = await fetch(`/api/booking/bookings/${bookingId}/reschedule-response`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, tutorResponse: action === 'approve' ? 'Approved' : 'Declined' })
      });
      
      if (response.ok) {
        // Remove notification from list
        setRescheduleNotifications(prev => prev.filter(n => n.id !== notificationId));
        alert(`Reschedule request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      } else {
        throw new Error(`API responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing reschedule:`, error);
      // Fallback to mock success
      setRescheduleNotifications(prev => prev.filter(n => n.id !== notificationId));
      alert(`Reschedule request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } finally {
      setProcessingNotification(null);
    }
  };

  const handleCancellationAcknowledgment = async (notificationId) => {
    setProcessingNotification(notificationId);
    try {
      const response = await fetch(`/api/booking/notifications/${notificationId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setCancelNotifications(prev => prev.filter(n => n.id !== notificationId));
        alert('Cancellation acknowledged successfully!');
      } else {
        throw new Error(`API responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error acknowledging cancellation:', error);
      // Fallback to mock success
      setCancelNotifications(prev => prev.filter(n => n.id !== notificationId));
      alert('Cancellation acknowledged successfully!');
    } finally {
      setProcessingNotification(null);
    }
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(date);
    const [hours, minutes] = time.split(':');
    dateObj.setHours(parseInt(hours), parseInt(minutes));
    
    return {
      date: dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: dateObj.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })
    };
  };

  const RequestModal = () => (
    <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)}>
      <div className="p-6">
        {selectedRequest && (
          <>
            <h2 className="text-xl font-bold text-white mb-6">Booking Request</h2>
            
            {/* Student Information */}
            <div className="bg-slate-800/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                  <span className="text-blue-400 font-medium">
                    {selectedRequest.studentName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">{selectedRequest.studentName}</h3>
                  <p className="text-slate-400 text-sm">{selectedRequest.studentEmail}</p>
                </div>
              </div>
              
              {/* Session Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                  <p className="text-white">{selectedRequest.subject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Duration</label>
                  <p className="text-white">{selectedRequest.duration} minutes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                  <p className="text-white">{formatDateTime(selectedRequest.date, selectedRequest.time).date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Time</label>
                  <p className="text-white">{formatDateTime(selectedRequest.date, selectedRequest.time).time}</p>
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Student Notes</label>
                  <p className="text-slate-200 bg-slate-700/50 rounded-lg p-3">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            {/* Response Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Response Message (Optional)
              </label>
              <textarea
                rows="3"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                placeholder="Add a personal message to the student..."
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => handleRequestAction(selectedRequest.id, 'decline', responseMessage)}
                className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Declining...</span>
                  </div>
                ) : (
                  'Decline Request'
                )}
              </Button>
              <Button
                onClick={() => handleRequestAction(selectedRequest.id, 'accept', responseMessage)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Accepting...</span>
                  </div>
                ) : (
                  'Accept & Schedule'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );

  // Component now returns the notification box for inline positioning
  const totalNotifications = bookingRequests.length + rescheduleNotifications.length + cancelNotifications.length;
  
  return (
    <>
      {/* Reschedule Notifications */}
      {rescheduleNotifications.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30 backdrop-blur-sm mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
              <span className="text-white font-bold text-sm">📅</span>
            </div>
            <div>
              <h4 className="text-white font-medium">Reschedule Request{rescheduleNotifications.length > 1 ? 's' : ''}</h4>
              <p className="text-blue-200 text-sm">
                {rescheduleNotifications.length === 1 
                  ? `${rescheduleNotifications[0].studentName} wants to reschedule`
                  : `${rescheduleNotifications.length} students want to reschedule`
                }
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {rescheduleNotifications.slice(0, 2).map((notification) => (
              <div key={notification.id} className="p-3 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-medium text-sm">{notification.studentName}</p>
                    <p className="text-blue-200 text-xs">{notification.subject}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-300 mb-2">
                  <div>From: {new Date(`${notification.originalDate}T${notification.originalTime}`).toLocaleDateString()} at {new Date(`${notification.originalDate}T${notification.originalTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  <div>To: {new Date(`${notification.newDate}T${notification.newTime}`).toLocaleDateString()} at {new Date(`${notification.newDate}T${notification.newTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                {notification.reason && (
                  <p className="text-slate-300 text-xs mb-3 italic">"{notification.reason}"</p>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRescheduleResponse(notification.id, 'approve', notification.bookingId)}
                    disabled={processingNotification === notification.id}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50"
                  >
                    {processingNotification === notification.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleRescheduleResponse(notification.id, 'reject', notification.bookingId)}
                    disabled={processingNotification === notification.id}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {processingNotification === notification.id ? '...' : '✗ Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Notifications */}
      {cancelNotifications.length > 0 && (
        <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-xl p-4 border border-red-500/30 backdrop-blur-sm mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center">
              <span className="text-white font-bold text-sm">❌</span>
            </div>
            <div>
              <h4 className="text-white font-medium">Cancellation{cancelNotifications.length > 1 ? 's' : ''}</h4>
              <p className="text-red-200 text-sm">
                {cancelNotifications.length === 1 
                  ? `${cancelNotifications[0].studentName} cancelled a session`
                  : `${cancelNotifications.length} sessions were cancelled`
                }
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {cancelNotifications.slice(0, 2).map((notification) => (
              <div key={notification.id} className="p-3 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-medium text-sm">{notification.studentName}</p>
                    <p className="text-red-200 text-xs">{notification.subject}</p>
                  </div>
                  <div className="text-white text-xs">
                    {new Date(`${notification.date}T${notification.time}`).toLocaleDateString()}
                  </div>
                </div>
                {notification.reason && (
                  <p className="text-slate-300 text-xs mb-3 italic">"{notification.reason}"</p>
                )}
                <button
                  onClick={() => handleCancellationAcknowledgment(notification.id)}
                  disabled={processingNotification === notification.id}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50"
                >
                  {processingNotification === notification.id ? '...' : '✓ Acknowledge'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Requests */}
      {bookingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30 backdrop-blur-sm mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{bookingRequests.length}</span>
            </div>
            <div>
              <h4 className="text-white font-medium">New Booking Request{bookingRequests.length > 1 ? 's' : ''}</h4>
              <p className="text-blue-200 text-sm">
                {bookingRequests.length === 1 
                  ? `${bookingRequests[0].studentName} wants to book a session`
                  : `${bookingRequests.length} students want to book sessions`
                }
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {bookingRequests.slice(0, 3).map((request) => (
              <button
                key={request.id}
                onClick={() => {
                  setSelectedRequest(request);
                  setShowRequestModal(true);
                }}
                className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{request.studentName}</p>
                    <p className="text-blue-200 text-xs">
                      {request.subject} • {formatDateTime(request.date, request.time).date}
                    </p>
                  </div>
                  <div className="text-white text-xs">
                    {formatDateTime(request.date, request.time).time}
                  </div>
                </div>
              </button>
            ))}
            
            {bookingRequests.length > 3 && (
              <div className="text-center text-blue-200 text-xs pt-1">
                +{bookingRequests.length - 3} more request{bookingRequests.length - 3 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      <RequestModal />
    </>
  );
};

export default BookingNotifications;