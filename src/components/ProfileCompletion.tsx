// src/components/ProfileCompletion.tsx
import React from 'react';
import Link from 'next/link';
import { Edit } from 'lucide-react';
import { componentCopy } from '../lib/app-copy';

interface ProfileCompletionProps {
    profile: {
        about_me: string | null;
        passions_count: number;
        languages_count: number;
    };
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ profile }) => {
    const suggestions: Array<{ id: string; text: string }> = [];
    if (!profile.about_me) {
        suggestions.push({ id: 'about-me', text: componentCopy.profileCompletion.addBio });
    }
    if (profile.passions_count < 3) {
        suggestions.push({ id: 'passions', text: componentCopy.profileCompletion.addPassions });
    }
    if (profile.languages_count === 0) {
        suggestions.push({ id: 'languages', text: componentCopy.profileCompletion.addLanguages });
    }

    if (suggestions.length === 0) {
        return null;
    }

    const progress = (3 - suggestions.length) / 3 * 100;

    return (
        <div className="bg-surface p-6 rounded-2xl border border-line/30">
            <h3 className="text-xl font-bold mb-3">{componentCopy.profileCompletion.title}</h3>
            <div className="w-full bg-surface-secondary rounded-full h-2.5 mb-4">
                <div className="bg-approval h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <ul className="space-y-3">
                {suggestions.map((suggestion) => (
                    <li key={suggestion.id}>
                        <Link href="/edit-profile" className="flex items-center justify-between text-sm text-muted hover:text-foreground group transition-colors">
                            <span>{suggestion.text}</span>
                            <Edit className="h-4 w-4 text-brand opacity-70 group-hover:opacity-100" />
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProfileCompletion;