"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Info, CheckCircle, AlertTriangle, AlertCircle, Settings, FileText, User, X } from "lucide-react"
import { useNotifications } from "@/hooks/use-nofitications"
import { markNotificationAsRead } from "@/services/notification-service"

interface ToastProps {
  id: string
  title: string
  message: string
  type: string
  action_url?: string
  onClose: () => void
  style?: React.CSSProperties
}

function Toast({ id, title, message, type, action_url, onClose, style }: ToastProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow time for exit animation
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const handleClick = async () => {
    try {
      // Mark as read
      await markNotificationAsRead(id)

      // Navigate if there's an action URL
      if (action_url) {
        router.push(action_url)
      }

      onClose()
    } catch (error) {
      console.error("Error handling notification click:", error)
    }
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
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full transform transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${action_url ? "cursor-pointer" : ""}`}
      onClick={action_url ? handleClick : undefined}
      style={style}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
        </div>
        <button
          type="button"
          className="ml-4 flex-shrink-0 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          <span className="sr-only">Close</span>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default function ToastNotification() {
  const { realtimeNotifications, clearRealtimeNotification } = useNotifications()
  const [visibleNotifications, setVisibleNotifications] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // When new notifications arrive, mark them as visible
    realtimeNotifications.forEach((notification: { id: string | number }) => {
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

  // Only show up to 3 most recent notifications
  const notificationsToShow = realtimeNotifications
    .filter((notification: { id: string | number }) => visibleNotifications[notification.id])
    .slice(0, 3)

  if (notificationsToShow.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notificationsToShow.map((notification, index: number) => (
        <Toast
          key={notification.id}
          id={notification.id as string}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          action_url={notification.action_url}
          onClose={() => handleClose(notification.id as string)}
          style={{ zIndex: 50 - index }} // Stack notifications with proper z-index
        />
      ))}
    </div>
  )
}
