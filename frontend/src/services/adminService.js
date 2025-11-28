const API_BASE_URL = 'http://localhost:5000/api';

class AdminService {
    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async getDashboardStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return { success: false, message: error.message };
        }
    }

    async getTutorApplications(status = null) {
        try {
            const url = status
                ? `${API_BASE_URL}/admin/tutors/applications?status=${status}`
                : `${API_BASE_URL}/admin/tutors/applications`;

            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching tutor applications:', error);
            return { success: false, message: error.message };
        }
    }

    async getTutorApplication(tutorId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tutors/applications/${tutorId}`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching tutor application:', error);
            return { success: false, message: error.message };
        }
    }

    async updateTutorStatus(tutorId, status, notes = '') {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tutors/applications/${tutorId}/status`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ status, notes })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating tutor status:', error);
            return { success: false, message: error.message };
        }
    }

    async getAllSessions(limit = 50, offset = 0) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/sessions?limit=${limit}&offset=${offset}`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching sessions:', error);
            return { success: false, message: error.message };
        }
    }

    async getEarningsSummary() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/earnings`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching earnings summary:', error);
            return { success: false, message: error.message };
        }
    }

    async getAllUsers(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.role) params.append('role', filters.role);
            if (filters.status) params.append('status', filters.status);
            if (filters.limit) params.append('limit', filters.limit);
            if (filters.offset) params.append('offset', filters.offset);

            const url = `${API_BASE_URL}/admin/users${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            return { success: false, message: error.message };
        }
    }

    async updateUserStatus(userId, isActive, reason = '') {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ is_active: isActive, reason })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating user status:', error);
            return { success: false, message: error.message };
        }
    }
}

export const adminService = new AdminService();
