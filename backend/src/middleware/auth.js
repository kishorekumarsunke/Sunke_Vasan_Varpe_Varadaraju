import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and adds user data to request
 */
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err.message);

            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid token',
                    code: 'INVALID_TOKEN'
                });
            }

            return res.status(403).json({
                success: false,
                message: 'Token verification failed'
            });
        }

        // Add user data to request
        req.user = user;
        next();
    });
};

/**
 * Optional Authentication Middleware
 * Adds user data if token is present, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
};

/**
 * Role-based Authorization Middleware
 * Requires specific user roles
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                required: roles,
                current: req.user.role
            });
        }

        next();
    };
};

/**
 * Admin Authorization Middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Tutor Authorization Middleware
 */
export const requireTutor = requireRole('tutor', 'admin');

/**
 * Student Authorization Middleware
 */
export const requireStudent = requireRole('student', 'admin');