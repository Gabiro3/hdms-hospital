import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import DiagnosisView from "@/components/diagnoses/diagnosis-view"

export const metadata: Metadata = {
  title: "View Diagnosis | Hospital Diagnosis Management System",
  description: "View diagnosis details and AI analysis results",
}

export default async function ViewDiagnosisPage(context: {
  params: { id: string }
}) {
  const { params } = context
  const id = params?.id

  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("hospital_id")
    .eq("id", session.user.id)
    .single()

  if (!userData) {
    redirect("/login")
  }

  const { data: diagnosis } = await supabase
    .from("diagnoses")
    .select(`
      *,
      users (
        id,
        full_name,
        email
      ),
      hospitals (
        id,
        name,
        code
      )
    `)
    .eq("id", id)
    .single()

  if (!diagnosis) {
    notFound()
  }

  if (diagnosis.hospital_id !== userData.hospital_id) {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout>
      <DiagnosisView diagnosis={diagnosis} />
    </DashboardLayout>
  )
}

