// Cover Letter Generator using Puter AI

export const COVER_LETTER_PROMPT = (resumeText: string, job: JobMatchResult) => `
You are an expert career coach and cover letter writer. Generate a professional, compelling cover letter for the following job application.

CANDIDATE'S RESUME:
${resumeText}

JOB DETAILS:
Title: ${job.job_title}
Company: ${job.company}
Location: ${job.location}
Match Score: ${job.match_score}%

MATCHED SKILLS:
${job.matched_skills.join(', ')}

MISSING SKILLS:
${job.missing_skills.join(', ')}

INSTRUCTIONS:
1. Write a professional cover letter (250-350 words)
2. Address the hiring manager (use "Dear Hiring Manager" if name unknown)
3. Express genuine enthusiasm for the role and company
4. Highlight relevant experience and skills from the resume that match the job
5. Address 2-3 of the matched skills specifically
6. Show awareness of missing skills and willingness to learn
7. Include a strong closing with call to action
8. Use professional but personable tone
9. Be specific and avoid generic phrases
10. DO NOT fabricate experiences not in the resume

FORMAT:
Return ONLY the cover letter text, without any additional commentary, formatting, or explanations.
Do not include [Your Name], [Your Address], or date - just the letter body.
Start with the salutation.
`;

export async function generateCoverLetter(
    aiChat: (prompt: string | any[], options?: any) => Promise<any>,
    resumeText: string,
    job: JobMatchResult
): Promise<string> {
    try {
        console.log('Generating cover letter for:', job.job_title, 'at', job.company);
        
        const response = await aiChat(
            [
                {
                    role: "system",
                    content: "You are an expert career coach and cover letter writer. Write professional, personalized cover letters based on the candidate's resume and job description."
                },
                {
                    role: "user",
                    content: COVER_LETTER_PROMPT(resumeText, job)
                }
            ],
            {
                model: "claude-3-7-sonnet-latest",
                temperature: 0.7 // Slightly higher for more creative/personalized writing
            }
        );

        // Extract content from response
        let coverLetter = '';
        if (response?.message?.content) {
            const content = response.message.content;
            if (typeof content === 'string') {
                coverLetter = content;
            } else if (Array.isArray(content)) {
                coverLetter = content
                    .filter((block: any) => block.type === 'text' || typeof block === 'string')
                    .map((block: any) => typeof block === 'string' ? block : block.text)
                    .join('\n');
            } else if (content.text) {
                coverLetter = content.text;
            }
        }

        if (!coverLetter || coverLetter.trim().length === 0) {
            throw new Error('AI returned empty cover letter');
        }

        console.log('Cover letter generated successfully, length:', coverLetter.length);
        return coverLetter.trim();
    } catch (error) {
        console.error('Error generating cover letter:', error);
        throw error;
    }
}

// Generate a quick summary/pitch (for job cards)
export async function generateQuickPitch(
    aiChat: (prompt: string | any[], options?: any) => Promise<any>,
    resumeText: string,
    job: JobMatchResult
): Promise<string> {
    try {
        const prompt = `Based on this resume and job, write a 2-sentence pitch explaining why this candidate is a good fit:

RESUME HIGHLIGHTS: ${resumeText.substring(0, 500)}...
JOB: ${job.job_title} at ${job.company}
MATCHED SKILLS: ${job.matched_skills.slice(0, 5).join(', ')}

Write 2 compelling sentences. Be specific and confident. Return ONLY the pitch text.`;

        const response = await aiChat(
            prompt,
            {
                model: "claude-3-7-sonnet-latest",
                temperature: 0.5
            }
        );

        let pitch = '';
        if (response?.message?.content) {
            const content = response.message.content;
            if (typeof content === 'string') {
                pitch = content;
            } else if (Array.isArray(content)) {
                pitch = content
                    .filter((block: any) => block.type === 'text' || typeof block === 'string')
                    .map((block: any) => typeof block === 'string' ? block : block.text)
                    .join(' ');
            }
        }

        return pitch.trim();
    } catch (error) {
        console.error('Error generating quick pitch:', error);
        return '';
    }
}

