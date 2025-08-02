// src/components/Avatar.tsx

import React from 'react';

// Simple hashing function to get a number from a string
const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

// Generate a color from the hash
const hashToColor = (hash: number): string => {
    // A set of vibrant, good-looking colors
    const colors = [
        '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
        '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
        '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
    ];
    return colors[hash % colors.length];
};

interface AvatarProps {
    email: string;
    size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ email, size = 48 }) => {
    if (!email) {
        // Fallback for cases where email might be null
        return <div style={{ width: size, height: size }} className="rounded-full bg-gray-300" />;
    }

    const hash = simpleHash(email);
    const color = hashToColor(hash);
    const initial = email.charAt(0).toUpperCase();

    return (
        <div
            style={{
                width: size,
                height: size,
                backgroundColor: color,
            }}
            className="rounded-full flex items-center justify-center font-bold text-white"
        >
            {initial}
        </div>
    );
};

export default Avatar;