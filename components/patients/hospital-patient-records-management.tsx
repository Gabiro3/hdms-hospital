"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, parseISO } from "date-fns"
import { Eye, Download, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getPatientRecordRequests,
  getSharedRecords,
  updateRecordRequestStatus,
} from "@/services/patient-records-service"

interface HospitalRecordsProps {
  patientId: string
  hospitalId: string
}

export default function HospitalRecords({ patientId, hospitalId }: HospitalRecordsProps) {
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sharedRecords, setSharedRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (activeTab === "pending") {
          const { requests, error } = await getPatientRecordRequests(patientId, hospitalId)
          if (error) throw new Error(error)
          setPendingRequests(requests || [])
        } else {
          const { records, error } = await getSharedRecords(patientId, hospitalId)
          if (error) throw new Error(error)
          setSharedRecords(records || [])
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab} records:`, error)
        toast({
          title: "Error",
          description: `Failed to load ${activeTab} records. Please try again.`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [activeTab, patientId, hospitalId, toast])

  const handleUpdateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { success, error } = await updateRecordRequestStatus(requestId, status)

      if (error) throw new Error(error)

      // Update local state
      setPendingRequests(pendingRequests.filter((request) => request.id !== requestId))

      toast({
        title: "Request Updated",
        description: `The record request has been ${status}.`,
      })
    } catch (error) {
      console.error("Error updating request status:", error)
      toast({
        title: "Error",
        description: "Failed to update request status. Please try again.",
        variant: "destructive",
      })
    }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Records Management</CardTitle>
        <CardDescription>Manage record requests and view shared medical records from other hospitals</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending Requests</TabsTrigger>
            <TabsTrigger value="shared">Shared Records</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Pending Requests</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  There are no pending record requests for this patient.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Record Type</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.requested_hospital_name}</TableCell>
                      <TableCell>{getRecordTypeBadge(request.record_type)}</TableCell>
                      <TableCell>{format(parseISO(request.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="shared" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : sharedRecords.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Shared Records</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No records have been shared with your hospital for this patient.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Hospital</TableHead>
                    <TableHead>Record Type</TableHead>
                    <TableHead>Shared Date</TableHead>
                    <TableHead>Records Count</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sharedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.source_hospital_name}</TableCell>
                      <TableCell>{getRecordTypeBadge(record.record_type)}</TableCell>
                      <TableCell>{format(parseISO(record.shared_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{record.records_count}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/patients/${patientId}/shared-records/${record.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
