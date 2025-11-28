import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileCompletionAlert = () => {
    const { user } = useAuth();
    const [showAlert, setShowAlert] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkProfileStatus = async () => {
            try {
                if (!user || !user.id) {
                    setIsVisible(false);
                    return;
                }

                // Get the token from localStorage
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No auth token found');
                    setShowAlert(true);
                    setLoading(false);
                    return;
                }

                const response = await fetch(`http://localhost:5000/api/profiles/tutor/status`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Profile status response:', data);
                    if (data.success && data.data) {
                        // Show alert only if profile is NOT complete
                        const isComplete = data.data.isComplete;
                        console.log('Profile isComplete:', isComplete);
                        setShowAlert(!isComplete);
                    } else {
                        console.log('API returned success=false or no data');
                        // Don't show alert if API fails - assume profile might be complete
                        setShowAlert(false);
                    }
                } else {
                    console.log('API request failed with status:', response.status);
                    try {
                        const errorData = await response.json();
                        console.log('Error details:', errorData);
                    } catch (e) {
                        console.log('Could not parse error response');
                    }
                    // Don't show alert on API error - assume profile might be complete
                    setShowAlert(false);
                }
            } catch (error) {
                console.error('Error checking profile status:', error);
                // Don't show alert on error - assume profile might be complete
                setShowAlert(false);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            checkProfileStatus();
        } else {
            setLoading(false);
            setIsVisible(false);
        }
    }, [user]);

    if (loading || !isVisible || !showAlert) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 mb-8 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                            Complete Your Profile
                        </h3>
                        <p className="text-amber-100/80">
                            Complete your profile to be visible to students and receive booking requests.
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Link
                        to="/profile"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all duration-200"
                    >
                        Complete Profile
                    </Link>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="w-8 h-8 flex items-center justify-center text-amber-100/60 hover:text-amber-100 hover:bg-amber-500/20 rounded-lg transition-all duration-200"
                    >
                        <span className="text-lg font-bold">×</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionAlert;