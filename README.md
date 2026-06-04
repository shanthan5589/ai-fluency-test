# AI Fluency Test

An AI-powered assessment that measures how well you use AI tools — not whether you have access to them.

---

## System Overview

```mermaid
flowchart TD
    Browser["Browser (React)"]
    Next["Next.js Server (Vercel)"]
    Supabase["Supabase (Auth + PostgreSQL)"]
    OpenAI["OpenAI gpt-4o-mini"]

    Browser -->|"Server Actions"| Next
    Next -->|"auth and profiles"| Supabase
    Next -->|"generate questions and grade answers"| OpenAI
    Supabase -->|"session cookie"| Browser
```

---

## Pages and Routing

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Sign in |
| `/signup` | Public | Create account |
| `/forgot-password` | Public | Request OTP |
| `/verify-otp` | Public | Enter OTP code |
| `/reset-password` | Public | Set new password |
| `/verify-email` | Public | Check your inbox (static) |
| `/auth/callback` | Public | Handles Supabase email redirect |
| `/dashboard` | **Protected** | Assessment app |

**Middleware logic — runs on every request:**

```mermaid
flowchart TD
    req["Incoming Request"]
    check{"User logged in?"}
    authonly{"Visiting a public-auth-only path?\nlogin, signup, forgot-password,\nverify-otp, reset-password, verify-email"}
    dashcheck{"Visiting /dashboard?"}
    allow["Allow through"]

    req --> check
    check -->|"Yes"| authonly
    check -->|"No"| dashcheck
    authonly -->|"Yes"| redir1["Redirect to /dashboard"]
    authonly -->|"No"| allow
    dashcheck -->|"Yes"| redir2["Redirect to /login"]
    dashcheck -->|"No"| allow
```

---

## Auth Flow

### Signup

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Next as Next.js Server
    participant Supabase

    User->>Browser: fill form (name, email, phone, password)
    Browser->>Next: signUp() server action
    Next->>Supabase: auth.signUp() with metadata first_name, last_name, phone_number
    Note over Supabase: DB trigger fires automatically
    Supabase->>Supabase: handle_new_user() inserts row into profiles
    Supabase-->>Next: user created
    Next-->>Browser: redirect to /verify-email
    User->>Browser: clicks verification link in email
    Browser->>Next: GET /auth/callback with code param
    Next->>Supabase: exchangeCodeForSession(code)
    Next-->>Browser: redirect to /dashboard
```

### Login

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Next as Next.js Server
    participant Supabase

    User->>Browser: fill form (email, password)
    Browser->>Next: login() server action
    Next->>Supabase: auth.signInWithPassword()
    Supabase-->>Next: session
    Next-->>Browser: redirect to /dashboard
```

### Password Reset

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Next as Next.js Server
    participant Supabase

    User->>Browser: enter email on /forgot-password
    Browser->>Next: requestPasswordReset()
    Next->>Supabase: auth.signInWithOtp() shouldCreateUser false
    Supabase-->>User: sends 6-digit OTP by email
    User->>Browser: enter OTP on /verify-otp
    Browser->>Next: verifyPasswordResetOtp()
    Next->>Supabase: auth.verifyOtp() email token type email
    Next-->>Browser: redirect to /reset-password
    User->>Browser: enter new password
    Browser->>Next: updatePassword()
    Next->>Supabase: auth.updateUser() then auth.signOut()
    Next-->>Browser: redirect to /login
```

---

## Assessment Flow

```mermaid
flowchart TD
    Upload["Stage 1 - Upload\nUser drops PDF or DOCX resume (max 5MB)"]
    Analyze["Stage 2 - Analyzing\nLoading animation while server processes\n1. Extract text via pdf-parse or mammoth\n2. Send resume to OpenAI gpt-4o-mini\n3. Receive 3 role-specific scenarios"]
    Quiz["Stage 3 - Quiz\n3 questions - 90 seconds each\nAI use allowed and encouraged"]
    Grading["Grading runs within quiz stage\nAfter last answer gradeAssessment is called\nButton shows Grading while waiting"]
    Results["Stage 4 - Results\nScore 0 to 100 - Persona - Feedback"]

    Upload -->|"file submitted"| Analyze
    Analyze -->|"questions ready"| Quiz
    Quiz -->|"all 3 answers submitted"| Grading
    Grading -->|"grade received"| Results
    Results -->|"Restart"| Upload
```

### Grading Rubric

```mermaid
pie
    title Score Weights
    "Trap and premise handling" : 40
    "Domain judgment" : 25
    "Verification and skepticism" : 20
    "Decomposition and iteration" : 10
    "Output quality" : 5
```

### Score Bands

| Score | Badge | Persona from OpenAI |
|-------|-------|----------------------|
| 70 – 100 | Strong Result (emerald) | Critical Operator |
| 40 – 69 | Room to Grow (amber) | AI-Augmented Professional |
| 0 – 39 | Needs Work (red) | Capable Paster or Passive Consumer |

> Assessment data (answers, questions, scores) is **never saved to the database**. Everything lives in React component state — refreshing the page resets the assessment.

---

## Component Tree

```mermaid
flowchart TD
    Dashboard["DashboardPage\nServer component\nFetches first_name from profiles table"]
    Flow["AssessmentFlow\nClient component\nOwns all state: stage, resumeText,\nquestions, answers, statuses,\ncurrentQuestion, gradingResult"]
    Header["Header\nBrand logo - username - Logout button"]
    UploadStep["UploadStep\nDrag and drop zone\nValidates file type PDF or DOCX and size max 5MB\nCalls handleFileUpload on valid file"]
    AnalysisStep["AnalysisStep\nAnimated loading tickers while API runs"]
    QuizArena["QuizArena\n90s countdown timer - Scenario panel\nAnswer textarea - Status boxes\nNext and Complete Assessment buttons"]
    ResultsScreen["ResultsScreen\nScore circle - Badge label\nPersona heading - Feedback block\nRestart Assessment button"]

    Dashboard --> Flow
    Flow --> Header
    Flow --> UploadStep
    Flow --> AnalysisStep
    Flow --> QuizArena
    Flow --> ResultsScreen
```

---

## Database

```mermaid
erDiagram
    auth_users {
        uuid id PK
        text email
        jsonb raw_user_meta_data
        timestamptz created_at
    }
    profiles {
        uuid id PK
        text first_name
        text last_name
        text phone_number
        timestamptz created_at
    }
    auth_users ||--|| profiles : "trigger inserts on signup"
```

**RLS Policies on `profiles`:**
- `SELECT` — users can only read their own row
- `UPDATE` — users can only update their own row
- `INSERT` — users can only insert their own row (trigger handles this automatically)

---

## Server and Client Boundary

```mermaid
flowchart LR
    subgraph Server [Server - Vercel]
        MW["middleware.ts"]
        AuthA["actions/auth.ts"]
        AssA["actions/assessment.ts"]
        Page["dashboard/page.tsx"]
        CB["auth/callback/route.ts"]
        SK["Secret keys\nSUPABASE_SERVICE_ROLE_KEY\nOPENAI_API_KEY"]
    end

    subgraph Client [Browser]
        AF["AssessmentFlow"]
        Forms["Auth Forms"]
        Land["LandingPage"]
        PK["Public keys\nNEXT_PUBLIC_SUPABASE_URL\nNEXT_PUBLIC_SUPABASE_ANON_KEY"]
    end

    Forms -->|"calls signUp, login, logout etc"| AuthA
    AF -->|"calls parseAndGenerate, grade"| AssA
    Page -->|"renders"| AF
```
