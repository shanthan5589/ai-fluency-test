# AI Fluency Test

An AI-powered assessment that measures how well you use AI tools — not whether you have access to them.

---

## Full Architecture

```
════════════════════════════════════════════════════════════════════════════════
  USER'S BROWSER
════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  PAGES (URL Routes)                                                     │
  │                                                                         │
  │  PUBLIC (no login needed)          PROTECTED (login required)           │
  │  ─────────────────────────         ──────────────────────────           │
  │  /                Landing page     /dashboard   Assessment app          │
  │  /login           Sign in                                               │
  │  /signup          Create account                                        │
  │  /forgot-password Request OTP                                           │
  │  /verify-otp      Enter OTP code                                        │
  │  /reset-password  Set new password                                      │
  │  /verify-email    "Check your inbox" page                               │
  │  /auth/callback   Handles email link from Supabase                      │
  └─────────────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════
  AUTH FLOW  (what happens when you create an account or log in)
════════════════════════════════════════════════════════════════════════════════

  SIGNUP
  ──────
  User fills form                     Server (Next.js)              Supabase
  (firstName, lastName,   ──────────► signUp() server action  ───► auth.signUp()
   email, phone,                       passes metadata:               creates user in
   password)                           first_name                     auth.users table
                                       last_name                           │
                                       phone_number                        │ trigger fires
                                                                           ▼
                                                                    handle_new_user()
                                                                    inserts row into
                                                                    profiles table
                                                                    (reads from metadata)
                          ◄──────────  redirect to /verify-email
  User clicks email link
        │
        ▼
  /auth/callback ─────────────────────► exchanges code for session
        │                               sets cookie
        ▼
  /dashboard ✓

  LOGIN
  ─────
  User fills form         ──────────► login() server action    ───► auth.signInWithPassword()
  (email, password)                                                        │
                          ◄──────────  redirect to /dashboard  ◄──────────┘

  PASSWORD RESET
  ──────────────
  /forgot-password ───► requestPasswordReset() ───► auth.signInWithOtp()
                                                     sends 6-digit code to email
  /verify-otp      ───► verifyPasswordResetOtp() ──► auth.verifyOtp()
  /reset-password  ───► updatePassword()         ──► auth.updateUser()
                                                     auth.signOut()
                    ◄─── redirect to /login

  MIDDLEWARE (runs on EVERY request)
  ──────────────────────────────────
  Request arrives
       │
       ▼
  getUser() ──► user exists? ──► YES ──► trying to visit /login or /signup? ──► YES ──► redirect to /dashboard
                    │                                                            NO  ──► allow through
                    ▼
                    NO ──► trying to visit /dashboard? ──► YES ──► redirect to /login
                                                          NO  ──► allow through

════════════════════════════════════════════════════════════════════════════════
  ASSESSMENT FLOW  (what happens on /dashboard)
════════════════════════════════════════════════════════════════════════════════

  STAGE 1 — UPLOAD
  ─────────────────
  User drags/drops                    Server (Next.js)              OpenAI
  resume file         ──────────────► parseAndGenerateQuestions()
  (PDF or DOCX,                            │
   max 5MB)                                ├─ PDF?  → pdf-parse  → extract text
                                           └─ DOCX? → mammoth    → extract text
                                                │
                                                ▼
                                       Send resume text + system prompt
                                       to gpt-4o-mini              ───────────►
                                                                          generates
                                                                          3 scenarios
                                                                   ◄───────────
                                       returns { resumeText, questions[3] }
                       ◄──────────────
  AnalysisStep shows
  loading animation
  while waiting
       │
       ▼
  STAGE 2 — QUIZ (QuizArena)
  ──────────────────────────

  For each of 3 questions:

  ┌─────────────────────────────────────────────────────────────┐
  │  ┌─────────────────────┐    ┌──────────────────────────┐   │
  │  │   SCENARIO PANEL    │    │    YOUR ANSWER PANEL     │   │
  │  │                     │    │                          │   │
  │  │  Role-specific      │    │  Textarea — user can     │   │
  │  │  work scenario      │    │  use any AI tool to      │   │
  │  │  (80-200 words)     │    │  help write answer       │   │
  │  │                     │    │                          │   │
  │  └─────────────────────┘    └──────────────────────────┘   │
  │                                                             │
  │  [Q1] [Q2] [Q3]          Timer: 90s ──► 0s                 │
  │   answered/missed/pending   turns orange at 30s             │
  │                             turns red + pulses at 10s       │
  │                             auto-submits at 0s              │
  └─────────────────────────────────────────────────────────────┘

  State tracked per question:
  answers[0], answers[1], answers[2]   — what user typed
  statuses[0..2]: "pending" | "answered" | "missed"

  STAGE 3 — GRADING
  ──────────────────
  All 3 answers ready ──────────────► gradeAssessment()
                                           │
                                           ▼
                                      Builds message:
                                      resume (1500 chars)
                                      + scenario 1 + criteria + answer 1
                                      + scenario 2 + criteria + answer 2
                                      + scenario 3 + criteria + answer 3
                                           │
                                           ▼
                                      gpt-4o-mini with grading rubric  ──────────►
                                                                              grades
                                                                              AI fluency
                                                                              NOT correctness
                                                                        ◄──────────
                                      returns { score, persona, feedback }
                       ◄──────────────

  STAGE 4 — RESULTS (ResultsScreen)
  ───────────────────────────────────

  ┌────────────────────────────────────────────────┐
  │                                                │
  │     Score: 0–100    (circle, color-coded)      │
  │     Emerald ≥70 · Amber 40–69 · Red <40        │
  │                                                │
  │     Persona badge                              │
  │     ─────────────                              │
  │     80–100  Critical Operator                  │
  │     60–79   AI-Augmented Professional          │
  │     35–59   Capable Paster                     │
  │     0–34    Passive Consumer                   │
  │                                                │
  │     Feedback (4–5 sentences, blunt)            │
  │                                                │
  │     [ Restart Assessment ]                     │
  │                                                │
  └────────────────────────────────────────────────┘

  NOTE: Answers, questions, and scores are NEVER saved to the database.
        Everything lives in React component state only.
        Refreshing the page resets the assessment.

════════════════════════════════════════════════════════════════════════════════
  COMPONENT TREE  (/dashboard)
════════════════════════════════════════════════════════════════════════════════

  DashboardPage (server component)
  │  reads: supabase → profiles → first_name
  │
  └── AssessmentFlow (client component — owns all state)
        │  state: stage, resumeText, questions[], answers[], statuses[], gradingResult
        │
        ├── Header
        │     brand logo · "Hi {firstName}" · Logout button
        │
        ├── UploadStep          stage = "upload"
        │     drag & drop zone
        │     file type + size validation
        │     calls: handleFileUpload(file)
        │
        ├── AnalysisStep        stage = "analyzing"
        │     animated tickers:
        │       "Reading your document..."     ✓
        │       "Extracting key information..." ✓
        │       "Generating your scenarios..."  ⟳  (spins until API returns)
        │
        ├── QuizArena           stage = "quiz"
        │     props: questions, currentQuestion, statuses
        │     callbacks: onSubmit(answer), onTimeUp(answer)
        │     owns: 90s countdown timer, answer textarea
        │
        └── ResultsScreen       stage = "results"
              props: gradingResult (score, persona, feedback)
              callback: onRestart()

════════════════════════════════════════════════════════════════════════════════
  DATABASE  (Supabase PostgreSQL)
════════════════════════════════════════════════════════════════════════════════

  auth.users  (managed by Supabase — not directly accessible)
  ┌──────────────────────────────────────────────────┐
  │  id              UUID  primary key               │
  │  email           TEXT                            │
  │  raw_user_meta_data  JSONB  ◄── first_name,      │
  │  created_at      TIMESTAMPTZ    last_name,        │
  │  ...                            phone_number      │
  └────────────────────┬─────────────────────────────┘
                       │  AFTER INSERT trigger
                       │  handle_new_user()
                       │  SECURITY DEFINER
                       ▼
  public.profiles  (your table)
  ┌──────────────────────────────────────────────────┐
  │  id              UUID  PK  →  auth.users.id      │
  │  first_name      TEXT                            │
  │  last_name       TEXT                            │
  │  phone_number    TEXT                            │
  │  created_at      TIMESTAMPTZ  default NOW()      │
  └──────────────────────────────────────────────────┘

  RLS POLICIES on profiles:
  SELECT  →  auth.uid() = id   (users read own row only)
  UPDATE  →  auth.uid() = id   (users update own row only)
  INSERT  →  auth.uid() = id   (fallback; trigger handles it normally)

════════════════════════════════════════════════════════════════════════════════
  SERVER / CLIENT BOUNDARY
════════════════════════════════════════════════════════════════════════════════

  RUNS ON SERVER                        RUNS IN BROWSER
  ──────────────────────────────────    ──────────────────────────────────
  middleware.ts                         AssessmentFlow component
  actions/auth.ts                       QuizArena component (timer)
  actions/assessment.ts                 UploadStep component
  app/(protected)/dashboard/page.tsx    ResultsScreen component
  app/auth/callback/route.ts            LandingPage component
                                        All auth forms
  Keys exposed to server only:
  SUPABASE_SERVICE_ROLE_KEY             Keys exposed to browser (safe):
  OPENAI_API_KEY                        NEXT_PUBLIC_SUPABASE_URL
                                        NEXT_PUBLIC_SUPABASE_ANON_KEY
                                        NEXT_PUBLIC_SITE_URL

════════════════════════════════════════════════════════════════════════════════
  EXTERNAL SERVICES
════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
  │  SUPABASE                       │   │  OPENAI                         │
  │                                 │   │                                 │
  │  Auth                           │   │  Model: gpt-4o-mini             │
  │  ├─ email/password login        │   │                                 │
  │  ├─ email OTP (password reset)  │   │  Call 1 — Question Generation   │
  │  ├─ email verification          │   │  Input:  resume text            │
  │  └─ session cookies             │   │  Output: 3 scenarios (JSON)     │
  │                                 │   │  Tokens: max 1200               │
  │  Database (PostgreSQL)          │   │                                 │
  │  └─ profiles table              │   │  Call 2 — Grading               │
  │                                 │   │  Input:  scenarios + answers    │
  │  Free tier limits:              │   │  Output: score, persona,        │
  │  ├─ 512MB RAM (currently        │   │          feedback (JSON)        │
  │  │  ~227MB process + 181MB      │   │  Tokens: max 500                │
  │  │  PostgreSQL cache — healthy) │   │                                 │
  │  └─ 60 direct DB connections    │   │  2 API calls per assessment     │
  └─────────────────────────────────┘   └─────────────────────────────────┘
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, Framer Motion |
| Backend | Next.js Server Actions (Vercel serverless) |
| Auth & DB | Supabase (Auth + PostgreSQL) |
| AI | OpenAI gpt-4o-mini |
| File parsing | pdf-parse (PDF), mammoth (DOCX) |

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase publishable key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase secret key (server only)
NEXT_PUBLIC_SITE_URL=            # Your deployed URL (for email callbacks)
OPENAI_API_KEY=                  # OpenAI secret key (server only)
```
