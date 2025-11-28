import {
    mockTutors,
    mockStudent,
    mockTasks,
    mockBookingSlots,
    mockBookings
} from './mockData.js';

// Simulated API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
    try {
        const url = `${API_BASE_URL}${endpoint}`;

        // Get auth token from localStorage (must match authService key)
        const token = localStorage.getItem('token');

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

// Tutor Services
export const tutorService = {
    async getAllTutors(filters = {}) {
        const searchParams = new URLSearchParams();

        if (filters.search) searchParams.append('search', filters.search);
        if (filters.subject) searchParams.append('subject', filters.subject);
        if (filters.minPrice) searchParams.append('minPrice', filters.minPrice);
        if (filters.maxPrice) searchParams.append('maxPrice', filters.maxPrice);
        if (filters.sortBy) searchParams.append('sortBy', filters.sortBy);

        const endpoint = `/tutors${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        const result = await apiCall(endpoint);
        return result.data || [];
    },

    async getTutorById(id) {
        try {
            const result = await apiCall(`/tutors/${id}`);
            return result.data;
        } catch (error) {
            console.error('Failed to fetch tutor:', error);
            // Fallback to mock data
            await delay(300);
            return mockTutors.find(tutor => tutor.id === id) || null;
        }
    },

    async getTutorSubjects() {
        try {
            const result = await apiCall('/tutors/subjects');
            return result.data || [];
        } catch (error) {
            console.error('Failed to fetch tutor subjects:', error);
            // Fallback to default subjects
            return ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Economics', 'English', 'Biology'];
        }
    },

    async searchTutors(subject, availability) {
        await delay(600);
        let filtered = mockTutors;

        if (subject) {
            filtered = filtered.filter(tutor =>
                tutor.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()))
            );
        }

        return filtered;
    }
};

// Student Services
export const studentService = {
    async getCurrentStudent() {
        await delay(300);
        return mockStudent;
    },

    async updateStudent(updates) {
        await delay(500);
        return { ...mockStudent, ...updates };
    }
};

// Task Services
export const taskService = {
    async getTasks() {
        return await apiCall('/tasks');
    },

    async createTask(task) {
        return await apiCall('/tasks', {
            method: 'POST',
            body: JSON.stringify({
                title: task.title,
                description: task.description,
                subject: task.subject,
                priority: task.priority,
                estimatedTime: task.estimatedTime,
                dueDate: task.due
            })
        });
    },

    async updateTask(id, updates) {
        return await apiCall(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                title: updates.title,
                description: updates.description,
                subject: updates.subject,
                priority: updates.priority,
                estimatedTime: updates.estimatedTime,
                dueDate: updates.due,
                status: updates.status,
                progress: updates.progress
            })
        });
    },

    async deleteTask(id) {
        return await apiCall(`/tasks/${id}`, {
            method: 'DELETE'
        });
    }
};

// Booking Services
export const bookingService = {
    async getAvailableSlots(tutorId, date) {
        await delay(500);
        return mockBookingSlots.filter(slot =>
            slot.tutorId === tutorId &&
            slot.date === date &&
            slot.isAvailable
        );
    },

    async createBooking(booking) {
        await delay(600);
        const newBooking = {
            ...booking,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };
        return newBooking;
    },

    async getStudentBookings(studentId) {
        await delay(400);
        return mockBookings.filter(booking => booking.studentId === studentId);
    },

    async cancelBooking(bookingId) {
        await delay(400);
        return true;
    }
};

// AI Assistant Services
export const aiService = {
    async getChatResponse(message, context) {
        await delay(800);

        // Simple mock responses based on keywords
        const responses = {
            math: {
                message: "I can help you with mathematics! What specific topic are you working on? I can provide explanations, practice problems, or study strategies.",
                suggestions: [
                    "Practice algebra problems",
                    "Review calculus concepts",
                    "Work on geometry proofs"
                ],
                resources: [
                    { title: "Khan Academy - Algebra", url: "#", type: "video" },
                    { title: "Calculus Practice Problems", url: "#", type: "exercise" }
                ]
            },
            physics: {
                message: "Physics can be challenging but rewarding! Are you working on mechanics, electricity, or another area? I can break down complex concepts into manageable steps.",
                suggestions: [
                    "Review Newton's laws",
                    "Practice momentum problems",
                    "Study wave mechanics"
                ],
                resources: [
                    { title: "Physics Fundamentals", url: "#", type: "article" },
                    { title: "Lab Simulation Tools", url: "#", type: "exercise" }
                ]
            },
            default: {
                message: "I'm here to help with your studies! You can ask me about specific subjects, study strategies, or request practice problems. What would you like to work on today?",
                suggestions: [
                    "Help with homework",
                    "Create study plan",
                    "Find practice problems",
                    "Explain difficult concepts"
                ],
                resources: []
            }
        };

        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('math') || lowerMessage.includes('algebra') || lowerMessage.includes('calculus')) {
            return responses.math;
        } else if (lowerMessage.includes('physics') || lowerMessage.includes('mechanics')) {
            return responses.physics;
        } else {
            return responses.default;
        }
    },

    async generateStudyPlan(subject, timeAvailable) {
        await delay(1000);

        return {
            tasks: [
                `Review ${subject} fundamentals`,
                `Complete practice problems`,
                `Take practice quiz`,
                `Review weak areas`
            ],
            timeline: `${timeAvailable} hours over next week`,
            tips: [
                "Break study sessions into 25-minute intervals",
                "Practice active recall techniques",
                "Form study groups with classmates"
            ]
        };
    }
};

// Authentication Services (Mock)
export const authService = {
    async login(email, password) {
        await delay(800);

        // Mock successful login
        return {
            user: mockStudent,
            token: 'mock-jwt-token-' + Math.random().toString(36)
        };
    },

    async register(userData) {
        await delay(1000);

        const newUser = {
            id: Math.random().toString(36).substr(2, 9),
            ...userData,
            createdAt: new Date().toISOString(),
            ...(userData.role === 'student' ? {
                progress: { completedTasks: 0, totalTasks: 0, currentStreak: 0, totalHours: 0 },
                preferences: { subjects: [], learningStyle: '', availability: [] }
            } : {
                rating: 0,
                subjects: [],
                hourlyRate: 0,
                availability: {},
                bio: '',
                experience: 0,
                totalSessions: 0,
                responseTime: '< 24 hours'
            })
        };

        return {
            user: newUser,
            token: 'mock-jwt-token-' + Math.random().toString(36)
        };
    },

    async logout() {
        await delay(200);
        // Clear local storage, etc.
    }
};