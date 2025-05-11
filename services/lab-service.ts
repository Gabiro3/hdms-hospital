"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { uploadFile } from "@/lib/utils/file-upload"

type LabResult = Database["public"]["Tables"]["lab_results"]["Row"]
type LabResultInsert = Database["public"]["Tables"]["lab_results"]["Insert"]
type LabResultUpdate = Database["public"]["Tables"]["lab_results"]["Update"]

type LabRequest = Database["public"]["Tables"]["lab_requests"]["Row"]
type LabRequestInsert = Database["public"]["Tables"]["lab_requests"]["Insert"]
type LabRequestUpdate = Database["public"]["Tables"]["lab_requests"]["Update"]

/**
 * Get lab results for a hospital with optional filters
 */
export async function getLabResults(
  hospitalId: string,
  options: {
    patientId?: string
    status?: string
    type?: string
    createdBy?: string
    limit?: number
    includeShared?: boolean
    userId?: string
  } = {},
) {
  try {
    const supabase = createServerSupabaseClient()

    // Build base query
    let query = supabase
      .from("lab_results")
      .select(`
        *,
        creator:created_by(id, full_name, email, role),
        patients(id, name, patient_info),
        lab_requests(id, test_type, requested_by, status)
      `)
      .eq("hospital_id", hospitalId)

    // Apply filters
    if (options.patientId) {
      query = query.eq("patient_id", options.patientId)
    }

    if (options.status) {
      query = query.eq("status", options.status)
    }

    if (options.type) {
      query = query.eq("result_type", options.type)
    }

    if (options.createdBy) {
      query = query.eq("created_by", options.createdBy)
    }

    // Order by creation date, newest first
    query = query.order("created_at", { ascending: false })

    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit)
    }

    // Get results
    const { data: results, error } = await query

    if (error) throw error

    // If shared results are requested and userId is provided
    let sharedResults: any[] = []
    if (options.includeShared && options.userId) {
      // Get results shared with the user
      const { data: sharedData, error: sharedError } = await supabase
        .from("lab_result_shares")
        .select(`
          *,
          result:result_id(
            *,
            creator:created_by(id, full_name, email, role),
            patients(id, name, patient_info),
            lab_requests(id, test_type, requested_by, status)
          ),
          shared_by_user:shared_by(id, full_name, email, role)
        `)
        .eq("shared_with", options.userId)

      if (sharedError) {
        console.error("Error fetching shared lab results:", sharedError)
      } else if (sharedData) {
        // Transform to match the results format, and apply filters
        sharedResults = sharedData
          .map((share) => ({
            ...share.result,
            sharedBy: share.shared_by_user,
            sharedAt: share.created_at,
            isShared: true,
            shareId: share.id,
          }))
          .filter((result) => {
            let includeResult = true

            if (options.patientId && result.patient_id !== options.patientId) {
              includeResult = false
            }

            if (options.status && result.status !== options.status) {
              includeResult = false
            }

            if (options.type && result.result_type !== options.type) {
              includeResult = false
            }

            return includeResult
          })
      }
    }

    // Combine own results and shared results
    const allResults = [...(results || []).map((result) => ({ ...result, isOwn: true })), ...sharedResults]

    // Sort by created_at date
    allResults.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Apply limit to combined results if specified
    if (options.limit && allResults.length > options.limit) {
      return { results: allResults.slice(0, options.limit), error: null }
    }

    return { results: allResults, error: null }
  } catch (error) {
    console.error("Error fetching lab results:", error)
    return { results: null, error: "Failed to fetch lab results" }
  }
}

/**
 * Get a lab result by ID
 */
