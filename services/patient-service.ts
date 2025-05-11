"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Get a patient by ID
 * Note: In this system, patients are identified by their ID in diagnoses
 */
export async function getPatientById(patientId: string, hospitalId?:string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the first diagnosis for this patient to extract metadata
    const { data, error } = await supabase
      .from("diagnoses")
      .select("patient_id, patient_metadata, hospital_id, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    // Construct a patient object from the diagnosis data
    const patient = {
      id: data.patient_id,
      name: data.patient_metadata?.name || data.patient_id,
      metadata: data.patient_metadata || {},
      hospital_id: data.hospital_id,
      created_at: data.created_at,
    }

    return { patient, error: null }
  } catch (error) {
    console.error(`Error fetching patient with ID ${patientId}:`, error)
    return { patient: null, error: "Failed to fetch patient" }
  }
}

/**
 * Get a patient by ID
 */
export async function getGeneralPatientById(patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // First try to get from patients table
    const { data: patient, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .eq("hospital_id", hospitalId)
      .single()

    // If found in patients table
    if (patient && !error) {
      // Get all diagnoses for this patient
      const { data: diagnoses, error: diagnosesError } = await supabase
        .from("diagnoses")
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
        .order("created_at", { ascending: false })

      if (diagnosesError) throw diagnosesError

      // Get all visits for this patient
      const { data: visits, error: visitsError } = await supabase
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

      if (visitsError) throw visitsError

      return {
        patient: {
          ...patient,
          diagnoses: diagnoses || [],
          visits: visits || [],
        },
        error: null,
      }
    }

    // If not found in patients table, try legacy method
    return getLegacyPatientById(patientId, hospitalId)
  } catch (error) {
    console.error(`Error fetching patient with ID ${patientId}:`, error)
    return { patient: null, error: "Failed to fetch patient" }
  }
}

/**
 * Legacy method to get patient by ID from diagnoses
 */
async function getLegacyPatientById(patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all diagnoses for this patient
    const { data: diagnoses, error } = await supabase
      .from("diagnoses")
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
      .order("created_at", { ascending: false })

    if (error) throw error

    if (diagnoses.length === 0) {
      return { patient: null, error: "Patient not found" }
    }

    // Extract patient information from the diagnoses
    const patientName = diagnoses[0].patient_metadata?.name || null
    const patientMetadata = diagnoses[0].patient_metadata || {}

    // Combine all metadata from all diagnoses
    diagnoses.forEach((diagnosis) => {
      if (diagnosis.patient_metadata) {
        Object.assign(patientMetadata, diagnosis.patient_metadata)
      }
    })

    const patient = {
      id: patientId,
      name: patientName,
      diagnosisCount: diagnoses.length,
      lastDiagnosis: diagnoses[0].created_at,
      metadata: patientMetadata,
      diagnoses,
      visits: [],
      patient_info: null,
    }

    return { patient, error: null }
  } catch (error) {
    console.error(`Error fetching legacy patient with ID ${patientId}:`, error)
    return { patient: null, error: "Failed to fetch patient" }
  }
}

/**
 * Get all patients for a hospital
 */
export async function getPatients(hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all diagnoses for this hospital
    const { data, error } = await supabase
      .from("diagnoses")
      .select("patient_id, patient_metadata, created_at")
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Process the data to get unique patients
    const patientMap = new Map()

    data.forEach((diagnosis) => {
      const patientId = diagnosis.patient_id
      const metadata = diagnosis.patient_metadata || {}
      const name = metadata.name || patientId

      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          id: patientId,
          name,
          metadata,
          created_at: diagnosis.created_at,
          diagnoses_count: 1,
        })
      } else {
        // Update the patient with additional diagnosis count
        const patient = patientMap.get(patientId)
        patient.diagnoses_count += 1
        patientMap.set(patientId, patient)
      }
    })

    // Convert map to array
    const patients = Array.from(patientMap.values())

    return { patients, error: null }
  } catch (error) {
    console.error(`Error fetching patients for hospital ${hospitalId}:`, error)
    return { patients: [], error: "Failed to fetch patients" }
  }
}

/**
 * Get diagnoses for a specific patient
 */
