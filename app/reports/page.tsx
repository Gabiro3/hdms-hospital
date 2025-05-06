import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ReportsDashboard from "@/components/reports/reports-dashboard"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getReports } from "@/services/report-service"

export const metadata: Metadata = {
  title: "Reports | Hospital Diagnosis Management System",
  description: "Manage clinical reports and documentation",
}

export default async function ReportsPage() {
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

  // Get reports including shared ones
  const { reports } = await getReports(user.id, userData.hospital_id as string, {
    includeShared: true,
  })

  return (
    <DashboardLayout>
      <ReportsDashboard reports={reports || []} currentUser={userData} />
    </DashboardLayout>
  )
}
