"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConversationCard } from "./conversation-card"
import { getUserConversations, getConversationMessages, createConversation } from "@/services/ai-service"

interface ConversationGridProps {
  userId: string
}

export function ConversationGrid({ userId }: ConversationGridProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadConversations()
  }, [userId])

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const conversationsData = await getUserConversations(userId)

      // Get the last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        conversationsData.map(async (conversation) => {
          const messages = await getConversationMessages(conversation.id)
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null

          return {
            ...conversation,
            lastMessage: lastMessage
              ? lastMessage.role === "user"
                ? `You: ${lastMessage.content}`
                : `AI: ${lastMessage.content}`
              : "No messages yet",
          }
        }),
      )

      setConversations(conversationsWithLastMessage)
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation(userId)
      if (newConversation) {
        router.push(`/ai-assistant/${newConversation.id}`)
      }
    } catch (error) {
      console.error("Error creating new conversation:", error)
    }
  }

  const handleDelete = () => {
    loadConversations()
  }

  const handleUpdate = () => {
    loadConversations()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Conversations</h1>
        <Button onClick={handleNewConversation} className="flex items-center gap-2">
          <PlusCircle size={16} />
          New Conversation
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse"></div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No conversations yet</h3>
          <p className="text-gray-500 mb-6">Start a new conversation to get help from our AI assistant</p>
          <Button onClick={handleNewConversation} className="flex items-center gap-2">
            <PlusCircle size={16} />
            Start your first conversation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              id={conversation.id}
              title={conversation.title}
              lastMessage={conversation.lastMessage}
              date={conversation.updated_at}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
