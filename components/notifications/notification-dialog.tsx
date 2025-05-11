"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Settings,
  FileText,
  User,
  Clock,
  Check,
} from "lucide-react"
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notification-service"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface NotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onNotificationRead?: () => void
  onMarkAllRead?: () => void
}

interface Notification {
  id?: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "system" | "lab_result" | "diagnosis" | "patient"
  is_read?: boolean
  created_at?: string
  action_url?: string
  metadata?: Record<string, any>
}

export default function NotificationDialog({
  open,
  onOpenChange,
  userId,
  onNotificationRead,
  onMarkAllRead,
}: NotificationDialogProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (open && userId) {
      fetchNotifications()
    }
  }, [open, userId, activeTab])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const options: any = { limit: 50 }

      if (activeTab === "unread") {
        options.unreadOnly = true
      } else if (activeTab !== "all") {
        options.type = activeTab
      }

      const { notifications, count } = await getUserNotifications(userId, options)
      setNotifications(notifications)

      // Update unread count
      if (activeTab === "all") {
        setUnreadCount(notifications.filter((n) => !n.is_read).length)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      if (onMarkAllRead) {
        onMarkAllRead()
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id || '')
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
        if (onNotificationRead) {
          onNotificationRead()
        }
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      router.push(notification.action_url)
      onOpenChange(false)
    }
  }

  const getNotificationIcon = (type: string) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
                Mark all as read
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="lab_result">Lab</TabsTrigger>
            <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="mb-4 p-3 border rounded-md">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                    </div>
                  ))
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Bell className="h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium">No notifications</h3>
                  <p className="text-sm text-gray-500">
                    {activeTab === "all"
                      ? "You don't have any notifications yet."
                      : activeTab === "unread"
                        ? "You don't have any unread notifications."
                        : `You don't have any ${activeTab} notifications.`}
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`mb-4 p-3 border rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${
                      !notification.is_read ? "border-blue-200 bg-blue-50 hover:bg-blue-100" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {!notification.is_read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(notification.created_at || ''), { addSuffix: true })}

                          {notification.is_read && (
                            <span className="flex items-center ml-3">
                              <Check className="h-3 w-3 mr-1" />
                              Read
                            </span>
                          )}

                          {notification.action_url && <span className="ml-auto text-blue-500">View details</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
