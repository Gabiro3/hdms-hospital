"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

type Report = Database["public"]["Tables"]["clinical_reports"]["Row"]
type ReportInsert = Database["public"]["Tables"]["clinical_reports"]["Insert"]
type ReportUpdate = Database["public"]["Tables"]["clinical_reports"]["Update"]

type ReportShare = Database["public"]["Tables"]["report_shares"]["Row"]
type ReportShareInsert = Database["public"]["Tables"]["report_shares"]["Insert"]

/**
 * Create a new report
 */
export async function createReport(report: ReportInsert) {
  try {
    const supabase = createServerSupabaseClient()

    // Generate ID if not provided
    if (!report.id) {
      report.id = uuidv4()
    }

    // Set timestamps
    report.created_at = new Date().toISOString()
    report.updated_at = new Date().toISOString()

    // Default status
    if (!report.status) {
      report.status = "draft"
    }

    const { data, error } = await supabase.from("clinical_reports").insert(report).select().single()

    if (error) throw error
    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: report.created_by,
        action: "create_report",
        details: `Created new ${report.report_type} report: ${report.title}`,
        resource_type: "clinical_report",
        resource_id: data.id,
        metadata: {
          report_type: report.report_type,
          patient_id: report.patient_id,
          hospital_id: report.hospital_id,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging report creation activity:", e)
    }

    revalidatePath("/reports")
    return { report: data, error: null }
  } catch (error) {
    console.error("Error creating report:", error)
    return { report: null, error: "Failed to create report" }
  }
}

/**
 * Get a report by ID
 */
