# Auto Job Applier Feature - Setup Guide

## Overview

The Auto Job Applier is an AI-powered feature that helps users find and apply to jobs that match their resume. It uses the Adzuna Job Search API to fetch job listings and Puter.js AI to analyze and match jobs against the user's resume.

## Features

- 🔍 **Smart Job Search**: Search jobs by title, location, and other criteria
- 🤖 **AI-Powered Matching**: Analyze resume-to-job match using Claude AI
- 📊 **Match Scoring**: Get match scores (0-100) for each job
- ✅ **Skills Analysis**: See matched skills and missing skills
- 🎯 **Smart Recommendations**: Get AI recommendations (Apply/Review/Skip)
- 📋 **Dashboard View**: Beautiful dashboard with statistics and insights
- 🔒 **Assisted Apply**: No auto-submission - user always controls the application

## Tech Stack

- **Job API**: Adzuna Job Search API
- **AI**: Puter.js AI (Claude 3.7 Sonnet)
- **Authentication**: Puter.js Auth
- **Storage**: Puter.js KV Store & File System
- **Frontend**: React Router 7 + TypeScript

## Setup Instructions

### 1. Get Adzuna API Credentials

1. Go to [https://developer.adzuna.com/](https://developer.adzuna.com/)
2. Sign up for a free account
3. Create a new application
4. Copy your `App ID` and `API Key`

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_ADZUNA_APP_ID=your_app_id_here
VITE_ADZUNA_API_KEY=your_api_key_here
```

**Important**: Add `.env` to your `.gitignore` to keep credentials secure!

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

### 5. Access the Feature

1. Navigate to the application in your browser
2. Sign in with Puter.js Auth
3. Upload a resume (if you haven't already)
4. Click "🤖 Auto Job Applier" in the navigation bar
5. Enter job search criteria and click "Find Matching Jobs"

## How It Works

### Workflow

1. **User Authentication**: User must be signed in via Puter.js Auth
2. **Resume Retrieval**: Fetches user's latest resume from Puter.js KV Store
3. **Resume Analysis**: Extracts text from resume PDF using Puter.js AI (img2txt)
4. **Job Search**: Queries Adzuna API for matching job listings
5. **AI Matching**: For each job:
   - Analyzes resume against job description
   - Calculates match score (0-100)
   - Identifies matched and missing skills
   - Provides recommendation (Apply/Review/Skip)
6. **Dashboard Display**: Shows results with statistics and job cards
7. **Assisted Apply**: User manually submits applications via job portal links

### Matching Logic

- **Apply (≥60% match)**: Strong match, recommended to apply
- **Review (40-59% match)**: Decent match, user should review carefully
- **Skip (<40% match)**: Poor match, not recommended

## File Structure

```
app/
├── lib/
│   ├── adzuna.ts           # Adzuna API integration
│   └── jobMatcher.ts       # AI-powered job matching logic
├── components/
│   └── JobCard.tsx         # Job listing card component
└── routes/
    └── job-applier.tsx     # Main dashboard route

types/
└── index.d.ts              # TypeScript type definitions
```

## API Reference

### Adzuna API Functions

#### `searchJobs(country, params)`
Search for jobs using Adzuna API.

**Parameters:**
- `country` (string): Country code (e.g., 'us', 'uk')
- `params` (AdzunaSearchParams):
  - `what`: Job title or keywords
  - `where`: Location
  - `results_per_page`: Number of results (default: 20)
  - `max_days_old`: Filter by posting date

**Returns:** `Promise<JobListing[]>`

### Job Matching Functions

#### `analyzeJobMatch(aiChat, input)`
Analyze a single job against a resume.

**Parameters:**
- `aiChat`: Puter.js AI chat function
- `input`: Object with `resume_text` and `job`

**Returns:** `Promise<JobMatchResult>`

#### `analyzeMultipleJobs(aiChat, resumeText, jobs)`
Analyze multiple jobs and generate dashboard data.

**Parameters:**
- `aiChat`: Puter.js AI chat function
- `resumeText`: Extracted resume text
- `jobs`: Array of job listings

**Returns:** `Promise<JobApplierDashboard>`

## Configuration Options

### Search Parameters

```typescript
interface AdzunaSearchParams {
    what?: string;              // Job title/keywords
    where?: string;             // Location
    results_per_page?: number;  // 10-50 (default: 20)
    max_days_old?: number;      // Filter by age (default: 7)
    salary_min?: number;        // Minimum salary
    contract_type?: string;     // full_time, part_time, contract
}
```

## Customization

### Adjusting Match Thresholds

Edit `app/lib/jobMatcher.ts`:

```typescript
// Change decision thresholds
- "apply" if match score >= 60%
- "review" if match score is 40-59%
- "skip" if match score < 40%
```

### Changing AI Model

Edit `app/lib/jobMatcher.ts`:

```typescript
const response = await aiChat(
    messages,
    { 
        model: "claude-3-7-sonnet", // Change model here
        temperature: 0.3            // Adjust creativity
    }
);
```

### Customizing UI

- Edit `app/components/JobCard.tsx` for job card styling
- Edit `app/routes/job-applier.tsx` for dashboard layout
- Modify colors in Tailwind classes

## Limitations & Best Practices

### API Limits

- **Adzuna Free Tier**: 5,000 requests/month
- **Puter.js AI**: Usage-based limits

### Best Practices

1. **Resume Quality**: Ensure resume is clear and well-formatted
2. **Search Terms**: Use specific job titles for better results
3. **Batch Size**: Limit to 20-30 jobs per search to avoid long AI processing times
4. **Manual Review**: Always review AI recommendations before applying
5. **Data Storage**: Search results are saved to KV Store for history

### Privacy & Security

- ✅ All data stored in user's Puter.js cloud storage
- ✅ No third-party tracking
- ✅ API credentials never exposed to client
- ✅ Assisted apply only (no auto-submission)

## Troubleshooting

### "No resume found" Error
- Upload a resume via the Upload page first
- Check that resume is saved in Puter.js KV Store

### "Failed to extract text from resume" Error
- Ensure resume is a valid PDF format
- Try re-uploading the resume
- Check file size (< 10MB recommended)

### "No jobs found" Error
- Try broader search terms
- Check location spelling
- Remove filters to expand search

### Adzuna API Errors
- Verify API credentials in `.env` file
- Check API rate limits
- Ensure internet connection is stable

## Future Enhancements

Potential features to add:

- [ ] Cover letter generation for each job
- [ ] Application tracking and history
- [ ] Email notifications for new matches
- [ ] Multi-resume support
- [ ] Salary insights and comparison
- [ ] Company research integration
- [ ] Interview preparation tips
- [ ] Application status updates

## Support

For issues or questions:
1. Check the documentation above
2. Review Adzuna API docs: https://developer.adzuna.com/docs
3. Review Puter.js docs: https://docs.puter.com/

## License

This feature is part of the Resumind application. Check the main project LICENSE file.

