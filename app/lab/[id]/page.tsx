import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import LabResultDetail from "@/components/lab/lab-result-detail"
import { getLabResultById } from "@/services/lab-service"

export const metadata = {
  title: "Lab Result Details | Hospital Diagnosis Management System",
  description: "View detailed laboratory result information",
}

export default async function LabResultDetailPage({ params }: { params: { id: string } }) {
  // Check authentication
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

  // Get lab result data
  const { result, shares, error } = await getLabResultById(params.id)

  if (error || !result) {
    redirect("/lab")
  }

  return (
    <DashboardLayout>
      <LabResultDetail result={result} shares={shares} userId={user.id} />
    </DashboardLayout>
  )
}
