import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto text-4xl">📬</div>
          <CardTitle className="text-2xl">Check your inbox</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to your email address. Click the
            link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <Link href="/signup" className="text-primary underline underline-offset-4">
              try again
            </Link>
            .
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
