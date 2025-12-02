import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import { taskService } from '../services/taskService';
import MarkCompleteButton from '../components/MarkCompleteButton';

const CalendarPage = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().getDate());
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(null);
    const [realBookings, setRealBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [realTasks, setRealTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);

    // Load real booking data and tasks based on user role
    useEffect(() => {
        const loadBookings = async () => {
            try {
                setLoadingBookings(true);
                let bookings;

                if (user?.role === 'student') {
                    bookings = await bookingService.getStudentBookings();
                } else if (user?.role === 'tutor') {
                    bookings = await bookingService.getTutorBookings();
                } else {
                    bookings = [];
                }

                console.log('📥 Raw API response for bookings:', bookings);
                console.log('📥 Response type:', typeof bookings);
                console.log('📥 Response keys:', bookings ? Object.keys(bookings) : 'none');
                if (bookings && bookings.bookings) {
                    console.log('📋 bookings.bookings found:', bookings.bookings);
                    console.log('📋 bookings.bookings length:', bookings.bookings.length);
                    console.log('📋 First booking:', bookings.bookings[0]);
                }

                // Handle different response formats (bookings might be nested)
                const bookingsArray = bookings?.bookings || bookings?.data || bookings || [];
                console.log('📋 Extracted bookings array:', bookingsArray);
                console.log('📋 Bookings array length:', bookingsArray.length);

                // Ensure bookings is always an array
                const finalBookingsArray = Array.isArray(bookingsArray) ? bookingsArray : [];
                console.log('🔄 Setting realBookings to:', finalBookingsArray);
                setRealBookings(finalBookingsArray);
            } catch (error) {
                console.error('Failed to load bookings for calendar:', error);
                console.log('🔄 Setting realBookings to empty array due to error');
                // Keep empty array if loading fails
                setRealBookings([]);
            } finally {
                setLoadingBookings(false);
            }
        };

        const loadTasks = async () => {
            try {
                setLoadingTasks(true);
                const result = await taskService.getTasks();
                console.log('Loaded tasks for calendar:', result.data);

                // Transform tasks to calendar events
                const transformedTasks = result.data.map(task => {
                    // Ensure date is in YYYY-MM-DD format
                    let formattedDate = task.due_date;

                    if (task.due_date) {
                        // Handle various date formats
                        const dateObj = new Date(task.due_date);
                        if (!isNaN(dateObj.getTime())) {
                            // Valid date - format as YYYY-MM-DD
                            const year = dateObj.getFullYear();
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            formattedDate = `${year}-${month}-${day}`;
                        }
                    }

                    console.log('Task date transformation:', task.due_date, '->', formattedDate);

                    return {
                        id: `task-${task.id}`,
                        title: task.title,
                        date: formattedDate,
                        time: '23:59',
                        type: 'task',
                        priority: task.priority,
                        status: task.status,
                        subject: task.subject,
                        description: task.description,
                        progress: task.progress,
                        color: task.priority === 'high' ? 'bg-red-500' :
                            task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                    };
                });

                console.log('Transformed tasks for calendar:', transformedTasks);
                setRealTasks(transformedTasks);
            } catch (error) {
                console.error('Failed to load tasks for calendar:', error);
                setRealTasks([]);
            } finally {
                setLoadingTasks(false);
            }
        };

        if (user?.role === 'student' || user?.role === 'tutor') {
            loadBookings();
            loadTasks();
        } else {
            setLoadingBookings(false);
            setLoadingTasks(false);
        }
    }, [user?.role]);

    // Generate events based on user role
    const getEventsForRole = () => {
        console.log('realBookings in getEventsForRole:', realBookings);
        console.log('user role:', user?.role);

        // Convert real bookings to calendar events for both students and tutors
        const bookingEvents = (Array.isArray(realBookings) ? realBookings : []).map(booking => {
            console.log('Processing booking for calendar:', booking);

            // Validate required fields
            if (!booking.id || !booking.date) {
                console.warn('Booking missing required fields:', booking);
                return null;
            }

            if (user?.role === 'tutor') {
                return {
                    id: booking.id,
                    title: `${booking.subject || 'Session'} - ${booking.studentName || 'Student'}`,
                    date: booking.date,
                    time: booking.startTime || '00:00',
                    type: 'session',
                    status: booking.status || 'pending',
                    student: booking.studentName || 'Student',
                    subject: booking.subject || 'General',
                    duration: booking.duration || 60,
                    meetingType: booking.meetingType || 'virtual',
                    location: booking.location || null,
                    totalAmount: booking.totalAmount || 0,
                    color: booking.status === 'completed' ? 'bg-green-500' :
                        (booking.status === 'confirmed' || booking.status === 'scheduled') ? 'bg-blue-500' :
                            booking.status === 'pending' ? 'bg-yellow-500' :
                                booking.status === 'cancelled' ? 'bg-red-500' :
                                    booking.status === 'rejected' ? 'bg-red-400' : 'bg-gray-500'
                };
            } else {
                return {
                    id: booking.id,
                    title: `${booking.subject || 'Session'} - ${booking.tutorName || 'Tutor'}`,
                    date: booking.date,
                    time: booking.startTime || '00:00',
                    type: 'session',
                    tutor: booking.tutorName || 'Tutor',
                    subject: booking.subject || 'General',
                    status: booking.status || 'pending',
                    meetingType: booking.meetingType || 'virtual',
                    location: booking.location || null,
                    duration: booking.duration || 60,
                    totalAmount: booking.totalAmount || 0,
                    color: (booking.status === 'confirmed' || booking.status === 'scheduled') ? 'bg-green-500' :
                        booking.status === 'pending' ? 'bg-yellow-500' :
                            booking.status === 'completed' ? 'bg-blue-500' :
                                booking.status === 'cancelled' ? 'bg-red-500' :
                                    booking.status === 'rejected' ? 'bg-red-400' : 'bg-gray-500'
                };
            }
        }).filter(Boolean); // Remove any null bookings

        // Combine booking events with real task events
        const allEvents = [...bookingEvents, ...realTasks];
        console.log('📊 Calendar Events Summary:');
        console.log('- Booking events:', bookingEvents.length, bookingEvents);
        console.log('- Task events:', realTasks.length, realTasks);
        console.log('- All combined events:', allEvents.length, allEvents);
        return allEvents;
    };

    const events = getEventsForRole();

    // iCal export functionality
    const generateICalContent = (events) => {
        // Filter only valid events with scheduled/confirmed status for sessions
        const exportableEvents = events.filter(event => {
            if (event.type === 'session') {
                return event.status === 'scheduled' || event.status === 'confirmed';
            }
            // Include tasks that are not completed
            if (event.type === 'task') {
                return event.status !== 'completed';
            }
            return true;
        });

        const icalEvents = exportableEvents.map(event => {
            try {
                // Handle date parsing safely
                const eventDate = event.date || new Date().toISOString().split('T')[0];
                const eventTime = event.time || '09:00';
                const startDate = new Date(`${eventDate}T${eventTime}`);
                
                // Validate the date
                if (isNaN(startDate.getTime())) {
                    console.warn('Invalid date for event:', event);
                    return null;
                }
                
                const durationMinutes = event.duration || 60;
                const endDate = new Date(startDate.getTime() + (durationMinutes * 60 * 1000));

                const formatICalDate = (date) => {
                    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                };

                const description = event.type === 'session'
                    ? user?.role === 'tutor'
                        ? `Tutoring session with ${event.student || 'Student'} - ${event.subject || 'General'}: ${event.topic || 'General tutoring'}`
                        : `Tutoring session with ${event.tutor || 'Tutor'} - ${event.subject || 'General'}${event.meetingType ? ` (${event.meetingType === 'virtual' ? 'Virtual' : 'In-Person'})` : ''}${event.location ? ` - Location: ${event.location}` : ''}`
                    : event.type === 'task'
                        ? `Task - Priority: ${event.priority || 'medium'}. ${event.description || ''}`
                        : `Location: ${event.location || 'TBD'}`;

                return [
                    'BEGIN:VEVENT',
                    `DTSTART:${formatICalDate(startDate)}`,
                    `DTEND:${formatICalDate(endDate)}`,
                    `SUMMARY:${event.title || 'Event'}`,
                    `DESCRIPTION:${description}`,
                    `UID:${event.id || Date.now()}@tutortogether.com`,
                    'STATUS:CONFIRMED',
                    'END:VEVENT'
                ].join('\r\n');
            } catch (err) {
                console.warn('Error processing event for export:', event, err);
                return null;
            }
        }).filter(Boolean).join('\r\n');

        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Tutor Together//Calendar Export//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            icalEvents,
            'END:VCALENDAR'
        ].join('\r\n');
    };

    const handleExportCalendar = async () => {
        setIsExporting(true);

        try {
            // Filter exportable events
            const exportableEvents = events.filter(event => {
                if (event.type === 'session') {
                    return event.status === 'scheduled' || event.status === 'confirmed';
                }
                if (event.type === 'task') {
                    return event.status !== 'completed';
                }
                return true;
            });

            if (exportableEvents.length === 0) {
                setExportSuccess('No upcoming sessions or tasks to export');
                setTimeout(() => setExportSuccess(null), 3000);
                return;
            }

            const icalContent = generateICalContent(events);

            const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tutor-together-calendar-${new Date().toISOString().split('T')[0]}.ics`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setExportSuccess(`${exportableEvents.length} event${exportableEvents.length > 1 ? 's' : ''} exported successfully!`);
            setTimeout(() => setExportSuccess(null), 3000);

        } catch (error) {
            console.error('Export failed:', error);
            setExportSuccess('Export failed. Please try again.');
            setTimeout(() => setExportSuccess(null), 3000);
        } finally {
            setIsExporting(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    const getEventsForDate = (day) => {
        if (!day) return [];
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(event => event.date === dateStr);
        console.log(`Events for ${dateStr} (day ${day}):`, dayEvents);
        return dayEvents;
    };

    const getSelectedDateEvents = () => {
        if (!selectedDate) return [];
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        return events.filter(event => event.date === dateStr);
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
        if (newDate.getMonth() === new Date().getMonth() && newDate.getFullYear() === new Date().getFullYear()) {
            setSelectedDate(new Date().getDate());
        } else {
            setSelectedDate(1);
        }
    };

    const handleJumpToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today.getDate());
    };

    const eventTypeIcons = {
        session: '📚',
        task: '📝',
        event: '📅'
    };

    const formatEventTime = (timeString = '00:00') => {
        const [hour = '0', minute = '0'] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hour, 10), parseInt(minute, 10));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getEventEndTime = (timeString = '00:00') => {
        const [hour = '0', minute = '00'] = timeString.split(':');
        const endHour = (parseInt(hour, 10) + 1) % 24;
        return `${String(endHour).padStart(2, '0')}:${minute || '00'}`;
    };

    const dashboardBaseRoute = user?.role === 'tutor' ? '/tutor-dashboard' : '/student-dashboard';

    const dashboardTabs = [
        { id: 'overview', label: 'Overview', to: dashboardBaseRoute, state: { activeTab: 'overview' } },
        { id: 'sessions', label: 'Sessions', to: dashboardBaseRoute, state: { activeTab: 'sessions' } },
        { id: 'calendar', label: 'Calendar', to: null },
        { id: 'tasks', label: 'Tasks', to: dashboardBaseRoute, state: { activeTab: 'tasks' } },
        { id: 'progress', label: 'Progress', to: dashboardBaseRoute, state: { activeTab: 'progress' } }
    ];

    const sidebarActions = [
        {
            id: 'book-session',
            label: 'Book Session',
            description: 'Browse tutors and lock in a time',
            to: '/tutors',
            gradient: 'from-blue-500/20 via-cyan-500/10 to-cyan-500/20',
            border: 'border-blue-500/30'
        },
        {
            id: 'ai-assistant',
            label: 'AI Assistant',
            description: 'Get instant answers or study help',
            to: '/chatbot',
            gradient: 'from-emerald-500/20 via-teal-500/10 to-teal-500/20',
            border: 'border-emerald-500/30'
        },
        {
            id: 'add-task',
            label: 'Add Task',
            description: 'Capture homework or study goals',
            to: '/tasks',
            gradient: 'from-rose-500/20 via-pink-500/10 to-pink-500/20',
            border: 'border-rose-500/30'
        },
        {
            id: 'messages',
            label: 'Messages',
            description: 'Continue conversations with tutors',
            to: '/messages',
            gradient: 'from-amber-500/20 via-orange-500/10 to-orange-500/20',
            border: 'border-amber-500/30'
        }
    ];

    const urgentTasksPreview = (user?.urgentTasks || []).slice(0, 2);

    const getEventBadgeClasses = (event) => {
        if (event.type === 'session') {
            return 'bg-blue-500/10 border-blue-500/40 text-blue-200';
        }

        if (event.priority === 'high') {
            return 'bg-red-500/10 border-red-500/40 text-red-200';
        }

        if (event.priority === 'low') {
            return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200';
        }

        return 'bg-amber-500/10 border-amber-500/40 text-amber-200';
    };

    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selectedDateLabel = selectedDate
        ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Select a day';
    const selectedDayEvents = selectedDate ? getSelectedDateEvents() : [];

    if (loadingBookings || loadingTasks) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
                    <div className="animate-pulse text-center">
                        <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4"></div>
                        <div className="w-32 h-4 bg-slate-700 rounded mx-auto mb-2"></div>
                        <div className="w-24 h-3 bg-slate-700 rounded mx-auto mb-12 text-slate-400">
                            Loading calendar data...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col xl:flex-row gap-8">
                    <div className="flex-1 space-y-8">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">
                                    {user?.role === 'tutor' ? 'Tutor availability & sessions' : 'Student study schedule'}
                                </p>
                                <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center space-x-2">
                                    <span>📅 Calendar</span>
                                </h1>
                            </div>
                            <button
                                onClick={handleExportCalendar}
                                className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-semibold transition-all duration-200 flex items-center space-x-2 disabled:opacity-70"
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Exporting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>📥</span>
                                        <span>Export Calendar</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                            <div className="xl:col-span-2 bg-slate-900/50 rounded-2xl p-4 sm:p-6 border border-slate-800/50 backdrop-blur-sm">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                    <div>
                                        <p className="text-slate-400 text-sm mb-1">Monthly overview</p>
                                        <h2 className="text-2xl font-bold text-white">{formatDate(currentDate)}</h2>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => navigateMonth(-1)}
                                            className="p-2 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
                                        >
                                            ←
                                        </button>
                                        <button
                                            onClick={handleJumpToToday}
                                            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 hover:border-blue-500/60 hover:text-white transition-colors"
                                        >
                                            Today
                                        </button>
                                        <button
                                            onClick={() => navigateMonth(1)}
                                            className="p-2 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
                                        >
                                            →
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-2 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                                    {weekdayLabels.map(day => (
                                        <div key={day}>{day}</div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                    {getDaysInMonth(currentDate).map((day, index) => {
                                        if (!day) {
                                            return <div key={`empty-${index}`} className="min-h-[80px] sm:min-h-[100px] rounded-xl border border-dashed border-slate-800/70"></div>;
                                        }

                                        const dayEvents = getEventsForDate(day);
                                        const isToday = day === new Date().getDate() &&
                                            currentDate.getMonth() === new Date().getMonth() &&
                                            currentDate.getFullYear() === new Date().getFullYear();
                                        const isSelected = selectedDate === day;

                                        return (
                                            <button
                                                key={`day-${day}`}
                                                onClick={() => setSelectedDate(day)}
                                                className={`min-h-[80px] sm:min-h-[100px] rounded-xl sm:rounded-2xl border text-left p-2 sm:p-3 transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' : 'border-slate-800/70 bg-slate-900/30 hover:border-blue-500/60'}`}
                                            >
                                                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                                                    <span className="text-white">{day}</span>
                                                    {isToday && <span className="text-emerald-400 text-[10px] sm:text-xs">Today</span>}
                                                </div>
                                                <div className="mt-1 sm:mt-2 space-y-1 overflow-hidden">
                                                    {dayEvents.slice(0, 2).map(event => (
                                                        <div
                                                            key={event.id}
                                                            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-full border ${getEventBadgeClasses(event)} truncate max-w-full`}
                                                            title={event.title}
                                                        >
                                                            {event.title?.substring(0, 8) || event.subject?.substring(0, 8) || 'Event'}
                                                            {(event.title?.length > 8 || event.subject?.length > 8) ? '...' : ''}
                                                        </div>
                                                    ))}
                                                    {dayEvents.length > 2 && (
                                                        <div className="text-[9px] sm:text-[10px] text-slate-400">
                                                            +{dayEvents.length - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-900/50 rounded-2xl p-4 sm:p-5 border border-slate-800/50 backdrop-blur-sm">
                                    <div className="flex flex-col gap-2 mb-4">
                                        <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center space-x-2">
                                            <span className="text-emerald-400">📋</span>
                                            <span>{selectedDateLabel}</span>
                                        </h3>
                                    </div>

                                    {selectedDayEvents.length === 0 ? (
                                        <div className="text-center text-slate-400 py-6 text-sm">
                                            No sessions or tasks scheduled for this day.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedDayEvents.map(event => (
                                                <div key={event.id} className="p-3 sm:p-4 rounded-xl border border-slate-800/70 bg-slate-900/40">
                                                    <div className="flex flex-col gap-2 mb-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-white font-semibold text-sm sm:text-base line-clamp-2 flex-1">{event.title}</p>
                                                            <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full border whitespace-nowrap ${getEventBadgeClasses(event)}`}>
                                                                {event.type === 'session' ? (event.status || 'Session') : 'Task'}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-400 text-xs sm:text-sm">
                                                            {event.type === 'session'
                                                                ? `${event.subject} with ${user?.role === 'tutor' ? event.student : event.tutor || 'your tutor'}`
                                                                : event.subject || 'Personal study task'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-400">
                                                        <span>🕒 {formatEventTime(event.time)}</span>
                                                        {event.type === 'session' ? (
                                                            <span>📍 {event.meetingType === 'virtual' ? 'Virtual' : 'In-person'}</span>
                                                        ) : (
                                                            <span>📌 {event.status}</span>
                                                        )}
                                                    </div>
                                                    {event.type === 'session' && (
                                                        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2">
                                                            {event.status && (
                                                                <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium ${event.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/10 text-blue-200 border border-blue-500/30'}`}>
                                                                    {event.status}
                                                                </span>
                                                            )}
                                                            {(event.status === 'scheduled' || event.status === 'confirmed') && (
                                                                <MarkCompleteButton
                                                                    booking={{
                                                                        ...event,
                                                                        endTime: event.endTime || getEventEndTime(event.time),
                                                                        tutorName: user?.role === 'student' ? event.tutor : null,
                                                                        studentName: user?.role === 'tutor' ? event.student : null
                                                                    }}
                                                                    onCompleted={(updatedEvent) => {
                                                                        setRealBookings(prev => prev.map(booking =>
                                                                            booking.id === updatedEvent.id
                                                                                ? { ...booking, status: 'completed' }
                                                                                : booking
                                                                        ));
                                                                    }}
                                                                    className="text-[10px] sm:text-xs px-2 sm:px-3 py-1"
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                    {event.type === 'task' && (
                                                        <div className="mt-2 text-[10px] sm:text-xs text-slate-400">
                                                            Progress: {event.progress || 0}%
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {/* Countdown for upcoming sessions */}
                                            {selectedDayEvents.some(e => e.type === 'session' && (e.status === 'scheduled' || e.status === 'confirmed')) && (
                                                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                                                    <p className="text-blue-300 text-xs">Session countdown</p>
                                                    <p className="text-white font-semibold text-sm mt-1">
                                                        {(() => {
                                                            const session = selectedDayEvents.find(e => e.type === 'session' && (e.status === 'scheduled' || e.status === 'confirmed'));
                                                            if (!session) return 'No upcoming session';
                                                            const sessionDate = new Date(`${session.date}T${session.time || '09:00'}`);
                                                            const now = new Date();
                                                            const diff = sessionDate - now;
                                                            if (diff < 0) return 'Session in progress or passed';
                                                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                            if (days > 0) return `Complete in ${days}d ${hours}h ${mins}m`;
                                                            return `Complete in ${hours}h ${mins}m`;
                                                        })()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-900/50 rounded-2xl p-4 sm:p-5 border border-slate-800/50 backdrop-blur-sm">
                                    <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Event Types</h3>
                                    <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                            <span>📚 Tutoring Sessions</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                            <span>📝 High Priority Tasks</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                            <span>📝 Medium Priority Tasks</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                            <span>📝 Low Priority Tasks</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 rounded-2xl p-4 sm:p-5 border border-slate-800/50 backdrop-blur-sm">
                                    <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Quick Actions</h3>
                                    <Link
                                        to="/tutors"
                                        className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition"
                                    >
                                        Schedule Session
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full xl:w-80 space-y-6">
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Dashboard</h3>
                            <div className="space-y-1">
                                {dashboardTabs.map(tab => {
                                    const isActive = tab.id === 'calendar';
                                    const className = `w-full px-3 py-2 rounded-lg flex items-center transition-all duration-200 ${isActive
                                        ? 'bg-white/10 text-white shadow-lg border border-white/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`;

                                    if (!tab.to) {
                                        return (
                                            <button key={tab.id} className={className} disabled>
                                                <span className="text-sm font-medium">{tab.label}</span>
                                            </button>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={tab.id}
                                            to={tab.to}
                                            state={tab.state}
                                            className={className}
                                        >
                                            <span className="text-sm font-medium">{tab.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Key Actions</h3>
                            <div className="space-y-2">
                                {sidebarActions.map(action => (
                                    <Link
                                        key={action.id}
                                        to={action.to}
                                        className={`block w-full p-3 rounded-xl border bg-gradient-to-r ${action.gradient} ${action.border} transition-all duration-200 hover:border-white/40`}
                                    >
                                        <div className="text-white text-sm font-semibold">{action.label}</div>
                                        <div className="text-slate-200 text-xs">{action.description}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-4 border border-red-500/20">
                            <h3 className="text-sm font-semibold text-red-300 mb-3 uppercase tracking-wide flex items-center space-x-2">
                                <span className="text-red-400">🔥</span>
                                <span>Urgent Tasks</span>
                            </h3>

                            <div className="space-y-3">
                                {urgentTasksPreview.length > 0 ? urgentTasksPreview.map((task, idx) => (
                                    <div key={task.id || `${task.title}-${idx}`} className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="text-white text-xs font-medium line-clamp-2">{task.title}</div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'high'
                                                ? 'bg-red-500/20 text-red-400'
                                                : task.priority === 'medium'
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <div className="text-slate-400 text-xs mb-1">{task.subject}</div>
                                        <div className="text-slate-500 text-xs">Due: {task.due}</div>
                                    </div>
                                )) : (
                                    <div className="text-slate-400 text-xs">No urgent tasks right now.</div>
                                )}
                            </div>

                            <Link
                                to="/tasks"
                                className="block text-center mt-3 text-xs text-blue-400 hover:text-blue-300 font-medium"
                            >
                                View All Tasks →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {exportSuccess && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-lg backdrop-blur-sm shadow-lg">
                    <div className="flex items-center space-x-2">
                        <span>📥</span>
                        <span>{exportSuccess}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;