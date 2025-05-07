import type { Metadata } from "next"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import PatientForm from "@/components/patients/patient-form"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

export const metadata: Metadata = {
  title: "New Patient | Hospital Diagnosis Management System",
  description: "Create a new patient record",
}

export default async function NewPatientPage() {
    const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user data
  const { data: userData } = await supabase.from("users").select("*, hospitals(*)").eq("id", session.user.id).single()

  if (!userData) {
    redirect("/login")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Patient</h1>
          <p className="text-muted-foreground">Create a new patient record</p>
        </div>

        <PatientForm hospitalId={userData.hospital_id} userId={session.user.id || ''} doctorName={userData.full_name} />
      </div>
    </DashboardLayout>
  )
}
