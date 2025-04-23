"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Get a patient by ID
 * Note: In this system, patients are identified by their ID in diagnoses
 */
export async function getPatientById(patientId: string) {
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
