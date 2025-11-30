import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Button, Card } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
    const { user, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect authenticated users to their dashboard
    useEffect(() => {
        if (!loading && isAuthenticated && user) {
            const userRole = user?.role || user?.account_type;

            if (userRole === 'student') {
                navigate('/student-dashboard', { replace: true });
            } else if (userRole === 'tutor') {
                navigate('/tutor-dashboard', { replace: true });
            } else if (userRole === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, user, loading, navigate]);

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    // Show loading during redirect for authenticated users
    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                    <p className="text-white">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    const features = [
        {
            icon: '🎯',
            title: 'Personalized Learning',
            description: 'AI-powered matching connects you with tutors who understand your learning style and goals.'
        },
        {
            icon: '🧠',
            title: 'AI Study Assistant',
            description: 'Get instant help with homework, generate practice problems, and receive study recommendations.'
        },
        {
            icon: '📊',
            title: 'Progress Tracking',
            description: 'Monitor your learning journey with detailed analytics and achievement milestones.'
        },
        {
            icon: '💬',
            title: 'Interactive Sessions',
            description: 'Engage in live video sessions with screen sharing, whiteboards, and collaborative tools.'
        },
        {
            icon: '🌟',
            title: 'Expert Tutors',
            description: 'Learn from qualified educators with proven track records and positive student reviews.'
        },
        {
            icon: '⚡',
            title: 'Flexible Scheduling',
            description: 'Book sessions that fit your schedule with instant confirmations and easy rescheduling.'
        }
    ];

    const testimonials = [
        {
            name: 'Emma Chen',
            role: 'Computer Science Student',
            content: 'Tutor Together helped me improve my programming skills dramatically. The AI assistant is incredibly helpful for debugging!',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop'
        },
        {
            name: 'Marcus Johnson',
            role: 'High School Student',
            content: 'My calculus grades went from C to A+ in just 3 months. The personalized learning approach really works!',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop'
        },
        {
            name: 'Sophia Rodriguez',
            role: 'Physics Major',
            content: 'The progress tracking feature keeps me motivated, and the tutors are amazing at explaining complex concepts.',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop'
        }
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-black via-gray-900 to-black py-20 lg:py-32">
                <Container>
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Connect, Learn,
                            <span className="bg-gradient-to-r from-blue-400 to-gray-300 bg-clip-text text-transparent"> Succeed</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                            Accelerate your learning journey with AI-powered tutoring,
                            personalized study plans, and expert guidance tailored to your goals.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Get Started Free
                                </Button>
                            </Link>
                            <Link to="/tutors">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                    Find Tutors
                                </Button>
                            </Link>
                        </div>
                        <p className="text-gray-400 text-sm mt-4">
                            No credit card required • Cancel anytime • 500+ expert tutors
                        </p>
                    </div>
                </Container>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-900/50">
                <Container>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Why Choose Tutor Together?
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            Our platform combines cutting-edge AI technology with human expertise
                            to create the most effective learning experience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="text-center">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-300 leading-relaxed">
                                    {feature.description}
                                </p>
                            </Card>
                        ))}
                    </div>
                </Container>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-gradient-to-r from-blue-600 to-gray-400">
                <Container>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-white mb-2">10K+</div>
                            <div className="text-white/80">Students Helped</div>
                        </div>
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-white mb-2">500+</div>
                            <div className="text-white/80">Expert Tutors</div>
                        </div>
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
                            <div className="text-white/80">Subjects Covered</div>
                        </div>
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-white mb-2">4.9/5</div>
                            <div className="text-white/80">Average Rating</div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-black">
                <Container>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            What Our Students Say
                        </h2>
                        <p className="text-xl text-gray-300">
                            Real success stories from students who transformed their learning experience
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index}>
                                <div className="flex items-center mb-4">
                                    <img
                                        src={testimonial.avatar}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full mr-4"
                                    />
                                    <div>
                                        <h4 className="font-semibold text-white">{testimonial.name}</h4>
                                        <p className="text-gray-400 text-sm">{testimonial.role}</p>
                                    </div>
                                </div>
                                <p className="text-gray-300 italic leading-relaxed">
                                    "{testimonial.content}"
                                </p>
                                <div className="flex text-yellow-400 mt-4">
                                    {'★'.repeat(5)}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Container>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gray-900/50">
                <Container>
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Ready to Transform Your Learning?
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Join thousands of students who have already accelerated their academic success
                            with our AI-powered tutoring platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Start Learning Today
                                </Button>
                            </Link>
                            <Link to="/about">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                    Learn More
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Container>
            </section>
        </div>
    );
};

export default LandingPage;