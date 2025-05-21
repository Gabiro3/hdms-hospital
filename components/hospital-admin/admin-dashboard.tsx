"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, UserX, ShieldAlert, Activity, Bell, BarChart3, ClipboardList, Megaphone, Text } from "lucide-react"
import { createHospitalAnnouncement } from "@/services/hospital-admin-service"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import RecentActivityList from "@/components/hospital-admin/recent-activity-list"
import UserRoleDistributionChart from "@/components/hospital-admin/user-role-distribution-chart"
import ActivityTypeChart from "@/components/hospital-admin/activity-type-chart"

interface AdminDashboardProps {
  stats: any
  hospitalId: string
  userId: string
}

export default function AdminDashboard({ stats, hospitalId, userId }: AdminDashboardProps) {
  const { toast } = useToast()
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false)
  const [announcementTitle, setAnnouncementTitle] = useState("")
  const [announcementMessage, setAnnouncementMessage] = useState("")
  const [announcementPriority, setAnnouncementPriority] = useState<"low" | "medium" | "high">("medium")
  const [announcementUrl, setAnnouncementUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle || !announcementMessage) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and message for the announcement.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createHospitalAnnouncement(userId, hospitalId, {
        title: announcementTitle,
        message: announcementMessage,
        priority: announcementPriority,
        actionUrl: announcementUrl || undefined,
      })

      if (result.success) {
        toast({
          title: "Announcement Created",
          description: "Your announcement has been sent to all hospital users.",
          variant: "default",
        })
        setIsAnnouncementDialogOpen(false)
        setAnnouncementTitle("")
        setAnnouncementMessage("")
        setAnnouncementPriority("medium")
        setAnnouncementUrl("")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create announcement",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hospital Administration</h1>
          <p className="text-sm text-muted-foreground">
            Manage users, view system logs, and monitor hospital activities
          </p>
        </div>
        <Button onClick={() => setIsAnnouncementDialogOpen(true)}>
          <Megaphone className="mr-2 h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} active in the last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.disabledUsers} disabled accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">Actions in the last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">Across all hospital users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>User and Patient Management</CardTitle>
            <CardDescription>Manage hospital users, roles, patients and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/hospital-admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  View All Users
                </Button>
              </Link>
              <Link href="/hospital-admin/users/create">
                <Button variant="outline" className="w-full justify-start">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create New User
                </Button>
              </Link>
              <Link href="/hospital-admin/users?filter=disabled">
                <Button variant="outline" className="w-full justify-start">
                  <UserX className="mr-2 h-4 w-4" />
                  Disabled Accounts
                </Button>
              </Link>
              <Link href="/hospital-admin/records">
                <Button variant="outline" className="w-full justify-start">
                  <Text className="mr-2 h-4 w-4" />
                  Patient Records
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Monitoring</CardTitle>
            <CardDescription>View system logs and activity reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/hospital-admin/logs">
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="mr-2 h-4 w-4" />
                  Activity Logs
                </Button>
              </Link>
              <Link href="/hospital-admin/notifications">
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Button>
              </Link>
              <Link href="/hospital-admin/reports">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports
                </Button>
              </Link>
              <Link href="/hospital-admin/audit">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Audit Trail
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="users">User Distribution</TabsTrigger>
          <TabsTrigger value="actions">Activity Types</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Hospital Activity</CardTitle>
              <CardDescription>The latest actions performed by hospital users</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivityList hospitalId={hospitalId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Breakdown of users by role within the hospital</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <UserRoleDistributionChart data={stats.roleDistribution} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity by Type</CardTitle>
              <CardDescription>Distribution of activities by type in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ActivityTypeChart data={stats.activityByType} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Announcement Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Hospital Announcement</DialogTitle>
            <DialogDescription>This announcement will be sent to all users in your hospital.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Announcement Title</Label>
              <Input
                id="title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Important System Update"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Details of the announcement..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <RadioGroup
                value={announcementPriority}
                onValueChange={(value) => setAnnouncementPriority(value as "low" | "medium" | "high")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="text-sm font-normal">
                    Low
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="text-sm font-normal">
                    Medium
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="text-sm font-normal">
                    High
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Action URL (Optional)</Label>
              <Input
                id="url"
                value={announcementUrl}
                onChange={(e) => setAnnouncementUrl(e.target.value)}
                placeholder="https://example.com/details"
              />
              <p className="text-xs text-muted-foreground">
                If provided, users can click on the notification to visit this URL.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAnnouncement} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
