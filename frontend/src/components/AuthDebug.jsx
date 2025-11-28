import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebug = () => {
    try {
        const { user, isAuthenticated, loading } = useAuth();

        console.log('🐛 AuthDebug render:', { user, isAuthenticated, loading });

        const debugStyle = {
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'red',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '14px',
            zIndex: 99999,
            maxWidth: '400px',
            border: '2px solid white',
            fontFamily: 'monospace'
        };

        if (loading) {
            return (
                <div style={debugStyle}>
                    <div><strong>🔄 AUTH DEBUG - LOADING</strong></div>
                    <div>State: Loading auth...</div>
                </div>
            );
        }

        return (
            <div style={debugStyle}>
                <div><strong>🐛 AUTH DEBUG</strong></div>
                <div>📊 Authenticated: {isAuthenticated ? '✅ YES' : '❌ NO'}</div>
                <div>👤 User Object: {user ? 'EXISTS' : 'NULL'}</div>
                {user && (
                    <>
                        <div>📧 Email: {user.email || 'N/A'}</div>
                        <div>🎭 Role: {user?.role || user?.account_type || 'N/A'}</div>
                        <div>📛 Name: {user?.name || user?.full_name || user?.username || 'N/A'}</div>
                        <div>🆔 ID: {user.id || 'N/A'}</div>
                    </>
                )}
                <div>🔑 Token: {localStorage.getItem('token') ? 'PRESENT' : 'MISSING'}</div>
                <div>🌐 Location: {window.location.pathname}</div>
            </div>
        );
    } catch (error) {
        console.error('🚨 AuthDebug Error:', error);
        return (
            <div style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background: 'red',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '14px',
                zIndex: 99999,
                border: '2px solid white'
            }}>
                <div><strong>🚨 AUTH DEBUG ERROR</strong></div>
                <div>Error: {error.message}</div>
            </div>
        );
    }
};

export default AuthDebug;