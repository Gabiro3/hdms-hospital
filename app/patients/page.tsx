import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import PatientsList from "@/components/patients/patients-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Patients | Hospital Diagnosis Management System",
  description: "View and manage patients in the Hospital Diagnosis Management System",
}

export default async function PatientsPage() {
  const supabase = createServerComponentClient({ cookies })

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
    redirect("/login")
  }

  return (
    <DashboardLayout>
  <div className="space-y-6">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Patients</h1>
        <p className="text-sm text-gray-500">View and manage patients in your hospital</p>
      </div>
      <Link href="/patients/new">
        <Button className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Patient Record
        </Button>
      </Link>
    </div>

    <PatientsList hospitalId={userData.hospital_id} />
  </div>
</DashboardLayout>

  )
}
