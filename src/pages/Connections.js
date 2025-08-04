// src/pages/Connections.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { User, MessageCircle, X } from 'lucide-react';

const Connections = () => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadConnections = async () => {
            // Get the current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch the user's connections (profiles they are connected to)
            // This assumes a table like 'connections' with 'user_id' and 'connected_user_id'
            const { data, error } = await supabase
                .from('connections')
                .select(`
          connected_user_id,
          profiles!connections_connected_user_id_fkey (id, full_name, avatar_url, passions (name))
        `)
                .eq('user_id', user.id)
                .eq('status', 'accepted'); // Assuming a 'status' field for pending/accepted

            if (error) {
                console.error('Error loading connections:', error);
            } else {
                // Map the data to a simpler format
                const formattedConnections = data.map(conn => ({
                    id: conn.connected_user_id,
                    name: conn.profiles.full_name,
                    avatar: conn.profiles.avatar_url,
                    passions: conn.profiles.passions?.map(p => p.name) || []
                }));
                setConnections(formattedConnections);
            }
            setLoading(false);
        };

        loadConnections();
    }, []);

    const handleDisconnect = async (connectedUserId) => {
        // This is a simplified example. In a real app, you might want to update the 'connections' table.
        // For now, we'll just filter it from the local state.
        if (window.confirm('Are you sure you want to disconnect?')) {
            setConnections(prev => prev.filter(conn => conn.id !== connectedUserId));

            // Optional: Add Supabase call to update the database
            // await supabase.from('connections').delete().match({ user_id: currentUserId, connected_user_id: connectedUserId });
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-black text-white p-8">Loading connections...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Your Connections</h1>

                {connections.length === 0 ? (
                    <p className="text-gray-400">You haven't connected with anyone yet. Start searching for new friends!</p>
                ) : (
                    <div className="space-y-4">
                        {connections.map((connection) => (
                            <div
                                key={connection.id}
                                className="bg-gray-900/70 p-6 rounded-xl border border-gray-800 flex items-center justify-between hover:bg-gray-800/70 transition-all duration-200"
                            >
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={connection.avatar || 'https://via.placeholder.com/50'}
                                        alt={connection.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
                                    />
                                    <div>
                                        <h3 className="text-xl font-semibold">{connection.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {connection.passions.slice(0, 3).map((passion, idx) => (
                                                <span
                                                    key={idx}
                                                    className="bg-indigo-600/30 text-indigo-300 text-xs px-2 py-1 rounded-full"
                                                >
                          {passion}
                        </span>
                                            ))}
                                            {connection.passions.length > 3 && (
                                                <span className="text-gray-500 text-xs">+{connection.passions.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-4">
                                    <Link
                                        to={`/messages?with=${connection.id}`}
                                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                        aria-label={`Message ${connection.name}`}
                                    >
                                        <MessageCircle className="h-6 w-6" />
                                    </Link>
                                    <button
                                        onClick={() => handleDisconnect(connection.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                        aria-label={`Disconnect from ${connection.name}`}
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Link to="/search" className="text-indigo-400 hover:underline mt-8 block">
                    ← Find More Connections
                </Link>
            </div>
        </div>
    );
};

export default Connections;