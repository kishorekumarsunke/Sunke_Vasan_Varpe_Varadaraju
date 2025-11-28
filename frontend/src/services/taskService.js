import apiService from './apiService';

export const taskService = {
    async getTasks() {
        try {
            const response = await apiService.get('/tasks');
            return response;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    },

    async createTask(task) {
        try {
            const payload = {
                title: task.title,
                description: task.description,
                subject: task.subject,
                priority: task.priority,
                estimatedTime: task.estimatedTime,
                dueDate: task.due
            };
            const response = await apiService.post('/tasks', payload);
            return response;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    async updateTask(id, updates) {
        try {
            const payload = {
                title: updates.title,
                description: updates.description,
                subject: updates.subject,
                priority: updates.priority,
                estimatedTime: updates.estimatedTime,
                dueDate: updates.due,
                status: updates.status,
                progress: updates.progress
            };
            const response = await apiService.put(`/tasks/${id}`, payload);
            return response;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    },

    async deleteTask(id) {
        try {
            const response = await apiService.delete(`/tasks/${id}`);
            return response;
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }
};