"use client"

import { useState } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Printer, Pill } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { generatePrescriptionPDF } from "@/lib/utils/pdf-utils"

interface PrescriptionsListProps {
  prescriptions: any[]
  patient?: any
}

export default function PrescriptionsList({ prescriptions, patient }: PrescriptionsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null)

  // Filter prescriptions based on search query
  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.medications?.some((med: any) => med.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prescription.users?.full_name &&
        prescription.users.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prescription.notes && prescription.notes.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Handle print prescription
  const handlePrintPrescription = async (prescription: any) => {
    try {
      setIsGeneratingPDF(prescription.id)
      await generatePrescriptionPDF({
        ...prescription,
        patient: patient || { name: prescription.patient_name || "Unknown Patient" },
      })
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
      setIsGeneratingPDF(null)
    }
  }

  return (
    <div className="space-y-4">

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Prescriptions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No prescriptions found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term." : "Prescriptions will appear here once they are created."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Medications</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>{format(parseISO(prescription.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {prescription.medications?.slice(0, 2).map((med: any, index: number) => (
                          <div key={index} className="flex items-center gap-1">
                            <Pill className="h-3 w-3 text-primary" />
                            <span className="text-sm">{med.name}</span>
                          </div>
                        ))}
                        {(prescription.medications?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{prescription.medications.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{prescription.duration} days</TableCell>
                    <TableCell>{prescription.users?.full_name || "Unknown"}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintPrescription(prescription)}
                          disabled={isGeneratingPDF === prescription.id}
                          title="Print prescription"
                        >
                          {isGeneratingPDF === prescription.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="View prescription details">
                          <Link href={`/prescriptions/${prescription.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
