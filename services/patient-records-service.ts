"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Create a record request
 */
export async function createRecordRequest(requestData: any) {
  try {
    const supabase = createServerSupabaseClient()

    // Generate a unique ID for the request
    requestData.id = requestData.id || crypto.randomUUID()

    // Insert the request
    const { data, error } = await supabase.from("record_requests").insert(requestData).select().single()

    if (error) throw error

    // Get hospital names for notification
    const { data: requestingHospital } = await supabase
      .from("hospitals")
      .select("name")
      .eq("id", requestData.requesting_hospital_id)
      .single()

    const { data: requestedHospital } = await supabase
      .from("hospitals")
      .select("name")
      .eq("id", requestData.requested_hospital_id)
      .single()

    // Create notification for hospital admins of the requested hospital
    try {
      // Get all admin users of the requested hospital
      const { data: adminUsers } = await supabase
        .from("users")
        .select("id")
        .eq("hospital_id", requestData.requested_hospital_id)
        .eq("is_admin", true)

      if (adminUsers && adminUsers.length > 0) {
        // Create notifications for each admin
        const notifications = adminUsers.map((admin) => ({
          user_id: admin.id,
          title: "New Patient Records Request",
          message: `${requestingHospital?.name || "Another hospital"} has requested records for patient ${
            requestData.patient_name
          }.`,
          type: "record_request",
          action_url: `/hospital-admin/records`,
          is_read: false,
          metadata: {
            request_id: data.id,
            patient_id: requestData.patient_id,
            patient_name: requestData.patient_name,
            requesting_hospital_id: requestData.requesting_hospital_id,
            requesting_hospital_name: requestingHospital?.name,
            is_urgent: requestData.is_urgent,
          },
          created_at: new Date().toISOString(),
        }))

        await supabase.from("notifications").insert(notifications)
      }
    } catch (e) {
      console.error("Error creating record request notifications:", e)
    }

    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: requestData.requesting_user_id,
        action: "create_record_request",
        details: `Requested ${requestData.record_type} records for patient ${requestData.patient_name} from ${
          requestedHospital?.name || "another hospital"
        }`,
        resource_type: "record_request",
        resource_id: data.id,
        metadata: {
          patient_id: requestData.patient_id,
          patient_name: requestData.patient_name,
          requesting_hospital_id: requestData.requesting_hospital_id,
          requested_hospital_id: requestData.requested_hospital_id,
          record_type: requestData.record_type,
          is_urgent: requestData.is_urgent,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging record request activity:", e)
    }

    return { request: data, error: null }
  } catch (error) {
    console.error("Error creating record request:", error)
    return { request: null, error: "Failed to create record request" }
  }
}

/**
 * Get pending record requests for a patient
 */
export async function getPendingRecordRequests(patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all pending requests for this patient
    const { data: requests, error } = await supabase
      .from("record_requests")
      .select(`
        *,
        requesting_hospital:requesting_hospital_id(id, name),
        requested_hospital:requested_hospital_id(id, name)
      `)
      .eq("patient_id", patientId)
      .eq("requested_hospital_id", hospitalId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Format the requests with hospital names
    const formattedRequests = requests.map((request) => ({
      ...request,
      requesting_hospital_name: request.requesting_hospital?.name,
      requested_hospital_name: request.requested_hospital?.name,
    }))

    return { requests: formattedRequests, error: null }
  } catch (error) {
    console.error(`Error fetching pending record requests for patient ${patientId}:`, error)
    return { requests: null, error: "Failed to fetch pending record requests" }
  }
}
/**
 * Get pending record requests for a patient
 */
export async function getPatientRecordRequests(patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all pending requests for this patient
    const { data: requests, error } = await supabase
      .from("record_requests")
      .select(`
        *,
        requesting_hospital:requesting_hospital_id(id, name),
        requested_hospital:requested_hospital_id(id, name)
      `)
      .eq("patient_id", patientId)
      .eq("requesting_hospital_id", hospitalId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Format the requests with hospital names
    const formattedRequests = requests.map((request) => ({
      ...request,
      requesting_hospital_name: request.requesting_hospital?.name,
      requested_hospital_name: request.requested_hospital?.name,
    }))

    return { requests: formattedRequests, error: null }
  } catch (error) {
    console.error(`Error fetching pending record requests for patient ${patientId}:`, error)
    return { requests: null, error: "Failed to fetch pending record requests" }
  }
}

/**
 * Get shared records for a patient
 */
