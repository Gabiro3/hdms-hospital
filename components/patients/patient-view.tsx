"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, Calendar, User, Hospital, Clock, Search } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

interface PatientViewProps {
  patient: any
  diagnoses: any[]
}

export default function PatientView({ patient, diagnoses }: PatientViewProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  // Extract patient metadata from the first diagnosis if available
  const patientMetadata = diagnoses[0]?.patient_metadata || {}

  // Filter diagnoses based on search
  const filteredDiagnoses = diagnoses.filter(
    (diagnosis) =>
      diagnosis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (diagnosis.doctor_notes && diagnosis.doctor_notes.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {patientMetadata.name || `Patient: ${patient.id}`}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Patient ID: {patient.id}</span>
              {diagnoses.length > 0 && (
                <>
                  <span>•</span>
                  <span>{diagnoses.length} diagnoses</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {patientMetadata.name
                      ? patientMetadata.name.substring(0, 2).toUpperCase()
                      : patient.id.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{patientMetadata.name || "Unknown"}</h3>
                  <p className="text-sm text-muted-foreground">Patient ID: {patient.id}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                {patientMetadata.age_range && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Age Range</p>
                      <p className="text-sm text-muted-foreground">{patientMetadata.age_range}</p>
                    </div>
                  </div>
                )}
                {diagnoses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">First Diagnosis</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(diagnoses[diagnoses.length - 1].created_at), "PPP")}
                      </p>
                    </div>
                  </div>
                )}
                {diagnoses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Latest Diagnosis</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(diagnoses[0].created_at), "PPP")}
                      </p>
                    </div>
                  </div>
                )}
                {diagnoses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Hospital className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Hospital</p>
                      <p className="text-sm text-muted-foreground">{diagnoses[0].hospitals?.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Patient Diagnoses</CardTitle>
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="overview" className="tab-button">
                      <FileText className="mr-2 h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="diagnoses" className="tab-button">
                      <FileText className="mr-2 h-4 w-4" />
                      All Diagnoses
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Diagnosis Summary</h3>
                    {diagnoses.length === 0 ? (
                      <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="mt-4 text-sm font-medium">No diagnoses available</h3>
                        <p className="mt-2 text-xs text-muted-foreground">
                          This patient has no diagnoses recorded in the system.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground">Total Diagnoses</p>
                                <p className="text-3xl font-bold mt-1">{diagnoses.length}</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground">Latest Diagnosis</p>
                                <p className="text-xl font-medium mt-1">{diagnoses[0].title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(diagnoses[0].created_at), "PPP")}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <h4 className="font-medium mt-6">Recent Diagnoses</h4>
                        <div className="space-y-4">
                          {diagnoses.slice(0, 3).map((diagnosis) => (
                            <Card key={diagnosis.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h5 className="font-medium">{diagnosis.title}</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(diagnosis.created_at), "PPP")}
                                    </p>
                                    {diagnosis.doctor_notes && (
                                      <p className="text-sm mt-2 line-clamp-2">{diagnosis.doctor_notes}</p>
                                    )}
                                  </div>
                                  <Link href={`/diagnoses/${diagnosis.id}`}>
                                    <Button variant="outline" size="sm">
                                      View
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="diagnoses" className="mt-0 space-y-4">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search diagnoses..."
                      className="pl-9 mb-4"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {filteredDiagnoses.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Search className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mt-4 text-sm font-medium">No diagnoses found</h3>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {searchQuery
                          ? "We couldn't find any diagnoses matching your search criteria."
                          : "This patient has no diagnoses recorded in the system."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDiagnoses.map((diagnosis) => (
                        <Card key={diagnosis.id}>
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium">{diagnosis.title}</h5>
                                  {diagnosis.image_links && diagnosis.image_links.length > 0 && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      {diagnosis.image_links.length} images
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(diagnosis.created_at), "PPP")} • Dr.{" "}
                                  {diagnosis.users?.full_name || "Unknown"}
                                </p>
                                {diagnosis.doctor_notes && (
                                  <p className="text-sm mt-2 line-clamp-2">{diagnosis.doctor_notes}</p>
                                )}
                              </div>
                              <Link href={`/diagnoses/${diagnosis.id}`}>
                                <Button>View Details</Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
