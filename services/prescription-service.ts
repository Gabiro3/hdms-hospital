"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

/**
 * Generate a share code for a prescription
 */
export async function generateShareCode(prescriptionId: string) {
  try {
    const supabase = createServerSupabaseClient();

    // Generate a random 5-digit code
    const shareCode = Math.floor(10000 + Math.random() * 90000).toString();

    // Set expiry time to 60 seconds from now
    const expiryTime = new Date();
    expiryTime.setSeconds(expiryTime.getSeconds() + 60);

    // Update the prescription with the share code
    const { error } = await supabase
      .from("prescriptions")
      .update({
        share_code: shareCode,
        share_code_expiry: expiryTime.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", prescriptionId);

    if (error) throw error;

    // Log share code generation
    try {
      await supabase.from("prescription_access_logs").insert({
        prescription_id: prescriptionId,
        access_type: "generate_share_code",
        accessed_at: new Date().toISOString(),
        ip_address: (await headers()).get("x-forwarded-for") || "unknown",
        user_agent: (await headers()).get("user-agent") || "unknown",
      });
    } catch (e) {
      console.error("Error logging share code generation:", e);
    }

    return { shareCode, error: null };
  } catch (error) {
    console.error("Error generating share code:", error);
    return { shareCode: null, error: "Failed to generate share code" };
  }
}

/**
 * Verify a share code for a prescription
 */
export async function verifyShareCode(
  prescriptionId: string,
  shareCode: string,
  patientName: string
) {
  try {
    const supabase = createServerSupabaseClient();

    // Get the prescription
    const { data: prescription, error: prescriptionError } = await supabase
      .from("prescriptions")
      .select("id, patient_id, share_code, share_code_expiry")
      .eq("id", prescriptionId)
      .eq("share_code", shareCode)
      .single();

    if (prescriptionError || !prescription) {
      return { valid: false, error: "Invalid share code" };
    }

    // Check if share code is expired
    if (prescription.share_code_expiry) {
      const expiryTime = new Date(prescription.share_code_expiry).getTime();
      const currentTime = new Date().getTime();

      if (currentTime > expiryTime) {
        return { valid: false, error: "Share code has expired" };
      }
    }

    // Get the patient information
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("name")
      .eq("id", prescription.patient_id)
      .single();

    if (patientError || !patient) {
      return { valid: false, error: "Patient not found" };
    }

    // Verify patient name
    if (patient.name.toLowerCase() !== patientName.toLowerCase()) {
      return { valid: false, error: "Invalid patient name" };
    }

    // Log successful verification
    try {
      await supabase.from("prescription_access_logs").insert({
        prescription_id: prescriptionId,
        access_type: "verify_share_code",
        accessed_at: new Date().toISOString(),
        ip_address: (await headers()).get("x-forwarded-for") || "unknown",
        user_agent: (await headers()).get("user-agent") || "unknown",
      });
    } catch (e) {
      console.error("Error logging share code verification:", e);
    }

    return { valid: true, error: null };
  } catch (error) {
    console.error("Error verifying share code:", error);
    return { valid: false, error: "Failed to verify share code" };
  }
}

/**
 * Create a new prescription
 */
export async function createPrescription(prescriptionData: any) {
  try {
    const supabase = createServerSupabaseClient();

    // Add created_at timestamp
    prescriptionData.created_at = new Date().toISOString();

    // Insert the prescription
    const { data, error } = await supabase
      .from("prescriptions")
      .insert(prescriptionData)
      .select()
      .single();

    if (error) throw error;

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
      });
    } catch (e) {
      console.error("Error logging prescription activity:", e);
    }

    return { prescription: data, error: null };
  } catch (error) {
    console.error("Error creating prescription:", error);
    return { prescription: null, error: "Failed to create prescription" };
  }
}

/**
 * Get prescriptions for a patient
 */
export async function getPatientPrescriptions(
  patientId: string,
  hospitalId: string
) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all prescriptions for this patient
    const { data: prescriptions, error } = await supabase
      .from("prescriptions")
      .select(
        `
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
      `
      )
      .eq("patient_id", patientId)
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { prescriptions, error: null };
  } catch (error) {
    console.error(
      `Error fetching prescriptions for patient ${patientId}:`,
      error
    );
    return {
      prescriptions: null,
      error: "Failed to fetch patient prescriptions",
    };
  }
}

