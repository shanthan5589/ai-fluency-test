"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function signUp(formData: {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    const adminClient = createAdminClient()
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: data.user.id,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: formData.phone,
    })

    if (profileError) {
      return { error: profileError.message }
    }
  }

  redirect("/dashboard")
}

export async function login(formData: { email: string; password: string }) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function requestPasswordReset(formData: { email: string }) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: formData.email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect(`/verify-otp?email=${encodeURIComponent(formData.email)}`)
}

export async function verifyPasswordResetOtp(formData: {
  email: string
  token: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    email: formData.email,
    token: formData.token,
    type: "email",
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/reset-password")
}

export async function updatePassword(formData: { password: string }) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: formData.password,
  })

  if (error) {
    return { error: error.message }
  }

  await supabase.auth.signOut()
  redirect("/login?message=password_updated")
}
