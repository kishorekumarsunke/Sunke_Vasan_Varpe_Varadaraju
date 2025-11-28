import React from 'react';
import { Container, Button } from '../components/ui';
import { Link } from 'react-router-dom';

const ErrorPage = () => {
    return (
        <Container className="py-20">
            <div className="text-center">
                <div className="text-8xl mb-8">🔍</div>
                <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
                <p className="text-gray-400 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link to="/">
                    <Button>Return Home</Button>
                </Link>
            </div>
        </Container>
    );
};

export default ErrorPage;