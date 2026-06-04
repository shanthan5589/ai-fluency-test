/**
 * Smoke tests for assessment logic — no API key required.
 * Run: node scripts/test-assessment.mjs
 */

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ ${label}`)
    failed++
  }
}

// ─── Test 1: File validation logic (mirrors UploadStep.tsx) ───────────────────
console.log("\n[1] File validation")

function validateFile(name, sizeBytes) {
  const lower = name.toLowerCase()
  if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) return "Only .pdf and .docx files are accepted."
  if (sizeBytes > 5 * 1024 * 1024) return "File must be under 5 MB."
  return null
}

assert(validateFile("resume.pdf", 1_000_000) === null, "Valid PDF under 5MB passes")
assert(validateFile("resume.docx", 2_000_000) === null, "Valid DOCX under 5MB passes")
assert(validateFile("resume.pdf", 6_000_000) !== null, "PDF over 5MB is rejected")
assert(validateFile("resume.docx", 5 * 1024 * 1024 + 1) !== null, "DOCX at exactly 5MB+1 is rejected")
assert(validateFile("resume.docx", 5 * 1024 * 1024) === null, "DOCX at exactly 5MB is accepted")
assert(validateFile("resume.txt", 100) !== null, ".txt is rejected")
assert(validateFile("resume.png", 100) !== null, ".png is rejected")
assert(validateFile("resume.PDF", 100) === null, "Uppercase .PDF extension passes")
assert(validateFile("my resume.docx", 100) === null, "File with space in name passes")

// ─── Test 2: Question status logic (mirrors AssessmentFlow.tsx) ───────────────
console.log("\n[2] Question status logic")

function getStatus(answer) {
  return answer.trim() ? "answered" : "missed"
}

assert(getStatus("I would use Claude to...") === "answered", "Non-empty answer → 'answered'")
assert(getStatus("") === "missed", "Empty answer → 'missed'")
assert(getStatus("   ") === "missed", "Whitespace-only answer → 'missed'")
assert(getStatus("   real answer   ") === "answered", "Padded answer → 'answered'")

// ─── Test 3: Timer format (mirrors QuizArena.tsx) ─────────────────────────────
console.log("\n[3] Timer formatting")

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0")
  const s = (secs % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

assert(formatTime(90) === "01:30", "90s → 01:30")
assert(formatTime(60) === "01:00", "60s → 01:00")
assert(formatTime(0)  === "00:00", "0s  → 00:00")
assert(formatTime(9)  === "00:09", "9s  → 00:09")
assert(formatTime(45) === "00:45", "45s → 00:45")

// ─── Test 4: Answer accumulation (mirrors advance() in AssessmentFlow.tsx) ────
console.log("\n[4] Answer accumulation across 3 questions")

function simulateAdvance(answers, newAnswer, index) {
  const updated = [...answers]
  updated[index] = newAnswer
  return updated
}

let answers = ["", "", ""]
answers = simulateAdvance(answers, "Answer to Q1", 0)
assert(answers[0] === "Answer to Q1" && answers[1] === "" && answers[2] === "", "Q1 stored, Q2+Q3 still empty")
answers = simulateAdvance(answers, "", 1)
assert(answers[0] === "Answer to Q1" && answers[1] === "" && answers[2] === "", "Q2 empty (missed), Q1 preserved")
answers = simulateAdvance(answers, "Answer to Q3", 2)
assert(answers[2] === "Answer to Q3", "Q3 stored")
assert(answers.length === 3, "Array is always length 3")

// ─── Test 5: Status array transitions ────────────────────────────────────────
console.log("\n[5] Status array transitions")

function simulateStatuses(statuses, index, answer) {
  const next = [...statuses]
  next[index] = answer.trim() ? "answered" : "missed"
  return next
}

let statuses = ["pending", "pending", "pending"]
statuses = simulateStatuses(statuses, 0, "some answer")
assert(statuses[0] === "answered" && statuses[1] === "pending" && statuses[2] === "pending", "Q1 → answered")
statuses = simulateStatuses(statuses, 1, "")
assert(statuses[1] === "missed", "Q2 → missed (timer expired with empty answer)")
statuses = simulateStatuses(statuses, 2, "another answer")
assert(statuses[2] === "answered", "Q3 → answered")
assert(statuses.every(s => s !== "pending"), "All 3 questions resolved")

// ─── Test 6: mammoth import shape ─────────────────────────────────────────────
console.log("\n[6] Mammoth import (runtime)")

const mammoth = await import("mammoth")
assert(typeof mammoth.extractRawText === "function", "mammoth.extractRawText is a function")

// ─── Test 7: pdf-parse v2 import shape ────────────────────────────────────────
console.log("\n[7] pdf-parse v2 import (runtime)")

const { PDFParse } = await import("pdf-parse")
assert(typeof PDFParse === "function", "PDFParse is a constructor function")
assert(PDFParse.isNodeJS === true, "PDFParse.isNodeJS is true (Node.js env detected)")

// ─── Test 8: JSON parsing resilience (mirrors assessment.ts LLM response) ─────
console.log("\n[8] JSON response parsing resilience")

function parseQuestionsFromLLM(raw) {
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.questions)
      ? parsed.questions
      : []
}

const directArray = JSON.stringify([
  { question_id: 1, scenario: "S1", evaluation_criteria: "E1" }
])
const wrappedObject = JSON.stringify({
  questions: [
    { question_id: 1, scenario: "S1", evaluation_criteria: "E1" },
    { question_id: 2, scenario: "S2", evaluation_criteria: "E2" },
  ]
})
const badResponse = JSON.stringify({ some_other_key: "value" })

assert(parseQuestionsFromLLM(directArray).length === 1, "Parses direct JSON array")
assert(parseQuestionsFromLLM(wrappedObject).length === 2, "Parses { questions: [...] } wrapper")
assert(parseQuestionsFromLLM(badResponse).length === 0, "Returns [] for unknown shape")

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error("Some tests failed.")
  process.exit(1)
} else {
  console.log("All tests passed.")
}
