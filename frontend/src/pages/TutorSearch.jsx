import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { tutorService } from '../services/api.js';

const TutorSearch = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [priceRange, setPriceRange] = useState('all');
    const [availability, setAvailability] = useState('all');
    const [sortBy, setSortBy] = useState('rating');
    const [tutors, setTutors] = useState([]);
    const [subjects, setSubjects] = useState(['all']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    const loadTutors = async () => {
        setLoading(true);
        setError(null);
        try {
            const filters = {
                search: searchQuery,
                subject: selectedSubject !== 'all' ? selectedSubject : '',
                sortBy: sortBy
            };

            // Add price range filters
            if (priceRange !== 'all') {
                const [min, max] = priceRange.split('-');
                if (min && min !== '70+') filters.minPrice = min;
                if (max) filters.maxPrice = max;
                if (priceRange === '70+') filters.minPrice = 70;
            }

            // Fetch tutors from database
            const tutorData = await tutorService.getAllTutors(filters);
            console.log('✅ Loaded tutors from database:', tutorData);
            setTutors(tutorData);
        } catch (error) {
            console.error('Failed to load tutors:', error);
            setError('Failed to load tutors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadSubjects = async () => {
        try {
            const subjectData = await tutorService.getTutorSubjects();
            setSubjects(['all', ...subjectData]);
        } catch (error) {
            console.error('Failed to load subjects:', error);
            // Use default subjects on error
            setSubjects(['all', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Economics', 'English', 'Biology']);
        }
    };

    const priceRanges = [
        { value: 'all', label: 'All Prices' },
        { value: '0-30', label: '$0 - $30' },
        { value: '30-50', label: '$30 - $50' },
        { value: '50-70', label: '$50 - $70' },
        { value: '70+', label: '$70+' }
    ];

    // Handle message tutor navigation
    const handleMessageTutor = (tutor) => {
        // Navigate to messages page and set selected user
        navigate('/messages', {
            state: {
                selectedUser: {
                    id: tutor.id,
                    full_name: tutor.name,
                    email: tutor.email,
                    user_role: 'tutor',
                    username: tutor.username
                }
            }
        });
    };

    // Load data on component mount
    useEffect(() => {
        loadTutors();
        loadSubjects();
    }, []);

    // Reload tutors when filters change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadTutors();
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedSubject, priceRange, sortBy]);

    // Filtered tutors are now handled by the backend API
    const displayTutors = tutors;

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        <span>Find Your Perfect Tutor</span>
                    </h1>
                    <p className="text-slate-400 text-lg">Connect with expert tutors across all subjects</p>
                </div>

                {/* Search and Filters */}
                <div className="mb-8 bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search tutors or subjects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>

                        {/* Subject Filter */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                            >
                                {subjects.map(subject => (
                                    <option key={subject} value={subject}>
                                        {subject === 'all' ? 'All Subjects' : subject}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Price Filter */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Price Range</label>
                            <select
                                value={priceRange}
                                onChange={(e) => setPriceRange(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                            >
                                {priceRanges.map(range => (
                                    <option key={range.value} value={range.value}>
                                        {range.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                            >
                                <option value="rating">Highest Rated</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between mb-6">
                    <div className="text-slate-300">
                        {loading ? (
                            <span className="text-slate-400">Loading tutors...</span>
                        ) : error ? (
                            <span className="text-red-400">{error}</span>
                        ) : (
                            <span className="font-medium text-white">{displayTutors.length}</span>
                        )}
                        {!loading && !error && ' tutors found'}
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'list'
                                ? 'bg-slate-700/50 border border-slate-600/50 text-white'
                                : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                                }`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'grid'
                                ? 'bg-slate-700/50 border border-slate-600/50 text-white'
                                : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                                }`}
                        >
                            Grid
                        </button>
                    </div>
                </div>

                {/* Tutors Display */}
                {loading ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-6 animate-pulse">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-700"></div>
                                    <div>
                                        <div className="w-32 h-4 bg-slate-700 rounded mb-2"></div>
                                        <div className="w-24 h-3 bg-slate-700 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-full h-3 bg-slate-700 rounded"></div>
                                    <div className="w-3/4 h-3 bg-slate-700 rounded"></div>
                                    <div className="w-1/2 h-3 bg-slate-700 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayTutors.map((tutor) => (
                            <div key={tutor.id} className="bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-hidden hover:border-slate-700/50 transition-colors">
                                {/* Tutor Header */}
                                <div className="p-6 pb-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {tutor.avatar}
                                                </div>
                                                {tutor.online && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold">{tutor.name}</h3>
                                                <div className="flex items-center space-x-1 mb-1">
                                                    <span className="text-yellow-400">⭐</span>
                                                    <span className="text-white font-medium">{tutor.rating}</span>
                                                    <span className="text-slate-400 text-sm">({tutor.reviews} reviews)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white font-bold text-lg">${tutor.hourlyRate}</div>
                                            <div className="text-slate-400 text-sm">per hour</div>
                                        </div>
                                    </div>

                                    {/* Subjects */}
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            {tutor.subjects.slice(0, 3).map((subject, index) => (
                                                <span key={index} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                                                    {subject}
                                                </span>
                                            ))}
                                            {tutor.subjects.length > 3 && (
                                                <span className="px-3 py-1 bg-slate-700/50 border border-slate-600/50 rounded-full text-slate-300 text-sm">
                                                    +{tutor.subjects.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <p className="text-slate-300 text-sm mb-4 line-clamp-2">{tutor.bio}</p>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <div className="text-slate-400 text-xs">Total Bookings</div>
                                            <div className="text-white text-sm font-medium">{tutor.totalBookings || 0}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-400 text-xs">Response Time</div>
                                            <div className="text-white text-sm font-medium">{tutor.responseTime}</div>
                                        </div>
                                    </div>

                                    {/* Availability */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${tutor.online ? 'bg-emerald-400' : 'bg-slate-500'}`}></div>
                                            <span className="text-slate-300 text-sm">{tutor.availability}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            {tutor.languages.slice(0, 2).map((lang, index) => (
                                                <span key={index} className="px-2 py-1 bg-slate-800/50 rounded text-slate-300 text-xs">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Available Sessions Preview */}
                                    {tutor.availableSessions && tutor.availableSessions.length > 0 && (
                                        <div className="mb-4">
                                            <div className="text-slate-300 text-xs font-medium mb-2">Next Available Sessions</div>
                                            <div className="space-y-1">
                                                {tutor.availableSessions.slice(0, 2).map((session, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-slate-800/30 rounded-lg p-2">
                                                        <div className="text-slate-300 text-xs">
                                                            {new Date(session.date).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-white text-xs font-medium">
                                                            {session.startTime} - {session.endTime}
                                                        </div>
                                                    </div>
                                                ))}
                                                {tutor.availableSessions.length > 2 && (
                                                    <div className="text-center text-slate-400 text-xs">
                                                        +{tutor.availableSessions.length - 2} more slots
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="px-6 pb-6">
                                    <div className="flex space-x-3">
                                        <Link
                                            to={`/booking/${tutor.id}`}
                                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors text-center"
                                        >
                                            Book Session
                                        </Link>
                                        <button
                                            onClick={() => handleMessageTutor(tutor)}
                                            className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
                                        >
                                            Message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayTutors.map((tutor) => (
                            <div key={tutor.id} className="bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur-sm hover:border-slate-700/50 transition-colors">
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        {/* Left: Tutor Info */}
                                        <div className="flex items-start space-x-4 flex-1">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {tutor.avatar}
                                                </div>
                                                {tutor.online && (
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-xl font-semibold text-white mb-1">{tutor.name}</h3>
                                                        <div className="flex items-center space-x-1 mb-2">
                                                            <span className="text-yellow-400">⭐</span>
                                                            <span className="text-white font-medium">{tutor.rating}</span>
                                                            <span className="text-slate-400 text-sm">({tutor.reviews} reviews)</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {tutor.subjects.slice(0, 4).map((subject, index) => (
                                                        <span key={index} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                                                            {subject}
                                                        </span>
                                                    ))}
                                                    {tutor.subjects.length > 4 && (
                                                        <span className="px-3 py-1 bg-slate-700/50 border border-slate-600/50 rounded-full text-slate-300 text-sm">
                                                            +{tutor.subjects.length - 4} more
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-slate-300 text-sm mb-3">{tutor.bio}</p>

                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center space-x-4">
                                                        <span className="text-slate-400">Total Bookings: <span className="text-white">{tutor.totalBookings || 0}</span></span>
                                                        <span className="text-slate-400">Response: <span className="text-white">{tutor.responseTime}</span></span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-2 h-2 rounded-full ${tutor.online ? 'bg-emerald-400' : 'bg-slate-500'}`}></div>
                                                        <span className="text-slate-300 text-sm">{tutor.availability}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Price & Actions */}
                                        <div className="flex flex-col items-end space-y-4">
                                            <div className="text-right">
                                                <div className="text-white font-bold text-2xl">${tutor.hourlyRate}</div>
                                                <div className="text-slate-400 text-sm">per hour</div>
                                            </div>

                                            <div className="flex space-x-3">
                                                <Link
                                                    to={`/booking/${tutor.id}`}
                                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors text-center"
                                                >
                                                    Book Session
                                                </Link>
                                                <button
                                                    onClick={() => handleMessageTutor(tutor)}
                                                    className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
                                                >
                                                    Message
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Load More */}
                {!loading && displayTutors.length > 0 && (
                    <div className="text-center mt-8">
                        <button className="px-6 py-3 bg-slate-800/50 border border-slate-700/50 text-white rounded-lg hover:bg-slate-700/50 transition-colors">
                            Load More Tutors
                        </button>
                    </div>
                )}

                {/* No Results */}
                {!loading && !error && displayTutors.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                            <span className="text-3xl text-slate-400">🔍</span>
                        </div>
                        <h3 className="text-white font-medium mb-2">No tutors found</h3>
                        <p className="text-slate-400 text-sm">Try adjusting your search criteria</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-3xl text-red-400">⚠️</span>
                        </div>
                        <h3 className="text-white font-medium mb-2">Something went wrong</h3>
                        <p className="text-slate-400 text-sm mb-4">{error}</p>
                        <button
                            onClick={loadTutors}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TutorSearch;