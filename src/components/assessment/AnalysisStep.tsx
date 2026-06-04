"use client"

import { useEffect, useState } from "react"
import { Brain, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const TICKERS = [
  "Reading your document...",
  "Extracting key information...",
  "Generating your scenarios...",
]

// appeared[i] = item is visible; completed[i] = item shows check (Done)
// The 3rd item appears but never auto-completes — it spins until the API responds
const APPEAR_DELAYS  = [0, 900, 1800]
const COMPLETE_DELAYS = [400, 1300]   // only first two complete automatically

export function AnalysisStep() {
  const [appeared,  setAppeared]  = useState<boolean[]>([false, false, false])
  const [completed, setCompleted] = useState<boolean[]>([false, false, false])

  useEffect(() => {
    const appearTimers = APPEAR_DELAYS.map((delay, i) =>
      setTimeout(() => setAppeared(prev => { const n = [...prev]; n[i] = true; return n }), delay)
    )
    const completeTimers = COMPLETE_DELAYS.map((delay, i) =>
      setTimeout(() => setCompleted(prev => { const n = [...prev]; n[i] = true; return n }), delay)
    )
    return () => {
      appearTimers.forEach(clearTimeout)
      completeTimers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="relative z-10 flex flex-1 items-center justify-center px-8 py-16">
      <div className="w-full max-w-xl">

        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 shadow-sm">
            <Brain size={34} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 leading-snug">
            Tailoring your assessment
          </h1>
          <p className="mt-3 text-base text-neutral-500 leading-relaxed">
            Generating questions tailored to your experience.
          </p>
        </div>

        <div className="space-y-3">
          {TICKERS.map((text, i) => (
            <div
              key={text}
              className={cn(
                "flex items-center gap-4 rounded-lg border px-5 py-4 transition-all duration-700",
                !appeared[i]
                  ? "translate-y-4 border-transparent bg-transparent opacity-0"
                  : completed[i]
                    ? "translate-y-0 border-emerald-100 bg-emerald-50/60 opacity-100"
                    : "translate-y-0 border-neutral-200 bg-neutral-50/60 opacity-100"
              )}
            >
              <span className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-500",
                completed[i]
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-neutral-50 border-neutral-200 text-neutral-400"
              )}>
                {completed[i]
                  ? <Check size={16} />
                  : <Loader2 size={16} className="animate-spin" />
                }
              </span>
              <span className={cn(
                "text-sm font-medium tracking-tight transition-colors duration-500",
                completed[i] ? "text-emerald-800" : "text-neutral-500"
              )}>
                {text}
              </span>
              {completed[i] && (
                <span className="ml-auto text-xs font-semibold text-emerald-500 uppercase tracking-widest">Done</span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
