import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from '../config/database.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import messageRoutes from './routes/messages.js';
import taskRoutes from './routes/tasks.js';
import tutorRoutes from './routes/tutors.js';
import bookingRoutes from './routes/booking.js';
import bookingRequestRoutes from './routes/bookingRequests.js';
import availabilityRoutes from './routes/availability.js';
import subjectRoutes from './routes/subjects.js';
import reviewRoutes from './routes/reviews.js';
import aiChatRoutes from './routes/aiChat.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    // Allow more generous limits during local development to avoid noisy 429s
    max: process.env.NODE_ENV === 'development' ? 1000 : 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001', // Add port 3001 for when 3000 is in use
        'http://localhost:4173', // Vite preview port
        'http://localhost:5173', // Vite default port
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:4173',
        'http://127.0.0.1:5173',
        'https://kishorekumarsunke.github.io',
        'https://kxs0089.uta.cloud', // UTA Cloud deployment
        'http://kxs0089.uta.cloud', // UTA Cloud HTTP
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path}`);
    next();
});

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Tutor Together API Server is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/booking', bookingRequestRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/admin', adminRoutes);

// Debug: Log all registered routes
console.log('🛣️  Registered API routes:');
console.log('   - /api/auth');
console.log('   - /api/profiles');
console.log('   - /api/messages');
console.log('   - /api/tasks');
console.log('   - /api/tutors');
console.log('   - /api/ai-chat');
console.log('   - /api/admin');
console.log('   - /api/booking');
console.log('   - /api/availability');
console.log('   - /api/subjects');
console.log('   - /api/reviews');

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Start server with database connection
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();