import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import PatientVisitView from "@/components/patients/patient-visit-view"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getPatientById, getPatientVisit } from "@/services/patient-service"

export const metadata: Metadata = {
  title: "Visit Details | Hospital Diagnosis Management System",
  description: "View patient visit details",
}

export default async function PatientVisitPage({
  params,
}: {
  params: { id: string; visitId: string }
}) {
    const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get authenticated user data
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("hospital_id, full_name, role")
    .eq("id", user.id)
    .single()

  if (!userData) {
    redirect("/login")
  }

  // Get patient data
  const { patient, error: patientError } = await getPatientById(params.id, userData.hospital_id)

  if (patientError || !patient) {
    notFound()
  }

  // Get visit data
  const { visit, error: visitError } = await getPatientVisit(params.visitId, params.id, userData.hospital_id)

  if (visitError || !visit) {
    notFound()
  }

  return (
    <DashboardLayout>
      <PatientVisitView patient={patient} visit={visit} currentUser={userData} />
    </DashboardLayout>
  )
}
