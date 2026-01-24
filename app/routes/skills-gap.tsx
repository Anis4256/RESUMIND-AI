import type { Route } from "./+types/skills-gap";
import Navbar from "~/components/Navbar";
import { usePuterStore } from "~/lib/puter";
import { useNavigate, Link } from "react-router";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Skills Gap Analysis - Resumind" },
        { name: "description", content: "Analyze your skills and identify gaps" },
    ];
}

interface SkillAnalysis {
    skill: string;
    frequency: number;
    jobs_requiring: string[];
}

interface SkillGapData {
    total_jobs_analyzed: number;
    top_missing_skills: SkillAnalysis[];
    top_matched_skills: SkillAnalysis[];
    recommendations: string[];
    skill_categories: {
        technical: SkillAnalysis[];
        soft: SkillAnalysis[];
        tools: SkillAnalysis[];
    };
}

export default function SkillsGap() {
    const { auth, kv } = usePuterStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [skillGapData, setSkillGapData] = useState<SkillGapData | null>(null);

    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate('/auth?next=/skills-gap');
        }
    }, [auth.isAuthenticated]);

    useEffect(() => {
        analyzeSkillsGap();
    }, []);

    const analyzeSkillsGap = async () => {
        setLoading(true);
        
        try {
            // Get all job searches from KV store
            const searchKeys = await kv.list('job_search:*', false);
            
            if (!searchKeys || searchKeys.length === 0) {
                setLoading(false);
                return;
            }

            // Collect all missing and matched skills
            const missingSkillsMap = new Map<string, { count: number; jobs: string[] }>();
            const matchedSkillsMap = new Map<string, { count: number; jobs: string[] }>();
            let totalJobs = 0;

            for (const key of searchKeys) {
                const searchData = await kv.get(key as string);
                if (!searchData) continue;

                const parsed = JSON.parse(searchData);
                const jobs = parsed.results?.jobs || [];
                
                jobs.forEach((job: JobMatchResult) => {
                    totalJobs++;
                    
                    // Count missing skills
                    job.missing_skills.forEach(skill => {
                        const existing = missingSkillsMap.get(skill) || { count: 0, jobs: [] };
                        existing.count++;
                        existing.jobs.push(`${job.job_title} at ${job.company}`);
                        missingSkillsMap.set(skill, existing);
                    });

                    // Count matched skills
                    job.matched_skills.forEach(skill => {
                        const existing = matchedSkillsMap.get(skill) || { count: 0, jobs: [] };
                        existing.count++;
                        existing.jobs.push(`${job.job_title} at ${job.company}`);
                        matchedSkillsMap.set(skill, existing);
                    });
                });
            }

            // Convert to arrays and sort
            const topMissingSkills: SkillAnalysis[] = Array.from(missingSkillsMap.entries())
                .map(([skill, data]) => ({
                    skill,
                    frequency: data.count,
                    jobs_requiring: data.jobs.slice(0, 5)
                }))
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, 20);

            const topMatchedSkills: SkillAnalysis[] = Array.from(matchedSkillsMap.entries())
                .map(([skill, data]) => ({
                    skill,
                    frequency: data.count,
                    jobs_requiring: data.jobs.slice(0, 5)
                }))
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, 15);

            // Generate recommendations
            const recommendations: string[] = [];
            
            if (topMissingSkills.length > 0) {
                const topSkill = topMissingSkills[0];
                recommendations.push(`Focus on learning ${topSkill.skill} - it appears in ${topSkill.frequency} jobs`);
            }
            
            if (topMissingSkills.length >= 3) {
                const top3 = topMissingSkills.slice(0, 3).map(s => s.skill);
                recommendations.push(`Consider taking a course covering: ${top3.join(', ')}`);
            }
            
            if (topMatchedSkills.length > 0) {
                recommendations.push(`Your strongest skills (${topMatchedSkills.slice(0, 3).map(s => s.skill).join(', ')}) are highly valued - emphasize these in applications`);
            }

            const skillGapAnalysis: SkillGapData = {
                total_jobs_analyzed: totalJobs,
                top_missing_skills: topMissingSkills,
                top_matched_skills: topMatchedSkills,
                recommendations,
                skill_categories: {
                    technical: topMissingSkills.filter(s => 
                        /programming|code|develop|engineer|data|sql|python|java|react|aws/i.test(s.skill)
                    ).slice(0, 10),
                    soft: topMissingSkills.filter(s => 
                        /communication|leadership|team|management|collaborate/i.test(s.skill)
                    ).slice(0, 10),
                    tools: topMissingSkills.filter(s => 
                        /git|docker|kubernetes|jira|figma|excel|powerpoint/i.test(s.skill)
                    ).slice(0, 10)
                }
            };

            setSkillGapData(skillGapAnalysis);
        } catch (error) {
            console.error('Error analyzing skills gap:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />

            <section className="main-section py-8">
                {/* Page Header */}
                <div className="page-heading py-8">
                    <h1>📊 Skills Gap Analysis</h1>
                    <h2>Identify skills to learn and strengths to emphasize</h2>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <img src="/images/resume-scan-2.gif" className="w-[200px] mb-4" alt="Loading" />
                        <p className="text-lg font-semibold text-gray-700">Analyzing your skills gap...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && (!skillGapData || skillGapData.total_jobs_analyzed === 0) && (
                    <div className="text-center py-12 max-w-2xl mx-auto">
                        <div className="text-6xl mb-4">📈</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            No Data Yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Search for jobs first to analyze your skills gap. The more jobs you search, the better insights you'll get!
                        </p>
                        <Link
                            to="/job-applier"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            🔍 Search for Jobs
                        </Link>
                    </div>
                )}

                {/* Skills Gap Dashboard */}
                {!loading && skillGapData && skillGapData.total_jobs_analyzed > 0 && (
                    <div className="max-w-7xl mx-auto">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-md p-6 text-center">
                                <p className="text-4xl font-bold text-blue-600 mb-2">
                                    {skillGapData.total_jobs_analyzed}
                                </p>
                                <p className="text-gray-600">Jobs Analyzed</p>
                            </div>
                            <div className="bg-red-50 rounded-lg shadow-md p-6 text-center border-2 border-red-200">
                                <p className="text-4xl font-bold text-red-600 mb-2">
                                    {skillGapData.top_missing_skills.length}
                                </p>
                                <p className="text-gray-700 font-semibold">Skills to Learn</p>
                            </div>
                            <div className="bg-green-50 rounded-lg shadow-md p-6 text-center border-2 border-green-200">
                                <p className="text-4xl font-bold text-green-600 mb-2">
                                    {skillGapData.top_matched_skills.length}
                                </p>
                                <p className="text-gray-700 font-semibold">Your Strengths</p>
                            </div>
                        </div>

                        {/* Recommendations */}
                        {skillGapData.recommendations.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6 mb-8">
                                <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                                    💡 Personalized Recommendations
                                </h3>
                                <ul className="space-y-3">
                                    {skillGapData.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="text-purple-600 font-bold mt-1">{idx + 1}.</span>
                                            <span className="text-gray-800">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Top Missing Skills */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                🎯 Top Skills to Learn
                            </h3>
                            <p className="text-gray-600 mb-6">
                                These skills appear most frequently in jobs where you didn't match
                            </p>
                            <div className="space-y-4">
                                {skillGapData.top_missing_skills.slice(0, 10).map((skill, idx) => (
                                    <div key={idx} className="border-l-4 border-red-500 pl-4 py-2">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900 text-lg">{skill.skill}</h4>
                                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                                {skill.frequency} jobs
                                            </span>
                                        </div>
                                        <div className="bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                                            <div 
                                                className="bg-red-500 h-full"
                                                style={{ width: `${(skill.frequency / skillGapData.total_jobs_analyzed) * 100}%` }}
                                            />
                                        </div>
                                        <details className="text-sm text-gray-600">
                                            <summary className="cursor-pointer hover:text-gray-800">
                                                View jobs requiring this skill
                                            </summary>
                                            <ul className="mt-2 ml-4 list-disc">
                                                {skill.jobs_requiring.slice(0, 3).map((job, jIdx) => (
                                                    <li key={jIdx}>{job}</li>
                                                ))}
                                            </ul>
                                        </details>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Your Strengths */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                ✨ Your Strengths
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Skills you already have that employers are looking for
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {skillGapData.top_matched_skills.map((skill, idx) => (
                                    <div key={idx} className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
                                        <p className="font-bold text-gray-900 mb-2">{skill.skill}</p>
                                        <p className="text-sm text-green-700">{skill.frequency} matches</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Skill Categories */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Technical Skills */}
                            {skillGapData.skill_categories.technical.length > 0 && (
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        💻 Technical Skills
                                    </h4>
                                    <ul className="space-y-2">
                                        {skillGapData.skill_categories.technical.map((skill, idx) => (
                                            <li key={idx} className="flex justify-between items-center">
                                                <span className="text-gray-700">{skill.skill}</span>
                                                <span className="text-sm text-gray-500">{skill.frequency}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Soft Skills */}
                            {skillGapData.skill_categories.soft.length > 0 && (
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        🤝 Soft Skills
                                    </h4>
                                    <ul className="space-y-2">
                                        {skillGapData.skill_categories.soft.map((skill, idx) => (
                                            <li key={idx} className="flex justify-between items-center">
                                                <span className="text-gray-700">{skill.skill}</span>
                                                <span className="text-sm text-gray-500">{skill.frequency}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Tools */}
                            {skillGapData.skill_categories.tools.length > 0 && (
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        🛠️ Tools & Platforms
                                    </h4>
                                    <ul className="space-y-2">
                                        {skillGapData.skill_categories.tools.map((skill, idx) => (
                                            <li key={idx} className="flex justify-between items-center">
                                                <span className="text-gray-700">{skill.skill}</span>
                                                <span className="text-sm text-gray-500">{skill.frequency}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-center">
                            <Link
                                to="/job-applier"
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                🔍 Search More Jobs
                            </Link>
                            <button
                                onClick={analyzeSkillsGap}
                                className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                            >
                                🔄 Refresh Analysis
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

