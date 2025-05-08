import type { Metadata } from "next"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { cookies } from "next/headers"
import SharedStudiesDashboard from "@/components/radiology/shared-studies-dashboard"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getSharedRadiologyStudies, getRadiologyRequests } from "@/services/radiology-service"

export const metadata: Metadata = {
  title: "Shared Radiology Studies | Hospital Diagnosis Management System",
  description: "View radiology studies shared with you and request new studies",
}

export default async function SharedRadiologyPage() {
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

  // Get studies shared with the user
  const { studies: sharedStudies, error: sharedError } = await getSharedRadiologyStudies(user.id)

  if (sharedError) {
    console.error("Error fetching shared studies:", sharedError)
  }

  // Get study requests made by the user
  const { requests, error: requestsError } = await getRadiologyRequests({
    hospitalId: userData.hospital_id,
    requestedBy: user.id,
  })

  if (requestsError) {
    console.error("Error fetching study requests:", requestsError)
  }

  return (
    <DashboardLayout>
      <SharedStudiesDashboard
        sharedStudies={sharedStudies || []}
        studyRequests={requests || []}
        currentUser={userData}
      />
    </DashboardLayout>
  )
}