export async function getPatientDiagnoses(patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all diagnoses for this patient in this hospital
    const { data, error } = await supabase
      .from("diagnoses")
      .select(`
        *,
        users (id, full_name, email),
        hospitals (id, name, code)
      `)
      .eq("patient_id", patientId)
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { diagnoses: data, error: null }
  } catch (error) {
    console.error(`Error fetching diagnoses for patient ${patientId}:`, error)
    return { diagnoses: [], error: "Failed to fetch patient diagnoses" }
  }
}

/**
 * Search patients by name or ID
 */
export async function searchPatients(hospitalId: string, query: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all diagnoses for this hospital
    const { data, error } = await supabase
      .from("diagnoses")
      .select("patient_id, patient_metadata, created_at")
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Process the data to get unique patients
    const patientMap = new Map()
    const lowerQuery = query.toLowerCase()

    data.forEach((diagnosis) => {
      const patientId = diagnosis.patient_id
      const metadata = diagnosis.patient_metadata || {}
      const name = metadata.name || patientId

      // Filter by query
      if (patientId.toLowerCase().includes(lowerQuery) || (name && name.toLowerCase().includes(lowerQuery))) {
        if (!patientMap.has(patientId)) {
          patientMap.set(patientId, {
            id: patientId,
            name,
            metadata,
            created_at: diagnosis.created_at,
            diagnoses_count: 1,
          })
        } else {
          // Update the patient with additional diagnosis count
          const patient = patientMap.get(patientId)
          patient.diagnoses_count += 1
          patientMap.set(patientId, patient)
        }
      }
    })

    // Convert map to array
    const patients = Array.from(patientMap.values())

    return { patients, error: null }
  } catch (error) {
    console.error(`Error searching patients for hospital ${hospitalId}:`, error)
    return { patients: [], error: "Failed to search patients" }
  }
}
/**
 * Create or update a patient
 */
export async function savePatient(patientData: any) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if patient exists
    const { data: existingPatient, error: checkError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientData.id)
      .maybeSingle()

    if (checkError) throw checkError

    // Add created_at if it's a new patient
    if (!existingPatient) {
      patientData.created_at = new Date().toISOString()
    }

    // Update the updated_at timestamp
    patientData.updated_at = new Date().toISOString()

    // Insert or update the patient
    const { data, error } = await supabase.from("patients").upsert(patientData).select().single()

    if (error) throw error
    // Log activity
    try {
      const action = existingPatient ? "update_patient" : "create_patient"
      const details = existingPatient
        ? `Updated patient information for ${patientData.name || patientData.id}`
        : `Created new patient: ${patientData.name || patientData.id}`

      await supabase.from("user_activities").insert({
        user_id: patientData.updated_by || patientData.created_by,
        action: action,
        details: details,
        resource_type: "patient",
        resource_id: data.id,
        metadata: {
          patient_name: patientData.name,
          hospital_id: patientData.hospital_id,
          is_new: !existingPatient,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging patient activity:", e)
    }

    return { patient: data, error: null }
  } catch (error) {
    console.error("Error saving patient:", error)
    return { patient: null, error: "Failed to save patient" }
  }
}

/**
 * Add a visit to a patient
 */
export async function addPatientVisit(visitData: any) {
  try {
    const supabase = createServerSupabaseClient()

    // Add created_at timestamp
    visitData.created_at = new Date().toISOString()

    // Insert the visit
    const { data, error } = await supabase.from("patient_visits").insert(visitData).select().single()

    if (error) throw error
    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: visitData.created_by,
        action: "create_patient_visit",
        details: `Created new visit for patient`,
        resource_type: "patient_visit",
        resource_id: data.id,
        metadata: {
          patient_id: visitData.patient_id,
          visit_reason: visitData.reason,
          visit_date: visitData.visit_date,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging patient visit activity:", e)
    }

    return { visit: data, error: null }
  } catch (error) {
    console.error("Error adding patient visit:", error)
    return { visit: null, error: "Failed to add patient visit" }
  }
}

/**
 * Get visits for a patient
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
 * Generate a SOAP note for a patient visit
 */
export async function generateSoapNote(visitId: string, patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the visit
    const { data: visit, error: visitError } = await supabase
      .from("patient_visits")
      .select(`
        *,
        users (
          id,
          full_name,
          email
        )
      `)
      .eq("id", visitId)
      .eq("patient_id", patientId)
      .eq("hospital_id", hospitalId)
      .single()

    if (visitError) throw visitError

    // Get the patient
    const { patient, error: patientError } = await getPatientById(patientId, hospitalId)

    if (patientError) throw patientError

    // Generate the SOAP note
    const soapNote = {
      id: `soap-${visitId}`,
      patient_id: patientId,
      visit_id: visitId,
      hospital_id: hospitalId,
      created_at: new Date().toISOString(),
      note_type: "SOAP",
      content: {
        subjective: visit.notes?.subjective || "No subjective information provided.",
        objective: {
          vitals: visit.vitals || {},
          examination: visit.notes?.examination || "No examination information provided.",
        },
        assessment: visit.notes?.assessment || "No assessment provided.",
        plan: visit.notes?.plan || "No plan provided.",
      },
      metadata: {
        patient_name: patient?.name || "Unknown",
        doctor_name: visit.users?.full_name || "Unknown",
        visit_date: visit.visit_date,
        visit_reason: visit.reason,
      },
    }

    // Save the SOAP note
    const { data: savedNote, error: saveError } = await supabase
      .from("patient_notes")
      .insert(soapNote)
      .select()
      .single()

    if (saveError) throw saveError

    return { note: savedNote, error: null }
  } catch (error) {
    console.error(`Error generating SOAP note for visit ${visitId}:`, error)
    return { note: null, error: "Failed to generate SOAP note" }
  }
}