/**
 * Get prescriptions for a patient
 */
export async function getGeneralPatientPrescriptions(patientId: string) {
  try {
    const supabase = createServerSupabaseClient();
    // Get all prescriptions for this patient
    const { data: prescriptions, error } = await supabase
      .from("prescriptions")
      .select("*") // Select all columns
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { prescriptions, error: null };
  } catch (error) {
    return {
      prescriptions: null,
      error: "Failed to fetch patient prescriptions",
    };
  }
}

/**
 * Get a specific prescription by ID
 */
export async function getPrescriptionById(
  prescriptionId: string,
  hospitalId: string
) {
  try {
    const supabase = createServerSupabaseClient();

    // Get the prescription
    const { data: prescription, error } = await supabase
      .from("prescriptions")
      .select(
        `
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
      `
      )
      .eq("id", prescriptionId)
      .eq("hospital_id", hospitalId)
      .single();

    if (error) throw error;

    // Get the patient information
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", prescription.patient_id)
      .single();

    if (patientError) {
      console.error("Error fetching patient for prescription:", patientError);
    }

    // Get the hospital information
    const { data: hospital, error: hospitalError } = await supabase
      .from("hospitals")
      .select("*")
      .eq("id", hospitalId)
      .single();

    if (hospitalError) {
      console.error("Error fetching hospital for prescription:", hospitalError);
    }

    return {
      prescription: {
        ...prescription,
        patient,
        hospital,
      },
      error: null,
    };
  } catch (error) {
    console.error(
      `Error fetching prescription with ID ${prescriptionId}:`,
      error
    );
    return { prescription: null, error: "Failed to fetch prescription" };
  }
}

/**
 * Get prescriptions for a specific visit
 */
export async function getVisitPrescriptions(
  visitId: string,
  hospitalId: string
) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all prescriptions for this visit
    const { data: prescriptions, error } = await supabase
      .from("prescriptions")
      .select(
        `
        *,
        users (
          id,
          full_name,
          email
        )
      `
      )
      .eq("visit_id", visitId)
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { prescriptions, error: null };
  } catch (error) {
    console.error(`Error fetching prescriptions for visit ${visitId}:`, error);
    return {
      prescriptions: null,
      error: "Failed to fetch visit prescriptions",
    };
  }
}

/**
 * Update a prescription
 */
export async function updatePrescription(
  prescriptionId: string,
  prescriptionData: any
) {
  try {
    const supabase = createServerSupabaseClient();

    // Update the prescription
    const { data, error } = await supabase
      .from("prescriptions")
      .update({
        ...prescriptionData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prescriptionId)
      .select()
      .single();

    if (error) throw error;

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
      });
    } catch (e) {
      console.error("Error logging prescription update activity:", e);
    }

    return { prescription: data, error: null };
  } catch (error) {
    console.error(`Error updating prescription ${prescriptionId}:`, error);
    return { prescription: null, error: "Failed to update prescription" };
  }
}

/**
 * Get medication catalog
 */
export async function getMedicationCatalog(hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all medications in the catalog
    const { data: medications, error } = await supabase
      .from("medication_catalog")
      .select("*")
      .eq("hospital_id", hospitalId)
      .order("name", { ascending: true });

    if (error) throw error;

    return { medications, error: null };
  } catch (error) {
    console.error("Error fetching medication catalog:", error);
    return { medications: null, error: "Failed to fetch medication catalog" };
  }
}

/**
 * Add medication to catalog
 */
export async function addMedicationToCatalog(medicationData: any) {
  try {
    const supabase = createServerSupabaseClient();

    // Check if medication already exists
    const { data: existingMedication, error: checkError } = await supabase
      .from("medication_catalog")
      .select("id")
      .eq("name", medicationData.name)
      .eq("hospital_id", medicationData.hospital_id)
      .maybeSingle();

    if (checkError) throw checkError;

    // If medication already exists, return it
    if (existingMedication) {
      return { medication: existingMedication, error: null };
    }

    // Add created_at timestamp
    medicationData.created_at = new Date().toISOString();

    // Insert the medication
    const { data, error } = await supabase
      .from("medication_catalog")
      .insert(medicationData)
      .select()
      .single();

    if (error) throw error;

    return { medication: data, error: null };
  } catch (error) {
    console.error("Error adding medication to catalog:", error);
    return { medication: null, error: "Failed to add medication to catalog" };
  }
}
