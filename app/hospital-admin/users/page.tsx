import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { fetchHospitalUsers } from "@/services/hospital-admin-service"
import UsersManagement from "@/components/hospital-admin/users-management"
import DashboardLayout from "@/components/layout/dashboard-layout"

export const metadata: Metadata = {
  title: "User Management | Hospital Admin",
  description: "Manage hospital users, roles, and permissions",
}

export default async function HospitalUsersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user data and check if hospital admin
  const { data: userData } = await supabase
    .from("users")
    .select("is_hpadmin, hospital_id")
    .eq("id", session.user.id)
    .single()

  if (!userData || !userData.is_hpadmin) {
    redirect("/dashboard")
  }

  // Parse search params
  const page = searchParams.page ? Number.parseInt(searchParams.page as string) : 1
  const limit = searchParams.limit ? Number.parseInt(searchParams.limit as string) : 10
  const search = searchParams.search as string | undefined
  const role = searchParams.role as string | undefined
  const filter = searchParams.filter as string | undefined

  // Set isDisabled and isAdmin based on filter
  let isDisabled: boolean | undefined
  let isAdmin: boolean | undefined

  if (filter === "disabled") {
    isDisabled = true
  } else if (filter === "active") {
    isDisabled = false
  } else if (filter === "admin") {
    isAdmin = true
  }

  // Fetch users
  const usersData = await fetchHospitalUsers(userData.hospital_id, {
    page,
    limit,
    search,
    role,
    isDisabled,
    isAdmin,
  })

  return (
    <DashboardLayout>
    <UsersManagement
      initialUsers={usersData.users}
      totalUsers={usersData.total}
      totalPages={usersData.totalPages}
      currentPage={page}
      hospitalId={userData.hospital_id}
      adminId={session.user.id}
    />
    </DashboardLayout>
  )
}
