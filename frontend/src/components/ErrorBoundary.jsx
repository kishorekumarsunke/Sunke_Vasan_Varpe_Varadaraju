import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        console.log('🚨 ErrorBoundary - getDerivedStateFromError:', error);
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error safely
        console.error('🚨 ErrorBoundary caught an error:', error);
        console.error('🚨 ErrorBoundary errorInfo:', errorInfo);

        // Safely set state
        this.setState({
            error: error || new Error('Unknown error'),
            errorInfo: errorInfo || { componentStack: 'No stack trace available' }
        });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'red',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    maxWidth: '80%',
                    zIndex: 99999,
                    textAlign: 'center'
                }}>
                    <h2>🚨 Something went wrong!</h2>
                    <details>
                        <summary>Error Details (click to expand)</summary>
                        <div style={{ textAlign: 'left', marginTop: '10px' }}>
                            <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
                            <p><strong>Component Stack:</strong></p>
                            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack ? this.state.errorInfo.componentStack : 'No component stack available'}</pre>
                        </div>
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '10px',
                            padding: '10px 20px',
                            background: 'white',
                            color: 'red',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;