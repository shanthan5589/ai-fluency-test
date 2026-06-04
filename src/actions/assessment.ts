"use server"

import OpenAI from "openai"

// pdfjs-dist (used by pdf-parse) references DOMMatrix which doesn't exist in Node.js
if (typeof globalThis.DOMMatrix === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).DOMMatrix = class DOMMatrix {}
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface Question {
  question_id: number
  scenario: string
  evaluation_criteria: string
}

export interface GradingResult {
  overall_score: number
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
You are grading a candidate's response to an AI-fluency assessment task. The candidate was allowed to use any LLM and copy-paste freely. You are NOT grading whether the answer is correct in isolation — a polished-looking answer can still be a lazy single paste. You are grading the SKILL OF AI USE evident in the response.

You will receive: the scenario, its evaluation_criteria (which describes the trap, judgment gap, or decomposition and what separates lazy from fluent answers), and the candidate's submitted answer.

Score 0-100 using these weights strictly:
- Trap / premise handling (40%): Did they catch the flawed assumption, or did they accept and build on it?
- Domain judgment (25%): Did they inject specific, non-generic reasoning, or is it boilerplate the LLM would produce unprompted?
- Verification and skepticism (20%): Signs they checked, refined, or pushed back on the AI's output rather than trusting it blindly.
- Decomposition and iteration (10%): Evidence the problem was broken down rather than one-shotted.
- Output quality (5%): Is the final result genuinely good for the stated task?

If the scenario's mechanism is "judgment gap" (no single correct answer), shift weight: judgment becomes 40%, trap handling becomes 25%.
If the scenario's mechanism is "forced decomposition", shift weight: decomposition becomes 30%, trap handling becomes 25%, judgment becomes 20%.

Penalize heavily:
- Accepting the scenario's wrong premise without questioning it
- Generic filler a base LLM would produce with no steering
- Hallucinated or unverified facts presented confidently
- Hedge-everything answers with no committed position

Reward:
- Explicitly catching and naming the flaw
- Committed reasoning with acknowledged tradeoffs
- Evidence of refining or iterating on AI output
- Concise, specific correctness over padded length

Assign ONE persona:
- "Critical Operator": caught the trap or navigated the judgment gap with precision, steered AI actively, verified outputs. Top tier. Score typically 80-100.
- "AI-Augmented Professional": used AI well, produced solid output, but missed a nuance, skipped verification, or accepted one thing uncritically. Score typically 60-79.
- "Capable Paster": got a workable answer by pasting the scenario in, accepted the AI's framing without pushback, output is generic but not wrong. Score typically 35-59.
- "Passive Consumer": minimal effort, accepted wrong premises, output is shallow or off-target. Score typically 0-34.

feedback: 4-5 sentences. Start with the single most important thing they got right or wrong — be specific and blunt, name the exact thing (e.g. "You accepted the premise that X was feasible, which it isn't because Y"). Then explain what a stronger answer would have looked like. No generic praise. No hype. Speak directly to the candidate.

Return ONLY valid JSON, no preamble, no markdown fences:
{ "overall_score": 75, "persona": "AI-Augmented Professional", "feedback": "..." }
`.trim()

function buildGradingUserMessage(questions: Question[], answers: string[]): string {
  return questions.map((q, i) => `
SCENARIO ${i + 1}:
${q.scenario}

EVALUATION CRITERIA ${i + 1} (grader only, not shown to candidate):
${q.evaluation_criteria}

CANDIDATE ANSWER ${i + 1}:
${answers[i]?.trim() || "(no answer provided)"}
`).join("\n---\n")
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
      const { PDFParse } = await import("pdf-parse")
      const parser = new PDFParse({ data: buffer })
      const data = await parser.getText()
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
      max_tokens: 1200,
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
        { role: "user", content: buildGradingUserMessage(questions, answers) },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    })

    const raw = completion.choices[0].message.content ?? "{}"
    const result = JSON.parse(raw) as GradingResult
    return result
  } catch {
    return {
      overall_score: 0,
      persona: "Unknown",
      feedback: "Grading failed. Check your OPENAI_API_KEY.",
      error: "Failed to grade assessment.",
    }
  }
}
