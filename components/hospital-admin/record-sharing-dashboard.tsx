"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, parseISO } from "date-fns"
import { Eye, Share2, Clock, CheckCircle, XCircle, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getIncomingRecordRequests,
  getOutgoingRecordRequests,
  getSharedRecords,
} from "@/services/patient-records-service"
import RecordSharingModal from "./record-sharing-modal"

interface RecordSharingDashboardProps {
  hospitalId: string
}

export default function RecordSharingDashboard({ hospitalId }: RecordSharingDashboardProps) {
  const [activeTab, setActiveTab] = useState("incoming")
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([])
  const [sharedRecords, setSharedRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (activeTab === "incoming") {
          const { requests, error } = await getIncomingRecordRequests(hospitalId)
          if (error) throw new Error(error)
          setIncomingRequests(requests || [])
        } else if (activeTab === "outgoing") {
          const { requests, error } = await getOutgoingRecordRequests(hospitalId)
          if (error) throw new Error(error)
          setOutgoingRequests(requests || [])
        } else {
          const { records, error } = await getSharedRecords(null, hospitalId)
          if (error) throw new Error(error)
          setSharedRecords(records || [])
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab} data:`, error)
        toast({
          title: "Error",
          description: `Failed to load ${activeTab} data. Please try again.`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [activeTab, hospitalId, toast])

  const handleOpenShareModal = (request: any) => {
    setSelectedRequest(request)
    setIsShareModalOpen(true)
  }

  const handleShareComplete = () => {
    // Refresh the incoming requests list
    getIncomingRecordRequests(hospitalId).then(({ requests }) => {
      setIncomingRequests(requests || [])
    })

    setIsShareModalOpen(false)
    setSelectedRequest(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejected
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Expired
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRecordTypeBadge = (type: string) => {
    switch (type) {
      case "visits":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Visits
          </Badge>
        )
      case "lab_results":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Lab Tests
          </Badge>
        )
      case "all":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            All Records
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getUrgencyBadge = (isUrgent: boolean) => {
    return isUrgent ? (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        Urgent
      </Badge>
    ) : null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Records Sharing</CardTitle>
          <CardDescription>Manage record requests and view shared medical records between hospitals</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="incoming">Incoming Requests</TabsTrigger>
              <TabsTrigger value="outgoing">Outgoing Requests</TabsTrigger>
              <TabsTrigger value="shared">Shared Records</TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="mt-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : incomingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Incoming Requests</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    There are no incoming record requests from other hospitals.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-end mb-4">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Requesting Hospital</TableHead>
                        <TableHead>Record Type</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.patient_name}</TableCell>
                          <TableCell>{request.requesting_hospital_name}</TableCell>
                          <TableCell>{getRecordTypeBadge(request.record_type)}</TableCell>
                          <TableCell>{format(parseISO(request.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>{getUrgencyBadge(request.is_urgent)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenShareModal(request)}
                                disabled={request.status !== "pending"}
                              >
                                <Share2 className="h-4 w-4 mr-1" />
                                Share
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={request.status !== "pending"}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="outgoing" className="mt-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : outgoingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Outgoing Requests</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your hospital has not sent any record requests to other hospitals.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-end mb-4">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Requested Hospital</TableHead>
                        <TableHead>Record Type</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outgoingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.patient_name}</TableCell>
                          <TableCell>{request.requested_hospital_name}</TableCell>
                          <TableCell>{getRecordTypeBadge(request.record_type)}</TableCell>
                          <TableCell>{format(parseISO(request.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>{getUrgencyBadge(request.is_urgent)}</TableCell>
                          <TableCell>
                            {request.status === "approved" ? (
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/patients/${request.patient_id}/shared-records/${request.shared_record_id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </a>
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled>
                                <Clock className="h-4 w-4 mr-1" />
                                Waiting
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared" className="mt-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : sharedRecords.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Shared Records</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your hospital has not shared any patient records yet.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-end mb-4">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Shared With</TableHead>
                        <TableHead>Record Type</TableHead>
                        <TableHead>Shared Date</TableHead>
                        <TableHead>Records Count</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sharedRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.patient_name}</TableCell>
                          <TableCell>{record.target_hospital_name}</TableCell>
                          <TableCell>{getRecordTypeBadge(record.record_type)}</TableCell>
                          <TableCell>{format(parseISO(record.shared_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>{record.records_count}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/hospital-admin/shared-records/${record.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedRequest && (
        <RecordSharingModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          request={selectedRequest}
          onShareComplete={handleShareComplete}
        />
      )}
    </div>
  )
}
