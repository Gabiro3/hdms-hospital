import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import PatientForm from "@/components/patients/patient-form"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getGeneralPatientById } from "@/services/patient-service"

export const metadata: Metadata = {
  title: "Edit Patient | Hospital Diagnosis Management System",
  description: "Update patient information and medical records",
}

export default async function EditPatientPage({
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
  const { patient, error } = await getGeneralPatientById(params.id, userData.hospital_id)

  if (error || !patient) {
    notFound()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Patient Information</h1>
          <p className="text-muted-foreground">Update patient details, medical information, and emergency contacts.</p>
        </div>

        <PatientForm
          hospitalId={userData.hospital_id}
          userId={user.id}
          doctorName={userData.full_name}
          existingPatient={patient}
        />
      </div>
    </DashboardLayout>
  )
}
