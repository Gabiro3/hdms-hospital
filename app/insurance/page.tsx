import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getAllInsurers } from "@/services/insurance-service"
import InsuranceDashboard from "@/components/insurance/insurance-dashboard"
import DashboardLayout from "@/components/layout/dashboard-layout"

export const metadata: Metadata = {
  title: "Insurance Dashboard | Hospital Diagnosis System",
  description: "Insurance management dashboard for the Hospital Diagnosis System",
}

export default async function InsurancePage() {
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

  return <DashboardLayout><InsuranceDashboard insurers={insurers} userId={session.user.id} hospitalId={userData.hospital_id} /></DashboardLayout>
}
