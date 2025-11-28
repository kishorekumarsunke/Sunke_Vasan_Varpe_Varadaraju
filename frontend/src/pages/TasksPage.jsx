import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { subjectService } from '../services/subjectService';
import { Plus, Edit3, Trash2, Calendar, Clock, AlertCircle, CheckCircle2, PlayCircle, MoreHorizontal } from 'lucide-react';

const TasksPage = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('due_date');
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        subject: '',
        priority: 'medium',
        estimatedTime: '',
        dueDate: '',
        status: 'pending',
        progress: 0
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchTasks();
        fetchSubjects();
    }, []);

    useEffect(() => {
        filterAndSortTasks();
    }, [tasks, filter, sortBy, searchTerm]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await taskService.getTasks();
            if (response.success) {
                setTasks(response.data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await subjectService.getSubjects();
            if (response.success) {
                setSubjects(response.data);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
            // Fallback to default subjects if API fails
            setSubjects([
                { name: 'Mathematics' }, { name: 'Physics' }, { name: 'Chemistry' },
                { name: 'Biology' }, { name: 'Computer Science' }, { name: 'English' },
                { name: 'History' }, { name: 'Other' }
            ]);
        }
    };

    const filterAndSortTasks = () => {
        let filtered = [...tasks];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        if (filter !== 'all') {
            filtered = filtered.filter(task => task.status === filter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'due_date':
                    return new Date(a.due_date) - new Date(b.due_date);
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'created_at':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'progress':
                    return b.progress - a.progress;
                default:
                    return 0;
            }
        });

        setFilteredTasks(filtered);
    };

    const handleCreateTask = async () => {
        try {
            setErrors({});

            // Validation
            const newErrors = {};
            if (!taskForm.title.trim()) newErrors.title = 'Title is required';
            if (!taskForm.subject.trim()) newErrors.subject = 'Subject is required';
            if (!taskForm.dueDate) newErrors.dueDate = 'Due date is required';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            const response = await taskService.createTask({
                ...taskForm,
                due: taskForm.dueDate
            });

            if (response.success) {
                await fetchTasks();
                setShowTaskModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error creating task:', error);
            setErrors({ general: 'Failed to create task. Please try again.' });
        }
    };

    const handleUpdateTask = async () => {
        try {
            setErrors({});

            const response = await taskService.updateTask(editingTask.id, {
                ...taskForm,
                due: taskForm.dueDate
            });

            if (response.success) {
                await fetchTasks();
                setShowTaskModal(false);
                setEditingTask(null);
                resetForm();
            }
        } catch (error) {
            console.error('Error updating task:', error);
            setErrors({ general: 'Failed to update task. Please try again.' });
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            const response = await taskService.deleteTask(taskId);
            if (response.success) {
                await fetchTasks();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleQuickStatusUpdate = async (taskId, newStatus, newProgress = null) => {
        try {
            const updates = { status: newStatus };
            if (newProgress !== null) {
                updates.progress = newProgress;
            }

            const response = await taskService.updateTask(taskId, updates);
            if (response.success) {
                await fetchTasks();
            }
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const handleProgressUpdate = async (taskId, progress) => {
        try {
            const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'pending';
            const response = await taskService.updateTask(taskId, { progress, status });
            if (response.success) {
                await fetchTasks();
            }
        } catch (error) {
            console.error('Error updating task progress:', error);
        }
    };

    const openTaskModal = (task = null) => {
        if (task) {
            setEditingTask(task);
            setTaskForm({
                title: task.title,
                description: task.description || '',
                subject: task.subject,
                priority: task.priority,
                estimatedTime: task.estimated_time || '',
                dueDate: task.due_date,
                status: task.status,
                progress: task.progress
            });
        } else {
            setEditingTask(null);
            resetForm();
        }
        setShowTaskModal(true);
        setErrors({});
    };

    const resetForm = () => {
        setTaskForm({
            title: '',
            description: '',
            subject: '',
            priority: 'medium',
            estimatedTime: '',
            dueDate: '',
            status: 'pending',
            progress: 0
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-400 bg-red-500/20';
            case 'medium': return 'text-yellow-400 bg-yellow-500/20';
            case 'low': return 'text-green-400 bg-green-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-400 bg-green-500/20';
            case 'in-progress': return 'text-blue-400 bg-blue-500/20';
            case 'started': return 'text-yellow-400 bg-yellow-500/20';
            case 'pending': return 'text-gray-400 bg-gray-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-4 h-4" />;
            case 'in-progress': return <PlayCircle className="w-4 h-4" />;
            case 'started': return <PlayCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
    };

    const getTaskStats = () => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress' || t.status === 'started').length;
        const overdue = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length;

        return { total, completed, inProgress, overdue };
    };

    const stats = getTaskStats();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white text-lg">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            📋 Tasks
                        </h1>
                        <p className="text-slate-400 text-lg">Manage your academic tasks and track progress</p>
                    </div>
                    <button
                        onClick={() => openTaskModal()}
                        className="mt-4 md:mt-0 flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Task</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
                        <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
                        <div className="text-slate-400 text-sm">Total Tasks</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
                        <div className="text-2xl font-bold text-green-400 mb-1">{stats.completed}</div>
                        <div className="text-slate-400 text-sm">Completed</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
                        <div className="text-2xl font-bold text-blue-400 mb-1">{stats.inProgress}</div>
                        <div className="text-slate-400 text-sm">In Progress</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
                        <div className="text-2xl font-bold text-red-400 mb-1">{stats.overdue}</div>
                        <div className="text-slate-400 text-sm">Overdue</div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="started">Started</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="due_date">Due Date</option>
                            <option value="priority">Priority</option>
                            <option value="created_at">Created Date</option>
                            <option value="progress">Progress</option>
                        </select>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                    {filteredTasks.length === 0 ? (
                        <div className="bg-slate-900/50 rounded-xl p-12 text-center border border-slate-800/50">
                            <div className="text-slate-400 text-lg mb-4">No tasks found</div>
                            <button
                                onClick={() => openTaskModal()}
                                className="text-blue-400 hover:text-blue-300 font-medium"
                            >
                                Create your first task
                            </button>
                        </div>
                    ) : (
                        filteredTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={() => openTaskModal(task)}
                                onDelete={() => handleDeleteTask(task.id)}
                                onStatusUpdate={handleQuickStatusUpdate}
                                onProgressUpdate={handleProgressUpdate}
                                getPriorityColor={getPriorityColor}
                                getStatusColor={getStatusColor}
                                getStatusIcon={getStatusIcon}
                                isOverdue={isOverdue}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Task Modal */}
            {showTaskModal && (
                <TaskModal
                    isOpen={showTaskModal}
                    onClose={() => {
                        setShowTaskModal(false);
                        setEditingTask(null);
                        resetForm();
                    }}
                    taskForm={taskForm}
                    setTaskForm={setTaskForm}
                    errors={errors}
                    isEditing={!!editingTask}
                    onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                    subjects={subjects.map(subject => subject.name)}
                />
            )}
        </div>
    );
};

// Task Card Component
const TaskCard = ({
    task,
    onEdit,
    onDelete,
    onStatusUpdate,
    onProgressUpdate,
    getPriorityColor,
    getStatusColor,
    getStatusIcon,
    isOverdue
}) => {
    const [showProgress, setShowProgress] = useState(false);
    const [tempProgress, setTempProgress] = useState(task.progress);

    const handleProgressChange = (e) => {
        const progress = parseInt(e.target.value);
        setTempProgress(progress);
        onProgressUpdate(task.id, progress);
    };

    const dueDateFormatted = new Date(task.due_date).toLocaleDateString();
    const isTaskOverdue = isOverdue(task.due_date);

    return (
        <div className={`bg-slate-900/50 rounded-xl p-6 border transition-all duration-200 hover:bg-slate-900/70 ${isTaskOverdue ? 'border-red-500/50' : 'border-slate-800/50'
            }`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold text-lg">{task.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {task.status}
                        </span>
                    </div>
                    {task.description && (
                        <p className="text-slate-400 mb-3">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span className={isTaskOverdue ? 'text-red-400' : ''}>
                                {dueDateFormatted}
                                {isTaskOverdue && ' (Overdue)'}
                            </span>
                        </span>
                        <span>📚 {task.subject}</span>
                        {task.estimated_time && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {task.estimated_time}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowProgress(!showProgress)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        title="Toggle progress"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                        title="Edit task"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete task"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Progress</span>
                    <span className="text-white font-medium">{task.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                    />
                </div>
                {showProgress && (
                    <div className="pt-2">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={tempProgress}
                            onChange={handleProgressChange}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
                {task.status === 'pending' && (
                    <button
                        onClick={() => onStatusUpdate(task.id, 'started', Math.max(1, task.progress))}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                    >
                        Start Task
                    </button>
                )}
                {(task.status === 'started' || task.status === 'in-progress') && task.progress < 100 && (
                    <button
                        onClick={() => onStatusUpdate(task.id, 'completed', 100)}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                    >
                        Mark Complete
                    </button>
                )}
                {task.status === 'completed' && (
                    <button
                        onClick={() => onStatusUpdate(task.id, 'in-progress', Math.min(99, task.progress))}
                        className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors"
                    >
                        Reopen Task
                    </button>
                )}
            </div>
        </div>
    );
};

// Task Modal Component
const TaskModal = ({ isOpen, onClose, taskForm, setTaskForm, errors, isEditing, onSubmit, subjects = [] }) => {
    if (!isOpen) return null;

    const handleInputChange = (field, value) => {
        setTaskForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {isEditing ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {errors.general && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                        <p className="text-red-400 text-sm">{errors.general}</p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                        <input
                            type="text"
                            value={taskForm.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.title ? 'border-red-500' : 'border-slate-700'
                                }`}
                            placeholder="Enter task title"
                        />
                        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <textarea
                            value={taskForm.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            placeholder="Enter task description"
                            rows="3"
                        />
                    </div>

                    {/* Subject and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Subject *</label>
                            <select
                                value={taskForm.subject}
                                onChange={(e) => handleInputChange('subject', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.subject ? 'border-red-500' : 'border-slate-700'
                                    }`}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(subject => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                            {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                            <select
                                value={taskForm.priority}
                                onChange={(e) => handleInputChange('priority', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Estimated Time and Due Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Time</label>
                            <input
                                type="text"
                                value={taskForm.estimatedTime}
                                onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                placeholder="e.g. 2 hours, 30 minutes"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Due Date *</label>
                            <input
                                type="date"
                                value={taskForm.dueDate}
                                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:border-blue-500 ${errors.dueDate ? 'border-red-500' : 'border-slate-700'
                                    }`}
                            />
                            {errors.dueDate && <p className="text-red-400 text-xs mt-1">{errors.dueDate}</p>}
                        </div>
                    </div>

                    {/* Status and Progress (only for editing) */}
                    {isEditing && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                                <select
                                    value={taskForm.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="started">Started</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Progress (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={taskForm.progress}
                                    onChange={(e) => handleInputChange('progress', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-8">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200"
                    >
                        {isEditing ? 'Update Task' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TasksPage;