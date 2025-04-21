import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import CreateDiagnosisForm from "@/components/diagnoses/create-diagnosis-form"

export const metadata: Metadata = {
  title: "Create New Diagnosis | Hospital Diagnosis Management System",
  description: "Create a new diagnosis with AI analysis",
}

export default async function CreateDiagnosisPage() {
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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create New Diagnosis</h1>
          <p className="text-sm text-gray-500">
            Upload medical images for AI analysis and create a new diagnosis record
          </p>
        </div>

        <CreateDiagnosisForm user={userData} />
      </div>
    </DashboardLayout>
  )
}
