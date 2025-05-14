import { type NextRequest, NextResponse } from "next/server"
import { getGeneralPatientPrescriptions } from "@/services/prescription-service"
import { createServerComponentClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { share_code: string } }) {
  try {
    const { share_code } = params
    const supabase = await createServerComponentClient()

    // Fetch patient details using the share_code
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("share_code", share_code)

    if (patientError || !patient) {
      return NextResponse.json({ error: "Patient not found or invalid share code" }, { status: 404 })
    }

    // Fetch prescriptions for the patient using their ID
    const { prescriptions, error: prescriptionsError } = await getGeneralPatientPrescriptions(patient[0].id)

    if (prescriptionsError) {
      return NextResponse.json({ error: prescriptionsError }, { status: 500 })
    }

    return NextResponse.json({ prescriptions })
  } catch (error) {
    console.error("Error fetching patient data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
