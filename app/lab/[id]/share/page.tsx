import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import LabResultSharing from "@/components/lab/lab-result-sharing"
import { getLabResultById } from "@/services/lab-service"

export const metadata = {
  title: "Share Lab Result | Hospital Diagnosis Management System",
  description: "Share laboratory result with other doctors",
}

export default async function ShareLabResultPage({ params }: { params: { id: string } }) {
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

  // Get lab result data
  const { result, shares, error } = await getLabResultById(params.id)

  if (error || !result) {
    redirect("/lab")
  }

  return (
    <DashboardLayout>
      <LabResultSharing result={result} existingShares={shares} userId={user.id} />
    </DashboardLayout>
  )
}
