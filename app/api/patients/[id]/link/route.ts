import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { linkPatientToHospital } from "@/services/patient-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patientId = params.id
    const { hospitalId } = await request.json()

    // Validate inputs
    if (!patientId || !hospitalId) {
      return NextResponse.json({ error: "Patient ID and Hospital ID are required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user data
    const { data: userData } = await supabase.from("users").select("hospital_id").eq("id", session.user.id).single()

    // Verify user belongs to the hospital they're trying to link to
    if (!userData || userData.hospital_id !== hospitalId) {
      return NextResponse.json({ error: "Unauthorized to link patient to this hospital" }, { status: 403 })
    }

    // Link patient to hospital
    const { success, error } = await linkPatientToHospital(patientId, hospitalId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success })
  } catch (error) {
    console.error("Error linking patient to hospital:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
