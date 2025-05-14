"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Settings,
  FileText,
  User,
  X,
  ImageIcon,
} from "lucide-react"
import { useNotifications } from "@/hooks/use-nofitications"
import { formatDistanceToNow } from "date-fns"

interface ToastProps {
  id: string
  title: string
  message: string
  type: string
  action_url?: string
  created_at: string
  onClose: () => void
  onRead: () => void
}

function Toast({ id, title, message, type, action_url, created_at, onClose, onRead }: ToastProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Set timeout to hide the toast after 5 seconds
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
      // Allow time for exit animation before removing
      setTimeout(onClose, 300)
    }, 5000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [onClose])

  const handleClick = () => {
    // Mark as read
    onRead()

    // Navigate if there's an action URL
    if (action_url) {
      router.push(action_url)
    }

    // Close the toast
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  // Reset the timeout when user hovers over the toast
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  // Restart the timeout when user leaves the toast
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 5000)
  }

  const getIcon = () => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "system":
        return <Settings className="h-5 w-5 text-purple-500" />
      case "lab_result":
        return <FileText className="h-5 w-5 text-cyan-500" />
      case "diagnosis":
        return <FileText className="h-5 w-5 text-indigo-500" />
      case "patient":
        return <User className="h-5 w-5 text-teal-500" />
      case "radiology":
        return <ImageIcon className="h-5 w-5 text-pink-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full transform transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${action_url ? "cursor-pointer" : ""}`}
      onClick={action_url ? handleClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
          <p className="mt-1 text-xs text-gray-400">{formatDistanceToNow(new Date(created_at), { addSuffix: true })}</p>
        </div>
        <button
          type="button"
          className="ml-4 flex-shrink-0 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={handleCloseClick}
        >
          <span className="sr-only">Close</span>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default function ToastNotification() {
  const { realtimeNotifications, clearRealtimeNotification, markAsRead } = useNotifications()
  const [visibleNotifications, setVisibleNotifications] = useState<Record<string, boolean>>({})

  // When new notifications arrive, mark them as visible
  useEffect(() => {
    realtimeNotifications.forEach((notification) => {
      if (!visibleNotifications[notification.id]) {
        setVisibleNotifications((prev) => ({
          ...prev,
          [notification.id]: true,
        }))
      }
    })
  }, [realtimeNotifications, visibleNotifications])

  const handleClose = (id: string) => {
    setVisibleNotifications((prev) => ({
      ...prev,
      [id]: false,
    }))

    // Allow animation to complete before removing from state
    setTimeout(() => {
      clearRealtimeNotification(id)
    }, 300)
  }

  const handleRead = async (id: string) => {
    await markAsRead(id)
  }

  // Only show up to 3 most recent notifications
  const notificationsToShow = realtimeNotifications
    .filter((notification) => visibleNotifications[notification.id])
    .slice(0, 3)

  if (notificationsToShow.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notificationsToShow.map((notification, index) => (
        <Toast
          key={notification.id}
          id={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          action_url={notification.action_url}
          created_at={notification.created_at}
          onClose={() => handleClose(notification.id)}
          onRead={() => handleRead(notification.id)}
        />
      ))}
    </div>
  )
}
