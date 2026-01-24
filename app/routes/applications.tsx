import type { Route } from "./+types/applications";
import Navbar from "~/components/Navbar";
import JobCard from "~/components/JobCard";
import { usePuterStore } from "~/lib/puter";
import { useNavigate, Link } from "react-router";
import { useEffect, useState } from "react";
import { getApplications, updateApplicationStatus } from "~/lib/jobStorage";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "My Applications - Resumind" },
        { name: "description", content: "Track your job applications" },
    ];
}

export default function Applications() {
    const { auth, kv } = usePuterStore();
    const navigate = useNavigate();
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<JobApplication['status'] | 'all'>('all');

    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate('/auth?next=/applications');
        }
    }, [auth.isAuthenticated]);

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        setLoading(true);
        const apps = await getApplications(kv);
        // Sort by most recently applied
        apps.sort((a, b) => b.applied_at - a.applied_at);
        setApplications(apps);
        setLoading(false);
    };

    const handleStatusUpdate = async (jobId: string, status: JobApplication['status']) => {
        await updateApplicationStatus(kv, jobId, status);
        loadApplications();
    };

    const filteredApplications = filterStatus === 'all'
        ? applications
        : applications.filter(app => app.status === filterStatus);

    const getStatusColor = (status: JobApplication['status']) => {
        switch (status) {
            case 'applied':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'interview':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'offer':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'withdrawn':
                return 'bg-gray-100 text-gray-800 border-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusIcon = (status: JobApplication['status']) => {
        switch (status) {
            case 'applied': return '📤';
            case 'interview': return '💼';
            case 'offer': return '🎉';
            case 'rejected': return '❌';
            case 'withdrawn': return '🔙';
            default: return '📋';
        }
    };

    const statusCounts = {
        all: applications.length,
        applied: applications.filter(a => a.status === 'applied').length,
        interview: applications.filter(a => a.status === 'interview').length,
        offer: applications.filter(a => a.status === 'offer').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        withdrawn: applications.filter(a => a.status === 'withdrawn').length,
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />

            <section className="main-section py-8">
                {/* Page Header */}
                <div className="page-heading py-8">
                    <h1>📊 My Applications</h1>
                    <h2>Track and manage your job applications</h2>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <img src="/images/resume-scan-2.gif" className="w-[200px] mb-4" alt="Loading" />
                        <p className="text-lg font-semibold text-gray-700">Loading applications...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && applications.length === 0 && (
                    <div className="text-center py-12 max-w-2xl mx-auto">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            No Applications Yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Start applying to jobs and track them here. Click "Mark Applied" on any job card.
                        </p>
                        <Link
                            to="/job-applier"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            🔍 Find Jobs
                        </Link>
                    </div>
                )}

                {/* Applications Dashboard */}
                {!loading && applications.length > 0 && (
                    <div className="max-w-7xl mx-auto">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                            <div className="bg-white rounded-lg shadow p-4 text-center">
                                <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
                                <p className="text-sm text-gray-600">Total</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg shadow p-4 text-center border-2 border-blue-200">
                                <p className="text-2xl font-bold text-blue-700">{statusCounts.applied}</p>
                                <p className="text-sm text-blue-800">Applied</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg shadow p-4 text-center border-2 border-purple-200">
                                <p className="text-2xl font-bold text-purple-700">{statusCounts.interview}</p>
                                <p className="text-sm text-purple-800">Interview</p>
                            </div>
                            <div className="bg-green-50 rounded-lg shadow p-4 text-center border-2 border-green-200">
                                <p className="text-2xl font-bold text-green-700">{statusCounts.offer}</p>
                                <p className="text-sm text-green-800">Offers</p>
                            </div>
                            <div className="bg-red-50 rounded-lg shadow p-4 text-center border-2 border-red-200">
                                <p className="text-2xl font-bold text-red-700">{statusCounts.rejected}</p>
                                <p className="text-sm text-red-800">Rejected</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg shadow p-4 text-center border-2 border-gray-200">
                                <p className="text-2xl font-bold text-gray-700">{statusCounts.withdrawn}</p>
                                <p className="text-sm text-gray-800">Withdrawn</p>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            {(['all', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors whitespace-nowrap ${
                                        filterStatus === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
                                </button>
                            ))}
                        </div>

                        {/* Applications List */}
                        <div className="space-y-6">
                            {filteredApplications.map(({ job, applied_at, status, notes, cover_letter }) => (
                                <div key={job.job_id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                {job.job_title}
                                            </h3>
                                            <p className="text-gray-600 font-medium">{job.company}</p>
                                            <p className="text-gray-500 text-sm">📍 {job.location}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
                                                {getStatusIcon(status)} {status.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Applied {new Date(applied_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {notes && (
                                        <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                                            <p className="text-sm text-gray-700"><strong>Notes:</strong> {notes}</p>
                                        </div>
                                    )}

                                    {cover_letter && (
                                        <details className="mb-4">
                                            <summary className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-800">
                                                📄 View Cover Letter
                                            </summary>
                                            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                                                <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700">
                                                    {cover_letter}
                                                </pre>
                                            </div>
                                        </details>
                                    )}

                                    <div className="flex gap-2">
                                        <a
                                            href={job.redirect_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
                                        >
                                            🔗 View Job
                                        </a>
                                        <select
                                            value={status}
                                            onChange={(e) => handleStatusUpdate(job.job_id, e.target.value as JobApplication['status'])}
                                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                                        >
                                            <option value="applied">Applied</option>
                                            <option value="interview">Interview</option>
                                            <option value="offer">Offer</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="withdrawn">Withdrawn</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredApplications.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <p>No applications with this status</p>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}

