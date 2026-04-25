'use client';

import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminCopy } from '../../../lib/app-copy';

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

    if (loading) return <div className="text-white">{adminCopy.verification.loading}</div>;

    return (
        <div className="text-white">
            <h1 className="text-3xl font-bold mb-6">{adminCopy.verification.title}</h1>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-800 text-gray-400">
                        <tr>
                            <th className="p-4">{adminCopy.verification.user}</th>
                            <th className="p-4">{adminCopy.verification.date}</th>
                            <th className="p-4">{adminCopy.verification.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-500">{adminCopy.verification.empty}</td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-800/50">
                                    <td className="p-4">
                                        <div className="font-medium">{req.profiles?.first_name} {req.profiles?.last_name}</div>
                                        <div className="text-xs text-gray-500">{req.user_id}</div>
                                    </td>
                                    <td className="p-4 text-gray-400">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleApprove(req.id, req.user_id)}
                                                className="p-2 bg-green-900/30 text-green-500 rounded hover:bg-green-900/50 transition"
                                                title={adminCopy.verification.approveTitle}
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleReject(req.id)}
                                                className="p-2 bg-red-900/30 text-red-500 rounded hover:bg-red-900/50 transition"
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