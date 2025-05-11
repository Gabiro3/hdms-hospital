"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "system" | "lab_result" | "diagnosis" | "patient"
  is_read: boolean
  created_at: string
  metadata?: Record<string, any>
  action_url?: string
}

interface NotificationsContextType {
  notifications: Notification[]
  realtimeNotifications: Notification[]
  unreadCount: number
  refreshNotifications: () => Promise<void>
  clearRealtimeNotification: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [realtimeNotifications, setRealtimeNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get current user
    const supabase = getSupabaseBrowserClient()

    const getUserId = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUserId(data.user.id)
      }
    }

    getUserId()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setUserId(null)
        setNotifications([])
        setRealtimeNotifications([])
        setUnreadCount(0)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    // Initial fetch
    refreshNotifications()

    // Set up real-time subscription
    const supabase = getSupabaseBrowserClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification

          // Add to real-time notifications for toast display
          setRealtimeNotifications((prev) => [newNotification, ...prev])

          // Also add to regular notifications list
          setNotifications((prev) => [newNotification, ...prev])

          // Update unread count
          setUnreadCount((prev) => prev + 1)

          // Play notification sound if available
          try {
            const audio = new Audio("/notification-sound.mp3")
            audio.volume = 0.5
            audio.play().catch((e) => console.log("Audio play prevented by browser policy"))
          } catch (e) {
            // Ignore errors with audio
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification

          // Update in notifications list
          setNotifications((prev) => prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)))

          // If marked as read, update unread count
          if (updatedNotification.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const refreshNotifications = async () => {
    if (!userId) return

    try {
      const supabase = getSupabaseBrowserClient()

      // Get unread count
      const { count: unreadCountResult } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)

      setUnreadCount(unreadCountResult || 0)

      // Get recent notifications
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data)
      }
    } catch (error) {
      console.error("Error refreshing notifications:", error)
    }
  }

  const clearRealtimeNotification = (id: string) => {
    setRealtimeNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        realtimeNotifications,
        unreadCount,
        refreshNotifications,
        clearRealtimeNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
