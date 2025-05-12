"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateSecurePassword } from "@/lib/utils/password-utils"
import { revalidatePath } from "next/cache"
import { logUserActivity } from "./activity-service"
import { createNotification } from "./notification-service"

/**
 * Fetch all users associated with a specific hospital
 */
export async function fetchHospitalUsers(
  hospitalId: string,
  options: {
    page?: number
    limit?: number
    search?: string
    role?: string
    isDisabled?: boolean
    isAdmin?: boolean
    sortBy?: string
    sortOrder?: "asc" | "desc"
  } = {},
) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      isDisabled,
      isAdmin,
      sortBy = "full_name",
      sortOrder = "asc",
    } = options

    // Start building the query
    let query = supabase
      .from("users")
      .select("*, hospitals(name, code)", { count: "exact" })
      .eq("hospital_id", hospitalId)

    // Apply filters if provided
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role) {
      query = query.eq("role", role)
    }

    if (isDisabled !== undefined) {
      query = query.eq("is_disabled", isDisabled)
    }

    if (isAdmin !== undefined) {
      query = query.eq("is_admin", isAdmin)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute the query
    const { data, count, error } = await query

    if (error) throw error

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / limit) : 0

    return {
      users: data,
      total: count || 0,
      totalPages,
      page,
      limit,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching hospital users:", error)
    return {
      users: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 10,
      error: "Failed to fetch hospital users",
    }
  }
}

/**
 * Create a new user for a specific hospital
 */
export async function createHospitalUser(
  adminUserId: string,
  userData: {
    full_name: string
    email: string
    role: string
    hospital_id: string
    expertise?: string
    phone?: string
    is_admin?: boolean
  },
) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", userData.email)
      .single()

    if (checkError && checkError.code !== "PGSQL_ERROR") throw checkError
    if (existingUser) {
      return { user: null, temporaryPassword: null, error: "Email already exists" }
    }

    // Generate a temporary password
    const temporaryPassword = generateSecurePassword()

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        hospital_id: userData.hospital_id,
      },
    })

    if (authError) throw authError

    // Create the user record in our database
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role,
        hospital_id: userData.hospital_id,
        expertise: userData.expertise || null,
        phone: userData.phone || null,
        is_admin: userData.is_admin || false,
        is_verified: true,
        is_disabled: false,
        password_reset_required: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) throw userError

    // Log the activity
    await logUserActivity({
        user_id: adminUserId,
        action: "user_creation",
        resource_type: "user",
        resource_id: user.id,
        details: `Created new user: ${userData.full_name} (${userData.email})`,
        metadata: {
            created_user_id: authData.user.id,
            created_user_email: userData.email,
            created_user_role: userData.role,
            hospital_id: userData.hospital_id,
        },
        created_at: new Date().toISOString(),
        activity_type: "",
        description: ""
    })

    // Create a notification for the new user
    await createNotification({
      user_id: authData.user.id,
      title: "Welcome to Hospital Diagnosis System",
      message: "Your account has been created. Please change your temporary password upon first login.",
      type: "system",
      metadata: {
        requires_password_change: true,
      },
    })

    revalidatePath("/admin/users")
    return { user, temporaryPassword, error: null }
  } catch (error) {
    console.error("Error creating hospital user:", error)
    return { user: null, temporaryPassword: null, error: "Failed to create user" }
  }
}

/**
 * Disable a user account
 */
