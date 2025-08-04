// src/pages/Messages.js
import React from 'react';
import { Link } from 'react-router-dom';

const Messages = () => {
    // Mock data (replace with Supabase later)
    const conversations = [
        { id: 1, name: 'Alex Rivera', lastMessage: 'Hey, loved your passion for photography!', time: '2m ago' },
        { id: 2, name: 'Sam Chen', lastMessage: 'Let’s collab on that music project!', time: '1h ago' },
        { id: 3, name: 'Jordan Lee', lastMessage: 'Same! I’ve been learning React too.', time: '5h ago' },
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <h1 className="text-3xl font-bold mb-6">Messages</h1>

            {conversations.length === 0 ? (
                <p className="text-gray-400">No messages yet.</p>
            ) : (
                <ul className="space-y-4">
                    {conversations.map((conv) => (
                        <li key={conv.id} className="bg-gray-900 p-4 rounded-lg hover:bg-gray-800 transition">
                            <Link to={`/chat/${conv.id}`} className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold">{conv.name}</h3>
                                    <p className="text-gray-300 text-sm truncate w-64">{conv.lastMessage}</p>
                                </div>
                                <span className="text-xs text-gray-500">{conv.time}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <Link to="/dashboard" className="text-indigo-400 hover:underline mt-6 block">
                ← Back to Dashboard
            </Link>
        </div>
    );
};

export default Messages;