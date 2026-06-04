import { createClient } from "@/lib/supabase/server"
import { AssessmentFlow } from "@/components/assessment/AssessmentFlow"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user!.id)
    .single()

  return <AssessmentFlow userName={profile?.first_name ?? undefined} />
}
