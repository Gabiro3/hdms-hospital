import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import DiagnosesList from "@/components/diagnoses/diagnoses-list"

export const metadata: Metadata = {
  title: "Diagnoses | Hospital Diagnosis Management System",
  description: "Manage hospital diagnoses",
}

export default async function DiagnosesPage() {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user data
  const { data: userData } = await supabase.from("users").select("hospital_id").eq("id", session.user.id).single()

  if (!userData) {
    redirect("/login")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Diagnoses</h1>
        </div>

        <DiagnosesList hospitalId={userData.hospital_id} />
      </div>
    </DashboardLayout>
  )
}
