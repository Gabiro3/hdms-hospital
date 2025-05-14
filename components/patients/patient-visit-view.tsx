"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, User, Activity, ClipboardList, FileText, Pill } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { generateSoapNote } from "@/services/patient-service"

interface PatientVisitViewProps {
  patient: any
  visit: any
  currentUser: any
}

export default function PatientVisitView({ patient, visit, currentUser }: PatientVisitViewProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isGeneratingNote, setIsGeneratingNote] = useState(false)
  const router = useRouter()

  // Format date
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMMM d, yyyy")
  }

  // Handle generate SOAP note
  const handleGenerateSoapNote = async () => {
    try {
      setIsGeneratingNote(true)
      const { note, error } = await generateSoapNote(visit.id, patient.id, currentUser.hospital_id)

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "SOAP Note Generated",
        description: "The SOAP note has been generated successfully.",
      })

      // Refresh the page to show the new note
      router.refresh()
    } catch (error) {
      console.error("Error generating SOAP note:", error)
      toast({
        title: "Error",
        description: "Failed to generate SOAP note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingNote(false)
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
            <h1 className="text-2xl font-semibold tracking-tight">Visit Details</h1>
            <p className="text-muted-foreground">
              {patient.name} - {formatDate(visit.visit_date)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/patients/${patient.id}`}>
              <User className="mr-2 h-4 w-4" />
              Patient Profile
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/patients/${patient.id}/prescriptions/new?visitId=${visit.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              Create Prescription
            </Link>
          </Button>
          <Button onClick={handleGenerateSoapNote} disabled={isGeneratingNote}>
            {isGeneratingNote ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate SOAP Note
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="notes">SOAP Notes</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <p>{formatDate(visit.visit_date)}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Doctor</p>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    <p>{visit.users?.full_name || visit.created_by_name || "Unknown"}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Reason for Visit</p>
                  <p className="font-medium">{visit.reason}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Completed
                  </Badge>
                </div>
              </div>

              {visit.notes?.subjective && (
                <div className="space-y-1 mt-4">
                  <p className="text-sm font-medium text-muted-foreground">Patient's Description</p>
                  <p className="text-gray-700 whitespace-pre-line">{visit.notes.subjective}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs</CardTitle>
            </CardHeader>
            <CardContent>
              {!visit.vitals || Object.values(visit.vitals).every((v) => !v) ? (
                <div className="text-center py-6">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">No vital signs were recorded for this visit.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {visit.vitals?.blood_pressure && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Blood Pressure</h3>
                      </div>
                      <p className="text-2xl font-bold">{visit.vitals.blood_pressure}</p>
                      <p className="text-sm text-muted-foreground">mmHg</p>
                    </div>
                  )}

                  {visit.vitals?.heart_rate && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Heart Rate</h3>
                      </div>
                      <p className="text-2xl font-bold">{visit.vitals.heart_rate}</p>
                      <p className="text-sm text-muted-foreground">bpm</p>
                    </div>
                  )}

                  {visit.vitals?.temperature && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Temperature</h3>
                      </div>
                      <p className="text-2xl font-bold">{visit.vitals.temperature}</p>
                      <p className="text-sm text-muted-foreground">°C</p>
                    </div>
                  )}

                  {visit.vitals?.respiratory_rate && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Respiratory Rate</h3>
                      </div>
                      <p className="text-2xl font-bold">{visit.vitals.respiratory_rate}</p>
                      <p className="text-sm text-muted-foreground">breaths/min</p>
                    </div>
                  )}

                  {visit.vitals?.oxygen_saturation && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Oxygen Saturation</h3>
                      </div>
                      <p className="text-2xl font-bold">{visit.vitals.oxygen_saturation}</p>
                      <p className="text-sm text-muted-foreground">%</p>
                    </div>
                  )}

                  {visit.vitals?.weight && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Weight</h3>
                      </div>
                      <p className="text-2xl font-bold">{visit.vitals.weight}</p>
                      <p className="text-sm text-muted-foreground">kg</p>
                    </div>
                  )}

                  {visit.vitals?.height && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Height</h3>
                      </div>
                      <p className="text-2xl font-bold">{visit.vitals.height}</p>
                      <p className="text-sm text-muted-foreground">cm</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SOAP Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {!visit.notes ||
              (!visit.notes.subjective && !visit.notes.examination && !visit.notes.assessment && !visit.notes.plan) ? (
                <div className="text-center py-6">
                  <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">No SOAP notes were recorded for this visit.</p>
                  <Button
                    onClick={handleGenerateSoapNote}
                    variant="outline"
                    className="mt-4"
                    disabled={isGeneratingNote}
                  >
                    {isGeneratingNote ? "Generating..." : "Generate SOAP Note"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {visit.notes.subjective && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                          S
                        </span>
                        Subjective
                      </h3>
                      <p className="text-gray-700 whitespace-pre-line pl-8">{visit.notes.subjective}</p>
                    </div>
                  )}

                  {visit.notes.examination && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                          O
                        </span>
                        Objective
                      </h3>
                      <p className="text-gray-700 whitespace-pre-line pl-8">{visit.notes.examination}</p>
                    </div>
                  )}

                  {visit.notes.assessment && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                          A
                        </span>
                        Assessment
                      </h3>
                      <p className="text-gray-700 whitespace-pre-line pl-8">{visit.notes.assessment}</p>
                    </div>
                  )}

                  {visit.notes.plan && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                          P
                        </span>
                        Plan
                      </h3>
                      <p className="text-gray-700 whitespace-pre-line pl-8">{visit.notes.plan}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prescribed Medications</CardTitle>
            </CardHeader>
            <CardContent>
              {!visit.medications || visit.medications.length === 0 ? (
                <div className="text-center py-6">
                  <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">No medications were prescribed during this visit.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href={`/patients/${patient.id}/prescriptions/new?visitId=${visit.id}`}>
                      Create Prescription
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {visit.medications.map((medication: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Pill className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">{medication.name}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {medication.dosage && (
                          <div>
                            <p className="text-sm text-muted-foreground">Dosage</p>
                            <p>{medication.dosage}</p>
                          </div>
                        )}
                        {medication.frequency && (
                          <div>
                            <p className="text-sm text-muted-foreground">Frequency</p>
                            <p>{medication.frequency}</p>
                          </div>
                        )}
                      </div>
                      {medication.notes && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-gray-700">{medication.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
