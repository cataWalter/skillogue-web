'use client';

import React, { useState } from 'react';
import { getUserData } from '@/app/actions/export-data';
import { ArrowLeft, Download, FileJson, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { settingsCopy } from '../../../lib/app-copy';

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
            
            toast.success(settingsCopy.dataExport.exportStarted);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(settingsCopy.dataExport.exportError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-2xl mx-auto">
                <Link href="/settings" className="text-gray-400 hover:text-white transition flex items-center gap-2 mb-8">
                    <ArrowLeft size={20} />
                    {settingsCopy.dataExport.backToSettings}
                </Link>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-600/20 p-3 rounded-full">
                            <FileJson className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h1 className="text-2xl font-bold">{settingsCopy.dataExport.title}</h1>
                    </div>

                    <p className="text-gray-300 mb-6">
                        {settingsCopy.dataExport.intro}
                    </p>

                    <div className="bg-gray-800/50 p-4 rounded-lg mb-8 text-sm text-gray-400">
                        <p className="mb-2 font-semibold text-gray-300">{settingsCopy.dataExport.includedTitle}</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>{settingsCopy.dataExport.includedProfileDetails}</li>
                            <li>{settingsCopy.dataExport.includedAccountInfo}</li>
                            <li>{settingsCopy.dataExport.includedPassionsLanguages}</li>
                            <li>{settingsCopy.dataExport.includedMessages}</li>
                            <li>{settingsCopy.dataExport.includedBlockedUsers}</li>
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
                                {settingsCopy.dataExport.preparing}
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                {settingsCopy.dataExport.downloadButton}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}