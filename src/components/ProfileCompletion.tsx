// src/components/ProfileCompletion.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Edit } from 'lucide-react';

interface ProfileCompletionProps {
    profile: {
        about_me: string | null;
        passions_count: number;
        languages_count: number;
    };
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ profile }) => {
    const suggestions = [];
    if (!profile.about_me) {
        suggestions.push({ text: 'Add a bio to tell people about yourself.' });
    }
    if (profile.passions_count < 3) {
        suggestions.push({ text: 'Add more passions to find better connections.' });
    }
    if (profile.languages_count === 0) {
        suggestions.push({ text: 'Add the languages you speak.' });
    }

    if (suggestions.length === 0) {
        return null;
    }

    const progress = (3 - suggestions.length) / 3 * 100;

    return (
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold mb-3">Complete Your Profile</h3>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <ul className="space-y-3">
                {suggestions.map((suggestion, index) => (
                    <li key={index}>
                        <Link to="/edit-profile" className="flex items-center justify-between text-sm text-gray-300 hover:text-white group transition-colors">
                            <span>{suggestion.text}</span>
                            <Edit className="h-4 w-4 text-indigo-400 opacity-70 group-hover:opacity-100" />
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProfileCompletion;