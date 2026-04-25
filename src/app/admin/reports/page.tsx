'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { adminCopy } from '../../../lib/app-copy';

interface Report {
    id: number;
    created_at: string;
    reason: string;
    status: string;
    reporter?: { first_name: string; last_name: string };
    reported?: { first_name: string; last_name: string };
}

export default function AdminReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await fetch('/api/admin/reports');
            if (response.ok) {
                const data = await response.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
        setLoading(false);
    };

    const updateReportStatus = async (reportId: number, status: string) => {
        try {
            await fetch(`/api/admin/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            fetchReports();
        } catch (error) {
            console.error('Error updating report:', error);
        }
    };

    if (loading) return <div className="text-white">{adminCopy.reports.loading}</div>;

    return (
        <div className="text-white">
            <h1 className="text-3xl font-bold mb-6">{adminCopy.reports.title}</h1>
            <div className="space-y-4">
                {reports.length === 0 ? (
                    <div className="text-gray-500">{adminCopy.reports.empty}</div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2 text-red-400 font-semibold">
                                    <AlertTriangle size={20} />
                                    {adminCopy.reports.reportAgainstPrefix} {report.reported?.first_name} {report.reported?.last_name}
                                </div>
                                <span className="text-sm text-gray-500">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <div className="bg-black/50 p-4 rounded-lg mb-4 text-gray-300">
                                "{report.reason}"
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <div>
                                    {adminCopy.reports.reportedByPrefix} {report.reporter?.first_name} {report.reporter?.last_name}
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={report.status}
                                        onChange={(e) => updateReportStatus(report.id, e.target.value)}
                                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                                    >
                                        {adminCopy.reports.statusOptions.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}