'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, FileText, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { adminCopy } from '../../lib/app-copy';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (authLoading) {
            return;
        }

        const checkAdmin = () => {
            if (!user) {
                router.replace('/login');
                return;
            }

            // In a real implementation, you would fetch the user's role from the database
            // For now, we'll just check if the user is logged in
            // You could add an admin check via an API call
            
            // Mock: Check if user email ends with @admin.com (for demo purposes)
            const isAdminUser = user.email?.endsWith('@admin.com') || user.email?.includes('admin');
            
            if (!isAdminUser) {
                router.replace('/');
                return;
            }

            setIsAdmin(true);
        };

        checkAdmin();
    }, [authLoading, user, router]);

    if (authLoading) return <div>{adminCopy.layout.loading}</div>;
    if (!isAdmin) return null;

    return (
        <div className="flex">
            <aside className="w-64 bg-gray-800 text-white p-4">
                <nav className="space-y-2">
                    <Link href="/admin" className="block py-2 px-3 rounded hover:bg-gray-700">
                        <LayoutDashboard size={18} className="inline-block mr-2" />
                        {adminCopy.layout.dashboard}
                    </Link>
                    <Link href="/admin/reports" className="block py-2 px-3 rounded hover:bg-gray-700">
                        <FileText size={18} className="inline-block mr-2" />
                        {adminCopy.layout.reports}
                    </Link>
                    <Link href="/admin/verification" className="block py-2 px-3 rounded hover:bg-gray-700">
                        <Shield size={18} className="inline-block mr-2" />
                        {adminCopy.layout.verification}
                    </Link>
                </nav>
            </aside>
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
