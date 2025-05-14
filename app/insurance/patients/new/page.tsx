import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getAllInsurers } from "@/services/insurance-service"
import InsurancePatientForm from "@/components/insurance/insurance-patient-form"
import DashboardLayout from "@/components/layout/dashboard-layout"

export const metadata: Metadata = {
  title: "Add New Patient | Insurance Management",
  description: "Add a new patient with insurance coverage",
}

export default async function NewInsurancePatientPage() {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user data and check if insurance role
  const { data: userData } = await supabase.from("users").select("role, hospital_id").eq("id", session.user.id).single()

  if (!userData || userData.role !== "DOCTOR") {
    redirect("/dashboard")
  }

  // Get all insurers
  const { insurers } = await getAllInsurers()

  return (
    <div className="space-y-6">

      <DashboardLayout><InsurancePatientForm insurers={insurers} userId={session.user.id} hospitalId={userData.hospital_id} /></DashboardLayout>
    </div>
  )
}
