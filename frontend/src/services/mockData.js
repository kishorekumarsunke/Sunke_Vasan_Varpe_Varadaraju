export const mockTutors = [
    {
        id: '1',
        name: 'Rahul Varadaraju',
        email: 'rahul.varadaraju@example.com',
        role: 'tutor',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332e234?w=150',
        createdAt: '2024-01-15T10:00:00Z',
        rating: 4.9,
        subjects: ['Mathematics', 'Physics', 'Calculus'],
        hourlyRate: 45,
        availability: {
            'Monday': ['09:00', '10:00', '11:00', '14:00', '15:00'],
            'Tuesday': ['09:00', '10:00', '13:00', '14:00', '15:00'],
            'Wednesday': ['10:00', '11:00', '14:00', '15:00', '16:00'],
            'Thursday': ['09:00', '10:00', '11:00', '13:00', '14:00'],
            'Friday': ['09:00', '10:00', '15:00', '16:00'],
            'Saturday': ['10:00', '11:00', '12:00'],
            'Sunday': []
        },
        bio: 'PhD in Mathematics with 8 years of teaching experience. Specializes in advanced calculus and physics problem-solving.',
        experience: 8,
        totalSessions: 342,
        responseTime: '< 2 hours'
    },
    {
        id: '2',
        name: 'Chandrasekar Vasan',
        email: 'chandrasekar.vasan@example.com',
        role: 'tutor',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        createdAt: '2024-01-10T08:30:00Z',
        rating: 4.8,
        subjects: ['Computer Science', 'Programming', 'Data Structures'],
        hourlyRate: 55,
        availability: {
            'Monday': ['13:00', '14:00', '15:00', '16:00', '17:00'],
            'Tuesday': ['13:00', '14:00', '15:00', '16:00'],
            'Wednesday': ['14:00', '15:00', '16:00', '17:00'],
            'Thursday': ['13:00', '14:00', '15:00', '16:00', '17:00'],
            'Friday': ['13:00', '14:00', '15:00'],
            'Saturday': ['09:00', '10:00', '11:00', '12:00'],
            'Sunday': ['14:00', '15:00', '16:00']
        },
        bio: 'Senior software engineer turned educator with expertise in algorithms, data structures, and modern programming languages.',
        experience: 6,
        totalSessions: 287,
        responseTime: '< 1 hour'
    },
    {
        id: '3',
        name: 'Kishore Kumar Sunke',
        email: 'kishore.sunke@example.com',
        role: 'tutor',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        createdAt: '2024-01-20T12:15:00Z',
        rating: 4.7,
        subjects: ['Chemistry', 'Biology', 'Organic Chemistry'],
        hourlyRate: 42,
        availability: {
            'Monday': ['08:00', '09:00', '10:00', '11:00'],
            'Tuesday': ['08:00', '09:00', '10:00', '16:00', '17:00'],
            'Wednesday': ['08:00', '09:00', '16:00', '17:00'],
            'Thursday': ['08:00', '09:00', '10:00', '11:00', '16:00'],
            'Friday': ['08:00', '09:00', '10:00'],
            'Saturday': [],
            'Sunday': ['15:00', '16:00', '17:00']
        },
        bio: 'Biochemistry PhD with a passion for making complex scientific concepts accessible and engaging for students.',
        experience: 5,
        totalSessions: 198,
        responseTime: '< 3 hours'
    },
    {
        id: '4',
        name: 'Pranav Varpe',
        email: 'pranav.varpe@example.com',
        role: 'tutor',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        createdAt: '2024-02-01T09:45:00Z',
        rating: 4.6,
        subjects: ['History', 'English Literature', 'Writing'],
        hourlyRate: 38,
        availability: {
            'Monday': ['10:00', '11:00', '12:00', '15:00', '16:00'],
            'Tuesday': ['10:00', '11:00', '12:00', '15:00'],
            'Wednesday': ['11:00', '12:00', '15:00', '16:00', '17:00'],
            'Thursday': ['10:00', '11:00', '12:00', '15:00', '16:00'],
            'Friday': ['10:00', '11:00', '12:00'],
            'Saturday': ['09:00', '10:00', '11:00'],
            'Sunday': []
        },
        bio: 'Masters in English Literature with extensive experience in academic writing and historical research methods.',
        experience: 4,
        totalSessions: 156,
        responseTime: '< 4 hours'
    }
];

