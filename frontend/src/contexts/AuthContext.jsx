import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    console.log('🔐 AuthProvider rendering, user:', user, 'loading:', loading);

    // Check for existing user on app load
    useEffect(() => {
        const initializeAuth = async () => {
            console.log('🔄 Initializing auth...');
            try {
                const isAuth = authService.isAuthenticated();
                console.log('🔍 Is authenticated:', isAuth);

                if (isAuth) {
                    const currentUser = authService.getCurrentUser();
                    console.log('👤 Current user from storage:', currentUser);
                    setUser(currentUser);
                } else {
                    console.log('❌ Not authenticated, clearing storage');
                    // Clear any invalid tokens
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('🚨 Auth initialization error:', error);
            } finally {
                console.log('✅ Auth initialization complete, setting loading to false');
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // Register function
    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            if (response.success) {
                setUser(response.user);
                return response;
            }
            // Return the response (including validation errors) instead of throwing
            return response;
        } catch (error) {
            throw error;
        }
    };

    // Login function
    const login = async (email, password) => {
        try {
            const response = await authService.login({ email, password });
            if (response.success) {
                setUser(response.user);
                return response;
            }
            throw new Error(response.message || 'Login failed');
        } catch (error) {
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local state even if API call fails
            setUser(null);
        }
    };

    // Update profile function
    const updateProfile = async (profileData) => {
        try {
            const response = await authService.updateProfile(profileData);
            if (response.success) {
                // Update local user data
                const updatedUser = { ...user, ...response.profile };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return response;
            }
            throw new Error(response.message || 'Profile update failed');
        } catch (error) {
            throw error;
        }
    };

    // Auth context value
    const value = {
        user,
        register,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};