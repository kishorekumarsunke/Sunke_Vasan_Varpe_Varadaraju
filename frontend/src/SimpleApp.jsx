import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import TestComponent from './components/TestComponent';
import AuthDebug from './components/AuthDebug';

const SimpleApp = () => {
    console.log('🧪 SimpleApp rendering');

    return (
        <div style={{ minHeight: '100vh', background: 'black', color: 'white', padding: '20px' }}>
            <h1>🧪 Simple App Test</h1>
            <p>If you see this, the basic React structure is working.</p>

            <AuthProvider>
                <div style={{ marginTop: '20px' }}>
                    <h2>🔐 Auth Provider Test</h2>
                    <AuthDebug />
                </div>

                <Router>
                    <div style={{ marginTop: '20px' }}>
                        <h2>🌐 Router Test</h2>
                        <Routes>
                            <Route path="/" element={<div>✅ Route is working!</div>} />
                            <Route path="*" element={<div>❓ Unknown route</div>} />
                        </Routes>
                    </div>
                </Router>
            </AuthProvider>

            <TestComponent />
        </div>
    );
};

export default SimpleApp;