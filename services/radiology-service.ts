"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

type RadiologyStudy = Database["public"]["Tables"]["radiology_studies"]["Row"]
type RadiologyStudyInsert = Database["public"]["Tables"]["radiology_studies"]["Insert"]
type RadiologyStudyUpdate = Database["public"]["Tables"]["radiology_studies"]["Update"]

type StudyShare = Database["public"]["Tables"]["radiology_study_shares"]["Row"]
type StudyShareInsert = Database["public"]["Tables"]["radiology_study_shares"]["Insert"]

/**
 * Get recent radiology studies for a hospital
 */
export async function getRecentRadiologyStudies(hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("radiology_studies")
      .select(`
        *,
        creator:created_by(id, full_name, email, expertise),
        patients(id, name, patient_info)
      `)
      .eq("hospital_id", hospitalId)
      .order("study_date", { ascending: false })
      .limit(50)

    if (error) throw error

    return { studies: data, error: null }
  } catch (error) {
    console.error("Error fetching radiology studies:", error)
    return { studies: null, error: "Failed to fetch radiology studies" }
  }
}

/**
 * Get a radiology study by ID
 */
export async function getRadiologyStudyById(id: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("radiology_studies")
      .select(`
        *,
        creator:created_by(id, full_name, email, expertise),
        patients(id, name, patient_info)
      `)
      .eq("id", id)
      .eq("hospital_id", hospitalId)
      .single()

    if (error) throw error

    return { study: data, error: null }
  } catch (error) {
    console.error(`Error fetching radiology study with ID ${id}:`, error)
    return { study: null, error: "Failed to fetch radiology study" }
  }
}

/**
 * Create a new radiology study
 */
export async function createRadiologyStudy(studyData: any) {
  try {
    const supabase = createServerSupabaseClient()

    // Generate a unique ID if not provided
    if (!studyData.id) {
      studyData.id = uuidv4()
    }

    // Set report status to pending by default
    if (!studyData.report_status) {
      studyData.report_status = "pending"
    }

    // Insert the study
    const { data, error } = await supabase
      .from("radiology_studies")
      .insert({
        id: studyData.id,
        patient_id: studyData.patient_id,
        patient_name: studyData.patient_name,
        accession_number: studyData.accession_number,
        study_description: studyData.study_description,
        study_date: studyData.study_date.toISOString(),
        modality: studyData.modality,
        referring_physician: studyData.referring_physician,
        clinical_information: studyData.clinical_information,
        created_by: studyData.created_by,
        hospital_id: studyData.hospital_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: studyData.created_by,
        action: "create_radiology_study",
        details: `Created new ${studyData.modality} radiology study: ${studyData.study_description}`,
        resource_type: "radiology_study",
        resource_id: data.id,
        metadata: {
          patient_id: studyData.patient_id,
          modality: studyData.modality,
          study_date: studyData.study_date,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging radiology study creation activity:", e)
    }

    revalidatePath("/radiology")
    return { study: data, error: null }
  } catch (error) {
    console.error("Error creating radiology study:", error)
    return { study: null, error: "Failed to create radiology study" }
  }
}

/**
 * Update a radiology study
 */
export async function updateRadiologyStudy(id: string, updateData: Partial<RadiologyStudyUpdate>) {
  try {
    const supabase = createServerSupabaseClient()

    // Update the study
    const { data, error } = await supabase
      .from("radiology_studies")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: data.created_by,
        action: "update_radiology_study",
        details: `Update new ${data.modality} radiology study: ${data.study_description}`,
        resource_type: "radiology_study",
        resource_id: data.id,
        metadata: {
          patient_id: data.patient_id,
          modality: data.modality,
          study_date: data.study_date,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging radiology study creation activity:", e)
    }

    revalidatePath(`/radiology/${id}`)
    revalidatePath("/radiology")
    return { study: data, error: null }
  } catch (error) {
    console.error(`Error updating radiology study with ID ${id}:`, error)
    return { study: null, error: "Failed to update radiology study" }
  }
}

/**
 * Upload an image for a radiology study
 */
export async function uploadRadiologyImage(file: File, studyId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Upload the file to storage
    const fileName = `${studyId}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("radiology-images")
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Get the public URL
    const { data: urlData } = await supabase.storage.from("radiology-images").getPublicUrl(fileName)

    // Get current image count and update
    const { data: study } = await supabase
      .from("radiology_studies")
      .select("image_urls, image_count")
      .eq("id", studyId)
      .single()

    const imageUrls = study?.image_urls || []
    imageUrls.push(urlData.publicUrl)

    const imageCount = (study?.image_count || 0) + 1

    // Update the study with the new image info
    const { data, error } = await supabase
      .from("radiology_studies")
      .update({
        image_urls: imageUrls,
        image_count: imageCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", studyId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/radiology/${studyId}`)
    return { imageUrl: urlData.publicUrl, error: null }
  } catch (error) {
    console.error(`Error uploading image for study ${studyId}:`, error)
    return { imageUrl: null, error: "Failed to upload image" }
  }
}


