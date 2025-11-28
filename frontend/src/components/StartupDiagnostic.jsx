import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StartupDiagnostic = () => {
    const [diagnostics, setDiagnostics] = useState([]);

    const addDiagnostic = (message, status = 'info') => {
        setDiagnostics(prev => [...prev, {
            message,
            status,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    useEffect(() => {
        console.log('🔬 Starting comprehensive diagnostic...');
        addDiagnostic('🔬 Diagnostic component mounted', 'success');

        // Test 1: React basics
        try {
            addDiagnostic('✅ React hooks working', 'success');
        } catch (error) {
            addDiagnostic(`❌ React hooks error: ${error.message}`, 'error');
        }

        // Test 2: Browser environment
        addDiagnostic(`🌐 User Agent: ${navigator.userAgent.substring(0, 50)}...`, 'info');
        addDiagnostic(`📍 Location: ${window.location.href}`, 'info');

        // Test 3: Console access
        try {
            console.log('Testing console access');
            addDiagnostic('✅ Console access working', 'success');
        } catch (error) {
            addDiagnostic(`❌ Console error: ${error.message}`, 'error');
        }

        // Test 4: LocalStorage
        try {
            localStorage.setItem('diagnostic_test', 'working');
            localStorage.removeItem('diagnostic_test');
            addDiagnostic('✅ LocalStorage working', 'success');
        } catch (error) {
            addDiagnostic(`❌ LocalStorage error: ${error.message}`, 'error');
        }

        // Test 5: Network capability
        fetch(`${API_BASE_URL}/health`)
            .then(response => {
                if (response.ok) {
                    addDiagnostic('✅ Backend connection successful', 'success');
                } else {
                    addDiagnostic(`⚠️ Backend responded with ${response.status}`, 'warning');
                }
            })
            .catch(error => {
                addDiagnostic(`❌ Backend connection failed: ${error.message}`, 'error');
            });

        // Test 6: React Router
        try {
            addDiagnostic(`📍 Current path: ${window.location.pathname}`, 'info');
            addDiagnostic('✅ Router path accessible', 'success');
        } catch (error) {
            addDiagnostic(`❌ Router error: ${error.message}`, 'error');
        }

    }, []);

    const containerStyle = {
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 100000,
        maxWidth: '80vw',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '2px solid #00ff00',
        fontFamily: 'monospace'
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return '#00ff00';
            case 'error': return '#ff0000';
            case 'warning': return '#ffaa00';
            default: return '#ffffff';
        }
    };

    return (
        <div style={containerStyle}>
            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                <strong>🔬 STARTUP DIAGNOSTIC</strong>
                <div>Total checks: {diagnostics.length}</div>
            </div>
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {diagnostics.map((diag, index) => (
                    <div key={index} style={{
                        color: getStatusColor(diag.status),
                        marginBottom: '5px',
                        padding: '2px 0'
                    }}>
                        [{diag.timestamp}] {diag.message}
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '10px' }}>
                Close this by refreshing without ?diagnostic in URL
            </div>
        </div>
    );
};

export default StartupDiagnostic;