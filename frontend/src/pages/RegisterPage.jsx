import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Button, Input, Card } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'student'
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

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

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }



        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const registrationData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                userType: formData.userType
            };

            const response = await register(registrationData);

            if (!response.success) {
                // Handle validation errors
                if (response.errors && Array.isArray(response.errors)) {
                    const validationErrors = {};
                    response.errors.forEach(error => {
                        validationErrors[error.param || 'submit'] = error.msg;
                    });
                    setErrors(validationErrors);
                } else {
                    setErrors({
                        submit: response.message || 'Registration failed. Please try again.'
                    });
                }
                return;
            }

            if (formData.userType === 'tutor') {
                // For tutors, show success message but they may need approval
                setErrors({
                    submit: 'success:Your tutor account has been created successfully! You can now log in and complete your profile.'
                });

                // Clear form and redirect to login after delay
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                // For students, redirect to dashboard
                const userRole = response.user.role || response.user.accountType;
                switch (userRole) {
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
            }
        } catch (error) {
            setErrors({
                submit: error.message || 'Registration failed. This email may already be registered.'
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
                    <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
                    <p className="text-gray-400">Join thousands of learners and tutors today</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                placeholder="Enter first name"
                                error={errors.firstName}
                                required
                            />
                            <Input
                                label="Last Name"
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                placeholder="Enter last name"
                                error={errors.lastName}
                                required
                            />
                        </div>

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

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                I want to join as a
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`relative cursor-pointer rounded-lg border p-4 transition-colors ${formData.userType === 'student'
                                        ? 'border-blue-500 bg-blue-900/20'
                                        : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                                        }`}
                                    onClick={() => setFormData(prev => ({ ...prev, userType: 'student' }))}
                                >
                                    <input
                                        type="radio"
                                        name="userType"
                                        value="student"
                                        checked={formData.userType === 'student'}
                                        onChange={handleInputChange}
                                        className="sr-only"
                                    />
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">🎓</div>
                                        <div className="font-medium text-white">Student</div>
                                        <div className="text-sm text-gray-400">Learn and grow</div>
                                    </div>
                                    {formData.userType === 'student' && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className={`relative cursor-pointer rounded-lg border p-4 transition-colors ${formData.userType === 'tutor'
                                        ? 'border-blue-500 bg-blue-900/20'
                                        : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                                        }`}
                                    onClick={() => setFormData(prev => ({ ...prev, userType: 'tutor' }))}
                                >
                                    <input
                                        type="radio"
                                        name="userType"
                                        value="tutor"
                                        checked={formData.userType === 'tutor'}
                                        onChange={handleInputChange}
                                        className="sr-only"
                                    />
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">👨‍🏫</div>
                                        <div className="font-medium text-white">Tutor</div>
                                        <div className="text-sm text-gray-400">Teach and earn</div>
                                    </div>
                                    {formData.userType === 'tutor' && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Create a strong password"
                            error={errors.password}
                            help="Must be at least 8 characters with uppercase, lowercase, and number"
                            required
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm your password"
                            error={errors.confirmPassword}
                            required
                        />



                        {errors.submit && (
                            <div className={`border px-4 py-3 rounded-lg ${errors.submit.startsWith('success:')
                                ? 'bg-green-900/50 border-green-500 text-green-300'
                                : 'bg-red-900/50 border-red-500 text-red-300'
                                }`}>
                                {errors.submit.startsWith('success:')
                                    ? errors.submit.replace('success:', '')
                                    : errors.submit}
                            </div>
                        )}

                        <Button
                            type="submit"
                            loading={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </Card>
            </Container>
        </div>
    );
};

export default RegisterPage;