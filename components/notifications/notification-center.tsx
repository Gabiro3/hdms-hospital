"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import NotificationDialog from "./notification-dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

export default function NotificationCenter({ userId }: { userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!userId) return

    // Get initial unread count
    const fetchUnreadCount = async () => {
      try {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_read", false)

        setUnreadCount(count || 0)
      } catch (error) {
        console.error("Error fetching unread notifications count:", error)
      }
    }

    fetchUnreadCount()

    // Subscribe to new notifications
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
          setUnreadCount((prev) => prev + 1)
          setHasNewNotifications(true)

          // Play notification sound
          const audio = new Audio("/notification-sound.mp3")
          audio.volume = 0.5
          audio.play().catch((e) => console.log("Audio play prevented by browser policy"))
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId} AND is_read=eq.true`,
        },
        () => {
          // Refresh unread count when notifications are marked as read
          fetchUnreadCount()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
    setHasNewNotifications(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={`relative ${hasNewNotifications ? "animate-pulse" : ""}`}
        onClick={handleOpenDialog}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userId={userId}
        onNotificationRead={() => {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }}
        onMarkAllRead={() => {
          setUnreadCount(0)
        }}
      />
    </>
  )
}
