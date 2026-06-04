# AI Fluency Test

An AI-powered assessment that measures how well you use AI tools — not whether you have access to them.

---

## Architecture

```mermaid
flowchart TD
    subgraph browserLayer [Browser]
        landingPage["/ Landing Page"]
        authPages["Auth Pages\n/login - /signup - /forgot-password\n/verify-otp - /reset-password - /verify-email"]
        uploadStep["UploadStep\nDrop PDF or DOCX - max 5MB"]
        analysisStep["AnalysisStep\nLoading screen while server processes"]
        quizArena["QuizArena\n3 scenarios - 90s timer each - AI tools allowed"]
        resultsScreen["ResultsScreen\nScore 0 to 100 - Persona - Feedback"]
    end

    subgraph serverLayer [Next.js Server - Vercel]
        middleware["Middleware\nRuns on every request\nNo session on /dashboard redirects to /login\nHas session on auth pages redirects to /dashboard"]
        authActions["Auth Server Actions\nsignUp - login - logout\nrequestPasswordReset - verifyOtp - updatePassword"]
        parseAction["parseAndGenerateQuestions\nExtracts text with pdf-parse or mammoth\nSends resume text to OpenAI"]
        gradeAction["gradeAssessment\nSends 3 answers and scoring rubric to OpenAI"]
        callbackRoute["/auth/callback\nexchangeCodeForSession"]
    end

    subgraph supabaseLayer [Supabase]
        supaAuth["Auth Service\nemail and password auth\nOTP for password reset\nEmail verification - Session via cookies"]
        authUsers["auth.users\nid - email - raw_user_meta_data"]
        dbTrigger["Trigger handle_new_user\nSECURITY DEFINER\nFires AFTER INSERT on auth.users\nReads metadata - inserts into profiles"]
        profilesTable["profiles table\nid - first_name - last_name\nphone_number - created_at\nRLS: users read and update own row only"]
    end

    subgraph openaiLayer [OpenAI gpt-4o-mini]
        questionGen["Question Generation\nInput: resume text\nOutput: 3 role-specific scenarios\nmax 1200 tokens - JSON mode"]
        gradingModel["Grading\nInput: 3 scenarios and answers\nOutput: score 0-100 - persona - feedback\nmax 500 tokens - JSON mode"]
    end

    middleware -->|"no session on /dashboard"| authPages
    middleware -->|"has session on auth pages"| uploadStep

    landingPage --> authPages

    authPages -->|"signUp form submit"| authActions
    authActions -->|"auth.signUp with first_name last_name phone_number"| supaAuth
    supaAuth -->|"creates record"| authUsers
    authUsers -->|"AFTER INSERT"| dbTrigger
    dbTrigger -->|"inserts profile row from metadata"| profilesTable
    authActions -->|"redirect to /verify-email"| authPages
    supaAuth -->|"sends verification email - user clicks link"| callbackRoute
    callbackRoute -->|"session set - redirect to /dashboard"| uploadStep

    authPages -->|"login form submit"| authActions
    authActions -->|"signInWithPassword - session set"| uploadStep

    authPages -->|"forgot password - OTP flow"| authActions
    authActions -->|"signInWithOtp - verifyOtp - updatePassword"| supaAuth

    uploadStep -->|"file submitted"| parseAction
    parseAction -->|"shows while processing"| analysisStep
    parseAction -->|"resume text"| questionGen
    questionGen -->|"3 scenarios ready"| analysisStep
    analysisStep -->|"stage changes to quiz"| quizArena
    quizArena -->|"all 3 answers submitted"| gradeAction
    gradeAction -->|"answers and rubric"| gradingModel
    gradingModel -->|"score - persona - feedback"| resultsScreen
    resultsScreen -->|"Restart"| uploadStep
```

> Assessment data (answers, questions, scores) is **never saved** to the database. Everything lives in React component state only.
