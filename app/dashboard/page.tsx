import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import RecentDiagnoses from "@/components/dashboard/recent-diagnoses"
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Hospital Overview</h1>
            <p className="text-sm text-gray-500">Welcome to {userData.hospitals?.name || "your hospital"} dashboard</p>
          </div>
          <Link href="/diagnoses/new">
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> New Diagnosis
            </Button>
          </Link>
        </div>

        <DashboardStats hospitalId={userData.hospital_id} />


        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RecentDiagnoses hospitalId={userData.hospital_id} />

          <div className="md:col-span-1 lg:col-span-2">
            <div className="rounded-lg border bg-card p-6 shadow">
              <h3 className="mb-4 text-lg font-medium">Hospital Activity</h3>
              {/* Add the diagnosis trend chart */}
        <DiagnosisTrendChart hospitalId={userData.hospital_id} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}