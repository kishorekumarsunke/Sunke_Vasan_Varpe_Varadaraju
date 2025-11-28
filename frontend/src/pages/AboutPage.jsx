import React from 'react';
import { Container } from '../components/ui';

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
            <Container className="py-16">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <span className="text-white font-bold text-3xl">T</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            About Tutor Together
                        </h1>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            Connecting learners with expert tutors to unlock academic potential and achieve educational goals together.
                        </p>
                    </div>

                    {/* Main Content */}
                    <div className="grid md:grid-cols-2 gap-12 mb-16">
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold text-white mb-4">Our Mission</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    To make quality education accessible to everyone by connecting students with passionate, qualified tutors who can provide personalized learning experiences tailored to individual needs.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold text-white mb-4">What We Offer</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    A comprehensive platform featuring expert tutors across all subjects, flexible scheduling, secure messaging, and an AI assistant to support your learning journey 24/7.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Expert Tutors</h4>
                            <p className="text-slate-400 text-sm">Qualified professionals with proven track records in their subjects</p>
                        </div>

                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Flexible Scheduling</h4>
                            <p className="text-slate-400 text-sm">Book sessions that fit your schedule with easy calendar integration</p>
                        </div>

                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">AI Assistant</h4>
                            <p className="text-slate-400 text-sm">24/7 AI support for instant help with questions and study guidance</p>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl p-8 border border-blue-500/20">
                        <h3 className="text-2xl font-semibold text-white mb-4">Ready to Start Learning?</h3>
                        <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                            Join thousands of students who have already improved their academic performance with our platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/register"
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                            >
                                Get Started
                            </a>
                            <a
                                href="/tutors"
                                className="px-8 py-3 bg-slate-800 text-white font-semibold rounded-xl border border-slate-600 hover:bg-slate-700 transition-all duration-200"
                            >
                                Find Tutors
                            </a>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default AboutPage;