import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import RecordSharingDashboard from "@/components/hospital-admin/record-sharing-dashboard"

export default async function HospitalRecordsPage() {
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
  const { data: userData } = await supabase.from("users").select("hospital_id, role").eq("id", user.id).single()

  if (!userData) {
    redirect("/login")
  }

  // Check if user is admin
  if (userData.role !== "DOCTOR") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hospital Records Management</h1>
          <p className="text-muted-foreground">Manage record requests and sharing between hospitals</p>
        </div>

        <RecordSharingDashboard hospitalId={userData.hospital_id} />
      </div>
    </DashboardLayout>
  )
}
