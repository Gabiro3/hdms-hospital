import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import CreateLabResultForm from "@/components/lab/create-lab-result-form"
import { getLabRequestById } from "@/services/lab-service"

export const metadata = {
  title: "Create Lab Result | Hospital Diagnosis Management System",
  description: "Create a new laboratory result",
}

export default async function CreateLabResultPage({
  searchParams,
}: {
  searchParams: { requestId?: string }
}) {
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
  

  const { data: userData } = await supabase.from("users").select("*, hospitals(*)").eq("id", user.id).single()

  if (!userData || userData.role !== "LAB") {
    redirect("/lab")
  }

  // If requestId is provided, get the request details
  let request = null
  if (searchParams.requestId) {
    const { request: requestData, error } = await getLabRequestById(searchParams.requestId)
    if (!error && requestData) {
      request = requestData
    }
  }

  return (
    <DashboardLayout>
      <CreateLabResultForm userId={user.id} hospitalId={userData.hospital_id} request={request} />
    </DashboardLayout>
  )
}
