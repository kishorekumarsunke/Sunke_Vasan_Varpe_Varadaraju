import React from 'react';
import { Container } from '../components/ui';

const UnauthorizedPage = () => {
    return (
        <Container className="py-20">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
                <p className="text-gray-400 mb-8">
                    You don't have permission to access this page.
                </p>
                <a
                    href="/"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Go to Home
                </a>
            </div>
        </Container>
    );
};

export default UnauthorizedPage;