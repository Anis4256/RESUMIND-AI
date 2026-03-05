// Adzuna API Integration for Job Search
// Note: You'll need to get your API credentials from https://developer.adzuna.com/

const ADZUNA_APP_ID = import.meta.env.VITE_ADZUNA_APP_ID || 'YOUR_APP_ID';
const ADZUNA_API_KEY = import.meta.env.VITE_ADZUNA_API_KEY || 'YOUR_API_KEY';
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

export interface AdzunaSearchParams {
    what?: string; // job title or keywords
    where?: string; // location
    results_per_page?: number;
    max_days_old?: number;
    salary_min?: number;
    contract_type?: string; // full_time, part_time, contract
}

export interface AdzunaJob {
    id: string;
    title: string;
    company: {
        display_name: string;
    };
    location: {
        display_name: string;
    };
    description: string;
    salary_min?: number;
    salary_max?: number;
    contract_type?: string;
    redirect_url: string;
    created: string;
}

export async function searchJobs(
    country: string = 'us',
    params: AdzunaSearchParams
): Promise<JobListing[]> {
    try {
        // Check if API credentials are configured
        if (ADZUNA_APP_ID === 'YOUR_APP_ID' || ADZUNA_API_KEY === 'YOUR_API_KEY') {
            throw new Error('Adzuna API credentials not configured. Please add VITE_ADZUNA_APP_ID and VITE_ADZUNA_API_KEY to your .env file. Get free credentials at https://developer.adzuna.com/');
        }

        const queryParams = new URLSearchParams();
        
        if (params.what) queryParams.append('what', params.what);
        if (params.where) queryParams.append('where', params.where);
        queryParams.append('results_per_page', String(params.results_per_page || 20));
        queryParams.append('content-type', 'application/json');
        
        if (params.max_days_old) {
            queryParams.append('max_days_old', String(params.max_days_old));
        }

        const url = `${ADZUNA_BASE_URL}/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&${queryParams.toString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Adzuna API error response:', errorText);
            
            if (response.status === 401) {
                throw new Error('Invalid Adzuna API credentials. Please check your VITE_ADZUNA_APP_ID and VITE_ADZUNA_API_KEY in the .env file.');
            } else if (response.status === 429) {
                throw new Error('Adzuna API rate limit exceeded. Please try again later.');
            } else {
                throw new Error(`Adzuna API error (${response.status}): ${response.statusText}`);
            }
        }

        const data = await response.json();
        
        // Check if we have results
        if (!data.results || data.results.length === 0) {
            throw new Error('No jobs found matching your criteria. Try different search terms or location.');
        }
        
        // Transform Adzuna response to our JobListing format
        return data.results.map((job: AdzunaJob) => ({
            job_id: job.id,
            job_title: job.title,
            company: job.company.display_name,
            location: job.location.display_name,
            description: job.description,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            contract_type: job.contract_type,
            redirect_url: job.redirect_url,
            created: job.created,
        }));
    } catch (error) {
        console.error('Error fetching jobs from Adzuna:', error);
        throw error;
    }
}

export async function getJobDetails(
    country: string = 'us',
    jobId: string
): Promise<JobListing | null> {
    try {
        const url = `${ADZUNA_BASE_URL}/${country}/details/${jobId}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Adzuna API error: ${response.statusText}`);
        }

        const job: AdzunaJob = await response.json();
        
        return {
            job_id: job.id,
            job_title: job.title,
            company: job.company.display_name,
            location: job.location.display_name,
            description: job.description,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            contract_type: job.contract_type,
            redirect_url: job.redirect_url,
            created: job.created,
        };
    } catch (error) {
        console.error('Error fetching job details from Adzuna:', error);
        return null;
    }
}

