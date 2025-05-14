"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { generateSessionToken } from "@/lib/utils/security-utils"

export async function patientSignIn(loginCode: string, fullName: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get patient by login code and name
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, name, login_code")
      .eq("login_code", loginCode)
      .single()

    if (patientError || !patient) {
      // Log failed attempt
      await logFailedLoginAttempt(loginCode, fullName)
      return { error: "Invalid login code or name" }
    }

    // Verify full name (case-insensitive comparison)
    if (patient.name.toLowerCase() !== fullName.toLowerCase()) {
      // Log failed attempt
      await logFailedLoginAttempt(loginCode, fullName)
      return { error: "Invalid login code or name" }
    }

    // Generate a session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24-hour session

    // Store session in database
    const { error: sessionError } = await supabase.from("patient_sessions").insert({
      id: crypto.randomUUID(),
      patient_id: patient.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      ip_address: (await headers()).get("x-forwarded-for") || "unknown",
      user_agent: (await headers()).get("user-agent") || "unknown",
    })

    if (sessionError) {
      console.error("Error creating patient session:", sessionError)
      return { error: "Failed to create session" }
    }

    // Set session cookie
    (await
          // Set session cookie
          cookies()).set("patient-session", sessionToken, {
      expires: expiresAt,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    // Log patient login activity
    try {
      await supabase.from("patient_activities").insert({
        patient_id: patient.id,
        action: "patient_login",
        details: "Patient logged in to portal",
        ip_address: (await headers()).get("x-forwarded-for") || "unknown",
        user_agent: (await headers()).get("user-agent") || "unknown",
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      // Ignore errors in activity logging
      console.error("Error logging patient login activity:", e)
    }

    return { success: true }
  } catch (error) {
    console.error("Patient sign in error:", error)
    return { error: "An unexpected error occurred" }
  }
}

async function logFailedLoginAttempt(loginCode: string, fullName: string) {
  try {
    const supabase = createServerSupabaseClient()

    await supabase.from("failed_patient_logins").insert({
      id: crypto.randomUUID(),
      login_code: loginCode,
      attempted_name: fullName,
      ip_address: (await headers()).get("x-forwarded-for") || "unknown",
      user_agent: (await headers()).get("user-agent") || "unknown",
      attempt_time: new Date().toISOString(),
    })
  } catch (e) {
    console.error("Error logging failed patient login:", e)
  }
}

export async function patientSignOut() {
  const supabase = createServerSupabaseClient()
  const sessionToken = (await cookies()).get("patient-session")?.value

  if (sessionToken) {
    // Get patient ID from session
    const { data: session } = await supabase
      .from("patient_sessions")
      .select("patient_id")
      .eq("session_token", sessionToken)
      .single()

    if (session) {
      // Log patient logout activity
      try {
        await supabase.from("patient_activities").insert({
          patient_id: session.patient_id,
          action: "patient_logout",
          details: "Patient logged out from portal",
          ip_address: (await headers()).get("x-forwarded-for") || "unknown",
          user_agent: (await headers()).get("user-agent") || "unknown",
          created_at: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Error logging patient logout activity:", e)
      }

      // Delete the session
      await supabase.from("patient_sessions").delete().eq("session_token", sessionToken)
    }
  }

  // Delete the cookie
  (await
        // Delete the cookie
        cookies()).delete("patient-session")
  redirect("/patient-portal")
}

export async function generatePatientLoginCode() {
  // Generate a random 7-digit code
  const min = 1000000 // 7 digits (starting with 1)
  const max = 9999999 // 7 digits (all 9s)
  const loginCode = Math.floor(Math.random() * (max - min + 1) + min).toString()

  return loginCode
}

export async function validateUniqueLoginCode(loginCode: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if login code already exists
    const { data, error } = await supabase.from("patients").select("id").eq("login_code", loginCode).maybeSingle()

    if (error) {
      console.error("Error checking login code uniqueness:", error)
      return false
    }

    // If data exists, the code is not unique
    return !data
  } catch (error) {
    console.error("Error validating login code:", error)
    return false
  }
}

export async function generateUniqueLoginCode() {
  let loginCode = await generatePatientLoginCode()
  let isUnique = await validateUniqueLoginCode(loginCode)

  // Keep generating until we find a unique code
  // Limit attempts to prevent infinite loop
  let attempts = 0
  const maxAttempts = 10

  while (!isUnique && attempts < maxAttempts) {
    loginCode = await generatePatientLoginCode()
    isUnique = await validateUniqueLoginCode(loginCode)
    attempts++
  }

  if (!isUnique) {
    throw new Error("Failed to generate a unique login code after multiple attempts")
  }

  return loginCode
}