export async function getSharedRecords(patientId: string | null, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Build query
    let query = supabase
      .from("shared_records")
      .select(`
        *,
        source_hospital:source_hospital_id(id, name),
        target_hospital:target_hospital_id(id, name)
      `)
      .eq("target_hospital_id", hospitalId)

    // Add patient filter if provided
    if (patientId) {
      query = query.eq("patient_id", patientId)
    }

    // Execute query
    const { data: records, error } = await query.order("shared_at", { ascending: false })

    if (error) throw error

    // Format the records with hospital names
    const formattedRecords = records.map((record) => ({
      ...record,
      source_hospital_name: record.source_hospital?.name,
      target_hospital_name: record.target_hospital?.name,
    }))

    return { records: formattedRecords, error: null }
  } catch (error) {
    console.error(`Error fetching shared records:`, error)
    return { records: null, error: "Failed to fetch shared records" }
  }
}

/**
 * Update record request status
 */
export async function updateRecordRequestStatus(requestId: string, status: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Update the request status
    const { error } = await supabase
      .from("record_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId)

    if (error) throw error

    // Get the request details for notifications
    const { data: request } = await supabase
      .from("record_requests")
      .select(`
        *,
        requesting_hospital:requesting_hospital_id(id, name),
        requested_hospital:requested_hospital_id(id, name)
      `)
      .eq("id", requestId)
      .single()

    // Create notification for the requesting user
    try {
      if (request && request.requesting_user_id) {
        await supabase.from("notifications").insert({
          user_id: request.requesting_user_id,
          title: `Record Request ${status === "approved" ? "Approved" : "Rejected"}`,
          message: `Your request for ${request.patient_name}'s records from ${
            request.requested_hospital?.name || "another hospital"
          } has been ${status}.`,
          type: "record_request",
          action_url: `/patients/${request.patient_id}/records`,
          is_read: false,
          metadata: {
            request_id: requestId,
            patient_id: request.patient_id,
            patient_name: request.patient_name,
            status,
          },
          created_at: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.error("Error creating record request notification:", e)
    }

    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: "system",
        action: `${status}_record_request`,
        details: `${status === "approved" ? "Approved" : "Rejected"} record request for patient ${
          request?.patient_name || "unknown"
        }`,
        resource_type: "record_request",
        resource_id: requestId,
        metadata: {
          request_id: requestId,
          patient_id: request?.patient_id,
          patient_name: request?.patient_name,
          status,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging record request activity:", e)
    }

    return { success: true, error: null }
  } catch (error) {
    console.error(`Error updating record request status:`, error)
    return { success: false, error: "Failed to update record request status" }
  }
}

/**
 * Get incoming record requests for a hospital
 */
export async function getIncomingRecordRequests(hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all requests for this hospital
    const { data: requests, error } = await supabase
      .from("record_requests")
      .select(`
        *,
        requesting_hospital:requesting_hospital_id(id, name),
        requested_hospital:requested_hospital_id(id, name)
      `)
      .eq("requested_hospital_id", hospitalId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Format the requests with hospital names
    const formattedRequests = requests.map((request) => ({
      ...request,
      requesting_hospital_name: request.requesting_hospital?.name,
      requested_hospital_name: request.requested_hospital?.name,
    }))

    return { requests: formattedRequests, error: null }
  } catch (error) {
    console.error(`Error fetching incoming record requests:`, error)
    return { requests: null, error: "Failed to fetch incoming record requests" }
  }
}

/**
 * Get outgoing record requests for a hospital
 */
export async function getOutgoingRecordRequests(hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all requests from this hospital
    const { data: requests, error } = await supabase
      .from("record_requests")
      .select(`
        *,
        requesting_hospital:requesting_hospital_id(id, name),
        requested_hospital:requested_hospital_id(id, name)
      `)
      .eq("requesting_hospital_id", hospitalId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Format the requests with hospital names
    const formattedRequests = requests.map((request) => ({
      ...request,
      requesting_hospital_name: request.requesting_hospital?.name,
      requested_hospital_name: request.requested_hospital?.name,
    }))

    return { requests: formattedRequests, error: null }
  } catch (error) {
    console.error(`Error fetching outgoing record requests:`, error)
    return { requests: null, error: "Failed to fetch outgoing record requests" }
  }
}

/**
 * Get patient visits for sharing
 */
export async function getPatientVisits(patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all visits for this patient
    const { data: visits, error } = await supabase
      .from("patient_visits")
      .select(`
        *,
        users (
          id,
          full_name,
          email
        )
      `)
      .eq("patient_id", patientId)
      .eq("hospital_id", hospitalId)
      .order("visit_date", { ascending: false })

    if (error) throw error

    return { visits, error: null }
  } catch (error) {
    console.error(`Error fetching visits for patient ${patientId}:`, error)
    return { visits: null, error: "Failed to fetch patient visits" }
  }
}

/**
 * Get patient lab results for sharing
 */
export async function getPatientLabResults(patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all lab results for this patient
    const { data: results, error } = await supabase
      .from("lab_results")
      .select(`
        *,
        users:created_by (
          id,
          full_name,
          email
        )
      `)
      .eq("patient_id", patientId)
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { results, error: null }
  } catch (error) {
    console.error(`Error fetching lab results for patient ${patientId}:`, error)
    return { results: null, error: "Failed to fetch patient lab results" }
  }
}

/**
 * Share patient records
 */
export async function sharePatientRecords(shareData: {
  requestId: string
  patientId: string
  sourceHospitalId: string
  targetHospitalId: string
  visitIds: string[]
  labResultIds: string[]
}) {
  try {
    const supabase = createServerSupabaseClient()
    const { requestId, patientId, sourceHospitalId, targetHospitalId, visitIds, labResultIds } = shareData

    // Get patient name
    const { data: patient } = await supabase.from("patients").select("name").eq("id", patientId).single()

    // Create shared record entry
    const sharedRecordId = crypto.randomUUID()
    const sharedRecord = {
      id: sharedRecordId,
      patient_id: patientId,
      patient_name: patient?.name || "Unknown",
      source_hospital_id: sourceHospitalId,
      target_hospital_id: targetHospitalId,
      record_type:
        visitIds.length > 0 && labResultIds.length > 0 ? "all" : visitIds.length > 0 ? "visits" : "lab_results",
      records_count: visitIds.length + labResultIds.length,
      shared_at: new Date().toISOString(),
      request_id: requestId,
    }

    const { error: sharedRecordError } = await supabase.from("shared_records").insert(sharedRecord)

    if (sharedRecordError) throw sharedRecordError

    // Update visits with shared_to information
    if (visitIds.length > 0) {
      for (const visitId of visitIds) {
        // Get current shared_to array
        const { data: visit } = await supabase.from("patient_visits").select("shared_to").eq("id", visitId).single()

        // Update shared_to array
        const sharedTo = visit?.shared_to || []
        if (!sharedTo.includes(targetHospitalId)) {
          const { error: visitError } = await supabase
            .from("patient_visits")
            .update({ shared_to: [...sharedTo, targetHospitalId], shared_record_id: sharedRecordId })
            .eq("id", visitId)

          if (visitError) throw visitError
        }
      }
    }

    // Update lab results with shared_to information
    if (labResultIds.length > 0) {
      for (const resultId of labResultIds) {
        // Get current shared_to array
        const { data: result } = await supabase.from("lab_results").select("shared_to").eq("id", resultId).single()

        // Update shared_to array
        const sharedTo = result?.shared_to || []
        if (!sharedTo.includes(targetHospitalId)) {
          const { error: resultError } = await supabase
            .from("lab_results")
            .update({ shared_to: [...sharedTo, targetHospitalId], shared_record_id: sharedRecordId })
            .eq("id", resultId)

          if (resultError) throw resultError
        }
      }
    }

    // Update request status to approved
    const { error: requestError } = await supabase
      .from("record_requests")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
        shared_record_id: sharedRecordId,
      })
      .eq("id", requestId)

    if (requestError) throw requestError

    // Get hospital names for notifications
    const { data: sourceHospital } = await supabase.from("hospitals").select("name").eq("id", sourceHospitalId).single()
    const { data: targetHospital } = await supabase.from("hospitals").select("name").eq("id", targetHospitalId).single()

    // Get request details
    const { data: request } = await supabase
      .from("record_requests")
      .select("requesting_user_id")
      .eq("id", requestId)
      .single()

    // Create notification for the requesting user
    if (request?.requesting_user_id) {
      await supabase.from("notifications").insert({
        user_id: request.requesting_user_id,
        title: "Patient Records Shared",
        message: `${sourceHospital?.name || "Another hospital"} has shared ${patient?.name || "a patient"}'s records with your hospital.`,
        type: "shared_records",
        action_url: `/patients/${patientId}/shared-records/${sharedRecordId}`,
        is_read: false,
        metadata: {
          patient_id: patientId,
          patient_name: patient?.name,
          shared_record_id: sharedRecordId,
          source_hospital_id: sourceHospitalId,
          source_hospital_name: sourceHospital?.name,
        },
        created_at: new Date().toISOString(),
      })
    }

    // Log activity
    await supabase.from("user_activities").insert({
      user_id: "system",
      action: "share_patient_records",
      details: `Shared ${visitIds.length} visits and ${labResultIds.length} lab results for patient ${
        patient?.name || "unknown"
      } from ${sourceHospital?.name || "unknown"} to ${targetHospital?.name || "unknown"}`,
      resource_type: "shared_records",
      resource_id: sharedRecordId,
      metadata: {
        patient_id: patientId,
        patient_name: patient?.name,
        source_hospital_id: sourceHospitalId,
        target_hospital_id: targetHospitalId,
        visit_count: visitIds.length,
        lab_result_count: labResultIds.length,
      },
      created_at: new Date().toISOString(),
    })

    revalidatePath(`/patients/${patientId}/records`)
    revalidatePath(`/hospital-admin/records`)

    return { success: true, error: null }
  } catch (error) {
    console.error("Error sharing patient records:", error)
    return { success: false, error: "Failed to share patient records" }
  }
}
