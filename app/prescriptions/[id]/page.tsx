import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import PrescriptionDetail from "@/components/prescriptions/prescription-detail"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getPrescriptionById } from "@/services/prescription-service"

export const metadata: Metadata = {
  title: "Prescription Details | Hospital Diagnosis Management System",
  description: "View prescription details",
}

export default async function PrescriptionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  // Wait for the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Wait for user data
  const { data: userData } = await supabase
    .from("users")
    .select("hospital_id, role")
    .eq("id", session.user.id)
    .single()

  if (!userData) {
    redirect("/login")
  }

  const { prescription, error } = await getPrescriptionById(
    params.id,
    userData.hospital_id
  )

  const { data: hospitalData, error: hospitalError } = await supabase
    .from("hospitals")
    .select("name, address")
    .eq("id", userData.hospital_id)
    .single()

  if (!prescription || error || !hospitalData || hospitalError) {
    notFound()
  }

  prescription.hospital = hospitalData

  return (
    <DashboardLayout>
      <PrescriptionDetail prescription={prescription} />
    </DashboardLayout>
  )
}
