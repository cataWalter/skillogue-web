// src/pages/Settings.js
import React from 'react';
import {Link} from 'react-router-dom';

const Settings = () => {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold">⚙️ Settings</h1>
            <p className="mt-4 text-gray-300">Manage your account, privacy, and notification preferences.</p>

            <div className="mt-8 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Account</h2>
                    <p className="text-gray-400">Change email, password, or delete account.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold">Privacy</h2>
                    <p className="text-gray-400">Control who can see your profile and message you.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold">Notifications</h2>
                    <p className="text-gray-400">Manage email and in-app alerts.</p>
                </div>
            </div>

            <Link to="/dashboard" className="text-indigo-400 hover:underline mt-8 block">
                ← Back to Dashboard
            </Link>
        </div>
    );
};

export default Settings;