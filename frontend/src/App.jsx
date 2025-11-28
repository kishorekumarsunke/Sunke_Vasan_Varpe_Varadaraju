import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import AIChatIcon from './components/AIChatIcon';
import AuthDebug from './components/AuthDebug';
import TestComponent from './components/TestComponent';
import BrowserDebug from './components/BrowserDebug';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TutorSearch from './pages/TutorSearch';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import TutorProfilePage from './pages/TutorProfilePage';
import ErrorPage from './pages/ErrorPage';
import AboutPage from './pages/AboutPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import CalendarPage from './pages/CalendarPage';
import MessagesPage from './pages/MessagesPage';
import ChatbotPage from './pages/ChatbotPage';

import TasksPage from './pages/TasksPage';
import AvailabilityFlowDemo from './components/AvailabilityFlowDemo';

const Layout = ({ children }) => {
    console.log('🏠 Layout rendering with children:', !!children);

    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            {children}
            <AIChatIcon />
        </div>
    );
};

function App() {
    console.log('🚀 App component rendering');

    // Get basename from Vite environment variable
    // For UTA Cloud (relative paths), don't use basename
    const basename = import.meta.env.BASE_URL === './' ? '' : import.meta.env.BASE_URL;

    console.log('🌐 Router basename:', basename);

    return (
        <AuthProvider>
            <Router basename={basename}>
                <Layout>
                    <Routes>
                        {/* Test Route */}
                        <Route path="/test" element={<div style={{ color: 'white', padding: '20px' }}>🧪 Test Route Working!</div>} />

                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <LoginPage />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <RegisterPage />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/forgot-password"
                            element={
                                <PublicRoute>
                                    <ForgotPasswordPage />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/reset-password"
                            element={
                                <PublicRoute>
                                    <ResetPasswordPage />
                                </PublicRoute>
                            }
                        />

                        {/* Protected Routes - Student */}
                        <Route
                            path="/student-dashboard"
                            element={
                                <ProtectedRoute requiredRole="student">
                                    <StudentDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected Routes - Tutor */}
                        <Route
                            path="/tutor-dashboard"
                            element={
                                <ProtectedRoute requiredRole="tutor">
                                    <TutorDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected Routes - Admin */}
                        <Route
                            path="/admin-dashboard"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected Routes - Any authenticated user */}
                        <Route
                            path="/tutors"
                            element={
                                <ProtectedRoute>
                                    <TutorSearch />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/booking/:tutorId"
                            element={
                                <ProtectedRoute>
                                    <BookingPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tutor-profile"
                            element={
                                <ProtectedRoute requiredRole="tutor">
                                    <TutorProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/calendar"
                            element={
                                <ProtectedRoute>
                                    <CalendarPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/messages"
                            element={
                                <ProtectedRoute>
                                    <MessagesPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/chatbot"
                            element={
                                <ProtectedRoute>
                                    <ChatbotPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tasks"
                            element={
                                <ProtectedRoute>
                                    <TasksPage />
                                </ProtectedRoute>
                            }
                        />


                        {/* Demo Route */}
                        <Route path="/demo/availability-flow" element={<AvailabilityFlowDemo />} />

                        {/* Legacy dashboard route - redirect based on role */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <StudentDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Unauthorized page */}
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />

                        {/* 404 page */}
                        <Route path="*" element={<ErrorPage />} />
                    </Routes>
                </Layout>
            </Router>
        </AuthProvider>
    );
}

export default App;