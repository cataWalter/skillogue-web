// src/pages/Settings.js
import React from 'react';
import { Link } from 'react-router-dom';

function Settings() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="mt-4">Manage your account, privacy, and preferences.</p>
            <Link to="/dashboard" className="text-indigo-400 hover:underline mt-6 block">
                ← Back to Dashboard
            </Link>
        </div>
    );
}

export default Settings;