// src/components/Navbar.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { Home, LayoutDashboard, LogOut, Menu, MessageSquare, Search, Settings, User, X } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import NotificationIcon from './NotificationIcon';



const Navbar: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const previousUnreadCount = useRef<number>(0);
    const router = useRouter();
    const pathname = usePathname();

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

                setUnreadCount(newCount);

                if (newCount > 0 && newCount > previousUnreadCount.current) {
                    if (!pathname?.startsWith('/messages')) {
                        // Notification logic removed
                    }
                }
                previousUnreadCount.current = newCount;
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000);

        return () => clearInterval(interval);
    }, [session, pathname]);


    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const NavLinks: React.FC = () => (
        <>
            <Link href="/" className="flex items-center gap-2 px-3 py-3 md:py-2 text-base md:text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                <Home size={18} />
                <span>Home</span>
            </Link>

            <Link href="/profile" className="flex items-center gap-2 px-3 py-3 md:py-2 text-base md:text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                <User size={18} />
                <span>Profile</span>
            </Link>

            <Link href="/search" className="flex items-center gap-2 px-3 py-3 md:py-2 text-base md:text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                <Search size={18} />
                <span>Search</span>
            </Link>

            <Link href="/dashboard" className="flex items-center gap-2 px-3 py-3 md:py-2 text-base md:text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
            </Link>
            <Link href="/messages" className="relative flex items-center gap-2 px-3 py-3 md:py-2 text-base md:text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
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

            <Link href="/settings" className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-3 md:py-2 rounded-md text-base md:text-sm font-medium transition">
                <Settings size={18} />
                <span>Settings</span>
            </Link>
        </>
    );

    return (
        <nav className="bg-gray-900 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Skillogue
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        {session && <NavLinks />}
                        {session && (
                            <>
                                <NotificationIcon /> {/* 👈 Add the new icon here */}
                                <button onClick={handleLogout} className="flex items-center gap-2 ml-4 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
                                    <LogOut size={18} />
                                    <span>Log Out</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        {session && <NotificationIcon />} {/* 👈 Also add to mobile view */}
                        <button 
                            onClick={() => setIsOpen(!isOpen)} 
                            className="ml-2 text-gray-400 hover:text-white focus:outline-none"
                            aria-label={isOpen ? "Close menu" : "Open menu"}
                            aria-expanded={isOpen}
                        >
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
                                    <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left mt-4 px-3 py-3 md:py-2 text-base md:text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition">
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
    );

};

export default Navbar;
