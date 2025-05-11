"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./chat-message"
import { getAIResponse, type Source } from "@/services/ai-service"
import { Send, X } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: Source[]
}

interface ChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
}

const EXAMPLE_QUESTIONS = [
  "What are the latest guidelines for treating hypertension?",
  "Explain the differential diagnosis for chest pain",
  "What are the common drug interactions with warfarin?",
  "Summarize recent research on Alzheimer's treatment",
]

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    // Show loading state
    setIsLoading(true)

    try {
      // Add placeholder for assistant message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          sources: [],
        },
      ])

      // Get response from AI
      const response = await getAIResponse(userMessage)

      // Update the assistant message with the response
      setMessages((prev) => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: response.text,
          sources: response.sources,
        }
        return newMessages
      })
    } catch (error) {
      console.error("Error getting AI response:", error)

      // Update with error message
      setMessages((prev) => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: "I apologize, but I encountered an error while processing your request. Please try again later.",
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-medium">AI</span>
            </div>
            <h2 className="font-semibold text-lg">MedGPT</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-medium">AI</span>
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">How can I help you today?</h3>
            <p className="text-gray-500 text-center mb-6">
              Ask me about medical conditions, treatments, research, or guidelines.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
              {EXAMPLE_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4 text-left w-full whitespace-normal break-words"
                  onClick={() => handleExampleClick(question)}
                >
                  {question}
                </Button>

              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="divide-y w-[95%] overflow-x-auto">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                  isLoading={isLoading && index === messages.length - 1 && message.role === "assistant"}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t">
  <div className="flex gap-2">
    <Input
      ref={inputRef}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Ask a medical question..."
      className="flex-1 mb-2"
      disabled={isLoading}
    />
    <Button type="submit" disabled={!input.trim() || isLoading}>
      <Send className="h-4 w-4" />
    </Button>
  </div>
  
  {/* Warning message */}
  <p className="text-xs text-gray-500 mt-2">
    ⚠️ MedGPT can make mistakes. Check important info.
  </p>
</form>

      </div>
    </div>
  )
}
