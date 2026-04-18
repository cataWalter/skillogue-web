import React from 'react';

interface SkeletonProps {
    className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={`animate-pulse rounded bg-gradient-to-r from-surface-secondary via-surface to-surface-secondary shadow-glass-sm ${className}`} />
    );
};

export default Skeleton;
