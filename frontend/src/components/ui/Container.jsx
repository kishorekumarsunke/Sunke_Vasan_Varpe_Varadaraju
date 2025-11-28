import React from 'react';
import './Container.css';

const Container = ({
    children,
    className = '',
    maxWidth = 'lg'
}) => {
    const maxWidthClasses = {
        sm: 'container-sm',
        md: 'container-md',
        lg: 'container-lg',
        xl: 'container-xl',
        '2xl': 'container-2xl',
        full: 'container-full'
    };

    return (
        <div className={`container-base ${maxWidthClasses[maxWidth]} ${className}`}>
            {children}
        </div>
    );
};

export default Container;