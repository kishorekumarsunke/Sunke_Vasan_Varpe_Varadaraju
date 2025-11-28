import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({
    progress,
    className = '',
    showPercentage = true,
    size = 'md',
    color = 'primary'
}) => {
    const sizeClasses = {
        sm: 'progress-sm',
        md: 'progress-md',
        lg: 'progress-lg'
    };

    const colorClasses = {
        primary: 'progress-primary',
        secondary: 'progress-secondary',
        success: 'progress-success',
        warning: 'progress-warning'
    };

    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className={`progress-wrapper ${className}`}>
            {showPercentage && (
                <div className="progress-labels">
                    <span className="progress-label-text">Progress</span>
                    <span className="progress-percentage">{clampedProgress}%</span>
                </div>
            )}
            <div className={`progress-track ${sizeClasses[size]}`}>
                <div
                    className={`progress-fill ${sizeClasses[size]} ${colorClasses[color]}`}
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;