export async function getLabResultById(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the lab result with related data
    const { data, error } = await supabase
      .from("lab_results")
      .select(`
        *,
        creator:created_by(id, full_name, email, role),
        patients(id, name, patient_info),
        lab_requests(id, test_type, requested_by, status, notes, 
          requester:requested_by(id, full_name, email, role))
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // Get shares information
    const { data: shares, error: sharesError } = await supabase
      .from("lab_result_shares")
      .select(`
        *,
        shared_by_user:shared_by(id, full_name, email, role),
        shared_with_user:shared_with(id, full_name, email, role)
      `)
      .eq("result_id", id)

    if (sharesError) {
      console.error("Error fetching lab result shares:", sharesError)
    }

    return {
      result: data,
      shares: shares || [],
      error: null,
    }
  } catch (error) {
    console.error(`Error fetching lab result with ID ${id}:`, error)
    return {
      result: null,
      shares: [],
      error: "Failed to fetch lab result",
    }
  }
}

/**
 * Create a new lab result
 */
export async function createLabResult(result: LabResultInsert, files?: File[]) {
  try {
    const supabase = createServerSupabaseClient()

    // Generate ID if not provided
    if (!result.id) {
      result.id = uuidv4()
    }

    // Set timestamps
    result.created_at = new Date().toISOString()
    result.updated_at = new Date().toISOString()

    // Default status
    if (!result.status) {
      result.status = "completed"
    }

    // Upload files if provided
    if (files && files.length > 0) {
      const fileLinks: string[] = []

      for (const file of files) {
        // Create a path with hospital_id for isolation
        const path = `${result.hospital_id}/${result.id}/${file.name}`
        const { url, error: uploadError } = await uploadFile(file, "lab-results", path)

        if (uploadError) {
          console.error("Error uploading file:", uploadError)
          continue
        }

        if (url) {
          fileLinks.push(url)
        }
      }

      if (fileLinks.length > 0) {
        result.file_links = fileLinks
      }
    }

    // Insert the lab result
    const { data, error } = await supabase.from("lab_results").insert(result).select().single()

    if (error) throw error
    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: result.created_by,
        action: "create_lab_result",
        details: `Created lab result: ${result.result_type}`,
        resource_type: "lab_result",
        resource_id: data.id,
        metadata: {
          patient_id: result.patient_id,
          result_type: result.result_type,
          request_id: result.request_id,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging lab result creation activity:", e)
    }

    // If this is for a request, notify the requesting doctor
    if (result.request_id) {
      try {
        // Get request details
        const { data: requestDetails } = await supabase
          .from("lab_requests")
          .select("requested_by, test_type, patients(name)")
          .eq("id", result.request_id)
          .single()

        if (requestDetails && requestDetails.requested_by) {
          await supabase.from("notifications").insert({
            user_id: requestDetails.requested_by,
            title: "Lab Results Ready",
            message: `Results for the ${requestDetails.test_type} lab test for patient ${requestDetails.patients || "Unknown"} are now available.`,
            type: "lab_result",
            action_url: `/lab/${data.id}`,
            is_read: false,
            metadata: {
              result_id: data.id,
              result_type: result.result_type,
              patient_id: result.patient_id,
              request_id: result.request_id,
            },
            created_at: new Date().toISOString(),
          })
        }
      } catch (e) {
        console.error("Error creating lab result completion notification:", e)
      }
    }

    // If this result is for a request, update the request status
    if (result.request_id) {
      await supabase
        .from("lab_requests")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", result.request_id)
    }

    revalidatePath("/lab")
    if (result.patient_id) {
      revalidatePath(`/patients/${result.patient_id}`)
    }

    return { result: data, error: null }
  } catch (error) {
    console.error("Error creating lab result:", error)
    return { result: null, error: "Failed to create lab result" }
  }
}

/**
 * Update a lab result
 */
export async function updateLabResult(id: string, update: LabResultUpdate, newFiles?: File[]) {
  try {
    const supabase = createServerSupabaseClient()

    // Get current result to access hospital_id and existing file links
    const { data: currentResult, error: fetchError } = await supabase
      .from("lab_results")
      .select("hospital_id, file_links")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // Update timestamp
    update.updated_at = new Date().toISOString()

    // Upload new files if provided
    if (newFiles && newFiles.length > 0) {
      const existingLinks = currentResult.file_links || []
      const newLinks: string[] = []

      for (const file of newFiles) {
        // Create a path with hospital_id for isolation
        const path = `${currentResult.hospital_id}/${id}/${file.name}`
        const { url, error: uploadError } = await uploadFile(file, "lab_results", path)

        if (uploadError) {
          console.error("Error uploading file:", uploadError)
          continue
        }

        if (url) {
          newLinks.push(url)
        }
      }

      if (newLinks.length > 0) {
        update.file_links = [...existingLinks, ...newLinks]
      }
    }

    // Update the lab result
    const { data, error } = await supabase.from("lab_results").update(update).eq("id", id).select().single()

    if (error) throw error
    try {
      await supabase.from("user_activities").insert({
        user_id: update.created_by,
        action: "update_lab_result",
        details: `Updated lab result: ${update.result_type}`,
        resource_type: "lab_result",
        resource_id: data.id,
        metadata: {
          patient_id: update.patient_id,
          result_type: update.result_type,
          request_id: update.request_id,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging lab result activity:", e)
    }

    revalidatePath(`/lab/${id}`)
    revalidatePath("/lab")
    if (data.patient_id) {
      revalidatePath(`/patients/${data.patient_id}`)
    }

    return { result: data, error: null }
  } catch (error) {
    console.error(`Error updating lab result with ID ${id}:`, error)
    return { result: null, error: "Failed to update lab result" }
  }
}

/**
 * Delete a lab result
 */
export async function deleteLabResult(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get patient_id for path revalidation
    const { data: result } = await supabase.from("lab_results").select("patient_id, created_by, result_type, request_id").eq("id", id).single()

    // First delete shares
    const { error: sharesError } = await supabase.from("lab_result_shares").delete().eq("result_id", id)

    if (sharesError) {
      console.error("Error deleting lab result shares:", sharesError)
    }

    // Then delete the lab result
    const { error } = await supabase.from("lab_results").delete().eq("id", id)

    if (error) throw error
    try {
      await supabase.from("user_activities").insert({
        user_id: result?.created_by,
        action: "delete_lab_result",
        details: `Deleted lab result: ${result?.result_type}`,
        resource_type: "lab_result",
        resource_id: id,
        metadata: {},
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging lab result activity:", e)
    }

    revalidatePath("/lab")
    if (result?.patient_id) {
      revalidatePath(`/patients/${result.patient_id}`)
    }

    return { error: null }
  } catch (error) {
    console.error(`Error deleting lab result with ID ${id}:`, error)
    return { error: "Failed to delete lab result" }
  }
}

/**
 * Share a lab result with another user
 */
export async function shareLabResult(resultId: string, sharedBy: string, sharedWith: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if already shared
    const { data: existingShare } = await supabase
      .from("lab_result_shares")
      .select("id")
      .eq("result_id", resultId)
      .eq("shared_with", sharedWith)
      .maybeSingle()

    if (existingShare) {
      // Update existing share
      const { data, error } = await supabase
        .from("lab_result_shares")
        .update({
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
        user_id: sharedBy,
        action: "share_lab_result",
        details: `Shared lab result with another user`,
        resource_type: "lab_result",
        resource_id: resultId,
        metadata: {
          shared_with: sharedWith,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging lab result sharing activity:", e)
    }
    // Get lab result details for the notification
    const { data: resultDetails } = await supabase
      .from("lab_results")
      .select("result_type, patient_id, patients(name)")
      .eq("id", resultId)
      .single()

    // Create notification for the recipient
    if (resultDetails) {
      try {
        await supabase.from("notifications").insert({
          user_id: sharedWith,
          title: "Lab Result Shared With You",
          message: `A ${resultDetails.result_type} lab result for patient ${resultDetails.patients || "Unknown"} has been shared with you.`,
          type: "lab_result",
          action_url: `/lab/${resultId}`,
          is_read: false,
          metadata: {
            result_id: resultId,
            result_type: resultDetails.result_type,
            patient_id: resultDetails.patient_id,
            shared_by: sharedBy,
          },
          created_at: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Error creating lab result sharing notification:", e)
      }
    }

      revalidatePath(`/lab/${resultId}`)
      return { share: data, error: null }
    }

    // Create new share
    const { data, error } = await supabase
      .from("lab_result_shares")
      .insert({
        result_id: resultId,
        shared_by: sharedBy,
        shared_with: sharedWith,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/lab/${resultId}`)
    return { share: data, error: null }
  } catch (error) {
    console.error("Error sharing lab result:", error)
    return { share: null, error: "Failed to share lab result" }
  }
}

