import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { ChevronLeft } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { AIAssistantChat } from "@/components/ai-assistant/ai-assistant-chat"
import { Button } from "@/components/ui/button"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { getConversation } from "@/services/ai-service"

export const metadata: Metadata = {
  title: "AI Assistant | Hospital Diagnosis System",
  description: "Get medical information and assistance from our AI assistant",
}

interface AIAssistantPageProps {
  params: {
    id: string
  }
}

export default async function AIAssistantConversationPage({ params }: AIAssistantPageProps) {
  const { id } = params

  // Check if user is authenticated
  const supabase = createServerComponentClient({ cookies })

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

  // Check if conversation exists and belongs to the user
  const conversation = await getConversation(id)

  if (!conversation || conversation.user_id !== user?.id) {
    return notFound()
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="border-b p-4 flex items-center">
          <Link href="/ai-assistant">
            <Button variant="ghost" size="icon" className="mr-2">
              <ChevronLeft size={20} />
              <span className="sr-only">Back to conversations</span>
            </Button>
          </Link>
          <h1 className="text-lg font-medium truncate">{conversation.title}</h1>
        </div>
        <div className="flex-1 relative">
          <AIAssistantChat conversationId={id} />
        </div>
      </div>
    </DashboardLayout>
  )
}
