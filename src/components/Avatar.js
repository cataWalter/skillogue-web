// src/components/Avatar.js
import React, { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

const Avatar = ({ seed, className }) => {
    const avatarSvg = useMemo(() => {
        const avatar = createAvatar(adventurer, {
            seed: seed, // A unique string, like a user ID, to generate a consistent avatar
            radius: 50, // To make it circular
            backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
        });
        return avatar.toDataUriSync();
    }, [seed]);

    return (
        <img
            src={avatarSvg}
            alt="User Avatar"
            className={className || 'w-12 h-12 rounded-full object-cover'}
        />
    );
};

export default Avatar;