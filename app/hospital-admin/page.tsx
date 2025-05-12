import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getHospitalAdminStats } from "@/services/hospital-admin-service"
import AdminDashboard from "@/components/hospital-admin/admin-dashboard"
import DashboardLayout from "@/components/layout/dashboard-layout"

export const metadata: Metadata = {
  title: "Hospital Admin Dashboard | Hospital Diagnosis System",
  description: "Hospital administration dashboard for managing users and system settings",
}

export default async function HospitalAdminPage() {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user data and check if hospital admin
  const { data: userData } = await supabase
    .from("users")
    .select("is_hpadmin, hospital_id")
    .eq("id", session.user.id)
    .single()

  if (!userData || !userData.is_hpadmin) {
    redirect("/dashboard")
  }

  // Get hospital admin stats
  const stats = await getHospitalAdminStats(userData.hospital_id)

  return <DashboardLayout><AdminDashboard stats={stats} hospitalId={userData.hospital_id} userId={session.user.id} /></DashboardLayout>
}
