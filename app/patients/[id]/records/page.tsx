import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import PatientRecordsManagement from "@/components/patients/patient-records-management"
import HospitalRecords from "@/components/patients/hospital-patient-records-management"
import PatientRecordsRequest from "@/components/patients/patient-records-request"
import { getGeneralPatientById } from "@/services/patient-service"

export default async function PatientRecordsPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get authenticated user data
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("hospital_id, full_name, role")
    .eq("id", user.id)
    .single()

  if (!userData) {
    redirect("/login")
  }

  // Get patient data
  const { patient, error } = await getGeneralPatientById(params.id, userData.hospital_id)

  if (error || !patient) {
    redirect("/patients")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patient Records</h1>
          <p className="text-muted-foreground">Manage and request medical records for {patient.name}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <PatientRecordsRequest
            patientId={patient.id}
            patientName={patient.name}
            hospitalId={userData.hospital_id}
            userId={user.id}
          />

          {userData.role == "ADMIN" ? (
            <PatientRecordsManagement patientId={patient.id} hospitalId={userData.hospital_id} />
          ) : (
            <HospitalRecords patientId={patient.id} hospitalId={userData.hospital_id} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
