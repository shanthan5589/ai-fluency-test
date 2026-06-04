"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Question } from "@/actions/assessment"

type QuestionStatus = "pending" | "answered" | "missed"

interface QuizArenaProps {
  questions: Question[]
  currentQuestion: number
  statuses: QuestionStatus[]
  onSubmit: (answer: string) => void
  onTimeUp: (answer: string) => void
  isGrading?: boolean
}

const TIMER_DURATION = 90

export function QuizArena({
  questions,
  currentQuestion,
  statuses,
  onSubmit,
  onTimeUp,
  isGrading = false,
}: QuizArenaProps) {
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION)
  const [answer, setAnswer] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const answerRef = useRef(answer)
  answerRef.current = answer
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp

  useEffect(() => {
    setTimeLeft(TIMER_DURATION)
    setAnswer("")
    textareaRef.current?.focus()
  }, [currentQuestion])

  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [currentQuestion])

  useEffect(() => {
    if (timeLeft === 0) onTimeUpRef.current(answerRef.current)
  }, [timeLeft])

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  function timerColor() {
    if (timeLeft <= 10) return "text-red-500 animate-pulse"
    if (timeLeft <= 30) return "text-amber-500"
    return "text-neutral-800"
  }

  const question = questions[currentQuestion]

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-100">

      {/* Single unified toolbar: boxes centered, timer right */}
      <div className="shrink-0 bg-white border-b border-neutral-200 px-6 h-14 flex items-center">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {statuses.map((status, i) => (
            <div
              key={i}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-300",
                status === "answered" && "bg-emerald-500 text-white",
                status === "missed"   && "bg-red-500 text-white",
                status === "pending" && i === currentQuestion && "bg-neutral-900 text-white ring-2 ring-neutral-900 ring-offset-2",
                status === "pending" && i !== currentQuestion && "bg-white border border-neutral-200 text-neutral-400"
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="flex-1 flex justify-end">
          {isGrading ? (
            <span className="font-mono text-2xl font-bold tabular-nums text-neutral-300">
              --:--
            </span>
          ) : (
            <span className={cn("font-mono text-2xl font-bold tabular-nums transition-colors duration-300", timerColor())}>
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Split panel — connected directly to toolbar */}
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
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Your Response</span>
            <span className="text-sm text-neutral-400 tabular-nums">{answer.length} chars</span>
          </div>
          <div
            className="flex-1 p-6 cursor-text transition-colors duration-150 focus-within:bg-neutral-50/50"
            onClick={() => textareaRef.current?.focus()}
          >
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Click here and start typing your answer…"
              className="h-full w-full resize-none bg-transparent text-[15px] leading-7 text-neutral-800 placeholder:text-neutral-300 focus:outline-none min-h-[200px] cursor-text"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 bg-white border-t border-neutral-200 px-6 py-3 flex items-center justify-end">
        <Button
          onClick={() => onSubmit(answer)}
          disabled={isGrading}
          className="rounded-lg px-6 h-9 bg-neutral-900 hover:bg-black text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGrading ? "Grading…" : currentQuestion < questions.length - 1 ? "Next →" : "Complete Assessment"}
        </Button>
      </div>

    </div>
  )
}
