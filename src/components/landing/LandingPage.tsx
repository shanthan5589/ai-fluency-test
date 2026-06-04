"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ShieldCheck } from "lucide-react"

function BlinkingCursor() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.span
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.1 }}
      className="ml-1 inline-block h-[0.9em] w-[2px] translate-y-1 bg-neutral-400"
    />
  )
}

export function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neutral-100/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-neutral-100/50 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
      </div>

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-start justify-between p-8 md:p-12">
        {/* Top Left: Logo + Typewriter below */}
        <div className="flex flex-col relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900">
              <ShieldCheck size={14} strokeWidth={2.2} className="text-white" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-neutral-900 leading-tight">AI Fluency Test</span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-medium leading-tight">Evolving for the next workforce</span>
            </div>
          </motion.div>

          <div className="max-w-2xl pt-24 md:pt-28">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight">
                <span className="font-serif italic text-neutral-900 tracking-tight">
                  The future belongs to the AI-fluent.
                  <BlinkingCursor />
                </span>
              </h1>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 max-w-sm space-y-5"
            >
              <p className="text-[15px] text-neutral-500 leading-[2] tracking-wide">
                AI isn't replacing people. It's replacing people who don't know how to use it. The gap between those who can direct AI and those who can't is widening faster than any skill gap in history.
              </p>
              <div className="space-y-3 pt-4">
                <p className="text-xs text-neutral-400 tracking-wide leading-relaxed">
                  Take the 10-minute assessment. Find out where you stand.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-full hover:bg-black transition-all duration-300 hover:-translate-y-0.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)]"
                >
                  Take the Assessment →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Top Right: Auth Actions */}
        <div className="flex items-center gap-10 text-sm font-medium tracking-tight relative z-10">
          <Link 
            href="/login" 
            className="text-neutral-400 hover:text-neutral-900 transition-all duration-500 ease-out relative group"
          >
            Sign In
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-neutral-900 transition-all duration-500 group-hover:w-full" />
          </Link>
          <Link 
            href="/signup" 
            className="px-8 py-3 bg-neutral-900 text-white rounded-full hover:bg-black transition-all duration-500 ease-out shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Main Content: Minimalist Canvas */}
      <main className="relative z-10">
        <section className="flex min-h-screen items-center justify-end p-8 md:p-32 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 0.4, scale: 1, rotate: 0 }}
            transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] pointer-events-none -mt-20"
          >
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full text-neutral-900"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            >
              <circle cx="100" cy="100" r="90" />
              <ellipse cx="100" cy="100" rx="90" ry="30" />
              <ellipse cx="100" cy="100" rx="90" ry="60" />
              <ellipse cx="100" cy="100" rx="30" ry="90" />
              <ellipse cx="100" cy="100" rx="60" ry="90" />
              <line x1="100" y1="10" x2="100" y2="190" />
              <line x1="10" y1="100" x2="190" y2="100" />
            </svg>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border border-neutral-200 rounded-full scale-[1.1] border-dashed opacity-50"
            />
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 px-8 md:px-12 py-6 flex justify-end items-center pointer-events-none z-50">
        <span className="text-xs text-neutral-400 tracking-wide">© 2026 AI Fluency Test</span>
      </footer>
    </div>
  )
}
