import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import RadiologyDashboard from "@/components/radiology/radiology-dashboard"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getRecentRadiologyStudies } from "@/services/radiology-service"

export const metadata: Metadata = {
  title: "Radiology Dashboard | Hospital Diagnosis Management System",
  description: "View and analyze radiological images and create diagnostic reports",
}

export default async function RadiologyPage() {
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
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!userData) {
    redirect("/login")
  }

  // Get recent studies for the dashboard
  const { studies, error } = await getRecentRadiologyStudies(userData.hospital_id)

  if (error) {
    console.error("Error fetching radiology studies:", error)
  }

  return (
    <DashboardLayout>
      <RadiologyDashboard studies={studies || []} currentUser={userData} />
    </DashboardLayout>
  )
}
