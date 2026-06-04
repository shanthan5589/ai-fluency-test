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
  persona: string
  feedback: string
}

// TODO: Fill in your question generation prompt here.
// The model MUST return a JSON object with a "questions" key containing an array of:
// [{ "question_id": number, "scenario": string, "evaluation_criteria": string }]
const QUESTION_GENERATION_PROMPT = `
You are designing an AI-fluency assessment. The candidate may use any LLM (ChatGPT, Claude, Gemini, etc.), open multiple tabs, and copy-paste freely. Your job is to generate 3 scenarios where a lazy copy-paste of the prompt into an LLM produces visibly mediocre or wrong output, and where scoring well REQUIRES the candidate to use AI skillfully — not just access it.

You will be given the candidate's resume. Read it and tailor every scenario to their actual domain, tools, and seniority, so they cannot hide behind unfamiliarity and so generic AI output is obviously inadequate.

Each of the 3 scenarios MUST be built around at least one of these "paste-resistant" mechanisms:
1. A buried flawed premise: state something subtly wrong, infeasible, or based on an outdated/incorrect assumption in the candidate's domain. A fluent user catches it and corrects course; a paster lets the LLM run with it.
2. A judgment gap: the task has no single correct answer and requires domain-specific tradeoffs the LLM will paper over with generic advice unless the candidate steers it with context only they can supply.
3. Forced decomposition: a task large/multi-part enough that a single naive prompt yields shallow output, rewarding candidates who break it down and iterate.

The scenarios must be DIFFERENT from each other in both mechanism and skill tested (e.g. one debugging/verification, one design/judgment, one synthesis-under-ambiguity). Do not make them variations of the same task.

Write each scenario as a realistic work task, 80-150 words, in the candidate's domain. Do NOT tell the candidate what the trap is or that there is one. Do NOT mention "AI fluency" inside the scenario text.

The evaluation_criteria for each question is for the GRADER, not the candidate. It must spell out concretely: what a lazy paste-and-submit answer looks like for THIS scenario, what a fluent answer looks like, and the specific thing (the trap, the judgment, the decomposition) that separates them.

Return ONLY valid JSON, no preamble, no markdown fences:
{ "questions": [{ "question_id": 1, "scenario": "...", "evaluation_criteria": "..." }, { "question_id": 2, ... }, { "question_id": 3, ... }] }
`.trim()

// TODO: Fill in your grading prompt here.
// The model MUST return a JSON object with:
// { "overall_score": number (0-100), "persona": string, "feedback": string }
const GRADING_PROMPT = `
You are grading a candidate's response to an AI-fluency assessment task. The candidate was allowed to use any LLM and copy-paste freely, so you are NOT grading whether the answer is correct in isolation — a correct-looking answer can be a single lazy paste. You are grading the SKILL OF AI USE evident in the response.

You will receive: the scenario, its evaluation_criteria (which describes the trap/judgment/decomposition and what separates lazy from fluent answers), and the candidate's submitted answer.

Score 0-100 on the weighted combination of:
- Did they catch the trap / handle the buried flawed premise? (heaviest weight if the scenario has one)
- Domain judgment: did they inject specific, non-generic reasoning, or is it boilerplate the LLM would produce unprompted?
- Verification & skepticism: signs they checked the AI's claims rather than trusting them.
- Decomposition & iteration: evidence the problem was broken down, not one-shotted.
- Output quality: is the final result genuinely good for the stated task?

Penalize heavily: generic LLM filler, confidently repeating the scenario's wrong premise, hallucinated facts left uncorrected, hedge-everything answers with no committed judgment.
Reward: catching the flaw, committed reasoning with tradeoffs, evidence of refining the AI's first output, concise correctness over padded length.

Assign ONE persona that best fits the response:
- "Critical Operator" (steers and verifies AI, catches its errors, top tier)
- "AI-Augmented Professional" (uses AI well but with gaps in verification or judgment)
- "Capable Paster" (gets workable output but accepts AI's framing uncritically)
- "Passive Consumer" (lazy paste, no judgment, misses traps)

feedback: 3-5 sentences, specific to THIS answer. Name the exact thing they did well or missed (e.g. "you accepted the premise that X, which was false"). No generic praise, no hype.

Return ONLY valid JSON, no preamble, no markdown fences:
{ "overall_score": 75, "persona": "AI-Augmented Professional", "feedback": "..." }
`.trim()

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

  if (!isPdf && !isDocx) {
    return { error: "Only .pdf and .docx files are accepted." }
  }

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

  if (!resumeText.trim()) {
    return { error: "Could not read any text from the file." }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: QUESTION_GENERATION_PROMPT },
        { role: "user", content: resumeText },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    })

    const raw = completion.choices[0].message.content ?? "{}"
    const parsed = JSON.parse(raw)
    const questions: Question[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.questions)
        ? parsed.questions
        : []

    if (questions.length === 0) {
      return { error: "The AI did not return valid questions. Check the prompt." }
    }

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
        { role: "system", content: GRADING_PROMPT },
        {
          role: "user",
          content: JSON.stringify({ resumeText, questions, answers }),
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
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