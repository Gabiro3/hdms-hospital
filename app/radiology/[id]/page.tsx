import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import RadiologyViewer from "@/components/radiology/radiology-viewer"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getRadiologyStudyById } from "@/services/radiology-service"

export const metadata: Metadata = {
  title: "Radiology Viewer | Hospital Diagnosis Management System",
  description: "Advanced radiology image viewer and reporting interface",
}

export default async function RadiologyViewerPage({
  params,
}: {
  params: { id: string }
}) {
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
  const { data: userData } = await supabase.from("users").select("hospital_id, id, full_name, role").eq("id", user.id).single()

  if (!userData) {
    redirect("/login")
  }

  // Get radiology study
  const { study, error } = await getRadiologyStudyById(params.id, userData.hospital_id)

  if (error || !study) {
    notFound()
  }

  return (
    <DashboardLayout>
      <RadiologyViewer study={study} currentUser={userData} />
    </DashboardLayout>
  )
}
