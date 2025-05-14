import { type NextRequest, NextResponse } from "next/server"
import { getGeneralPatientPrescriptions } from "@/services/prescription-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get prescriptions for the patient
    const { prescriptions, error } = await getGeneralPatientPrescriptions(params.id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ prescriptions })
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
