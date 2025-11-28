import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Button, Input, Card } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const response = await login(formData.email, formData.password);

            // Redirect based on user account type
            switch (response.user.account_type || response.user.accountType) {
                case 'student':
                    navigate('/student-dashboard');
                    break;
                case 'tutor':
                    navigate('/tutor-dashboard');
                    break;
                case 'admin':
                    navigate('/admin-dashboard');
                    break;
                default:
                    navigate('/');
            }
        } catch (error) {
            setErrors({
                submit: error.message || 'Invalid email or password. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Container maxWidth="sm">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-gray-400 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">T</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to your account to continue learning</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                            error={errors.password}
                            required
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="rememberMe"
                                    type="checkbox"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-800 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-300">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors">
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        {errors.submit && (
                            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                                {errors.submit}
                            </div>
                        )}

                        <Button
                            type="submit"
                            loading={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6">
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </Card>
            </Container>
        </div>
    );
};

export default LoginPage;