import React, { useState, useEffect } from 'react';
import { Container, Button, Card, Input } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { subjectService } from '../services/subjectService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ProfilePage = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]);

    // Initialize empty form data - only database fields
    const [formData, setFormData] = useState({
        // From accounts table
        full_name: '',
        email: '',
        phone_number: '',
        bio: '',
        location_city: '',
        location_state: '',
        profile_image: '',
        // From tutor_profiles table (editable)
        hourly_rate: '',
        subjects_taught: [],
        available_days: [],
        response_time_avg: '',
        is_online: false,
        // Read-only analytics (not editable)
        rating: null,
        total_reviews: null,
        total_sessions: null,
        // Student-specific fields (from student_profiles)
        current_school: '',
        graduation_year: null,
        grade_level: '',
        subjects_of_interest: [],
        learning_goals: ''
    });

    // Fetch profile data from database
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const endpoint = user.role === 'student'
                    ? `${API_BASE_URL}/profiles/student`
                    : user.role === 'admin'
                    ? `${API_BASE_URL}/profiles/admin`
                    : `${API_BASE_URL}/profiles/tutor`;

                console.log('Fetching profile from:', endpoint);
                console.log('User object:', user);
                console.log('User role:', user.role);
                console.log('Token exists:', !!localStorage.getItem('token'));
                console.log('Token:', localStorage.getItem('token')?.substring(0, 50) + '...');

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Response status:', response.status);

                if (response.ok) {
                    const result = await response.json();
                    console.log('Profile data received:', result);

                    if (result.success) {
                        // Map database fields exactly as they exist
                        setFormData({
                            // From accounts table
                            full_name: result.data.full_name || '',
                            email: result.data.email || '',
                            phone_number: result.data.phone_number || '',
                            bio: result.data.bio || '',
                            location_city: result.data.location_city || '',
                            location_state: result.data.location_state || '',
                            profile_image: result.data.profile_image || '',
                            // From tutor_profiles table (editable)
                            hourly_rate: result.data.hourly_rate || '',
                            subjects_taught: Array.isArray(result.data.subjects_taught) ?
                                result.data.subjects_taught :
                                (result.data.subjects_taught ? result.data.subjects_taught.split(',').map(s => s.trim()) : []),
                            available_days: Array.isArray(result.data.available_days) ?
                                result.data.available_days :
                                (result.data.available_days ? result.data.available_days.split(',').map(d => d.trim()) : []),
                            response_time_avg: result.data.response_time_avg || '',
                            is_online: result.data.is_online || false,

                            // Read-only analytics (computed by system)
                            rating: result.data.rating,
                            total_reviews: result.data.total_reviews,
                            total_sessions: result.data.total_sessions,
                            // Student-specific fields
                            current_school: result.data.current_school || '',
                            graduation_year: result.data.graduation_year || null,
                            grade_level: result.data.grade_level || '',
                            subjects_of_interest: Array.isArray(result.data.subjects_of_interest) ?
                                result.data.subjects_of_interest :
                                (result.data.subjects_of_interest ? result.data.subjects_of_interest.split(',').map(s => s.trim()) : []),
                            learning_goals: result.data.learning_goals || ''
                        });

                        // Set selectedSubjects for the multi-select component
                        const subjectsArray = Array.isArray(result.data.subjects_taught) ?
                            result.data.subjects_taught :
                            (result.data.subjects_taught ? result.data.subjects_taught.split(',').map(s => s.trim()) : []);
                        setSelectedSubjects(subjectsArray);

                        // Set selectedDays for the day selector component
                        const daysArray = Array.isArray(result.data.available_days) ?
                            result.data.available_days :
                            (result.data.available_days ? result.data.available_days.split(',').map(d => d.trim()) : []);
                        setSelectedDays(daysArray);

                        // For students: Set subjects_of_interest for multi-select
                        if (user?.role === 'student') {
                            const studentSubjects = Array.isArray(result.data.subjects_of_interest) ?
                                result.data.subjects_of_interest :
                                (result.data.subjects_of_interest ? result.data.subjects_of_interest.split(',').map(s => s.trim()) : []);
                            setSelectedSubjects(studentSubjects);
                        }

                        setError(null); // Clear any previous errors
                    } else {
                        setError(result.message || 'Failed to load profile data');
                    }
                } else {
                    const errorResult = await response.json().catch(() => ({}));
                    console.error('Failed to fetch profile:', response.statusText, errorResult);
                    setError(errorResult.message || `Failed to load profile data (${response.status})`);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Error loading profile data');
                // Set default values on error
                setFormData(prev => ({
                    ...prev,
                    name: user?.name || '',
                    email: user?.email || ''
                }));
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
        fetchSubjects();
    }, [user]);

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
                { id: '1', name: 'Mathematics', category: 'academic' },
                { id: '2', name: 'Physics', category: 'academic' },
                { id: '3', name: 'Chemistry', category: 'academic' },
                { id: '4', name: 'Computer Science', category: 'academic' },
                { id: '5', name: 'Biology', category: 'academic' },
                { id: '6', name: 'English', category: 'academic' },
                { id: '7', name: 'History', category: 'academic' },
                { id: '8', name: 'Economics', category: 'academic' }
            ]);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubjectToggle = (subjectName) => {
        setSelectedSubjects(prev => {
            if (prev.includes(subjectName)) {
                return prev.filter(s => s !== subjectName);
            } else {
                return [...prev, subjectName];
            }
        });
    };

    const handleDayToggle = (day) => {
        setSelectedDays(prev => {
            if (prev.includes(day)) {
                return prev.filter(d => d !== day);
            } else {
                return [...prev, day];
            }
        });
    };

    const handleSave = async () => {
        if (!user) return;

        try {
            setSaving(true);
            setError(null);

            const endpoint = user.role === 'student'
                ? `${API_BASE_URL}/profiles/student`
                : user.role === 'admin'
                ? `${API_BASE_URL}/profiles/admin`
                : `${API_BASE_URL}/profiles/tutor`;

            // Prepare data with exact database field names
            const profileData = {
                // Accounts table fields
                full_name: formData.full_name,
                phone_number: formData.phone_number,
                bio: formData.bio,
                location_city: formData.location_city,
                location_state: formData.location_state,
                profile_image: formData.profile_image,

                // Tutor-specific fields (tutor_profiles table)
                ...(user.role === 'tutor' && {
                    hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
                    subjects_taught: selectedSubjects,
                    available_days: selectedDays,
                    response_time_avg: formData.response_time_avg ? parseFloat(formData.response_time_avg) : null,
                    is_online: formData.is_online,

                }),

                // Student-specific fields (student_profiles table)
                ...(user.role === 'student' && {
                    current_school: formData.current_school,
                    graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
                    grade_level: formData.grade_level,
                    subjects_of_interest: selectedSubjects,
                    learning_goals: formData.learning_goals
                })
            }; const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setIsEditing(false);
                setError(null);
                console.log('Profile saved successfully:', result.data);
            } else {
                setError(result.message || `Failed to save profile (${response.status})`);
                console.error('Save error:', result);
            }
        } catch (err) {
            setError('Error saving profile');
            console.error('Error saving profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reload profile data to reset any changes
        if (user?.id) {
            window.location.reload();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
            <Container className="py-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
                        <p className="text-slate-400">Manage your {user?.role || 'account'} information</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Profile Card */}
                    <Card className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {formData.full_name ? formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : (formData.email ? formData.email[0].toUpperCase() : '?')}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{formData.full_name || formData.email || 'No Name'}</h2>
                                    <p className="text-slate-400">{formData.email}</p>
                                    <span className="inline-block px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm capitalize mt-1">
                                        {user?.role}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant={isEditing ? "secondary" : "primary"}
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? 'Cancel' : 'Edit'}
                            </Button>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                {isEditing ? (
                                    <Input
                                        value={formData.full_name}
                                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                                        placeholder="Enter your full name"
                                    />
                                ) : (
                                    <p className="text-white">{formData.full_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                {isEditing ? (
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="Enter your email"
                                    />
                                ) : (
                                    <p className="text-white">{formData.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                                {isEditing ? (
                                    <Input
                                        value={formData.phone_number}
                                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                        placeholder="Enter your phone number"
                                    />
                                ) : (
                                    <p className="text-white">{formData.phone_number}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.location_city}
                                            onChange={(e) => handleInputChange('location_city', e.target.value)}
                                            placeholder="Enter your city"
                                        />
                                    ) : (
                                        <p className="text-white">{formData.location_city}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.location_state}
                                            onChange={(e) => handleInputChange('location_state', e.target.value)}
                                            placeholder="Enter your state"
                                        />
                                    ) : (
                                        <p className="text-white">{formData.location_state}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">About</label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => handleInputChange('bio', e.target.value)}
                                        className="w-full h-24 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                ) : (
                                    <p className="text-white leading-relaxed">{formData.bio}</p>
                                )}
                            </div>

                            {/* Student-specific fields */}
                            {user?.role === 'student' && (
                                <>
                                    <div className="border-t border-slate-700/50 pt-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">Student Information</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Current School</label>
                                                {isEditing ? (
                                                    <Input
                                                        value={formData.current_school}
                                                        onChange={(e) => handleInputChange('current_school', e.target.value)}
                                                        placeholder="Enter your school name"
                                                    />
                                                ) : (
                                                    <p className="text-white">{formData.current_school || 'Not specified'}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Grade Level</label>
                                                {isEditing ? (
                                                    <Input
                                                        value={formData.grade_level}
                                                        onChange={(e) => handleInputChange('grade_level', e.target.value)}
                                                        placeholder="e.g., 10th Grade, Sophomore"
                                                    />
                                                ) : (
                                                    <p className="text-white">{formData.grade_level || 'Not specified'}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Graduation Year</label>
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    min="2020"
                                                    max="2040"
                                                    value={formData.graduation_year || ''}
                                                    onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                                                    placeholder="2025"
                                                />
                                            ) : (
                                                <p className="text-white">{formData.graduation_year || 'Not specified'}</p>
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Subjects of Interest</label>
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-slate-800/50 p-3 rounded-md border border-slate-600">
                                                        {subjects.map(subject => (
                                                            <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedSubjects.includes(subject.name)}
                                                                    onChange={() => handleSubjectToggle(subject.name)}
                                                                    className="rounded border-slate-500 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm text-slate-300">{subject.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    {selectedSubjects.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {selectedSubjects.map(subject => (
                                                                <span key={subject} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                                                    {subject}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-white">
                                                    {Array.isArray(formData.subjects_of_interest) && formData.subjects_of_interest.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {formData.subjects_of_interest.map(subject => (
                                                                <span key={subject} className="bg-slate-600 text-white px-2 py-1 rounded text-sm">
                                                                    {subject}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p>Not specified</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Learning Goals</label>
                                            {isEditing ? (
                                                <textarea
                                                    value={formData.learning_goals}
                                                    onChange={(e) => handleInputChange('learning_goals', e.target.value)}
                                                    className="w-full h-24 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 resize-none"
                                                    placeholder="What would you like to achieve with tutoring?"
                                                />
                                            ) : (
                                                <p className="text-white leading-relaxed">{formData.learning_goals || 'Not specified'}</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Tutor-specific fields - complete */}
                            {user?.role === 'tutor' && (
                                <>
                                    <div className="border-t border-slate-700/50 pt-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">Tutor Information</h3>

                                        {/* Basic Tutor Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Hourly Rate ($)</label>
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.hourly_rate || ''}
                                                        onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                                                        placeholder="35.00"
                                                    />
                                                ) : (
                                                    <p className="text-white">${formData.hourly_rate || 'Not set'}/hour</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Subjects Taught</label>
                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-slate-800/50 p-3 rounded-md border border-slate-600">
                                                            {subjects.map(subject => (
                                                                <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedSubjects.includes(subject.name)}
                                                                        onChange={() => handleSubjectToggle(subject.name)}
                                                                        className="rounded border-slate-500 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-sm text-slate-300">{subject.name}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        {selectedSubjects.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {selectedSubjects.map(subject => (
                                                                    <span key={subject} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                                                        {subject}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-white">
                                                        {Array.isArray(formData.subjects_taught) && formData.subjects_taught.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {formData.subjects_taught.map(subject => (
                                                                    <span key={subject} className="bg-slate-600 text-white px-2 py-1 rounded text-sm">
                                                                        {subject}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p>Not specified</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Analytics - Read Only */}
                                        <div className="bg-slate-800/20 rounded-lg p-4 mb-6">
                                            <h4 className="text-md font-semibold text-slate-300 mb-3 flex items-center">
                                                Analytics
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                                    <div className="text-2xl font-bold text-white">
                                                        {formData.rating ? `⭐ ${Number(formData.rating).toFixed(1)}` : '⭐ N/A'}
                                                    </div>
                                                    <div className="text-sm text-slate-400 mt-1">Rating</div>
                                                </div>
                                                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                                    <div className="text-2xl font-bold text-white">
                                                        {formData.total_reviews || 0}
                                                    </div>
                                                    <div className="text-sm text-slate-400 mt-1">Total Reviews</div>
                                                </div>
                                                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                                    <div className="text-2xl font-bold text-white">
                                                        {formData.total_sessions || 0}
                                                    </div>
                                                    <div className="text-sm text-slate-400 mt-1">Sessions Completed</div>
                                                </div>
                                            </div>
                                        </div>                                        {/* Response Time and Status */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Avg Response Time (minutes)</label>
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={formData.response_time_avg || ''}
                                                        onChange={(e) => handleInputChange('response_time_avg', e.target.value)}
                                                        placeholder="15"
                                                    />
                                                ) : (
                                                    <p className="text-white">
                                                        {formData.response_time_avg ?
                                                            `${formData.response_time_avg} minutes` :
                                                            'Not tracked'
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center space-x-4">
                                                    <label className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.is_online}
                                                            onChange={(e) => handleInputChange('is_online', e.target.checked)}
                                                            disabled={!isEditing}
                                                            className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500 disabled:opacity-50"
                                                        />
                                                        <span className="text-sm font-medium text-slate-300">Currently Online</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Available Days */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Available Days</label>
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-3 rounded-md border border-slate-600">
                                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                            <label key={day} className="flex items-center space-x-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedDays.includes(day)}
                                                                    onChange={() => handleDayToggle(day)}
                                                                    className="rounded border-slate-500 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm text-slate-300">{day}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    {selectedDays.length > 0 && (
                                                        <div className="text-xs text-slate-400">
                                                            Default hours: 9:00 AM - 5:00 PM on selected days
                                                        </div>
                                                    )}
                                                    {selectedDays.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {selectedDays.map(day => (
                                                                <span key={day} className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                                                                    {day}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-white">
                                                    {Array.isArray(formData.available_days) && formData.available_days.length > 0 ? (
                                                        <div>
                                                            <div className="flex flex-wrap gap-1 mb-2">
                                                                {formData.available_days.map(day => (
                                                                    <span key={day} className="bg-slate-600 text-white px-2 py-1 rounded text-sm">
                                                                        {day}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <p className="text-xs text-slate-400">Available 9:00 AM - 5:00 PM on selected days</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-400">No availability set</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Save Button */}
                        {isEditing && (
                            <div className="flex justify-center space-x-4 mt-8">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                                <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </Container>
        </div>
    );
};

export default ProfilePage;