"use server"

import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface Question {
  question_id: number
  scenario: string
  evaluation_criteria: string
}

export interface GradingResult {
  overall_score: number
  question_scores: number[]
  persona: string
  feedback: string
}

const QUESTION_GENERATION_SYSTEM = `
You are designing an AI-fluency assessment. The candidate may use any LLM (ChatGPT, Claude, Gemini, etc.), open multiple tabs, and copy-paste freely. Your job is to generate 3 scenarios where lazy copy-paste into an LLM produces visibly mediocre output, and scoring well REQUIRES the candidate to use AI skillfully — not just access it.

You will be given the candidate's resume. Read it to understand their role, seniority, and domain. Use that context to make scenarios feel real and role-specific. But the scenarios themselves are TASKS, not technical questions. They simulate actual work situations the candidate would face on the job — writing a difficult email, making a judgment call under pressure, producing a deliverable, handling a stakeholder situation, diagnosing a problem, or making a tradeoff decision.

IMPORTANT: Do NOT make all three scenarios technical. Mix the types:
- At least one scenario must be a communication or stakeholder task (e.g. write a message, draft a response, handle a difficult situation with a person or team)
- At least one must be a judgment/decision task (e.g. choose between options, diagnose what went wrong, recommend a path forward with real tradeoffs)
- At least one may be a technical or domain-specific task IF the candidate's role warrants it

Each scenario MUST be built around exactly one of these "paste-resistant" mechanisms, and each scenario must use a DIFFERENT mechanism:
- Scenario 1 → Buried flawed premise: state something subtly wrong, infeasible, or based on an incorrect assumption in the candidate's domain. A fluent user catches and corrects it; a paster lets the LLM run with it unchallenged.
- Scenario 2 → Judgment gap: the task has no single correct answer and requires domain-specific tradeoffs the LLM will paper over with generic advice unless the candidate steers it with context only they can supply.
- Scenario 3 → Forced decomposition: a task large or multi-part enough that a single naive prompt yields shallow output, rewarding candidates who break it down and iterate.

CRITICAL — answer format constraint: Every scenario must have a response that can be written as plain text in a box. The candidate types their answer — they cannot attach files, build slides, or create anything outside the text box. Valid answer types: write an email, draft a message, give a recommendation with reasoning, explain a decision, summarize a diagnosis, outline a plan in words, write a short document. NEVER ask for: a presentation, a spreadsheet, a diagram, code output as the main deliverable, or anything that requires a non-text format. The forced decomposition scenario should be a WRITTEN task broken into parts (e.g. draft a multi-section memo, write a stakeholder update covering three angles) — not "create a presentation" or "build a report".

Write each scenario as a realistic work situation, 80-200 words. Use first person ("You are...", "Your team...", "You receive an email..."). Do NOT reveal the trap or mechanism to the candidate. Do NOT mention "AI fluency" inside the scenario text. Make the scenario feel urgent and real, not like a test question.

The evaluation_criteria for each scenario is for the GRADER only, never shown to the candidate. It must specify:
1. What the trap/judgment/decomposition is in plain terms
2. What a lazy paste-and-submit answer looks like for THIS specific scenario
3. What a fluent answer looks like for THIS specific scenario
4. The exact thing that separates them

Return ONLY valid JSON, no preamble, no markdown fences:
{
  "questions": [
    { "question_id": 1, "scenario": "...", "evaluation_criteria": "..." },
    { "question_id": 2, "scenario": "...", "evaluation_criteria": "..." },
    { "question_id": 3, "scenario": "...", "evaluation_criteria": "..." }
  ]
}
`.trim()

