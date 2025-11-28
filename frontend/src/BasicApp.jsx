import React from 'react';

// Basic fallback that should work in any browser
const BasicApp = () => {
    const handleTest = () => {
        console.log('Button clicked - JavaScript is working');
        alert('JavaScript is working in this browser!');
    };

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f0f0f0',
            minHeight: '100vh'
        }}>
            <h1>Tutor Together - Basic Mode</h1>
            <p>This is a minimal fallback version to test browser compatibility.</p>

            <button
                onClick={handleTest}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '10px'
                }}
            >
                Test JavaScript
            </button>

            <div style={{ marginTop: '20px' }}>
                <h2>Debug Information</h2>
                <p>Current URL: {window.location.href}</p>
                <p>User Agent: {navigator.userAgent}</p>
                <p>Current Time: {new Date().toLocaleString()}</p>
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e6f3ff' }}>
                    <h3>Chrome Troubleshooting Steps:</h3>
                    <ol>
                        <li>Open Chrome DevTools (F12)</li>
                        <li>Check Console tab for errors (red text)</li>
                        <li>Check Network tab for failed requests</li>
                        <li>Try opening in Incognito mode</li>
                        <li>Clear browser cache and cookies</li>
                        <li>Disable browser extensions</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default BasicApp;