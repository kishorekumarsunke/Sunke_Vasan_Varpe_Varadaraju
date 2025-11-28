import adminService from '../services/adminService.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const stats = await adminService.getDashboardStats();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
};

// Get tutor applications
export const getTutorApplications = async (req, res) => {
    try {
        const { status } = req.query;
        const applications = await adminService.getTutorApplications(status);

        res.status(200).json({
            success: true,
            data: applications
        });
    } catch (error) {
        console.error('Error in getTutorApplications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tutor applications',
            error: error.message
        });
    }
};

// Get single tutor application
export const getTutorApplication = async (req, res) => {
    try {
        const { tutorId } = req.params;
        const application = await adminService.getTutorApplication(tutorId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Tutor application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('Error in getTutorApplication:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tutor application',
            error: error.message
        });
    }
};

// Approve or reject tutor
export const updateTutorStatus = async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { status, notes } = req.body;
        const adminId = req.user.userId;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be approved, rejected, or pending'
            });
        }

        const result = await adminService.updateTutorStatus(tutorId, status, adminId, notes);

        res.status(200).json({
            success: true,
            data: result,
            message: `Tutor application ${status} successfully`
        });
    } catch (error) {
        console.error('Error in updateTutorStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update tutor status',
            error: error.message
        });
    }
};

// Get all sessions
export const getAllSessions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const result = await adminService.getAllSessions(limit, offset);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in getAllSessions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sessions',
            error: error.message
        });
    }
};

// Get earnings summary
export const getEarningsSummary = async (req, res) => {
    try {
        const summary = await adminService.getEarningsSummary();

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error in getEarningsSummary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch earnings summary',
            error: error.message
        });
    }
};

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const { role, status } = req.query;
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        const users = await adminService.getAllUsers({ role, status, limit, offset });

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

// Update user status (suspend/activate)
export const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_active, reason } = req.body;
        const adminId = req.user.userId;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'is_active must be a boolean value'
            });
        }

        const result = await adminService.updateUserStatus(userId, is_active, adminId, reason);

        res.status(200).json({
            success: true,
            data: result,
            message: `User ${is_active ? 'activated' : 'suspended'} successfully`
        });
    } catch (error) {
        console.error('Error in updateUserStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
};
