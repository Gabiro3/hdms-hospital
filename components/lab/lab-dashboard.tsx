"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, FileText, ClipboardList, FlaskConical, FlaskConicalIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getLabResults, getLabRequests } from "@/services/lab-service"
import LabResultsList from "@/components/lab/lab-results-list"
import LabRequestsList from "@/components/lab/lab-requests-list"
import CreateLabRequestDialog from "@/components/lab/create-lab-request-dialog"
import { toast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface LabDashboardProps {
  userId: string
}

export default function LabDashboard({ userId }: LabDashboardProps) {
  const [activeTab, setActiveTab] = useState("results")
  const [results, setResults] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLabTechnician, setIsLabTechnician] = useState(false)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.from("users").select("*, hospitals(*)").eq("id", userId).single()
      setUserProfile(data)
      setIsLabTechnician(data?.role === "LAB")
    }

    fetchUserProfile()
  }, [userId])

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.hospital_id) return

      setLoading(true)

      try {
        // Fetch lab results
        const { results: labResults, error: resultsError } = await getLabResults(userProfile.hospital_id, {
          includeShared: true,
          userId,
        })

        if (resultsError) {
          throw new Error(resultsError)
        }

        setResults(labResults || [])

        // Fetch lab requests
        const requestOptions = isLabTechnician ? { assignedTo: userId, status: "pending" } : { requestedBy: userId }

        const { requests: labRequests, error: requestsError } = await getLabRequests(
          userProfile.hospital_id,
          requestOptions,
        )

        if (requestsError) {
          throw new Error(requestsError)
        }

        setRequests(labRequests || [])
      } catch (error) {
        console.error("Error fetching lab data:", error)
        toast({
          title: "Error",
          description: "Failed to load lab data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userProfile, userId, isLabTechnician, toast])

  const handleCreateResult = () => {
    router.push("/lab/create")
  }

  const handleCreateRequest = () => {
    setIsRequestDialogOpen(true)
  }

  const handleRequestCreated = () => {
    // Refresh requests data
    if (userProfile?.hospital_id) {
      const fetchRequests = async () => {
        const requestOptions = isLabTechnician ? { assignedTo: userId, status: "pending" } : { requestedBy: userId }

        const { requests: labRequests } = await getLabRequests(userProfile.hospital_id, requestOptions)
        setRequests(labRequests || [])
      }

      fetchRequests()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Laboratory</h1>
          <p className="text-sm text-muted-foreground">
            Manage lab results and test requests for {userProfile?.hospitals?.name || "your hospital"}
          </p>
        </div>
        <div className="flex gap-2">
          {isLabTechnician ? (
            <Button onClick={handleCreateResult}>
              <Plus className="mr-2 h-4 w-4" />
              New Lab Result
            </Button>
          ) : (
            <Button onClick={handleCreateRequest}>
              <FlaskConicalIcon className="mr-2 h-4 w-4" />
              Request Lab Test
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="results" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="results" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Lab Results
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center">
            <ClipboardList className="mr-2 h-4 w-4" />
            Test Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <LabResultsList results={results} isLabTechnician={isLabTechnician} hospitalId={userProfile?.hospital_id} />
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <LabRequestsList
              requests={requests}
              isLabTechnician={isLabTechnician}
              hospitalId={userProfile?.hospital_id}
              onCreateResult={(requestId) => router.push(`/lab/create?requestId=${requestId}`)}
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateLabRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        userId={userId}
        hospitalId={userProfile?.hospital_id}
        onRequestCreated={handleRequestCreated}
      />
    </div>
  )
}
