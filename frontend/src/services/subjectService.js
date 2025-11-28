import apiService from './apiService';

export const subjectService = {
    async getSubjects() {
        try {
            const response = await apiService.get('/subjects');
            return response;
        } catch (error) {
            console.error('Error fetching subjects:', error);
            throw error;
        }
    },

    async getSubjectsByCategory() {
        try {
            const response = await apiService.get('/subjects/by-category');
            return response;
        } catch (error) {
            console.error('Error fetching subjects by category:', error);
            throw error;
        }
    },

    async createSubject(subject) {
        try {
            const response = await apiService.post('/subjects', subject);
            return response;
        } catch (error) {
            console.error('Error creating subject:', error);
            throw error;
        }
    },

    async updateSubject(id, updates) {
        try {
            const response = await apiService.put(`/subjects/${id}`, updates);
            return response;
        } catch (error) {
            console.error('Error updating subject:', error);
            throw error;
        }
    },

    async deleteSubject(id) {
        try {
            const response = await apiService.delete(`/subjects/${id}`);
            return response;
        } catch (error) {
            console.error('Error deleting subject:', error);
            throw error;
        }
    }
};