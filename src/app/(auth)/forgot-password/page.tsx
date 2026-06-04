import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"
import { AuthCard } from "@/components/auth/AuthCard"

export default function ForgotPasswordPage() {
  return (
    <div className="auth-page flex flex-col font-sans">
      <nav className="flex items-center px-8 py-5 border-b border-neutral-100">
        <Link href="/login" className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 transition-colors duration-200">
          <ArrowLeft size={15} />
          <span className="text-sm font-medium">Back to sign in</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-1">Reset your password</h1>
              <p className="text-neutral-400 text-sm">Enter your email and we&apos;ll send you a 6-digit code.</p>
            </div>
            <AuthCard>
              <ForgotPasswordForm />
            </AuthCard>
          </div>
        </div>
      </div>
    </div>
  )
}
