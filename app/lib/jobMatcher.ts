// Job Matching Logic using Puter.js AI

export const JOB_MATCH_SYSTEM_PROMPT = `You are an expert career advisor and resume matcher. Your role is to analyze job listings against a candidate's resume and provide intelligent matching recommendations.

STRICT RULES:
- Do NOT auto-submit job applications
- Do NOT fabricate skills, experience, or qualifications
- Recommend "apply" ONLY if match score is 60% or higher
- Recommend "review" if match score is 40-59%
- Recommend "skip" if match score is below 40%
- Be honest and realistic in your assessment
- Consider both technical skills and soft skills
- Factor in experience level requirements

OUTPUT FORMAT:
Return ONLY valid JSON without any markdown formatting or extra text.`;

export interface JobMatchAnalysisInput {
    resume_text: string;
    job: JobListing;
}

export const generateJobMatchPrompt = (input: JobMatchAnalysisInput): string => {
    return `Analyze the following job listing against the candidate's resume and provide a detailed match assessment.

CANDIDATE RESUME:
${input.resume_text}

JOB LISTING:
Title: ${input.job.job_title}
Company: ${input.job.company}
Location: ${input.job.location}
Description: ${input.job.description}

ANALYSIS REQUIREMENTS:
1. Calculate a match score (0-100) based on:
   - Skills alignment
   - Experience level match
   - Job requirements coverage
   - Career trajectory fit

2. Identify:
   - Matched skills (skills from resume that match job requirements)
   - Missing skills (key job requirements not in resume)

3. Make a decision:
   - "apply" if match score >= 60%
   - "review" if match score is 40-59%
   - "skip" if match score < 40%

4. Provide a concise dashboard note (max 150 characters) explaining the decision

5. Confirm if AI assets are ready:
   - resume: true (we'll use the existing resume)
   - cover_letter: true (we can generate one)

Return the response in this EXACT JSON format:
{
    "match_score": 0,
    "decision": "apply",
    "matched_skills": [],
    "missing_skills": [],
    "ai_assets_ready": {
        "resume": true,
        "cover_letter": true
    },
    "dashboard_note": ""
}`;
};

export async function analyzeJobMatch(
    aiChat: (prompt: string | any[], options?: any) => Promise<any>,
    input: JobMatchAnalysisInput
): Promise<Omit<JobMatchResult, 'job_id' | 'job_title' | 'company' | 'location' | 'redirect_url' | 'apply_method'>> {
    try {
        const prompt = generateJobMatchPrompt(input);
        
        const response = await aiChat(
            [
                {
                    role: "system",
                    content: JOB_MATCH_SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            { 
                model: "claude-3-7-sonnet-latest",
                temperature: 0.3 
            }
        );

        // Parse the AI response
        let content = response.message.content;
        if (typeof content !== 'string') {
            content = content[0]?.text || '{}';
        }

        // Clean up the response - remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const parsed = JSON.parse(content);

        // Validate and return
        return {
            match_score: Math.min(100, Math.max(0, parsed.match_score || 0)),
            decision: ['apply', 'review', 'skip'].includes(parsed.decision) 
                ? parsed.decision 
                : 'skip',
            matched_skills: Array.isArray(parsed.matched_skills) 
                ? parsed.matched_skills 
                : [],
            missing_skills: Array.isArray(parsed.missing_skills) 
                ? parsed.missing_skills 
                : [],
            ai_assets_ready: {
                resume: true,
                cover_letter: true
            },
            dashboard_note: parsed.dashboard_note || 'Analysis completed'
        };
    } catch (error) {
        console.error('Error analyzing job match:', error);
        
        // Return safe default
        return {
            match_score: 0,
            decision: 'skip',
            matched_skills: [],
            missing_skills: [],
            ai_assets_ready: {
                resume: false,
                cover_letter: false
            },
            dashboard_note: 'Error analyzing job match'
        };
    }
}

export async function analyzeMultipleJobs(
    aiChat: (prompt: string | any[], options?: any) => Promise<any>,
    resumeText: string,
    jobs: JobListing[]
): Promise<JobApplierDashboard> {
    const results: JobMatchResult[] = [];
    
    // Analyze each job
    for (const job of jobs) {
        const analysis = await analyzeJobMatch(aiChat, {
            resume_text: resumeText,
            job
        });
        
        results.push({
            job_id: job.job_id,
            job_title: job.job_title,
            company: job.company,
            location: job.location,
            redirect_url: job.redirect_url,
            apply_method: 'assisted_apply',
            ...analysis
        });
    }
    
    // Calculate dashboard summary
    const summary = {
        total_jobs: results.length,
        recommended_to_apply: results.filter(r => r.decision === 'apply').length,
        needs_review: results.filter(r => r.decision === 'review').length,
        skipped: results.filter(r => r.decision === 'skip').length
    };
    
    // Generate global recommendations
    const globalRecommendations: string[] = [];
    
    // Collect all missing skills
    const allMissingSkills = new Map<string, number>();
    results.forEach(r => {
        r.missing_skills.forEach(skill => {
            allMissingSkills.set(skill, (allMissingSkills.get(skill) || 0) + 1);
        });
    });
    
    // Find most common missing skills
    const topMissingSkills = Array.from(allMissingSkills.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([skill]) => skill);
    
    if (topMissingSkills.length > 0) {
        globalRecommendations.push(
            `Consider developing these in-demand skills: ${topMissingSkills.join(', ')}`
        );
    }
    
    if (summary.recommended_to_apply === 0) {
        globalRecommendations.push(
            'No strong matches found. Consider broadening your search criteria or updating your resume.'
        );
    } else if (summary.recommended_to_apply > 5) {
        globalRecommendations.push(
            'Great! You have multiple strong matches. Prioritize applications based on match scores.'
        );
    }
    
    return {
        dashboard_summary: summary,
        jobs: results,
        global_recommendations: globalRecommendations
    };
}

