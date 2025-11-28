import React from 'react';

const TestComponent = () => {
    console.log('🧪 TestComponent is rendering');

    return (
        <div style={{
            position: 'fixed',
            top: '100px',
            left: '10px',
            background: 'green',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            zIndex: 99999,
            border: '3px solid yellow'
        }}>
            <h3>🧪 TEST COMPONENT</h3>
            <div>If you see this, React is working!</div>
            <div>Current Time: {new Date().toLocaleTimeString()}</div>
        </div>
    );
};

export default TestComponent;