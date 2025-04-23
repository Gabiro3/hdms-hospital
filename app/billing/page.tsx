import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import HospitalBillingDashboard from "@/components/billing/hospital-billing-dashboard"
import { getBillingData, getInvoices } from "@/services/billing-service"
import { format, subMonths } from "date-fns"

export const metadata: Metadata = {
  title: "Billing | Hospital Diagnosis Management System",
  description: "View and manage billing information for your hospital",
}

export default async function BillingPage() {
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

  // Get billing data for the current month
  const today = new Date()
  const startDate = format(subMonths(today, 1), "yyyy-MM-dd")
  const endDate = format(today, "yyyy-MM-dd")

  const { billingData } = await getBillingData({
    hospitalId: userData.hospital_id,
    startDate,
    endDate,
  })

  // Get invoices for this hospital
  const { invoices } = await getInvoices(userData.hospital_id)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Billing Dashboard</h1>
          <p className="text-sm text-gray-500">View and manage billing information for your hospital</p>
        </div>

        <HospitalBillingDashboard
          hospitalId={userData.hospital_id}
          initialBillingData={billingData}
          initialInvoices={invoices || []}
        />
      </div>
    </DashboardLayout>
  )
}
