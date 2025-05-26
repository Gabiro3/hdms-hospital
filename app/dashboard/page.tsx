import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import RecentDiagnoses from "@/components/dashboard/recent-diagnoses"
import DynamicDashboard from "@/components/dashboard/dynamic-dashboard"
import DiagnosisTrendChart from "@/components/diagnoses/diagnosis-trend-chart"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Dashboard | Hospital Diagnosis Management System",
  description: "Hospital Diagnosis Management System Dashboard",
}

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user data
  const { data: userData } = await supabase.from("users").select("*, hospitals(*)").eq("id", user.id).single()

  if (!userData) {
    redirect("/login")
  }

  return (
    <DashboardLayout>
      <DynamicDashboard userData={userData} />
    </DashboardLayout>
  )
}