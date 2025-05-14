import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import PrescriptionForm from "@/components/prescriptions/prescription-form"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getGeneralPatientById } from "@/services/patient-service"

export const metadata: Metadata = {
  title: "Create Prescription | Hospital Diagnosis Management System",
  description: "Create a new prescription for a patient",
}

export default async function CreatePrescriptionPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { visitId?: string }
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
  const { data: userData } = await supabase
    .from("users")
    .select("*, hospital_id, full_name, role")
    .eq("id", session.user.id)

  if (!userData) {
    redirect("/login")
  }

  // Get patient data
  const { patient, error } = await getGeneralPatientById(params.id, userData[0].hospital_id)

  if (error || !patient) {
    notFound()
  }

  // Get visit data if visitId is provided
  let visit = null
  if (searchParams.visitId) {
    const { data: visitData, error: visitError } = await supabase
      .from("patient_visits")
      .select("*")
      .eq("id", searchParams.visitId)
      .eq("patient_id", params.id)
      .eq("hospital_id", userData[0].hospital_id)

    if (visitError || !visitData) {
      // If visit not found, redirect to create prescription without visit
      alert("You must record a visit before creating a prescription.")
    }

    visit = visitData
  } else {
    // If no visitId provided, get the most recent visit
    const { data: recentVisit, error: recentVisitError } = await supabase
      .from("patient_visits")
      .select("*")
      .eq("patient_id", params.id)
      .eq("hospital_id", userData[0].hospital_id)
      .order("visit_date", { ascending: false })
      .limit(1)
      .single()

    if (!recentVisitError && recentVisit) {
      visit = recentVisit
    } else {
      // Create a default visit object if no visits found
      visit = {
        id: "new",
        patient_id: params.id,
        visit_date: new Date().toISOString(),
        reason: "General consultation",
        hospital_id: userData[0].hospital_id,
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Prescription</h1>
          <p className="text-muted-foreground">Create a new prescription for {patient.name}</p>
        </div>

        <PrescriptionForm patient={patient} visit={visit} doctor={userData} hospitalId={userData[0].hospital_id} />
      </div>
    </DashboardLayout>
  )
}
