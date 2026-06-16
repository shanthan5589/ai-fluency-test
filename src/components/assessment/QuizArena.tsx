"use client"

import { useEffect, useRef, useState } from "react"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Question } from "@/actions/assessment"

type QuestionStatus = "pending" | "answered" | "missed"

interface QuizArenaProps {
  questions: Question[]
  currentQuestion: number
  statuses: QuestionStatus[]
  timers: number[]
  timerActive: boolean[]
  locked: boolean[]
  answers: string[]
  onAnswerChange: (value: string) => void
  onNavigate: (to: number) => void
  onComplete: () => void
  isGrading?: boolean
}

export function QuizArena({
  questions,
  currentQuestion,
  statuses,
  timers,
  timerActive,
  locked,
  answers,
  onAnswerChange,
  onNavigate,
  onComplete,
  isGrading = false,
}: QuizArenaProps) {
  const [showPopup, setShowPopup] = useState(false)
  const [emptyError, setEmptyError] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const question = questions[currentQuestion]
  const timeLeft = timers[currentQuestion]
  const isLocked = locked[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1

  useEffect(() => {
    if (!isLocked) textareaRef.current?.focus()
  }, [currentQuestion, isLocked])

  // If this question auto-locked while popup was open, close the popup
  useEffect(() => {
    if (isLocked) setShowPopup(false)
  }, [isLocked])

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  function timerColor(secs: number) {
    if (secs === 0) return "text-neutral-300"
    if (secs <= 10) return "text-red-500 animate-pulse"
    if (secs <= 30) return "text-amber-500"
    return "text-neutral-800"
  }

  function handleNextClick() {
    if (!answers[currentQuestion].trim()) {
      setEmptyError(true)
      return
    }
    setEmptyError(false)
    setShowPopup(true)
  }

  function handleConfirm() {
    setShowPopup(false)
    if (isLastQuestion) {
      onComplete()
    } else {
      onNavigate(currentQuestion + 1)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-100">

      {/* Toolbar: question nav boxes centered, current question timer on the right */}
      <div className="shrink-0 bg-white border-b border-neutral-200 px-6 h-14 flex items-center">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {statuses.map((status, i) => {
            const isCurrent = i === currentQuestion
            const isVisited = timerActive[i]

            return (
              <button
                key={i}
                onClick={() => isVisited && !isCurrent ? onNavigate(i) : undefined}
                disabled={!isVisited || isCurrent}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-300",
                  isCurrent && "bg-neutral-900 text-white ring-2 ring-neutral-900 ring-offset-2",
                  !isCurrent && status === "answered" && "bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600",
                  !isCurrent && status === "missed" && "bg-red-500 text-white cursor-pointer hover:bg-red-600",
                  !isCurrent && status === "pending" && isVisited && "bg-white border border-neutral-300 text-neutral-600 cursor-pointer hover:border-neutral-500",
                  !isVisited && "bg-white border border-neutral-200 text-neutral-300 cursor-default"
                )}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        <div className="flex-1 flex justify-end">
          {isGrading ? (
            <span className="font-mono text-2xl font-bold tabular-nums text-neutral-300">--:--</span>
          ) : (
            <span className={cn("font-mono text-2xl font-bold tabular-nums transition-colors duration-300", timerColor(timeLeft))}>
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Split panel */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 m-3 rounded-lg border border-neutral-200 overflow-hidden bg-white shadow-sm">

        {/* Left: scenario */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-neutral-200">
          <div className="shrink-0 px-6 py-3 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Scenario</span>
            <span className="text-sm text-neutral-400">Use AI tools — ChatGPT, Claude, or Gemini</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-[15px] leading-7 text-neutral-700 whitespace-pre-wrap [&_a]:text-inherit [&_a]:no-underline [&_a]:pointer-events-none">
              {question.scenario}
            </p>
          </div>
        </div>

        {/* Right: answer */}
        <div className="flex-1 flex flex-col">
          <div className="shrink-0 px-6 py-3 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Your Response</span>
              {isLocked && (
                <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                  <Lock size={8} />
                  Locked
                </span>
              )}
            </div>
            <span className="text-sm text-neutral-400 tabular-nums">{answers[currentQuestion].length} chars</span>
          </div>
          <div
            className={cn(
              "flex-1 p-6 transition-colors duration-150",
              !isLocked && "cursor-text focus-within:bg-neutral-50/50",
              isLocked && "bg-neutral-50/30 cursor-default"
            )}
            onClick={() => !isLocked && textareaRef.current?.focus()}
          >
            <textarea
              ref={textareaRef}
              value={answers[currentQuestion]}
              onChange={(e) => !isLocked && onAnswerChange(e.target.value)}
              placeholder={isLocked ? "Time expired — answer locked." : "Click here and start typing your answer…"}
              disabled={isLocked}
              className={cn(
                "h-full w-full resize-none bg-transparent text-[15px] leading-7 text-neutral-800 placeholder:text-neutral-300 focus:outline-none min-h-[200px]",
                isLocked ? "cursor-default opacity-60" : "cursor-text"
              )}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 bg-white border-t border-neutral-200 px-6 py-3 flex items-center justify-end gap-3">
        <Button
          onClick={handleNextClick}
          disabled={isGrading}
          className="rounded-lg px-6 h-9 bg-neutral-900 hover:bg-black text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGrading ? "Grading…" : isLastQuestion ? "Complete Assessment" : "Next →"}
        </Button>
      </div>

      {/* Empty answer warning popup */}
      {emptyError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setEmptyError(false)}
          />
          <div className="relative bg-white rounded-xl border border-neutral-200 shadow-2xl w-80 p-6">
            <h3 className="text-sm font-bold text-red-600">
              Response required
            </h3>
            <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
              You need to write a response before moving on. If you run out of time, the question will auto-advance.
            </p>
            <div className="mt-5 flex justify-end">
              <Button
                size="sm"
                onClick={() => setEmptyError(false)}
                className="rounded-lg h-8 px-4 text-xs bg-red-500 hover:bg-red-600 text-white"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setShowPopup(false)}
          />
          <div className="relative bg-white rounded-xl border border-neutral-200 shadow-2xl w-80 p-6">
            <h3 className="text-sm font-bold text-neutral-900">
              {isLastQuestion ? "Submit assessment?" : `Move to Question ${currentQuestion + 2}?`}
            </h3>
            <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
              {isLastQuestion
                ? "Your answers will be graded. You won't be able to make changes after this."
                : `Q${currentQuestion + 1} has ${formatTime(timers[currentQuestion])} left. You can return and edit while the timer runs.`
              }
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPopup(false)}
                className="rounded-lg h-8 px-4 text-xs border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                className="rounded-lg h-8 px-4 text-xs bg-neutral-900 hover:bg-black text-white"
              >
                {isLastQuestion ? "Submit →" : `Go to Q${currentQuestion + 2} →`}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
