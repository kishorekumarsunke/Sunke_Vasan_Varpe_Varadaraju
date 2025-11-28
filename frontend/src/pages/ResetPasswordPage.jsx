import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Button, Input, Card } from '../components/ui';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        token: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Auto-fill token from URL parameters
    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setFormData(prev => ({
                ...prev,
                token: tokenFromUrl
            }));
        }
    }, [searchParams]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Clear confirm password error when either password field changes
        if ((name === 'password' || name === 'confirmPassword') && errors.confirmPassword) {
            setErrors(prev => ({
                ...prev,
                confirmPassword: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.token) {
            newErrors.token = 'Reset token is required';
        } else if (formData.token.length < 20) {
            newErrors.token = 'Invalid token format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password.trim() !== formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: formData.token,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                }),
            });

            const data = await response.json();

            if (data.success) {
                setIsSuccess(true);
            } else {
                if (data.errors && Array.isArray(data.errors)) {
                    const validationErrors = {};
                    data.errors.forEach(error => {
                        validationErrors[error.param || 'submit'] = error.msg;
                    });
                    setErrors(validationErrors);
                } else {
                    setErrors({
                        submit: data.message || 'Failed to reset password. Please try again.'
                    });
                }
            }
        } catch (error) {
            console.error('Password reset error:', error);
            setErrors({
                submit: 'Network error. Please check your connection and try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <Container className="flex items-center justify-center min-h-screen py-8">
                <Card className="w-full max-w-md p-8 bg-gray-900 border border-gray-700">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Password Reset Successful</h1>
                        <p className="text-gray-300 mb-6">
                            Your password has been successfully reset. You can now login with your new password.
                        </p>

                        <Button
                            onClick={() => navigate('/login')}
                            variant="primary"
                            className="w-full"
                        >
                            Continue to Login
                        </Button>
                    </div>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="flex items-center justify-center min-h-screen py-8">
            <Card className="w-full max-w-md p-8 bg-gray-900 border border-gray-700">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                    <p className="text-gray-300">
                        Enter your reset token and choose a new password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Input
                            label="Reset Token"
                            type="text"
                            name="token"
                            value={formData.token}
                            onChange={handleInputChange}
                            placeholder="Enter your reset token"
                            error={errors.token}
                            required
                        />
                        <p className="text-gray-400 text-xs mt-1">
                            Copy the token from your forgot password request
                        </p>
                    </div>

                    <div>
                        <div className="relative">
                            <Input
                                label="New Password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter new password"
                                error={errors.password}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-300 focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="relative">
                            <Input
                                label="Confirm New Password"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Confirm new password"
                                error={errors.confirmPassword}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-300 focus:outline-none"
                            >
                                {showConfirmPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {errors.submit && (
                        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                            {errors.submit}
                        </div>
                    )}

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={isLoading}
                        className="w-full"
                        variant="primary"
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors block">
                        Request New Token
                    </Link>
                    <Link to="/login" className="text-gray-400 hover:text-gray-300 transition-colors block">
                        Back to Login
                    </Link>
                </div>
            </Card>
        </Container>
    );
};

export default ResetPasswordPage;