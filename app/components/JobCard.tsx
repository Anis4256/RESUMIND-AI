import { Link } from "react-router";
import { useState } from "react";
import ScoreBadge from "./ScoreBadge";
import { usePuterStore } from "~/lib/puter";
import { saveJob, unsaveJob, markJobAsApplied } from "~/lib/jobStorage";
import { generateCoverLetter } from "~/lib/coverLetterGenerator";

interface JobCardProps {
    job: JobMatchResult;
    resumeText?: string;
    isSaved?: boolean;
    isApplied?: boolean;
    onSaveToggle?: () => void;
    onApplied?: () => void;
}

export default function JobCard({ job, resumeText, isSaved = false, isApplied = false, onSaveToggle, onApplied }: JobCardProps) {
    const { kv, ai } = usePuterStore();
    const [saved, setSaved] = useState(isSaved);
    const [applied, setApplied] = useState(isApplied);
    const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
    const [showCoverLetter, setShowCoverLetter] = useState(false);
    const [coverLetter, setCoverLetter] = useState<string | null>(null);
    const [showTailoring, setShowTailoring] = useState(false);
    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case 'apply':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'review':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'skip':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getDecisionIcon = (decision: string) => {
        switch (decision) {
            case 'apply':
                return '✓';
            case 'review':
                return '⚠';
            case 'skip':
                return '✗';
            default:
                return '?';
        }
    };

    const handleSaveToggle = async () => {
        if (saved) {
            const success = await unsaveJob(kv, job.job_id);
            if (success) {
                setSaved(false);
                onSaveToggle?.();
            }
        } else {
            const success = await saveJob(kv, job);
            if (success) {
                setSaved(true);
                onSaveToggle?.();
            }
        }
    };

    const handleMarkAsApplied = async () => {
        const success = await markJobAsApplied(kv, job, coverLetter || undefined);
        if (success) {
            setApplied(true);
            onApplied?.();
        }
    };

    const handleGenerateCoverLetter = async () => {
        if (!resumeText) {
            alert('Resume text not available. Please search for jobs again from the main dashboard.');
            return;
        }

        setGeneratingCoverLetter(true);
        try {
            const letter = await generateCoverLetter(ai.chat, resumeText, job);
            setCoverLetter(letter);
            setShowCoverLetter(true);
        } catch (error) {
            console.error('Error generating cover letter:', error);
            alert('Failed to generate cover letter. Please try again.');
        } finally {
            setGeneratingCoverLetter(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            {/* Header with Company and Score */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {job.job_title}
                    </h3>
                    <p className="text-gray-600 font-medium">{job.company}</p>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                        <span>📍</span> {job.location}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <ScoreBadge score={job.match_score} />
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDecisionColor(job.decision)}`}>
                        {getDecisionIcon(job.decision)} {job.decision.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Dashboard Note */}
            <div className="mb-4">
                <p className="text-gray-700 text-sm italic">
                    {job.dashboard_note}
                </p>
            </div>

            {/* Skills Section */}
            <div className="space-y-3 mb-4">
                {/* Matched Skills */}
                {job.matched_skills.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                            ✓ Matched Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {job.matched_skills.slice(0, 5).map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs border border-green-200"
                                >
                                    {skill}
                                </span>
                            ))}
                            {job.matched_skills.length > 5 && (
                                <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">
                                    +{job.matched_skills.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Missing Skills */}
                {job.missing_skills.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                            ⚠ Missing Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {job.missing_skills.slice(0, 5).map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs border border-red-200"
                                >
                                    {skill}
                                </span>
                            ))}
                            {job.missing_skills.length > 5 && (
                                <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">
                                    +{job.missing_skills.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Assets Ready Indicator */}
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                <span className={job.ai_assets_ready.resume ? 'text-green-600' : 'text-red-600'}>
                    {job.ai_assets_ready.resume ? '✓' : '✗'} Resume Ready
                </span>
                <span className={job.ai_assets_ready.cover_letter ? 'text-green-600' : 'text-red-600'}>
                    {job.ai_assets_ready.cover_letter ? '✓' : '✗'} Cover Letter Ready
                </span>
            </div>

            {/* Status Badges */}
            {(saved || applied) && (
                <div className="flex gap-2 mb-4">
                    {saved && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                            ⭐ Saved
                        </span>
                    )}
                    {applied && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                            ✓ Applied
                        </span>
                    )}
                </div>
            )}

            {/* Cover Letter Modal */}
            {showCoverLetter && coverLetter && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-900">Generated Cover Letter</h4>
                        <button
                            onClick={() => setShowCoverLetter(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="bg-white p-4 rounded border border-gray-300 mb-3 max-h-64 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                            {coverLetter}
                        </pre>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => copyToClipboard(coverLetter)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                            📋 Copy to Clipboard
                        </button>
                        <button
                            onClick={handleGenerateCoverLetter}
                            disabled={generatingCoverLetter}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                            🔄 Regenerate
                        </button>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
                {/* Primary Actions */}
                <div className="flex gap-2">
                    <a
                        href={job.redirect_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 text-center py-2 px-4 rounded-md font-semibold text-sm transition-colors ${
                            job.decision === 'apply'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : job.decision === 'review'
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                    >
                        {job.decision === 'apply' ? '🚀 Apply Now' : job.decision === 'review' ? '👀 Review & Apply' : '🔗 View Job'}
                    </a>
                    <button
                        onClick={handleSaveToggle}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                            saved
                                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 hover:bg-blue-200'
                                : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        title={saved ? 'Unsave' : 'Save for later'}
                    >
                        {saved ? '⭐' : '☆'}
                    </button>
                </div>

                {/* Secondary Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateCoverLetter}
                        disabled={generatingCoverLetter || !resumeText}
                        className="flex-1 px-3 py-2 border border-purple-300 bg-purple-50 text-purple-700 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generate cover letter with AI"
                    >
                        {generatingCoverLetter ? '⏳ Generating...' : '✍️ Cover Letter'}
                    </button>
                    <button
                        onClick={() => setShowTailoring(!showTailoring)}
                        disabled={!resumeText}
                        className="flex-1 px-3 py-2 border border-orange-300 bg-orange-50 text-orange-700 rounded-md text-sm font-medium hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Get resume tailoring tips"
                    >
                        💡 Tailor Resume
                    </button>
                    <button
                        onClick={handleMarkAsApplied}
                        disabled={applied}
                        className="px-4 py-2 border border-green-300 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Mark as applied"
                    >
                        {applied ? '✓' : '✓'}
                    </button>
                </div>
                
                {/* Tailoring Modal */}
                {showTailoring && resumeText && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-orange-900">Resume Tailoring Tips</h4>
                            <button
                                onClick={() => setShowTailoring(false)}
                                className="text-orange-600 hover:text-orange-800"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-sm text-orange-800 mb-3">
                            Get AI-powered suggestions to tailor your resume for this specific job
                        </p>
                        <Link
                            to={`/job-applier?tailoring=${job.job_id}`}
                            className="inline-block px-4 py-2 bg-orange-600 text-white rounded text-sm font-semibold hover:bg-orange-700"
                        >
                            View Full Tailoring Report →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

