import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a single supabase client for the server
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}

// Create a client with cookies for authenticated requests
export async function createServerComponentClient() {

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable automatic URL detection to prevent redirect loops
    },
    // Removed cookies property as it is not a valid option for SupabaseClientOptions
  })
}

// Helper function to check authentication status without triggering redirects
export async function checkAuthentication() {
  try {
    const supabase = await createServerComponentClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { authenticated: false }
    }

    // Verify the user exists
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { authenticated: false }
    }

    return {
      authenticated: true,
      user,
      session,
    }
  } catch (error) {
    console.error("Authentication check error:", error)
    return { authenticated: false }
  }
}

export const createServerClient = (cookieStore: any) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable automatic URL detection to prevent redirect loops
    },
    // Removed cookies property as it is not a valid option for SupabaseClientOptions
  })
}
