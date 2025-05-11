"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { recordFailedLoginAttempt, getRecentFailedLoginAttempts, clearFailedLoginAttempts } from "./security-service"
import { updateLastLogin, getUserByEmail } from "./user-service"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    // Check for too many failed login attempts
    const { count, error: securityError } = await getRecentFailedLoginAttempts(email)
    if (securityError) {
      return { error: "Security check failed" }
    }

    // If too many failed attempts, block login
    if (count >= 5) {
      return { error: "Too many failed login attempts. Please try again later or reset your password." }
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Record failed login attempt
      await recordFailedLoginAttempt(email)
      return { error: error.message }
    }

    // Clear any failed login attempts
    await clearFailedLoginAttempts(email)

    // Update last login timestamp
    if (data.user) {
      await updateLastLogin(data.user.id)
    }
    // Log user login activity
      try {
        await supabase.from("user_activities").insert({
          user_id: data.user.id,
          action: "user_login",
          details: "User logged in successfully",
          resource_type: "auth",
          resource_id: data.user.id,
          ip_address: (await headers()).get("x-forwarded-for") || "unknown",
          user_agent: (await headers()).get("user-agent") || "unknown",
          created_at: new Date().toISOString(),
        })
      } catch (e) {
        // Ignore errors in activity logging
        console.error("Error logging login activity:", e)
      }

    return { success: true }
  } catch (error) {
    console.error("Sign in error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const hospitalId = formData.get("hospitalId") as string

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          hospital_id: hospitalId,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true, user: data.user }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function signOut() {
  const supabase = createServerSupabaseClient()
  // Get current user before signing out
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Log user logout activity if user exists
  if (user) {
    try {
      await supabase.from("user_activities").insert({
        user_id: user.id,
        action: "user_logout",
        details: "User logged out",
        resource_type: "auth",
        resource_id: user.id,
        ip_address: (await headers()).get("x-forwarded-for") || "unknown",
        user_agent: (await headers()).get("user-agent") || "unknown",
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      // Ignore errors in activity logging
      console.error("Error logging logout activity:", e)
    }
  }
  await supabase.auth.signOut()
  ;(await cookies()).delete("supabase-auth-token")
  redirect("/login")
}

export async function resetPassword(email: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function updatePassword(password: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Update password error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getCurrentUser() {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { user: null }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { user: null }
    }

    // Get the user's profile from our database
    const { user: profile } = await getUserByEmail(user.email!)

    return {
      user: {
        ...user,
        ...profile,
      },
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return { user: null }
  }
}
