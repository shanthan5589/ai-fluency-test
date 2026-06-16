"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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

const TIMER_DURATION = 90

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

  // Per-question timers. timerActive[i] = true only after first visit to question i.
  const [timers, setTimers] = useState<number[]>([TIMER_DURATION, TIMER_DURATION, TIMER_DURATION])
  const [timerActive, setTimerActive] = useState<boolean[]>([false, false, false])
  const [locked, setLocked] = useState<boolean[]>([false, false, false])

  // Refs for stale-closure-safe access inside the interval and expiry effect
  const isGradingRef = useRef(false)
  const timerActiveRef = useRef<boolean[]>([false, false, false])
  const lockedRef = useRef<boolean[]>([false, false, false])
  const currentQuestionRef = useRef(0)
  const answersRef = useRef<string[]>(["", "", ""])
  const resumeTextRef = useRef("")
  const questionsRef = useRef<Question[]>([])
  // Prevents the expiry handler from firing more than once per question
  const expiryHandledRef = useRef<boolean[]>([false, false, false])

  // Sync refs on every render so interval callbacks always see current values
  timerActiveRef.current = timerActive
  lockedRef.current = locked
  currentQuestionRef.current = currentQuestion
  answersRef.current = answers
  resumeTextRef.current = resumeText
  questionsRef.current = questions

  const triggerGrading = useCallback(() => {
    if (isGradingRef.current) return
    isGradingRef.current = true
    setIsGrading(true)
    gradeAssessment(resumeTextRef.current, questionsRef.current, answersRef.current).then(result => {
      isGradingRef.current = false
      setIsGrading(false)
      setGradingResult(result)
      setStage("results")
    })
  }, [])

  // Starts a question's timer on first visit — idempotent
  const startTimerForQuestion = useCallback((index: number) => {
    setTimerActive(prev => {
      if (prev[index]) return prev
      const next = [...prev]
      next[index] = true
      timerActiveRef.current = next
      return next
    })
  }, [])

  // Navigate to a question and start its timer (first-visit only)
  const navigateTo = useCallback((index: number) => {
    setCurrentQuestion(index)
    startTimerForQuestion(index)
  }, [startTimerForQuestion])

  // Single interval that ticks all active, unlocked timers simultaneously
  useEffect(() => {
    if (stage !== "quiz") return
    const id = setInterval(() => {
      setTimers(prev => {
        const next = [...prev]
        let changed = false
        for (let i = 0; i < 3; i++) {
          if (timerActiveRef.current[i] && !lockedRef.current[i] && next[i] > 0) {
            next[i] -= 1
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(id)
  }, [stage])

  // Fires whenever timers change — locks expired questions and auto-advances if needed
  useEffect(() => {
    if (stage !== "quiz") return
    for (let i = 0; i < 3; i++) {
      if (timers[i] === 0 && timerActiveRef.current[i] && !expiryHandledRef.current[i]) {
        expiryHandledRef.current[i] = true

        setLocked(prev => {
          const n = [...prev]
          n[i] = true
          lockedRef.current = n
          return n
        })
        setStatuses(prev => {
          const n = [...prev]
          n[i] = answersRef.current[i].trim() ? "answered" : "missed"
          return n
        })

        if (currentQuestionRef.current === i) {
          if (i < 2) {
            navigateTo(i + 1)
          } else {
            triggerGrading()
          }
        }
      }
    }
  }, [timers, stage, navigateTo, triggerGrading])

  const handleAnswerChange = useCallback((value: string) => {
    const qi = currentQuestionRef.current
    setAnswers(prev => {
      const n = [...prev]
      n[qi] = value
      return n
    })
  }, [])

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

    const initialActive: boolean[] = [true, false, false]
    timerActiveRef.current = initialActive
    expiryHandledRef.current = [false, false, false]

    setResumeText(result.resumeText)
    setQuestions(result.questions.slice(0, 3))
    setAnswers(["", "", ""])
    setStatuses(["pending", "pending", "pending"])
    setCurrentQuestion(0)
    setTimers([TIMER_DURATION, TIMER_DURATION, TIMER_DURATION])
    setTimerActive(initialActive)
    setLocked([false, false, false])
    setStage("quiz")
  }

  function handleRestart() {
    isGradingRef.current = false
    timerActiveRef.current = [false, false, false]
    lockedRef.current = [false, false, false]
    expiryHandledRef.current = [false, false, false]

    setStage("upload")
    setResumeText("")
    setQuestions([])
    setAnswers(["", "", ""])
    setStatuses(["pending", "pending", "pending"])
    setCurrentQuestion(0)
    setGradingResult(null)
    setUploadError(null)
    setIsGrading(false)
    setTimers([TIMER_DURATION, TIMER_DURATION, TIMER_DURATION])
    setTimerActive([false, false, false])
    setLocked([false, false, false])
  }

  return (
    <div className="app-page flex min-h-screen flex-col font-sans">
      <header className="relative z-10 shrink-0 border-b border-neutral-200 bg-white px-8 py-0 h-14 flex items-center">
        <div className="flex items-center gap-3 w-48">
          <span className="brand-mark shrink-0 bg-neutral-900 border-none">
            <ShieldCheck size={16} strokeWidth={2.2} className="text-white" />
          </span>
          <div className="min-w-0">
            <span className="block text-sm font-bold tracking-tight text-neutral-900 truncate">AI Fluency Test</span>
            {userName && <span className="block text-[10px] text-neutral-400 uppercase tracking-widest truncate">{userName}</span>}
          </div>
        </div>

        <div className="flex-1" />

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
                timers={timers}
                timerActive={timerActive}
                locked={locked}
                answers={answers}
                isGrading={isGrading}
                onAnswerChange={handleAnswerChange}
                onNavigate={navigateTo}
                onComplete={triggerGrading}
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
