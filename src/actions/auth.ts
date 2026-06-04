"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

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
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If Supabase requires email confirmation, data.session will be null.
  // Send unconfirmed users to verify-email; confirmed users straight to dashboard.
  if (data.session) {
    redirect("/dashboard")
  } else {
    redirect("/verify-email")
  }
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
