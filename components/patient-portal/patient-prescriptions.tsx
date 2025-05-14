"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Pill, Calendar, User, Share2, Clock, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { generatePrescriptionPDF } from "@/lib/utils/pdf-utils"
import { generateShareCode } from "@/services/prescription-service"

interface PatientPrescriptionsProps {
  patientId: string
  hospitalId: string
}

export default function PatientPrescriptions({ patientId, hospitalId }: PatientPrescriptionsProps) {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [isGeneratingShareCode, setIsGeneratingShareCode] = useState(false)

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await fetch(`/api/patients/${patientId}/prescriptions/general?source=patient`)

        if (!response.ok) {
          throw new Error("Failed to fetch prescriptions")
        }

        const data = await response.json()
        setPrescriptions(data.prescriptions || [])
      } catch (err) {
        console.error("Error fetching prescriptions:", err)
        setError("Unable to load prescriptions. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPrescriptions()
  }, [patientId, hospitalId])

  // Handle countdown timer for share code
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (shareDialogOpen && shareCode && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [shareDialogOpen, shareCode, countdown])

  // Reset countdown when dialog closes
  useEffect(() => {
    if (!shareDialogOpen) {
      setCountdown(60)
      setShareCode(null)
    }
  }, [shareDialogOpen])

  // Handle print prescription
  const handlePrintPrescription = async (prescription: any) => {
    try {
      setIsGeneratingPDF(true)
      await generatePrescriptionPDF(prescription)
      toast({
        title: "PDF Generated",
        description: "Prescription has been exported to PDF",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Handle share prescription
  const handleSharePrescription = async (prescription: any) => {
    try {
      setSelectedPrescription(prescription)
      setIsGeneratingShareCode(true)
      setShareDialogOpen(true)

      const result = await generateShareCode(prescription.id)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        setShareDialogOpen(false)
        return
      }

      setShareCode(result.shareCode)
    } catch (error) {
      console.error("Error generating share code:", error)
      toast({
        title: "Error",
        description: "Failed to generate share code. Please try again.",
        variant: "destructive",
      })
      setShareDialogOpen(false)
    } finally {
      setIsGeneratingShareCode(false)
    }
  }

  // Format frequency for display
  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case "1-0-0":
        return "Once daily (Morning)"
      case "0-1-0":
        return "Once daily (Afternoon)"
      case "0-0-1":
        return "Once daily (Evening)"
      case "1-0-1":
        return "Twice daily (Morning-Evening)"
      case "1-1-0":
        return "Twice daily (Morning-Afternoon)"
      case "0-1-1":
        return "Twice daily (Afternoon-Evening)"
      case "1-1-1":
        return "Three times daily"
      case "1-1-1-1":
        return "Four times daily"
      case "SOS":
        return "As needed (SOS)"
      case "other":
        return "Other (see instructions)"
      default:
        return frequency
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prescriptions</CardTitle>
          <CardDescription>View your prescription history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prescriptions</CardTitle>
          <CardDescription>View your prescription history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prescriptions</CardTitle>
          <CardDescription>View your prescription history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Pill className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">No Prescriptions Found</h3>
            <p className="text-muted-foreground mt-1">You don't have any prescriptions in our records.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group prescriptions by status
  const activePrescriptions = prescriptions.filter((p) => p.status === "active")
  const pastPrescriptions = prescriptions.filter((p) => p.status !== "active")

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Prescriptions</CardTitle>
          <CardDescription>View your prescription history</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">Active Prescriptions</TabsTrigger>
              <TabsTrigger value="past">Past Prescriptions</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activePrescriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Pill className="h-10 w-10 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium">No Active Prescriptions</h3>
                  <p className="text-muted-foreground mt-1">You don't have any active prescriptions at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePrescriptions.map((prescription) => (
                    <div key={prescription.id} className="border rounded-md p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">
                              {prescription.medications?.[0]?.name || "Prescription"}
                            </h3>
                            {prescription.medications?.length > 1 && (
                              <Badge variant="outline">+{prescription.medications.length - 1} more</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{format(parseISO(prescription.created_at), "MMMM d, yyyy")}</span>
                            <span className="text-gray-300">•</span>
                            <User className="h-3.5 w-3.5" />
                            <span>Dr. {prescription.users?.full_name || "Unknown"}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleSharePrescription(prescription)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintPrescription(prescription)}
                            disabled={isGeneratingPDF}
                          >
                            {isGeneratingPDF ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></span>
                            ) : (
                              <Pill className="h-4 w-4 mr-2" />
                            )}
                            Print
                          </Button>
                          <Button variant="default" size="sm" onClick={() => setSelectedPrescription(prescription)}>
                            View Details
                          </Button>
                        </div>
                      </div>

                      {selectedPrescription?.id === prescription.id && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Medications</h4>
                          <div className="space-y-3">
                            {prescription.medications?.map((medication: any, index: number) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-md">
                                <div className="flex justify-between">
                                  <h5 className="font-medium">{medication.name}</h5>
                                  {medication.type && (
                                    <Badge variant="outline" className="capitalize">
                                      {medication.type}
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Dosage</p>
                                    <p className="text-sm">{medication.dosage || "Not specified"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Frequency</p>
                                    <p className="text-sm">{formatFrequency(medication.frequency)}</p>
                                  </div>
                                </div>
                                {medication.instructions && (
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground">Instructions</p>
                                    <p className="text-sm">{medication.instructions}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end mt-4">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedPrescription(null)}>
                              Close
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastPrescriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Pill className="h-10 w-10 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium">No Past Prescriptions</h3>
                  <p className="text-muted-foreground mt-1">You don't have any past prescriptions in our records.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="border rounded-md p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">
                              {prescription.medications?.[0]?.name || "Prescription"}
                            </h3>
                            {prescription.medications?.length > 1 && (
                              <Badge variant="outline">+{prescription.medications.length - 1} more</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{format(parseISO(prescription.created_at), "MMMM d, yyyy")}</span>
                            <span className="text-gray-300">•</span>
                            <User className="h-3.5 w-3.5" />
                            <span>Dr. {prescription.users?.full_name || "Unknown"}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintPrescription(prescription)}
                            disabled={isGeneratingPDF}
                          >
                            {isGeneratingPDF ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></span>
                            ) : (
                              <Pill className="h-4 w-4 mr-2" />
                            )}
                            Print
                          </Button>
                          <Button variant="default" size="sm" onClick={() => setSelectedPrescription(prescription)}>
                            View Details
                          </Button>
                        </div>
                      </div>

                      {selectedPrescription?.id === prescription.id && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Medications</h4>
                          <div className="space-y-3">
                            {prescription.medications?.map((medication: any, index: number) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-md">
                                <div className="flex justify-between">
                                  <h5 className="font-medium">{medication.name}</h5>
                                  {medication.type && (
                                    <Badge variant="outline" className="capitalize">
                                      {medication.type}
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Dosage</p>
                                    <p className="text-sm">{medication.dosage || "Not specified"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Frequency</p>
                                    <p className="text-sm">{formatFrequency(medication.frequency)}</p>
                                  </div>
                                </div>
                                {medication.instructions && (
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground">Instructions</p>
                                    <p className="text-sm">{medication.instructions}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end mt-4">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedPrescription(null)}>
                              Close
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Share Code Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Prescription</DialogTitle>
            <DialogDescription>Share this code with your pharmacist to access your prescription</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4">
            {isGeneratingShareCode ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-sm text-muted-foreground">Generating share code...</p>
              </div>
            ) : shareCode ? (
              <>
                <div className="flex justify-center space-x-2 mb-4">
                  {shareCode.split("").map((digit, index) => (
                    <div
                      key={index}
                      className="w-12 h-16 flex items-center justify-center border-2 border-primary rounded-md bg-primary/5 text-2xl font-bold"
                    >
                      {digit}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-amber-600 mb-4">
                  <Clock className="h-4 w-4" />
                  <span>Code expires in {countdown} seconds</span>
                </div>

                <div className="text-center text-sm text-muted-foreground max-w-xs">
                  <p>This code will allow your pharmacist to access this prescription for the next 60 seconds.</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                <p className="text-red-600">Failed to generate share code</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setShareDialogOpen(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
