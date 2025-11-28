import React from 'react';
import './Button.css';

const Button = ({
    variant = 'primary',
    size = 'md',
    children,
    loading = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseClasses = 'button-base';

    const variants = {
        primary: 'button-primary',
        secondary: 'button-secondary',
        outline: 'button-outline'
    };

    const sizes = {
        sm: 'button-sm',
        md: 'button-md',
        lg: 'button-lg'
    };

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
        <button
            className={classes}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="button-loading">
                    <div className="button-spinner"></div>
                    Loading...
                </div>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;