export const mockStudent = {
    id: 'student1',
    name: 'Alex Thompson',
    email: 'alex.thompson@example.com',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    createdAt: '2024-02-15T14:30:00Z',
    progress: {
        completedTasks: 12,
        totalTasks: 20,
        currentStreak: 5,
        totalHours: 48
    },
    preferences: {
        subjects: ['Mathematics', 'Physics', 'Computer Science'],
        learningStyle: 'Visual',
        availability: ['Monday 14:00-17:00', 'Wednesday 15:00-18:00', 'Friday 13:00-16:00']
    }
};

export const mockTasks = [
    {
        id: '1',
        title: 'Complete Calculus Chapter 5',
        description: 'Work through integration by parts and practice problems 1-20',
        subject: 'Mathematics',
        status: 'in-progress',
        progress: 65,
        dueDate: '2024-03-15T23:59:59Z',
        createdAt: '2024-03-01T10:00:00Z',
        estimatedHours: 4
    },
    {
        id: '2',
        title: 'Physics Lab Report',
        description: 'Complete the momentum and energy conservation lab report',
        subject: 'Physics',
        status: 'pending',
        progress: 0,
        dueDate: '2024-03-20T23:59:59Z',
        createdAt: '2024-03-05T14:30:00Z',
        estimatedHours: 3
    },
    {
        id: '3',
        title: 'Data Structures Assignment',
        description: 'Implement binary search tree with insertion, deletion, and traversal methods',
        subject: 'Computer Science',
        status: 'completed',
        progress: 100,
        dueDate: '2024-03-10T23:59:59Z',
        createdAt: '2024-02-28T09:15:00Z',
        estimatedHours: 6
    },
    {
        id: '4',
        title: 'Review Linear Algebra',
        description: 'Go through matrix operations and eigenvalues before the midterm',
        subject: 'Mathematics',
        status: 'pending',
        progress: 25,
        dueDate: '2024-03-25T23:59:59Z',
        createdAt: '2024-03-08T11:20:00Z',
        estimatedHours: 5
    }
];

export const mockBookingSlots = [
    {
        id: 'slot1',
        tutorId: '1',
        date: '2024-03-18',
        startTime: '14:00',
        endTime: '15:00',
        isAvailable: true,
        price: 45
    },
    {
        id: 'slot2',
        tutorId: '1',
        date: '2024-03-18',
        startTime: '15:00',
        endTime: '16:00',
        isAvailable: true,
        price: 45
    },
    {
        id: 'slot3',
        tutorId: '2',
        date: '2024-03-19',
        startTime: '13:00',
        endTime: '14:00',
        isAvailable: false,
        price: 55
    },
    {
        id: 'slot4',
        tutorId: '2',
        date: '2024-03-19',
        startTime: '14:00',
        endTime: '15:00',
        isAvailable: true,
        price: 55
    }
];

export const mockBookings = [
    {
        id: 'booking1',
        studentId: 'student1',
        tutorId: '1',
        slotId: 'slot1',
        subject: 'Mathematics',
        status: 'confirmed',
        notes: 'Need help with integration by parts',
        createdAt: '2024-03-12T16:45:00Z',
        scheduledAt: '2024-03-18T14:00:00Z'
    },
    {
        id: 'booking2',
        studentId: 'student1',
        tutorId: '3',
        slotId: 'slot5',
        subject: 'Chemistry',
        status: 'completed',
        notes: 'Organic chemistry reactions review',
        createdAt: '2024-03-05T10:30:00Z',
        scheduledAt: '2024-03-10T09:00:00Z'
    }
];