export async function disableUserAccount(adminUserId: string, userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get user details before update for logging
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("full_name, email, hospital_id")
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Update the user's status
    const { data, error } = await supabase
      .from("users")
      .update({
        is_disabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    // Log the activity
    await logUserActivity({
        user_id: adminUserId,
        activity_type: "user_disable",
        description: `Disabled user account: ${userData.full_name} (${userData.email})`,
        metadata: {
            disabled_user_id: userId,
            disabled_user_email: userData.email,
            hospital_id: userData.hospital_id,
        },
        action: undefined,
        resource_type: undefined,
        resource_id: undefined,
    })

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { success: true, user: data, error: null }
  } catch (error) {
    console.error("Error disabling user account:", error)
    return { success: false, user: null, error: "Failed to disable user account" }
  }
}

/**
 * Enable a user account
 */
export async function enableUserAccount(adminUserId: string, userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get user details before update for logging
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("full_name, email, hospital_id")
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Update the user's status
    const { data, error } = await supabase
      .from("users")
      .update({
        is_disabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    // Log the activity
    await logUserActivity({
        user_id: adminUserId,
        activity_type: "user_enable",
        description: `Enabled user account: ${userData.full_name} (${userData.email})`,
        metadata: {
            enabled_user_id: userId,
            enabled_user_email: userData.email,
            hospital_id: userData.hospital_id,
        },
        action: undefined,
        resource_type: undefined,
        resource_id: undefined,
    })

    // Create a notification for the user
    await createNotification({
      user_id: userId,
      title: "Account Activated",
      message: "Your account has been activated. You can now log in to the system.",
      type: "system",
    })

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { success: true, user: data, error: null }
  } catch (error) {
    console.error("Error enabling user account:", error)
    return { success: false, user: null, error: "Failed to enable user account" }
  }
}

/**
 * Reset a user's password
 */
export async function resetUserPassword(adminUserId: string, userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get user details for logging
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("full_name, email, hospital_id")
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Generate a new temporary password
    const temporaryPassword = generateSecurePassword()

    // Update the user's password in auth
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
    })

    if (authError) throw authError

    // Update the user record to require password reset
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_reset_required: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) throw updateError

    // Log the activity
    await logUserActivity({
        user_id: adminUserId,
        activity_type: "password_reset",
        description: `Reset password for user: ${userData.full_name} (${userData.email})`,
        metadata: {
            reset_user_id: userId,
            reset_user_email: userData.email,
            hospital_id: userData.hospital_id,
        },
        action: undefined,
        resource_type: undefined,
        resource_id: undefined,
    })

    // Create a notification for the user
    await createNotification({
      user_id: userId,
      title: "Password Reset",
      message: "Your password has been reset by an administrator. Please change your temporary password upon login.",
      type: "system",
      metadata: {
        requires_password_change: true,
      },
    })

    revalidatePath(`/admin/users/${userId}`)
    return { success: true, temporaryPassword, error: null }
  } catch (error) {
    console.error("Error resetting user password:", error)
    return { success: false, temporaryPassword: null, error: "Failed to reset user password" }
  }
}

/**
 * Update user admin status
 */
