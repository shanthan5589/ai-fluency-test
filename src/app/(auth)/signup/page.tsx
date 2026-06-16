import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { AuthCard } from "@/components/auth/AuthCard"

export default function SignUpPage() {
  return (
    <div className="auth-page flex flex-col font-sans">
      <nav className="flex items-center px-8 py-5 border-b border-neutral-100">
        <Link href="/login" className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 transition-colors duration-200">
          <ArrowLeft size={15} />
          <span className="text-sm font-medium">Back to sign in</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-start md:items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 md:p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-1">Create account</h1>
            </div>

            <AuthCard>
              <SignUpForm />
            </AuthCard>
          </div>

          <div className="mt-5 text-center text-sm text-neutral-400">
            Already have an account?{" "}
            <Link href="/login" className="text-neutral-900 font-semibold hover:underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
