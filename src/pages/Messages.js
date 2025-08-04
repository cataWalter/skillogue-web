// src/pages/Messages.js
import React from 'react';
import { Link } from 'react-router-dom';

function Messages() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="mt-4">Your private conversations will appear here.</p>
            <Link to="/dashboard" className="text-indigo-400 hover:underline mt-6 block">
                ← Back to Dashboard
            </Link>
        </div>
    );
}

export default Messages;