export async function getGeneralPatients(hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // First try to get from patients table
    const { data: patients, error } = await supabase
      .from("patients")
      .select("*")
      .eq("hospital_id", hospitalId)


    // If not found in patients table, try legacy method
    return {patients: patients ? patients : [], error: null}
  } catch (error) {
    console.error(`Error fetching patients`, error)
    return { patient: null, error: "Failed to fetch patient" }
  }
}

/**
 * Get a specific visit for a patient
 */
export async function getPatientVisit(visitId: string, patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the visit
    const { data: visit, error } = await supabase
      .from("patient_visits")
      .select(`
        *,
        users (
          id,
          full_name,
          email
        )
      `)
      .eq("id", visitId)
      .eq("patient_id", patientId)
      .eq("hospital_id", hospitalId)
      .single()

    if (error) throw error

    return { visit, error: null }
  } catch (error) {
    console.error(`Error fetching visit with ID ${visitId}:`, error)
    return { visit: null, error: "Failed to fetch patient visit" }
  }
}

/**
 * Add a modification record to the patient history
 */
export async function addPatientModification(modificationData: any) {
  try {
    const supabase = createServerSupabaseClient()

    // Insert the modification record
    const { data, error } = await supabase
      .from("patient_modifications")
      .insert({
        id: crypto.randomUUID(),
        patient_id: modificationData.patient_id,
        hospital_id: modificationData.hospital_id,
        user_id: modificationData.user_id,
        user_name: modificationData.user_name,
        changes: modificationData.changes,
        timestamp: modificationData.timestamp,
      })
      .select()
      .single()

    if (error) throw error
    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: modificationData.user_id,
        action: "modify_patient_record",
        details: `Modified patient record: ${Object.keys(modificationData.changes).join(", ")}`,
        resource_type: "patient",
        resource_id: modificationData.patient_id,
        metadata: {
          changes: modificationData.changes,
          hospital_id: modificationData.hospital_id,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging patient modification activity:", e)
    }

    return { modification: data, error: null }
  } catch (error) {
    console.error("Error adding patient modification:", error)
    return { modification: null, error: "Failed to record modification" }
  }
}

/**
 * Get modification history for a patient
 */
export async function getPatientModificationHistory(patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all modifications for this patient
    const { data: history, error } = await supabase
      .from("patient_modifications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("hospital_id", hospitalId)
      .order("timestamp", { ascending: false })

    if (error) throw error

    return { history, error: null }
  } catch (error) {
    console.error(`Error fetching modification history for patient ${patientId}:`, error)
    return { history: null, error: "Failed to fetch modification history" }
  }
}