export async function updateUserAdminStatus(adminUserId: string, userId: string, isAdmin: boolean) {
  try {
    const supabase = createServerSupabaseClient()

    // Get user details before update for logging
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("full_name, email, hospital_id, is_admin")
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Update the user's admin status
    const { data, error } = await supabase
      .from("users")
      .update({
        is_admin: isAdmin,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    // Log the activity
    const actionType = isAdmin ? "grant_admin" : "revoke_admin"
    const description = isAdmin
      ? `Granted admin privileges to user: ${userData.full_name} (${userData.email})`
      : `Revoked admin privileges from user: ${userData.full_name} (${userData.email})`

    await logUserActivity({
        user_id: adminUserId,
        activity_type: actionType,
        description,
        metadata: {
            target_user_id: userId,
            target_user_email: userData.email,
            hospital_id: userData.hospital_id,
            previous_status: userData.is_admin,
            new_status: isAdmin,
        },
        action: undefined,
        resource_type: undefined,
        resource_id: undefined,
    })

    // Create a notification for the user
    const notificationMessage = isAdmin
      ? "You have been granted administrator privileges."
      : "Your administrator privileges have been revoked."

    await createNotification({
      user_id: userId,
      title: "Admin Status Updated",
      message: notificationMessage,
      type: "system",
    })

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}`)
    return { success: true, user: data, error: null }
  } catch (error) {
    console.error("Error updating user admin status:", error)
    return { success: false, user: null, error: "Failed to update user admin status" }
  }
}

/**
 * Fetch hospital activity logs
 */
export async function fetchHospitalActivityLogs(
  hospitalId: string,
  options: {
    page?: number
    limit?: number
    search?: string
    activityType?: string
    userId?: string
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
  } = {},
) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      page = 1,
      limit = 20,
      search = "",
      activityType,
      userId,
      startDate,
      endDate,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options

    // First get all users from this hospital
    const { data: hospitalUsers, error: usersError } = await supabase
      .from("users")
      .select("id")
      .eq("hospital_id", hospitalId)

    if (usersError) throw usersError

    if (!hospitalUsers || hospitalUsers.length === 0) {
      return {
        logs: [],
        total: 0,
        totalPages: 0,
        page,
        limit,
        error: null,
      }
    }

    const userIds = hospitalUsers.map((user) => user.id)

    // Start building the query
    let query = supabase
      .from("user_activities")
      .select("*, users(id, full_name, email, role)", { count: "exact" })
      .in("user_id", userIds)

    // Apply filters if provided
    if (search) {
      query = query.or(`description.ilike.%${search}%,activity_type.ilike.%${search}%`)
    }

    if (activityType) {
      query = query.eq("activity_type", activityType)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute the query
    const { data, count, error } = await query

    if (error) throw error

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / limit) : 0

    return {
      logs: data,
      total: count || 0,
      totalPages,
      page,
      limit,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching hospital activity logs:", error)
    return {
      logs: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 20,
      error: "Failed to fetch hospital activity logs",
    }
  }
}

/**
 * Fetch hospital notifications
 */
export async function fetchHospitalNotifications(
  hospitalId: string,
  options: {
    page?: number
    limit?: number
    search?: string
    type?: string
    userId?: string
    isRead?: boolean
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
  } = {},
) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      page = 1,
      limit = 20,
      search = "",
      type,
      userId,
      isRead,
      startDate,
      endDate,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options

    // First get all users from this hospital
    const { data: hospitalUsers, error: usersError } = await supabase
      .from("users")
      .select("id")
      .eq("hospital_id", hospitalId)

    if (usersError) throw usersError

    if (!hospitalUsers || hospitalUsers.length === 0) {
      return {
        notifications: [],
        total: 0,
        totalPages: 0,
        page,
        limit,
        error: null,
      }
    }

    const userIds = hospitalUsers.map((user) => user.id)

    // Start building the query
    let query = supabase
      .from("notifications")
      .select("*, users(id, full_name, email, role)", { count: "exact" })
      .in("user_id", userIds)

    // Apply filters if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`)
    }

    if (type) {
      query = query.eq("type", type)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (isRead !== undefined) {
      query = query.eq("is_read", isRead)
    }

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute the query
    const { data, count, error } = await query

    if (error) throw error

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / limit) : 0

    return {
      notifications: data,
      total: count || 0,
      totalPages,
      page,
      limit,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching hospital notifications:", error)
    return {
      notifications: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 20,
      error: "Failed to fetch hospital notifications",
    }
  }
}

/**
 * Get hospital user details
 */
export async function getHospitalUserDetails(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        `
        *,
        hospitals(id, name, code, address, city, state, country)
      `,
      )
      .eq("id", userId)
      .single()

    if (userError) throw userError

    // Get user activity logs (last 10)
    const { data: activityLogs, error: logsError } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (logsError) throw logsError

    // Get user notifications (last 10)
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (notificationsError) throw notificationsError

    return {
      user,
      activityLogs,
      notifications,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching hospital user details:", error)
    return {
      user: null,
      activityLogs: [],
      notifications: [],
      error: "Failed to fetch user details",
    }
  }
}

/**
 * Create a system announcement for all users in a hospital
 */
