"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilePlus, Share2, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import SharedStudiesList from "./shared-studies-list"
import StudyRequestList from "./study-request-list"
import RequestStudyDialog from "./request-study-dialog"

interface SharedStudiesDashboardProps {
  sharedStudies: any[]
  studyRequests: any[]
  currentUser: any
}

export default function SharedStudiesDashboard({
  sharedStudies,
  studyRequests,
  currentUser,
}: SharedStudiesDashboardProps) {
  const [activeTab, setActiveTab] = useState("shared")
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const router = useRouter()

  // Handle study request creation
  const handleStudyRequested = () => {
    setShowRequestDialog(false)
    router.refresh()
  }

  // Count unviewed shared studies
  const unviewedCount = sharedStudies.filter((study) => !study.viewed).length

  // Count pending requests
  const pendingRequestsCount = studyRequests.filter(
    (request) => request.status === "pending" || request.status === "approved",
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Radiology Studies</h1>
          <p className="text-muted-foreground">View shared studies and request new radiology examinations</p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)}>
          <FilePlus className="mr-2 h-4 w-4" />
          Request Study
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shared Studies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sharedStudies.length}</div>
            <p className="text-xs text-muted-foreground">{unviewedCount} unviewed studies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Study Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studyRequests.length}</div>
            <p className="text-xs text-muted-foreground">{pendingRequestsCount} pending or in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowRequestDialog(true)}>
              <FilePlus className="mr-2 h-4 w-4" />
              New Request
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push("/radiology")}>
              <Share2 className="mr-2 h-4 w-4" />
              All Studies
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="shared" className="relative">
            <Share2 className="mr-2 h-4 w-4" />
            Shared With Me
            {unviewedCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {unviewedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            <Clock className="mr-2 h-4 w-4" />
            My Requests
            {pendingRequestsCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {pendingRequestsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shared" className="mt-6">
          <SharedStudiesList studies={sharedStudies} />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <StudyRequestList requests={studyRequests} onRequestNew={() => setShowRequestDialog(true)} />
        </TabsContent>
      </Tabs>

      <RequestStudyDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        userId={currentUser.id}
        hospitalId={currentUser.hospital_id}
        onStudyRequested={handleStudyRequested}
      />
    </div>
  )
}
