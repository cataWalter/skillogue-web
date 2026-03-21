'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { AlertTriangle } from 'lucide-react';

interface Report {
    id: number;
    created_at: string;
    reason: string;
    reporter: { first_name: string; last_name: string };
    reported: { first_name: string; last_name: string };
}

export default function AdminReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        const { data, error } = await supabase
            .from('reports')
            .select(`
                *,
                reporter:reporter_id(first_name, last_name),
                reported:reported_user_id(first_name, last_name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reports:', error);
        } else {
            setReports(data || []);
        }
        setLoading(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">User Reports</h1>
            <div className="space-y-4">
                {reports.length === 0 ? (
                    <div className="text-gray-500">No reports found.</div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2 text-red-400 font-semibold">
                                    <AlertTriangle size={20} />
                                    Report against {report.reported?.first_name} {report.reported?.last_name}
                                </div>
                                <span className="text-sm text-gray-500">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <div className="bg-black/50 p-4 rounded-lg mb-4 text-gray-300">
                                &quot;{report.reason}&quot;
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <div>
                                    Reported by: {report.reporter?.first_name} {report.reporter?.last_name}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
