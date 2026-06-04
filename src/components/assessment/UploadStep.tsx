"use client"

import { useRef, useState } from "react"
import { FileUp, LockKeyhole, ScanLine, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadStepProps {
  onUpload: (file: File) => void
}

export function UploadStep({ onUpload }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  function validate(file: File): string | null {
    const name = file.name.toLowerCase()
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) return "Only .pdf and .docx files are accepted."
    if (file.size > 5 * 1024 * 1024) return "File must be under 5 MB."
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    onUpload(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-1 items-center justify-center px-8 pt-0 pb-24">
      <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">

        {/* Left: info */}
        <section className="flex flex-col gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            <ScanLine size={11} />
            Step 01 — Context
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 leading-snug">
              Start with the work you actually do.
            </h1>
            <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
              Your resume gives the assessment enough context to build role-specific scenarios and score the parts of your work that are easiest to automate.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <FileUp size={13} className="text-neutral-600 shrink-0" />
              <span className="text-xs font-semibold text-neutral-700 uppercase tracking-widest">PDF or DOCX</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
              <LockKeyhole size={13} className="text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Secure</span>
            </div>
          </div>
        </section>

        {/* Right: upload zone */}
        <section className="rounded-lg border border-neutral-200 bg-white shadow-md shadow-neutral-100/80 overflow-hidden">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "group flex w-full cursor-pointer items-center gap-6 px-8 py-10 text-left transition-all duration-200",
              dragging
                ? "bg-neutral-100"
                : "bg-white hover:bg-neutral-50"
            )}
          >
            <span className={cn(
              "shrink-0 flex h-14 w-14 items-center justify-center rounded-lg border transition-all duration-200",
              dragging
                ? "border-neutral-400 bg-neutral-200 text-neutral-700"
                : "border-neutral-200 bg-neutral-50 text-neutral-600 group-hover:border-neutral-900 group-hover:bg-neutral-900 group-hover:text-white"
            )}>
              <Upload className="h-6 w-6" />
            </span>
            <div>
              <p className="text-base font-semibold text-neutral-900">Drop your resume here</p>
              <p className="text-sm text-neutral-400 mt-0.5">PDF or DOCX · Max 5 MB</p>
            </div>
            <span className={cn(
              "ml-auto shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200",
              dragging
                ? "border-neutral-300 bg-white text-neutral-600"
                : "border-neutral-200 bg-white text-neutral-600 group-hover:border-neutral-900 group-hover:bg-neutral-900 group-hover:text-white"
            )}>
              Browse files
            </span>
          </button>

          {error && (
            <p className="mx-3 mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleChange} />
        </section>

      </div>
    </div>
  )
}
