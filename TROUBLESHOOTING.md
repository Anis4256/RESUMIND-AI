# Troubleshooting Guide - Auto Job Applier

## Common Errors and Solutions

### 1. "Adzuna API credentials not configured"

**Problem:** The `.env` file is missing or API credentials are not set.

**Solution:**
1. Create a `.env` file in the project root (same folder as `package.json`)
2. Add these lines:
```env
VITE_ADZUNA_APP_ID=your_actual_app_id
VITE_ADZUNA_API_KEY=your_actual_api_key
```
3. Get credentials from: https://developer.adzuna.com/
4. Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

---

### 2. "Invalid Adzuna API credentials"

**Problem:** The API credentials in your `.env` file are incorrect.

**Solution:**
1. Double-check your credentials at https://developer.adzuna.com/
2. Make sure there are NO spaces or quotes around the values
3. Make sure you copied the FULL App ID and API Key
4. Example of correct format:
```env
VITE_ADZUNA_APP_ID=12345678
VITE_ADZUNA_API_KEY=abcdef123456789abcdef123456789ab
```

**Common mistakes:**
- ❌ Extra spaces: `VITE_ADZUNA_APP_ID= 12345678 `
- ❌ Quotes: `VITE_ADZUNA_APP_ID="12345678"`
- ❌ Missing prefix: `ADZUNA_APP_ID=12345678` (needs VITE_ prefix!)

---

### 3. "No resume found"

**Problem:** You haven't uploaded a resume yet.

**Solution:**
1. Go to the home page
2. Click "Upload Resume"
3. Upload your resume PDF
4. Wait for AI analysis to complete
5. Then try the Auto Job Applier feature

---

### 4. "Failed to extract text from resume"

**Problem:** Resume file cannot be read or processed.

**Solution:**
1. Make sure your resume is a valid PDF file
2. File size should be under 10MB
3. Try re-uploading your resume
4. If using a scanned PDF, make sure text is readable

---

### 5. "No jobs found matching your criteria"

**Problem:** Adzuna couldn't find jobs with your search terms.

**Solution:**
- Use broader search terms (e.g., "Developer" instead of "Senior React Developer with 5 years")
- Try different locations or leave location blank
- Check spelling of job title and location
- Try searching for jobs in different cities

**Examples of good searches:**
- ✅ Job Title: "Software Engineer", Location: "San Francisco"
- ✅ Job Title: "Data Analyst", Location: "New York"
- ✅ Job Title: "Marketing", Location: "Remote"

---

### 6. "Adzuna API rate limit exceeded"

**Problem:** You've made too many API requests.

**Solution:**
- Free tier: 5,000 requests per month
- Wait a few minutes before trying again
- If you hit the limit frequently, consider:
  - Reducing results per page
  - Searching less frequently
  - Upgrading to a paid Adzuna plan

---

### 7. Server won't start / Port already in use

**Problem:** Port 5173 is already being used.

**Solution:**
1. Kill any existing dev server (Ctrl+C)
2. Check for other processes:
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```
3. Or change the port in `vite.config.ts`

---

### 8. "Cannot read properties of null (reading 'useEffect')"

**Problem:** React module loading issue or cache problem.

**Solution:**
1. Stop the dev server (Ctrl+C)
2. Clear caches:
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .react-router, build, node_modules/.vite
```
3. Restart: `npm run dev`

---

### 9. Changes not showing up

**Problem:** Browser cache or dev server not updating.

**Solution:**
1. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Restart dev server
4. Check browser console for errors (F12)

---

### 10. TypeScript errors

**Problem:** Type definitions not found.

**Solution:**
1. Make sure all files are saved
2. Run: `npm run typecheck`
3. Restart TypeScript server in VS Code/Cursor:
   - Cmd/Ctrl+Shift+P → "TypeScript: Restart TS Server"

---

## Debugging Steps

### Check if API credentials are loaded:

1. Open browser console (F12)
2. Type: `import.meta.env.VITE_ADZUNA_APP_ID`
3. Should show your App ID (not "YOUR_APP_ID")
4. If undefined, your `.env` file isn't being loaded

### Check API response:

1. Open browser console (F12)
2. Go to Network tab
3. Try searching for jobs
4. Look for request to `api.adzuna.com`
5. Check the response:
   - 200: Success
   - 401: Invalid credentials
   - 404: API endpoint not found
   - 429: Rate limit exceeded

### Check resume is stored:

1. Go to browser console (F12)
2. Try this code:
```javascript
await window.puter.kv.list('resume:*', true)
```
3. Should show your uploaded resume data

---

## Still Having Issues?

### Checklist:
- [ ] `.env` file exists in project root
- [ ] `.env` has VITE_ADZUNA_APP_ID and VITE_ADZUNA_API_KEY
- [ ] Credentials are from https://developer.adzuna.com/
- [ ] No extra spaces or quotes in `.env` file
- [ ] Dev server was restarted after creating/editing `.env`
- [ ] Resume was uploaded successfully
- [ ] Browser console shows no errors
- [ ] Using a modern browser (Chrome, Firefox, Edge, Safari)

### Get Help:
1. Check browser console (F12) for specific error messages
2. Check terminal for server errors
3. Review the full documentation in `AUTO_JOB_APPLIER_SETUP.md`
4. Check Adzuna API status: https://developer.adzuna.com/
5. Verify Puter.js is working: https://docs.puter.com/

---

## Useful Commands

```bash
# Clear all caches and rebuild
Remove-Item -Recurse -Force .react-router, build, node_modules/.vite
npm run dev

# Check for linting errors
npm run typecheck

# View environment variables (Windows PowerShell)
Get-Content .env

# Test if dev server is running
curl http://localhost:5173

# Kill process on port 5173 (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

---

## Example Working Setup

### Folder structure:
```
ai-resume-analyzer/
├── .env                 ← YOUR .env FILE HERE
├── package.json
├── app/
│   ├── routes/
│   │   └── job-applier.tsx
│   └── lib/
│       └── adzuna.ts
└── ...
```

### Example `.env` file:
```env
VITE_ADZUNA_APP_ID=12345678
VITE_ADZUNA_API_KEY=abc123def456ghi789jkl012mno345pq
```

### After setup:
1. Save `.env` file
2. Stop dev server (Ctrl+C)
3. Start dev server: `npm run dev`
4. Open http://localhost:5173
5. Sign in
6. Upload resume
7. Go to Auto Job Applier
8. Search for jobs!

---

**Last Updated:** 2026-01-24

