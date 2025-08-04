import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {supabase} from '../supabaseClient';
import {Home, LayoutDashboard, LogOut, Menu, MessageSquare, User, Users, X} from 'lucide-react';

const Navbar = () => {
    const [session, setSession] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const getSession = async () => {
            const {data: {session}} = await supabase.auth.getSession();
            setSession(session);
        };
        getSession();

        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const NavLinks = () => (
        <>
            <Link
                to="/"
                className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
                <Home size={18}/>
                <span>Home</span>
            </Link>

            <Link
                to="/dashboard"
                className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
                <LayoutDashboard size={18}/>
                <span>Dashboard</span>
            </Link>

            <Link
                to="/connections"
                className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
                <Users size={18}/>
                <span>Connections</span>
            </Link>

            <Link
                to="/messages"
                className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
                <MessageSquare size={18}/>
                <span>Messages</span>
            </Link>

            <Link
                to="/profile"
                className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
                <User size={18}/>
                <span>Profile</span>
            </Link>
        </>
    );

    return (
        <nav className="bg-gray-900 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link
                            to="/"
                            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
                        >
                            Skillogue
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        {session && <NavLinks/>}
                        {session && (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 ml-6 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition"
                            >
                                <LogOut size={18}/>
                                <span>Log Out</span>
                            </button>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-400 hover:text-white focus:outline-none"
                        >
                            {isOpen ? <X size={24}/> : <Menu size={24}/>}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden bg-gray-900 border-t border-gray-800">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {session ? (
                                <>
                                    <NavLinks/>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full text-left mt-4 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition"
                                    >
                                        <LogOut size={18}/>
                                        <span>Log Out</span>
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;