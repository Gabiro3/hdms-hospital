"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, MoreHorizontal, Trash2, Edit2, Save, CheckCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteConversation, updateConversationTitle } from "@/services/ai-service"

interface ConversationCardProps {
  id: string
  title: string
  lastMessage: string
  date: string
  onDelete: () => void
  onUpdate: () => void
}

export function ConversationCard({ id, title, lastMessage, date, onDelete, onUpdate }: ConversationCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation(id)
      toast({
        title: "Conversation deleted",
      variant: "destructive"})
      onDelete()
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (editTitle.trim()) {
      await updateConversationTitle(id, editTitle)
      toast({
        title: "Conversation title updated",
      variant: "default"})
      setIsEditing(false)
      onUpdate()
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditTitle(title)
    setIsEditing(false)
  }

  return (
    <Link href={`/ai-assistant/${id}`} className="block">
      <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4 h-full flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-1">
            <MessageSquare size={18} className="text-primary" />
            {isEditing ? (
              <div className="flex items-center gap-2 w-full" onClick={(e) => e.preventDefault()}>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0">
                  <CheckCircle size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0">
                  <Trash2 size={14} />
                </Button>
              </div>
            ) : (
              <h3 className="font-medium text-sm truncate">{title}</h3>
            )}
          </div>
          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal size={16} />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit2 size={14} className="mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-gray-500 text-xs line-clamp-2 flex-1">{lastMessage}</p>
        <div className="mt-2 text-xs text-gray-400">{formatDistanceToNow(new Date(date), { addSuffix: true })}</div>
      </div>
    </Link>
  )
}
