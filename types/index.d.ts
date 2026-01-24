interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    imagePath: string;
    resumePath: string;
    feedback: Feedback;
}

interface Feedback {
    overallScore: number;
    ATS: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
        }[];
    };
    toneAndStyle: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    content: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    structure: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    skills: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
}

interface JobListing {
    job_id: string;
    job_title: string;
    company: string;
    location: string;
    description: string;
    salary_min?: number;
    salary_max?: number;
    contract_type?: string;
    redirect_url: string;
    created?: string;
}

interface JobMatchResult {
    job_id: string;
    job_title: string;
    company: string;
    location: string;
    match_score: number;
    decision: "apply" | "review" | "skip";
    matched_skills: string[];
    missing_skills: string[];
    ai_assets_ready: {
        resume: boolean;
        cover_letter: boolean;
    };
    apply_method: "assisted_apply";
    dashboard_note: string;
    redirect_url: string;
}

interface JobApplierDashboard {
    dashboard_summary: {
        total_jobs: number;
        recommended_to_apply: number;
        needs_review: number;
        skipped: number;
    };
    jobs: JobMatchResult[];
    global_recommendations: string[];
}

interface UserJobPreferences {
    job_title?: string;
    location?: string;
    contract_type?: string;
    salary_min?: number;
    results_per_page?: number;
}

interface SavedJob {
    job: JobMatchResult;
    saved_at: number;
    notes?: string;
}

interface JobApplication {
    job: JobMatchResult;
    applied_at: number;
    status: 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
    notes?: string;
    cover_letter?: string;
    follow_up_date?: number;
}

interface CoverLetter {
    job_id: string;
    job_title: string;
    company: string;
    content: string;
    generated_at: number;
}