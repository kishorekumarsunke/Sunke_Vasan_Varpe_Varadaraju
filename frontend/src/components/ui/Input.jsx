import React from 'react';
import './Input.css';

const Input = ({
    label,
    error,
    helperText,
    className = '',
    ...props
}) => {
    return (
        <div className="input-wrapper">
            {label && (
                <label className="input-label">
                    {label}
                </label>
            )}
            <input
                className={`input-field input-field-base ${error ? 'input-error' : ''} ${className}`}
                {...props}
            />
            {error && (
                <p className="input-error-text">{error}</p>
            )}
            {helperText && !error && (
                <p className="input-helper-text">{helperText}</p>
            )}
        </div>
    );
};

export default Input;