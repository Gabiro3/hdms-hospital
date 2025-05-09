"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-nofitications"
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

export default function ToastNotification() {
  const { toast } = useToast()
  const { realtimeNotifications, clearRealtimeNotification } = useNotifications()

  useEffect(() => {
    if (realtimeNotifications.length > 0) {
      const notification = realtimeNotifications[0]

      // Determine toast variant based on notification type
      let variant: "default" | "destructive" | null = null
      let icon = null

      switch (notification.type) {
        case "success":
          variant = "default"
          icon = <CheckCircle className="h-5 w-5" />
          break
        case "error":
          variant = "destructive"
          icon = <AlertCircle className="h-5 w-5" />
          break
        case "warning":
          variant = null
          icon = <AlertTriangle className="h-5 w-5 text-amber-500" />
          break
        case "info":
        default:
          variant = null
          icon = <Info className="h-5 w-5 text-blue-500" />
          break
      }

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: variant || undefined,
        action: notification.action_url ? (
          <button
            onClick={() => {
              window.location.href = notification.action_url!
            }}
            className="text-blue-500 underline"
          >
            View
          </button>
        ) : undefined,
      })

      // Clear the notification from the queue
      clearRealtimeNotification(notification.id)
    }
  }, [realtimeNotifications, toast, clearRealtimeNotification])

  return null // This component doesn't render anything
}
