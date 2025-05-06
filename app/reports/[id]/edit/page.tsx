import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ReportEditForm from "@/components/reports/report-edit-form"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getReportById } from "@/services/report-service"

export const metadata: Metadata = {
  title: "Edit Report | Hospital Diagnosis Management System",
  description: "Edit clinical report details",
}

export default async function ReportEditPage({
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
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!userData) {
    redirect("/login")
  }

  // Get report data
  const { report, shares, error } = await getReportById(params.id)

  if (error || !report) {
    notFound()
  }

  // Check if user has permission to edit this report
  const isOwner = report.created_by === user.id
  const canEdit = shares.some((share: any) => share.shared_with === user.id && share.can_edit)

  if (!isOwner && !canEdit) {
    // User doesn't have permission to edit this report
    redirect(`/reports/${params.id}`)
  }

  return (
    <DashboardLayout>
      <ReportEditForm report={report} currentUser={userData} />
    </DashboardLayout>
  )
}
