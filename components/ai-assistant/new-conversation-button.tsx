"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquarePlus } from "lucide-react"

interface NewConversationButtonProps {
  userId: string
}

export function NewConversationButton({ userId }: NewConversationButtonProps) {
  const router = useRouter()

  const handleNewConversation = () => {
    router.push("/ai-assistant")
  }

  return (
    <Button
      onClick={handleNewConversation}
      className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-md py-2 px-4 font-medium"
    >
      <MessageSquarePlus size={16} />
      <span>New chat</span>
    </Button>
  )
}
