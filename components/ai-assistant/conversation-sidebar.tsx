"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquarePlus, Search, Trash2, Edit2, Check, X, MessageSquare } from "lucide-react"
import {
  getUserConversations,
  deleteConversation,
  updateConversationTitle,
  type Conversation,
} from "@/services/ai-service"

interface ConversationSidebarProps {
  userId: string
  currentConversationId?: string
  onNewConversation: () => void
}

export function ConversationSidebar({ userId, currentConversationId, onNewConversation }: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadConversations()
  }, [userId])

  const loadConversations = async () => {
    setIsLoading(true)
    const data = await getUserConversations(userId)
    setConversations(data)
    setIsLoading(false)
  }

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation(id)

      // If we deleted the current conversation, redirect to a new one
      if (id === currentConversationId) {
        onNewConversation()
      } else {
        // Otherwise just refresh the list
        loadConversations()
      }
    }
  }

  const startEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(id)
    setEditTitle(title)
  }

  const cancelEditing = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(null)
  }

  const saveTitle = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (editTitle.trim()) {
      await updateConversationTitle(id, editTitle)
      setEditingId(null)
      loadConversations()
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-md py-2 px-4 font-medium"
        >
          <MessageSquarePlus size={16} />
          <span>New chat</span>
        </Button>
      </div>

      <div className="px-4 mb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/ai-assistant/${conversation.id}`}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                  conversation.id === currentConversationId ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare
                    size={16}
                    className={conversation.id === currentConversationId ? "text-primary" : "text-gray-500"}
                  />

                  {editingId === conversation.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{conversation.title}</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {editingId === conversation.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => saveTitle(conversation.id, e)}
                      >
                        <Check size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEditing}>
                        <X size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => startEditing(conversation.id, conversation.title, e)}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-red-500"
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
