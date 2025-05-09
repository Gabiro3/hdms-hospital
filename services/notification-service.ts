"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getUserById } from "./user-service"

export interface Notification {
  id?: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "system" | "lab_result" | "diagnosis" | "patient"
  is_read?: boolean
  created_at?: string
  metadata?: Record<string, any>
  action_url?: string
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
    type?: string
  } = {},
): Promise<{ notifications: Notification[]; count: number; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient()
    const { limit = 50, offset = 0, unreadOnly = false, type } = options

    // Build the query
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add filters if provided
    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    if (type) {
      query = query.eq("type", type)
    }

    const { data, count, error } = await query

    if (error) throw error

    return {
      notifications: data as Notification[],
      count: count || 0,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching user notifications:", error)
    return { notifications: [], count: 0, error: "Failed to fetch notifications" }
  }
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  notification: Omit<Notification, "id" | "created_at" | "is_read">,
): Promise<{ notification: Notification | null; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        ...notification,
        is_read: false,
      })
      .select()
      .single()

    if (error) throw error

    return { notification: data as Notification, error: null }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { notification: null, error: "Failed to create notification" }
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error: "Failed to mark all notifications as read" }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error: "Failed to delete notification" }
  }
}

/**
 * Create a lab result sharing notification for a doctor
 */
export async function createLabResultSharingNotification(
  doctorId: string,
  labResultId: string,
  patientName: string,
  sharedByUserId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get the user who shared the lab result
    const { user: sharedByUser, error: userError } = await getUserById(sharedByUserId)

    if (userError || !sharedByUser) {
      throw new Error(userError || "User not found")
    }

    // Create the notification
    const { error } = await createNotification({
      user_id: doctorId,
      title: "New Lab Result Shared",
      message: `${sharedByUser.full_name} shared lab results for patient ${patientName} with you.`,
      type: "lab_result",
      metadata: {
        lab_result_id: labResultId,
        patient_name: patientName,
        shared_by: {
          id: sharedByUserId,
          name: sharedByUser.full_name,
        },
      },
      action_url: `/lab/${labResultId}`,
    })

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error("Error creating lab result sharing notification:", error)
    return { success: false, error: "Failed to create lab result sharing notification" }
  }
}

/**
 * Create a diagnosis sharing notification for a doctor
 */
export async function createDiagnosisSharingNotification(
  doctorId: string,
  diagnosisId: string,
  patientName: string,
  sharedByUserId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get the user who shared the diagnosis
    const { user: sharedByUser, error: userError } = await getUserById(sharedByUserId)

    if (userError || !sharedByUser) {
      throw new Error(userError || "User not found")
    }

    // Create the notification
    const { error } = await createNotification({
      user_id: doctorId,
      title: "New Diagnosis Shared",
      message: `${sharedByUser.full_name} shared a diagnosis for patient ${patientName} with you.`,
      type: "diagnosis",
      metadata: {
        diagnosis_id: diagnosisId,
        patient_name: patientName,
        shared_by: {
          id: sharedByUserId,
          name: sharedByUser.full_name,
        },
      },
      action_url: `/diagnoses/${diagnosisId}`,
    })

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error("Error creating diagnosis sharing notification:", error)
    return { success: false, error: "Failed to create diagnosis sharing notification" }
  }
}

/**
 * Create a system announcement notification for all users in a hospital
 */
export async function createHospitalAnnouncementNotification(
  hospitalId: string,
  title: string,
  message: string,
  actionUrl?: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient()

    // Get all users in the hospital
    const { data: users, error: usersError } = await supabase.from("users").select("id").eq("hospital_id", hospitalId)

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      return { success: true, error: null } // No users to notify
    }

    // Create notifications for all users
    const notifications = users.map((user) => ({
      user_id: user.id,
      title,
      message,
      type: "system" as const,
      is_read: false,
      action_url: actionUrl,
    }))

    const { error } = await supabase.from("notifications").insert(notifications)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error("Error creating hospital announcement notifications:", error)
    return { success: false, error: "Failed to create hospital announcement notifications" }
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<{ count: number; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient()

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) throw error

    return { count: count || 0, error: null }
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    return { count: 0, error: "Failed to fetch unread notification count" }
  }
}

/**
 * Subscribe to real-time notifications
 */
export async function subscribeToNotifications(callback: (notification: Notification) => void): Promise<() => void> {
  const supabase = getSupabaseBrowserClient()

  const subscription = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      },
      async (payload) => {
        // Check if the notification is for the current user
        const { data: user } = await supabase.auth.getUser()
        if (user.user && payload.new.user_id === user.user.id) {
          callback(payload.new as Notification)
        }
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(subscription)
  }
}
