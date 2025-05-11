"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export interface ActivityLog {
  action: any
  resource_type: any
  resource_id: any
  metadata: {}
  id?: string
  user_id: string
  activity_type: string
  description: string
  details?: string
  ip_address?: string
  user_agent?: string
  created_at?: string
}

/**
 * Log user activity on the server
 */
export async function logUserActivity(params: ActivityLog) {
    const supabase = createServerSupabaseClient()
  
    try {
      // Get client IP and user agent
      const ipResponse = await fetch("https://api.ipify.org?format=json")
      const ipData = await ipResponse.json()
      const ipAddress = ipData.ip
      const userAgent = navigator.userAgent
  
      const { error } = await supabase.from("user_activities").insert({
        user_id: params.user_id,
        action: params.action,
        details: params.details,
        resource_type: params.resource_type,
        resource_id: params.resource_id,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: params.metadata || {},
        created_at: new Date().toISOString(),
      })
  
      if (error) throw error
  
      return true
    } catch (error) {
      console.error("Error logging user activity:", error)
      return false
    }
  }
/**
 * Get user activity logs
 */
export async function getUserActivityLogs(
  userId: string,
  options: {
    limit?: number
    offset?: number
    activityType?: string
    startDate?: string
    endDate?: string
  } = {},
): Promise<{
    map(arg0: (activity: { activity_type: string }) => { activity_type: "login" | "logout" | "view_patient" | "edit_patient" | "create_diagnosis" | "view_diagnosis" | "edit_diagnosis" | "create_report" | "view_report" | "edit_report" | "system_update" | "settings_change" | "create_lab_request" | "view_lab_result" | "create_lab_result" }): import("react").SetStateAction<ActivityLog[]>; logs: ActivityLog[]; count: number; error: string | null 
}> {
  try {
    const supabase = createServerSupabaseClient()
    const { limit = 50, offset = 0, activityType, startDate, endDate } = options

    // Build the query
    let query = supabase
      .from("user_activities")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add filters if provided
    if (activityType) {
      query = query.eq("activity_type", activityType)
    }

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data, count, error } = await query

    if (error) throw error

    return {
      logs: data as ActivityLog[],
      count: count || 0,
      error: null,
      map: (callback: (activity: { activity_type: string }) => any) => 
        (data || []).map(callback)
    }
  } catch (error) {
    console.error("Error fetching user activity logs:", error)
    return { 
      logs: [], 
      count: 0, 
      error: "Failed to fetch user activity logs",
      map: (callback: (activity: { activity_type: string }) => any) => []
    }
  }
}

/**
 * Get activity statistics for a user
 */
export async function getUserActivityStats(
  userId: string,
): Promise<{ stats: Record<string, number>; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient()

    // Get activity counts by type
    const { data, error } = await supabase.from("user_activities").select("activity_type").eq("user_id", userId)

    if (error) throw error

    // Count occurrences of each activity type
    const stats: Record<string, number> = {}
    data.forEach((activity) => {
      const type = activity.activity_type
      stats[type] = (stats[type] || 0) + 1
    })

    return { stats, error: null }
  } catch (error) {
    console.error("Error fetching user activity stats:", error)
    return { stats: {}, error: "Failed to fetch user activity statistics" }
  }
}

/**
 * Get recent activity for a hospital
 */
export async function getHospitalRecentActivity(
  hospitalId: string,
  limit = 10,
): Promise<{ logs: ActivityLog[]; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient()

    // Get users from this hospital
    const { data: users, error: usersError } = await supabase.from("users").select("id").eq("hospital_id", hospitalId)

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      return { logs: [], error: null }
    }

    const userIds = users.map((user) => user.id)

    // Get recent activity for these users
    const { data, error } = await supabase
      .from("user_activities")
      .select("*, users(full_name, role)")
      .in("user_id", userIds)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return { logs: data as ActivityLog[], error: null }
  } catch (error) {
    console.error("Error fetching hospital recent activity:", error)
    return { logs: [], error: "Failed to fetch hospital activity" }
  }
}

export async function getUserActivities(userId: string, options: any = {}) {
    const supabase = createServerSupabaseClient()
  
    const { page = 1, limit = 20, action_type, resource_type, start_date, end_date } = options
  
    try {
      let query = supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1)
  
      if (action_type) {
        query = query.eq("action", action_type)
      }
  
      if (resource_type) {
        query = query.eq("resource_type", resource_type)
      }
  
      if (start_date) {
        query = query.gte("created_at", start_date)
      }
  
      if (end_date) {
        query = query.lte("created_at", end_date)
      }
  
      const { data, error } = await query
  
      if (error) throw error
  
      return data || []
    } catch (error) {
      console.error("Error fetching user activities:", error)
      return []
    }
  }