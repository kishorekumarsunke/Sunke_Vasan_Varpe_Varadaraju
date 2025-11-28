import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BrowserDebug = () => {
    const [apiTest, setApiTest] = useState('Testing...');
    const [storageTest, setStorageTest] = useState('Testing...');
    const [networkTest, setNetworkTest] = useState('Testing...');

    useEffect(() => {
        console.log('🌐 BrowserDebug - Testing browser compatibility');

        // Test localStorage
        try {
            localStorage.setItem('test', 'working');
            const testValue = localStorage.getItem('test');
            setStorageTest(testValue === 'working' ? '✅ Working' : '❌ Failed');
            localStorage.removeItem('test');
        } catch (error) {
            setStorageTest(`❌ Error: ${error.message}`);
        }

        // Test API connection
        const testAPI = async () => {
            try {
                console.log(`🔗 Testing API connection to ${API_BASE_URL}`);
                const response = await fetch(`${API_BASE_URL}/auth/test`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    setApiTest('✅ Backend reachable');
                } else {
                    setApiTest(`❌ Backend error: ${response.status}`);
                }
            } catch (error) {
                console.error('🚨 API test error:', error);
                setApiTest(`❌ Network Error: ${error.message}`);
            }
        };

        testAPI();

        // Test general network
        const testNetwork = async () => {
            try {
                // Test if we can reach any external endpoint
                const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
                if (response.ok) {
                    setNetworkTest('✅ Network OK');
                } else {
                    setNetworkTest('❌ Network issues');
                }
            } catch (error) {
                setNetworkTest(`❌ Network Error: ${error.message}`);
            }
        };

        testNetwork();
    }, []);

    const debugStyle = {
        position: 'fixed',
        top: '200px',
        left: '10px',
        background: 'blue',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 99998,
        maxWidth: '400px',
        border: '2px solid cyan',
        fontFamily: 'monospace'
    };

    return (
        <div style={debugStyle}>
            <div><strong>🌐 BROWSER DEBUG</strong></div>
            <div>Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}</div>
            <div>LocalStorage: {storageTest}</div>
            <div>Backend API: {apiTest}</div>
            <div>Network: {networkTest}</div>
            <div>URL: {window.location.href}</div>
            <div>Origin: {window.location.origin}</div>
        </div>
    );
};

export default BrowserDebug;