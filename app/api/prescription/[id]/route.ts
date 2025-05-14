import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const prescriptionId = params.id

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const shareCode = searchParams.get("shareCode")
    const patientName = searchParams.get("patientName")

    // Validate required parameters
    if (!shareCode || !patientName) {
      return NextResponse.json({ error: "Missing required parameters: shareCode and patientName" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get the prescription
    const { data: prescription, error: prescriptionError } = await supabase
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
      .single()

    if (prescriptionError || !prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 })
    }

    // Get the patient information
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, name, patient_id")
      .eq("id", prescription.patient_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Verify patient name
    if (patient.name.toLowerCase() !== patientName.toLowerCase()) {
      return NextResponse.json({ error: "Invalid patient name" }, { status: 403 })
    }

    // Verify share code
    if (prescription.share_code !== shareCode) {
      return NextResponse.json({ error: "Invalid share code" }, { status: 403 })
    }

    // Check if share code is expired
    if (prescription.share_code_expiry) {
      const expiryTime = new Date(prescription.share_code_expiry).getTime()
      const currentTime = new Date().getTime()

      if (currentTime > expiryTime) {
        return NextResponse.json({ error: "Share code has expired" }, { status: 403 })
      }
    }

    // Get the hospital information
    const { data: hospital, error: hospitalError } = await supabase
      .from("hospitals")
      .select("id, name, address, phone, email")
      .eq("id", prescription.hospital_id)
      .single()

    if (hospitalError) {
      console.error("Error fetching hospital:", hospitalError)
    }

    // Log access
    try {
      await supabase.from("prescription_access_logs").insert({
        prescription_id: prescriptionId,
        access_type: "share_code",
        accessed_at: new Date().toISOString(),
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      })
    } catch (e) {
      console.error("Error logging prescription access:", e)
    }

    // Return prescription data
    return NextResponse.json({
      prescription: {
        ...prescription,
        patient: {
          id: patient.id,
          name: patient.name,
          patient_id: patient.patient_id,
        },
        hospital: hospital || null,
      },
    })
  } catch (error) {
    console.error("Error accessing prescription:", error)
    return NextResponse.json({ error: "Failed to access prescription" }, { status: 500 })
  }
}
