import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close dropdown when route changes
    useEffect(() => {
        setShowProfileDropdown(false);
        setIsMenuOpen(false);
    }, [location]);

    const getNavigation = () => {
        const baseNav = [
            { name: 'Home', href: '/' },
            { name: 'About', href: '/about' },
        ];

        if (isAuthenticated) {
            const authNav = [];

            // Get user role from the account_type field
            const userRole = user?.role || user?.account_type;

            // Only add "Find Tutors" for students, not for tutors or admins
            if (userRole === 'student') {
                authNav.push({ name: 'Find Tutors', href: '/tutors' });
            }

            // Add role-specific dashboard link
            if (userRole === 'student') {
                authNav.unshift({ name: 'Dashboard', href: '/student-dashboard' });
            } else if (userRole === 'tutor') {
                authNav.unshift({ name: 'Dashboard', href: '/tutor-dashboard' });
            } else if (userRole === 'admin') {
                authNav.unshift({ name: 'Dashboard', href: '/admin-dashboard' });
            }

            return [...baseNav, ...authNav];
        }

        return baseNav;
    };

    const navigation = getNavigation();
    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            setIsMenuOpen(false);
            setShowProfileDropdown(false);
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            // In a real app, you might show a toast notification here
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleProfileClick = () => {
        setShowProfileDropdown(!showProfileDropdown);
    };

    const navigateToProfile = () => {
        navigate('/profile');
        setShowProfileDropdown(false);
        setIsMenuOpen(false);
    };

    return (
        <nav className="navbar-container">
            <div className="navbar-wrapper">
                <div className="navbar-content">
                    {/* Logo */}
                    <div className="navbar-logo-container">
                        <Link to="/" className="navbar-logo-link">
                            <div className="navbar-logo-icon">
                                <span className="navbar-logo-text">T</span>
                            </div>
                            <span className="navbar-brand-text">Tutor Together</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="navbar-desktop-nav">
                        <div className="navbar-nav-links">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`navbar-link ${isActive(item.href)
                                        ? 'navbar-link-active'
                                        : 'navbar-link-inactive'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Auth Section */}
                    <div className="navbar-desktop-auth">
                        {isAuthenticated ? (
                            <div className="navbar-profile-dropdown-container" ref={dropdownRef}>
                                <div className="navbar-profile-wrapper">
                                    <button
                                        onClick={handleProfileClick}
                                        className="navbar-profile-button"
                                    >
                                        <div className="navbar-avatar">
                                            {(user?.profile?.fullName || user?.full_name || user?.name || user?.username || '')
                                                .split(' ').map(n => n[0]).join('') || 'U'}
                                        </div>
                                        <span className="navbar-username">
                                            {user?.profile?.fullName || user?.full_name || user?.name || user?.username || 'User'}
                                        </span>
                                        <svg className="navbar-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Profile Dropdown */}
                                {showProfileDropdown && (
                                    <div className="navbar-dropdown-menu">
                                        <div className="navbar-dropdown-content">
                                            <button
                                                onClick={navigateToProfile}
                                                className="navbar-dropdown-item"
                                            >
                                                <svg className="navbar-dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                View Profile
                                            </button>
                                            <div className="navbar-dropdown-divider"></div>
                                            <button
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                className="navbar-dropdown-item navbar-dropdown-item-logout"
                                            >
                                                {isLoggingOut ? (
                                                    <>
                                                        <div className="navbar-spinner"></div>
                                                        Logging out...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="navbar-dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                        Logout
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="outline" size="sm" className="whitespace-nowrap">
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="primary" size="sm">
                                        Register
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="navbar-mobile-toggle">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="navbar-toggle-button"
                        >
                            <svg
                                className="navbar-toggle-icon"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                {isMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="navbar-mobile-nav">
                        <div className="navbar-mobile-content">
                            <div className="navbar-mobile-links">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`navbar-item ${isActive(item.href)
                                            ? 'navbar-link-active'
                                            : 'navbar-link-inactive'
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                            <div className="navbar-mobile-auth">
                                {isAuthenticated ? (
                                    <>
                                        <div className="navbar-mobile-profile">
                                            <div className="navbar-mobile-avatar">
                                                {(user?.profile?.fullName || user?.full_name || user?.name || user?.username || '')
                                                    .split(' ').map(n => n[0]).join('') || 'U'}
                                            </div>
                                            <div className="navbar-mobile-username">
                                                {user?.profile?.fullName || user?.full_name || user?.name || user?.username || 'User'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={navigateToProfile}
                                            className="navbar-mobile-profile-button"
                                        >
                                            <svg className="navbar-mobile-profile-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>View Profile</span>
                                        </button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                        >
                                            {isLoggingOut ? (
                                                <div className="navbar-mobile-logout-content">
                                                    <div className="navbar-mobile-spinner"></div>
                                                    <span>Logging out...</span>
                                                </div>
                                            ) : (
                                                'Logout'
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                Login
                                            </Button>
                                        </Link>
                                        <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="primary" size="sm" className="w-full">
                                                Register
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;