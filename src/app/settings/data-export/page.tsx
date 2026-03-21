'use client';

import React, { useState } from 'react';
import { getUserData } from '@/app/actions/export-data';
import { ArrowLeft, Download, FileJson, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function DataExportPage() {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const data = await getUserData();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `skillogue-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success('Data export started');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-2xl mx-auto">
                <Link href="/settings" className="text-gray-400 hover:text-white transition flex items-center gap-2 mb-8">
                    <ArrowLeft size={20} />
                    Back to Settings
                </Link>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-600/20 p-3 rounded-full">
                            <FileJson className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h1 className="text-2xl font-bold">Export Your Data</h1>
                    </div>

                    <p className="text-gray-300 mb-6">
                        You have the right to access your personal data. Click the button below to download a copy of your data in JSON format.
                        This includes your profile information, messages, and settings.
                    </p>

                    <div className="bg-gray-800/50 p-4 rounded-lg mb-8 text-sm text-gray-400">
                        <p className="mb-2 font-semibold text-gray-300">What&apos;s included:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Profile details (Name, Bio, Location)</li>
                            <li>Account information (Email, ID)</li>
                            <li>Your Passions and Languages</li>
                            <li>Message history (Sent and Received)</li>
                            <li>Blocked users list</li>
                        </ul>
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Preparing Download...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Download My Data
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}