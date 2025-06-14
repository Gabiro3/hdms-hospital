import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import DashboardLayout from "@/components/layout/dashboard-layout"
import NewPatientContent from "@/components/patients/new-patient-content"

export default async function NewPatientPage() {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Patient</h1>
          <p className="text-muted-foreground">Create a new patient record or link an existing patient</p>
        </div>

        <NewPatientContent hospitalId={userData.hospital_id} userId={user.id} doctorName={userData.full_name} />
      </div>
    </DashboardLayout>
  )
}
