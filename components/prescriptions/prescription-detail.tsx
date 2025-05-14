"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Calendar, User, Clock, Pill, FileText, Printer, AlertCircle } from "lucide-react"
import { generatePrescriptionPDF } from "@/lib/utils/pdf-utils"

interface PrescriptionDetailProps {
  prescription: any
}

export default function PrescriptionDetail({ prescription }: PrescriptionDetailProps) {
  const router = useRouter()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Handle print prescription
  const handlePrintPrescription = async () => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Prescription Details</h1>
            <p className="text-muted-foreground">
              {prescription.patient?.name || "Unknown Patient"} -{" "}
              {format(parseISO(prescription.created_at), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintPrescription} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                Generating...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print Prescription
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/patients/${prescription.patient_id}`}>
              <User className="mr-2 h-4 w-4" />
              Patient Profile
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Prescription Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="font-medium">{format(parseISO(prescription.created_at), "MMMM d, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patient</p>
                  <p className="font-medium">{prescription.patient?.name || "Unknown Patient"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Doctor</p>
                  <p className="font-medium">{prescription.users?.full_name || "Unknown"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="font-medium">{prescription.duration} days</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={
                      prescription.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : prescription.status === "completed"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                    }
                  >
                    {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            {prescription.patient_visits && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Related Visit</h3>
                <div className="border rounded-md p-3">
                  <p className="font-medium">{prescription.patient_visits.reason}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(prescription.patient_visits.visit_date), "MMMM d, yyyy")}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                    <Link href={`/patients/${prescription.patient_id}/visits/${prescription.visit_id}`}>
                      View Visit Details
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {prescription.notes && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Prescription Notes</h3>
                <div className="border rounded-md p-3">
                  <p className="text-sm whitespace-pre-line">{prescription.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Medications</CardTitle>
          </CardHeader>
          <CardContent>
            {prescription.medications?.length === 0 ? (
              <div className="text-center py-8">
                <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">No medications in this prescription.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {prescription.medications?.map((medication: any, index: number) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{medication.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {medication.type && (
                            <Badge variant="outline" className="capitalize">
                              {medication.type}
                            </Badge>
                          )}
                          {medication.strength && (
                            <Badge variant="outline" className="bg-blue-50">
                              {medication.strength}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-primary/10">
                        {index + 1}
                      </Badge>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dosage</p>
                        <p className="font-medium">{medication.dosage || "Not specified"}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                        <p className="font-medium">{formatFrequency(medication.frequency)}</p>
                      </div>
                    </div>

                    {medication.instructions && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground">Special Instructions</p>
                        <p className="text-sm mt-1">{medication.instructions}</p>
                      </div>
                    )}

                    {medication.notes && (
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-gray-700">Notes</p>
                        <p className="text-sm text-gray-600 mt-1">{medication.notes}</p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Important Information</h3>
                      <p className="text-yellow-700 text-sm mt-1">
                        This prescription is valid for {prescription.duration} days from the date of issue. Please
                        follow the dosage instructions carefully.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
