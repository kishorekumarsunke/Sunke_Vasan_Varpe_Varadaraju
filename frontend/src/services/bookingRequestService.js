import apiService from './apiService';

export const bookingRequestService = {
    // Create a new booking request
    createBookingRequest: async (requestData) => {
        try {
            const response = await apiService.post('/booking/requests', requestData);
            return response;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get student's booking requests
    getStudentBookingRequests: async (status = null, limit = 10, offset = 0) => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            params.append('limit', limit);
            params.append('offset', offset);

            const response = await apiService.get(`/booking/student/requests?${params}`);
            return response;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get tutor's booking requests
    getTutorBookingRequests: async (status = 'pending', limit = 10, offset = 0) => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            params.append('limit', limit);
            params.append('offset', offset);

            const response = await apiService.get(`/booking/tutor/requests?${params}`);
            return response;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Respond to a booking request (tutor only)
    respondToBookingRequest: async (requestId, action, responseMessage = '') => {
        try {
            const response = await apiService.put(`/booking/requests/${requestId}/respond`, {
                action, // 'approve' or 'decline'
                responseMessage
            });
            return response;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get booking request details
    getBookingRequestDetails: async (requestId) => {
        try {
            const response = await apiService.get(`/booking/requests/${requestId}`);
            return response;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default bookingRequestService;