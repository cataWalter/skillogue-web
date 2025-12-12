// src/components/Avatar.tsx
import React, { useEffect, useState } from 'react';
import { createAvatar } from '@dicebear/core';

// Import collections
import {
    adventurer,
    bottts,
    micah,
    miniavs,
    openPeeps,
    personas,
    pixelArt,
    thumbs,
} from '@dicebear/collection';

// Define a common type for the collections
import type { Options as CoreOptions } from '@dicebear/core';

// Define Props Type
interface AvatarProps {
    seed: string;
    className?: string;
    alt?: string;
}

const Avatar: React.FC<AvatarProps> = ({ seed, className, alt }) => {
    const [avatarSvg, setAvatarSvg] = useState<string>('');

    useEffect(() => {
        const getHash = (str: string): number => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash |= 0; // Convert to 32bit integer
            }
            return Math.abs(hash);
        };

        const generateAvatar = async () => {
            // Hash the seed to select a consistent collection
            const collectionIndex = getHash(seed) % avatarCollections.length;
            const selectedCollection = avatarCollections[collectionIndex];

            try {
                // ✅ Use type assertion here to resolve the type conflict
                const avatar = await createAvatar(selectedCollection as unknown as Parameters<typeof createAvatar>[0], {
                    seed: seed,
                    radius: 50,
                    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
                });

                const dataUri = await avatar.toDataUri();
                setAvatarSvg(dataUri);
            } catch (error) {
                console.error('Failed to generate avatar:', error);
            }
        };

        if (seed) {
            generateAvatar();
        }
    }, [seed]);

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
            alt={alt || "User Avatar"}
            className={className || 'w-12 h-12 rounded-full object-cover'}
        />
    );
};

// ✅ Fix: Use a type that allows any of the collections
const avatarCollections = [
    adventurer,
    bottts,
    micah,
    miniavs,
    openPeeps,
    personas,
    pixelArt,
    thumbs,
] as const; // 'as const' helps TypeScript treat it as a tuple of specific types

export default Avatar;