
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { ConversationGrid } from "@/components/ai-assistant/conversation-grid"

export const metadata: Metadata = {
  title: "AI Assistant | Hospital Diagnosis System",
  description: "Get medical information and assistance from our AI assistant",
}

export default async function AIAssistantPage() {
  // Check if user is authenticated
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

  return (
    <DashboardLayout>
      <ConversationGrid userId={user.id} />
    </DashboardLayout>
  )
}
