# AI Fluency Test

An AI-powered assessment that measures how well you use AI tools — not whether you have access to them.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  / (Landing)  →  /signup  →  /verify-email                     │
│                  /login                                         │
│                  /forgot-password → /verify-otp → /reset-pass  │
│                                                                 │
│  /dashboard ──→  AssessmentFlow (React state, never persisted) │
│                  │                                              │
│                  ├─ UploadStep      (drag & drop resume)        │
│                  ├─ AnalysisStep    (loading animation)         │
│                  ├─ QuizArena       (3 questions, 90s timer)    │
│                  └─ ResultsScreen   (score, persona, feedback)  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  Next.js Server Actions
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Vercel)                      │
│                                                                 │
│  Middleware ── checks auth on every request                     │
│               ├─ /dashboard → redirect to /login if no user    │
│               └─ /login,/signup → redirect to /dashboard       │
│                                                                 │
│  actions/auth.ts                                                │
│    signUp()               → supabase.auth.signUp() + metadata  │
│    login()                → supabase.auth.signInWithPassword()  │
│    logout()               → supabase.auth.signOut()             │
│    requestPasswordReset() → supabase.auth.signInWithOtp()       │
│    verifyPasswordResetOtp()→ supabase.auth.verifyOtp()          │
│    updatePassword()       → supabase.auth.updateUser()          │
│                                                                 │
│  actions/assessment.ts                                          │
│    parseAndGenerateQuestions()                                  │
│      ├─ pdf-parse (PDF) / mammoth (DOCX) → extract text        │
│      └─ OpenAI gpt-4o-mini → returns 3 scenarios               │
│    gradeAssessment()                                            │
│      └─ OpenAI gpt-4o-mini → returns score + persona + feedback│
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌───────────────────────────────────┐
│   SUPABASE           │      │   OPENAI API                      │
│                      │      │                                   │
│  Auth                │      │  gpt-4o-mini                      │
│  ├─ users table      │      │  ├─ Question generation           │
│  ├─ sessions/tokens  │      │  │   (resume → 3 scenarios)       │
│  └─ email OTP/verify │      │  └─ Grading                       │
│                      │      │      (answers → score 0-100)      │
│  Database            │      └───────────────────────────────────┘
│  └─ profiles table   │
│     ├─ id (FK auth)  │
│     ├─ first_name    │
│     ├─ last_name     │
│     └─ phone_number  │
│                      │
│  Trigger             │
│  └─ on user created  │
│     → insert profile │
│       from metadata  │
└──────────────────────┘
```

---

## How It Works

1. **Sign up / Log in** — Supabase handles auth. A database trigger auto-creates a profile row on signup.
2. **Upload resume** — PDF or DOCX (max 5MB). Text is extracted server-side using `pdf-parse` or `mammoth`.
3. **Generate questions** — Resume text is sent to OpenAI. Returns 3 role-specific scenarios designed to be "paste-resistant" — lazy copy-paste produces mediocre output.
4. **Take the quiz** — 90 seconds per question. AI use is allowed and encouraged.
5. **Get graded** — All 3 answers sent to OpenAI with a rubric. Returns a score (0–100), a persona, and blunt feedback.

Assessment data (answers, questions, scores) is **never stored** — it lives in React state only.

---

## Personas

| Score | Persona |
|-------|---------|
| 80–100 | Critical Operator |
| 60–79 | AI-Augmented Professional |
| 35–59 | Capable Paster |
| 0–34 | Passive Consumer |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, Framer Motion |
| Backend | Next.js Server Actions (Vercel) |
| Auth & DB | Supabase (Auth + PostgreSQL) |
| AI | OpenAI gpt-4o-mini |
| File parsing | pdf-parse, mammoth |

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
OPENAI_API_KEY=
```

---

## Database

### `public.profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key, references `auth.users` |
| `first_name` | TEXT | |
| `last_name` | TEXT | |
| `phone_number` | TEXT | |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

RLS enabled. Users can only read and update their own row. A `SECURITY DEFINER` trigger auto-inserts the profile row from signup metadata when a new auth user is created.
