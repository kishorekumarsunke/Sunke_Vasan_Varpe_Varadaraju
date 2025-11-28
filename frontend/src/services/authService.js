// API Base URL - change this for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API client configuration
class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            // For validation errors (400), return the data instead of throwing
            if (!response.ok) {
                if (response.status === 400 && data.errors) {
                    // Return validation errors instead of throwing
                    return {
                        success: false,
                        message: data.message,
                        errors: data.errors
                    };
                }
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.error('Network error:', error);
                return {
                    success: false,
                    message: 'Network error. Please check your connection.',
                };
            }
            console.error('API request failed:', error);
            throw error;
        }
    }

    get(endpoint, options = {}) {
        return this.request(endpoint, { method: 'GET', ...options });
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            ...options,
        });
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
            ...options,
        });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { method: 'DELETE', ...options });
    }
}

const apiClient = new APIClient();

// Authentication Service
export const authService = {
    async register(userData) {
        const response = await apiClient.post('/auth/register', userData);

        if (response.success && response.data && response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            // Return the user and token at the top level for consistency
            return {
                success: true,
                user: response.data.user,
                token: response.data.token,
                message: response.message
            };
        }

        return response;
    },

    async login(credentials) {
        const response = await apiClient.post('/auth/login', credentials);

        if (response.success && response.data && response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            // Return the user and token at the top level for consistency
            return {
                success: true,
                user: response.data.user,
                token: response.data.token,
                message: response.message
            };
        }

        return response;
    },

    async logout() {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    async getProfile() {
        return await apiClient.get('/auth/profile');
    },

    async updateProfile(profileData) {
        return await apiClient.put('/auth/profile', profileData);
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        try {
            // Check if token is expired (basic check)
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch (error) {
            return false;
        }
    }
};

export default apiClient;