/**
 * Get doctor colleagues for a hospital
 */
export async function getDoctorColleagues(userId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()
    console.log(userId, hospitalId)

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, expertise, role")
      .eq("hospital_id", hospitalId)
      .neq("id", userId) // Exclude the current user
      .in("role", ["LAB", "IMAGING", "DOCTOR"]) // Only include doctors and radiologists
      .order("full_name")

    if (error) throw error

    return { colleagues: data, error: null }
  } catch (error) {
    console.error("Error fetching doctor colleagues:", error)
    return { colleagues: null, error: "Failed to fetch colleagues" }
  }
}

/**
 * Save radiology report
 */
export async function saveRadiologyReport(
  studyId: string,
  reportData: {
    findings: string
    impression: string
    recommendations: string
    status: string
  },
) {
  try {
    const supabase = createServerSupabaseClient()

    // Update the study with report data
    const { data, error } = await supabase
      .from("radiology_studies")
      .update({
        report: {
          findings: reportData.findings,
          impression: reportData.impression,
          recommendations: reportData.recommendations,
          last_updated: new Date().toISOString(),
        },
        report_status: reportData.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", studyId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/radiology/${studyId}`)
    return { report: data.report, error: null }
  } catch (error) {
    console.error(`Error saving report for study ${studyId}:`, error)
    return { report: null, error: "Failed to save report" }
  }
}

  
  /**
   * Share a radiology study with another doctor
   */
  export async function shareRadiologyStudy(shareData: {
    study_id: string
    shared_by: string
    shared_with: string
    can_edit: boolean
    message: string | null
    notify_by_email: boolean
  }) {
    try {
      const supabase = createServerSupabaseClient()
  
      // Check if already shared
      const { data: existingShare } = await supabase
        .from("radiology_study_shares")
        .select("id")
        .eq("study_id", shareData.study_id)
        .eq("shared_with", shareData.shared_with)
        .maybeSingle()
  
      if (existingShare) {
        // Update existing share
        const { data, error } = await supabase
          .from("radiology_study_shares")
          .update({
            can_edit: shareData.can_edit,
            message: shareData.message,
            viewed_at: null,
            created_at: new Date().toISOString(),
          })
          .eq("id", existingShare.id)
          .select()
          .single()
  
        if (error) throw error
  
        // Send email notification if requested
        if (shareData.notify_by_email) {
          // In a real app, implement email notification here
        }
  
        revalidatePath(`/radiology/${shareData.study_id}`)
        revalidatePath("/radiology/shared")
        return { share: data, error: null }
      }
  
      // Create new share
      const { data, error } = await supabase
        .from("radiology_study_shares")
        .insert({
          study_id: shareData.study_id,
          shared_by: shareData.shared_by,
          shared_with: shareData.shared_with,
          can_edit: shareData.can_edit,
          message: shareData.message,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()
  
      if (error) throw error
      // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: shareData.shared_by,
        action: "share_radiology_study",
        details: `Shared radiology study with another user`,
        resource_type: "radiology_study",
        resource_id: shareData.study_id,
        metadata: {
          shared_with: shareData.shared_with,
          can_edit: shareData.can_edit,
          message: shareData.message,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging radiology study sharing activity:", e)
    }

    // Get study details for the notification
    const { data: studyDetails } = await supabase
      .from("radiology_studies")
      .select("modality, study_description, patient_name")
      .eq("id", shareData.study_id)
      .single()

    // Create notification for the recipient
    if (studyDetails) {
      try {
        await supabase.from("notifications").insert({
          user_id: shareData.shared_with,
          title: "Radiology Study Shared With You",
          message: `A ${studyDetails.modality} study for patient ${studyDetails.patient_name} has been shared with you${shareData.message ? ": " + shareData.message : ""}.`,
          type: "diagnosis",
          action_url: `/radiology/${shareData.study_id}`,
          is_read: false,
          metadata: {
            study_id: shareData.study_id,
            modality: studyDetails.modality,
            shared_by: shareData.shared_by,
            can_edit: shareData.can_edit,
          },
          created_at: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Error creating radiology study sharing notification:", e)
      }
    }
      revalidatePath(`/radiology/${shareData.study_id}`)
      revalidatePath("/radiology/shared")
      return { share: data, error: null }
    } catch (error) {
      console.error("Error sharing radiology study:", error)
      return { share: null, error: "Failed to share radiology study" }
    }
  }
  
  /**
   * Mark a shared radiology study as viewed
   */
  export async function markRadiologyStudyAsViewed(shareId: string) {
    try {
      const supabase = createServerSupabaseClient()
  
      const { data, error } = await supabase
        .from("radiology_study_shares")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", shareId)
        .select()
        .single()
  
      if (error) throw error
  
      revalidatePath("/radiology/shared")
      return { share: data, error: null }
    } catch (error) {
      console.error(`Error marking study as viewed for share ${shareId}:`, error)
      return { share: null, error: "Failed to mark study as viewed" }
    }
  }
  
  /**
   * Get studies shared with a user
   */
  export async function getSharedRadiologyStudies(userId: string) {
    try {
      const supabase = createServerSupabaseClient()
  
      const { data, error } = await supabase
        .from("radiology_study_shares")
        .select(`
          *,
          study:study_id(
            *,
            creator:created_by(id, full_name, email),
            patients(id, name)
          ),
          shared_by_user:shared_by(id, full_name, email)
        `)
        .eq("shared_with", userId)
        .order("created_at", { ascending: false })
  
      if (error) throw error
  
      // Transform to match the radiology studies format
      const studies = data.map((share) => ({
        ...share.study,
        sharedBy: share.shared_by_user,
        sharedAt: share.created_at,
        canEdit: share.can_edit,
        isShared: true,
        shareId: share.id,
        viewed: !!share.viewed_at,
        message: share.message,
      }))
  
      return { studies, error: null }
    } catch (error) {
      console.error("Error fetching shared radiology studies:", error)
      return { studies: null, error: "Failed to fetch shared studies" }
    }
  }
  
  /**
   * Create a radiology request
   */
  export async function createRadiologyRequest(requestData: {
    patient_id: string
    hospital_id: string
    requested_by: string
    study_type: string
    clinical_details: string
    priority: string
    scheduled_date: string | null
    additional_notes: string | null
  }) {
    try {
      const supabase = createServerSupabaseClient()
  
      // Get patient name for reference
      const { data: patient } = await supabase.from("patients").select("name").eq("id", requestData.patient_id).single()
  
      // Insert the request
      const { data, error } = await supabase
        .from("radiology_requests")
        .insert({
          id: uuidv4(),
          patient_id: requestData.patient_id,
          patient_name: patient?.name || "Unknown",
          hospital_id: requestData.hospital_id,
          requested_by: requestData.requested_by,
          study_type: requestData.study_type,
          clinical_details: requestData.clinical_details,
          priority: requestData.priority,
          scheduled_date: requestData.scheduled_date,
          additional_notes: requestData.additional_notes,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
  
      if (error) throw error
      try {
      await supabase.from("user_activities").insert({
        user_id: data.shared_by,
        action: "request_radiology_study",
        details: `Requested radiology study ${data.study_type} with another user`,
        resource_type: "radiology_study",
        resource_id: data.study_id,
        metadata: {
          shared_with: data.shared_with,
          can_edit: data.can_edit,
          message: data.message,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging radiology study sharing activity:", e)
    }
  
      revalidatePath("/radiology/shared")
      return { request: data, error: null }
    } catch (error) {
      console.error("Error creating radiology request:", error)
      return { request: null, error: "Failed to create radiology request" }
    }
  }
  
  /**
   * Get radiology requests
   */
  export async function getRadiologyRequests(options: {
    hospitalId: string
    requestedBy?: string
    assignedTo?: string
    patientId?: string
    status?: string
  }) {
    try {
      const supabase = createServerSupabaseClient()
  
      // Build base query
      let query = supabase
        .from("radiology_requests")
        .select(`
          *,
          requester:requested_by(id, full_name, email, role),
          assignee:assigned_to(id, full_name, email, role),
          patients(id, name, patient_info)
        `)
        .eq("hospital_id", options.hospitalId)
  
      // Apply filters
      if (options.requestedBy) {
        query = query.eq("requested_by", options.requestedBy)
      }
  
      if (options.assignedTo) {
        query = query.eq("assigned_to", options.assignedTo)
      }
  
      if (options.patientId) {
        query = query.eq("patient_id", options.patientId)
      }
  
      if (options.status) {
        query = query.eq("status", options.status)
      }
  
      // Order by creation date, newest first
      query = query.order("created_at", { ascending: false })
  
      const { data, error } = await query
  
      if (error) throw error
  
      // Process data to add assigned_to_name for easier display
      const processedData = data.map((request) => ({
        ...request,
        assigned_to_name: request.assignee?.full_name || null,
      }))
  
      return { requests: processedData, error: null }
    } catch (error) {
      console.error("Error fetching radiology requests:", error)
      return { requests: null, error: "Failed to fetch radiology requests" }
    }
  }
  
  /**
   * Cancel a radiology request
   */
  export async function cancelRadiologyRequest(requestId: string) {
    try {
      const supabase = createServerSupabaseClient()
  
      const { data, error } = await supabase
        .from("radiology_requests")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single()
  
      if (error) throw error
  
      revalidatePath("/radiology/shared")
      return { request: data, error: null }
    } catch (error) {
      console.error(`Error cancelling radiology request ${requestId}:`, error)
      return { request: null, error: "Failed to cancel radiology request" }
    }
  }
  
  /**
   * Approve a radiology request
   */
  export async function approveRadiologyRequest(requestId: string, radiologistId: string, scheduledDate?: string) {
    try {
      const supabase = createServerSupabaseClient()
  
      const { data, error } = await supabase
        .from("radiology_requests")
        .update({
          status: "approved",
          assigned_to: radiologistId,
          scheduled_date: scheduledDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single()
  
      if (error) throw error
  
      revalidatePath("/radiology/requests")
      revalidatePath("/radiology/shared")
      return { request: data, error: null }
    } catch (error) {
      console.error(`Error approving radiology request ${requestId}:`, error)
      return { request: null, error: "Failed to approve radiology request" }
    }
  }
  
  /**
   * Reject a radiology request
   */
  export async function rejectRadiologyRequest(requestId: string, rejectionReason: string) {
    try {
      const supabase = createServerSupabaseClient()
  
      const { data, error } = await supabase
        .from("radiology_requests")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single()
  
      if (error) throw error
  
      revalidatePath("/radiology/requests")
      revalidatePath("/radiology/shared")
      return { request: data, error: null }
    } catch (error) {
      console.error(`Error rejecting radiology request ${requestId}:`, error)
      return { request: null, error: "Failed to reject radiology request" }
    }
  }
  
  /**
   * Complete a radiology request by linking it to a study
   */
  export async function completeRadiologyRequest(requestId: string, studyId: string) {
    try {
      const supabase = createServerSupabaseClient()
  
      const { data, error } = await supabase
        .from("radiology_requests")
        .update({
          status: "completed",
          study_id: studyId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single()
  
      if (error) throw error
      try {
      await supabase.from("user_activities").insert({
        user_id: data.shared_by,
        action: "complete_radiology_request",
        details: `Marked radiology request as completed`,
        resource_type: "radiology_request",
        resource_id: data.study_id,
        metadata: {
          shared_with: data.shared_with,
          can_edit: data.can_edit,
          message: data.message,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging radiology study sharing activity:", e)
    }
  
      revalidatePath("/radiology/requests")
      revalidatePath("/radiology/shared")
      return { request: data, error: null }
    } catch (error) {
      console.error(`Error completing radiology request ${requestId}:`, error)
      return { request: null, error: "Failed to complete radiology request" }
    }
  }