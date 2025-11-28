import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ProtectedRoute.css';

// Protected Route Component
export const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { user, loading } = useAuth();

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="protected-route-loading">
                <div className="protected-route-spinner"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check role-based access if required
    const userRole = user?.role || user?.account_type;
    if (requiredRole && userRole !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

// Public Route Component (redirect to dashboard if already logged in)
export const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Redirect to appropriate dashboard if already authenticated
    if (user) {
        const userRole = user?.role || user?.account_type;
        switch (userRole) {
            case 'student':
                return <Navigate to="/student-dashboard" replace />;
            case 'tutor':
                return <Navigate to="/tutor-dashboard" replace />;
            case 'admin':
                return <Navigate to="/admin-dashboard" replace />;
            default:
                return <Navigate to="/" replace />;
        }
    }

    return children;
};