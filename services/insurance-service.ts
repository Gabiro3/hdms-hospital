"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

/**
 * Get all insurers
 */
export async function getAllInsurers() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: insurers, error } = await supabase.from("insurers").select("*").order("name")

    if (error) throw error

    return { insurers, error: null }
  } catch (error) {
    console.error("Error fetching insurers:", error)
    return { insurers: [], error: "Failed to fetch insurers" }
  }
}

/**
 * Get insurer by ID
 */
export async function getInsurerById(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: insurer, error } = await supabase.from("insurers").select("*").eq("id", id).single()

    if (error) throw error

    return { insurer, error: null }
  } catch (error) {
    console.error(`Error fetching insurer with ID ${id}:`, error)
    return { insurer: null, error: "Failed to fetch insurer" }
  }
}

/**
 * Create a new insurer
 */
export async function createInsurer(insurerData: any) {
  try {
    const supabase = createServerSupabaseClient()

    const newInsurer = {
      id: uuidv4(),
      name: insurerData.name,
      contact_phone: insurerData.contact_phone,
      address: insurerData.address || null,
      email: insurerData.email || null,
      website: insurerData.website || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: insurer, error } = await supabase.from("insurers").insert(newInsurer).select().single()

    if (error) throw error

    revalidatePath("/insurance")
    return { insurer, error: null }
  } catch (error) {
    console.error("Error creating insurer:", error)
    return { insurer: null, error: "Failed to create insurer" }
  }
}

/**
 * Update an existing insurer
 */
export async function updateInsurer(id: string, insurerData: any) {
  try {
    const supabase = createServerSupabaseClient()

    const updatedInsurer = {
      name: insurerData.name,
      contact_phone: insurerData.contact_phone,
      address: insurerData.address || null,
      email: insurerData.email || null,
      website: insurerData.website || null,
      updated_at: new Date().toISOString(),
    }

    const { data: insurer, error } = await supabase
      .from("insurers")
      .update(updatedInsurer)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/insurance")
    revalidatePath(`/insurance/${id}`)
    return { insurer, error: null }
  } catch (error) {
    console.error(`Error updating insurer with ID ${id}:`, error)
    return { insurer: null, error: "Failed to update insurer" }
  }
}

/**
 * Get patients by insurer ID
 */
export async function getPatientsByInsurer(insurerId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: patients, error } = await supabase
      .from("patients")
      .select(`
        *,
        insurance_policies (
          id,
          policy_number,
          start_date,
          end_date,
          coverage_details,
          status
        )
      `)
      .eq("insurer_id", insurerId)
      .order("name")

    if (error) throw error

    return { patients, error: null }
  } catch (error) {
    console.error(`Error fetching patients for insurer ${insurerId}:`, error)
    return { patients: [], error: "Failed to fetch patients" }
  }
}

/**
 * Get insurance policy by ID
 */
