// src/components/Navbar.js
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Home, LayoutDashboard, LogOut, Menu, MessageSquare, Search, User, Users, X } from 'lucide-react';
import NotificationPopup from './NotificationPopup';

const Navbar = () => {
    const [session, setSession] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notification, setNotification] = useState(null); // { message, sender }
    const previousUnreadCount = useRef(0);
    const navigate = useNavigate();

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // --- New Feature: Fetch Unread Messages Count & Show Popup ---
    useEffect(() => {
        if (!session?.user) return;

        const fetchUnreadCount = async () => {
            const { data, error } = await supabase.rpc('get_unread_message_count', {
                current_user_id: session.user.id,
            });

            if (error) {
                console.error('Error fetching unread count:', error);
                return;
            }

            if (data && data.length > 0) {
                const newCount = data[0].unread_count;
                const newLastMessage = data[0].last_message;
                const newSender = data[0].full_name;

                setUnreadCount(newCount);

                // If new messages have arrived since the last check, show a notification
                if (newCount > 0 && newCount > previousUnreadCount.current) {
                    // Don't show popup if user is already on the messages page
                    if (!window.location.pathname.startsWith('/messages')) {
                        setNotification({ message: newLastMessage, sender: newSender });
                    }
                }
                previousUnreadCount.current = newCount;
            }
        };

        fetchUnreadCount(); // Initial fetch
        const interval = setInterval(fetchUnreadCount, 15000); // Poll every 15 seconds

        return () => clearInterval(interval);
    }, [session]);


    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const NavLinks = () => (
        <>
            <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                <Home size={18} />
                <span>Home</span>
            </Link>

            <Link to="/search" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                <Search size={18} />
                <span>Search</span>
            </Link>

            <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
            </Link>
            <Link to="/connections" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                <Users size={18} />
                <span>Connections</span>
            </Link>
            {/* Updated Messages Link with Badge */}
            <Link to="/messages" className="relative flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                <MessageSquare size={18} />
                <span>Messages</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 justify-center items-center text-xs">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </Link>

            <Link to="/profile" className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                <User size={18} />
                <span>Profile</span>
            </Link>
        </>
    );

    return (
        <>
            <nav className="bg-gray-900 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Skillogue
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex md:items-center md:space-x-4">
                            {session && <NavLinks />}
                            {session && (
                                <button onClick={handleLogout} className="flex items-center gap-2 ml-6 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                                    <LogOut size={18} />
                                    <span>Log Out</span>
                                </button>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center md:hidden">
                            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white focus:outline-none">
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isOpen && (
                        <div className="md:hidden bg-gray-900 border-t border-gray-800">
                            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                                {session ? (
                                    <>
                                        <NavLinks />
                                        <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left mt-4 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                                            <LogOut size={18} />
                                            <span>Log Out</span>
                                        </button>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </nav>
            {notification && (
                <NotificationPopup
                    message={notification.message}
                    sender={notification.sender}
                    onClose={() => setNotification(null)}
                />
            )}
        </>
    );
};

export default Navbar;