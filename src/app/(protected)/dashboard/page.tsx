import { createClient } from "@/lib/supabase/server"
import { logout } from "@/actions/auth"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user!.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">AI Survival Index</h1>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit">
            Log out
          </Button>
        </form>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">
            Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
          </h2>
          <p className="text-muted-foreground text-lg">
            Your dashboard is ready. The assessment will appear here.
          </p>
        </div>
      </main>
    </div>
  )
}
