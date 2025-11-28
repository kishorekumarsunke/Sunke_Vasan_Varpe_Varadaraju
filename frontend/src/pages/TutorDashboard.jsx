import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Modal, Button } from '../components/ui';
import BookingNotifications from '../components/BookingNotifications';
import ProfileCompletionAlert from '../components/ProfileCompletionAlert';
import { bookingService } from '../services/bookingService';
import { taskService } from '../services/api';
import { subjectService } from '../services/subjectService';
import MarkCompleteButton from '../components/MarkCompleteButton';

// Standalone TaskModal component to prevent recreation on re-renders
const TaskModal = ({
  isOpen,
  onClose,
  isEdit = false,
  newTask,
  setNewTask,
  errors,
  loading,
  subjects,
  handleEditTask,
  handleAddTask
}) => {
  const handleTaskInputChange = useCallback((field, value) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setNewTask]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          {isEdit ? 'Edit Task' : 'Add New Task'}
        </h2>

        {errors.general && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{errors.general}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
            <input
              type="text"
              value={newTask.title || ''}
              onChange={(e) => handleTaskInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.title ? 'border-red-500' : 'border-slate-700'}`}
              placeholder="Enter task title"
              disabled={loading}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={newTask.description || ''}
              onChange={(e) => handleTaskInputChange('description', e.target.value)}
              rows="3"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter task description"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject *</label>
              <select
                value={newTask.subject || ''}
                onChange={(e) => handleTaskInputChange('subject', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.subject ? 'border-red-500' : 'border-slate-700'}`}
                disabled={loading}
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.name}>{subject.name}</option>
                ))}
              </select>
              {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
              <select
                value={newTask.priority || 'medium'}
                onChange={(e) => handleTaskInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
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
                onChange={(e) => handleTaskInputChange('estimatedTime', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.estimatedTime ? 'border-red-500' : 'border-slate-700'}`}
                placeholder="e.g., 2 hours"
                disabled={loading}
              />
              {errors.estimatedTime && <p className="text-red-400 text-xs mt-1">{errors.estimatedTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Due Date *</label>
              <input
                type="date"
                value={newTask.due || ''}
                onChange={(e) => handleTaskInputChange('due', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.due ? 'border-red-500' : 'border-slate-700'}`}
                disabled={loading}
              />
              {errors.due && <p className="text-red-400 text-xs mt-1">{errors.due}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={isEdit ? handleEditTask : handleAddTask}
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

const TutorDashboard = () => {
  const { user: authUser, loading: authLoading } = useAuth();

  // All hooks must be called before any early returns
  const [activeTab, setActiveTab] = useState('overview');

  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [isExporting, setIsExporting] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [sessionFilter, setSessionFilter] = useState('all');
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState(null);
  const [realSessions, setRealSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [earningsData, setEarningsData] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Task-related state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subject: '',
    priority: 'medium',
    estimatedTime: '',
    due: ''
  });
  const [errors, setErrors] = useState({});
  const [tutorData, setTutorData] = useState({
    stats: {
      upcomingSessions: 0,
      activeStudents: 0,
      monthlyEarnings: 0,
      averageRating: 0
    },
    recentStudents: [],
    students: [],
    earnings: {
      total: 0,
      thisMonth: 0,
      thisWeek: 0,
      todayEarnings: 0,
      dailyEarnings: []
    },
    todaySessions: []
  });

  // Early return if user is not loaded yet - AFTER all hooks
  if (authLoading || !authUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Load pending requests function - moved outside useEffect for accessibility
  const loadPendingRequests = async () => {
    try {
      console.log('🔔 Loading pending booking requests...');
      setRequestsLoading(true);

      // Get tutor booking requests with authentication
      const response = await fetch('http://localhost:5000/api/booking/tutor/requests', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 Raw pending requests data:', data);
      console.log('📋 Data type:', typeof data);
      console.log('📋 Data keys:', data ? Object.keys(data) : 'null');

      // Extract the requests from the API response
      let requests = [];
      if (data && data.requests && Array.isArray(data.requests)) {
        requests = data.requests;
      } else if (data && Array.isArray(data)) {
        requests = data;
      }

      console.log('📋 Extracted requests:', requests);

      // Requests are already filtered by status in backend, but let's ensure pending only
      const pendingBookings = requests.filter(request => {
        console.log('🔍 Checking request status:', request.status, 'for request:', request.id);
        return request.status === 'pending';
      });

      console.log('🔔 Final filtered pending requests:', pendingBookings);
      setPendingRequests(pendingBookings);

    } catch (error) {
      console.error('❌ Failed to load pending requests:', error);
      console.error('❌ Error details:', error.message);
      setPendingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Load real sessions function - moved outside useEffect for accessibility  
  const loadRealSessions = async () => {
    try {
      console.log('Starting to load real sessions...');
      setSessionsLoading(true);
      setSessionsError(null);
      const sessionData = await bookingService.getTutorSessions();
      console.log('Raw session data received:', sessionData);
      console.log('Session data type:', typeof sessionData);
      console.log('Session data keys:', sessionData ? Object.keys(sessionData) : 'null');

      // Ensure we always have an array and map the data structure
      let sessions = [];
      if (sessionData && sessionData.sessions && Array.isArray(sessionData.sessions)) {
        console.log('Using sessionData.sessions:', sessionData.sessions);
        sessions = sessionData.sessions;
      } else if (sessionData && Array.isArray(sessionData)) {
        console.log('Using sessionData directly:', sessionData);
        sessions = sessionData;
      } else {
        console.warn('Invalid session data format:', sessionData);
        setRealSessions([]);
        return;
      }

      // Auto-complete past sessions and map to frontend format
      const now = new Date();
      const mappedSessions = [];

      for (const session of sessions) {
        console.log('🔄 Processing session - Full data:', JSON.stringify(session, null, 2));

        // Check if session is scheduled/confirmed and time has passed
        const shouldAutoComplete = (session.status === 'scheduled' || session.status === 'confirmed') &&
          session.date;

        if (shouldAutoComplete) {
          const sessionDate = session.date.includes('T') ? session.date.split('T')[0] : session.date;
          // Use end_time if available, otherwise calculate from start_time + duration
          let sessionEndTime;

          // Try multiple field variations for end time
          const endTimeField = session.end_time || session.endTime || session.session_end_time;
          const startTimeField = session.start_time || session.startTime || session.time || session.session_time;

          if (endTimeField) {
            sessionEndTime = new Date(`${sessionDate}T${endTimeField}`);
            console.log('📅 Using end_time field:', endTimeField);
          } else if (startTimeField) {
            // Calculate end time from start time + duration
            const duration = session.duration_minutes || session.duration || 60;
            sessionEndTime = new Date(`${sessionDate}T${startTimeField}`);
            sessionEndTime.setMinutes(sessionEndTime.getMinutes() + duration);
            console.log('📅 Calculated end time from start_time:', startTimeField, '+ duration:', duration, 'minutes');
          }

          console.log('⏰ Session ID:', session.id, 'Status:', session.status);
          console.log('⏰ Session date:', sessionDate, 'End time:', sessionEndTime);
          console.log('⏰ Current time:', now, 'Has passed:', sessionEndTime && now > sessionEndTime);

          if (sessionEndTime && now > sessionEndTime) {
            console.log('🔄 Auto-completing past session ID:', session.id);
            try {
              const result = await bookingService.markSessionComplete(session.id);
              console.log('✅ Successfully auto-completed session:', session.id, 'Result:', result);
              // Update the status in our local copy
              session.status = 'completed';
            } catch (error) {
              console.error('❌ Failed to auto-complete session:', session.id);
              console.error('❌ Error details:', error);
              // Keep original status if update fails
            }
          }
        }

        // Map the backend data structure to frontend expected format
        const mapped = {
          id: session.id || session.session_id || session.booking_id || `session-${Date.now()}`,
          studentId: session.studentId || session.student_id,
          studentName: session.studentName || session.student_name || 'Unknown Student',
          subject: session.subject || 'General Tutoring',
          topic: session.topic || session.notes || session.message || 'Session topic',
          date: session.date || session.session_date || session.booking_date,
          time: session.time || session.session_time || session.start_time,
          duration: session.duration || session.duration_minutes || 60,
          // Use the updated status from auto-complete, or map confirmed to scheduled
          status: session.status === 'completed' ? 'completed' :
            (session.status === 'confirmed' ? 'scheduled' : (session.status || 'scheduled')),
          notes: session.notes || session.message || '',
          meetingType: session.meetingType || session.meeting_type || 'virtual',
          meetingLink: session.meetingLink || session.meeting_link || null,
          location: session.location || null
        };
        console.log('✅ Mapped session result:', mapped);
        mappedSessions.push(mapped);
      }

      // Filter out pending requests as they're handled separately
      const nonPendingSessions = mappedSessions.filter(s => s.status !== 'pending');
      console.log('Mapped sessions for UI (excluding pending):', nonPendingSessions);
      setRealSessions(nonPendingSessions);
    } catch (error) {
      console.error('Failed to load real sessions:', error);
      console.error('Error details:', error.message, error.stack);
      setSessionsError(error?.message || 'Unknown error');
      // Keep empty array on error - no mock data
      setRealSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Load earnings data
  const loadEarningsData = async () => {
    try {
      setEarningsLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/booking/tutor/earnings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch earnings data');
      }

      const data = await response.json();
      console.log('💰 Loaded earnings data:', data);
      setEarningsData(data);
    } catch (error) {
      console.error('❌ Error loading earnings data:', error);
      showErrorMessage('Failed to load earnings data');
    } finally {
      setEarningsLoading(false);
    }
  };

  // Load overview statistics
  const loadOverviewData = async () => {
    try {
      setOverviewLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/booking/tutor/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch overview data');
      }

      const data = await response.json();
      console.log('📊 Loaded overview data:', data);
      setOverviewData(data);
    } catch (error) {
      console.error('❌ Error loading overview data:', error);
    } finally {
      setOverviewLoading(false);
    }
  };

  // Load real sessions data
  useEffect(() => {
    loadRealSessions();
    loadPendingRequests();
    loadEarningsData();
    loadOverviewData();
    loadTutorData();
    loadTasks();
    loadSubjects();
  }, []);  // Load tutor profile data
  const loadTutorData = async () => {
    try {
      // For now, use some default data while we implement the API
      setTutorData({
        stats: {
          upcomingSessions: realSessions.filter(s => s.status === 'scheduled').length,
          activeStudents: 34,
          monthlyEarnings: 4680,
          averageRating: 4.9
        },
        recentStudents: [
          { id: '1', name: 'Alex Rodriguez', subject: 'Mathematics', progress: 85 },
          { id: '2', name: 'Emma Wilson', subject: 'Physics', progress: 92 },
          { id: '3', name: 'Mike Chen', subject: 'Chemistry', progress: 78 },
          { id: '4', name: 'Sarah Johnson', subject: 'Computer Science', progress: 95 }
        ],
        students: [
          { id: '1', name: 'Alex Rodriguez', avatar: 'https://via.placeholder.com/48', university: 'UT Arlington', totalSessions: 12, averageRating: 4.8, progress: 85 },
          { id: '2', name: 'Emma Wilson', avatar: 'https://via.placeholder.com/48', university: 'UT Arlington', totalSessions: 8, averageRating: 4.9, progress: 92 },
          { id: '3', name: 'Mike Chen', avatar: 'https://via.placeholder.com/48', university: 'UT Arlington', totalSessions: 15, averageRating: 4.7, progress: 78 }
        ],
        earnings: {
          total: 15420,
          thisMonth: 4680,
          thisWeek: 1250,
          todayEarnings: 300,
          dailyEarnings: [
            { date: '2025-11-20', amount: 300, sessions: 3 },
            { date: '2025-11-19', amount: 250, sessions: 2 },
            { date: '2025-11-18', amount: 400, sessions: 4 }
          ]
        },
        todaySessions: realSessions.filter(s => {
          const sessionDate = s.date?.includes('T') ? s.date.split('T')[0] : s.date;
          return sessionDate === new Date().toISOString().split('T')[0];
        })
      });
    } catch (error) {
      console.error('Failed to load tutor data:', error);
    }
  };

  // Task loading and management functions
  const loadTasks = async () => {
    try {
      setTasksLoading(true);
      const result = await taskService.getTasks();
      console.log('📋 Loaded tutor tasks:', result.data);

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
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const result = await subjectService.getSubjects();
      setSubjects(result.data || []);
    } catch (error) {
      console.error('❌ Error loading subjects:', error);
      setSubjects([]);
    }
  };

  // Task validation and management
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
      const result = await taskService.createTask(newTask);
      console.log('✅ Task created:', result.data);

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
      console.error('❌ Error creating task:', error);
      setErrors({ general: 'Failed to create task. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = async () => {
    if (!validateTask()) return;

    setLoading(true);
    try {
      await taskService.updateTask(newTask.id, newTask);
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
      setShowEditTaskModal(false);
      showSuccessMessage('Task updated successfully!');
    } catch (error) {
      console.error('❌ Error updating task:', error);
      setErrors({ general: 'Failed to update task. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      let progress = task.progress || 0;
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

      await taskService.updateTask(taskId, updates);
      console.log('✅ Task status changed:', taskId, newStatus);

      await loadTasks();
      showSuccessMessage(`Task status updated to ${newStatus}!`);
    } catch (error) {
      console.error('❌ Error changing task status:', error);
      showErrorMessage('Failed to update task status. Please try again.');
    }
  };

  const handleTaskPriorityChange = async (taskId, newPriority) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates = {
        ...task,
        priority: newPriority
      };

      await taskService.updateTask(taskId, updates);
      console.log('✅ Task priority changed:', taskId, newPriority);

      await loadTasks();
      showSuccessMessage(`Priority updated to ${newPriority}!`);
    } catch (error) {
      console.error('❌ Error changing task priority:', error);
      showErrorMessage('Failed to update task priority. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskService.deleteTask(taskId);
      await loadTasks();
      showSuccessMessage('Task deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      showErrorMessage('Failed to delete task. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value
    }));
  };









  const StudentsModal = () => (
    <Modal isOpen={showStudentsModal} onClose={() => setShowStudentsModal(false)}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">My Students ({tutorData.recentStudents.length})</h2>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {tutorData.recentStudents.map(student => (
            <div key={student.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                    <span className="text-emerald-400 text-sm font-medium">
                      {student.name ? student.name.split(' ').map(n => n[0]).join('') : 'U'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{student.name}</h4>
                    <p className="text-slate-400 text-sm">{student.subject}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-slate-500 text-xs">Progress: {student.progress}%</p>
                      <div className="w-12 bg-slate-700 rounded-full h-1">
                        <div
                          className="bg-emerald-500 h-1 rounded-full"
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      showSuccessMessage(`Message sent to ${student.name}!`);
                      setShowStudentsModal(false);
                    }}
                    disabled={loading}
                  >
                    💬 Message
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      showSuccessMessage(`Viewing ${student.name}'s profile...`);
                      setShowStudentsModal(false);
                    }}
                    disabled={loading}
                  >
                    👤 Profile
                  </Button>

                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => showSuccessMessage('Searching for new students...')}
            className="flex-1"
            disabled={loading}
          >
            Find New Students
          </Button>
          <Button
            onClick={() => setShowStudentsModal(false)}
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );

  const AnalyticsModal = () => (
    <Modal isOpen={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">Teaching Analytics</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{tutorData.stats.upcomingSessions}</div>
            <div className="text-slate-400 text-sm">This Week's Sessions</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{tutorData.stats.averageRating}</div>
            <div className="text-slate-400 text-sm">Average Rating</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">${tutorData.stats.monthlyEarnings}</div>
            <div className="text-slate-400 text-sm">This Month</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{tutorData.stats.activeStudents}</div>
            <div className="text-slate-400 text-sm">Active Students</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-white font-medium mb-2">Popular Subjects</h3>
            <div className="space-y-2">
              {['Mathematics', 'Physics', 'Chemistry'].map((subject, idx) => (
                <div key={subject} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{subject}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${100 - idx * 30}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm">{100 - idx * 30}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={() => setShowAnalyticsModal(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );

  const handleCancelSession = (session) => {
    setSelectedSession(session);
    setShowCancelSessionModal(true);
  };

  const confirmCancelSession = async () => {
    if (!selectedSession) return;

    try {
      console.log('🚫 Cancelling session:', selectedSession.id);
      setLoading(true);

      // Extract numeric ID from session ID format (e.g., "session-6" -> "6")
      const numericBookingId = selectedSession.id.toString().startsWith('session-')
        ? selectedSession.id.replace('session-', '')
        : selectedSession.id;

      const response = await fetch(`http://localhost:5000/api/booking/tutor/bookings/${numericBookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: cancelReason || 'Session cancelled by tutor'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel session');
      }

      const result = await response.json();
      console.log('✅ Session cancelled:', result);

      // Close modal and reset state
      setShowCancelSessionModal(false);
      setSelectedSession(null);
      setCancelReason('');

      // Show success message
      setActionSuccess('Session cancelled successfully. Student has been notified.');
      setTimeout(() => setActionSuccess(''), 5000);

      // Reload sessions to reflect changes
      loadRealSessions();

    } catch (error) {
      console.error('❌ Error cancelling session:', error);
      alert('Failed to cancel session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      console.log('✅ Accepting booking request:', requestId);

      const response = await fetch(`http://localhost:5000/api/booking/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'accept',
          responseMessage: 'Your booking request has been accepted!'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to accept request: ${errorData.error || response.status}`);
      }

      const result = await response.json();
      console.log('✅ Booking request accepted:', result);

      // Remove from pending requests and reload data
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      loadPendingRequests(); // Reload to ensure consistency
      loadRealSessions(); // Reload sessions to show the new confirmed session
      loadEarningsData(); // Refresh earnings after accepting

    } catch (error) {
      console.error('❌ Error accepting booking request:', error);
      alert('Failed to accept booking request: ' + error.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      console.log('❌ Rejecting booking request:', requestId);

      const response = await fetch(`http://localhost:5000/api/booking/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'decline',
          responseMessage: 'Sorry, I cannot accommodate this booking request at this time.'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to reject request: ${errorData.error || response.status}`);
      }

      const result = await response.json();
      console.log('❌ Booking request declined:', result);

      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      loadPendingRequests(); // Reload to ensure consistency

    } catch (error) {
      console.error('❌ Error rejecting booking request:', error);
      alert('Failed to reject booking request: ' + error.message);
    }
  };



  // Calendar export functionality
  const generateTutorSessionICalContent = (sessions) => {
    const icalEvents = sessions.filter(session => session.status === 'upcoming').map(session => {
      const startDate = new Date(`${session.date}T${session.time}`);
      const endDate = new Date(startDate.getTime() + (session.duration * 60 * 1000)); // Duration in minutes

      const formatICalDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      return [
        'BEGIN:VEVENT',
        `DTSTART:${formatICalDate(startDate)}`,
        `DTEND:${formatICalDate(endDate)}`,
        `SUMMARY:${session.subject} - Tutoring Session with ${session.student}`,
        `DESCRIPTION:Tutoring session for ${session.subject} with student ${session.student}. Notes: ${session.notes || 'No additional notes'}`,
        `LOCATION:${session.meetingLink || 'TBD'}`,
        `UID:${session.id}@tutortogether.com`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].join('\r\n');
    }).join('\r\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tutor Together//Tutor Sessions Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      icalEvents,
      'END:VCALENDAR'
    ].join('\r\n');
  };

  const handleExportTutorSessions = async (format = 'ical') => {
    setIsExporting(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const upcomingSessions = realSessions.filter(session => session.status === 'scheduled');

      if (upcomingSessions.length === 0) {
        setActionSuccess('No upcoming sessions to export');
        setTimeout(() => setActionSuccess(null), 3000);
        return;
      }

      const icalContent = generateTutorSessionICalContent(realSessions);

      if (format === 'ical') {
        const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tutor-sessions-${new Date().toISOString().split('T')[0]}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      setActionSuccess(`${upcomingSessions.length} sessions exported successfully!`);
      setTimeout(() => setActionSuccess(null), 3000);

    } catch (error) {
      console.error('Export failed:', error);
      setActionSuccess('Export failed. Please try again.');
      setTimeout(() => setActionSuccess(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Success notification component
  const SuccessNotification = () => actionSuccess && (
    <div className="fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg">
      {actionSuccess}
    </div>
  );

  const renderTasksContent = () => {
    const taskStats = {
      pending: tasks.filter(task => task.status === 'pending').length,
      started: tasks.filter(task => task.status === 'started').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      studyHours: tasks.reduce((total, task) => {
        if (task.status === 'completed' && task.estimatedTime) {
          const hours = parseFloat(task.estimatedTime.match(/\d+/)?.[0] || 0);
          return total + hours;
        }
        return total;
      }, 0)
    };

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
        case 'in-progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'started': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        case 'pending': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      }
    };

    return (
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
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-6 border border-emerald-500/30">
            <div className="text-2xl font-bold text-white mb-1">{taskStats.completed}</div>
            <div className="text-slate-400 text-sm">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
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
                    {task.description && (
                      <div className="text-slate-400 text-sm mb-2">{task.description}</div>
                    )}

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
                      <span>📅 Due: {new Date(task.due).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
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
                        onChange={(e) => handleTaskPriorityChange(task.id, e.target.value)}
                        className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        setNewTask(task);
                        setShowEditTaskModal(true);
                      }}
                      className="px-3 py-1 text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-xs transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 py-1 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const stats = [
    {
      label: 'Upcoming Sessions',
      value: tutorData.stats.upcomingSessions,
      change: '+12%',
      color: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      iconBg: 'bg-blue-500/20'
    },
    {
      label: 'Active Students',
      value: tutorData.stats.activeStudents,
      change: '+8%',
      color: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
      iconBg: 'bg-emerald-500/20'
    },
    {
      label: 'Monthly Earnings',
      value: `$${tutorData.stats.monthlyEarnings}`,
      change: '+15%',
      color: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30',
      iconBg: 'bg-amber-500/20'
    },
    {
      label: 'Session Rating',
      value: tutorData.stats.averageRating,
      change: '+5%',
      color: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30',
      iconBg: 'bg-purple-500/20'
    }
  ];

  const navigationTabs = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'sessions', label: 'Sessions', icon: 'book' },
    { id: 'tasks', label: 'Tasks', icon: 'clipboard' },
    { id: 'earnings', label: 'Earnings', icon: 'dollar' }
  ];

  const quickActions = [
    {
      id: 'calendar',
      label: 'Calendar',
      description: 'Glance at your week',
      to: '/calendar',
      gradient: 'from-blue-500/20 via-indigo-500/10 to-indigo-500/20',
      border: 'border-blue-500/30'
    },
    {
      id: 'profile',
      label: 'Profile',
      description: 'Manage your tutor profile',
      to: '/tutor-profile',
      gradient: 'from-purple-500/20 via-violet-500/10 to-violet-500/20',
      border: 'border-purple-500/30'
    },
    {
      id: 'add-task',
      label: 'Add Task',
      description: 'Capture prep or follow-ups',
      onClick: () => setShowTaskModal(true),
      gradient: 'from-rose-500/20 via-pink-500/10 to-pink-500/20',
      border: 'border-rose-500/30'
    },
    {
      id: 'messages',
      label: 'Messages',
      description: 'Jump into student chats',
      to: '/messages',
      gradient: 'from-amber-500/20 via-orange-500/10 to-orange-500/20',
      border: 'border-amber-500/30'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in-progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
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

  const renderSessionsContent = () => {
    // Debug logging
    console.log('realSessions:', realSessions);
    console.log('pendingRequests:', pendingRequests);

    // Use only confirmed sessions (pending handled separately in overview)
    const confirmedSessions = realSessions || [];
    const requestsAsSessions = (pendingRequests || []).map(request => ({
      id: request.id,
      studentId: request.studentId,
      studentName: request.studentName || 'Unknown Student',
      subject: request.subject || 'General',
      topic: request.notes || 'Session requested',
      date: request.date, // API returns date as "2025-12-07T06:00:00.000Z"
      time: request.startTime, // API returns startTime as "13:00:00"
      duration: (request.duration * 60) || 60, // API returns duration in hours, convert to minutes
      status: 'pending',
      notes: request.notes || '',
      meetingType: request.meetingType || 'virtual',
      meetingLink: null,
      location: request.location || null,
      createdAt: request.createdAt
    }));

    const allSessions = [...confirmedSessions, ...requestsAsSessions];
    console.log('Using combined sessions:', allSessions);
    console.log('Confirmed sessions:', confirmedSessions.length);
    console.log('Pending requests:', requestsAsSessions.length);

    const filterSessions = () => {
      if (sessionFilter === 'all') return allSessions;
      if (sessionFilter === 'upcoming') return allSessions.filter(s => s.status === 'scheduled' || s.status === 'pending');
      if (sessionFilter === 'completed') return allSessions.filter(s => s.status === 'completed');
      if (sessionFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        return allSessions.filter(s => {
          const sessionDate = s.date && s.date.includes('T') ? s.date.split('T')[0] : s.date;
          return sessionDate === today;
        });
      }
      return allSessions;
    };

    const filteredSessions = filterSessions();

    return (
      <div className="space-y-6">
        {/* Session Management Header */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Sessions Management</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExportTutorSessions('ical')}
                disabled={isExporting}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 text-sm"
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
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6 bg-slate-800/30 rounded-lg p-1">
            {[
              { id: 'all', label: 'All Sessions', count: allSessions.length },
              {
                id: 'today', label: 'Today', count: allSessions.filter(s => {
                  const sessionDate = s.date && s.date.includes('T') ? s.date.split('T')[0] : s.date;
                  return sessionDate === new Date().toISOString().split('T')[0];
                }).length
              },
              { id: 'upcoming', label: 'Upcoming', count: allSessions.filter(s => s.status === 'scheduled' || s.status === 'pending').length },
              { id: 'completed', label: 'Completed', count: allSessions.filter(s => s.status === 'completed').length }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSessionFilter(filter.id)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${sessionFilter === filter.id
                  ? 'bg-white/10 text-white shadow-lg border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {filter.label}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-700/50 text-xs">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sessions List */}
          <div className="space-y-4">
            {sessionsLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4"></div>
                  <div className="w-32 h-4 bg-slate-700 rounded mx-auto mb-2"></div>
                  <div className="w-24 h-3 bg-slate-700 rounded mx-auto"></div>
                </div>
                <p className="text-slate-400 mt-4">Loading sessions...</p>
              </div>
            ) : sessionsError ? (
              <div className="text-center py-12">
                <div className="text-red-400 text-lg mb-2">⚠️</div>
                <h4 className="text-red-300 font-medium mb-1">Error loading sessions</h4>
                <p className="text-red-500 text-sm mb-4">{sessionsError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 text-lg mb-2">📚</div>
                <h4 className="text-slate-300 font-medium mb-1">No sessions found</h4>
                <p className="text-slate-500 text-sm">No sessions match the current filter criteria.</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div key={session.id} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                        <span className="text-blue-400 text-sm font-medium">
                          {session.studentName ? session.studentName.split(' ').map(n => n[0]).join('') : 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="text-white font-medium">{session.subject}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">with {session.studentName}</p>
                        <p className="text-slate-500 text-xs mt-1">{session.topic}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-white font-medium">{formatDate(session.date)}</div>
                      <div className="text-slate-400 text-sm">{formatTime(session.time)}</div>
                      <div className="text-slate-500 text-xs">{session.duration} minutes</div>

                      <div className="flex items-center space-x-2 mt-3">
                        <button
                          onClick={() => {
                            setSelectedSessionDetails(session);
                            setShowSessionDetails(true);
                          }}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs hover:bg-blue-500/30 transition-colors"
                        >
                          View Details
                        </button>
                        {session.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAcceptRequest(session.id)}
                              className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs hover:bg-green-500/30 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(session.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {(session.status === 'scheduled' || session.status === 'confirmed') && (
                          <MarkCompleteButton
                            booking={{
                              ...session,
                              endTime: session.endTime || session.time, // Fallback to start time if endTime missing
                              studentName: session.studentName
                            }}
                            onCompleted={(updatedSession) => {
                              // Update the session in state
                              setRealSessions(prev => prev.map(s =>
                                s.id === updatedSession.id ? { ...s, status: 'completed' } : s
                              ));
                            }}
                            className="text-xs px-2 py-1"
                          />
                        )}
                        {session.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancelSession(session)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {session.meetingLink && session.status === 'scheduled' && (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs hover:bg-emerald-500/30 transition-colors"
                          >
                            Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Session Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
            <h4 className="text-slate-400 text-sm font-medium mb-2">This Week</h4>
            <div className="text-2xl font-bold text-white mb-1">
              {allSessions.filter(s => {
                const sessionDateStr = s.date.includes('T') ? s.date.split('T')[0] : s.date;
                const sessionDate = new Date(sessionDateStr);
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return sessionDate >= weekStart && sessionDate <= weekEnd;
              }).length}
            </div>
            <div className="text-slate-500 text-xs">Sessions scheduled</div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
            <h4 className="text-slate-400 text-sm font-medium mb-2">Completion Rate</h4>
            <div className="text-2xl font-bold text-white mb-1">
              {allSessions.length > 0 ? Math.round((allSessions.filter(s => s.status === 'completed').length / allSessions.length) * 100) : 0}%
            </div>
            <div className="text-slate-500 text-xs">Sessions completed</div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
            <h4 className="text-slate-400 text-sm font-medium mb-2">Total Hours</h4>
            <div className="text-2xl font-bold text-white mb-1">
              {Math.round(allSessions.reduce((total, session) => total + session.duration, 0) / 60)}
            </div>
            <div className="text-slate-500 text-xs">Hours taught</div>
          </div>
        </div>
      </div>
    );
  };

  const SessionDetailsModal = () => (
    <Modal isOpen={showSessionDetails} onClose={() => setShowSessionDetails(false)}>
      <div className="p-6">
        {selectedSessionDetails && (
          <>
            <h2 className="text-xl font-bold text-white mb-6">Session Details</h2>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-slate-400 text-sm font-medium mb-1">Subject</h4>
                    <p className="text-white">{selectedSessionDetails.subject}</p>
                  </div>
                  <div>
                    <h4 className="text-slate-400 text-sm font-medium mb-1">Status</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedSessionDetails.status)}`}>
                      {selectedSessionDetails.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-slate-400 text-sm font-medium mb-1">Student</h4>
                    <p className="text-white">{selectedSessionDetails.studentName}</p>
                  </div>
                  <div>
                    <h4 className="text-slate-400 text-sm font-medium mb-1">Topic</h4>
                    <p className="text-white">{selectedSessionDetails.topic}</p>
                  </div>
                  <div>
                    <h4 className="text-slate-400 text-sm font-medium mb-1">Date & Time</h4>
                    <p className="text-white">{formatDate(selectedSessionDetails.date)} at {formatTime(selectedSessionDetails.time)}</p>
                  </div>
                  <div>
                    <h4 className="text-slate-400 text-sm font-medium mb-1">Duration</h4>
                    <p className="text-white">{selectedSessionDetails.duration} minutes</p>
                  </div>
                </div>
              </div>

              {selectedSessionDetails.notes && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="text-slate-400 text-sm font-medium mb-2">
                    {selectedSessionDetails.status === 'pending' ? 'Student Notes / Message' : 'Session Notes'}
                  </h4>
                  <p className="text-slate-300 text-sm italic">"{selectedSessionDetails.notes}"</p>
                </div>
              )}

              {selectedSessionDetails.meetingLink && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="text-slate-400 text-sm font-medium mb-2">Meeting Link</h4>
                  <a
                    href={selectedSessionDetails.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm break-all"
                  >
                    {selectedSessionDetails.meetingLink}
                  </a>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowSessionDetails(false)}
                className="flex-1"
              >
                Close
              </Button>
              {selectedSessionDetails.status === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      setShowSessionDetails(false);
                      handleAcceptRequest(selectedSessionDetails.id);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Accept Request
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSessionDetails(false);
                      handleRejectRequest(selectedSessionDetails.id);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Decline Request
                  </Button>
                </>
              )}
              {selectedSessionDetails.status === 'scheduled' && (
                <>
                  <Button
                    onClick={() => {
                      setShowSessionDetails(false);
                      handleCancelSession(selectedSessionDetails);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Cancel Session
                  </Button>
                  {selectedSessionDetails.meetingLink && (
                    <Button
                      onClick={() => {
                        window.open(selectedSessionDetails.meetingLink, '_blank');
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Join Meeting
                    </Button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );

  // Loading screen component
  if (sessionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4"></div>
            <div className="w-32 h-4 bg-slate-700 rounded mx-auto mb-2"></div>
            <div className="w-24 h-3 bg-slate-700 rounded mx-auto"></div>
          </div>
          <p className="text-slate-400 mt-4 text-center">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderOverviewContent = () => {
    // Use real data from overview API
    const pendingRequestsCount = overviewData?.stats?.pendingRequests || 0;
    const scheduledSessionsCount = overviewData?.stats?.scheduledSessions || 0;
    const completedSessionsCount = overviewData?.stats?.completedSessions || 0;
    const totalStudents = overviewData?.stats?.totalStudents || 0;
    const todayEarnings = overviewData?.stats?.todayEarnings || 0;
    const monthEarnings = overviewData?.stats?.monthEarnings || 0;
    const rating = overviewData?.profile?.rating || 0;
    const totalReviews = overviewData?.profile?.totalReviews || 0;

    return (
      <div className="grid grid-cols-1 gap-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-6 border border-orange-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Pending Requests</span>
              <span className="text-orange-400 text-2xl">🔔</span>
            </div>
            <div className="text-white text-3xl font-bold">{pendingRequestsCount}</div>
            <div className="text-slate-400 text-xs mt-1">Awaiting response</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Scheduled Sessions</span>
              <span className="text-blue-400 text-2xl">📅</span>
            </div>
            <div className="text-white text-3xl font-bold">{scheduledSessionsCount}</div>
            <div className="text-slate-400 text-xs mt-1">Confirmed bookings</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Completed</span>
              <span className="text-emerald-400 text-2xl">✅</span>
            </div>
            <div className="text-white text-3xl font-bold">{completedSessionsCount}</div>
            <div className="text-slate-400 text-xs mt-1">Total sessions</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Total Students</span>
              <span className="text-purple-400 text-2xl">👥</span>
            </div>
            <div className="text-white text-3xl font-bold">{totalStudents}</div>
            <div className="text-slate-400 text-xs mt-1">Unique students</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-2xl p-6 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Today's Earnings</span>
              <span className="text-amber-400 text-2xl">💰</span>
            </div>
            <div className="text-white text-3xl font-bold">${todayEarnings.toFixed(2)}</div>
            <div className="text-slate-400 text-xs mt-1">From completed sessions</div>
          </div>
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl p-6 border border-teal-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">This Month</span>
              <span className="text-teal-400 text-2xl">📊</span>
            </div>
            <div className="text-white text-3xl font-bold">${monthEarnings.toFixed(2)}</div>
            <div className="text-slate-400 text-xs mt-1">Total earnings</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl p-6 border border-indigo-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Rating</span>
              <span className="text-indigo-400 text-2xl">⭐</span>
            </div>
            <div className="text-white text-3xl font-bold">{rating.toFixed(1)}</div>
            <div className="text-slate-400 text-xs mt-1">{totalReviews} reviews</div>
          </div>
        </div>

        {/* Pending Booking Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl p-6 border border-orange-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                <span className="text-orange-400">🔔</span>
                <span>New Booking Requests</span>
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              </h3>
            </div>

            <div className="space-y-4">
              {requestsLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <p className="text-slate-400 mt-2">Loading requests...</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="p-4 rounded-xl bg-slate-800/50 border border-orange-500/20 hover:bg-slate-800/70 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
                          <span className="text-orange-400 text-sm font-medium">
                            {request.studentName ? request.studentName.split(' ').map(n => n[0]).join('') : 'S'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{request.subject || 'Session Request'}</h4>
                          <p className="text-slate-400 text-sm">
                            from {request.studentName || 'Student'} • {new Date(request.booking_date || request.date).toLocaleDateString()} at {request.start_time || request.startTime}
                          </p>
                          {request.notes && (
                            <p className="text-slate-300 text-sm mt-1 italic">"{request.notes}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSessionDetails({
                              id: request.id,
                              subject: request.subject || 'Session Request',
                              studentName: request.studentName || 'Student',
                              studentEmail: request.studentEmail,
                              date: request.date,
                              time: request.startTime,
                              duration: (request.duration || 1) * 60, // Convert hours to minutes
                              topic: 'Booking Request',
                              notes: request.notes,
                              status: 'pending',
                              meetingType: request.meetingType,
                              location: request.location
                            });
                            setShowSessionDetails(true);
                          }}
                          className="px-3 py-1 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tasks Overview */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
              <span className="text-amber-400">📋</span>
              <span>Pending Tasks</span>
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
              {tasks.filter(t => t.status !== 'completed').slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="text-white font-medium">{task.title}</div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm">{task.description}</div>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
                      <span>📚 {task.subject}</span>
                      <span>⏱️ {task.estimatedTime}</span>
                      <span>📅 Due: {new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">Progress</div>
                      <div className="text-sm font-medium text-blue-400">{task.progress || 0}%</div>
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
              <h4 className="text-white font-medium mb-2">All caught up!</h4>
              <p className="text-slate-400 text-sm">No pending tasks at the moment</p>
            </div>
          )}
        </div>

        {/* Today's Sessions */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              <span>Today's Sessions</span>
            </h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExportTutorSessions('ical')}
                disabled={isExporting}
                className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 text-sm"
              >
                {isExporting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    <span>Export</span>
                  </>
                )}
              </button>
              <span className="text-slate-400 text-sm">
                All today's sessions shown below
              </span>
            </div>
          </div>

          {/* Booking Notifications - Temporarily disabled to fix JSON parsing errors */}
          {/* {authUser?.role === 'tutor' && (
          <BookingNotifications 
            onNotificationUpdate={(count) => setNotificationCount(count)}
          />
        )} */}

          <div className="space-y-4">
            {realSessions.length > 0 ? (
              // Show real today's sessions from database
              realSessions.filter(s => {
                const sessionDate = s.date.includes('T') ? s.date.split('T')[0] : s.date;
                return sessionDate === new Date().toISOString().split('T')[0];
              }).length > 0 ? (
                realSessions.filter(s => {
                  const sessionDate = s.date.includes('T') ? s.date.split('T')[0] : s.date;
                  return sessionDate === new Date().toISOString().split('T')[0];
                }).map((session) => (
                  <div key={session.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                          <span className="text-blue-400 text-sm font-medium">
                            {session.student ? session.student.split(' ').map(n => n[0]).join('') : session.studentName ? session.studentName.split(' ').map(n => n[0]).join('') : 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{session.subject || 'Session'}</h4>
                          <p className="text-slate-400 text-sm">with {session.student || session.studentName || 'Student'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-white font-medium">{formatTime(session.time)}</div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                        {session.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancelSession(session)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                  <p className="text-slate-400">No sessions scheduled for today</p>
                </div>
              )
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                <p className="text-slate-400">No sessions found</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              <span>Recent Students</span>
            </h3>
            <Link to="/students" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tutorData.recentStudents.slice(0, 4).map((student) => (
              <div key={student.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                    <span className="text-emerald-400 text-sm font-medium">
                      {student.name ? student.name.split(' ').map(n => n[0]).join('') : 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm">{student.name}</h4>
                    <p className="text-slate-400 text-xs">{student.subject}</p>
                    <p className="text-slate-500 text-xs">Progress: {student.progress}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEarningsContent = () => {
    // Show loading state
    if (earningsLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading earnings data...</p>
          </div>
        </div>
      );
    }

    // Use real earnings data from API
    const totalEarnings = earningsData?.summary?.totalEarnings || 0;
    const thisMonthEarnings = earningsData?.summary?.thisMonthEarnings || 0;
    const thisWeekEarnings = earningsData?.summary?.thisWeekEarnings || 0;
    const todayEarnings = earningsData?.summary?.todayEarnings || 0;
    const completedSessionsCount = earningsData?.summary?.completedSessionsCount || 0;
    const averagePerSession = earningsData?.summary?.averagePerSession || 0;
    const hourlyRate = earningsData?.profile?.hourlyRate || 0;
    const earningsByDate = earningsData?.earningsByDate || [];
    const earningsBySubject = earningsData?.earningsBySubject || [];
    const recentSessions = earningsData?.recentSessions || [];

    return (
      <div className="grid grid-cols-1 gap-8">
        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/30">
            <div className="text-2xl font-bold text-white mb-1">${totalEarnings.toFixed(2)}</div>
            <div className="text-slate-400 text-sm">Total Earnings</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-6 border border-emerald-500/30">
            <div className="text-2xl font-bold text-white mb-1">${thisMonthEarnings.toFixed(2)}</div>
            <div className="text-slate-400 text-sm">This Month</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
            <div className="text-2xl font-bold text-white mb-1">${thisWeekEarnings.toFixed(2)}</div>
            <div className="text-slate-400 text-sm">This Week</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-500/30">
            <div className="text-2xl font-bold text-white mb-1">${todayEarnings.toFixed(2)}</div>
            <div className="text-slate-400 text-sm">Today</div>
          </div>
        </div>

        {/* Recent Earnings */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-2 mb-6">
            <span className="text-emerald-400">💰</span>
            <span>Recent Earnings</span>
          </h3>

          {earningsByDate.length > 0 ? (
            <div className="space-y-3">
              {earningsByDate.slice(0, 10).map((dayData) => (
                <div key={dayData.date} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                  <div>
                    <div className="text-white font-medium">
                      {new Date(dayData.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {dayData.sessionCount} session{dayData.sessionCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ${dayData.totalAmount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-500 text-6xl mb-4">💸</div>
              <p className="text-slate-400">No completed sessions yet</p>
              <p className="text-slate-500 text-sm mt-2">Complete sessions to start earning</p>
            </div>
          )}
        </div>

        {/* Earnings Summary */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-2xl p-6 border border-emerald-500/20">
          <h3 className="text-xl font-semibold text-white mb-4">📊 Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">{completedSessionsCount}</div>
              <div className="text-slate-400 text-sm">Sessions Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-1">
                ${averagePerSession.toFixed(2)}
              </div>
              <div className="text-slate-400 text-sm">Avg per Session</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">${hourlyRate.toFixed(2)}/hr</div>
              <div className="text-slate-400 text-sm">Hourly Rate</div>
            </div>
          </div>
        </div>

        {/* Earnings by Subject */}
        {earningsBySubject.length > 0 && (
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white flex items-center space-x-2 mb-6">
              <span className="text-blue-400">📚</span>
              <span>Earnings by Subject</span>
            </h3>
            <div className="space-y-3">
              {earningsBySubject.map((subjectData) => (
                <div key={subjectData.subject} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-white font-medium">{subjectData.subject}</div>
                    <div className="text-slate-400 text-sm">
                      {subjectData.sessionCount} session{subjectData.sessionCount !== 1 ? 's' : ''} • Avg: ${subjectData.averageAmount.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-blue-400">
                    ${subjectData.totalAmount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white flex items-center space-x-2 mb-6">
              <span className="text-purple-400">🎓</span>
              <span>Recent Completed Sessions</span>
            </h3>
            <div className="space-y-3">
              {recentSessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                  <div className="flex-1">
                    <div className="text-white font-medium">{session.subject}</div>
                    <div className="text-slate-400 text-sm">
                      {session.studentName} • {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {session.duration} min
                    </div>
                    {session.reviewRating && (
                      <div className="flex items-center space-x-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-3 h-3 ${i < session.reviewRating ? 'text-amber-400' : 'text-slate-600'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-lg font-bold text-emerald-400">
                    ${session.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sessions':
        return renderSessionsContent();
      case 'earnings':
        return renderEarningsContent();
      case 'tasks':
        return renderTasksContent();
      default:
        return renderOverviewContent();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-16">
      {/* Success Message */}
      {actionSuccess && (() => {
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
      })()}

      <div className="flex min-h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Greetings, {authUser?.profile?.fullName || authUser?.full_name || authUser?.name || authUser?.username || 'Tutor'}!
              </h1>
              <p className="text-slate-400 text-lg">Ready to inspire students today? Here's your teaching overview.</p>
            </div>

            {/* Profile Completion Alert */}
            <ProfileCompletionAlert />

            {/* Content Based on Active Tab */}
            {renderTabContent()}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-slate-900/30 backdrop-blur-sm border-l border-slate-800/50 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Navigation Tabs */}
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Tutor Dashboard</h3>
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

            {/* Simplified Actions */}
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Actions</h3>
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
                    <Link key={action.id} to={action.to} className={`${baseStyles} block`}>{content}</Link>
                  ) : (
                    <button key={action.id} onClick={action.onClick} className={`${baseStyles} text-left`}>
                      {content}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-4 border border-blue-500/20">
              <h3 className="text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">
                <span>Today's Sessions</span>
              </h3>

              <div className="space-y-3">
                {tutorData.todaySessions.slice(0, 2).map((session) => (
                  <div key={session.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-white text-xs font-medium line-clamp-2">{session.subject}</div>
                      <div className="text-blue-400 text-xs font-medium">{formatTime(session.time)}</div>
                    </div>
                    <div className="text-slate-400 text-xs mb-1">with {session.student}</div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StudentsModal />
      <AnalyticsModal />

      {/* Cancel Session Modal */}
      <Modal isOpen={showCancelSessionModal} onClose={() => setShowCancelSessionModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Cancel Session</h2>

          {selectedSession && (
            <div className="mb-6">
              <div className="text-white font-medium">{selectedSession.subject}</div>
              <div className="text-slate-400 text-sm">with {selectedSession.student}</div>
              <div className="text-slate-500 text-sm mt-1">
                Scheduled: {formatTime(selectedSession.time)}
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
                  This action cannot be undone. The student will be notified of the cancellation.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Cancellation</label>
            <textarea
              rows="3"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none focus:outline-none focus:border-blue-500"
              placeholder="Optional: Explain why you need to cancel"
              disabled={loading}
            />
          </div>

          <div className="flex space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCancelSessionModal(false);
                setCancelReason('');
              }}
              className="flex-1"
              disabled={loading}
            >
              Keep Session
            </Button>
            <Button
              onClick={confirmCancelSession}
              className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                  Cancelling...
                </>
              ) : (
                'Cancel Session'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <SessionDetailsModal />
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setNewTask({
            title: '',
            description: '',
            subject: '',
            priority: 'medium',
            estimatedTime: '',
            due: ''
          });
          setErrors({});
        }}
        isEdit={false}
        newTask={newTask}
        setNewTask={setNewTask}
        errors={errors}
        loading={loading}
        subjects={subjects}
        handleEditTask={handleEditTask}
        handleAddTask={handleAddTask}
      />
      <TaskModal
        isOpen={showEditTaskModal}
        onClose={() => {
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
        }}
        isEdit={true}
        newTask={newTask}
        setNewTask={setNewTask}
        errors={errors}
        loading={loading}
        subjects={subjects}
        handleEditTask={handleEditTask}
        handleAddTask={handleAddTask}
      />
      <SuccessNotification />
    </div>
  );
};

export default TutorDashboard;