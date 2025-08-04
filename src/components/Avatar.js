// src/components/Avatar.js
import React, { useState, useEffect } from 'react';
import { createAvatar } from '@dicebear/core';
// Import a variety of collections from DiceBear
import {
    adventurer,
    bottts,
    micah,
    miniavs,
    openPeeps,
    personas,
    pixelArt,
    thumbs
} from '@dicebear/collection';

// Create an array of the available avatar styles
const avatarCollections = [
    adventurer,
    bottts,
    micah,
    miniavs,
    openPeeps,
    personas,
    pixelArt,
    thumbs
];

const Avatar = ({ seed, className }) => {
    const [avatarSvg, setAvatarSvg] = useState('');

    useEffect(() => {
        // A simple hashing function to convert the seed string into a number.
        // This ensures the same seed always produces the same hash, and thus the same avatar style.
        const getHash = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash |= 0; // Convert to 32bit integer
            }
            return Math.abs(hash);
        };

        const generateAvatar = async () => {
            // Deterministically select a collection from the array based on the seed
            const collectionIndex = getHash(seed) % avatarCollections.length;
            const selectedCollection = avatarCollections[collectionIndex];

            const avatar = await createAvatar(selectedCollection, {
                seed: seed,
                radius: 50, // To make it circular
                backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
            });

            const dataUri = await avatar.toDataUri();
            setAvatarSvg(dataUri);
        };

        if (seed) {
            generateAvatar();
        }
    }, [seed]); // Re-run the effect whenever the seed changes

    // Display a placeholder while the avatar is generating
    if (!avatarSvg) {
        return (
            <div
                className={className || 'w-12 h-12 rounded-full bg-gray-700 animate-pulse'}
                aria-label="Loading avatar"
            />
        );
    }

    return (
        <img
            src={avatarSvg}
            alt="User Avatar"
            className={className || 'w-12 h-12 rounded-full object-cover'}
        />
    );
};

export default Avatar;