import React, { useState } from 'react';
import './Input.css';

const Input = ({
    label,
    error,
    helperText,
    className = '',
    type = 'text',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="input-wrapper">
            {label && (
                <label className="input-label">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={isPasswordField ? (showPassword ? 'text' : 'password') : type}
                    className={`input-field input-field-base ${error ? 'input-error' : ''} ${isPasswordField ? 'pr-12' : ''} ${className}`}
                    {...props}
                />
                {isPasswordField && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            // Eye-off icon (password visible)
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        ) : (
                            // Eye icon (password hidden)
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        )}
                    </button>
                )}
            </div>
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