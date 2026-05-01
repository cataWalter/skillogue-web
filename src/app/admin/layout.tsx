'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, FileText, LayoutDashboard, Search, SlidersHorizontal, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { adminCopy } from '../../lib/app-copy';
import { isAdminEmail } from '../../lib/admin';

const navLinkClass = 'block rounded-lg px-3 py-2 text-muted transition hover:bg-surface-secondary hover:text-foreground';

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

            if (!isAdminEmail(user.email)) {
                router.replace('/');
                return;
            }

            setIsAdmin(true);
        };

        checkAdmin();
    }, [authLoading, user, router]);

    if (authLoading) return <div className="text-foreground">{adminCopy.layout.loading}</div>;
    if (!isAdmin) return null;

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <aside className="w-72 border-r border-line/30 bg-surface/90 p-4 backdrop-blur-sm">
                <div className="mb-6 rounded-2xl border border-line/30 bg-surface-secondary/60 p-4">
                    <div className="text-xs uppercase tracking-[0.3em] text-brand">{adminCopy.dashboard.eyebrow}</div>
                    <div className="mt-2 text-lg font-semibold">{adminCopy.layout.commandCenter}</div>
                </div>
                <nav className="space-y-2">
                    <Link href="/admin" className={navLinkClass}>
                        <LayoutDashboard size={18} className="inline-block mr-2" />
                        {adminCopy.layout.dashboard}
                    </Link>
                    <Link href="/admin/queues" className={navLinkClass}>
                        <AlertTriangle size={18} className="inline-block mr-2" />
                        {adminCopy.layout.queues}
                    </Link>
                    <Link href="/admin/users" className={navLinkClass}>
                        <Users size={18} className="inline-block mr-2" />
                        {adminCopy.layout.investigation}
                    </Link>
                    <Link href="/admin/signals" className={navLinkClass}>
                        <Search size={18} className="inline-block mr-2" />
                        {adminCopy.layout.signals}
                    </Link>
                    <Link href="/admin/controls" className={navLinkClass}>
                        <SlidersHorizontal size={18} className="inline-block mr-2" />
                        {adminCopy.layout.controls}
                    </Link>

                    <div className="my-2 border-t border-line/20" />

                    <Link href="/admin/reports" className={navLinkClass}>
                        <FileText size={18} className="inline-block mr-2" />
                        {adminCopy.layout.reports}
                    </Link>
                    <Link href="/admin/verification" className={navLinkClass}>
                        <Shield size={18} className="inline-block mr-2" />
                        {adminCopy.layout.verification}
                    </Link>
                </nav>
            </aside>
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
