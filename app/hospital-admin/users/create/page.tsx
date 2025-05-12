import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import CreateUserForm from "@/components/hospital-admin/create-user-form"

export const metadata: Metadata = {
  title: "Create User | Hospital Diagnosis Management System",
  description: "Create a new user in the Hospital Diagnosis Management System",
}

export default async function CreateUserPage() {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user data and check if admin
  const { data: userData } = await supabase.from("users").select("id, is_admin, hospital_id").eq("id", session.user.id).single()

  if (!userData || !userData.is_admin) {
    redirect("/unauthorized")
  }

  // Get hospitals for the form
  const { data: hospitals } = await supabase.from("hospitals").select("id, name, code").eq("id", userData.hospital_id).order("name")

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <CreateUserForm hospitals={hospitals || []} userId={userData.id} />
      </div>
    </DashboardLayout>
  )
}
