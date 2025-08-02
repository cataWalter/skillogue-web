// src/app/(main)/admin/page.tsx

import { getReports, resolveReport, Report } from "./actions"

export default async function AdminDashboard() {
    const { reports, error } = await getReports()

    if (error) {
        return <div className="text-red-500 text-center p-8">{error}</div>
    }

    if (!reports || reports.length === 0) {
        return <div className="text-center p-8">No active reports.</div>
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Moderation Dashboard</h1>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reported User</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reporter</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report: Report) => (
                            <tr key={report.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{report.reported_profile?.username ?? 'N/A'}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{report.reporter_profile?.username ?? 'N/A'}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{report.reason}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(report.created_at).toLocaleDateString()}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                    <form action={async () => {
                                        'use server'
                                        await resolveReport(report.id)
                                    }}>
                                        <button type="submit" className="text-green-600 hover:text-green-900">Resolve</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
