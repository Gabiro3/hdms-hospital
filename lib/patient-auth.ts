import { cookies } from "next/headers"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function checkPatientAuthentication() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient();

  // Retrieve the session token from the 'patient-session' cookie
  const sessionToken = cookieStore.get("patient-session");

  if (!sessionToken) {
    // If there's no session token, the patient is not authenticated
    return { authenticated: false };
  }

  // Query the database to check if the session token exists and is valid
  const { data: sessionData, error: sessionError } = await supabase
    .from("patient_sessions")
    .select("patient_id, expires_at")
    .eq("session_token", sessionToken.value)
    .single();

  if (sessionError || !sessionData) {
    // If no session data is found or there's an error, the session is invalid
    return { authenticated: false };
  }

  const { patient_id, expires_at } = sessionData;
  const expirationDate = new Date(expires_at);

  // Check if the session has expired
  if (expirationDate < new Date()) {
    // If the session is expired, delete the cookie and return unauthenticated
    cookieStore.delete("patient-session");
    return { authenticated: false };
  }

  // Retrieve patient details to ensure they exist in the patients table
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patient_id)
    .single();

  if (patientError || !patient) {
    // If no patient is found or there's an error, sign them out and invalidate the session
    cookieStore.delete("patient-session");
    return { authenticated: false };
  }

  // If all checks pass, the patient is authenticated
  return { authenticated: true, patientId: patient.id };
}


export async function requirePatientAuth() {
  const { authenticated } = await checkPatientAuthentication()

  if (!authenticated) {
    redirect("/patient-portal")
  }
}

export async function getPatientData() {
  const { authenticated, patientId } = await checkPatientAuthentication()

  if (!authenticated || !patientId) {
    return { patient: null }
  }

  const supabase = createServerSupabaseClient()

  // Get patient data
  const { data: patient, error } = await supabase
    .from("patients")
    .select(`
      *,
      hospitals (
        id,
        name,
        address
      )
    `)
    .eq("id", patientId)
    .single()

  if (error || !patient) {
    console.error("Error fetching patient data:", error)
    return { patient: null }
  }

  return { patient }
}
