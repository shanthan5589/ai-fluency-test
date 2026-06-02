## Repository Overview

**ai-survival-index** is a new, empty repository.

# Details of this Project

- Core Concept:
    A webapp that parses a user's resume, uses an LLM to generate highly personalised, situational questions, and tests the user's ability to co-work with AI tools in real-time under a strict clock.

## Key requirements to incorporate:

- Tech stack: 
    - Frontend: Next.js (React) styled with Tailwind CSS and Shadcn/ui components.
    - Backend: Next.js Server Actions or a lightweight Python FastAPI backend.
    - Resume Parser: pdf-parse (Node.js) or PyPDF2 (Python) to extract raw text cheaply without expensive third-party resume parsing APIs.
    - LLM API: OpenAI API, any fast/cheap model for high-quality question generation and grading.
    - Database: Supabase to save user scores and generated resumes for future lead-generation monetization.

- Functional Specs:

    - Screen 1: The Landing & Upload Page:
        - UI Elements: Clean, high-stress minimalist interface. Big bold header: "Will your job survive the AI wave? Upload your resume to find out.
        - Actions: File drop zone accepting .pdf and .docx (Max 5MB).
        - Once uploaded, extract the text immediately on the server-side. Do not store the file to save disk space; just pass the string to the LLM agent.

    -  Screen 2: Loading / Analysis Screen:
        - UI Elements: A dynamic, premium skeleton loader showing step-by-step progress tickers
            - "Reading resume profile..."
            - "Identifying automation vulnerabilities in [Extracted Job Title]..."
            - "Generating unique adversarial AI traps..."
    
    - Screen 3: The 3-Question Assessment Arena:
        - UI Elements:
            - A prominent 90-second countdown timer per question.
            - A split-screen view: Left side displays the scenario/puzzle; Right side provides a large text area for the user's response.
            - An explicit instruction header: "Open ChatGPT, Claude, or Gemini in another window. Use them to solve this. Do not try to   copy the question—it won't work."
        - Actions: 
            - When the timer hits 0 or the user clicks "Submit", instantly transition to the next question.

    - Screen 4: Results & Viral Share Dashboard:
        - UI Elements:
            - The AI Survival Score: A big circular gauge displaying a score out of 100.
            - The Persona Title: e.g., "The AI-Immune Strategist" (Top 5%) or "At Risk of Automation" (Bottom 40%).
            - Breakdown Matrix: 3 metrics graded by the LLM: Prompt Efficiency, Verification Speed, Critical Skepticism.
            - "Share on LinkedIn" Button: Generates an open-graph image dynamic badge or pre-written text: "I just took the AI Survival Test. My resume was audited against automation and I scored 88% as an AI-Immune Marketer. Test your resume here: [Link]"

- LLM Prompt Engineering Specs: The developer must set up two backend LLM calls. The system prompts must look exactly like this:

    - API Call 1:

        - Question Generation Prompt:
            - You are an elite corporate auditor testing if a candidate knows how to use AI efficiently at work or if they blindly trust it. 
            - Read the following extracted resume text. Identify their main profession and industry. Generate exactly 3 situational, adversarial trap questions tailored to their job.

        - Constraints for the Question:
            - Return the output strictly as a JSON array of objects containing: {"question_id": int, "scenario": string, "evaluation_criteria": string}

    - API Call 2:

        - Evaluation & Grading Prompt:

            - Context:
                - You are grading a user's capability to work with AI.
            - Task:
                - Compare the User's Answer against the Scenario and the Evaluation Criteria provided.

            - Determine if the user successfully provided an expert engineering prompt that solves the nuance. 

            - Return a JSON response containing:
                - "overall_score": Integer from 0 to 100.
                - "persona": Short catchy title (e.g., "AI-Replaceable", "AI-Augmented Professional", "AI-Immune Visionary").
                - "feedback": A brutal, direct 2-sentence breakdown of what they missed and how they can improve.

- Core Architecture & Workflow
    - Resume Upload
    - Text Extraction
    - LLM Profile Analysis
    - Dynamic Question Generation
    - Interactive Timed Quiz
    - Scoring & Report

- Strict rules: 
    - 90-second are allotted per question.
    - Copy-pasting is allowed

- Performance:
    - Total processing time from a user dropping a resume to Question 1 appearing must be under 6 seconds.
    - No Cost Overruns: Keep LLM tokens minimal. Maximize efficiency by setting strict max_tokens on responses.
    - Application should be made to be optimized to run seamlessly on Mobile browsers like Chrome, Safari. 

- Output Style:
    - Clean, minimalist, high-stress professional UI. LinkedIn-shareable results with dynamic badge.

- Development Principles:
    - Always follow the PRD specifications exactly. Prioritize speed, and verification at every step. 
    - Always use Plan Mode before implementing complex features.
    - Provide verification steps (build, tests, or manual checks) in every task.
    - Follow the Software Development Principles strictly. 