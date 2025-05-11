"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Calendar, Filter, Download, FileBarChart2, FileEdit, FileText, ImageIcon, LayoutDashboard, RefreshCw, Settings, Stethoscope, User, Lock, FlaskConical } from "lucide-react"
import { endOfDay, format, parseISO, startOfDay } from "date-fns"
import { getUserActivities } from "@/services/activity-service"
import { toast } from "@/components/ui/use-toast"

interface ActivityLogProps {
  userId: string
}
type ActivityType =
  | "login"
  | "logout"
  | "view_patient"
  | "edit_patient"
  | "create_diagnosis"
  | "view_diagnosis"
  | "edit_diagnosis"
  | "create_report"
  | "view_report"
  | "edit_report"
  | "system_update"
  | "settings_change"
  | "create_lab_request"
  | "view_lab_result"
  | "create_lab_result"
  | "create_radiology_study"
  | "view_radiology_study"
  | "share_radiology_study"

interface Activity {
  id: string
  user_id: string
  action: string
  details: string
  resource_type: string
  resource_id: string
  ip_address: string
  user_agent: string
  created_at: string
}

export default function ActivityLog({ userId }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activityType, setActivityType] = useState("all")
  const [timeRange, setTimeRange] = useState("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [userId, activityType, timeRange, page])

  const fetchActivities = async (isRefresh = false) => {
    if (isRefresh) {
      setPage(1)
      setActivities([])
    }

    setLoading(true)
    try {
      const options: any = {
        page: isRefresh ? 1 : page,
        limit: 20,
      }

      if (activityType !== "all") {
        options.action_type = activityType
      }

      if (timeRange !== "all") {
        const now = new Date()
        const startDate = new Date()

        switch (timeRange) {
          case "today":
            startDate.setHours(0, 0, 0, 0)
            break
          case "week":
            startDate.setDate(now.getDate() - 7)
            break
          case "month":
            startDate.setMonth(now.getMonth() - 1)
            break
          case "year":
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }

        options.start_date = startDate.toISOString()
      }

      const data = await getUserActivities(userId, options)

      if (isRefresh) {
        setActivities(data)
      } else {
        setActivities((prev) => [...prev, ...data])
      }

      setHasMore(data.length === options.limit)
    } catch (error) {
      console.error("Error fetching activities:", error)
      toast({
        title: "Error",
        description: "Failed to load activity log. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const getResourceTypeBadge = (type: string) => {
    switch (type) {
      case "PATIENT":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Patient
          </Badge>
        )
      case "DIAGNOSIS":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Diagnosis
          </Badge>
        )
      case "LAB_REQUEST":
        return (
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
            Lab Request
          </Badge>
        )
      case "LAB_RESULT":
        return (
          <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200">
            Lab Result
          </Badge>
        )
      case "RADIOLOGY":
        return (
          <Badge variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-200">
            Radiology
          </Badge>
        )
      case "REPORT":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            Report
          </Badge>
        )
      case "USER":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
            User
          </Badge>
        )
      case "SYSTEM":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            System
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {type}
          </Badge>
        )
    }
  }


  const activityTypeOptions = [
    { id: "login", label: "Login" },
    { id: "logout", label: "Logout" },
    { id: "view_patient", label: "View Patient" },
    { id: "edit_patient", label: "Edit Patient" },
    { id: "create_diagnosis", label: "Create Diagnosis" },
    { id: "view_diagnosis", label: "View Diagnosis" },
    { id: "edit_diagnosis", label: "Edit Diagnosis" },
    { id: "create_lab_request", label: "Create Lab Request" },
    { id: "view_lab_result", label: "View Lab Result" },
    { id: "create_lab_result", label: "Create Lab Result" },
    { id: "create_radiology_study", label: "Create Radiology Study" },
    { id: "view_radiology_study", label: "View Radiology Study" },
    { id: "share_radiology_study", label: "Share Radiology Study" },
    { id: "create_report", label: "Create Report" },
    { id: "view_report", label: "View Report" },
    { id: "edit_report", label: "Edit Report" },
    { id: "system_update", label: "System Update" },
    { id: "settings_change", label: "Settings Change" },
  ]

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      fetchActivities(true)
      return
    }

    const filtered = activities.filter(
      (activity) =>
        activity.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.resource_type.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    setActivities(filtered)
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "CREATE":
      case "REGISTER":
      case "LOGIN":
        return "default"
      case "UPDATE":
      case "MODIFY":
        return "destructive"
      case "DELETE":
        return "destructive"
      case "VIEW":
      case "ACCESS":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case "PATIENT":
        return "text-blue-600"
      case "DIAGNOSIS":
        return "text-green-600"
      case "LAB_RESULT":
        return "text-purple-600"
      case "REPORT":
        return "text-amber-600"
      case "USER":
        return "text-cyan-600"
      case "PROFILE":
        return "text-pink-600"
      default:
        return "text-gray-600"
    }
  }
  

  const exportActivities = () => {
    // Create CSV content
    const headers = ["Date", "Action", "Resource Type", "Details", "IP Address"]
    const csvContent = [
      headers.join(","),
      ...activities.map((activity) =>
        [
          format(new Date(activity.created_at), "yyyy-MM-dd HH:mm:ss"),
          activity.action,
          activity.resource_type,
          `"${activity.details.replace(/"/g, '""')}"`,
          activity.ip_address,
        ].join(","),
      ),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `activity_log_${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>View your recent activities and actions in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList>
                <TabsTrigger value="all" onClick={() => setActivityType("all")}>
                  All Activities
                </TabsTrigger>
                <TabsTrigger value="login" onClick={() => setActivityType("LOGIN")}>
                  Logins
                </TabsTrigger>
                <TabsTrigger value="data" onClick={() => setActivityType("DATA")}>
                  Data Changes
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={exportActivities}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search activities..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button variant="secondary" onClick={handleSearch}>
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>

            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="hidden md:table-cell">Resource</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length === 0 && !loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No activities found
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(activity.created_at), "MMM d, yyyy")}
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), "h:mm a")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(activity.action)}>{activity.action}</Badge>
                          </TableCell>
                          <TableCell className={`hidden md:table-cell ${getResourceTypeColor(activity.resource_type)}`}>
                            {activity.resource_type}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={activity.details}>
                            {activity.details}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {activity.ip_address}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {hasMore && !loading && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                    Load More
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="login" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="hidden md:table-cell">Resource</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length === 0 && !loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No activities found
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities
                      .filter((activity) => activity.resource_type === 'auth')
                      .map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(activity.created_at), "MMM d, yyyy")}
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), "h:mm a")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(activity.action)}>{activity.action}</Badge>
                          </TableCell>
                          <TableCell className={`hidden md:table-cell ${getResourceTypeColor(activity.resource_type)}`}>
                            {activity.resource_type}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={activity.details}>
                            {activity.details}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {activity.ip_address}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {hasMore && !loading && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                    Load More
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              {/* Same table structure as above, filtered for data change activities */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
