"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"
import { revalidatePath } from "next/cache"

type User = Database["public"]["Tables"]["users"]["Row"]
type UserInsert = Database["public"]["Tables"]["users"]["Insert"]
type UserUpdate = Database["public"]["Tables"]["users"]["Update"]

export async function getUsers(hospitalId?: string) {
  try {
    const supabase = createServerSupabaseClient()
    let query = supabase.from("users").select("*, hospitals(name)")

    if (hospitalId) {
      query = query.eq("hospital_id", hospitalId)
    }

    const { data, error } = await query.order("full_name")

    if (error) throw error
    return { users: data, error: null }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { users: null, error: "Failed to fetch users" }
  }
}

export async function getUserById(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("users").select("*, hospitals(name, code)").eq("id", id).single()

    if (error) throw error
    return { user: data, error: null }
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error)
    return { user: null, error: "Failed to fetch user" }
  }
}

export async function getUserByEmail(email: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("users").select("*, hospitals(name, code)").eq("email", email).single()

    if (error) throw error
    return { user: data, error: null }
  } catch (error) {
    console.error(`Error fetching user with email ${email}:`, error)
    return { user: null, error: "Failed to fetch user" }
  }
}
export async function getUserWithHospitalDetails(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        hospitals(
          id, 
          name, 
          code, 
          address, 
          city, 
          state, 
          zip, 
          country, 
          phone, 
          email, 
          website, 
          logo_url, 
          is_active, 
          created_at, 
          updated_at,
          hospital_departments(id, name, description)
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return { user: data, error: null }
  } catch (error) {
    console.error(`Error fetching user with hospital details for ID ${id}:`, error)
    return { user: null, error: "Failed to fetch user with hospital details" }
  }
}

export async function createUser(user: UserInsert) {
  try {
    const supabase = createServerSupabaseClient()

    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name,
        hospital_id: user.hospital_id,
      },
    })

    if (authError) throw authError

    // Then create the user record in our database
    const { data, error } = await supabase
      .from("users")
      .insert({
        ...user,
        id: authData.user.id, // Use the auth user ID
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/users")
    return { user: data, error: null }
  } catch (error) {
    console.error("Error creating user:", error)
    return { user: null, error: "Failed to create user" }
  }
}

export async function updateUser(id: string, user: UserUpdate) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("users")
      .update({ ...user, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/users/${id}`)
    revalidatePath("/users")
    return { user: data, error: null }
  } catch (error) {
    console.error(`Error updating user with ID ${id}:`, error)
    return { user: null, error: "Failed to update user" }
  }
}

export async function updateUserVerificationStatus(id: string, isVerified: boolean) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("users")
      .update({
        is_verified: isVerified,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/users/${id}`)
    revalidatePath("/users")
    return { user: data, error: null }
  } catch (error) {
    console.error(`Error updating verification status for user with ID ${id}:`, error)
    return { user: null, error: "Failed to update user verification status" }
  }
}

export async function deleteUser(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    if (authError) throw authError

    // Delete the user record from our database
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/users")
    return { error: null }
  } catch (error) {
    console.error(`Error deleting user with ID ${id}:`, error)
    return { error: "Failed to delete user" }
  }
}

export async function updateLastLogin(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error(`Error updating last login for user with ID ${id}:`, error)
    return { error: "Failed to update last login" }
  }
}

export async function getUserNotificationPreferences(userId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGSQL_ERROR") throw error

    // If no preferences exist, return default preferences
    if (!data) {
      return {
        preferences: {
          email_notifications: true,
          push_notifications: true,
          lab_results: true,
          diagnosis_updates: true,
          system_announcements: true,
          patient_updates: true,
        },
        error: null,
      }
    }

    return { preferences: data, error: null }
  } catch (error) {
    console.error(`Error fetching notification preferences for user ${userId}:`, error)
    return { preferences: null, error: "Failed to fetch notification preferences" }
  }
}

export async function updateUserNotificationPreferences(userId: string, preferences: any) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if preferences already exist
    const { data: existingPrefs } = await supabase
      .from("user_notification_preferences")
      .select("id")
      .eq("user_id", userId)
      .single()

    let result

    if (existingPrefs) {
      // Update existing preferences
      result = await supabase
        .from("user_notification_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single()
    } else {
      // Insert new preferences
      result = await supabase
        .from("user_notification_preferences")
        .insert({
          user_id: userId,
          ...preferences,
        })
        .select()
        .single()
    }

    if (result.error) throw result.error

    return { preferences: result.data, error: null }
  } catch (error) {
    console.error(`Error updating notification preferences for user ${userId}:`, error)
    return { preferences: null, error: "Failed to update notification preferences" }
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