/**
 * Remove a lab result share
 */
export async function removeLabResultShare(shareId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get result ID for path revalidation
    const { data: share } = await supabase.from("lab_result_shares").select("result_id").eq("id", shareId).single()

    // Delete the share
    const { error } = await supabase.from("lab_result_shares").delete().eq("id", shareId)

    if (error) throw error

    if (share) {
      revalidatePath(`/lab/${share.result_id}`)
    }

    return { error: null }
  } catch (error) {
    console.error(`Error removing lab result share with ID ${shareId}:`, error)
    return { error: "Failed to remove lab result share" }
  }
}

/**
 * Mark a shared lab result as viewed
 */
export async function markLabResultAsViewed(shareId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("lab_result_shares")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", shareId)
      .select()
      .single()

    if (error) throw error

    return { share: data, error: null }
  } catch (error) {
    console.error(`Error marking lab result as viewed for share ${shareId}:`, error)
    return { share: null, error: "Failed to mark lab result as viewed" }
  }
}

/**
 * Create a new lab request
 */
export async function createLabRequest(request: LabRequestInsert) {
  try {
    const supabase = createServerSupabaseClient()

    // Generate ID if not provided
    if (!request.id) {
      request.id = uuidv4()
    }

    // Set timestamps
    request.created_at = new Date().toISOString()
    request.updated_at = new Date().toISOString()

    // Default status and priority
    if (!request.status) {
      request.status = "pending"
    }

    if (!request.priority) {
      request.priority = "normal"
    }

    // Insert the lab request
    const { data, error } = await supabase.from("lab_requests").insert(request).select().single()

    if (error) throw error
    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: request.requested_by,
        action: "create_lab_request",
        details: `Created lab request for test: ${request.test_type}`,
        resource_type: "lab_request",
        resource_id: data.id,
        metadata: {
          patient_id: request.patient_id,
          test_type: request.test_type,
          priority: request.priority,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging lab request activity:", e)
    }

    // Create notification for assigned lab technician if one is assigned
    if (request.assigned_to) {
      try {
        await supabase.from("notifications").insert({
          user_id: request.assigned_to,
          title: "New Lab Test Request",
          message: `You have been assigned a new ${request.test_type} lab test with ${request.priority} priority.`,
          type: "lab_result",
          action_url: `/lab/requests/${data.id}`,
          is_read: false,
          metadata: {
            request_id: data.id,
            test_type: request.test_type,
            priority: request.priority,
            patient_id: request.patient_id,
          },
          created_at: new Date().toISOString(),
        })
      } catch (e) {
        console.error("Error creating lab request notification:", e)
      }
    }

    revalidatePath("/lab")
    if (request.patient_id) {
      revalidatePath(`/patients/${request.patient_id}`)
    }

    return { request: data, error: null }
  } catch (error) {
    console.error("Error creating lab request:", error)
    return { request: null, error: "Failed to create lab request" }
  }
}