export async function getInsurancePolicyById(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: policy, error } = await supabase
      .from("insurance_policies")
      .select(`
        *,
        patients (
          id,
          name,
          patient_info
        ),
        insurers (
          id,
          name,
          contact_phone
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return { policy, error: null }
  } catch (error) {
    console.error(`Error fetching insurance policy with ID ${id}:`, error)
    return { policy: null, error: "Failed to fetch insurance policy" }
  }
}

/**
 * Create a new insurance policy
 */
export async function createInsurancePolicy(policyData: any) {
  try {
    const supabase = createServerSupabaseClient()

    const newPolicy = {
      id: uuidv4(),
      patient_id: policyData.patient_id,
      insurer_id: policyData.insurer_id,
      policy_number: policyData.policy_number,
      start_date: policyData.start_date,
      end_date: policyData.end_date || null,
      coverage_details: policyData.coverage_details || null,
      status: policyData.status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: policy, error } = await supabase.from("insurance_policies").insert(newPolicy).select().single()

    if (error) throw error

    // Update patient's insurer_id
    const { error: updateError } = await supabase
      .from("patients")
      .update({ insurer_id: policyData.insurer_id })
      .eq("id", policyData.patient_id)

    if (updateError) throw updateError

    revalidatePath("/insurance")
    revalidatePath(`/patients/${policyData.patient_id}`)
    return { policy, error: null }
  } catch (error) {
    console.error("Error creating insurance policy:", error)
    return { policy: null, error: "Failed to create insurance policy" }
  }
}

/**
 * Update an existing insurance policy
 */
export async function updateInsurancePolicy(id: string, policyData: any) {
  try {
    const supabase = createServerSupabaseClient()

    const updatedPolicy = {
      policy_number: policyData.policy_number,
      start_date: policyData.start_date,
      end_date: policyData.end_date || null,
      coverage_details: policyData.coverage_details || null,
      status: policyData.status || "active",
      updated_at: new Date().toISOString(),
    }

    const { data: policy, error } = await supabase
      .from("insurance_policies")
      .update(updatedPolicy)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/insurance")
    revalidatePath(`/insurance/policies/${id}`)
    return { policy, error: null }
  } catch (error) {
    console.error(`Error updating insurance policy with ID ${id}:`, error)
    return { policy: null, error: "Failed to update insurance policy" }
  }
}

/**
 * Get insurance claims by policy ID
 */
export async function getClaimsByPolicy(policyId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: claims, error } = await supabase
      .from("insurance_claims")
      .select(`
        *,
        insurance_policies (
          id,
          policy_number,
          patients (
            id,
            name
          ),
          insurers (
            id,
            name
          )
        )
      `)
      .eq("policy_id", policyId)
      .order("submitted_date", { ascending: false })

    if (error) throw error

    return { claims, error: null }
  } catch (error) {
    console.error(`Error fetching claims for policy ${policyId}:`, error)
    return { claims: [], error: "Failed to fetch insurance claims" }
  }
}

/**
 * Create a new insurance claim
 */
export async function createInsuranceClaim(claimData: any) {
  try {
    const supabase = createServerSupabaseClient()

    const newClaim = {
      id: uuidv4(),
      policy_id: claimData.policy_id,
      diagnosis_id: claimData.diagnosis_id || null,
      visit_id: claimData.visit_id || null,
      lab_result_id: claimData.lab_result_id || null,
      radiology_study_id: claimData.radiology_study_id || null,
      claim_amount: claimData.claim_amount,
      approved_amount: claimData.approved_amount || null,
      status: claimData.status || "submitted",
      submitted_date: claimData.submitted_date || new Date().toISOString(),
      processed_date: claimData.processed_date || null,
      notes: claimData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: claim, error } = await supabase.from("insurance_claims").insert(newClaim).select().single()

    if (error) throw error

    revalidatePath("/insurance")
    revalidatePath(`/insurance/policies/${claimData.policy_id}`)
    return { claim, error: null }
  } catch (error) {
    console.error("Error creating insurance claim:", error)
    return { claim: null, error: "Failed to create insurance claim" }
  }
}

/**
 * Update an existing insurance claim
 */
export async function updateInsuranceClaim(id: string, claimData: any) {
  try {
    const supabase = createServerSupabaseClient()

    const updatedClaim = {
      claim_amount: claimData.claim_amount,
      approved_amount: claimData.approved_amount || null,
      status: claimData.status || "submitted",
      processed_date: claimData.processed_date || null,
      notes: claimData.notes || null,
      updated_at: new Date().toISOString(),
    }

    const { data: claim, error } = await supabase
      .from("insurance_claims")
      .update(updatedClaim)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/insurance")
    revalidatePath(`/insurance/claims/${id}`)
    return { claim, error: null }
  } catch (error) {
    console.error(`Error updating insurance claim with ID ${id}:`, error)
    return { claim: null, error: "Failed to update insurance claim" }
  }
}

/**
 * Get insurer dashboard statistics
 */
export async function getInsurerDashboardStats(insurerId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get total patients count
    const { count: totalPatients, error: patientsError } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("insurer_id", insurerId)

    if (patientsError) throw patientsError

    // Get total policies count
    const { count: totalPolicies, error: policiesError } = await supabase
      .from("insurance_policies")
      .select("*", { count: "exact", head: true })
      .eq("insurer_id", insurerId)

    if (policiesError) throw policiesError

    // Get total claims
    const { data: claims, error: claimsError } = await supabase
      .from("insurance_claims")
      .select(`
        *,
        insurance_policies!inner (
          insurer_id
        )
      `)
      .eq("insurance_policies.insurer_id", insurerId)

    if (claimsError) throw claimsError

    // Calculate total coverage amount
    let totalCoverage = 0
    let totalApproved = 0
    let pendingClaims = 0
    let approvedClaims = 0
    let rejectedClaims = 0

    claims.forEach((claim) => {
      totalCoverage += claim.claim_amount || 0
      totalApproved += claim.approved_amount || 0

      if (claim.status === "pending") {
        pendingClaims++
      } else if (claim.status === "approved") {
        approvedClaims++
      } else if (claim.status === "rejected") {
        rejectedClaims++
      }
    })

    // Get time series data for claims
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: timeSeriesClaims, error: timeSeriesError } = await supabase
      .from("insurance_claims")
      .select(`
        submitted_date,
        claim_amount,
        insurance_policies!inner (
          insurer_id
        )
      `)
      .eq("insurance_policies.insurer_id", insurerId)
      .gte("submitted_date", sixMonthsAgo.toISOString())
      .order("submitted_date")

    if (timeSeriesError) throw timeSeriesError

    // Process time series data by month
    const timeSeriesData = processTimeSeriesData(timeSeriesClaims)

    return {
      totalPatients: totalPatients || 0,
      totalPolicies: totalPolicies || 0,
      totalClaims: claims.length,
      totalCoverage,
      totalApproved,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      timeSeriesData,
      error: null,
    }
  } catch (error) {
    console.error(`Error fetching insurer dashboard stats for ${insurerId}:`, error)
    return {
      totalPatients: 0,
      totalPolicies: 0,
      totalClaims: 0,
      totalCoverage: 0,
      totalApproved: 0,
      pendingClaims: 0,
      approvedClaims: 0,
      rejectedClaims: 0,
      timeSeriesData: [],
      error: "Failed to fetch dashboard statistics",
    }
  }
}

/**
 * Process time series data by month
 */
function processTimeSeriesData(claims: any[]) {
  const monthlyData: Record<string, { month: string; count: number; amount: number }> = {}

  claims.forEach((claim) => {
    const date = new Date(claim.submitted_date)
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = {
        month: monthYear,
        count: 0,
        amount: 0,
      }
    }

    monthlyData[monthYear].count++
    monthlyData[monthYear].amount += claim.claim_amount || 0
  })

  // Convert to array and sort by month
  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Get patient's insurance information
 */
export async function getPatientInsuranceInfo(patientId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get patient's insurance policy
    const { data: policy, error: policyError } = await supabase
      .from("insurance_policies")
      .select(`
        *,
        insurers (
          id,
          name,
          contact_phone,
          email
        )
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (policyError) throw policyError

    // Get patient's insurance claims
    const { data: claims, error: claimsError } = await supabase
      .from("insurance_claims")
      .select(`
        *,
        insurance_policies!inner (
          id,
          patient_id
        )
      `)
      .eq("insurance_policies.patient_id", patientId)
      .order("submitted_date", { ascending: false })

    if (claimsError) throw claimsError

    return {
      policy,
      claims,
      error: null,
    }
  } catch (error) {
    console.error(`Error fetching insurance info for patient ${patientId}:`, error)
    return {
      policy: null,
      claims: [],
      error: "Failed to fetch insurance information",
    }
  }
}
