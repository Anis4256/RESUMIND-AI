# Quick Start - Auto Job Applier

## 🚀 Get Started in 5 Minutes

### Step 1: Get API Credentials (2 minutes)

1. Visit [https://developer.adzuna.com/](https://developer.adzuna.com/)
2. Sign up (free account)
3. Create app → Copy `App ID` and `API Key`

### Step 2: Configure (1 minute)

Create `.env` file in project root:

```env
VITE_ADZUNA_APP_ID=your_app_id_here
VITE_ADZUNA_API_KEY=your_api_key_here
```

### Step 3: Run (1 minute)

```bash
npm install
npm run dev
```

### Step 4: Use (1 minute)

1. Sign in
2. Upload resume
3. Click "🤖 Auto Job Applier"
4. Search jobs → Get AI matches!

## 🎯 Usage Tips

**Best Results:**
- Use specific job titles ("Senior React Developer" vs "Developer")
- Include city names ("San Francisco" vs "Bay Area")
- Start with 20 results per search

**Match Scores:**
- 🟢 60-100: **Apply** - Strong match!
- 🟡 40-59: **Review** - Decent match, check carefully
- 🔴 0-39: **Skip** - Not recommended

**Remember:** This is **Assisted Apply** - you always manually submit applications!

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "No resume found" | Upload a resume first |
| "No jobs found" | Try broader search terms |
| API error | Check `.env` credentials |
| Slow loading | Reduce results per page |

## 📚 Full Documentation

See `AUTO_JOB_APPLIER_SETUP.md` for complete documentation.

---

**Need help?** Check the Adzuna API docs: https://developer.adzuna.com/docs

