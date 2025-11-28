import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const TutorAvailabilityManager = () => {
    const { user } = useAuth();
    const [availability, setAvailability] = useState({});
    const [calendarSlots, setCalendarSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [viewMode, setViewMode] = useState('calendar'); // 'week' or 'calendar'
    const [currentDate, setCurrentDate] = useState(new Date());

    const [newSlot, setNewSlot] = useState({
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        specificDate: '',
        isRecurring: true
    });

    const daysOfWeek = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday',
        'Friday', 'Saturday', 'Sunday'
    ];

    const timeSlots = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = (i % 2) * 30;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });

    useEffect(() => {
        if (user) {
            loadAvailability();
        }
    }, [user]);

    const loadAvailability = async () => {
        console.log('🔄 Loading availability data...');

        // Check if user exists and is a tutor
        if (!user || !user.id) {
            console.log('⚠️ No user found or user ID missing');
            setError('Please log in to manage availability');
            setAvailability({});
            setCalendarSlots([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('📤 Fetching availability from API for user:', user.id);
            const response = await apiService.get(`/api/availability/tutor/availability/${user.id}`);
            console.log('🔥 Load availability response:', response);

            setAvailability(response.availability || {});
            setCalendarSlots(response.calendarSlots || []);

        } catch (error) {
            console.error('❌ Failed to load availability:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response
            });

            // Handle 404 or no data as normal case (new tutor with no availability set)
            if (error.response && error.response.status === 404) {
                console.log('📝 No availability found for this tutor - this is normal for new users');
                setError(null);
            } else {
                setError(`Failed to load availability: ${error.message}`);
            }

            // Set empty defaults
            setAvailability({});
            setCalendarSlots([]);
        } finally {
            setLoading(false);
        }
    };



    const handleAddSlot = async () => {
        console.log('🔄 Adding new availability slot...');

        try {
            setError(null);
            setSuccess('');

            // Validate times
            if (newSlot.startTime >= newSlot.endTime) {
                setError('End time must be after start time');
                return;
            }

            const requestData = {
                day: newSlot.dayOfWeek,
                dayOfWeek: newSlot.dayOfWeek,
                startTime: newSlot.startTime,
                endTime: newSlot.endTime,
                isRecurring: newSlot.isRecurring,
                specificDate: newSlot.specificDate || null
            };

            console.log('📤 Sending request data:', JSON.stringify(requestData, null, 2));
            console.log('🔗 API URL: /api/availability/tutor/availability');

            console.log('🚀 Making API call...');
            const response = await apiService.post('/api/availability/tutor/availability', requestData);
            console.log('📥 Raw API response:', response);

            console.log('📥 Full API response:', JSON.stringify(response, null, 2));

            if (response && response.success) {
                console.log('✅ Success! Slot added successfully');
                setSuccess('Time slot added successfully!');

                // Reset form
                console.log('🔄 Resetting form...');
                setNewSlot({
                    dayOfWeek: 'Monday',
                    startTime: '09:00',
                    endTime: '10:00',
                    specificDate: '',
                    isRecurring: true
                });

                setShowAddForm(false);
                console.log('🔄 Reloading availability data...');
                await loadAvailability(); // Reload data

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            } else {
                console.error('❌ API call succeeded but response indicates failure:', response);
                setError(response?.message || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('❌ ERROR in handleAddSlot:', error);
            console.error('📋 Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });

            const errorMessage = error.response?.data?.message || error.message || 'Failed to add availability slot';
            console.error('🚨 Setting error message:', errorMessage);
            setError(errorMessage);
        } finally {
            console.log('=== handleAddSlot completed ===');
        }
    };

    const handleRemoveSlot = async (slotId) => {
        try {
            setError(null);

            const response = await apiService.delete(`/api/availability/tutor/availability/${slotId}`);

            if (response && response.success) {
                setSuccess('Time slot removed successfully!');
                loadAvailability(); // Reload data
                setTimeout(() => setSuccess(''), 3000);
            }

        } catch (error) {
            console.error('Failed to remove availability slot:', error);
            setError(error.response?.data?.message || 'Failed to remove availability slot');
        }
    };

    const formatTime = (time) => {
        return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Calendar helper functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday=0

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getSlotsForDate = (date) => {
        if (!date) return [];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return availability[dayName] || [];
    };

    const getDayOrder = (day) => {
        const order = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
        return order[day] || 8;
    };

    // Render calendar view
    const renderCalendarView = () => {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return (
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-white transition-colors"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-white transition-colors"
                        >
                            →
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Day Headers */}
                    {dayNames.map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
                            {day}
                        </div>
                    ))}

                    {/* Calendar Days */}
                    {getDaysInMonth(currentDate).map((date, index) => {
                        const slotsForDay = getSlotsForDate(date);
                        const isToday = date && date.toDateString() === new Date().toDateString();

                        return (
                            <div
                                key={index}
                                className={`min-h-[80px] p-1 border border-slate-700/30 rounded-lg ${date ? 'bg-slate-800/20 hover:bg-slate-800/40' : 'bg-slate-900/20'
                                    } ${isToday ? 'bg-blue-500/10 border-blue-500/30' : ''} transition-colors cursor-pointer`}
                                onClick={() => {
                                    if (date) {
                                        setNewSlot({
                                            ...newSlot,
                                            specificDate: date.toISOString().split('T')[0],
                                            dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
                                            isRecurring: false
                                        });
                                        setShowAddForm(true);
                                    }
                                }}
                            >
                                {date && (
                                    <>
                                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-400' : 'text-white'
                                            }`}>
                                            {date.getDate()}
                                        </div>

                                        {/* Slots for this day */}
                                        <div className="space-y-1">
                                            {slotsForDay.slice(0, 2).map((slot, slotIndex) => (
                                                <div
                                                    key={slotIndex}
                                                    className="text-xs p-1 rounded bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (slot.id) {
                                                            handleRemoveSlot(slot.id);
                                                        }
                                                    }}
                                                >
                                                    {formatTime(slot.startTime)}
                                                </div>
                                            ))}

                                            {slotsForDay.length > 2 && (
                                                <div className="text-xs text-slate-400 text-center">
                                                    +{slotsForDay.length - 2} more
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render week view
    const renderWeekView = () => {
        return (
            <div className="space-y-6">
                {Object.keys(availability)
                    .sort((a, b) => getDayOrder(a) - getDayOrder(b))
                    .map(day => (
                        <div key={day}>
                            <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
                                <span>{day}</span>
                                <span className="text-slate-400 text-sm">({availability[day]?.length || 0} slots)</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {(availability[day] || []).map((slot, index) => (
                                    <div key={index} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 hover:border-slate-600/50 transition-colors group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                                <span className="text-white font-medium">
                                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveSlot(slot.id)}
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1"
                                                title="Remove this slot"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        <div className="text-slate-400 text-sm">
                                            Duration: {((new Date(`2000-01-01 ${slot.endTime}`) - new Date(`2000-01-01 ${slot.startTime}`)) / (1000 * 60 * 60)).toFixed(1)}h
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
        );
    };

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Availability Management</h2>
                    <p className="text-slate-400">Set your available time slots for students to book sessions</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'week'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Week View
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'calendar'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Calendar
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                        <span>+</span>
                        <span>Add Time Slot</span>
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <div className="text-red-300 text-sm">{error}</div>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="text-green-300 text-sm">{success}</div>
                </div>
            )}

            {/* Add/Edit Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Add Availability Slot</h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Schedule Type */}
                            <div>
                                <label className="block text-slate-300 font-medium mb-2">Schedule Type</label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="scheduleType"
                                            checked={newSlot.isRecurring}
                                            onChange={() => setNewSlot({ ...newSlot, isRecurring: true, specificDate: '' })}
                                            className="mr-2"
                                        />
                                        <span className="text-slate-300">Weekly Recurring</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="scheduleType"
                                            checked={!newSlot.isRecurring}
                                            onChange={() => setNewSlot({ ...newSlot, isRecurring: false })}
                                            className="mr-2"
                                        />
                                        <span className="text-slate-300">Specific Date</span>
                                    </label>
                                </div>
                            </div>

                            {/* Date or Day Selection */}
                            {newSlot.isRecurring ? (
                                <div>
                                    <label className="block text-slate-300 font-medium mb-2">Day of Week</label>
                                    <select
                                        value={newSlot.dayOfWeek}
                                        onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        {daysOfWeek.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-slate-300 font-medium mb-2">Specific Date</label>
                                    <input
                                        type="date"
                                        value={newSlot.specificDate}
                                        onChange={(e) => {
                                            const date = new Date(e.target.value);
                                            setNewSlot({
                                                ...newSlot,
                                                specificDate: e.target.value,
                                                dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
                                            });
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-2">Start Time</label>
                                    <select
                                        value={newSlot.startTime}
                                        onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        {timeSlots.map(time => (
                                            <option key={time} value={time}>{formatTime(time)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-medium mb-2">End Time</label>
                                    <select
                                        value={newSlot.endTime}
                                        onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        {timeSlots.map(time => (
                                            <option key={time} value={time}>{formatTime(time)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>


                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleAddSlot}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Add Slot
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading availability...</p>
                </div>
            ) : (Object.keys(availability).length === 0 && calendarSlots.length === 0) ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                        <span className="text-2xl text-slate-400">📅</span>
                    </div>
                    <h3 className="text-white font-medium mb-2">No Availability Set</h3>
                    <p className="text-slate-400 text-sm mb-4">Add your available time slots so students can book sessions with you</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Add Your First Time Slot
                    </button>
                </div>
            ) : viewMode === 'calendar' ? (
                renderCalendarView()
            ) : (
                renderWeekView()
            )}

            {/* Stats */}
            {(Object.keys(availability).length > 0 || calendarSlots.length > 0) && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="text-blue-300">
                            <span className="font-medium">
                                {Object.values(availability).reduce((total, daySlots) => total + (daySlots?.length || 0), 0)} total availability slots
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-slate-400 text-sm">
                                Click on calendar dates to add specific slots
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TutorAvailabilityManager;