/**
 * Get lab requests for a hospital with optional filters
 */
export async function getLabRequests(
  hospitalId: string,
  options: {
    patientId?: string
    status?: string
    requestedBy?: string
    assignedTo?: string
    limit?: number
  } = {},
) {
  try {
    const supabase = createServerSupabaseClient()

    // Build base query
    let query = supabase
      .from("lab_requests")
      .select(`
        *,
        requester:requested_by(id, full_name, email, role),
        assignee:assigned_to(id, full_name, email, role),
        patients(id, name, patient_info)
      `)
      .eq("hospital_id", hospitalId)

    // Apply filters
    if (options.patientId) {
      query = query.eq("patient_id", options.patientId)
    }

    if (options.status) {
      query = query.eq("status", options.status)
    }

    if (options.requestedBy) {
      query = query.eq("requested_by", options.requestedBy)
    }

    if (options.assignedTo) {
      query = query.eq("assigned_to", options.assignedTo)
    }

    // Order by creation date, newest first
    query = query.order("created_at", { ascending: false })

    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit)
    }

    // Get requests
    const { data, error } = await query

    if (error) throw error

    return { requests: data, error: null }
  } catch (error) {
    console.error("Error fetching lab requests:", error)
    return { requests: null, error: "Failed to fetch lab requests" }
  }
}