export async function getReportById(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the report with creator info
    const { data, error } = await supabase
      .from("clinical_reports")
      .select(`
        *,
        creator:created_by(id, full_name, email),
        hospitals(id, name),
        patients(id, name, patient_info)
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // Get shares information
    const { data: shares, error: sharesError } = await supabase
      .from("report_shares")
      .select(`
        *,
        shared_by_user:shared_by(id, full_name, email),
        shared_with_user:shared_with(id, full_name, email)
      `)
      .eq("report_id", id)

    if (sharesError) {
      console.error("Error fetching report shares:", sharesError)
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from("report_comments")
      .select(`
        *,
        users(id, full_name, email)
      `)
      .eq("report_id", id)
      .order("created_at", { ascending: true })

    if (commentsError) {
      console.error("Error fetching report comments:", commentsError)
    }

    return {
      report: data,
      shares: shares || [],
      comments: comments || [],
      error: null,
    }
  } catch (error) {
    console.error(`Error fetching report with ID ${id}:`, error)
    return {
      report: null,
      shares: [],
      comments: [],
      error: "Failed to fetch report",
    }
  }
}

/**
 * Get reports for a user
 */
export async function getReports(
  userId: string,
  hospitalId: string,
  options: {
    status?: string
    type?: string
    patientId?: string
    includeShared?: boolean
  } = {},
) {
  try {
    const supabase = createServerSupabaseClient()

    // Build base query
    let query = supabase
      .from("clinical_reports")
      .select(`
        *,
        creator:created_by(id, full_name, email),
        hospitals(id, name),
        patients(id, name)
      `)
      .eq("hospital_id", hospitalId)

    // Apply filters
    if (options.status) {
      query = query.eq("status", options.status)
    }

    if (options.type) {
      query = query.eq("report_type", options.type)
    }

    if (options.patientId) {
      query = query.eq("patient_id", options.patientId)
    }

    // First get reports created by the user
    const { data: ownReports, error } = await query.eq("created_by", userId).order("updated_at", { ascending: false })

    if (error) throw error

    // If shared reports are requested
    let sharedReports: any[] = []
    if (options.includeShared) {
      // Get reports shared with the user
      const { data: sharedData, error: sharedError } = await supabase
        .from("report_shares")
        .select(`
          *,
          report:report_id(
            *,
            creator:created_by(id, full_name, email),
            hospitals(id, name),
            patients(id, name)
          ),
          shared_by_user:shared_by(id, full_name, email)
        `)
        .eq("shared_with", userId)

      if (sharedError) {
        console.error("Error fetching shared reports:", sharedError)
      } else if (sharedData) {
        // Transform to match the reports format, and apply filters
        sharedReports = sharedData
          .map((share) => ({
            ...share.report,
            sharedBy: share.shared_by_user,
            sharedAt: share.created_at,
            canEdit: share.can_edit,
            isShared: true,
            shareId: share.id,
          }))
          .filter((report) => {
            let includeReport = true

            if (options.status && report.status !== options.status) {
              includeReport = false
            }

            if (options.type && report.report_type !== options.type) {
              includeReport = false
            }

            if (options.patientId && report.patient_id !== options.patientId) {
              includeReport = false
            }

            return includeReport
          })
      }
    }

    // Combine own reports and shared reports
    const allReports = [...(ownReports || []).map((report) => ({ ...report, isOwn: true })), ...sharedReports]

    // Sort by updated_at date
    allReports.sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

    return { reports: allReports, error: null }
  } catch (error) {
    console.error("Error fetching reports:", error)
    return { reports: null, error: "Failed to fetch reports" }
  }
}

/**
 * Update a report
 */
export async function updateReport(id: string, update: ReportUpdate) {
  try {
    const supabase = createServerSupabaseClient()

    // Update timestamp
    update.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("clinical_reports").update(update).eq("id", id).select().single()

    if (error) throw error
    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: data.created_by,
        action: "update_report",
        details: `Updated new ${data.report_type} report: ${data.title}`,
        resource_type: "clinical_report",
        resource_id: data.id,
        metadata: {
          report_type: data.report_type,
          patient_id: data.patient_id,
          hospital_id: data.hospital_id,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging report creation activity:", e)
    }

    revalidatePath(`/reports/${id}`)
    revalidatePath("/reports")

    return { report: data, error: null }
  } catch (error) {
    console.error(`Error updating report with ID ${id}:`, error)
    return { report: null, error: "Failed to update report" }
  }
}

/**
 * Delete a report
 */
export async function deleteReport(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    // First delete shares
    const { error: sharesError } = await supabase.from("report_shares").delete().eq("report_id", id)

    if (sharesError) {
      console.error("Error deleting report shares:", sharesError)
    }

    // Then delete comments
    const { error: commentsError } = await supabase.from("report_comments").delete().eq("report_id", id)

    if (commentsError) {
      console.error("Error deleting report comments:", commentsError)
    }

    // Finally delete the report
    const { error } = await supabase.from("clinical_reports").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/reports")
    return { error: null }
  } catch (error) {
    console.error(`Error deleting report with ID ${id}:`, error)
    return { error: "Failed to delete report" }
  }
}

/**
 * Share a report with another user
 */
export async function shareReport(shareData: ReportShareInsert) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if already shared
    const { data: existingShare } = await supabase
      .from("report_shares")
      .select("id")
      .eq("report_id", shareData.report_id)
      .eq("shared_with", shareData.shared_with)
      .maybeSingle()

    if (existingShare) {
      // Update existing share
      const { data, error } = await supabase
        .from("report_shares")
        .update({
          can_edit: shareData.can_edit,
          viewed_at: null,
          created_at: new Date().toISOString(),
        })
        .eq("id", existingShare.id)
        .select()
        .single()

      if (error) throw error
      // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: shareData.shared_by,
        action: "share_report",
        details: `Shared clinical report with another user`,
        resource_type: "clinical_report",
        resource_id: shareData.report_id,
        metadata: {
          shared_with: shareData.shared_with,
          can_edit: shareData.can_edit,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging report sharing activity:", e)
    }
    // Create notification for assigned lab technician if one is assigned
    if (shareData.shared_with) {
      try {
        await supabase.from("notifications").insert({
          user_id: shareData.shared_with,
          title: "Report Shared",
          message: `A report has been shared with you.`,
          type: "lab_result",
          action_url: `/reports/${data.id}`,
          is_read: false,
          metadata: {
          shared_with: shareData.shared_with,
          can_edit: shareData.can_edit,
        },
          created_at: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Error creating lab request notification:", e)
      }
    }

      revalidatePath(`/reports/${shareData.report_id}`)
      return { share: data, error: null }
    }

    // Create new share
    shareData.created_at = new Date().toISOString()

    const { data, error } = await supabase.from("report_shares").insert(shareData).select().single()

    if (error) throw error

    revalidatePath(`/reports/${shareData.report_id}`)
    return { share: data, error: null }
  } catch (error) {
    console.error("Error sharing report:", error)
    return { share: null, error: "Failed to share report" }
  }
}

/**
 * Remove a share
 */
export async function removeShare(shareId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get report ID for path revalidation
    const { data: share } = await supabase.from("report_shares").select("report_id").eq("id", shareId).single()

    // Delete the share
    const { error } = await supabase.from("report_shares").delete().eq("id", shareId)

    if (error) throw error

    if (share) {
      revalidatePath(`/reports/${share.report_id}`)
    }

    return { error: null }
  } catch (error) {
    console.error(`Error removing share with ID ${shareId}:`, error)
    return { error: "Failed to remove share" }
  }
}

/**
 * Mark a shared report as viewed
 */
export async function markReportAsViewed(shareId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("report_shares")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", shareId)
      .select()
      .single()

    if (error) throw error

    return { share: data, error: null }
  } catch (error) {
    console.error(`Error marking report as viewed for share ${shareId}:`, error)
    return { share: null, error: "Failed to mark report as viewed" }
  }
}

/**
 * Add a comment to a report
 */
export async function addReportComment(reportId: string, userId: string, comment: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("report_comments")
      .insert({
        report_id: reportId,
        user_id: userId,
        comment,
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        users(id, full_name, email)
      `)
      .single()

    if (error) throw error
    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: userId,
        action: "add_report_comment",
        details: `Added comment to report`,
        resource_type: "report_comment",
        resource_id: data.id,
        metadata: {
          report_id: reportId,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging report comment activity:", e)
    }

    // Get report details and owner
    const { data: reportDetails } = await supabase
      .from("clinical_reports")
      .select("created_by, title")
      .eq("id", reportId)
      .single()

    // Notify report owner if the commenter is not the owner
    if (reportDetails && reportDetails.created_by !== userId) {
      try {
        await supabase.from("notifications").insert({
          user_id: reportDetails.created_by,
          title: "New Comment on Your Report",
          message: `Someone has commented on your report: "${reportDetails.title}".`,
          type: "diagnosis",
          action_url: `/reports/${reportId}`,
          is_read: false,
          metadata: {
            report_id: reportId,
            comment_id: data.id,
            commenter_id: userId,
          },
          created_at: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Error creating report comment notification:", e)
      }
    }

    // Get all users who have commented on this report (except the current commenter)
    const { data: commenters } = await supabase
      .from("report_comments")
      .select("user_id")
      .eq("report_id", reportId)
      .neq("user_id", userId)

    // Notify other commenters
    if (commenters && commenters.length > 0) {
      try {
        const notifications = commenters.map((commenter) => ({
          user_id: commenter.user_id,
          title: "New Comment on a Report",
          message: `A new comment has been added to a report you've commented on.`,
          type: "diagnosis",
          action_url: `/reports/${reportId}`,
          is_read: false,
          metadata: {
            report_id: reportId,
            comment_id: data.id,
            commenter_id: userId,
          },
          created_at: new Date().toISOString(),
        }))

        await supabase.from("notifications").insert(notifications)
      } catch (e) {
        console.error("Error creating report comment notifications for other commenters:", e)
      }
    }

    revalidatePath(`/reports/${reportId}`)
    return { comment: data, error: null }
  } catch (error) {
    console.error(`Error adding comment to report ${reportId}:`, error)
    return { comment: null, error: "Failed to add comment" }
  }
}

/**
 * Get doctor colleagues for report sharing
 */
export async function getDoctorColleagues(userId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, expertise")
      .eq("hospital_id", hospitalId)
      .neq("id", userId) // Exclude the current user
      .order("full_name")

    if (error) throw error

    return { colleagues: data, error: null }
  } catch (error) {
    console.error("Error fetching doctor colleagues:", error)
    return { colleagues: null, error: "Failed to fetch colleagues" }
  }
}

/**
 * Get report templates
 */
export async function getReportTemplates(hospitalId: string, reportType?: string) {
  try {
    const supabase = createServerSupabaseClient()

    let query = supabase.from("clinical_reports").select("*").eq("hospital_id", hospitalId).eq("is_template", true)

    if (reportType) {
      query = query.eq("report_type", reportType)
    }

    const { data, error } = await query.order("title")

    if (error) throw error

    return { templates: data, error: null }
  } catch (error) {
    console.error("Error fetching report templates:", error)
    return { templates: null, error: "Failed to fetch templates" }
  }
}
