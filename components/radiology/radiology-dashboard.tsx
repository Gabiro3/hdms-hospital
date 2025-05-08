"use client"

import { useState } from "react"
import Link from "next/link"
import { redirect, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Calendar, FilePlus, Filter, User, ImageIcon, Plus, Heart, LayoutGrid, ListFilter, Share2Icon } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import NewStudyDialog from "./new-study-dialog"

interface RadiologyDashboardProps {
  studies: any[]
  currentUser: any
}

export default function RadiologyDashboard({ studies, currentUser }: RadiologyDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("recent")
  const [showNewStudyDialog, setShowNewStudyDialog] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [modalityFilter, setModalityFilter] = useState<string>("all")
  const router = useRouter()

  // Filter studies based on search query and modality
  const filteredStudies = studies.filter((study) => {
    // Filter by search query
    const matchesSearch =
      !searchQuery ||
      study.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.study_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.accession_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.patient_id?.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by modality
    const matchesModality = modalityFilter === "all" || study.modality === modalityFilter

    return matchesSearch && matchesModality
  })

  // Handle study creation success
  const handleStudyCreated = (studyId: string) => {
    setShowNewStudyDialog(false)
    router.push(`/radiology/${studyId}`)
    toast({
      title: "Study Created",
      description: "New radiological study has been created successfully",
    })
  }

  // Group studies by date
  const studiesByDate: Record<string, any[]> = {}
  filteredStudies.forEach((study) => {
    const dateKey = format(new Date(study.study_date), "yyyy-MM-dd")
    if (!studiesByDate[dateKey]) {
      studiesByDate[dateKey] = []
    }
    studiesByDate[dateKey].push(study)
  })

  // Group studies by modality for the dashboard stats
  const studiesByModality: Record<string, number> = {}
  studies.forEach((study) => {
    const modality = study.modality || "Unknown"
    studiesByModality[modality] = (studiesByModality[modality] || 0) + 1
  })

  // Get unique modalities for the filter
  const uniqueModalities = Array.from(new Set(studies.map((study) => study.modality))).filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Radiology Dashboard</h1>
          <p className="text-muted-foreground">View, analyze and report on radiological studies</p>
        </div>
        {/* Button group */}
  <div className="flex gap-2">
    <Button onClick={() => setShowNewStudyDialog(true)}>
      <FilePlus className="mr-2 h-4 w-4" />
      New Study
    </Button>
    <Button onClick={() => redirect("/radiology/shared")} variant={"outline"}>
      <Share2Icon className="mr-2 h-4 w-4" />
      Shared Studies
    </Button>
  </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Studies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studies.length}</div>
            <p className="text-xs text-muted-foreground">
              +{studies.filter((s) => new Date(s.study_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}{" "}
              in the last 7 days
            </p>
          </CardContent>
        </Card>

        {/* Modality breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Modality Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(studiesByModality)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([modality, count]) => (
                <div key={modality} className="flex items-center justify-between">
                  <Badge variant="outline">{modality}</Badge>
                  <span className="text-sm">{count}</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studies.filter((s) => new Date(s.study_date) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-xs text-muted-foreground">Studies in the last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studies.filter((s) => s.report_status === "pending" || !s.report_status).length}
            </div>
            <p className="text-xs text-muted-foreground">Studies awaiting reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <TabsList>
            <TabsTrigger value="recent">Recent Studies</TabsTrigger>
            <TabsTrigger value="mine">My Studies</TabsTrigger>
            <TabsTrigger value="pending">Pending Reports</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-muted" : ""}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-muted" : ""}
            >
              <ListFilter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search studies by patient name, description or ID..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={modalityFilter} onValueChange={setModalityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by modality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modalities</SelectItem>
              {uniqueModalities.map((modality) => (
                <SelectItem key={modality} value={modality}>
                  {modality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="recent" className="mt-6">
          {Object.keys(studiesByDate).length === 0 ? (
            <Card>
              <CardContent className="flex h-60 flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No studies found</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {searchQuery || modalityFilter !== "all"
                    ? "No studies match your search criteria. Try adjusting your search or filters."
                    : "No recent studies available. Create a new study to get started."}
                </p>
                <Button onClick={() => setShowNewStudyDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Study
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(studiesByDate)
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                .map(([date, dateStudies]) => (
                  <div key={date}>
                    <h2 className="text-lg font-medium mb-4">{format(new Date(date), "MMMM d, yyyy")}</h2>
                    {viewMode === "grid" ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {dateStudies.map((study) => (
                          <Card key={study.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <Badge variant="outline">{study.modality}</Badge>
                                <Badge
                                  variant={
                                    study.report_status === "completed"
                                      ? "secondary"
                                      : study.report_status === "in-progress"
                                        ? "outline"
                                        : "default"
                                  }
                                >
                                  {study.report_status || "Pending"}
                                </Badge>
                              </div>
                              <CardTitle className="text-base mt-2 line-clamp-1">{study.study_description}</CardTitle>
                              <CardDescription className="line-clamp-1">
                                {study.patient_name || "Unknown Patient"}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="flex justify-between items-center text-sm mb-2">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <span>{format(new Date(study.study_date), "h:mm a")}</span>
                                </div>
                                <div className="flex items-center">
                                  <ImageIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <span>{study.image_count || 0} images</span>
                                </div>
                              </div>
                              <div className="flex items-center text-sm">
                                <User className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span className="line-clamp-1">Patient ID: {study.patient_id || "Unknown"}</span>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button asChild className="w-full">
                                <Link href={`/radiology/${study.id}`}>View Study</Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <div className="rounded-md border divide-y">
                          {dateStudies.map((study) => (
                            <div key={study.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                              <div className="flex flex-1 items-center">
                                <div className="mr-4">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10">
                                      {study.modality?.substring(0, 2) || "IM"}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center">
                                    <p className="text-sm font-medium mr-2 truncate">{study.study_description}</p>
                                    <Badge variant="outline" className="shrink-0">
                                      {study.modality}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <User className="h-3 w-3 mr-1" />
                                    <span className="truncate">{study.patient_name || "Unknown Patient"}</span>
                                    <span className="mx-1">•</span>
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <span>{format(new Date(study.study_date), "h:mm a")}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4 flex items-center space-x-2">
                                <Badge
                                  variant={
                                    study.report_status === "completed"
                                      ? "secondary"
                                      : study.report_status === "in-progress"
                                        ? "outline"
                                        : "default"
                                  }
                                >
                                  {study.report_status || "Pending"}
                                </Badge>
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/radiology/${study.id}`}>View</Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          {/* Filter studies created by current user */}
          {filteredStudies.filter((study) => study.created_by === currentUser.id).length === 0 ? (
            <Card>
              <CardContent className="flex h-60 flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No studies created by you</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  You haven't created any studies yet. Create a new study to get started.
                </p>
                <Button onClick={() => setShowNewStudyDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Study
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Same view as recent but filtered */}
              {/* Implementation similar to "recent" tab */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {/* Filter studies with pending reports */}
          {filteredStudies.filter((study) => study.report_status === "pending" || !study.report_status).length === 0 ? (
            <Card>
              <CardContent className="flex h-60 flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <Filter className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No pending reports</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  There are no studies with pending reports matching your criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Same view as recent but filtered */}
              {/* Implementation similar to "recent" tab */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {/* Filter studies with completed reports */}
          {filteredStudies.filter((study) => study.report_status === "completed").length === 0 ? (
            <Card>
              <CardContent className="flex h-60 flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <Filter className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No completed reports</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  There are no studies with completed reports matching your criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Same view as recent but filtered */}
              {/* Implementation similar to "recent" tab */}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewStudyDialog
        open={showNewStudyDialog}
        onOpenChange={setShowNewStudyDialog}
        userId={currentUser.id}
        hospitalId={currentUser.hospital_id}
        onStudyCreated={handleStudyCreated}
      />
    </div>
  )
}
