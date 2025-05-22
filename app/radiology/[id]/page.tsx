import { redirect, notFound } from "next/navigation"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getRadiologyStudyById } from "@/services/radiology-service"
import RadiologyViewerContainer from "@/components/radiology/radiology-viewer-container"

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
  const { data: userData } = await supabase.from("users").select("hospital_id, id").eq("id", user.id).single()

  if (!userData) {
    redirect("/login")
  }

  // Get radiology study
  const { study, error } = await getRadiologyStudyById(params.id, userData.hospital_id)

  if (error || !study) {
    notFound()
  }

  return <RadiologyViewerContainer initialStudy={study} currentUser={userData} />
}
