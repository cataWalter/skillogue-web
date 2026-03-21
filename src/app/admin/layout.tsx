'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, FileText, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            // In a real implementation, you would fetch the user's role from the database
            // For now, we'll just check if the user is logged in
            // You could add an admin check via an API call
            
            // Mock: Check if user email ends with @admin.com (for demo purposes)
            const isAdminUser = user.email?.endsWith('@admin.com') || user.email?.includes('admin');
            
            if (!isAdminUser) {
                router.push('/');
                return;
            }

            setIsAdmin(true);
            setLoading(false);
        };

        checkAdmin();
    }, [user, router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Checking permissions...</div>;

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-800 p-6 hidden md:block sticky top-0 h-screen">
                <div className="flex items-center gap-2 mb-8 text-indigo-400 font-bold text-xl">
                    <Shield /> Admin Panel
                </div>
                <nav className="space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition text-gray-300 hover:text-white">
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link href="/admin/verification" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition text-gray-300 hover:text-white">
                        <Users size={20} /> Verifications
                    </Link>
                    <Link href="/admin/reports" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition text-gray-300 hover:text-white">
                        <FileText size={20} /> Reports
                    </Link>
                </nav>
            </aside>
            
            <main className="flex-grow p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}