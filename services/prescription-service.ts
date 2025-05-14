"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

/**
 * Create a new prescription
 */
export async function createPrescription(prescriptionData: any) {
  try {
    const supabase = createServerSupabaseClient()

    // Add created_at timestamp
    prescriptionData.created_at = new Date().toISOString()

    // Insert the prescription
    const { data, error } = await supabase.from("prescriptions").insert(prescriptionData).select().single()

    if (error) throw error

    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: prescriptionData.doctor_id,
        action: "create_prescription",
        details: `Created prescription for patient`,
        resource_type: "prescription",
        resource_id: data.id,
        metadata: {
          patient_id: prescriptionData.patient_id,
          visit_id: prescriptionData.visit_id,
          medication_count: prescriptionData.medications?.length || 0,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging prescription activity:", e)
    }

    return { prescription: data, error: null }
  } catch (error) {
    console.error("Error creating prescription:", error)
    return { prescription: null, error: "Failed to create prescription" }
  }
}

/**
 * Get prescriptions for a patient
 */
export async function getPatientPrescriptions(patientId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all prescriptions for this patient
    const { data: prescriptions, error } = await supabase
      .from("prescriptions")
      .select(`
        *,
        users (
          id,
          full_name,
          email
        ),
        patient_visits (
          id,
          visit_date,
          reason
        )
      `)
      .eq("patient_id", patientId)
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { prescriptions, error: null }
  } catch (error) {
    console.error(`Error fetching prescriptions for patient ${patientId}:`, error)
    return { prescriptions: null, error: "Failed to fetch patient prescriptions" }
  }
}

/**
 * Get a specific prescription by ID
 */
export async function getPrescriptionById(prescriptionId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the prescription
    const { data: prescription, error } = await supabase
      .from("prescriptions")
      .select(`
        *,
        users (
          id,
          full_name,
          email
        ),
        patient_visits (
          id,
          visit_date,
          reason
        )
      `)
      .eq("id", prescriptionId)
      .eq("hospital_id", hospitalId)
      .single()

    if (error) throw error

    // Get the patient information
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", prescription.patient_id)
      .single()

    if (patientError) {
      console.error("Error fetching patient for prescription:", patientError)
    }

    // Get the hospital information
    const { data: hospital, error: hospitalError } = await supabase
      .from("hospitals")
      .select("*")
      .eq("id", hospitalId)
      .single()

    if (hospitalError) {
      console.error("Error fetching hospital for prescription:", hospitalError)
    }

    return {
      prescription: {
        ...prescription,
        patient,
        hospital,
      },
      error: null,
    }
  } catch (error) {
    console.error(`Error fetching prescription with ID ${prescriptionId}:`, error)
    return { prescription: null, error: "Failed to fetch prescription" }
  }
}

/**
 * Get prescriptions for a specific visit
 */
export async function getVisitPrescriptions(visitId: string, hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all prescriptions for this visit
    const { data: prescriptions, error } = await supabase
      .from("prescriptions")
      .select(`
        *,
        users (
          id,
          full_name,
          email
        )
      `)
      .eq("visit_id", visitId)
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { prescriptions, error: null }
  } catch (error) {
    console.error(`Error fetching prescriptions for visit ${visitId}:`, error)
    return { prescriptions: null, error: "Failed to fetch visit prescriptions" }
  }
}

/**
 * Update a prescription
 */
export async function updatePrescription(prescriptionId: string, prescriptionData: any) {
  try {
    const supabase = createServerSupabaseClient()

    // Update the prescription
    const { data, error } = await supabase
      .from("prescriptions")
      .update({
        ...prescriptionData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prescriptionId)
      .select()
      .single()

    if (error) throw error

    // Log activity
    try {
      await supabase.from("user_activities").insert({
        user_id: prescriptionData.updated_by || prescriptionData.doctor_id,
        action: "update_prescription",
        details: `Updated prescription`,
        resource_type: "prescription",
        resource_id: prescriptionId,
        metadata: {
          patient_id: prescriptionData.patient_id,
          visit_id: prescriptionData.visit_id,
        },
        created_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error logging prescription update activity:", e)
    }

    return { prescription: data, error: null }
  } catch (error) {
    console.error(`Error updating prescription ${prescriptionId}:`, error)
    return { prescription: null, error: "Failed to update prescription" }
  }
}

/**
 * Get medication catalog
 */
export async function getMedicationCatalog(hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all medications in the catalog
    const { data: medications, error } = await supabase
      .from("medication_catalog")
      .select("*")
      .eq("hospital_id", hospitalId)
      .order("name", { ascending: true })

    if (error) throw error

    return { medications, error: null }
  } catch (error) {
    console.error("Error fetching medication catalog:", error)
    return { medications: null, error: "Failed to fetch medication catalog" }
  }
}

/**
 * Add medication to catalog
 */
export async function addMedicationToCatalog(medicationData: any) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if medication already exists
    const { data: existingMedication, error: checkError } = await supabase
      .from("medication_catalog")
      .select("id")
      .eq("name", medicationData.name)
      .eq("hospital_id", medicationData.hospital_id)
      .maybeSingle()

    if (checkError) throw checkError

    // If medication already exists, return it
    if (existingMedication) {
      return { medication: existingMedication, error: null }
    }

    // Add created_at timestamp
    medicationData.created_at = new Date().toISOString()

    // Insert the medication
    const { data, error } = await supabase.from("medication_catalog").insert(medicationData).select().single()

    if (error) throw error

    return { medication: data, error: null }
  } catch (error) {
    console.error("Error adding medication to catalog:", error)
    return { medication: null, error: "Failed to add medication to catalog" }
  }
}