/**
 * Get a lab request by ID
 */
export async function getLabRequestById(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the lab request with related data
    const { data, error } = await supabase
      .from("lab_requests")
      .select(`
        *,
        requester:requested_by(id, full_name, email, role),
        assignee:assigned_to(id, full_name, email, role),
        patients(id, name, patient_info)
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // Get associated lab results
    const { data: results, error: resultsError } = await supabase.from("lab_results").select("*").eq("request_id", id)

    if (resultsError) {
      console.error("Error fetching associated lab results:", resultsError)
    }

    return {
      request: data,
      results: results || [],
      error:  resultsError
    }
    
  } catch (error) {
    console.error(`Error fetching lab request with ID ${id}:`, error)
    return {
      request: null,
      results: [],
      error: "Failed to fetch lab request",
    }
  }
}

/**
 * Update a lab request
 */
export async function updateLabRequest(id: string, update: LabRequestUpdate) {
  try {
    const supabase = createServerSupabaseClient()

    // Update timestamp
    update.updated_at = new Date().toISOString()

    // Update the lab request
    const { data, error } = await supabase.from("lab_requests").update(update).eq("id", id).select().single()

    if (error) throw error

    revalidatePath(`/lab/requests/${id}`)
    revalidatePath("/lab")
    if (data.patient_id) {
      revalidatePath(`/patients/${data.patient_id}`)
    }

    return { request: data, error: null }
  } catch (error) {
    console.error(`Error updating lab request with ID ${id}:`, error)
    return { request: null, error: "Failed to update lab request" }
  }
}

/**
 * Delete a lab request
 */
export async function deleteLabRequest(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get patient_id for path revalidation
    const { data: request } = await supabase.from("lab_requests").select("patient_id").eq("id", id).single()

    // Delete the lab request
    const { error } = await supabase.from("lab_requests").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/lab")
    if (request?.patient_id) {
      revalidatePath(`/patients/${request.patient_id}`)
    }

    return { error: null }
  } catch (error) {
    console.error(`Error deleting lab request with ID ${id}:`, error)
    return { error: "Failed to delete lab request" }
  }
}

/**
 * Get lab technicians for a hospital
 */
export async function getLabTechnicians(hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, expertise")
      .eq("hospital_id", hospitalId)
      .eq("role", "LAB")
      .order("full_name")

    if (error) throw error

    return { technicians: data, error: null }
  } catch (error) {
    console.error("Error fetching lab technicians:", error)
    return { technicians: null, error: "Failed to fetch lab technicians" }
  }
}

/**
 * Get doctors for a hospital (for sharing)
 */
export async function getDoctors(hospitalId: string, currentUserId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, expertise")
      .eq("hospital_id", hospitalId)
      .eq("is_verified", true)
      .or(`role.eq.DOCTOR,role.is.null`)
      .neq("id", currentUserId) // Exclude the current user
      .order("full_name")

    if (error) throw error

    return { doctors: data, error: null }
  } catch (error) {
    console.error("Error fetching doctors:", error)
    return { doctors: null, error: "Failed to fetch doctors" }
  }
}
