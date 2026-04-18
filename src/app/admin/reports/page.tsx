'use client';

import { useEffect, useState } from 'react';
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

    if (loading) return <div className="text-foreground">{adminCopy.reports.loading}</div>;

    return (
        <div className="text-foreground">
            <div className="glass-panel mb-6 rounded-[2rem] p-6 sm:p-8">
                <p className="editorial-kicker mb-4 w-fit border-danger/20 bg-danger/10 text-danger-soft">
                    Trust queue
                </p>
                <h1 className="text-3xl font-bold">{adminCopy.reports.title}</h1>
            </div>
            <div className="space-y-4">
                {reports.length === 0 ? (
                    <div className="glass-panel rounded-[1.5rem] p-6 text-faint">{adminCopy.reports.empty}</div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="glass-surface rounded-[1.5rem] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-danger/20">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2 text-danger font-semibold">
                                    <AlertTriangle size={20} />
                                    {adminCopy.reports.reportAgainstPrefix} {report.reported?.first_name} {report.reported?.last_name}
                                </div>
                                <span className="text-sm text-faint">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <div className="mb-4 rounded-lg border border-line/25 bg-surface-secondary/55 p-4 text-muted">
                                "{report.reason}"
                            </div>

                            <div className="flex items-center justify-between text-sm text-faint">
                                <div>
                                    {adminCopy.reports.reportedByPrefix} {report.reporter?.first_name} {report.reporter?.last_name}
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={report.status}
                                        onChange={(e) => updateReportStatus(report.id, e.target.value)}
                                        className="rounded border border-line/30 bg-surface-secondary/70 px-2 py-1 text-sm text-foreground shadow-glass-sm focus:border-brand focus:outline-none"
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