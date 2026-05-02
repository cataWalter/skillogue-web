'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminCopy } from '../../../lib/app-copy';
import { formatShortDate } from '@/lib/format-date';

interface VerificationRequest {
    id: number;
    user_id: string;
    status: string;
    created_at: string;
    profiles?: { first_name: string; last_name: string; id: string };
}

export default function AdminVerification() {
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await fetch('/api/admin/verification');
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
        setLoading(false);
    };

    const handleApprove = async (id: number, userId: string) => {
        try {
            const response = await fetch(`/api/admin/verification/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved', userId }),
            });

            if (response.ok) {
                toast.success(adminCopy.verification.userVerified);
                fetchRequests();
            } else {
                toast.error(adminCopy.verification.failedToApprove);
            }
        } catch (error) {
            console.error('Error approving:', error);
            toast.error(adminCopy.verification.failedToApprove);
        }
    };

    const handleReject = async (id: number) => {
        try {
            const response = await fetch(`/api/admin/verification/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' }),
            });

            if (response.ok) {
                toast.success(adminCopy.verification.rejected);
                fetchRequests();
            } else {
                toast.error(adminCopy.verification.failedToReject);
            }
        } catch (error) {
            console.error('Error rejecting:', error);
            toast.error(adminCopy.verification.failedToReject);
        }
    };

    if (loading) return <div className="text-foreground">{adminCopy.verification.loading}</div>;

    return (
        <div className="text-foreground">
            <div className="glass-panel mb-6 rounded-[2rem] p-6 sm:p-8">
                <p className="editorial-kicker mb-4 w-fit border-approval/20 bg-approval/10 text-approval-soft">
                    Verification desk
                </p>
                <h1 className="text-3xl font-bold">{adminCopy.verification.title}</h1>
            </div>
            <div className="glass-panel overflow-hidden rounded-[1.75rem]">
                <table className="w-full text-left">
                    <thead className="bg-surface-secondary/80 text-faint">
                        <tr>
                            <th className="p-4">{adminCopy.verification.user}</th>
                            <th className="p-4">{adminCopy.verification.date}</th>
                            <th className="p-4">{adminCopy.verification.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line/30">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-faint">{adminCopy.verification.empty}</td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="transition-colors hover:bg-surface-secondary/40">
                                    <td className="p-4">
                                        <div className="font-medium text-foreground">{req.profiles?.first_name} {req.profiles?.last_name}</div>
                                        <div className="text-xs text-faint">{req.user_id}</div>
                                    </td>
                                    <td className="p-4 text-faint">
                                        {formatShortDate(req.created_at) ?? '—'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(req.id, req.user_id)}
                                                className="rounded-xl bg-approval/10 p-2 text-approval transition hover:bg-approval/15"
                                                title={adminCopy.verification.approveTitle}
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="rounded-xl bg-danger/10 p-2 text-danger transition hover:bg-danger/15"
                                                title={adminCopy.verification.rejectTitle}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
