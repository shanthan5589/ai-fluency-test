import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">New password</h1>
          <p className="text-muted-foreground">Choose a strong password</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
