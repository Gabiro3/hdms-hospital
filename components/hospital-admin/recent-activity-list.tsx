"use client"

import { useEffect, useState } from "react"
import { fetchHospitalActivityLogs } from "@/services/hospital-admin-service"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format, formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface RecentActivityListProps {
  hospitalId: string
  limit?: number
}

export default function RecentActivityList({ hospitalId, limit = 10 }: RecentActivityListProps) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)
      try {
        const result = await fetchHospitalActivityLogs(hospitalId, {
          limit,
          sortBy: "created_at",
          sortOrder: "desc",
        })
        setActivities(result.logs || [])
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [hospitalId, limit])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getActivityTypeColor = (type: string) => {
    const types: Record<string, string> = {
      login: "bg-blue-50 text-blue-700 border-blue-200",
      logout: "bg-gray-50 text-gray-700 border-gray-200",
      user_creation: "bg-green-50 text-green-700 border-green-200",
      user_disable: "bg-amber-50 text-amber-700 border-amber-200",
      user_enable: "bg-emerald-50 text-emerald-700 border-emerald-200",
      password_reset: "bg-purple-50 text-purple-700 border-purple-200",
      grant_admin: "bg-indigo-50 text-indigo-700 border-indigo-200",
      revoke_admin: "bg-rose-50 text-rose-700 border-rose-200",
      system_announcement: "bg-orange-50 text-orange-700 border-orange-200",
      patient_create: "bg-teal-50 text-teal-700 border-teal-200",
      patient_update: "bg-cyan-50 text-cyan-700 border-cyan-200",
      diagnosis_create: "bg-violet-50 text-violet-700 border-violet-200",
      lab_result: "bg-lime-50 text-lime-700 border-lime-200",
    }

    return types[type] || "bg-gray-50 text-gray-700 border-gray-200"
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No recent activity found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {activity.users?.full_name ? getInitials(activity.users.full_name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{activity.users?.full_name || "Unknown User"}</span>
                <Badge variant="outline" className={getActivityTypeColor(activity.activity_type)}>
                  {activity.activity_type}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground" title={format(new Date(activity.created_at), "PPpp")}>
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
          </div>
        </div>
      ))}
      <div className="pt-2 text-center">
        <Link href="/hospital-admin/logs">
          <Button variant="outline" size="sm">
            View All Activity
          </Button>
        </Link>
      </div>
    </div>
  )
}
