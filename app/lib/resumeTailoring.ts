// Resume Tailoring Suggestions using Puter AI

export interface TailoringS

uggestion {
    category: 'add' | 'emphasize' | 'reword' | 'remove';
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    reason: string;
    example?: string;
}

export interface ResumeTailoringReport {
    job_title: string;
    company: string;
    match_score: number;
    overall_assessment: string;
    key_strengths: string[];
    suggestions: TailoringS

uggestion[];
    keywords_to_add: string[];
    sections_to_expand: string[];
}

const TAILORING_PROMPT = (resumeText: string, job: JobMatchResult) => `
You are an expert resume coach and ATS optimization specialist. Analyze this resume against the specific job posting and provide detailed, actionable tailoring suggestions.

CANDIDATE'S RESUME:
${resumeText}

TARGET JOB:
Title: ${job.job_title}
Company: ${job.company}
Location: ${job.location}
Current Match Score: ${job.match_score}%

MATCHED SKILLS: ${job.matched_skills.join(', ')}
MISSING SKILLS: ${job.missing_skills.join(', ')}

JOB NOTES: ${job.dashboard_note}

ANALYSIS REQUIREMENTS:
1. Provide 8-12 specific, actionable suggestions to tailor this resume for this exact job
2. Categorize each suggestion as: 'add', 'emphasize', 'reword', or 'remove'
3. Prioritize suggestions: 'high', 'medium', or 'low'
4. For each suggestion, explain WHY it helps (ATS, relevance, keywords, etc.)
5. Provide specific examples when possible
6. Identify 5-7 keywords from the job that should appear in the resume
7. Suggest which resume sections need more detail

IMPORTANT:
- Be specific (don't say "add more details", say exactly what to add)
- Focus on this exact job, not generic advice
- Consider ATS optimization
- Don't fabricate experience - only suggest emphasizing existing skills
- Provide concrete examples

Return the response in this EXACT JSON format:
{
  "overall_assessment": "Brief 2-3 sentence assessment of how well the resume fits this job",
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "suggestions": [
    {
      "category": "add|emphasize|reword|remove",
      "priority": "high|medium|low",
      "suggestion": "Specific actionable suggestion",
      "reason": "Why this helps for THIS job",
      "example": "Optional concrete example"
    }
  ],
  "keywords_to_add": ["keyword1", "keyword2", ...],
  "sections_to_expand": ["section name 1", "section name 2", ...]
}`;

export async function generateTailoringSuggestions(
    aiChat: (prompt: string | any[], options?: any) => Promise<any>,
    resumeText: string,
    job: JobMatchResult
): Promise<ResumeTailoringReport> {
    try {
        console.log('Generating resume tailoring suggestions for:', job.job_title);
        
        const response = await aiChat(
            [
                {
                    role: "system",
                    content: "You are an expert resume coach, ATS specialist, and career advisor. Provide specific, actionable resume tailoring advice."
                },
                {
                    role: "user",
                    content: TAILORING_PROMPT(resumeText, job)
                }
            ],
            {
                model: "claude-3-7-sonnet-latest",
                temperature: 0.3 // Lower temperature for more consistent, factual advice
            }
        );

        // Extract content from response
        let content = '';
        if (response?.message?.content) {
            const responseContent = response.message.content;
            if (typeof responseContent === 'string') {
                content = responseContent;
            } else if (Array.isArray(responseContent)) {
                content = responseContent
                    .filter((block: any) => block.type === 'text' || typeof block === 'string')
                    .map((block: any) => typeof block === 'string' ? block : block.text)
                    .join('\n');
            } else if (responseContent.text) {
                content = responseContent.text;
            }
        }

        // Clean up JSON response
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const parsed = JSON.parse(content);

        const report: ResumeTailoringReport = {
            job_title: job.job_title,
            company: job.company,
            match_score: job.match_score,
            overall_assessment: parsed.overall_assessment || 'Analysis completed',
            key_strengths: parsed.key_strengths || [],
            suggestions: parsed.suggestions || [],
            keywords_to_add: parsed.keywords_to_add || [],
            sections_to_expand: parsed.sections_to_expand || []
        };

        console.log('Tailoring suggestions generated successfully');
        return report;
    } catch (error) {
        console.error('Error generating tailoring suggestions:', error);
        throw error;
    }
}

