import Link from "next/link"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="auth-page flex flex-col font-sans">
      <nav className="flex items-center px-8 py-5 border-b border-neutral-100">
        <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-neutral-900 transition-colors duration-200">
          Back to sign in
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600">
              <Mail size={26} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">Check your inbox</h1>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              We&apos;ve sent a verification link to your email address. Click the link to activate your account.
            </p>
            <p className="text-xs text-neutral-400">
              Didn&apos;t receive it?{" "}
              <Link href="/signup" className="text-neutral-700 font-semibold hover:underline underline-offset-4">
                Try again
              </Link>{" "}
              or check your spam folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
