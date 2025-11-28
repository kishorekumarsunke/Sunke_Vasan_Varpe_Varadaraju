// API Configuration - Use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Create axios-like interface
const apiService = {
    async get(endpoint) {
        const token = getAuthToken();
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        console.log(`🌐 Making GET request to: ${fullUrl}`);

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        console.log('📥 GET Response status:', response.status);

        if (!response.ok) {
            console.error('❌ GET Response not ok:', response.status, response.statusText);
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw { response: { data: error, status: response.status } };
        }

        const responseData = await response.json();
        console.log('✅ GET Success response:', responseData);
        return responseData; // Return the data directly, not wrapped
    },

    async post(endpoint, data) {
        const token = getAuthToken();
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        console.log(`🌐 Making POST request to: ${fullUrl}`);
        console.log('📤 Request data:', data);

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(data)
        });

        console.log('📥 Response status:', response.status);
        console.log('📥 Response ok:', response.ok);

        if (!response.ok) {
            console.error('❌ Response not ok:', response.status, response.statusText);
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw { response: { data: error, status: response.status } };
        }

        const responseData = await response.json();
        console.log('✅ Success response:', responseData);
        return responseData; // Return the data directly, not wrapped
    },

    async put(endpoint, data) {
        const token = getAuthToken();
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        console.log(`🌐 Making PUT request to: ${fullUrl}`);
        console.log('📤 Request data:', data);

        const response = await fetch(fullUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(data)
        });

        console.log('📥 PUT Response status:', response.status);

        if (!response.ok) {
            console.error('❌ PUT Response not ok:', response.status, response.statusText);
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw { response: { data: error, status: response.status } };
        }

        const responseData = await response.json();
        console.log('✅ PUT Success response:', responseData);
        return responseData; // Return the data directly, not wrapped
    },

    async delete(endpoint) {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw { response: { data: error } };
        }

        return { data: await response.json() };
    }
};

export default apiService;