"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "system" | "lab_result" | "diagnosis" | "patient" | "radiology"
  is_read: boolean
  created_at: string
  metadata?: Record<string, any>
  action_url?: string
}

interface NotificationSound {
  enabled: boolean
  volume: number
  soundName: string
}

interface NotificationsContextType {
  notifications: Notification[]
  realtimeNotifications: Notification[]
  unreadCount: number
  refreshNotifications: () => Promise<void>
  clearRealtimeNotification: (id: string) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  notificationSound: NotificationSound
  updateNotificationSound: (settings: Partial<NotificationSound>) => void
  playTestSound: () => void
}

const DEFAULT_SOUND_SETTINGS: NotificationSound = {
  enabled: true,
  volume: 0.5,
  soundName: "notification-bell.mp3",
}

const AVAILABLE_SOUNDS = [
  { name: "Bell", value: "notification-bell.mp3" },
  { name: "Subtle", value: "notification-subtle.mp3" },
  { name: "Chime", value: "notification-chime.mp3" },
]

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [realtimeNotifications, setRealtimeNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [notificationSound, setNotificationSound] = useState<NotificationSound>(() => {
    // Try to load from localStorage if available
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("notificationSoundSettings")
      if (savedSettings) {
        try {
          return JSON.parse(savedSettings)
        } catch (e) {
          console.error("Error parsing notification sound settings:", e)
        }
      }
    }
    return DEFAULT_SOUND_SETTINGS
  })

  const supabaseRef = useRef(createClientComponentClient())
  const channelRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(`/sounds/${notificationSound.soundName}`)
      audioRef.current.volume = notificationSound.volume
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [notificationSound.soundName, notificationSound.volume])

  // Save notification sound settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("notificationSoundSettings", JSON.stringify(notificationSound))
    }
  }, [notificationSound])

  // Function to play notification sound
  const playNotificationSound = () => {
    if (!notificationSound.enabled || !audioRef.current) return

    try {
      // Reset the audio to the beginning
      audioRef.current.currentTime = 0
      audioRef.current.volume = notificationSound.volume

      // Play the sound with proper error handling
      audioRef.current.play().catch((error) => {
        console.log("Error playing notification sound:", error)
        // This is likely due to browser autoplay restrictions
        // We'll just silently fail as this is not critical functionality
      })
    } catch (error) {
      console.error("Error playing notification sound:", error)
    }
  }

  // Function to update notification sound settings
  const updateNotificationSound = (settings: Partial<NotificationSound>) => {
    setNotificationSound((prev) => {
      const updated = { ...prev, ...settings }

      // Update audio element if it exists
      if (audioRef.current) {
        audioRef.current.volume = updated.volume

        // If sound name changed, update the source
        if (settings.soundName && settings.soundName !== prev.soundName) {
          audioRef.current.src = `/sounds/${settings.soundName}`
        }
      }

      return updated
    })
  }

  // Function to play a test sound
  const playTestSound = () => {
    if (!audioRef.current) return

    try {
      audioRef.current.currentTime = 0
      audioRef.current.volume = notificationSound.volume
      audioRef.current.play().catch((error) => {
        console.log("Error playing test sound:", error)
      })
    } catch (error) {
      console.error("Error playing test sound:", error)
    }
  }

  // Function to fetch notifications
  const fetchNotifications = async (uid: string) => {
    try {
      const supabase = supabaseRef.current

      // Get unread count
      const { count: unreadCountResult, error: countError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("is_read", false)

      if (countError) {
        console.error("Error fetching unread count:", countError)
        return
      }

      setUnreadCount(unreadCountResult || 0)

      // Get recent notifications
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching notifications:", error)
        return
      }

      if (data) {
        setNotifications(data)
      }
    } catch (error) {
      console.error("Error in fetchNotifications:", error)
    }
  }

  // Setup auth state and initial data fetch
  useEffect(() => {
    const supabase = supabaseRef.current

    const setupUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const currentUser = data?.user

        if (currentUser?.id) {
          setUserId(currentUser.id)
          await fetchNotifications(currentUser.id)
        }
      } catch (error) {
        console.error("Error in setupUser:", error)
      }
    }

    setupUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id)
        await fetchNotifications(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setUserId(null)
        setNotifications([])
        setRealtimeNotifications([])
        setUnreadCount(0)

        // Clean up channel subscription
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Setup real-time subscription when userId changes
  useEffect(() => {
    if (!userId) return

    const supabase = supabaseRef.current

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Create a new channel with proper error handling
    try {
      const channel = supabase
        .channel(`notifications-${userId}-${Date.now()}`) // Unique channel name
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("New notification received:", payload.new)
            const newNotification = payload.new as Notification

            // Update both notification lists
            setRealtimeNotifications((prev) => [newNotification, ...prev])
            setNotifications((prev) => {
              // Check if notification already exists to prevent duplicates
              const exists = prev.some((n) => n.id === newNotification.id)
              if (exists) return prev
              return [newNotification, ...prev]
            })

            // Update unread count
            setUnreadCount((prev) => prev + 1)

            // Play notification sound
            playNotificationSound()
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
            console.log("Notification updated:", payload.new)
            const updatedNotification = payload.new as Notification

            // Update in notifications list
            setNotifications((prev) => prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)))

            // Also update in realtime notifications if present
            setRealtimeNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)),
            )

            // If marked as read, update unread count
            if (updatedNotification.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1))
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Notification deleted:", payload.old)
            const deletedNotification = payload.old as Notification

            // Remove from both notification lists
            setNotifications((prev) => prev.filter((n) => n.id !== deletedNotification.id))

            setRealtimeNotifications((prev) => prev.filter((n) => n.id !== deletedNotification.id))

            // Update unread count if needed
            if (!deletedNotification.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1))
            }
          },
        )
        .subscribe((status) => {
          console.log(`Subscription status for notifications: ${status}`)
          if (status === "SUBSCRIBED") {
            console.log("Successfully subscribed to notifications")
          } else if (status === "CHANNEL_ERROR") {
            console.error("Error subscribing to notifications channel")
            // Attempt to reconnect after a delay
            setTimeout(() => {
              if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
                // The next useEffect run will recreate the channel
              }
            }, 5000)
          }
        })

      channelRef.current = channel

      // Log channel status for debugging
      console.log("Channel created:", channel)
    } catch (error) {
      console.error("Error setting up real-time subscription:", error)
    }

    return () => {
      // Clean up on unmount or userId change
      if (channelRef.current) {
        console.log("Removing channel subscription")
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId])

  const refreshNotifications = async () => {
    if (!userId) return
    await fetchNotifications(userId)
  }

  const clearRealtimeNotification = (id: string) => {
    setRealtimeNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const markAsRead = async (id: string) => {
    if (!userId) return

    try {
      const supabase = supabaseRef.current

      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      if (error) {
        console.error("Error marking notification as read:", error)
        return
      }

      // Update local state immediately for better UX
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))

      setRealtimeNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))

      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error in markAsRead:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return

    try {
      const supabase = supabaseRef.current

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (error) {
        console.error("Error marking all notifications as read:", error)
        return
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

      setRealtimeNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

      setUnreadCount(0)
    } catch (error) {
      console.error("Error in markAllAsRead:", error)
    }
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        realtimeNotifications,
        unreadCount,
        refreshNotifications,
        clearRealtimeNotification,
        markAsRead,
        markAllAsRead,
        notificationSound,
        updateNotificationSound,
        playTestSound,
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

export { AVAILABLE_SOUNDS }
