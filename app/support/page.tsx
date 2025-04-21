import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import SupportContent from "@/components/support/support-content"

export const metadata: Metadata = {
  title: "Support | Hospital Diagnosis Management System",
  description: "Get help and support for the Hospital Diagnosis Management System",
}

export default async function SupportPage() {
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
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Support Center</h1>
          <p className="text-sm text-gray-500">Get help and support for the Hospital Diagnosis Management System</p>
        </div>

        <SupportContent user={userData} />
      </div>
    </DashboardLayout>
  )
}