const GRADING_SYSTEM = `
You are a strict, skeptical grader of an AI-fluency assessment. Your default assumption is that every answer is a lazy single-pass AI paste — the candidate must earn a higher score through visible evidence of critical thinking. Polished prose does NOT indicate skill. A well-written answer that accepted the scenario's premise uncritically is still a lazy paste.

You will receive 3 scenarios with their evaluation_criteria and the candidate's answers. Grade each independently.

HARD CAPS — apply these before any other scoring:
- Candidate accepted the scenario's flawed premise without questioning it → score for that question cannot exceed 38
- Answer is generic boilerplate that a base LLM would produce with zero steering → cannot exceed 42
- Answer is off-topic or shows no understanding of the scenario → cannot exceed 15
- Answer is blank, random characters, gibberish, or clearly not a genuine attempt → score must be 0-3, no higher
- Multiple caps can stack (take the lowest)

SCORING WEIGHTS per question (0-100):
- Trap / premise handling (40%): Did they catch and name the flaw, or accept it silently?
- Domain judgment (25%): Did they inject specific non-generic reasoning, or is it advice that applies to any situation?
- Verification and skepticism (20%): Any sign they pushed back on, refined, or checked AI output?
- Decomposition (10%): Did they break the task down, or one-shot it?
- Output quality (5%): Is the final result actually good?

Adjust weights per mechanism:
- "judgment gap" scenario → domain judgment becomes 40%, trap handling becomes 25%
- "forced decomposition" scenario → decomposition becomes 30%, trap handling 25%, judgment 20%

CALIBRATION — this is how scores should distribute across real candidates:
- 0-25: Barely engaged. Wrong premise accepted, output off-target.
- 26-45: The most common range. Clean-looking AI output, no critical engagement, premise accepted silently.
- 46-65: Showed some judgment or caught a minor nuance, but missed the main trap or produced generic reasoning.
- 66-80: Explicitly caught the trap OR showed clear domain-specific steering with evidence of iteration. Genuinely rare.
- 81-100: Exceptional — caught trap, injected domain judgment, showed skepticism toward AI output, strong final result. Very rare.

If you find yourself scoring above 65, double-check: is there EXPLICIT evidence of trap-catching or is the answer just well-written? Well-written ≠ skillful.

feedback: 4-6 sentences total across all 3 questions. Lead with the single most decisive thing — name the exact failure or success (e.g. "You accepted that X was valid, which it isn't — a fluent user would have flagged this because Y"). Then say what a stronger answer would have done. Be blunt and direct. No hedging, no encouragement, no phrases like "overall" or "great effort".

Return ONLY valid JSON, no preamble, no markdown fences:
{ "question_scores": [32, 45, 28], "feedback": "..." }
`.trim()

function buildGradingUserMessage(resumeText: string, questions: Question[], answers: string[]): string {
  const resumeSection = `CANDIDATE RESUME (for context only):\n${resumeText.slice(0, 1500)}\n\n===\n\n`
  const questionSections = questions.map((q, i) => `
SCENARIO ${i + 1}:
${q.scenario}

EVALUATION CRITERIA ${i + 1} (grader only, not shown to candidate):
${q.evaluation_criteria}

CANDIDATE ANSWER ${i + 1}:
${answers[i]?.trim() || "(no answer provided)"}
`).join("\n---\n")
  return resumeSection + questionSections
}

export async function parseAndGenerateQuestions(formData: FormData): Promise<{
  resumeText?: string
  questions?: Question[]
  error?: string
}> {
  const file = formData.get("resume") as File | null

  if (!file) return { error: "No file provided." }
  if (file.size > 5 * 1024 * 1024) return { error: "File exceeds 5 MB limit." }

  const name = file.name.toLowerCase()
  const isPdf = name.endsWith(".pdf")
  const isDocx = name.endsWith(".docx")

  if (!isPdf && !isDocx) return { error: "Only .pdf and .docx files are accepted." }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  let resumeText = ""

  try {
    if (isPdf) {
      const pdfParse = (await import("pdf-parse")).default
      const data = await pdfParse(buffer)
      resumeText = data.text
    } else {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer })
      resumeText = result.value
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to extract text: ${msg}` }
  }

  if (!resumeText.trim()) return { error: "Could not read any text from the file." }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: QUESTION_GENERATION_SYSTEM },
        { role: "user", content: `CANDIDATE RESUME:\n${resumeText}` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
    })

    const raw = completion.choices[0].message.content ?? "{}"
    const parsed = JSON.parse(raw)
    const questions: Question[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.questions)
        ? parsed.questions
        : []

    if (questions.length === 0) return { error: "The AI did not return valid questions. Check the prompt." }

    return { resumeText, questions }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `OpenAI error: ${msg}` }
  }
}

function derivePersona(score: number): string {
  if (score >= 66) return "Critical Operator"
  if (score >= 46) return "AI-Augmented Professional"
  if (score >= 26) return "Capable Paster"
  return "Passive Consumer"
}

export async function gradeAssessment(
  resumeText: string,
  questions: Question[],
  answers: string[]
): Promise<GradingResult & { error?: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: GRADING_SYSTEM },
        { role: "user", content: buildGradingUserMessage(resumeText, questions, answers) },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    })

    const raw = completion.choices[0].message.content ?? "{}"
    const parsed = JSON.parse(raw) as { question_scores: number[]; feedback: string }

    const rawScores = parsed.question_scores ?? [0, 0, 0]

    // Code-level guard: if an answer is clearly gibberish (under 15 meaningful chars),
    // cap that question's score at 3 regardless of what the model returned.
    const scores = rawScores.map((s: number, i: number) => {
      const wordCount = answers[i]?.trim().split(/\s+/).filter(w => w.length > 1).length ?? 0
      return wordCount < 4 ? Math.min(s, 3) : s
    })

    const overall_score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

    return {
      question_scores: scores,
      overall_score,
      persona: derivePersona(overall_score),
      feedback: parsed.feedback ?? "",
    }
  } catch {
    return {
      question_scores: [0, 0, 0],
      overall_score: 0,
      persona: "Unknown",
      feedback: "Grading failed. Check your OPENAI_API_KEY.",
      error: "Failed to grade assessment.",
    }
  }
}
