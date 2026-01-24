// Job Storage Utilities for Save/Bookmark and Application Tracking

export const JobStorageKeys = {
    SAVED_JOBS: 'saved_jobs',
    APPLICATIONS: 'applications',
    COVER_LETTERS: 'cover_letters',
} as const;

// ===== SAVED JOBS =====

export async function saveJob(
    kv: { get: (key: string) => Promise<string | null | undefined>, set: (key: string, value: string) => Promise<boolean | undefined> },
    job: JobMatchResult,
    notes?: string
): Promise<boolean> {
    try {
        const savedJobsJson = await kv.get(JobStorageKeys.SAVED_JOBS);
        const savedJobs: SavedJob[] = savedJobsJson ? JSON.parse(savedJobsJson) : [];
        
        // Check if already saved
        const existingIndex = savedJobs.findIndex(s => s.job.job_id === job.job_id);
        
        const savedJob: SavedJob = {
            job,
            saved_at: Date.now(),
            notes
        };
        
        if (existingIndex >= 0) {
            // Update existing
            savedJobs[existingIndex] = savedJob;
        } else {
            // Add new
            savedJobs.push(savedJob);
        }
        
        await kv.set(JobStorageKeys.SAVED_JOBS, JSON.stringify(savedJobs));
        return true;
    } catch (error) {
        console.error('Error saving job:', error);
        return false;
    }
}

export async function unsaveJob(
    kv: { get: (key: string) => Promise<string | null | undefined>, set: (key: string, value: string) => Promise<boolean | undefined> },
    jobId: string
): Promise<boolean> {
    try {
        const savedJobsJson = await kv.get(JobStorageKeys.SAVED_JOBS);
        const savedJobs: SavedJob[] = savedJobsJson ? JSON.parse(savedJobsJson) : [];
        
        const filtered = savedJobs.filter(s => s.job.job_id !== jobId);
        await kv.set(JobStorageKeys.SAVED_JOBS, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error unsaving job:', error);
        return false;
    }
}

export async function getSavedJobs(
    kv: { get: (key: string) => Promise<string | null | undefined> }
): Promise<SavedJob[]> {
    try {
        const savedJobsJson = await kv.get(JobStorageKeys.SAVED_JOBS);
        return savedJobsJson ? JSON.parse(savedJobsJson) : [];
    } catch (error) {
        console.error('Error getting saved jobs:', error);
        return [];
    }
}

export async function isJobSaved(
    kv: { get: (key: string) => Promise<string | null | undefined> },
    jobId: string
): Promise<boolean> {
    try {
        const savedJobs = await getSavedJobs(kv);
        return savedJobs.some(s => s.job.job_id === jobId);
    } catch (error) {
        console.error('Error checking if job is saved:', error);
        return false;
    }
}

// ===== JOB APPLICATIONS =====

export async function markJobAsApplied(
    kv: { get: (key: string) => Promise<string | null | undefined>, set: (key: string, value: string) => Promise<boolean | undefined> },
    job: JobMatchResult,
    coverLetter?: string,
    notes?: string
): Promise<boolean> {
    try {
        const applicationsJson = await kv.get(JobStorageKeys.APPLICATIONS);
        const applications: JobApplication[] = applicationsJson ? JSON.parse(applicationsJson) : [];
        
        // Check if already applied
        const existingIndex = applications.findIndex(a => a.job.job_id === job.job_id);
        
        const application: JobApplication = {
            job,
            applied_at: Date.now(),
            status: 'applied',
            notes,
            cover_letter: coverLetter
        };
        
        if (existingIndex >= 0) {
            // Update existing
            applications[existingIndex] = application;
        } else {
            // Add new
            applications.push(application);
        }
        
        await kv.set(JobStorageKeys.APPLICATIONS, JSON.stringify(applications));
        return true;
    } catch (error) {
        console.error('Error marking job as applied:', error);
        return false;
    }
}

export async function updateApplicationStatus(
    kv: { get: (key: string) => Promise<string | null | undefined>, set: (key: string, value: string) => Promise<boolean | undefined> },
    jobId: string,
    status: JobApplication['status'],
    notes?: string
): Promise<boolean> {
    try {
        const applicationsJson = await kv.get(JobStorageKeys.APPLICATIONS);
        const applications: JobApplication[] = applicationsJson ? JSON.parse(applicationsJson) : [];
        
        const appIndex = applications.findIndex(a => a.job.job_id === jobId);
        if (appIndex >= 0) {
            applications[appIndex].status = status;
            if (notes) applications[appIndex].notes = notes;
            await kv.set(JobStorageKeys.APPLICATIONS, JSON.stringify(applications));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating application status:', error);
        return false;
    }
}

export async function getApplications(
    kv: { get: (key: string) => Promise<string | null | undefined> }
): Promise<JobApplication[]> {
    try {
        const applicationsJson = await kv.get(JobStorageKeys.APPLICATIONS);
        return applicationsJson ? JSON.parse(applicationsJson) : [];
    } catch (error) {
        console.error('Error getting applications:', error);
        return [];
    }
}

export async function hasAppliedToJob(
    kv: { get: (key: string) => Promise<string | null | undefined> },
    jobId: string
): Promise<boolean> {
    try {
        const applications = await getApplications(kv);
        return applications.some(a => a.job.job_id === jobId);
    } catch (error) {
        console.error('Error checking if applied to job:', error);
        return false;
    }
}

// ===== COVER LETTERS =====

export async function saveCoverLetter(
    kv: { get: (key: string) => Promise<string | null | undefined>, set: (key: string, value: string) => Promise<boolean | undefined> },
    jobId: string,
    jobTitle: string,
    company: string,
    content: string
): Promise<boolean> {
    try {
        const coverLettersJson = await kv.get(JobStorageKeys.COVER_LETTERS);
        const coverLetters: CoverLetter[] = coverLettersJson ? JSON.parse(coverLettersJson) : [];
        
        // Check if already exists
        const existingIndex = coverLetters.findIndex(c => c.job_id === jobId);
        
        const coverLetter: CoverLetter = {
            job_id: jobId,
            job_title: jobTitle,
            company,
            content,
            generated_at: Date.now()
        };
        
        if (existingIndex >= 0) {
            coverLetters[existingIndex] = coverLetter;
        } else {
            coverLetters.push(coverLetter);
        }
        
        await kv.set(JobStorageKeys.COVER_LETTERS, JSON.stringify(coverLetters));
        return true;
    } catch (error) {
        console.error('Error saving cover letter:', error);
        return false;
    }
}

export async function getCoverLetter(
    kv: { get: (key: string) => Promise<string | null | undefined> },
    jobId: string
): Promise<CoverLetter | null> {
    try {
        const coverLettersJson = await kv.get(JobStorageKeys.COVER_LETTERS);
        const coverLetters: CoverLetter[] = coverLettersJson ? JSON.parse(coverLettersJson) : [];
        return coverLetters.find(c => c.job_id === jobId) || null;
    } catch (error) {
        console.error('Error getting cover letter:', error);
        return null;
    }
}

export async function getAllCoverLetters(
    kv: { get: (key: string) => Promise<string | null | undefined> }
): Promise<CoverLetter[]> {
    try {
        const coverLettersJson = await kv.get(JobStorageKeys.COVER_LETTERS);
        return coverLettersJson ? JSON.parse(coverLettersJson) : [];
    } catch (error) {
        console.error('Error getting all cover letters:', error);
        return [];
    }
}

