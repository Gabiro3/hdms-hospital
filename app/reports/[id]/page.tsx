import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ReportView from "@/components/reports/report-view"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getReportById, markReportAsViewed } from "@/services/report-service"
import { getDoctorColleagues } from "@/services/report-service"

export const metadata: Metadata = {
  title: "Report Details | Hospital Diagnosis Management System",
  description: "View and manage clinical report details",
}

export default async function ReportViewPage({
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
  const { report, shares, comments, error } = await getReportById(params.id)

  if (error || !report) {
    notFound()
  }

  // Check if user has access to this report
  const isOwner = report.created_by === user.id
  const isShared = shares.some((share: any) => share.shared_with === user.id)

  if (!isOwner && !isShared) {
    // User doesn't have access to this report
    redirect("/reports")
  }

  // If this is a shared report that hasn't been viewed yet, mark it as viewed
  if (isShared && !isOwner) {
    const share = shares.find((share: any) => share.shared_with === user.id)
    if (share && !share.viewed_at) {
      await markReportAsViewed(share.id)
    }
  }

  // Get doctor colleagues for sharing
  const { colleagues } = await getDoctorColleagues(user.id, userData.hospital_id as string)

  return (
    <DashboardLayout>
      <ReportView
        report={report}
        shares={shares}
        comments={comments}
        currentUser={userData}
        colleagues={colleagues || []}
        isOwner={isOwner}
      />
    </DashboardLayout>
  )
}
