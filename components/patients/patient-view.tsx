"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Search,
  Calendar,
  FileText,
  Eye,
  Printer,
  Activity,
  Pill,
  ClipboardList,
  UserRound,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Heart,
  Clock,
  PenLine,
  CreditCard,
  FileCheck,
  DollarSign,
  Check,
  Copy,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { generatePatientPDF } from "@/lib/utils/pdf-utils"
import PatientTimeline from "./patient-timeline"
import PatientVitalsChart from "./patient-vitals-chart"
import PatientVisitForm from "./patient-visit-form"
import { getPatientInsuranceInfo } from "@/services/insurance-service"
import PrescriptionsList from "@/components/prescriptions/prescriptions-list"
import { getPatientPrescriptions } from "@/services/prescription-service"

interface PatientViewProps {
  patient: any
  currentUser: any
}

export default function PatientView({ patient, currentUser }: PatientViewProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [copied, setCopied] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showVisitForm, setShowVisitForm] = useState(false)
  const router = useRouter()
  const [insuranceInfo, setInsuranceInfo] = useState<any>(null)
  const [isLoadingInsurance, setIsLoadingInsurance] = useState(false)

  // Filter diagnoses based on search query
  const filteredDiagnoses =
    patient.diagnoses?.filter(
      (diagnosis: any) =>
        diagnosis.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (diagnosis.doctor_notes && diagnosis.doctor_notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (diagnosis.users?.full_name && diagnosis.users.full_name.toLowerCase().includes(searchQuery.toLowerCase())),
    ) || []

  // Filter visits based on search query
  const filteredVisits =
    patient.visits?.filter(
      (visit: any) =>
        visit.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (visit.notes?.subjective && visit.notes.subjective.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (visit.users?.full_name && visit.users.full_name.toLowerCase().includes(searchQuery.toLowerCase())),
    ) || []

  // Handle print patient data
  const handlePrintPatient = async () => {
    try {
      setIsGeneratingPDF(true)
      await generatePatientPDF(patient)
      toast({
        title: "PDF Generated",
        description: "Patient information has been exported to PDF",
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

  // Handle copy patient ID
  const copyToClipboard = () => {
    navigator.clipboard.writeText(patient?.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const handleViewPatientRecords = () => {
    // Redirect to the patient's records page
    router.push(`/patients/${patient?.id}/records`);
  };

  // Handle visit form submission
  const handleVisitSubmitted = () => {
    setShowVisitForm(false)
    router.refresh()
    toast({
      title: "Visit Recorded",
      description: "Patient visit has been recorded successfully",
    })
  }

  // Format date of birth
  const formatDateOfBirth = () => {
    if (patient.patient_info?.demographics?.dateOfBirth) {
      return format(new Date(patient.patient_info.demographics.dateOfBirth), "MMMM d, yyyy")
    }
    return "Not recorded"
  }

  // Calculate age
  const calculateAge = () => {
    if (patient.patient_info?.demographics?.age) {
      return patient.patient_info.demographics.age
    }
    if (patient.patient_info?.demographics?.dateOfBirth) {
      const birthDate = new Date(patient.patient_info.demographics.dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }
    return "Unknown"
  }

  useEffect(() => {
    async function fetchData() {
      if (!patient.id) return

      setIsLoadingInsurance(true)
      try {
        // Fetch insurance info
        const { policy, claims, error } = await getPatientInsuranceInfo(patient.id)
        if (!error) {
          setInsuranceInfo({ policy, claims })
        }

        // Fetch prescriptions
        const { prescriptions } = await getPatientPrescriptions(patient.id, currentUser.hospital_id)
        if (prescriptions) {
          patient.prescriptions = prescriptions
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoadingInsurance(false)
      }
    }

    fetchData()
  }, [patient?.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {patient.name || `Patient ${patient.id}`}
            </h1>
            <p className="text-sm text-muted-foreground">Patient ID: {patient.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewPatientRecords}>
                <FileText className="mr-2 h-4 w-4" />
                Request Patient Records
          </Button>
          <Button variant="outline" onClick={handlePrintPatient} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                Generating...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print Patient Data
              </>
            )}
          </Button>
          <Dialog open={showVisitForm} onOpenChange={setShowVisitForm}>
            <DialogTrigger asChild>
              <Button>
                <PenLine className="mr-2 h-4 w-4" />
                Record Visit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Record Patient Visit</DialogTitle>
                <DialogDescription>
                  Enter the details of the patient visit. This will be added to the patient's medical record.
                </DialogDescription>
              </DialogHeader>
              <PatientVisitForm
                patient={patient}
                hospitalId={currentUser.hospital_id}
                userId={currentUser.id}
                doctorName={currentUser.full_name}
                onSubmitted={handleVisitSubmitted}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {patient.name ? patient.name.charAt(0).toUpperCase() : patient.id.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{patient.name || "Unknown"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
                  <p className="font-medium">{patient.id}</p>
                  <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-700"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDateOfBirth()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Age</p>
                  <p className="font-medium">{calculateAge()}</p>
                </div>
              </div>

              {patient.patient_info?.demographics?.gender && (
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{patient.patient_info.demographics.gender}</p>
                  </div>
                </div>
              )}

              {patient.patient_info?.medical?.bloodType && patient.patient_info.medical.bloodType !== "unknown" && (
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Blood Type</p>
                    <p className="font-medium">{patient.patient_info.medical.bloodType}</p>
                  </div>
                </div>
              )}

              {patient.patient_info?.contact?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="font-medium">{patient.patient_info.contact.phone}</p>
                  </div>
                </div>
              )}

              {patient.patient_info?.contact?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-medium">{patient.patient_info.contact.email}</p>
                  </div>
                </div>
              )}

              {patient.patient_info?.contact?.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="font-medium">{patient.patient_info.contact.address}</p>
                  </div>
                </div>
              )}
            </div>

            {patient.patient_info?.medical?.allergies && (
              <div className="mt-4 rounded-md bg-red-50 p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Allergies</h3>
                    <p className="mt-1 text-sm text-red-700">{patient.patient_info.medical.allergies}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/patients/${patient.id}/edit`}>
                <PenLine className="mr-2 h-4 w-4" />
                Edit Patient Information
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="medical">Medical Info</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <PatientTimeline patient={patient} />

                    {patient.visits && patient.visits.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Recent Vitals</h3>
                        <PatientVitalsChart visits={patient.visits} />
                      </div>
                    )}

                    {patient.patient_info?.medical?.chronicConditions && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Chronic Conditions</h3>
                        <p className="text-gray-700">{patient.patient_info.medical.chronicConditions}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-medium mb-2">Diagnosis Types</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Array.from(
                          new Set(
                            patient.diagnoses?.map((d: any) => {
                              if (d.patient_metadata?.scan_type) return d.patient_metadata.scan_type
                              const match = d.title?.match(/(CT|MRI|X-Ray|Ultrasound)/i)
                              return match ? match[0] : "Other"
                            }) || [],
                          ),
                        ).map((type) => (
                          <Badge key={type as string} variant="outline" className="bg-primary/10">
                            {type as string}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visits" className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search visits..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PenLine className="mr-2 h-4 w-4" />
                      Record Visit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Record Patient Visit</DialogTitle>
                      <DialogDescription>
                        Enter the details of the patient visit. This will be added to the patient's medical record.
                      </DialogDescription>
                    </DialogHeader>
                    <PatientVisitForm
                      patient={patient}
                      hospitalId={currentUser.hospital_id}
                      userId={currentUser.id}
                      doctorName={currentUser.full_name}
                      onSubmitted={handleVisitSubmitted}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {filteredVisits.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No Visits Found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      {searchQuery
                        ? "No visits match your search criteria. Try a different search term."
                        : "This patient doesn't have any recorded visits yet. Use the 'Record Visit' button to add one."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Vitals</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVisits.map((visit: any) => (
                          <TableRow key={visit.id}>
                            <TableCell>{format(parseISO(visit.visit_date), "MMM d, yyyy")}</TableCell>
                            <TableCell className="font-medium">{visit.reason}</TableCell>
                            <TableCell>{visit.users?.full_name || "Unknown"}</TableCell>
                            <TableCell>
                              {visit.vitals ? (
                                <div className="flex items-center">
                                  <Activity className="h-4 w-4 text-primary mr-1" />
                                  <span>Recorded</span>
                                </div>
                              ) : (
                                "Not recorded"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/patients/${patient.id}/visits/${visit.id}`}>
                                <Button variant="ghost" size="icon" title="View visit details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="diagnoses" className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search diagnoses..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button asChild>
                  <Link href={`/diagnoses/new?patientId=${patient.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    New Diagnosis
                  </Link>
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Images</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDiagnoses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No diagnoses found matching your search criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDiagnoses.map((diagnosis: any) => (
                          <TableRow key={diagnosis.id}>
                            <TableCell className="font-medium">{diagnosis.title}</TableCell>
                            <TableCell>{format(parseISO(diagnosis.created_at), "MMM d, yyyy")}</TableCell>
                            <TableCell>{diagnosis.users?.full_name || "Unknown"}</TableCell>
                            <TableCell>
                              {diagnosis.image_links && diagnosis.image_links.length > 0 ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {diagnosis.image_links.length}
                                </Badge>
                              ) : (
                                "0"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/diagnoses/${diagnosis.id}`}>
                                <Button variant="ghost" size="icon" title="View diagnosis details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search prescriptions..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button asChild>
                  <Link href={`/patients/${patient.id}/prescriptions/new`}>
                    <FileText className="mr-2 h-4 w-4" />
                    New Prescription
                  </Link>
                </Button>
              </div>

              {patient.prescriptions ? (
                <PrescriptionsList prescriptions={patient.prescriptions} patient={patient} />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <Pill className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No Prescriptions Found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      {searchQuery
                        ? "No prescriptions match your search criteria. Try a different search term."
                        : "This patient doesn't have any prescriptions yet. Use the 'New Prescription' button to create one."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="medical" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {patient.patient_info?.medical?.bloodType && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Blood Type</h3>
                      <p className="text-gray-700">
                        {patient.patient_info.medical.bloodType === "unknown"
                          ? "Not recorded"
                          : patient.patient_info.medical.bloodType}
                      </p>
                    </div>
                  )}

                  {patient.patient_info?.medical?.allergies && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Allergies</h3>
                      <div className="rounded-md bg-red-50 p-3">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                          <p className="text-red-700">{patient.patient_info.medical.allergies}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {patient.patient_info?.medical?.chronicConditions && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Chronic Conditions</h3>
                      <p className="text-gray-700">{patient.patient_info.medical.chronicConditions}</p>
                    </div>
                  )}

                  {patient.visits && patient.visits.some((v: any) => v.medications) && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Current Medications</h3>
                      <div className="space-y-2">
                        {patient.visits
                          .filter((v: any) => v.medications && v.medications.length > 0)
                          .slice(0, 1)
                          .map((visit: any) => (
                            <div key={visit.id} className="space-y-2">
                              {visit.medications.map((med: any, index: number) => (
                                <div key={index} className="flex items-start gap-2 p-2 border rounded-md">
                                  <Pill className="h-5 w-5 text-primary mt-0.5" />
                                  <div>
                                    <p className="font-medium">{med.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {med.dosage} - {med.frequency}
                                    </p>
                                    {med.notes && <p className="text-sm mt-1">{med.notes}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {patient.patient_info?.emergency && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Emergency Contact</h3>
                      {patient.patient_info.emergency.name ? (
                        <div className="space-y-2">
                          <p className="font-medium">{patient.patient_info.emergency.name}</p>
                          {patient.patient_info.emergency.relation && (
                            <p className="text-sm text-muted-foreground">
                              Relationship: {patient.patient_info.emergency.relation}
                            </p>
                          )}
                          {patient.patient_info.emergency.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <p>{patient.patient_info.emergency.phone}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No emergency contact information provided.</p>
                      )}
                    </div>
                  )}

                  {patient.patient_info?.notes && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Additional Notes</h3>
                      <p className="text-gray-700 whitespace-pre-line">{patient.patient_info.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insurance" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingInsurance ? (
                    <div className="flex justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : !insuranceInfo?.policy ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium">No Insurance Information</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-md">
                        This patient doesn't have any insurance information recorded.
                      </p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href={`/patients/${patient.id}/edit`}>Add Insurance Information</Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md bg-blue-50 p-4">
                        <div className="flex">
                          <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                          <div>
                            <h3 className="font-medium text-blue-800">Insurance Provider</h3>
                            <p className="text-blue-700 font-medium text-lg">{insuranceInfo.policy.insurers.name}</p>
                            <div className="mt-1 text-sm text-blue-600">
                              <p>Policy Number: {insuranceInfo.policy.policy_number}</p>
                              <p>
                                Status:{" "}
                                <Badge
                                  variant="outline"
                                  className={
                                    insuranceInfo.policy.status === "active"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }
                                >
                                  {insuranceInfo.policy.status.charAt(0).toUpperCase() +
                                    insuranceInfo.policy.status.slice(1)}
                                </Badge>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-3">Coverage Period</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                            <p className="font-medium">
                              {format(new Date(insuranceInfo.policy.start_date), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        {insuranceInfo.policy.end_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">End Date</p>
                              <p className="font-medium">
                                {format(new Date(insuranceInfo.policy.end_date), "MMMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {insuranceInfo.policy.coverage_details && (
                        <div>
                          <h3 className="text-lg font-medium mb-3">Coverage Details</h3>
                          <div className="space-y-3">
                            {insuranceInfo.policy.coverage_details.coverageType && (
                              <div className="flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Coverage Type</p>
                                  <p className="font-medium">{insuranceInfo.policy.coverage_details.coverageType}</p>
                                </div>
                              </div>
                            )}

                            {insuranceInfo.policy.coverage_details.deductible !== undefined && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Deductible</p>
                                  <p className="font-medium">
                                    ${insuranceInfo.policy.coverage_details.deductible.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}

                            {insuranceInfo.policy.coverage_details.copay !== undefined && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Co-pay</p>
                                  <p className="font-medium">
                                    ${insuranceInfo.policy.coverage_details.copay.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}

                            {insuranceInfo.policy.coverage_details.coverageLimit !== undefined && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Coverage Limit</p>
                                  <p className="font-medium">
                                    ${insuranceInfo.policy.coverage_details.coverageLimit.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {insuranceInfo.policy.coverage_details.coveredServices &&
                            insuranceInfo.policy.coverage_details.coveredServices.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Covered Services</p>
                                <div className="flex flex-wrap gap-2">
                                  {insuranceInfo.policy.coverage_details.coveredServices.map(
                                    (service: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-green-50 text-green-700 border-green-200"
                                      >
                                        {service}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {insuranceInfo.policy.coverage_details.exclusions &&
                            insuranceInfo.policy.coverage_details.exclusions.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Exclusions</p>
                                <div className="flex flex-wrap gap-2">
                                  {insuranceInfo.policy.coverage_details.exclusions.map(
                                    (exclusion: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-red-50 text-red-700 border-red-200"
                                      >
                                        {exclusion}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {insuranceInfo.policy.coverage_details.notes && (
                            <div className="mt-4 rounded-md bg-gray-50 p-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes</p>
                              <p className="text-sm text-gray-600">{insuranceInfo.policy.coverage_details.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {insuranceInfo.claims && insuranceInfo.claims.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-3">Recent Claims</h3>
                          <div className="space-y-3">
                            {insuranceInfo.claims.slice(0, 3).map((claim: any) => (
                              <div key={claim.id} className="rounded-md border p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">Claim #{claim.id.substring(0, 8)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Submitted: {format(new Date(claim.submitted_date), "MMM d, yyyy")}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={
                                      claim.status === "approved"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : claim.status === "rejected"
                                          ? "bg-red-50 text-red-700 border-red-200"
                                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    }
                                  >
                                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                                  </Badge>
                                </div>
                                <div className="mt-2 flex justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Amount Claimed</p>
                                    <p className="font-medium">${claim.claim_amount.toLocaleString()}</p>
                                  </div>
                                  {claim.approved_amount !== null && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Amount Approved</p>
                                      <p className="font-medium">${claim.approved_amount.toLocaleString()}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {insuranceInfo.claims.length > 3 && (
                            <Button variant="outline" className="mt-3 w-full" asChild>
                              <Link href={`/insurance/patients/${patient.id}/claims`}>View All Claims</Link>
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
                {insuranceInfo?.policy && (
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/insurance/policies/${insuranceInfo.policy.id}`}>View Full Insurance Details</Link>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
