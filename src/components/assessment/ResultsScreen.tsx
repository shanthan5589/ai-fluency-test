"use client"

import { Button } from "@/components/ui/button"
import type { GradingResult } from "@/actions/assessment"

interface ResultsScreenProps {
  result: GradingResult
  onRestart: () => void
}

export function ResultsScreen({ result, onRestart }: ResultsScreenProps) {
  const grade = result.overall_score >= 70 ? "high" : result.overall_score >= 40 ? "mid" : "low"

  const ringColor    = grade === "high" ? "border-emerald-400" : grade === "mid" ? "border-amber-400"  : "border-red-400"
  const scoreColor   = grade === "high" ? "text-emerald-600"   : grade === "mid" ? "text-amber-500"    : "text-red-500"
  const shadowColor  = grade === "high" ? "shadow-emerald-100" : grade === "mid" ? "shadow-amber-100"  : "shadow-red-100"
  const badgeBg      = grade === "high" ? "bg-emerald-500 text-white" : grade === "mid" ? "bg-amber-400 text-white" : "bg-red-500 text-white"
  const badgeLabel   = grade === "high" ? "Strong Result" : grade === "mid" ? "Room to Grow" : "Needs Work"
  const feedbackBorder = grade === "high" ? "border-l-emerald-400" : grade === "mid" ? "border-l-amber-400" : "border-l-red-400"
  const pageBg       = grade === "high" ? "bg-emerald-50/40" : grade === "mid" ? "bg-amber-50/30" : "bg-red-50/20"

  return (
    <div className={`flex-1 flex items-center justify-center px-8 py-12 ${pageBg}`}>
      <div className="w-full max-w-lg space-y-8 text-center">

        {/* Score circle */}
        <div className="flex flex-col items-center gap-4">
          <div className={`relative flex items-center justify-center w-40 h-40 rounded-full border-4 ${ringColor} bg-white shadow-xl ${shadowColor}`}>
            <div className="flex flex-col items-center">
              <span className={`text-5xl font-bold tabular-nums ${scoreColor}`}>
                {result.overall_score}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mt-0.5">
                / 100
              </span>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest ${badgeBg}`}>
            {badgeLabel}
          </span>
        </div>

        {/* Persona */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            Persona Identified
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            {result.persona}
          </h2>
        </div>

        {/* Feedback */}
        <div className={`rounded-lg border border-neutral-200 border-l-4 ${feedbackBorder} bg-white p-6 text-[15px] leading-7 text-left text-neutral-600 shadow-sm`}>
          {result.feedback}
        </div>

        {/* Action */}
        <Button
          onClick={onRestart}
          className="rounded-lg px-8 h-11 bg-neutral-900 hover:bg-black text-white font-semibold transition-colors"
        >
          Restart Assessment
        </Button>

      </div>
    </div>
  )
}
