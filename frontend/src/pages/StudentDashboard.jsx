import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Modal, Button } from '../components/ui';
import { bookingService } from '../services/bookingService';
import { taskService } from '../services/api';
import { RescheduleModal } from '../components/RescheduleModal';
import { CancelBookingModal } from '../components/CancelBookingModal';
import MarkCompleteButton from '../components/MarkCompleteButton';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Task Modal Component - moved outside to prevent recreation
const TaskModal = ({
    isOpen,
    onClose,
    isEdit = false,
    newTask,
    setNewTask,
    errors,
    loading,
    onSubmit
}) => {
    const handleInputChange = (field, value) => {
        setNewTask(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-6">
                    {isEdit ? 'Edit Task' : 'Add New Task'}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                        <input
                            type="text"
                            value={newTask.title || ''}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.title ? 'border-red-500' : 'border-slate-600'
                                }`}
                            placeholder="Enter task title"
                            disabled={loading}
                            autoComplete="off"
                        />
                        {errors.title && (
                            <p className="text-red-400 text-xs mt-1">{errors.title}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <textarea
                            value={newTask.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none focus:outline-none focus:border-blue-500"
                            placeholder="Describe what needs to be done"
                            disabled={loading}
                            autoComplete="off"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Subject *</label>
                            <select
                                value={newTask.subject || ''}
                                onChange={(e) => handleInputChange('subject', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.subject ? 'border-red-500' : 'border-slate-600'
                                    }`}
                                disabled={loading}
                            >
                                <option value="">Select subject</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Biology">Biology</option>
                                <option value="History">History</option>
                                <option value="English">English</option>
                            </select>
                            {errors.subject && (
                                <p className="text-red-400 text-xs mt-1">{errors.subject}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                            <select
                                value={newTask.priority || 'medium'}
                                onChange={(e) => handleInputChange('priority', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                disabled={loading}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Time *</label>
                            <input
                                type="text"
                                value={newTask.estimatedTime || ''}
                                onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.estimatedTime ? 'border-red-500' : 'border-slate-600'
                                    }`}
                                placeholder="e.g., 2 hours"
                                disabled={loading}
                                autoComplete="off"
                            />
                            {errors.estimatedTime && (
                                <p className="text-red-400 text-xs mt-1">{errors.estimatedTime}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Due Date *</label>
                            <input
                                type="date"
                                value={newTask.due || ''}
                                onChange={(e) => handleInputChange('due', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.due ? 'border-red-500' : 'border-slate-600'
                                    }`}
                                disabled={loading}
                            />
                            {errors.due && (
                                <p className="text-red-400 text-xs mt-1">{errors.due}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex space-x-3 mt-6">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        className="flex-1"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>{isEdit ? 'Updating...' : 'Adding...'}</span>
                            </div>
                        ) : (
                            isEdit ? 'Update Task' : 'Add Task'
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const StudentDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();

    // All hooks must be called before any early returns
    const [activeTab, setActiveTab] = useState(() => location.state?.activeTab || 'overview');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionSuccess, setActionSuccess] = useState('');
    const [notificationType, setNotificationType] = useState('success'); // success, error, warning, info
    const [errors, setErrors] = useState({});
    const [isExporting, setIsExporting] = useState(false);
    const [reviewData, setReviewData] = useState({
        rating: 5,
        comment: '',
        wouldRecommend: true
    });

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        subject: '',
        priority: 'medium',
        estimatedTime: '',
        due: ''
    });

    const [tasks, setTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [realBookings, setRealBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [overviewData, setOverviewData] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date().getDate());

    // Modal states for reschedule and cancel (booking-specific)
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rescheduleData, setRescheduleData] = useState({
        date: '',
        time: '',
        reason: ''
    });

    // Dynamic greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            return { text: 'Good Morning', emoji: '🌅' };
        } else if (hour >= 12 && hour < 17) {
            return { text: 'Good Afternoon', emoji: '☀️' };
        } else if (hour >= 17 && hour < 21) {
            return { text: 'Good Evening', emoji: '🌆' };
        } else {
            return { text: 'Good Night', emoji: '🌙' };
        }
    };

    const greeting = getGreeting();

    // Early return if user is not loaded yet - AFTER all hooks
    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                    <p className="text-white">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Load overview statistics
    const loadOverviewData = async () => {
        try {
            setOverviewLoading(true);
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE_URL}/booking/student/overview`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch overview data');
            }

            const data = await response.json();
            console.log('📊 Loaded student overview data:', data);
            setOverviewData(data);
        } catch (error) {
            console.error('❌ Error loading overview data:', error);
        } finally {
            setOverviewLoading(false);
        }
    };

    // Load real data on component mount
    useEffect(() => {
        loadRealBookings();
        loadTasks();
        loadOverviewData();
    }, []);

    // Handle navigation state (success messages, active tab)
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
        if (location.state?.message) {
            showSuccessMessage(location.state.message);
            // Clear the state so message doesn't show on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const loadRealBookings = async () => {
        try {
            setBookingsLoading(true);
            const result = await bookingService.getStudentBookings();
            console.log('📅 Loaded real bookings:', result.bookings);

            // Auto-complete past sessions
            const bookings = result.bookings || [];
            const now = new Date();
            const updatedBookings = [];

            for (const booking of bookings) {
                // Check if session is scheduled/confirmed and time has passed
                if ((booking.status === 'scheduled' || booking.status === 'confirmed') && booking.date && booking.endTime) {
                    const sessionEndTime = new Date(`${booking.date.split('T')[0]}T${booking.endTime}`);

                    if (now > sessionEndTime) {
                        console.log('🔄 Auto-completing past session:', booking.id);
                        try {
                            // Mark as complete on backend
                            await fetch(`${API_BASE_URL}/booking/bookings/${booking.id}/complete`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({
                                    completionNotes: 'Auto-completed after session end time'
                                })
                            });
                            updatedBookings.push({ ...booking, status: 'completed' });
                        } catch (error) {
                            console.error('Failed to auto-complete session:', booking.id, error);
                            updatedBookings.push(booking);
                        }
                    } else {
                        updatedBookings.push(booking);
                    }
                } else {
                    updatedBookings.push(booking);
                }
            }

            setRealBookings(updatedBookings);
        } catch (error) {
            console.error('Failed to load real bookings:', error);
            setRealBookings([]);
        } finally {
            setBookingsLoading(false);
        }
    };

    const loadTasks = async () => {
        try {
            setTasksLoading(true);
            const result = await taskService.getTasks();
            console.log('📋 Loaded real tasks:', result.data);

            // Transform backend data to frontend format
            const transformedTasks = result.data.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                subject: task.subject,
                priority: task.priority,
                status: task.status,
                progress: task.progress,
                due: task.due_date,
                estimatedTime: task.estimated_time,
                createdAt: task.created_at,
                updatedAt: task.updated_at
            }));

            setTasks(transformedTasks);
        } catch (error) {
            console.error('❌ Error loading tasks:', error);
            // Initialize with empty array if API fails
            setTasks([]);
        } finally {
            setTasksLoading(false);
        }
    };

    // Validation functions
    const validateTask = () => {
        const newErrors = {};

        if (!newTask.title.trim()) {
            newErrors.title = 'Task title is required';
        }

        if (!newTask.subject) {
            newErrors.subject = 'Subject is required';
        }

        if (!newTask.due) {
            newErrors.due = 'Due date is required';
        } else {
            const selectedDate = new Date(newTask.due);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                newErrors.due = 'Due date cannot be in the past';
            }
        }

        if (!newTask.estimatedTime) {
            newErrors.estimatedTime = 'Estimated time is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const showSuccessMessage = (message) => {
        setActionSuccess(message);
        setNotificationType('success');
        setTimeout(() => setActionSuccess(''), 4000);
    };

    const showErrorMessage = (message) => {
        setActionSuccess(message);
        setNotificationType('error');
        setTimeout(() => setActionSuccess(''), 4000);
    };

    const showWarningMessage = (message) => {
        setActionSuccess(message);
        setNotificationType('warning');
        setTimeout(() => setActionSuccess(''), 4000);
    };

    const showInfoMessage = (message) => {
        setActionSuccess(message);
        setNotificationType('info');
        setTimeout(() => setActionSuccess(''), 4000);
    };

    const handleAddTask = async () => {
        if (!validateTask()) return;

        setLoading(true);
        try {
            // Call real API
            const result = await taskService.createTask(newTask);
            console.log('✅ Task created:', result.data);

            // Reload tasks from server
            await loadTasks();

            setNewTask({
                title: '',
                description: '',
                subject: '',
                priority: 'medium',
                estimatedTime: '',
                due: ''
            });
            setErrors({});
            setShowTaskModal(false);
            showSuccessMessage('Task added successfully!');
        } catch (error) {
            showSuccessMessage('Error adding task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setNewTask({
            title: task.title || '',
            description: task.description || '',
            subject: task.subject || '',
            priority: task.priority || 'medium',
            estimatedTime: task.estimatedTime || '',
            due: task.due || ''
        });
        setErrors({});
        setShowEditTaskModal(true);
    };

    const handleUpdateTask = async () => {
        if (!validateTask()) return;

        setLoading(true);
        try {
            // Call real API
            const result = await taskService.updateTask(selectedTask.id, newTask);
            console.log('✅ Task updated:', result.data);

            // Reload tasks from server
            await loadTasks();

            setShowEditTaskModal(false);
            setSelectedTask(null);
            setNewTask({
                title: '',
                description: '',
                subject: '',
                priority: 'medium',
                estimatedTime: '',
                due: ''
            });
            setErrors({});
            showSuccessMessage('Task updated successfully!');
        } catch (error) {
            showSuccessMessage('Error updating task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteTask = async (taskId) => {
        setLoading(true);
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            const newProgress = newStatus === 'completed' ? 100 : 0;

            const updates = {
                ...task,
                status: newStatus,
                progress: newProgress
            };

            // Call real API
            await taskService.updateTask(taskId, updates);
            console.log('✅ Task status updated:', taskId, newStatus);

            // Reload tasks from server
            await loadTasks();
            showSuccessMessage('Task status updated!');
        } catch (error) {
            console.error('Error updating task status:', error);
            showSuccessMessage('Failed to update task status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskStatusChange = async (taskId, newStatus) => {
        setLoading(true);
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            let progress = 0;
            switch (newStatus) {
                case 'started':
                    progress = 25;
                    break;
                case 'in-progress':
                    progress = 50;
                    break;
                case 'completed':
                    progress = 100;
                    break;
                default:
                    progress = 0;
            }

            const updates = {
                ...task,
                status: newStatus,
                progress
            };

            // Call real API
            await taskService.updateTask(taskId, updates);
            console.log('✅ Task status changed:', taskId, newStatus);

            // Reload tasks from server
            await loadTasks();
            showSuccessMessage(`Task status updated to ${newStatus}!`);
        } catch (error) {
            console.error('Error changing task status:', error);
            showSuccessMessage('Failed to update task status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePriorityChange = async (taskId, newPriority) => {
        setLoading(true);
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const updates = {
                ...task,
                priority: newPriority
            };

            // Call real API
            await taskService.updateTask(taskId, updates);
            console.log('✅ Task priority changed:', taskId, newPriority);

            // Reload tasks from server
            await loadTasks();
            showSuccessMessage(`Priority updated to ${newPriority}!`);
        } catch (error) {
            console.error('Error changing task priority:', error);
            showSuccessMessage('Failed to update task priority. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        setLoading(true);
        try {
            // Call real API
            await taskService.deleteTask(taskId);
            console.log('✅ Task deleted:', taskId);

            // Reload tasks from server
            await loadTasks();
            showSuccessMessage('Task deleted successfully!');
        } catch (error) {
            console.error('Error deleting task:', error);
            showSuccessMessage('Failed to delete task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRescheduleSession = (session) => {
        setSelectedSession(session);
        setShowRescheduleModal(true);
    };

    const handleCancelSession = (session) => {
        setSelectedSession(session);
        setShowCancelModal(true);
    };

    const confirmCancelSession = async () => {
        if (!selectedSession) return;

        setLoading(prev => ({ ...prev, cancelSession: true }));
        setErrors(prev => ({ ...prev, cancelSession: null }));

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Simulate possible error
            if (Math.random() < 0.1) {
                throw new Error('Failed to cancel session. Please try again.');
            }

            // Show success message
            setActionSuccess('Session cancelled successfully');
            setTimeout(() => setActionSuccess(null), 3000);

            // Close modal and reset
            setShowCancelModal(false);
            setSelectedSession(null);

            // In a real app, you would update the sessions list here
            console.log('Session cancelled:', selectedSession);
        } catch (error) {
            setErrors(prev => ({ ...prev, cancelSession: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, cancelSession: false }));
        }
    };

    const confirmRescheduleSession = async (newDate, newTime) => {
        if (!selectedSession || !newDate || !newTime) {
            setErrors(prev => ({ ...prev, reschedule: 'Please select both date and time' }));
            return;
        }

        setLoading(prev => ({ ...prev, rescheduleSession: true }));
        setErrors(prev => ({ ...prev, reschedule: null }));

        try {
            // Check if this is a real booking that needs API call
            if (selectedSession.isRealBooking || selectedBooking) {
                const bookingId = selectedSession.id || selectedBooking?.id;
                
                // Calculate end time (add 1 hour to start time by default)
                const startTimeParts = newTime.split(':');
                const startHour = parseInt(startTimeParts[0]);
                const startMinutes = startTimeParts[1] || '00';
                const endHour = startHour + 1;
                const newEndTime = `${endHour.toString().padStart(2, '0')}:${startMinutes}`;
                
                const response = await fetch(`${API_BASE_URL}/booking/bookings/${bookingId}/reschedule`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        newDate,
                        newStartTime: newTime,
                        newEndTime: newEndTime,
                        reason: ''
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || data.message || 'Failed to reschedule session');
                }

                // Show success message
                const formattedDate = new Date(newDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
                setActionSuccess(`Session rescheduled to ${formattedDate} at ${newTime}`);
                setTimeout(() => setActionSuccess(null), 3000);

                // Close modal and reset
                setShowRescheduleModal(false);
                setSelectedSession(null);
                setSelectedBooking(null);

                // Reload bookings to get fresh data
                loadRealBookings();
            } else {
                // For mock sessions (backwards compatibility)
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Show success message
                setActionSuccess(`Session rescheduled to ${newDate} at ${newTime}`);
                setTimeout(() => setActionSuccess(null), 3000);

                // Close modal and reset
                setShowRescheduleModal(false);
                setSelectedSession(null);

                console.log('Session rescheduled:', selectedSession, { newDate, newTime });
            }
        } catch (error) {
            console.error('Error rescheduling session:', error);
            setErrors(prev => ({ ...prev, reschedule: error.message || 'Failed to reschedule session. Please try again.' }));
        } finally {
            setLoading(prev => ({ ...prev, rescheduleSession: false }));
        }
    };

    // Calendar export functionality
    const generateCalendarICalContent = (events) => {
        // Filter only scheduled/confirmed sessions and incomplete tasks
        const exportableEvents = events.filter(event => {
            if (event.type === 'booking' || event.type === 'session') {
                return event.status === 'scheduled' || event.status === 'confirmed';
            }
            if (event.type === 'task') {
                return event.status !== 'completed';
            }
            return true;
        });

        const icalEvents = exportableEvents.map(event => {
            try {
                const eventDate = event.date || new Date().toISOString().split('T')[0];
                const eventTime = event.time || event.startTime || '09:00';
                const startDate = new Date(`${eventDate}T${eventTime}`);
                
                if (isNaN(startDate.getTime())) {
                    console.warn('Invalid date for event:', event);
                    return null;
                }

                const durationMinutes = event.duration || 60;
                const endDate = new Date(startDate.getTime() + (durationMinutes * 60 * 1000));

                const formatICalDate = (date) => {
                    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                };

                const title = event.title || event.subject || 'Event';
                const tutorName = event.tutorName || event.tutor || 'Tutor';
                const subject = event.subject || 'General';

                const description = event.type === 'task'
                    ? `Task - Priority: ${event.priority || 'medium'}. ${event.description || ''}`
                    : `Tutoring session with ${tutorName} for ${subject}`;

                return [
                    'BEGIN:VEVENT',
                    `DTSTART:${formatICalDate(startDate)}`,
                    `DTEND:${formatICalDate(endDate)}`,
                    `SUMMARY:${title}`,
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
            'PRODID:-//Tutor Together//Student Calendar Export//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            icalEvents,
            'END:VCALENDAR'
        ].join('\r\n');
    };

    const handleExportCalendar = async () => {
        setIsExporting(true);

        try {
            // Combine real bookings and tasks for export
            const allEvents = [
                ...realBookings.map(b => ({
                    ...b,
                    type: 'booking',
                    time: b.startTime || b.time || '09:00'
                })),
                ...tasks.map(t => ({
                    ...t,
                    type: 'task',
                    date: t.due || t.dueDate,
                    time: '23:59'
                }))
            ];

            // Filter exportable events
            const exportableEvents = allEvents.filter(event => {
                if (event.type === 'booking') {
                    return event.status === 'scheduled' || event.status === 'confirmed';
                }
                if (event.type === 'task') {
                    return event.status !== 'completed';
                }
                return true;
            });

            if (exportableEvents.length === 0) {
                setActionSuccess('No upcoming sessions or tasks to export');
                setNotificationType('warning');
                setTimeout(() => setActionSuccess(null), 3000);
                return;
            }

            const icalContent = generateCalendarICalContent(allEvents);

            const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `student-calendar-${new Date().toISOString().split('T')[0]}.ics`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setActionSuccess(`${exportableEvents.length} event${exportableEvents.length > 1 ? 's' : ''} exported successfully!`);
            setNotificationType('success');
            setTimeout(() => setActionSuccess(null), 3000);

        } catch (error) {
            console.error('Export failed:', error);
            setActionSuccess('Export failed. Please try again.');
            setNotificationType('error');
            setTimeout(() => setActionSuccess(null), 3000);
        } finally {
            setIsExporting(false);
        }
    };

    // Booking-specific handlers
    const handleRescheduleBooking = (booking) => {
        // Set both selectedBooking (for API calls) and selectedSession (for modal display)
        setSelectedBooking(booking);
        setSelectedSession({
            id: booking.id,
            topic: booking.sessionType || booking.subject || 'Tutoring Session',
            tutorName: booking.tutorName,
            tutorId: booking.tutorId || booking.tutor_id,
            date: booking.date || booking.sessionDate,
            time: booking.startTime || booking.time,
            duration: booking.duration,
            isRealBooking: true
        });
        setShowRescheduleModal(true);
    };

    const handleCancelBooking = (booking) => {
        setSelectedBooking(booking);
        setShowCancelModal(true);
    };

    const handleReviewBooking = (booking) => {
        setSelectedBooking(booking);
        setReviewData({ rating: 5, comment: '', wouldRecommend: true });
        setShowReviewModal(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedBooking) return;

        // Validate review
        if (!reviewData.comment.trim()) {
            showWarningMessage('Please write a review comment before submitting.');
            return;
        }

        try {
            setLoading(true);
            console.log('Submitting review for booking:', selectedBooking.id);

            const response = await fetch(`${API_BASE_URL}/reviews/bookings/${selectedBooking.id}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    rating: reviewData.rating,
                    reviewText: reviewData.comment,
                    wouldRecommend: reviewData.wouldRecommend
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit review');
            }

            console.log('Review submitted successfully:', data);

            setShowReviewModal(false);
            setSelectedBooking(null);
            setReviewData({ rating: 5, comment: '', wouldRecommend: true });
            setActionSuccess('Review submitted successfully! Thank you for your feedback.');
            setTimeout(() => setActionSuccess(''), 3000);

            // Reload bookings
            loadRealBookings();
        } catch (error) {
            console.error('Error submitting review:', error);
            showErrorMessage('Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRescheduleSuccess = (updatedBooking) => {
        // Update the booking in the list
        setRealBookings(prev => prev.map(booking =>
            booking.id === updatedBooking.id ? { ...booking, ...updatedBooking } : booking
        ));
        setActionSuccess('Reschedule request sent to tutor successfully!');
        setTimeout(() => setActionSuccess(''), 3000);
        // Reload bookings to get fresh data
        loadRealBookings();
    };

    const handleCancelSuccess = (cancelledBooking) => {
        // Update the booking status in the list
        setRealBookings(prev => prev.map(booking =>
            booking.id === cancelledBooking.id ? { ...booking, status: 'cancelled' } : booking
        ));
        setActionSuccess('Session cancelled successfully. Tutor has been notified.');
        setTimeout(() => setActionSuccess(''), 3000);
        // Reload bookings to get fresh data
        loadRealBookings();
    };

    const RescheduleModal = () => {
        const handleRescheduleSubmit = () => {
            confirmRescheduleSession(rescheduleData.date, rescheduleData.time);
        };

        const isValidReschedule = rescheduleData.date && rescheduleData.time;

        return (
            <Modal isOpen={showRescheduleModal} onClose={() => {
                setShowRescheduleModal(false);
                setSelectedSession(null);
                setSelectedBooking(null);
                setRescheduleData({ date: '', time: '', reason: '' });
                setErrors(prev => ({ ...prev, reschedule: null }));
            }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Reschedule Session</h2>

                    {selectedSession && (
                        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                            <div className="text-white font-medium">{selectedSession.topic}</div>
                            <div className="text-slate-400 text-sm">with {selectedSession.tutorName}</div>
                            <div className="text-slate-500 text-xs">
                                Current: {formatDate(selectedSession.date)} at {formatTime(selectedSession.time)}
                            </div>
                        </div>
                    )}

                    {errors.reschedule && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                            {errors.reschedule}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                New Date *
                            </label>
                            <input
                                type="date"
                                value={rescheduleData.date}
                                onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white ${!rescheduleData.date && errors.reschedule ? 'border-red-500' : 'border-slate-600'
                                    }`}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                New Time *
                            </label>
                            <select
                                value={rescheduleData.time}
                                onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white ${!rescheduleData.time && errors.reschedule ? 'border-red-500' : 'border-slate-600'
                                    }`}
                            >
                                <option value="">Select time</option>
                                <option value="09:00">9:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="11:00">11:00 AM</option>
                                <option value="14:00">2:00 PM</option>
                                <option value="15:00">3:00 PM</option>
                                <option value="16:00">4:00 PM</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Reschedule</label>
                            <textarea
                                rows="3"
                                value={rescheduleData.reason}
                                onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                                placeholder="Optional: Explain why you need to reschedule"
                            />
                        </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowRescheduleModal(false);
                                setRescheduleData({ date: '', time: '', reason: '' });
                                setErrors(prev => ({ ...prev, reschedule: null }));
                            }}
                            className="flex-1"
                            disabled={loading.rescheduleSession}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRescheduleSubmit}
                            className="flex-1"
                            disabled={!isValidReschedule || loading.rescheduleSession}
                        >
                            {loading.rescheduleSession ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Rescheduling...</span>
                                </div>
                            ) : (
                                'Reschedule Session'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    };

    const ReviewModal = useMemo(() => {
        if (!showReviewModal) return null;

        return (
            <Modal isOpen={showReviewModal} onClose={() => {
                setShowReviewModal(false);
                setReviewData({ rating: 5, comment: '', wouldRecommend: true });
            }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Leave a Review</h2>

                    {selectedBooking && (
                        <div className="mb-6">
                            <div className="text-white font-medium">{selectedBooking?.sessionType || 'Tutoring Session'}</div>
                            <div className="text-slate-400 text-sm">with {selectedBooking?.tutorName}</div>
                            <div className="text-slate-500 text-sm mt-1">
                                Completed: {selectedBooking?.date && new Date(selectedBooking.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-3">Rating</label>
                            <div className="flex items-center space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                                        className="focus:outline-none transition-all transform hover:scale-110"
                                    >
                                        <svg
                                            className={`w-10 h-10 ${star <= reviewData.rating ? 'text-yellow-400' : 'text-slate-600'}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </button>
                                ))}
                                <span className="text-white font-medium ml-3">{reviewData.rating} / 5</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Your Review</label>
                            <textarea
                                key="review-textarea"
                                rows="4"
                                value={reviewData.comment}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    setReviewData(prev => ({ ...prev, comment: newValue }));
                                }}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none focus:outline-none focus:border-blue-500"
                                placeholder="Share your experience with this tutor..."
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-3">Would you recommend this tutor?</label>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setReviewData(prev => ({ ...prev, wouldRecommend: true }))}
                                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${reviewData.wouldRecommend
                                        ? 'bg-emerald-500 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-500/30'
                                        : 'bg-slate-700 text-slate-400 border-2 border-slate-600 hover:border-slate-500'
                                        }`}
                                >
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className="text-xl">👍</span>
                                        <span>Yes</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReviewData(prev => ({ ...prev, wouldRecommend: false }))}
                                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${!reviewData.wouldRecommend
                                        ? 'bg-red-500 text-white border-2 border-red-400 shadow-lg shadow-red-500/30'
                                        : 'bg-slate-700 text-slate-400 border-2 border-slate-600 hover:border-slate-500'
                                        }`}
                                >
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className="text-xl">👎</span>
                                        <span>No</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowReviewModal(false);
                                setReviewData({ rating: 5, comment: '', wouldRecommend: true });
                            }}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitReview}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Submitting...</span>
                                </div>
                            ) : (
                                'Submit Review'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }, [showReviewModal, selectedBooking, reviewData, loading, handleSubmitReview]);

    const CancelModal = () => {
        const [cancelReason, setCancelReason] = useState('');

        return (
            <Modal isOpen={showCancelModal} onClose={() => {
                setShowCancelModal(false);
                setCancelReason('');
                setErrors(prev => ({ ...prev, cancelSession: null }));
            }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Cancel Session</h2>

                    {selectedSession && (
                        <div className="mb-6">
                            <div className="text-white font-medium">{selectedSession.topic}</div>
                            <div className="text-slate-400 text-sm">with {selectedSession.tutorName}</div>
                            <div className="text-slate-500 text-sm mt-1">
                                Scheduled: {formatDate(selectedSession.date)} at {formatTime(selectedSession.time)}
                            </div>
                        </div>
                    )}

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h4 className="text-red-400 font-medium">Are you sure you want to cancel this session?</h4>
                                <p className="text-red-300 text-sm mt-1">
                                    This action cannot be undone. The tutor will be notified of the cancellation.
                                </p>
                            </div>
                        </div>
                    </div>

                    {errors.cancelSession && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                            {errors.cancelSession}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Cancellation</label>
                        <textarea
                            rows="3"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                            placeholder="Optional: Explain why you need to cancel"
                        />
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowCancelModal(false);
                                setCancelReason('');
                                setErrors(prev => ({ ...prev, cancelSession: null }));
                            }}
                            className="flex-1"
                            disabled={loading.cancelSession}
                        >
                            Keep Session
                        </Button>
                        <Button
                            onClick={confirmCancelSession}
                            className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
                            disabled={loading.cancelSession}
                        >
                            {loading.cancelSession ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Cancelling...</span>
                                </div>
                            ) : (
                                'Cancel Session'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    };

    const handleModalClose = () => {
        setShowTaskModal(false);
        setShowEditTaskModal(false);
        setNewTask({
            title: '',
            description: '',
            subject: '',
            priority: 'medium',
            estimatedTime: '',
            due: ''
        });
        setErrors({});
    };

    const handleInputChange = (field, value) => {
        setNewTask(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Calculate task statistics
    const calculateTaskStats = () => {
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const startedTasks = tasks.filter(t => t.status === 'started').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;

        // Calculate total study hours from completed and in-progress tasks
        const totalStudyHours = tasks
            .filter(t => t.status === 'completed' || t.status === 'in-progress')
            .reduce((total, task) => {
                // Extract numeric value from estimatedTime (e.g., "2 hours" -> 2)
                const hours = parseFloat(task.estimatedTime) || 0;
                return total + hours;
            }, 0);

        return {
            pending: pendingTasks,
            completed: completedTasks,
            started: startedTasks,
            inProgress: inProgressTasks,
            studyHours: totalStudyHours.toFixed(1)
        };
    };

    const taskStats = calculateTaskStats();

    // Calculate additional metrics
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? ((taskStats.completed / totalTasks) * 100).toFixed(1) : 0;
    const activeTasks = taskStats.started + taskStats.inProgress;

    // Calculate real booking stats
    const upcomingSessions = realBookings.filter(booking =>
        (booking.status === 'confirmed' || booking.status === 'scheduled') && new Date(booking.date) >= new Date()
    ).length;

    const stats = [
        {
            label: 'Upcoming Sessions',
            value: upcomingSessions,
            change: upcomingSessions > 0 ? '+100%' : '+0%',
            color: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30',
            iconBg: 'bg-blue-500/20'
        },
        {
            label: 'Pending Tasks',
            value: taskStats.pending,
            change: taskStats.pending > 0 ? `+${Math.round((taskStats.pending / (taskStats.pending + taskStats.completed)) * 100)}%` : '0%',
            color: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30',
            iconBg: 'bg-amber-500/20'
        },
        {
            label: 'Study Hours',
            value: taskStats.studyHours,
            change: taskStats.studyHours > 0 ? `+${Math.round((taskStats.studyHours / (taskStats.studyHours + 10)) * 100)}%` : '0%',
            color: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
            iconBg: 'bg-emerald-500/20'
        },
        {
            label: 'Completed Tasks',
            value: taskStats.completed,
            change: taskStats.completed > 0 ? `+${Math.round((taskStats.completed / (taskStats.completed + taskStats.pending)) * 100)}%` : '0%',
            color: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30',
            iconBg: 'bg-purple-500/20'
        }
    ];

    const navigationTabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'sessions', label: 'Sessions' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'tasks', label: 'Tasks' },
        { id: 'progress', label: 'Progress' }
    ];

    const quickActions = [
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
            onClick: () => setShowTaskModal(true),
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

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'in-progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'started': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'pending': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
            case 'scheduled': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
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

    const formatDateKey = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        if (isNaN(parsed.getTime())) return null;
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const calendarEvents = useMemo(() => {
        const bookingEvents = (realBookings || [])
            .filter(booking => booking?.date)
            .map(booking => ({
                id: `booking-${booking.id}`,
                type: 'session',
                title: booking.sessionType || booking.subject || 'Tutoring Session',
                date: formatDateKey(booking.date),
                time: booking.startTime || booking.start_time || '00:00',
                tutor: booking.tutorName || booking.tutor_name,
                status: booking.status || 'pending',
                meetingType: booking.meetingType || booking.meeting_type || 'virtual',
                subject: booking.subject || 'General',
                duration: booking.duration || 60
            }))
            .filter(event => !!event.date);

        const taskEvents = (tasks || [])
            .map(task => ({
                id: `task-${task.id}`,
                type: 'task',
                title: task.title,
                date: formatDateKey(task.due || task.due_date),
                time: '23:59',
                priority: task.priority,
                status: task.status,
                subject: task.subject || 'General'
            }))
            .filter(event => !!event.date);

        return [...bookingEvents, ...taskEvents];
    }, [realBookings, tasks]);

    const getCalendarDays = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(day);
        }
        return days;
    };

    const getCalendarEventsForDay = (day) => {
        if (!day) return [];
        const dateKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendarEvents.filter(event => event.date === dateKey);
    };

    const navigateCalendarMonth = (direction) => {
        const updated = new Date(calendarDate);
        updated.setMonth(calendarDate.getMonth() + direction);
        setCalendarDate(updated);
        setSelectedCalendarDay(new Date(updated).getMonth() === new Date().getMonth() && new Date(updated).getFullYear() === new Date().getFullYear()
            ? new Date().getDate()
            : 1);
    };

    const renderOverviewContent = () => {
        // Use real data from overview API
        const upcomingSessions = overviewData?.stats?.upcomingSessions || 0;
        const completedSessions = overviewData?.stats?.completedSessions || 0;
        const totalSpent = overviewData?.stats?.totalSpent || 0;
        const monthSessions = overviewData?.stats?.monthSessions || 0;
        const totalTutors = overviewData?.stats?.totalTutors || 0;
        const reviewsGiven = overviewData?.stats?.reviewsGiven || 0;

        return (
            <div className="grid grid-cols-1 gap-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm font-medium">Upcoming</span>
                            <span className="text-blue-400 text-2xl">📅</span>
                        </div>
                        <div className="text-white text-3xl font-bold">{upcomingSessions}</div>
                        <div className="text-slate-400 text-xs mt-1">Scheduled sessions</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-emerald-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm font-medium">Completed</span>
                            <span className="text-emerald-400 text-2xl">✅</span>
                        </div>
                        <div className="text-white text-3xl font-bold">{completedSessions}</div>
                        <div className="text-slate-400 text-xs mt-1">Total sessions</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm font-medium">This Month</span>
                            <span className="text-purple-400 text-2xl">📊</span>
                        </div>
                        <div className="text-white text-3xl font-bold">{monthSessions}</div>
                        <div className="text-slate-400 text-xs mt-1">Sessions attended</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm font-medium">Total Spent</span>
                            <span className="text-amber-400 text-2xl">💰</span>
                        </div>
                        <div className="text-white text-3xl font-bold">${totalSpent.toFixed(2)}</div>
                        <div className="text-slate-400 text-xs mt-1">On tutoring</div>
                    </div>
                </div>

                {/* Upcoming Sessions */}
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                            <span className="text-blue-400">📚</span>
                            <span>Upcoming Sessions</span>
                        </h3>
                        <Link to="/tutors" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                            Book New →
                        </Link>
                    </div>

                    {bookingsLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center space-x-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 animate-pulse">
                                    <div className="w-12 h-12 rounded-full bg-slate-700"></div>
                                    <div className="flex-1">
                                        <div className="w-32 h-4 bg-slate-700 rounded mb-2"></div>
                                        <div className="w-24 h-3 bg-slate-700 rounded mb-1"></div>
                                        <div className="w-20 h-3 bg-slate-700 rounded"></div>
                                    </div>
                                    <div className="w-12 h-4 bg-slate-700 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : realBookings.filter(booking => booking.status === 'confirmed' || booking.status === 'scheduled').length > 0 ? (
                        <div className="space-y-4">
                            {realBookings.filter(booking => booking.status === 'confirmed' || booking.status === 'scheduled').slice(0, 3).map(booking => (
                                <div key={booking.id} className="flex items-center space-x-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-all duration-200">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {booking.tutorName?.charAt(0) || 'T'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate">{booking.sessionType || 'Tutoring Session'}</div>
                                        <div className="text-slate-400 text-sm truncate">with {booking.tutorName}</div>
                                        <div className="text-slate-500 text-xs">{formatDate(booking.date)} at {formatTime(booking.startTime)}</div>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                                                {booking.meetingType === 'virtual' ? '🌐 Virtual' : '📍 In-Person'}
                                            </span>
                                            <span className="text-blue-400 text-xs font-medium">{Math.round(booking.duration * 60)}min</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            onClick={() => handleRescheduleBooking(booking)}
                                            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-medium rounded-lg transition-all duration-200 border border-blue-500/30"
                                            title="Reschedule session"
                                        >
                                            📅 Reschedule
                                        </button>
                                        <button
                                            onClick={() => handleCancelBooking(booking)}
                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 text-xs font-medium rounded-lg transition-all duration-200 border border-red-500/30"
                                            title="Cancel session"
                                        >
                                            ❌ Cancel
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                                <span className="text-3xl">📅</span>
                            </div>
                            <h4 className="text-white font-medium mb-2">No sessions scheduled</h4>
                            <p className="text-slate-400 text-sm mb-4">Book your first tutoring session to get started</p>
                            <Link
                                to="/tutors"
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                            >
                                <span className="mr-2">🎯</span>
                                Find a Tutor
                            </Link>
                        </div>
                    )}
                </div>

                {/* Today's Tasks */}
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                            <span className="text-emerald-400">✅</span>
                            <span>Today's Tasks</span>
                        </h3>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                            View All →
                        </button>
                    </div>

                    {tasksLoading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="text-slate-400 mt-2">Loading tasks...</p>
                        </div>
                    ) : tasks.filter(t => t.status !== 'completed').length > 0 ? (
                        <div className="space-y-3">
                            {tasks.filter(t => t.status !== 'completed').slice(0, 4).map(task => (
                                <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <div className="text-white font-medium">{task.title}</div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <div className="text-slate-400 text-sm">{task.subject}</div>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <span className="text-slate-500 text-xs">📅 Due: {formatDate(task.due)}</span>
                                            <span className="text-slate-500 text-xs">⏱️ {task.estimatedTime}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 mb-1">Progress</div>
                                            <div className="text-sm font-medium text-blue-400">{task.progress || 0}%</div>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center relative">
                                            <svg className="w-12 h-12 transform -rotate-90">
                                                <circle
                                                    cx="24"
                                                    cy="24"
                                                    r="20"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    className="text-slate-600"
                                                />
                                                <circle
                                                    cx="24"
                                                    cy="24"
                                                    r="20"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    strokeDasharray={`${2 * Math.PI * 20}`}
                                                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - (task.progress || 0) / 100)}`}
                                                    className="text-blue-500 transition-all duration-500"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h4 className="text-white font-medium mb-2">No pending tasks</h4>
                            <p className="text-slate-400 text-sm mb-4">Create a task to stay organized</p>
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                            >
                                <span className="mr-2">➕</span>
                                Add Task
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderTasksContent = () => (
        <div className="grid grid-cols-1 gap-8">
            {/* Task Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-slate-500/20 to-gray-500/20 rounded-2xl p-6 border border-slate-500/30">
                    <div className="text-2xl font-bold text-white mb-1">{taskStats.pending}</div>
                    <div className="text-slate-400 text-sm">Pending</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/30">
                    <div className="text-2xl font-bold text-white mb-1">{taskStats.started}</div>
                    <div className="text-slate-400 text-sm">Started</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-500/30">
                    <div className="text-2xl font-bold text-white mb-1">{taskStats.inProgress}</div>
                    <div className="text-slate-400 text-sm">In Progress</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30">
                    <div className="text-2xl font-bold text-white mb-1">{taskStats.completed}</div>
                    <div className="text-slate-400 text-sm">Completed</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-6 border border-emerald-500/30">
                    <div className="text-2xl font-bold text-white mb-1">{taskStats.studyHours}</div>
                    <div className="text-slate-400 text-sm">Study Hours</div>
                </div>
            </div>

            {/* Tasks List */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                        <span className="text-emerald-400">✅</span>
                        <span>All Tasks</span>
                    </h3>
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                    >
                        + Add Task
                    </button>
                </div>

                <div className="space-y-4">
                    {tasksLoading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="text-slate-400 mt-2">Loading tasks...</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-400">No tasks found. Create your first task!</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} className="flex items-start space-x-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="text-white font-medium">{task.title}</div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                                            {task.status.replace('-', ' ')}
                                        </span>
                                    </div>
                                    <div className="text-slate-400 text-sm mb-2">{task.description}</div>

                                    {/* Progress Bar */}
                                    <div className="mb-2">
                                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                            <span>Progress</span>
                                            <span>{task.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${task.status === 'completed' ? 'bg-green-500' :
                                                    task.status === 'in-progress' ? 'bg-yellow-500' :
                                                        task.status === 'started' ? 'bg-blue-500' :
                                                            'bg-slate-600'
                                                    }`}
                                                style={{ width: `${task.progress || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                                        <span>📚 {task.subject}</span>
                                        <span>⏱️ {task.estimatedTime}</span>
                                        <span>📅 Due: {formatDate(task.due)}</span>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-slate-400 text-xs">Status:</span>
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                                            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="started">Started</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-slate-400 text-xs">Priority:</span>
                                        <select
                                            value={task.priority}
                                            onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                                            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => handleEditTask(task)}
                                        className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )))
                    }
                </div>
            </div>
        </div>
    );

    const renderSessionsContent = () => (
        <div className="grid grid-cols-1 gap-8">
            {/* Session Stats - Enhanced with all booking statuses */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-6 border border-emerald-500/30">
                    <div className="text-2xl font-bold text-white mb-1">{realBookings.filter(b => b.status === 'confirmed' || b.status === 'scheduled').length}</div>
                    <div className="text-slate-400 text-sm">Upcoming Sessions</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
                    <div className="text-2xl font-bold text-white mb-1">{realBookings.filter(b => b.status === 'pending').length}</div>
                    <div className="text-slate-400 text-sm">Pending Requests</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/30">
                    <div className="text-2xl font-bold text-white mb-1">{realBookings.filter(b => b.status === 'completed').length}</div>
                    <div className="text-slate-400 text-sm">Completed Sessions</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
                    <div className="text-2xl font-bold text-white mb-1">
                        ${(realBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0) || 0).toFixed(0)}
                    </div>
                    <div className="text-slate-400 text-sm">Total Spent</div>
                </div>
            </div>

            {/* All Bookings - Comprehensive View */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                        <span className="text-blue-400">📋</span>
                        <span>All Bookings</span>
                    </h3>
                    <div className="flex items-center space-x-3">
                        <Link to="/tutors" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105">
                            Book New Session
                        </Link>
                    </div>
                </div>

                <div className="space-y-4">
                    {bookingsLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 animate-pulse">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="w-32 h-4 bg-slate-700 rounded mb-2"></div>
                                            <div className="w-24 h-3 bg-slate-700 rounded"></div>
                                        </div>
                                        <div className="w-20 h-6 bg-slate-700 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : realBookings.length > 0 ? (
                        realBookings.map(booking => (
                            <div key={booking.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {booking.tutorName?.charAt(0) || 'T'}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold">{booking.sessionType || 'Tutoring Session'}</h4>
                                            <p className="text-slate-400 text-sm">with {booking.tutorName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${booking.status === 'confirmed' || booking.status === 'scheduled' ? 'text-green-400 bg-green-500/20 border-green-500/30' :
                                            booking.status === 'pending' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' :
                                                booking.status === 'completed' ? 'text-blue-400 bg-blue-500/20 border-blue-500/30' :
                                                    'text-slate-400 bg-slate-500/20 border-slate-500/30'
                                            }`}>
                                            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                                        </span>
                                        <div className="text-right">
                                            <div className="text-white font-bold">${booking.totalAmount}</div>
                                            <div className="text-slate-400 text-sm">{Math.round(booking.duration * 60)}min</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-400 flex-1">
                                        <div>
                                            <span className="text-slate-500">Date:</span> {formatDate(booking.date)}
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Time:</span> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Type:</span> {booking.meetingType === 'virtual' ? '🌐 Virtual' : '📍 In-Person'}
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Subject:</span> {booking.subject || 'General Tutoring'}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 ml-4">
                                        {/* Mark Complete Button for eligible sessions */}
                                        {(booking.status === 'confirmed' || booking.status === 'scheduled') && (
                                            <MarkCompleteButton
                                                booking={booking}
                                                onCompleted={(updatedBooking) => {
                                                    // Refresh bookings list after marking complete
                                                    setRealBookings(prev => prev.map(b => 
                                                        b.id === updatedBooking.id ? updatedBooking : b
                                                    ));
                                                    showSuccessMessage('Session marked as completed! You can now leave a review.');
                                                }}
                                            />
                                        )}

                                        {/* Action buttons based on status */}
                                        {booking.status === 'pending' && (
                                            <button
                                                onClick={() => handleCancelBooking(booking)}
                                                className="px-3 py-1 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-sm transition-all"
                                                title="Cancel booking request"
                                            >
                                                Cancel Request
                                            </button>
                                        )}

                                        {(booking.status === 'confirmed' || booking.status === 'scheduled') && (
                                            <>
                                                {booking.meetingType === 'virtual' && (
                                                    <button
                                                        onClick={() => window.open(booking.meetingLink || '#', '_blank')}
                                                        className="px-3 py-1 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-500/50 bg-green-500/10 hover:bg-green-500/20 rounded-lg text-sm transition-all"
                                                        title="Join virtual meeting"
                                                    >
                                                        Join Meeting
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleCancelBooking(booking)}
                                                    className="px-3 py-1 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-sm transition-all"
                                                    title="Cancel session"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}

                                        {booking.status === 'completed' && (
                                            booking.reviewSubmitted && booking.review ? (
                                                <div className="mt-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-slate-400 text-sm font-medium">Your Review</span>
                                                        <div className="flex items-center space-x-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <svg
                                                                    key={i}
                                                                    className={`w-4 h-4 ${i < booking.review.rating ? 'text-amber-400' : 'text-slate-600'}`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {booking.review.reviewText && (
                                                        <p className="text-slate-300 text-sm mb-2">"{booking.review.reviewText}"</p>
                                                    )}
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className={`${booking.review.wouldRecommend ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                            {booking.review.wouldRecommend ? '👍 Would recommend' : 'Would not recommend'}
                                                        </span>
                                                        <span className="text-slate-500">
                                                            {new Date(booking.review.reviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleReviewBooking(booking)}
                                                    className="px-3 py-1 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg text-sm transition-all"
                                                    title="Leave a review"
                                                >
                                                    Leave Review
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                {booking.notes && (
                                    <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
                                        <div className="text-slate-300 text-sm">
                                            <span className="text-slate-500">Notes:</span> {booking.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                                <span className="text-3xl text-slate-400">📋</span>
                            </div>
                            <h4 className="text-white font-medium mb-2">No bookings yet</h4>
                            <p className="text-slate-400 text-sm mb-4">Your booking requests and confirmed sessions will appear here</p>
                            <Link
                                to="/tutors"
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105"
                            >
                                <span className="mr-2">🎯</span>
                                Find a Tutor
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly Activity - Study Progress */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2 mb-6">
                    <span className="text-emerald-400">📈</span>
                    <span>Weekly Activity</span>
                </h3>

                <div className="grid grid-cols-7 gap-4">
                    {(user.progress?.weeklyActivity || []).map(day => (
                        <div key={day.day} className="text-center">
                            <div className="text-slate-400 text-xs mb-2">{day.day}</div>
                            <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                                <div className="text-white font-medium text-sm">{day.hours}h</div>
                                <div className="text-slate-400 text-xs">{day.tasks} tasks</div>
                                <div className="w-full bg-slate-700 rounded-full h-1">
                                    <div
                                        className="h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                        style={{ width: `${(day.hours / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCalendarContent = () => {
        const daysInMonth = getCalendarDays(calendarDate);
        const selectedEvents = getCalendarEventsForDay(selectedCalendarDay);
        const monthLabel = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDateLabel = selectedCalendarDay
            ? new Date(calendarDate.getFullYear(), calendarDate.getMonth(), selectedCalendarDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Select a day';

        const handleJumpToToday = () => {
            const today = new Date();
            setCalendarDate(today);
            setSelectedCalendarDay(today.getDate());
        };

        return (
            <div className="space-y-6">
                {/* Calendar Header with Export Button */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-slate-400 text-sm mb-1">Student study schedule</p>
                        <h2 className="text-3xl font-bold text-white flex items-center space-x-2">
                            <span>📅</span>
                            <span>Calendar</span>
                        </h2>
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

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-3 bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Monthly overview</p>
                            <h3 className="text-2xl font-bold text-white">{monthLabel}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => navigateCalendarMonth(-1)}
                                className="p-2 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
                                aria-label="Previous month"
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
                                onClick={() => navigateCalendarMonth(1)}
                                className="p-2 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
                                aria-label="Next month"
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

                    <div className="grid grid-cols-7 gap-2">
                        {daysInMonth.map((day, index) => {
                            if (!day) {
                                return <div key={`empty-${index}`} className="min-h-[110px] rounded-xl border border-dashed border-slate-800/70"></div>;
                            }

                            const eventsForDay = getCalendarEventsForDay(day);
                            const isToday = day === new Date().getDate() &&
                                calendarDate.getMonth() === new Date().getMonth() &&
                                calendarDate.getFullYear() === new Date().getFullYear();
                            const isSelected = day === selectedCalendarDay;

                            return (
                                <button
                                    key={`day-${day}`}
                                    onClick={() => setSelectedCalendarDay(day)}
                                    className={`min-h-[110px] rounded-2xl border text-left p-3 transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' : 'border-slate-800/70 bg-slate-900/30 hover:border-blue-500/60'}`}
                                >
                                    <div className="flex items-center justify-between text-sm font-semibold">
                                        <span className="text-white">{day}</span>
                                        {isToday && <span className="text-emerald-400 text-xs">Today</span>}
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {eventsForDay.slice(0, 2).map(event => (
                                            <div
                                                key={event.id}
                                                className={`text-xs px-2 py-1 rounded-full border ${event.type === 'session'
                                                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                                                    : event.priority === 'high'
                                                        ? 'bg-red-500/10 border-red-500/40 text-red-200'
                                                        : event.priority === 'low'
                                                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                                                            : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                                                    } whitespace-nowrap overflow-hidden text-ellipsis`}
                                                title={event.title}
                                            >
                                                {event.title || (event.type === 'session' ? 'Session' : event.subject || 'Task')}
                                            </div>
                                        ))}
                                        {eventsForDay.length > 2 && (
                                            <div className="text-[10px] text-slate-400">
                                                +{eventsForDay.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                                <span className="text-emerald-400">📋</span>
                                <span>{selectedCalendarDay ? selectedDateLabel : 'Select a day'}</span>
                            </h3>
                        </div>

                        {!selectedCalendarDay ? (
                            <div className="text-center text-slate-400 py-8">
                                Choose a day on the calendar to see details.
                            </div>
                        ) : selectedEvents.length === 0 ? (
                            <div className="text-center text-slate-400 py-8">
                                No sessions or tasks scheduled for this day.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedEvents.map(event => (
                                    <div key={event.id} className="p-4 rounded-2xl border border-slate-800/70 bg-slate-900/40">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="text-white font-semibold text-lg line-clamp-1">{event.title}</p>
                                                <p className="text-slate-400 text-sm">
                                                    {event.type === 'session'
                                                        ? `${event.subject} with ${event.tutor || 'your tutor'}`
                                                        : event.subject || 'Personal study task'}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-3 py-1 rounded-full border ${event.type === 'session'
                                                ? 'border-blue-500/40 text-blue-300'
                                                : event.priority === 'high'
                                                    ? 'border-red-500/40 text-red-300'
                                                    : event.priority === 'low'
                                                        ? 'border-emerald-500/40 text-emerald-300'
                                                        : 'border-amber-500/40 text-amber-300'
                                                }`}>
                                                {event.type === 'session' ? 'Session' : 'Task'}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-4 text-xs text-slate-400">
                                            <span>🕒 {formatTime(event.time)}</span>
                                            {event.type === 'session' ? (
                                                <span>📍 {event.meetingType === 'virtual' ? 'Virtual session' : 'In-person'}</span>
                                            ) : (
                                                <span>📌 Status: {event.status}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Event Types</h3>
                        <div className="space-y-3 text-sm text-slate-300">
                            <div className="flex items-center space-x-3">
                                <span className="w-4 h-4 rounded-full bg-blue-500"></span>
                                <span>📚 Tutoring Sessions</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="w-4 h-4 rounded-full bg-red-500"></span>
                                <span>📝 High Priority Tasks</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="w-4 h-4 rounded-full bg-amber-500"></span>
                                <span>📝 Medium Priority Tasks</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="w-4 h-4 rounded-full bg-emerald-500"></span>
                                <span>📝 Low Priority Tasks</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Quick Actions</h3>
                        <Link
                            to="/tutors"
                            className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:opacity-90 transition"
                        >
                            Schedule Session
                        </Link>
                    </div>
                </div>
            </div>
            </div>
        );
    };

    const renderProgressContent = () => {
        // Calculate booking statistics
        const totalBookings = realBookings.length;
        const completedBookings = realBookings.filter(b => b.status === 'completed').length;
        const scheduledBookings = realBookings.filter(b => b.status === 'scheduled' || b.status === 'confirmed').length;
        const cancelledBookings = realBookings.filter(b => b.status === 'cancelled').length;
        const bookingsWithReview = realBookings.filter(b => b.reviewSubmitted).length;

        // Calculate task statistics
        const totalTasksCount = tasks.length;
        const completedTasksCount = taskStats.completed;
        const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

        // Group tasks by subject
        const tasksBySubject = tasks.reduce((acc, task) => {
            const subject = task.subject || 'General';
            if (!acc[subject]) {
                acc[subject] = { total: 0, completed: 0 };
            }
            acc[subject].total++;
            if (task.status === 'completed') {
                acc[subject].completed++;
            }
            return acc;
        }, {});

        return (
            <div className="grid grid-cols-1 gap-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/30">
                        <div className="text-2xl font-bold text-white mb-1">{taskCompletionRate}%</div>
                        <div className="text-slate-400 text-sm">Completion Rate</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-6 border border-emerald-500/30">
                        <div className="text-2xl font-bold text-white mb-1">{taskStats.studyHours}h</div>
                        <div className="text-slate-400 text-sm">Study Hours</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
                        <div className="text-2xl font-bold text-white mb-1">{completedBookings}</div>
                        <div className="text-slate-400 text-sm">Sessions Completed</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-500/30">
                        <div className="text-2xl font-bold text-white mb-1">{totalTasks}</div>
                        <div className="text-slate-400 text-sm">Total Tasks</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Booking Analytics */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                        <h3 className="text-xl font-semibold text-white flex items-center space-x-2 mb-6">
                            <span className="text-blue-400">📚</span>
                            <span>Session Analytics</span>
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                                <div>
                                    <div className="text-white font-medium">Total Sessions</div>
                                    <div className="text-slate-400 text-sm">All time bookings</div>
                                </div>
                                <div className="text-2xl font-bold text-white">{totalBookings}</div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                <div>
                                    <div className="text-emerald-300 font-medium">Completed</div>
                                    <div className="text-emerald-400/70 text-sm">Finished sessions</div>
                                </div>
                                <div className="text-2xl font-bold text-emerald-400">{completedBookings}</div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <div>
                                    <div className="text-blue-300 font-medium">Scheduled</div>
                                    <div className="text-blue-400/70 text-sm">Upcoming sessions</div>
                                </div>
                                <div className="text-2xl font-bold text-blue-400">{scheduledBookings}</div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                                <div>
                                    <div className="text-white font-medium">Reviews Given</div>
                                    <div className="text-slate-400 text-sm">Sessions reviewed</div>
                                </div>
                                <div className="text-2xl font-bold text-purple-400">{bookingsWithReview}</div>
                            </div>
                        </div>
                    </div>

                    {/* Task Analytics */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                        <h3 className="text-xl font-semibold text-white flex items-center space-x-2 mb-6">
                            <span className="text-purple-400">✅</span>
                            <span>Task Analytics</span>
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                                <div>
                                    <div className="text-white font-medium">Total Tasks</div>
                                    <div className="text-slate-400 text-sm">All tasks created</div>
                                </div>
                                <div className="text-2xl font-bold text-white">{totalTasksCount}</div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                <div>
                                    <div className="text-emerald-300 font-medium">Completed</div>
                                    <div className="text-emerald-400/70 text-sm">Tasks finished</div>
                                </div>
                                <div className="text-2xl font-bold text-emerald-400">{completedTasksCount}</div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <div>
                                    <div className="text-amber-300 font-medium">In Progress</div>
                                    <div className="text-amber-400/70 text-sm">Active tasks</div>
                                </div>
                                <div className="text-2xl font-bold text-amber-400">{taskStats.inProgress + taskStats.started}</div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                                <div>
                                    <div className="text-white font-medium">Pending</div>
                                    <div className="text-slate-400 text-sm">Not started yet</div>
                                </div>
                                <div className="text-2xl font-bold text-slate-400">{taskStats.pending}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subject Breakdown */}
                {Object.keys(tasksBySubject).length > 0 && (
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                        <h3 className="text-xl font-semibold text-white flex items-center space-x-2 mb-6">
                            <span className="text-cyan-400">📊</span>
                            <span>Progress by Subject</span>
                        </h3>

                        <div className="space-y-4">
                            {Object.entries(tasksBySubject).map(([subject, stats]) => {
                                const subjectCompletionRate = Math.round((stats.completed / stats.total) * 100);
                                return (
                                    <div key={subject} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-white font-medium">{subject}</div>
                                            <div className="text-slate-400 text-sm">
                                                {stats.completed} / {stats.total} tasks ({subjectCompletionRate}%)
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-3">
                                            <div
                                                className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                                                style={{ width: `${subjectCompletionRate}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Overall Stats Summary */}
                <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-blue-500/20">
                    <h3 className="text-xl font-semibold text-white mb-4">📈 Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-3xl font-bold text-blue-400 mb-1">{totalBookings + totalTasksCount}</div>
                            <div className="text-slate-400 text-sm">Total Activities</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-emerald-400 mb-1">{completedBookings + completedTasksCount}</div>
                            <div className="text-slate-400 text-sm">Completed</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-purple-400 mb-1">{taskStats.studyHours}h</div>
                            <div className="text-slate-400 text-sm">Study Time</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'tasks':
                return renderTasksContent();
            case 'sessions':
                return renderSessionsContent();
            case 'calendar':
                return renderCalendarContent();
            case 'progress':
                return renderProgressContent();
            default:
                return renderOverviewContent();
        }
    };

    // Success notification component
    const SuccessNotification = () => {
        if (!actionSuccess) return null;

        const getNotificationStyles = () => {
            switch (notificationType) {
                case 'success':
                    return {
                        bg: 'bg-emerald-500/10',
                        border: 'border-emerald-500/40',
                        text: 'text-emerald-400',
                        icon: (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )
                    };
                case 'error':
                    return {
                        bg: 'bg-red-500/10',
                        border: 'border-red-500/40',
                        text: 'text-red-400',
                        icon: (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        )
                    };
                case 'warning':
                    return {
                        bg: 'bg-amber-500/10',
                        border: 'border-amber-500/40',
                        text: 'text-amber-400',
                        icon: (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        )
                    };
                case 'info':
                    return {
                        bg: 'bg-blue-500/10',
                        border: 'border-blue-500/40',
                        text: 'text-blue-400',
                        icon: (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        )
                    };
                default:
                    return {
                        bg: 'bg-slate-500/10',
                        border: 'border-slate-500/40',
                        text: 'text-slate-400',
                        icon: null
                    };
            }
        };

        const styles = getNotificationStyles();

        return (
            <div className={`fixed top-20 right-4 z-50 ${styles.bg} ${styles.border} border backdrop-blur-sm rounded-xl shadow-2xl transform transition-all duration-300 ease-in-out animate-slide-in-right max-w-md`}>
                <div className="flex items-start space-x-3 p-4">
                    <div className={`flex-shrink-0 ${styles.text}`}>
                        {styles.icon}
                    </div>
                    <div className="flex-1 pt-0.5">
                        <p className={`text-sm font-medium ${styles.text} leading-relaxed`}>
                            {actionSuccess}
                        </p>
                    </div>
                    <button
                        onClick={() => setActionSuccess('')}
                        className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Main Content with Sidebar */}
            <div className="flex h-[calc(100vh-64px)]">
                {/* Main Content Area */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Welcome Section */}
                        <div className="mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                {greeting.text}, {user?.profile?.fullName || user?.full_name || user?.name || user?.username || 'Student'}! {greeting.emoji}
                            </h1>
                            <p className="text-slate-400 text-lg">Ready to make today productive? Here's your learning overview.</p>
                        </div>



                        {/* Content Based on Active Tab */}
                        {renderTabContent()}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 bg-slate-900/30 backdrop-blur-sm border-l border-slate-800/50 overflow-auto">
                    <div className="p-6 space-y-6">
                        {/* Navigation Tabs */}
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Dashboard</h3>
                            <div className="space-y-1">
                                {navigationTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full px-3 py-2 rounded-lg flex items-center transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-white/10 text-white shadow-lg border border-white/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Key Actions */}
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Key Actions</h3>
                            <div className="space-y-2">
                                {quickActions.map((action) => {
                                    const baseStyles = `w-full p-3 rounded-xl border bg-gradient-to-r ${action.gradient} ${action.border} transition-all duration-200 hover:border-white/40`;
                                    const content = (
                                        <>
                                            <div className="text-white text-sm font-semibold">{action.label}</div>
                                            <div className="text-slate-200 text-xs">{action.description}</div>
                                        </>
                                    );

                                    return action.to ? (
                                        <Link key={action.id} to={action.to} className={`${baseStyles} block`}>
                                            {content}
                                        </Link>
                                    ) : (
                                        <button key={action.id} onClick={action.onClick} className={`${baseStyles} text-left`}>
                                            {content}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Urgent Tasks */}
                        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-4 border border-red-500/20">
                            <h3 className="text-sm font-semibold text-red-300 mb-3 uppercase tracking-wide flex items-center space-x-2">
                                <span className="text-red-400">🔥</span>
                                <span>Urgent Tasks</span>
                            </h3>

                            <div className="space-y-3">
                                {(user.urgentTasks || []).slice(0, 2).map((task, idx) => (
                                    <div key={task.title} className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="text-white text-xs font-medium line-clamp-2">{task.title}</div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'high'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <div className="text-slate-400 text-xs mb-1">{task.subject}</div>
                                        <div className="text-slate-500 text-xs">Due: {task.due}</div>
                                    </div>
                                ))}
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

            {/* Task Modals */}
            <TaskModal
                isEdit={false}
                isOpen={showTaskModal}
                onClose={handleModalClose}
                newTask={newTask}
                setNewTask={setNewTask}
                errors={errors}
                loading={loading}
                onSubmit={handleAddTask}
            />
            <TaskModal
                isEdit={true}
                isOpen={showEditTaskModal}
                onClose={handleModalClose}
                newTask={newTask}
                setNewTask={setNewTask}
                errors={errors}
                loading={loading}
                onSubmit={handleUpdateTask}
            />

            {/* Booking Modals */}
            <RescheduleModal
                isOpen={showRescheduleModal}
                onClose={() => setShowRescheduleModal(false)}
                booking={selectedBooking}
                onRescheduleSuccess={handleRescheduleSuccess}
            />

            <CancelBookingModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                booking={selectedBooking}
                onCancelSuccess={handleCancelSuccess}
            />

            {ReviewModal}

            {/* Success Notification */}
            <SuccessNotification />
        </div>
    );
};

export default StudentDashboard;