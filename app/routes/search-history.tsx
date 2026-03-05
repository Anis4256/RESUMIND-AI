import type { Route } from "./+types/search-history";
import Navbar from "~/components/Navbar";
import { usePuterStore } from "~/lib/puter";
import { useNavigate, Link } from "react-router";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Search History - Resumind" },
        { name: "description", content: "View your previous job searches" },
    ];
}

interface SearchHistoryItem {
    key: string;
    timestamp: number;
    params: {
        jobTitle: string;
        location: string;
        resultsPerPage: number;
    };
    results: JobApplierDashboard;
}

export default function SearchHistory() {
    const { auth, kv } = usePuterStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate('/auth?next=/search-history');
        }
    }, [auth.isAuthenticated]);

    useEffect(() => {
        loadSearchHistory();
    }, []);

    const loadSearchHistory = async () => {
        setLoading(true);
        
        try {
            // Get all job search keys
            const searchKeys = await kv.list('job_search:*', false);
            
            if (!searchKeys || searchKeys.length === 0) {
                setLoading(false);
                return;
            }

            // Load all search data
            const searches: SearchHistoryItem[] = [];
            for (const key of searchKeys) {
                const data = await kv.get(key as string);
                if (data) {
                    const parsed = JSON.parse(data);
                    searches.push({
                        key: key as string,
                        ...parsed
                    });
                }
            }

            // Sort by most recent
            searches.sort((a, b) => b.timestamp - a.timestamp);
            setSearchHistory(searches);
        } catch (error) {
            console.error('Error loading search history:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteSearch = async (key: string) => {
        if (confirm('Delete this search from history?')) {
            await kv.delete(key);
            loadSearchHistory();
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />

            <section className="main-section py-8">
                {/* Page Header */}
                <div className="page-heading py-8">
                    <h1>🕒 Search History</h1>
                    <h2>View and repeat your previous job searches</h2>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <img src="/images/resume-scan-2.gif" className="w-[200px] mb-4" alt="Loading" />
                        <p className="text-lg font-semibold text-gray-700">Loading search history...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && searchHistory.length === 0 && (
                    <div className="text-center py-12 max-w-2xl mx-auto">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            No Search History Yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Your job searches will appear here so you can easily repeat them.
                        </p>
                        <Link
                            to="/job-applier"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            🔍 Start Searching
                        </Link>
                    </div>
                )}

                {/* Search History List */}
                {!loading && searchHistory.length > 0 && (
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-6 flex justify-between items-center">
                            <p className="text-gray-600">
                                {searchHistory.length} previous {searchHistory.length === 1 ? 'search' : 'searches'}
                            </p>
                            <Link
                                to="/job-applier"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
                            >
                                + New Search
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {searchHistory.map((search) => (
                                <div key={search.key} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                {search.params.jobTitle || 'All Jobs'}
                                                {search.params.location && ` in ${search.params.location}`}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(search.timestamp)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => deleteSearch(search.key)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                            title="Delete search"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>

                                    {/* Search Results Summary */}
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div className="bg-gray-50 rounded p-3 text-center">
                                            <p className="text-2xl font-bold text-gray-900">
                                                {search.results.dashboard_summary.total_jobs}
                                            </p>
                                            <p className="text-xs text-gray-600">Total Jobs</p>
                                        </div>
                                        <div className="bg-green-50 rounded p-3 text-center">
                                            <p className="text-2xl font-bold text-green-700">
                                                {search.results.dashboard_summary.recommended_to_apply}
                                            </p>
                                            <p className="text-xs text-green-800">Recommended</p>
                                        </div>
                                        <div className="bg-yellow-50 rounded p-3 text-center">
                                            <p className="text-2xl font-bold text-yellow-700">
                                                {search.results.dashboard_summary.needs_review}
                                            </p>
                                            <p className="text-xs text-yellow-800">Review</p>
                                        </div>
                                        <div className="bg-red-50 rounded p-3 text-center">
                                            <p className="text-2xl font-bold text-red-700">
                                                {search.results.dashboard_summary.skipped}
                                            </p>
                                            <p className="text-xs text-red-800">Skipped</p>
                                        </div>
                                    </div>

                                    {/* Top Jobs Preview */}
                                    {search.results.jobs.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-semibold text-gray-700 mb-2">
                                                Top Matches:
                                            </p>
                                            <div className="space-y-1">
                                                {search.results.jobs
                                                    .filter(j => j.decision === 'apply')
                                                    .slice(0, 3)
                                                    .map((job, idx) => (
                                                        <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                                            <span className="text-green-600">✓</span>
                                                            <span>{job.job_title} at {job.company}</span>
                                                            <span className="text-xs text-gray-500">({job.match_score}% match)</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/job-applier?jobTitle=${encodeURIComponent(search.params.jobTitle)}&location=${encodeURIComponent(search.params.location)}`}
                                            className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
                                        >
                                            🔄 Repeat Search
                                        </Link>
                                        <Link
                                            to="/skills-gap"
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            📊 Analyze Skills
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

