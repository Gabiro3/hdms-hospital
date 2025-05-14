import type { Metadata } from "next"
import { requirePatientAuth, getPatientData } from "@/lib/patient-auth"
import PatientDashboard from "@/components/patient-portal/patient-dashboard"

export const metadata: Metadata = {
  title: "Patient Dashboard | Hospital Diagnosis Management System",
  description: "View your medical information",
}

export default async function PatientDashboardPage() {
  // Ensure patient is authenticated
  await requirePatientAuth()

  // Get patient data
  const { patient } = await getPatientData()

  if (!patient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Error Loading Dashboard</h1>
          <p className="mt-2 text-gray-600">Unable to load your patient information. Please try again later.</p>
        </div>
      </div>
    )
  }

  return <PatientDashboard patient={patient} />
}
