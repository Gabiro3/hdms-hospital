import { type NextRequest, NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@/lib/supabase/server"
import { getPatientPrescriptions } from "@/services/prescription-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerComponentClient()
    
      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession()
    
      if (!session) {
        redirect("/login")
      }

    // Get user data
    const { data: userData } = await supabase.from("users").select("hospital_id").eq("id", session.user.id).single()

    if (!userData) {
      return NextResponse.json({ error: "User data not found" }, { status: 404 })
    }

    // Get prescriptions for the patient
    const { prescriptions, error } = await getPatientPrescriptions(params.id, userData.hospital_id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ prescriptions })
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
