import { VerifyOtpForm } from "@/components/auth/VerifyOtpForm"

export default function VerifyOtpPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const email = searchParams.email ?? ""

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Enter your code</h1>
          <p className="text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="text-foreground font-medium">{email}</span>
          </p>
        </div>
        <VerifyOtpForm email={email} />
      </div>
    </div>
  )
}
