import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import LabDashboard from "@/components/lab/lab-dashboard"

export const metadata = {
  title: "Lab Results | Hospital Diagnosis Management System",
  description: "View and manage laboratory results and test requests",
}

export default async function LabPage() {
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

  return (
    <DashboardLayout>
      <LabDashboard userId={user.id} />
    </DashboardLayout>
  )
}
