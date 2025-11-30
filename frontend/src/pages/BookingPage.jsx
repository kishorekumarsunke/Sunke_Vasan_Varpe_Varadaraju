import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tutorService } from '../services/api';
import { bookingService } from '../services/bookingService';
import { bookingRequestService } from '../services/bookingRequestService';

// Helper function to generate default time slots for a day (9 AM to 5 PM)
const generateDaySlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
        slots.push({
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
        });
    }
    return slots;
};

// Helper function to get default availability (all weekdays)
const getDefaultAvailability = () => ({
    'Monday': generateDaySlots(),
    'Tuesday': generateDaySlots(),
    'Wednesday': generateDaySlots(),
    'Thursday': generateDaySlots(),
    'Friday': generateDaySlots(),
    'Saturday': generateDaySlots(),
    'Sunday': generateDaySlots()
});

const BookingPage = () => {
    const { tutorId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [tutor, setTutor] = useState(null);
    const [availability, setAvailability] = useState({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [sessionType, setSessionType] = useState('general');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [meetingType, setMeetingType] = useState('virtual');
    const [location, setLocation] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = this week, 1 = next week, etc.

    // Load tutor and availability data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load tutor details
                try {
                    const tutorData = await tutorService.getTutorById(tutorId);
                    setTutor(tutorData);
                } catch (error) {
                    // Mock tutor data for demo
                    setTutor({
                        id: tutorId,
                        name: 'Abhinay Kotla',
                        avatar: 'AK',
                        rating: 4.8,
                        reviews: 95,
                        hourlyRate: 50,
                        subjects: ['Mathematics', 'Computer Science'],
                        experience: '5+ years',
                        responseTime: '< 45 min'
                    });
                }

                // Load tutor availability - this comes from tutor profile available_days
                try {
                    const availabilityData = await bookingService.getTutorAvailability(tutorId);
                    console.log('✅ Availability data received:', availabilityData);
                    
                    // Check if availability data is empty or has no days
                    const availabilityObj = availabilityData.availability || {};
                    const hasAvailability = Object.keys(availabilityObj).length > 0;
                    
                    if (hasAvailability) {
                        setAvailability(availabilityObj);
                    } else {
                        // If tutor hasn't set availability, use default weekday availability
                        console.log('⚠️ Tutor has no availability set, using default weekday schedule');
                        setAvailability(getDefaultAvailability());
                    }
                } catch (error) {
                    console.error('❌ Error loading tutor availability:', error);
                    // Fall back to demo availability for testing when API is not available
                    console.log('🔄 Using demo availability data');
                    setAvailability(getDefaultAvailability());
                }

            } catch (error) {
                console.error('Error loading booking data:', error);
                setError('Failed to load booking information');
            } finally {
                setLoading(false);
            }
        };

        if (tutorId) {
            loadData();
        }
    }, [tutorId]);

    // Get available dates for the current week being viewed
    const getAvailableDates = () => {
        const dates = [];
        const today = new Date();

        // Calculate start date based on current week offset
        const startDate = new Date(today);
        startDate.setDate(today.getDate() + (currentWeekOffset * 7));

        // Show 7 days starting from the calculated start date
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            // Skip dates in the past (only for current week)
            if (currentWeekOffset === 0 && date <= today) {
                continue;
            }

            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const dateString = date.toISOString().split('T')[0];

            // Check if tutor has availability on this day
            if (availability[dayName] && availability[dayName].length > 0) {
                dates.push({
                    date: dateString,
                    dayName,
                    displayDate: date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    })
                });
            }
        }

        return dates;
    };    // Get available time slots for selected date
    const getAvailableTimeSlots = () => {
        if (!selectedDate) return [];

        // Parse the date string correctly to avoid timezone issues
        // selectedDate is in format "YYYY-MM-DD"
        const [year, month, day] = selectedDate.split('-').map(Number);
        const selectedDateObj = new Date(year, month - 1, day); // month is 0-indexed
        const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });

        console.log('📅 Selected date:', selectedDate, '-> Day name:', dayName);
        console.log('📅 Available slots for', dayName, ':', availability[dayName]);

        return availability[dayName] || [];
    };

    // Handle booking submission
    const handleBooking = async () => {
        if (!selectedTimeSlot || !selectedDate) {
            setError('Please select a date and time slot');
            return;
        }

        if (!selectedSubject) {
            setError('Please select a subject for the session');
            return;
        }

        if (meetingType === 'in_person' && !location.trim()) {
            setError('Please provide a meeting location for in-person sessions');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Create booking request (sends notification to tutor)
            const bookingRequestData = {
                tutorId: tutorId,
                bookingDate: selectedDate,
                startTime: selectedTimeSlot.startTime,
                endTime: selectedTimeSlot.endTime,
                sessionType: sessionType,
                subject: selectedSubject || 'General',
                notes: notes,
                meetingType: meetingType,
                meetingLink: meetingType === 'virtual' ? meetingLink : null,
                location: meetingType === 'in_person' ? location : null
            };

            // Try to create booking request via API
            try {
                const result = await bookingRequestService.createBookingRequest(bookingRequestData);
                console.log('✅ Booking request created:', result);

                // Navigate to student dashboard with success message and switch to Sessions tab
                navigate('/student-dashboard', {
                    state: {
                        message: `Booking request sent to ${tutor.name}! They will be notified and can accept or decline your request.`,
                        type: 'success',
                        activeTab: 'sessions'
                    },
                    replace: true
                });
                return;
            } catch (apiError) {
                console.error('Error creating booking request:', apiError);
                if (apiError.error) {
                    setError(apiError.error);
                    return;
                }
                console.log('API not available, using mock flow');
            }

            // Mock success for demo
            setTimeout(() => {
                navigate('/student-dashboard', {
                    state: {
                        message: `Booking request sent to ${tutor.name}! They will be notified and can accept or decline your request. Check your Sessions tab for updates.`,
                        type: 'success',
                        activeTab: 'sessions'
                    },
                    replace: true
                });
            }, 1500);

        } catch (error) {
            console.error('Error creating booking request:', error);
            setError(error.error || 'Failed to send booking request');
        } finally {
            setSubmitting(false);
        }
    };

    const sessionTypes = [
        { value: 'general', label: 'General Tutoring' },
        { value: 'homework', label: 'Homework Help' },
        { value: 'exam_prep', label: 'Exam Preparation' },
        { value: 'project', label: 'Project Assistance' },
        { value: 'consultation', label: 'Academic Consultation' }
    ];

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

    if (error && !tutor) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-3xl text-red-400">⚠️</span>
                    </div>
                    <h2 className="text-white font-medium mb-2">Failed to Load</h2>
                    <p className="text-slate-400 text-sm mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/tutors')}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                        Back to Tutors
                    </button>
                </div>
            </div>
        );
    }

    const availableDates = getAvailableDates();
    const timeSlots = getAvailableTimeSlots();

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/tutors')}
                        className="text-slate-400 hover:text-white mb-4 flex items-center space-x-2 transition-colors"
                    >
                        <span>←</span>
                        <span>Back to Tutors</span>
                    </button>

                    <h1 className="text-3xl font-bold text-white mb-2">
                        Book a Session
                    </h1>
                    <p className="text-slate-400">Schedule a tutoring session with {tutor?.name}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Tutor Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-6 sticky top-8">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                    {tutor?.avatar}
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-1">{tutor?.name}</h3>
                                <div className="flex items-center justify-center space-x-1 mb-3">
                                    <span className="text-yellow-400">⭐</span>
                                    <span className="text-white font-medium">{tutor?.rating}</span>
                                    <span className="text-slate-400 text-sm">({tutor?.reviews} reviews)</span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">${tutor?.hourlyRate}</div>
                                <div className="text-slate-400 text-sm">per hour</div>
                            </div>

                            {/* Subjects */}
                            <div className="mb-6">
                                <h4 className="text-white font-medium mb-3">Subjects</h4>
                                <div className="flex flex-wrap gap-2">
                                    {tutor?.subjects?.slice(0, 4).map((subject, index) => (
                                        <span key={index} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Experience</span>
                                    <span className="text-white">{tutor?.experience}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Response Time</span>
                                    <span className="text-white">{tutor?.responseTime}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-6">
                            {/* Date Selection */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-white font-medium">Select Date</h4>
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
                                            disabled={currentWeekOffset === 0}
                                            className={`p-2 rounded-lg border transition-colors ${currentWeekOffset === 0
                                                ? 'bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed'
                                                : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                                                }`}
                                        >
                                            ←
                                        </button>
                                        <span className="text-slate-300 text-sm min-w-20 text-center">
                                            {currentWeekOffset === 0 ? 'This Week' :
                                                currentWeekOffset === 1 ? 'Next Week' :
                                                    `${currentWeekOffset} weeks`}
                                        </span>
                                        <button
                                            onClick={() => setCurrentWeekOffset(Math.min(8, currentWeekOffset + 1))}
                                            disabled={currentWeekOffset >= 8}
                                            className={`p-2 rounded-lg border transition-colors ${currentWeekOffset >= 8
                                                ? 'bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed'
                                                : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                                                }`}
                                        >
                                            →
                                        </button>
                                    </div>
                                </div>
                                {availableDates.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {availableDates.map((dateInfo) => (
                                            <button
                                                key={dateInfo.date}
                                                onClick={() => {
                                                    setSelectedDate(dateInfo.date);
                                                    setSelectedTimeSlot(null); // Reset time slot selection
                                                }}
                                                className={`p-3 rounded-lg border transition-colors text-center ${selectedDate === dateInfo.date
                                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                                    : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                                                    }`}
                                            >
                                                <div className="font-medium">{dateInfo.displayDate}</div>
                                                <div className="text-xs text-slate-400">{dateInfo.dayName}</div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-slate-400 mb-2">No availability found</div>
                                        <div className="text-slate-500 text-sm">
                                            {currentWeekOffset === 0
                                                ? 'This tutor has no available slots this week'
                                                : `This tutor has no available slots in ${currentWeekOffset === 1 ? 'next week' : `${currentWeekOffset} weeks`}`}
                                        </div>
                                        <div className="text-slate-500 text-xs mt-1">Try navigating to different weeks using the arrows above</div>
                                    </div>
                                )}
                            </div>

                            {/* Time Slot Selection */}
                            {selectedDate && (
                                <div className="mb-6">
                                    <h4 className="text-white font-medium mb-4">Select Time</h4>
                                    {timeSlots.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {timeSlots.map((slot, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedTimeSlot(slot)}
                                                    className={`p-3 rounded-lg border transition-colors text-center ${selectedTimeSlot === slot
                                                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                                        : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                                                        }`}
                                                >
                                                    <div className="font-medium">
                                                        {bookingService.formatTime(slot.startTime)} - {bookingService.formatTime(slot.endTime)}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {bookingService.calculateDuration(slot.startTime, slot.endTime)}h session
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="text-slate-400">No time slots available</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Session Type */}
                            <div className="mb-6">
                                <label className="block text-white font-medium mb-3">Session Type</label>
                                <select
                                    value={sessionType}
                                    onChange={(e) => setSessionType(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    {sessionTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Selection */}
                            <div className="mb-6">
                                <label className="block text-white font-medium mb-3">Subject</label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="">Select a subject...</option>
                                    {tutor?.subjects?.map((subject, index) => (
                                        <option key={index} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </select>
                                {tutor?.subjects?.length === 0 && (
                                    <p className="text-slate-400 text-sm mt-2">No subjects available for this tutor</p>
                                )}
                            </div>

                            {/* Meeting Type */}
                            <div className="mb-6">
                                <label className="block text-white font-medium mb-3">Meeting Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setMeetingType('virtual')}
                                        className={`p-4 rounded-lg border transition-all ${meetingType === 'virtual'
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                            : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-2">💻</div>
                                            <div className="font-medium">Virtual</div>
                                            <div className="text-xs text-slate-400 mt-1">Online meeting via video call</div>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMeetingType('in_person')}
                                        className={`p-4 rounded-lg border transition-all ${meetingType === 'in_person'
                                            ? 'bg-green-500/20 border-green-500/50 text-green-300'
                                            : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-2">🏢</div>
                                            <div className="font-medium">In-Person</div>
                                            <div className="text-xs text-slate-400 mt-1">Meet at a physical location</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Location for In-Person */}
                            {meetingType === 'in_person' && (
                                <div className="mb-6">
                                    <label className="block text-white font-medium mb-3">Meeting Location</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Enter the meeting location (e.g., University Library, Cafe, etc.)"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500/50"
                                        required
                                    />
                                </div>
                            )}

                            {/* Meeting Link for Virtual */}
                            {meetingType === 'virtual' && (
                                <div className="mb-6">
                                    <label className="block text-white font-medium mb-3">Meeting Link (Optional)</label>
                                    <input
                                        type="url"
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                        placeholder="Enter meeting link (Zoom, Google Meet, etc.) or leave blank for tutor to provide"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                                    />
                                    <div className="mt-2 text-xs text-slate-400">
                                        💡 If left blank, the tutor will provide the meeting link when they accept your booking
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="mb-6">
                                <label className="block text-white font-medium mb-3">Session Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any specific topics you'd like to focus on, questions you have, or additional information for the tutor..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 resize-none"
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                                    <div className="text-red-300 text-sm">{error}</div>
                                </div>
                            )}

                            {/* Booking Summary */}
                            {selectedTimeSlot && selectedDate && (
                                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <h5 className="text-blue-300 font-medium mb-2">Booking Summary</h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Date:</span>
                                            <span className="text-white">
                                                {new Date(selectedDate).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Time:</span>
                                            <span className="text-white">
                                                {bookingService.formatTime(selectedTimeSlot.startTime)} - {bookingService.formatTime(selectedTimeSlot.endTime)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Duration:</span>
                                            <span className="text-white">
                                                {bookingService.calculateDuration(selectedTimeSlot.startTime, selectedTimeSlot.endTime)} hour(s)
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-300">Meeting Type:</span>
                                            <span className="text-white flex items-center space-x-1">
                                                <span>{meetingType === 'virtual' ? '💻' : '🏢'}</span>
                                                <span>{meetingType === 'virtual' ? 'Virtual' : 'In-Person'}</span>
                                            </span>
                                        </div>
                                        {meetingType === 'in_person' && location && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-300">Location:</span>
                                                <span className="text-white">{location}</span>
                                            </div>
                                        )}
                                        {meetingType === 'virtual' && meetingLink && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-300">Meeting Link:</span>
                                                <span className="text-white text-xs truncate max-w-48" title={meetingLink}>
                                                    {meetingLink}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-medium">
                                            <span className="text-slate-300">Total Cost:</span>
                                            <span className="text-white">
                                                ${(bookingService.calculateDuration(selectedTimeSlot.startTime, selectedTimeSlot.endTime) * tutor?.hourlyRate).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => navigate('/tutors')}
                                    className="flex-1 px-6 py-3 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBooking}
                                    disabled={!selectedTimeSlot || !selectedDate || submitting}
                                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${selectedTimeSlot && selectedDate && !submitting
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                                        : 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {submitting ? 'Booking...' : 'Book Session'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;