"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, User, Clock, MoreVertical, Trash2, FileText, Plus, AlertCircle } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cancelRadiologyRequest } from "@/services/radiology-service"
import { useToast } from "@/components/ui/use-toast"

interface StudyRequestListProps {
  requests: any[]
  onRequestNew: () => void
}

export default function StudyRequestList({ requests, onRequestNew }: StudyRequestListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("newest")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Filter and sort requests
  const filteredRequests = requests
    .filter((request) => {
      // Filter by search query
      const matchesSearch =
        !searchQuery ||
        request.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.study_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.clinical_details?.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by status
      const matchesStatus = statusFilter === "all" || request.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Sort by date
      if (sortOrder === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
    })

  // Handle request cancellation
  const handleCancelRequest = (id: string) => {
    setRequestToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Confirm cancellation
  const confirmCancelRequest = async () => {
    if (!requestToDelete) return

    try {
      const { error } = await cancelRadiologyRequest(requestToDelete)

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "Request Cancelled",
        description: "The radiology study request has been cancelled successfully.",
      })

      router.refresh()
    } catch (error) {
      console.error("Error cancelling request:", error)
      toast({
        title: "Error",
        description: "Failed to cancel the request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setRequestToDelete(null)
    }
  }

  // Get status badge
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
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Approved
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Handle view study result
  const handleViewStudyResult = (request: any) => {
    if (request.study_id) {
      router.push(`/radiology/${request.study_id}`)
    } else {
      toast({
        title: "No Study Available",
        description: "The radiologist hasn't uploaded the study results yet.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by patient or study type..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex h-60 flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No study requests found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {searchQuery || statusFilter !== "all"
                ? "No requests match your search criteria. Try adjusting your search or filters."
                : "You haven't made any radiology study requests yet."}
            </p>
            <Button onClick={onRequestNew}>
              <Plus className="mr-2 h-4 w-4" />
              Request New Study
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{request.study_type}</h3>
                          {getStatusBadge(request.status)}
                          {request.priority === "urgent" && <Badge variant="destructive">Urgent</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Patient: {request.patient_name || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                      <p className="text-muted-foreground">
  Requested {formatDistanceToNow(new Date(request.created_at + "Z"), { addSuffix: true })}
</p>

                        {request.assigned_to_name && (
                          <p className="font-medium">Assigned to: {request.assigned_to_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{format(new Date(request.created_at), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>ID: {request.patient_id || "Unknown"}</span>
                      </div>
                      {request.scheduled_date && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>Scheduled: {format(new Date(request.scheduled_date), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {request.rejection_reason && (
                        <div className="flex items-center text-red-500">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <span>Reason: {request.rejection_reason}</span>
                        </div>
                      )}
                    </div>

                    {request.clinical_details && (
                      <div className="mt-3 text-sm">
                        <p className="text-muted-foreground">Clinical Details:</p>
                        <p className="mt-1">{request.clinical_details}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t md:border-l md:border-t-0 p-4 bg-muted/30">
                    <div className="flex gap-2">
                      {request.status === "completed" && request.study_id && (
                        <Button onClick={() => handleViewStudyResult(request)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Results
                        </Button>
                      )}

                      {(request.status === "pending" || request.status === "approved") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleCancelRequest(request.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Cancel Request
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Radiology Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this radiology study request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep request</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelRequest} className="bg-red-600 hover:bg-red-700">
              Yes, cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
