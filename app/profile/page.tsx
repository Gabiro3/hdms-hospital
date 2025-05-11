"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileInformation from "@/components/profile/profile-information"
import NotificationSettings from "@/components/profile/notification-settings"
import ActivityLog from "@/components/profile/activity-log"
import HospitalDetails from "@/components/profile/hospital-details"
import { Skeleton } from "@/components/ui/skeleton"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        router.push("/login")
        return
      }

      setUserId(data.user.id)
      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!userId) {
    return null
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">
          View and manage your profile information, activity log, and hospital details
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="hospital">Hospital Details</TabsTrigger>
          <TabsTrigger value="notifications">Notification Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {userId && <ProfileInformation userId={userId} />}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {userId && <ActivityLog userId={userId} />}
        </TabsContent>

        <TabsContent value="hospital" className="space-y-4">
          {userId && <HospitalDetails userId={userId} />}
        </TabsContent>
        <TabsContent value="notifications">
          <div className="grid gap-6 md:grid-cols-2">
            <NotificationSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-4 w-full" />
      </div>

      <div className="space-y-8">
        <Skeleton className="h-12 w-full" />

        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
