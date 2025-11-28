import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subjectService } from '../services/subjectService';

const TutorProfilePage = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]);

    const [formData, setFormData] = useState({
        // Account fields
        full_name: '',
        email: '',
        phone_number: '',
        bio: '',
        location_city: '',
        location_state: '',
        // Tutor profile fields
        hourly_rate: '',
        subjects_taught: [],
        available_days: [],
        response_time_avg: '',
        is_online: false,
        // Read-only analytics
        rating: null,
        total_reviews: 0,
        total_sessions: 0
    });

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        fetchProfile();
        fetchSubjects();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            console.log('🔑 Fetching tutor profile with token:', token ? 'Token exists' : 'No token');

            const response = await fetch('http://localhost:5000/api/profiles/tutor', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);
            const result = await response.json();
            console.log('📦 Response data:', result);

            if (response.ok && result.success) {
                const data = result.data;
                setFormData({
                    full_name: data.full_name || '',
                    email: data.email || '',
                    phone_number: data.phone_number || '',
                    bio: data.bio || data.account_bio || '',
                    location_city: data.location_city || '',
                    location_state: data.location_state || '',
                    hourly_rate: data.hourly_rate || '',
                    subjects_taught: Array.isArray(data.subjects_taught) ? data.subjects_taught : [],
                    available_days: Array.isArray(data.available_days) ? data.available_days : [],
                    response_time_avg: data.response_time_avg || '',
                    is_online: data.is_online || false,
                    rating: data.rating,
                    total_reviews: data.total_reviews || 0,
                    total_sessions: data.total_sessions || 0
                });

                setSelectedSubjects(Array.isArray(data.subjects_taught) ? data.subjects_taught : []);
                setSelectedDays(Array.isArray(data.available_days) ? data.available_days : []);
            } else {
                setError(result.message || 'Failed to load profile');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
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
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const payload = {
                full_name: formData.full_name,
                phone_number: formData.phone_number,
                bio: formData.bio,
                location_city: formData.location_city,
                location_state: formData.location_state,
                hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
                subjects_taught: selectedSubjects,
                available_days: selectedDays,
                response_time_avg: formData.response_time_avg ? parseInt(formData.response_time_avg) : null,
                is_online: formData.is_online
            };

            const response = await fetch('http://localhost:5000/api/profiles/tutor', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSuccess('Profile updated successfully!');
                setIsEditing(false);
                fetchProfile();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(result.message || 'Failed to save profile');
            }
        } catch (err) {
            console.error('Error saving profile:', err);
            setError('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchProfile();
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Tutor Profile</h1>
                    <p className="text-slate-400">Manage your tutoring information</p>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
                        <p className="text-green-400 text-sm">{success}</p>
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-8">
                    {/* Profile Header */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700/50">
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                {formData.full_name ? formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{formData.full_name || 'No Name'}</h2>
                                <p className="text-slate-400">{formData.email}</p>
                                <span className="inline-block px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm mt-1">
                                    Tutor
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${isEditing
                                ? 'bg-slate-700 text-white hover:bg-slate-600'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>

                    {/* Basic Information */}
                    <div className="space-y-6 mb-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                                    placeholder="Enter your full name"
                                />
                            ) : (
                                <p className="text-white">{formData.full_name || 'Not set'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <p className="text-white">{formData.email}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.phone_number}
                                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                                    placeholder="Enter your phone number"
                                />
                            ) : (
                                <p className="text-white">{formData.phone_number || 'Not set'}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.location_city}
                                        onChange={(e) => handleInputChange('location_city', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                                        placeholder="Enter your city"
                                    />
                                ) : (
                                    <p className="text-white">{formData.location_city || 'Not set'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.location_state}
                                        onChange={(e) => handleInputChange('location_state', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                                        placeholder="Enter your state"
                                    />
                                ) : (
                                    <p className="text-white">{formData.location_state || 'Not set'}</p>
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
                                    placeholder="Tell students about yourself..."
                                />
                            ) : (
                                <p className="text-white leading-relaxed">{formData.bio || 'Not set'}</p>
                            )}
                        </div>
                    </div>

                    {/* Tutoring Information */}
                    <div className="border-t border-slate-700/50 pt-8 space-y-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Tutoring Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Hourly Rate ($)</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.hourly_rate}
                                        onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                                        placeholder="35.00"
                                    />
                                ) : (
                                    <p className="text-white">${formData.hourly_rate || 'Not set'}/hour</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Avg Response Time (minutes)</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.response_time_avg}
                                        onChange={(e) => handleInputChange('response_time_avg', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                                        placeholder="15"
                                    />
                                ) : (
                                    <p className="text-white">{formData.response_time_avg ? `${formData.response_time_avg} minutes` : 'Not tracked'}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Subjects Taught</label>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                        {subjects.map(subject => (
                                            <label key={subject.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-700/30 p-2 rounded">
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
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSubjects.map(subject => (
                                                <span key={subject} className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/30">
                                                    {subject}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {formData.subjects_taught.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.subjects_taught.map(subject => (
                                                <span key={subject} className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full text-sm">
                                                    {subject}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400">No subjects selected</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Available Days <span className="text-slate-500 text-xs">(Classes available 9 AM - 5 PM)</span>
                            </label>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {weekDays.map(day => (
                                            <label
                                                key={day}
                                                className={`flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-lg border transition-all ${selectedDays.includes(day)
                                                    ? 'bg-green-600/20 border-green-500/50 text-green-400'
                                                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDays.includes(day)}
                                                    onChange={() => handleDayToggle(day)}
                                                    className="sr-only"
                                                />
                                                <span className="text-sm font-medium">{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {selectedDays.length > 0 && (
                                        <p className="text-xs text-slate-400">
                                            Students can book sessions on {selectedDays.join(', ')} between 9:00 AM - 5:00 PM
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {formData.available_days.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                {formData.available_days.map(day => (
                                                    <span key={day} className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/30">
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

                        <div className="flex items-center space-x-6">
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

                    {/* Analytics - Read Only */}
                    <div className="border-t border-slate-700/50 pt-8 mt-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Analytics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-800/30 p-4 rounded-lg text-center">
                                <div className="text-3xl font-bold text-white mb-1">
                                    {formData.rating ? `⭐ ${Number(formData.rating).toFixed(1)}` : 'N/A'}
                                </div>
                                <div className="text-sm text-slate-400">Rating</div>
                            </div>
                            <div className="bg-slate-800/30 p-4 rounded-lg text-center">
                                <div className="text-3xl font-bold text-white mb-1">
                                    {formData.total_reviews}
                                </div>
                                <div className="text-sm text-slate-400">Total Reviews</div>
                            </div>
                            <div className="bg-slate-800/30 p-4 rounded-lg text-center">
                                <div className="text-3xl font-bold text-white mb-1">
                                    {formData.total_sessions}
                                </div>
                                <div className="text-sm text-slate-400">Sessions Completed</div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    {isEditing && (
                        <div className="flex justify-center space-x-4 mt-8 pt-6 border-t border-slate-700/50">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {saving ? (
                                    <span className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </span>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="px-8 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TutorProfilePage;
