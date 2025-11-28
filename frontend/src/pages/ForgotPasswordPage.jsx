import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Button, Input, Card } from '../components/ui';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ForgotPasswordPage = () => {
    const [formData, setFormData] = useState({
        email: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [message, setMessage] = useState('');
    const [responseData, setResponseData] = useState(null);

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
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
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
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            const data = await response.json();

            if (data.success) {
                setIsSuccess(true);
                setResponseData(data);
                let displayMessage = data.message;

                // Show debug token in development
                if (data.debug && data.debug.token) {
                    displayMessage += `\n\nReset Token: ${data.debug.token}\n\nCopy this token to reset your password.`;
                }

                setMessage(displayMessage);
            } else {
                if (data.errors && Array.isArray(data.errors)) {
                    const validationErrors = {};
                    data.errors.forEach(error => {
                        validationErrors[error.param || 'submit'] = error.msg;
                    });
                    setErrors(validationErrors);
                } else {
                    setErrors({
                        submit: data.message || 'Failed to send reset email. Please try again.'
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
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Password Reset</h1>
                        <div className="text-gray-300 mb-6 whitespace-pre-line text-sm">
                            {message}
                        </div>

                        <div className="space-y-4">
                            {/* Add direct link to reset password page with token if available */}
                            {responseData && responseData.debug && responseData.debug.token && (
                                <Link to={`/reset-password?token=${responseData.debug.token}`}>
                                    <Button variant="primary" className="w-full">
                                        Reset Password with This Token
                                    </Button>
                                </Link>
                            )}

                            <Button
                                onClick={() => {
                                    setIsSuccess(false);
                                    setFormData({ email: '' });
                                    setMessage('');
                                    setResponseData(null);
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                Send Another Email
                            </Button>

                            <Link to="/login">
                                <Button variant="secondary" className="w-full">
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="flex items-center justify-center min-h-screen py-8">
            <Card className="w-full max-w-md p-8 bg-gray-900 border border-gray-700">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">Forgot Password</h1>
                    <p className="text-gray-300">
                        Enter your email address and we'll send you instructions to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email address"
                            error={errors.email}
                            required
                        />
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
                        {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                        Back to Login
                    </Link>
                </div>


            </Card>
        </Container>
    );
};

export default ForgotPasswordPage;