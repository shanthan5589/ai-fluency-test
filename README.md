# AI Fluency Test

AI Fluency Test is a role-specific assessment that evaluates how effectively a person uses judgment, critical thinking, and structured reasoning while working with AI tools.

Instead of testing theoretical AI knowledge, it presents realistic workplace scenarios based on the candidate’s resume.

## What It Does

1. The candidate uploads a PDF or DOCX resume.
2. AI analyzes the candidate’s role, experience, and domain.
3. Three personalized workplace scenarios are generated.
4. The candidate completes each scenario within a time limit.
5. AI evaluates the responses and provides:
   - An overall score
   - An AI-fluency persona
   - Personalized feedback

Candidates may use tools such as ChatGPT, Claude, or Gemini during the assessment.

## Assessment Approach

The assessment uses three types of scenarios:

- **Flawed premise:** Tests whether the candidate notices and challenges an incorrect assumption.
- **Judgment gap:** Tests decision-making where there is no single perfect answer.
- **Forced decomposition:** Tests whether a complex task is broken into clear, manageable parts.

The grading process prioritizes critical thinking and domain judgment over polished AI-generated writing.

## Key Features

- resume-based question generation
- Role-specific workplace scenarios
- PDF and DOCX support
- Timed assessment questions
- AI-assisted grading
- Personalized feedback and personas
- Email/password and Google authentication
- Responsive desktop and mobile interface

## Technology Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **UI:** React and Tailwind CSS
- **Authentication:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **AI:** OpenAI API
- **Document parsing:** `pdf-parse` and `mammoth`
- **Form validation:** React Hook Form and Zod
- **Animations:** Framer Motion

## Getting Started

### Prerequisites

- Node.js 20 or later
- A Supabase project
- An OpenAI API key

### Installation

```bash
git clone https://github.com/shanthan5589/ai-fluency-test.git
cd ai-fluency-test
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=
```

Apply the SQL migrations located in:

```text
supabase/migrations/
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Commands

Start the development server:

```bash
npm run dev
```

Create and validate a production build:

```bash
npm run build
```

Run the production build:

```bash
npm run start
```

Check the project for linting problems:

```bash
npm run lint
```

## Data and Privacy

Assessment questions, answers, and scores are not currently written to the application database. They remain in temporary application state during the assessment.

Resume text and assessment responses are sent to the OpenAI API for processing. User account and profile information is managed through Supabase.

## Current Limitations

This project is currently an MVP.

- Assessment results are not saved between sessions.
- Refreshing the page resets an active assessment.
- Timing is managed in the browser.
- AI-generated questions and scores may vary between attempts.
- The assessment should not be used as the sole basis for employment decisions.

## Future Improvements

- Save assessment history
- Provide detailed question-by-question reports
- Add an integrated AI workspace
- Record AI interaction and iteration history
- Add organization and recruiter dashboards
- Export or share assessment reports
- Improve scoring consistency using benchmark datasets

## Project Structure

```text
src/
├── actions/            # Authentication and assessment server actions
├── app/                # Next.js routes and layouts
├── components/
│   ├── assessment/     # Assessment flow and results
│   ├── auth/           # Authentication forms
│   ├── landing/        # Landing page
│   └── ui/             # Reusable UI components
└── lib/
    └── supabase/       # Supabase clients and middleware

supabase/
└── migrations/         # Database schema and profile trigger
```

## Disclaimer

AI-generated scoring is intended to provide directional feedback. It should be reviewed alongside other evaluation methods when used in recruitment, education, or professional development.

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
        questionGen["Question Generation\nInput: resume text\nOutput: 3 role-specific scenarios\nmax 2500 tokens - JSON mode"]
        gradingModel["Grading\nInput: 3 scenarios and answers\nOutput: score 0-100 - persona - feedback\nmax 600 tokens - JSON mode"]
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

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.