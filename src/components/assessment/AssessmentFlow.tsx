"use client"

import { useCallback, useState } from "react"
import { LogOut, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { logout } from "@/actions/auth"
import { parseAndGenerateQuestions, gradeAssessment } from "@/actions/assessment"
import type { Question, GradingResult } from "@/actions/assessment"
import { Button } from "@/components/ui/button"
import { UploadStep } from "./UploadStep"
import { AnalysisStep } from "./AnalysisStep"
import { QuizArena } from "./QuizArena"
import { ResultsScreen } from "./ResultsScreen"

type Stage = "upload" | "analyzing" | "quiz" | "results"
type QuestionStatus = "pending" | "answered" | "missed"

interface AssessmentFlowProps {
  userName?: string
}

export function AssessmentFlow({ userName }: AssessmentFlowProps) {
  const [stage, setStage] = useState<Stage>("upload")
  const [resumeText, setResumeText] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<string[]>(["", "", ""])
  const [statuses, setStatuses] = useState<QuestionStatus[]>(["pending", "pending", "pending"])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isGrading, setIsGrading] = useState(false)

  async function handleFileUpload(file: File) {
    setUploadError(null)
    setStage("analyzing")

    const formData = new FormData()
    formData.append("resume", file)

    const result = await parseAndGenerateQuestions(formData)

    if (result.error || !result.resumeText || !result.questions) {
      setUploadError(result.error ?? "Something went wrong. Please try again.")
      setStage("upload")
      return
    }

    setResumeText(result.resumeText)
    setQuestions(result.questions.slice(0, 3))
    setAnswers(["", "", ""])
    setStatuses(["pending", "pending", "pending"])
    setCurrentQuestion(0)
    setStage("quiz")
  }

  const advance = useCallback(
    async (answer: string, status: QuestionStatus, qIndex: number, currentAnswers: string[]) => {
      const newStatuses = [...statuses]
      newStatuses[qIndex] = status
      setStatuses(newStatuses)

      const updatedAnswers = [...currentAnswers]
      updatedAnswers[qIndex] = answer
      setAnswers(updatedAnswers)

      if (qIndex < 2) {
        setCurrentQuestion(qIndex + 1)
      } else {
        setIsGrading(true)
        const gradeResult = await gradeAssessment(resumeText, questions, updatedAnswers)
        setIsGrading(false)
        setGradingResult(gradeResult)
        setStage("results")
      }
    },
    [statuses, resumeText, questions]
  )

  function handleSubmit(answer: string) {
    const status: QuestionStatus = answer.trim() ? "answered" : "missed"
    advance(answer, status, currentQuestion, answers)
  }

  const handleTimeUp = useCallback(
    (answer: string) => {
      const status: QuestionStatus = answer.trim() ? "answered" : "missed"
      advance(answer, status, currentQuestion, answers)
    },
    [advance, currentQuestion, answers]
  )

  function handleRestart() {
    setStage("upload")
    setResumeText("")
    setQuestions([])
    setAnswers(["", "", ""])
    setStatuses(["pending", "pending", "pending"])
    setCurrentQuestion(0)
    setGradingResult(null)
    setUploadError(null)
    setIsGrading(false)
  }

  return (
    <div className="app-page flex min-h-screen flex-col font-sans">
      <header className="relative z-10 shrink-0 border-b border-neutral-200 bg-white px-8 py-0 h-14 flex items-center">
        {/* Left: brand */}
        <div className="flex items-center gap-3 w-48">
          <span className="brand-mark shrink-0 bg-neutral-900 border-none">
            <ShieldCheck size={16} strokeWidth={2.2} className="text-white" />
          </span>
          <span className="text-sm font-bold tracking-tight text-neutral-900 truncate">AI Fluency Test</span>
        </div>

        <div className="flex-1" />

        {/* Right: logout */}
        <div className="flex justify-end w-48">
          <form action={logout}>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="rounded-lg px-4 h-8 border-neutral-200 text-neutral-600 text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              <LogOut size={13} className="mr-1.5" />
              Log out
            </Button>
          </form>
        </div>
      </header>

      {uploadError && stage === "upload" && (
        <div className="relative z-10 mx-auto mt-4 max-w-2xl rounded-lg border border-destructive/35 bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-destructive">
          {uploadError}
        </div>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            {stage === "upload" && <UploadStep onUpload={handleFileUpload} />}
            {stage === "analyzing" && <AnalysisStep />}
            {stage === "quiz" && questions.length > 0 && (
              <QuizArena
                questions={questions}
                currentQuestion={currentQuestion}
                statuses={statuses}
                onSubmit={handleSubmit}
                onTimeUp={handleTimeUp}
                isGrading={isGrading}
              />
            )}
            {stage === "results" && gradingResult && (
              <ResultsScreen result={gradingResult} onRestart={handleRestart} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
