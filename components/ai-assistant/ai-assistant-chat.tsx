"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { EmptyState } from "./empty-state"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import {
  getConversationMessages,
  addMessageToConversation,
  type ChatMessage as ChatMessageType,
} from "@/services/ai-service"
import { getAIResponse } from "@/services/ai-service"

interface AIAssistantChatProps {
  conversationId: string
  initialMessages?: ChatMessageType[]
}

function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse flex flex-col gap-2">
          <div className="h-4 w-1/3 bg-gray-300 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/4 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  )
}

export function AIAssistantChat({ conversationId, initialMessages = [] }: AIAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages)
  const [loadingInitialMessages, setLoadingInitialMessages] = useState(
  initialMessages.length === 0
)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
  const loadMessages = async () => {
    if (initialMessages.length === 0 && conversationId) {
      setLoadingInitialMessages(true)
      try {
        const loadedMessages = await getConversationMessages(conversationId)
        setMessages(loadedMessages)
      } catch (error) {
        console.error("Failed to load messages", error)
      } finally {
        setLoadingInitialMessages(false)
      }
    }
  }

  loadMessages()
}, [conversationId])



  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    // Add user message to state
    const userMessage: ChatMessageType = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Save user message to database
      const savedUserMessage = await addMessageToConversation(conversationId, "user", message)

      // Generate AI response
      const aiResponse = await getAIResponse(message)

      // Save AI response to database
      const savedAIMessage = await addMessageToConversation(
        conversationId,
        "assistant",
        aiResponse.text,
        aiResponse.sources,
      )

      // Update messages with saved messages
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMessage.id),
        savedUserMessage as ChatMessageType,
        savedAIMessage as ChatMessageType,
      ])
    } catch (error) {
      console.error("Error sending message:", error)
      // Handle error (e.g., show error message)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 overflow-y-auto">
        {loadingInitialMessages ? (
  <ChatSkeleton />
) : messages.length === 0 ? (
  <EmptyState onStartNewConversation={(message) => handleSendMessage(message || "")} />
) : (
  <div>
    {messages.map((message) => (
      <ChatMessage
        key={message.id}
        role={message.role}
        content={message.content}
        id={message.id}
        sources={message.sources}
        code={message.code}
      />
    ))}
    {isLoading && <ChatMessage role="assistant" content="" isLoading={true} />}
    <div ref={messagesEndRef} />
  </div>
)}

      </div>

      <div className="border-t p-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  )
}