export async function createHospitalAnnouncement(
  adminUserId: string,
  hospitalId: string,
  announcement: {
    title: string
    message: string
    priority: "low" | "medium" | "high"
    actionUrl?: string
  },
) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all users in the hospital
    const { data: users, error: usersError } = await supabase.from("users").select("id").eq("hospital_id", hospitalId)

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      return { success: false, error: "No users found in the hospital" }
    }

    // Get admin user details for the notification
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", adminUserId)
      .single()

    if (adminError) throw adminError

    // Create notifications for all users
    const notifications = users.map((user) => ({
      user_id: user.id,
      title: announcement.title,
      message: announcement.message,
      type: "system",
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: {
        priority: announcement.priority,
        sender: {
          id: adminUserId,
          name: adminUser.full_name,
        },
        hospital_id: hospitalId,
      },
      action_url: announcement.actionUrl,
    }))

    const { error: notificationError } = await supabase.from("notifications").insert(notifications)

    if (notificationError) throw notificationError

    // Log the activity
    await logUserActivity({
        user_id: adminUserId,
        activity_type: "system_announcement",
        description: `Created system announcement: ${announcement.title}`,
        metadata: {
            announcement_title: announcement.title,
            announcement_message: announcement.message,
            priority: announcement.priority,
            hospital_id: hospitalId,
            recipient_count: users.length,
        },
        action: undefined,
        resource_type: undefined,
        resource_id: undefined,
    })

    return { success: true, error: null }
  } catch (error) {
    console.error("Error creating hospital announcement:", error)
    return { success: false, error: "Failed to create hospital announcement" }
  }
}

/**
 * Get hospital dashboard statistics
 */
export async function getHospitalAdminStats(hospitalId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("hospital_id", hospitalId)

    if (usersError) throw usersError

    // Get active users count (users who logged in in the last 30 days)
    const { count: activeUsers, error: activeError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("hospital_id", hospitalId)
      .gte("last_login", thirtyDaysAgo)

    if (activeError) throw activeError

    // Get disabled users count
    const { count: disabledUsers, error: disabledError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("hospital_id", hospitalId)
      .eq("is_disabled", true)

    if (disabledError) throw disabledError

    // Get admin users count
    const { count: adminUsers, error: adminError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("hospital_id", hospitalId)
      .eq("is_admin", true)

    if (adminError) throw adminError

    // Get recent activity count (last 30 days)
    const { count: recentActivity, error: activityError } = await supabase
      .from("user_activities")
      .select("*", { count: "exact", head: true })
      .in("user_id", (await supabase.from("users").select("id").eq("hospital_id", hospitalId)).data?.map(user => user.id) || [])
      .gte("created_at", thirtyDaysAgo)

    if (activityError) throw activityError

    // Get unread notifications count
    const { count: unreadNotifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .in(
        "user_id",
        (await supabase.from("users").select("id").eq("hospital_id", hospitalId)).data?.map(user => user.id) || []
      )
      .eq("is_read", false)

    if (notificationsError) throw notificationsError

    // Get user roles distribution
    const { data: roleDistribution, error: rolesError } = await supabase.rpc("get_user_role_distribution", {
      hospital_id_param: hospitalId,
    })

    if (rolesError) throw rolesError

    // Get activity by type for the last 30 days
    const { data: activityByType, error: activityTypeError } = await supabase.rpc("get_activity_by_type", {
      hospital_id_param: hospitalId,
      days_param: 30,
    })

    if (activityTypeError) throw activityTypeError

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      disabledUsers: disabledUsers || 0,
      adminUsers: adminUsers || 0,
      recentActivity: recentActivity || 0,
      unreadNotifications: unreadNotifications || 0,
      roleDistribution: roleDistribution || [],
      activityByType: activityByType || [],
      error: null,
    }
  } catch (error) {
    console.error("Error fetching hospital admin stats:", error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      disabledUsers: 0,
      adminUsers: 0,
      recentActivity: 0,
      unreadNotifications: 0,
      roleDistribution: [],
      activityByType: [],
      error: "Failed to fetch hospital admin statistics",
    }
  }
}
