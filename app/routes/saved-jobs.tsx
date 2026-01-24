import type { Route } from "./+types/saved-jobs";
import Navbar from "~/components/Navbar";
import JobCard from "~/components/JobCard";
import { usePuterStore } from "~/lib/puter";
import { useNavigate, Link } from "react-router";
import { useEffect, useState } from "react";
import { getSavedJobs } from "~/lib/jobStorage";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Saved Jobs - Resumind" },
        { name: "description", content: "Your bookmarked jobs" },
    ];
}

export default function SavedJobs() {
    const { auth, kv } = usePuterStore();
    const navigate = useNavigate();
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate('/auth?next=/saved-jobs');
        }
    }, [auth.isAuthenticated]);

    useEffect(() => {
        loadSavedJobs();
    }, []);

    const loadSavedJobs = async () => {
        setLoading(true);
        const jobs = await getSavedJobs(kv);
        // Sort by most recently saved
        jobs.sort((a, b) => b.saved_at - a.saved_at);
        setSavedJobs(jobs);
        setLoading(false);
    };

    const handleSaveToggle = () => {
        // Reload the list when a job is unsaved
        loadSavedJobs();
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />

            <section className="main-section py-8">
                {/* Page Header */}
                <div className="page-heading py-8">
                    <h1>⭐ Saved Jobs</h1>
                    <h2>Jobs you've bookmarked for later review</h2>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <img src="/images/resume-scan-2.gif" className="w-[200px] mb-4" alt="Loading" />
                        <p className="text-lg font-semibold text-gray-700">Loading saved jobs...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && savedJobs.length === 0 && (
                    <div className="text-center py-12 max-w-2xl mx-auto">
                        <div className="text-6xl mb-4">📑</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            No Saved Jobs Yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Start searching for jobs and click the star icon to save them for later.
                        </p>
                        <Link
                            to="/job-applier"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            🔍 Search for Jobs
                        </Link>
                    </div>
                )}

                {/* Saved Jobs Grid */}
                {!loading && savedJobs.length > 0 && (
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-6 flex justify-between items-center">
                            <p className="text-gray-600">
                                {savedJobs.length} {savedJobs.length === 1 ? 'job' : 'jobs'} saved
                            </p>
                            <Link
                                to="/job-applier"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
                            >
                                + Find More Jobs
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {savedJobs.map(({ job, saved_at, notes }) => (
                                <div key={job.job_id}>
                                    <JobCard
                                        job={job}
                                        isSaved={true}
                                        onSaveToggle={handleSaveToggle}
                                    />
                                    <div className="mt-2 text-xs text-gray-500 px-2">
                                        Saved {new Date(saved_at).toLocaleDateString()}
                                        {notes && <span className="ml-2">• {notes}</span>}
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

