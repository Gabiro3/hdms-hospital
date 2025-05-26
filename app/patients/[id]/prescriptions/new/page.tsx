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

export default async function CreatePrescriptionPage(context: {
  params: { id: string }
  searchParams: { visitId?: string }
}) {
  const { params, searchParams } = context
  const { id } = params

  const cookieStore = await cookies()
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
  const { patient, error } = await getGeneralPatientById(id, userData[0].hospital_id)

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
      .eq("patient_id", id)
      .eq("hospital_id", userData[0].hospital_id)

    if (!visitError && visitData?.length) {
      visit = visitData[0]
    }
  } else {
    const { data: recentVisit, error: recentVisitError } = await supabase
      .from("patient_visits")
      .select("*")
      .eq("patient_id", id)
      .eq("hospital_id", userData[0].hospital_id)
      .order("visit_date", { ascending: false })
      .limit(1)
      .single()

    visit = recentVisitError || !recentVisit
      ? {
          id: "new",
          patient_id: id,
          visit_date: new Date().toISOString(),
          reason: "General consultation",
          hospital_id: userData[0].hospital_id,
        }
      : recentVisit
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Prescription</h1>
          <p className="text-muted-foreground">Create a new prescription for {patient.name}</p>
        </div>

        <PrescriptionForm
          patient={patient}
          visit={visit}
          doctor={userData[0]}
          hospitalId={userData[0].hospital_id}
        />
      </div>
    </DashboardLayout>
  )
}
