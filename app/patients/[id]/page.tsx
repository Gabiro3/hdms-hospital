import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import PatientView from "@/components/patients/patient-view"
import { getGeneralPatientById } from "@/services/patient-service"
import { getDiagnoses } from "@/services/diagnosis-service"

export const metadata: Metadata = {
  title: "Patient Details | Hospital Diagnosis Management System",
  description: "View patient details and diagnoses",
}

export default async function PatientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user data
  const { data: userData } = await supabase.from("users").select("hospital_id, full_name, id").eq("id", session.user.id).single()

  if (!userData) {
    redirect("/login")
  }

  // Ensure params.id is available before continuing
  const { id } = params;  // Extract id from params here

  // Get patient data
  const { patient, error: patientError } = await getGeneralPatientById(id, userData.hospital_id)

  if (patientError || !patient) {
    notFound()
  }


  return (
    <DashboardLayout>
      <PatientView patient={patient} currentUser={userData}/>
    </DashboardLayout>
  )
}
