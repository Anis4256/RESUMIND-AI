import type { Route } from "./+types/job-applier";
import Navbar from "~/components/Navbar";
import JobCard from "~/components/JobCard";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { searchJobs } from "~/lib/adzuna";
import { analyzeMultipleJobs } from "~/lib/jobMatcher";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Auto Job Applier - Resumind" },
        { name: "description", content: "AI-powered job matching and application assistant" },
    ];
}

export default function JobApplier() {
    const { auth, kv, fs, ai } = usePuterStore();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dashboard, setDashboard] = useState<JobApplierDashboard | null>(null);
    const [resumeText, setResumeText] = useState<string>('');
    const [sortBy, setSortBy] = useState<'match' | 'recent' | 'salary'>('match');
    const [filterLocation, setFilterLocation] = useState<string>('');
    const [minMatchScore, setMinMatchScore] = useState<number>(0);
    
    // Search form state
    const [searchParams, setSearchParams] = useState({
        jobTitle: '',
        location: '',
        resultsPerPage: 20
    });

    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate('/auth?next=/job-applier');
        }
    }, [auth.isAuthenticated]);

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setDashboard(null);

        try {
            // 1. Get user's resume from storage
            console.log('Step 1: Fetching resumes from storage...');
            const resumes = (await kv.list('resume:*', true)) as KVItem[];
            console.log('Resumes found:', resumes?.length || 0);
            
            if (!resumes || resumes.length === 0) {
                setError('No resume found. Please upload a resume first.');
                setLoading(false);
                return;
            }

            // Get the most recent resume
            const latestResume = JSON.parse(resumes[resumes.length - 1].value) as Resume;
            console.log('Latest resume:', latestResume.id);
            
            // 2. Read the resume file content
            console.log('Step 2: Reading resume file...');
            const resumeBlob = await fs.read(latestResume.resumePath);
            if (!resumeBlob) {
                setError('Failed to read resume file.');
                setLoading(false);
                return;
            }
            console.log('Resume file read successfully, size:', resumeBlob.size);

            // 3. Extract text from resume using Puter AI
            console.log('Step 3: Extracting text from resume...');
            console.log('Resume path:', latestResume.resumePath);
            setAnalyzing(true);
            
            // Use Puter AI feedback function to extract text from PDF
            const extractionResponse = await ai.feedback(
                latestResume.resumePath,
                "Please extract all the text content from this resume. Return ONLY the extracted text, without any additional commentary or formatting. Include all sections: contact info, summary, experience, education, skills, etc."
            );
            
            console.log('AI extraction response:', extractionResponse);
            
            // Extract text from response (handle both string and array formats)
            let resumeText = '';
            if (extractionResponse?.message?.content) {
                const content = extractionResponse.message.content;
                if (typeof content === 'string') {
                    resumeText = content;
                } else if (Array.isArray(content)) {
                    // If content is array, extract text from text blocks
                    resumeText = content
                        .filter((block: any) => block.type === 'text' || typeof block === 'string')
                        .map((block: any) => typeof block === 'string' ? block : block.text)
                        .join('\n');
                } else if (content.text) {
                    resumeText = content.text;
                }
            }
            
            console.log('Extracted text length:', resumeText?.length || 0);
            
            if (!resumeText || resumeText.trim().length === 0) {
                console.error('Resume text extraction failed. Full response:', JSON.stringify(extractionResponse, null, 2));
                setError('Failed to extract text from resume. The AI response was empty or invalid. Check console for details.');
                setLoading(false);
                setAnalyzing(false);
                return;
            }
            console.log('Text extracted successfully, length:', resumeText.length);
            
            // Store resume text for cover letter generation
            setResumeText(resumeText);

            // 4. Search for jobs using Adzuna API
            console.log('Step 4: Searching for jobs...');
            console.log('Search params:', searchParams);
            const jobs = await searchJobs('us', {
                what: searchParams.jobTitle,
                where: searchParams.location,
                results_per_page: searchParams.resultsPerPage,
                max_days_old: 7
            });

            console.log('Jobs found:', jobs?.length || 0);
            if (!jobs || jobs.length === 0) {
                setError('No jobs found matching your criteria. Try different search terms.');
                setLoading(false);
                setAnalyzing(false);
                return;
            }

            // 5. Analyze jobs against resume
            console.log('Step 5: Analyzing job matches...');
            const analysis = await analyzeMultipleJobs(
                ai.chat,
                resumeText,
                jobs
            );

            console.log('Analysis complete:', analysis.dashboard_summary);
            setDashboard(analysis);
            
            // 6. Save search results to KV store for later reference
            console.log('Step 6: Saving results...');
            const searchKey = `job_search:${Date.now()}`;
            await kv.set(searchKey, JSON.stringify({
                timestamp: Date.now(),
                params: searchParams,
                results: analysis
            }));
            console.log('Search completed successfully!');

        } catch (err) {
            console.error('Error in job search:', err);
            
            // Extract error message from various error types
            let errorMessage = 'An error occurred during job search';
            
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            } else if (err && typeof err === 'object') {
                // Handle Puter API error responses
                if ('error' in err && typeof err.error === 'string') {
                    errorMessage = err.error;
                } else if ('message' in err) {
                    errorMessage = String(err.message);
                } else {
                    // Pretty print the error object for debugging
                    try {
                        errorMessage = JSON.stringify(err, null, 2);
                    } catch {
                        errorMessage = String(err);
                    }
                }
            }
            
            console.error('Extracted error message:', errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
            setAnalyzing(false);
        }
    };

    const filterJobs = (decision?: string) => {
        if (!dashboard) return [];
        
        let filtered = decision ? dashboard.jobs.filter(job => job.decision === decision) : dashboard.jobs;
        
        // Apply location filter
        if (filterLocation) {
            filtered = filtered.filter(job => 
                job.location.toLowerCase().includes(filterLocation.toLowerCase())
            );
        }
        
        // Apply minimum match score filter
        if (minMatchScore > 0) {
            filtered = filtered.filter(job => job.match_score >= minMatchScore);
        }
        
        // Sort
        const sorted = [...filtered];
        switch (sortBy) {
            case 'match':
                sorted.sort((a, b) => b.match_score - a.match_score);
                break;
            case 'recent':
                // Assuming newer jobs don't have a timestamp, keep original order
                break;
            case 'salary':
                // Sort by salary if available (would need to add salary to JobMatchResult)
                break;
        }
        
        return sorted;
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />

            <section className="main-section py-8">
                {/* Page Header */}
                <div className="page-heading py-8">
                    <h1>🤖 Auto Job Applier</h1>
                    <h2>AI-powered job matching and application assistant</h2>
                </div>

                {/* Search Form */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-4xl mx-auto">
                    <h3 className="text-xl font-bold mb-4">Search Jobs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Job Title / Keywords
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Software Engineer"
                                value={searchParams.jobTitle}
                                onChange={(e) => setSearchParams(prev => ({ ...prev, jobTitle: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., New York"
                                value={searchParams.location}
                                onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Results Per Page
                            </label>
                            <select
                                value={searchParams.resultsPerPage}
                                onChange={(e) => setSearchParams(prev => ({ ...prev, resultsPerPage: Number(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={30}>30</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading || !searchParams.jobTitle}
                        className="primary-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Searching & Analyzing...' : 'Find Matching Jobs'}
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <img src="/images/resume-scan-2.gif" className="w-[200px] mb-4" alt="Loading" />
                        <p className="text-lg font-semibold text-gray-700">
                            {analyzing ? 'Analyzing job matches with AI...' : 'Searching for jobs...'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">This may take a minute</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-300 rounded-lg p-6 max-w-4xl mx-auto mb-8">
                        <p className="text-red-800 font-bold text-lg mb-2">⚠️ Error</p>
                        <p className="text-red-700 mb-4">{error}</p>
                        
                        {/* Show help if it's an API credential error */}
                        {error.toLowerCase().includes('credential') || error.toLowerCase().includes('api') && (
                            <div className="mt-4 p-4 bg-white rounded border border-red-200">
                                <p className="font-semibold text-gray-800 mb-2">Quick Fix:</p>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                                    <li>Visit <a href="https://developer.adzuna.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://developer.adzuna.com/</a></li>
                                    <li>Sign up for a free account</li>
                                    <li>Create an app to get your App ID and API Key</li>
                                    <li>Add them to your <code className="bg-gray-100 px-1 rounded">.env</code> file:
                                        <pre className="mt-2 p-2 bg-gray-800 text-white text-xs rounded overflow-x-auto">
VITE_ADZUNA_APP_ID=your_app_id_here{'\n'}VITE_ADZUNA_API_KEY=your_api_key_here
                                        </pre>
                                    </li>
                                    <li>Restart the dev server (<code className="bg-gray-100 px-1 rounded">npm run dev</code>)</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                {/* Dashboard Summary */}
                {dashboard && !loading && (
                    <div className="max-w-7xl mx-auto mb-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-lg shadow-md p-6 text-center">
                                <p className="text-3xl font-bold text-gray-900">
                                    {dashboard.dashboard_summary.total_jobs}
                                </p>
                                <p className="text-gray-600 mt-2">Total Jobs</p>
                            </div>
                            <div className="bg-green-50 rounded-lg shadow-md p-6 text-center border-2 border-green-200">
                                <p className="text-3xl font-bold text-green-700">
                                    {dashboard.dashboard_summary.recommended_to_apply}
                                </p>
                                <p className="text-green-800 mt-2 font-semibold">Recommended</p>
                            </div>
                            <div className="bg-yellow-50 rounded-lg shadow-md p-6 text-center border-2 border-yellow-200">
                                <p className="text-3xl font-bold text-yellow-700">
                                    {dashboard.dashboard_summary.needs_review}
                                </p>
                                <p className="text-yellow-800 mt-2 font-semibold">Needs Review</p>
                            </div>
                            <div className="bg-red-50 rounded-lg shadow-md p-6 text-center border-2 border-red-200">
                                <p className="text-3xl font-bold text-red-700">
                                    {dashboard.dashboard_summary.skipped}
                                </p>
                                <p className="text-red-800 mt-2 font-semibold">Skipped</p>
                            </div>
                        </div>

                        {/* Global Recommendations */}
                        {dashboard.global_recommendations.length > 0 && (
                            <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 mb-8">
                                <h3 className="text-lg font-bold text-blue-900 mb-3">
                                    💡 Recommendations
                                </h3>
                                <ul className="space-y-2">
                                    {dashboard.global_recommendations.map((rec, idx) => (
                                        <li key={idx} className="text-blue-800 flex items-start gap-2">
                                            <span className="text-blue-600 mt-1">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Filter & Sort Controls */}
                        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Sort By */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as 'match' | 'recent' | 'salary')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="match">Best Match</option>
                                        <option value="recent">Most Recent</option>
                                        <option value="salary">Salary (High-Low)</option>
                                    </select>
                                </div>

                                {/* Filter by Location */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Filter Location
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Remote, NYC"
                                        value={filterLocation}
                                        onChange={(e) => setFilterLocation(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Min Match Score */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Min Match Score: {minMatchScore}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="10"
                                        value={minMatchScore}
                                        onChange={(e) => setMinMatchScore(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                {/* Clear Filters */}
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setFilterLocation('');
                                            setMinMatchScore(0);
                                            setSortBy('match');
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            <button
                                className="px-4 py-2 rounded-md font-semibold text-sm bg-gray-200 hover:bg-gray-300 transition-colors whitespace-nowrap"
                            >
                                All ({dashboard.dashboard_summary.total_jobs})
                            </button>
                            <button
                                className="px-4 py-2 rounded-md font-semibold text-sm bg-green-100 text-green-800 hover:bg-green-200 transition-colors whitespace-nowrap"
                            >
                                Recommended ({dashboard.dashboard_summary.recommended_to_apply})
                            </button>
                            <button
                                className="px-4 py-2 rounded-md font-semibold text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors whitespace-nowrap"
                            >
                                Review ({dashboard.dashboard_summary.needs_review})
                            </button>
                            <button
                                className="px-4 py-2 rounded-md font-semibold text-sm bg-red-100 text-red-800 hover:bg-red-200 transition-colors whitespace-nowrap"
                            >
                                Skipped ({dashboard.dashboard_summary.skipped})
                            </button>
                        </div>

                        {/* Job Cards Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filterJobs().map((job) => (
                                <JobCard 
                                    key={job.job_id} 
                                    job={job}
                                    resumeText={resumeText}
                                />
                            ))}
                        </div>

                        {filterJobs().length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <p>No jobs match your filters. Try adjusting them.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !dashboard && !error && (
                    <div className="text-center py-12 max-w-2xl mx-auto">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            Find Your Perfect Job Match
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Enter your job preferences above and let our AI analyze job listings to find the best matches for your resume.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
                            <h4 className="font-bold text-blue-900 mb-3">How it works:</h4>
                            <ol className="space-y-2 text-blue-800">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold">1.</span>
                                    <span>We analyze your resume using AI</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold">2.</span>
                                    <span>We search for jobs matching your criteria</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold">3.</span>
                                    <span>We calculate match scores and identify skills gaps</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold">4.</span>
                                    <span>You review and apply to recommended jobs (assisted apply)</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

