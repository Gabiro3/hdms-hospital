"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, parseISO } from "date-fns"
import { Loader2, Share2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getPatientVisits, getPatientLabResults, sharePatientRecords } from "@/services/patient-records-service"

interface RecordSharingModalProps {
  isOpen: boolean
  onClose: () => void
  request: any
  onShareComplete: () => void
}

export default function RecordSharingModal({ isOpen, onClose, request, onShareComplete }: RecordSharingModalProps) {
  const [activeTab, setActiveTab] = useState<string>("visits")
  const [visits, setVisits] = useState<any[]>([])
  const [labResults, setLabResults] = useState<any[]>([])
  const [selectedVisits, setSelectedVisits] = useState<string[]>([])
  const [selectedLabResults, setSelectedLabResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { toast } = useToast()

  // Set active tab based on request type
  useEffect(() => {
    if (request) {
      if (request.record_type === "lab_results") {
        setActiveTab("lab_results")
      } else {
        setActiveTab("visits")
      }
    }
  }, [request])

  // Fetch patient records
  useEffect(() => {
    const fetchRecords = async () => {
      if (!request || !isOpen) return

      setIsLoading(true)
      try {
        // Fetch visits if needed
        if (request.record_type === "visits" || request.record_type === "all") {
          const { visits: patientVisits, error: visitsError } = await getPatientVisits(
            request.patient_id,
            request.requested_hospital_id,
          )

          if (visitsError) throw new Error(visitsError)
          setVisits(patientVisits || [])
        }

        // Fetch lab results if needed
        if (request.record_type === "lab_results" || request.record_type === "all") {
          const { results: patientLabResults, error: labError } = await getPatientLabResults(
            request.patient_id,
            request.requested_hospital_id,
          )

          if (labError) throw new Error(labError)
          setLabResults(patientLabResults || [])
        }
      } catch (error) {
        console.error("Error fetching patient records:", error)
        toast({
          title: "Error",
          description: "Failed to load patient records. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecords()
  }, [request, isOpen, toast])

  const handleSelectAllVisits = (checked: boolean) => {
    if (checked) {
      setSelectedVisits(visits.map((visit) => visit.id))
    } else {
      setSelectedVisits([])
    }
  }

  const handleSelectAllLabResults = (checked: boolean) => {
    if (checked) {
      setSelectedLabResults(labResults.map((result) => result.id))
    } else {
      setSelectedLabResults([])
    }
  }

  const handleToggleVisit = (visitId: string, checked: boolean) => {
    if (checked) {
      setSelectedVisits([...selectedVisits, visitId])
    } else {
      setSelectedVisits(selectedVisits.filter((id) => id !== visitId))
    }
  }

  const handleToggleLabResult = (resultId: string, checked: boolean) => {
    if (checked) {
      setSelectedLabResults([...selectedLabResults, resultId])
    } else {
      setSelectedLabResults(selectedLabResults.filter((id) => id !== resultId))
    }
  }

  const handleShareRecords = async () => {
    if (
      (activeTab === "visits" && selectedVisits.length === 0) ||
      (activeTab === "lab_results" && selectedLabResults.length === 0)
    ) {
      toast({
        title: "No Records Selected",
        description: "Please select at least one record to share.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { success, error } = await sharePatientRecords({
        requestId: request.id,
        patientId: request.patient_id,
        sourceHospitalId: request.requested_hospital_id,
        targetHospitalId: request.requesting_hospital_id,
        visitIds: selectedVisits,
        labResultIds: selectedLabResults,
      })

      if (error) throw new Error(error)

      toast({
        title: "Records Shared",
        description: "Patient records have been shared successfully.",
      })

      onShareComplete()
    } catch (error) {
      console.error("Error sharing records:", error)
      toast({
        title: "Error",
        description: "Failed to share patient records. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine if we should show the tab based on request type and available records
  const shouldShowVisitsTab = request?.record_type === "visits" || request?.record_type === "all"
  const shouldShowLabResultsTab = request?.record_type === "lab_results" || request?.record_type === "all"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Patient Records</DialogTitle>
          <DialogDescription>
            Select the records you want to share with {request?.requesting_hospital_name} for patient{" "}
            {request?.patient_name}
          </DialogDescription>
        </DialogHeader>

        {request?.is_urgent && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-red-800">Urgent Request</p>
                <p className="text-sm text-red-700">
                  This is marked as an urgent request. Please review and respond promptly.
                </p>
                {request?.reason && (
                  <p className="text-sm text-red-700 mt-1">
                    <span className="font-medium">Reason:</span> {request.reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              {shouldShowVisitsTab && <TabsTrigger value="visits">Visits ({visits.length})</TabsTrigger>}
              {shouldShowLabResultsTab && (
                <TabsTrigger value="lab_results">Lab Results ({labResults.length})</TabsTrigger>
              )}
            </TabsList>

            {shouldShowVisitsTab && (
              <TabsContent value="visits" className="mt-4">
                {visits.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No visits found for this patient.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="select-all-visits"
                        checked={selectedVisits.length === visits.length}
                        onCheckedChange={handleSelectAllVisits}
                      />
                      <label
                        htmlFor="select-all-visits"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Select All Visits
                      </label>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visits.map((visit) => (
                          <TableRow key={visit.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedVisits.includes(visit.id)}
                                onCheckedChange={(checked) => handleToggleVisit(visit.id, !!checked)}
                              />
                            </TableCell>
                            <TableCell>{format(parseISO(visit.visit_date), "MMM d, yyyy")}</TableCell>
                            <TableCell className="font-medium">{visit.reason}</TableCell>
                            <TableCell>{visit.users?.full_name || "Unknown"}</TableCell>
                            <TableCell>
                              {visit.notes ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Has Notes
                                </Badge>
                              ) : (
                                "No notes"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            )}

            {shouldShowLabResultsTab && (
              <TabsContent value="lab_results" className="mt-4">
                {labResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No lab results found for this patient.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="select-all-lab-results"
                        checked={selectedLabResults.length === labResults.length}
                        onCheckedChange={handleSelectAllLabResults}
                      />
                      <label
                        htmlFor="select-all-lab-results"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Select All Lab Results
                      </label>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Test Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {labResults.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedLabResults.includes(result.id)}
                                onCheckedChange={(checked) => handleToggleLabResult(result.id, !!checked)}
                              />
                            </TableCell>
                            <TableCell>{format(parseISO(result.created_at), "MMM d, yyyy")}</TableCell>
                            <TableCell className="font-medium">{result.title}</TableCell>
                            <TableCell>{result.result_type}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  result.status === "completed"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-yellow-50 text-yellow-700"
                                }
                              >
                                {result.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleShareRecords} disabled={isSubmitting || isLoading}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share Selected Records
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
