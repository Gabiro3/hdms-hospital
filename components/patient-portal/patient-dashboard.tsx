"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LogOut, User, FileText, Pill, Calendar, Activity, ClipboardList } from "lucide-react"
import { patientSignOut } from "@/services/patient-auth-service"
import PatientPrescriptions from "./patient-prescriptions"

interface PatientDashboardProps {
  patient: any
}

export default function PatientDashboard({ patient }: PatientDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  const handleSignOut = async () => {
    await patientSignOut()
  }

  return (
    <div className="flex min-h-screen flex-col px-4 sm:px-6 md:px-8 lg:px-10">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <User className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold">Patient Portal</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-6 sm:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {patient.name}</h1>
          <p className="text-muted-foreground mt-1">
            Patient ID: {patient.patient_id} | Hospital: {patient.hospitals?.name || "Unknown"}
          </p>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="records">Medical Records</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
                  <Pill className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">Active prescriptions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">Next appointment: --</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Visits</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">Last visit: --</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Test Results</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">Pending results</p>
                </CardContent>
              </Card>
            </div>

            {/* Personal Information & Hospital Info Cards */}
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                      <p className="font-medium">{patient.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Date of Birth</h3>
                      <p className="font-medium">{patient.patient_info.demographics['dateOfBirth'] || "--"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Gender</h3>
                      <p className="font-medium capitalize">{patient.patient_info.demographics['gender'] || "--"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Blood Type</h3>
                      <p className="font-medium">{patient.patient_info.medical['bloodType'] || "--"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Allergies</h3>
                      <p className="font-medium">{patient.patient_info.medical['allergies'] || "--"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                      <p className="font-medium">{patient.patient_info.contact['email'] || "--"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                      <p className="font-medium">{patient.patient_info.contact['phone']  || "--"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Address</h3>
                    <p className="font-medium">{patient.patient_info.contact['address']  || "--"}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Emergency Contact</h3>
                    <p className="font-medium">{patient.patient_info.emergency['name']  || "--"}</p>
                    <p className="text-sm text-muted-foreground">{patient.patient_info.emergency['phone'] || "--"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hospital Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Hospital</h3>
                    <p className="font-medium">{patient.hospitals?.name || "--"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                    <p className="font-medium">{patient.hospitals?.address || "--"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                    <p className="font-medium">{patient.hospitals?.phone || "--"}</p>
                    <p className="text-sm text-muted-foreground">{patient.hospitals?.email || "--"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="prescriptions">
            <PatientPrescriptions patientId={patient.id} hospitalId={patient.hospital_id} />
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>View and manage your upcoming appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium">No Appointments Found</h3>
                  <p className="text-muted-foreground mt-1">You don't have any upcoming appointments scheduled.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>Access your medical history and test results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium">Medical Records Coming Soon</h3>
                  <p className="text-muted-foreground mt-1">This feature is currently under development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Hospital Diagnosis Management System. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/patient-portal/help" className="text-sm text-muted-foreground hover:underline">
              Help & Support
            </Link>
            <Link href="/patient-portal/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
