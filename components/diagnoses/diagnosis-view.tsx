"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import DoctorNotesForm from "./doctor-notes-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  Activity,
  Calendar,
  User,
  Hospital,
  Download,
  Printer,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  Edit,
} from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  printDiagnosis,
  downloadImageWithDisclaimer,
  downloadMultipleImagesWithDisclaimer,
} from "@/lib/utils/print-utils"
import PrintDiagnosis from "@/components/diagnoses/print-diagnosis"

interface DiagnosisViewProps {
  diagnosis: any // Using any for simplicity, but should be properly typed
}

export default function DiagnosisView({ diagnosis: initialDiagnosis }: DiagnosisViewProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Extract patient metadata
  const patientMetadata = diagnosis.patient_metadata || {}
  const aiAnalysis = diagnosis.ai_analysis_results || {}

  // Refresh diagnosis data when editing notes
  const handleNotesSuccess = () => {
    setIsEditingNotes(false)
    // Refresh the diagnosis data
    fetchDiagnosis()
  }

  // Fetch the latest diagnosis data
  const fetchDiagnosis = async () => {
    try {
      const { data } = await supabase
        .from("diagnoses")
        .select(`
          *,
          users (
            id,
            full_name,
            email
          ),
          hospitals (
            id,
            name,
            code
          )
        `)
        .eq("id", diagnosis.id)
        .single()

      if (data) {
        setDiagnosis(data)
      }
    } catch (error) {
      console.error("Error fetching diagnosis:", error)
    }
  }
  // Handle print
  const handlePrint = () => {
    printDiagnosis(diagnosis.id)
  }

  // Handle download all images
  const handleDownloadAllImages = () => {
    if (diagnosis.image_links && diagnosis.image_links.length > 0) {
      downloadMultipleImagesWithDisclaimer(diagnosis.image_links, `diagnosis-${diagnosis.id}-images.zip`)
    }
  }

  // Handle download single image
  const handleDownloadImage = (imageUrl: string, index: number) => {
    downloadImageWithDisclaimer(imageUrl, `diagnosis-${diagnosis.id}-image-${index + 1}.jpg`)
  }

  // Handle view image
  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  return (
    <div className="space-y-6">
      {/* Hidden print template */}
      <PrintDiagnosis diagnosis={diagnosis} id={diagnosis.id} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{diagnosis.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Patient ID: {diagnosis.patient_id}</span>
              <span>•</span>
              <span>{format(new Date(diagnosis.created_at), "PPP")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Add Notes
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadAllImages}
            disabled={!diagnosis.image_links || diagnosis.image_links.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Images
          </Button>
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
                      : diagnosis.patient_id.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{patientMetadata.name || "Unknown"}</h3>
                  <p className="text-sm text-muted-foreground">Patient ID: {diagnosis.patient_id}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date Created</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(diagnosis.created_at), "PPP")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Doctor</p>
                    <p className="text-sm text-muted-foreground">{diagnosis.users?.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hospital className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Hospital</p>
                    <p className="text-sm text-muted-foreground">{diagnosis.hospitals?.name}</p>
                  </div>
                </div>
                {patientMetadata.age_range && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Age Range</p>
                      <p className="text-sm text-muted-foreground">{patientMetadata.age_range}</p>
                    </div>
                  </div>
                )}
                {patientMetadata.scan_type && (
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Scan Type</p>
                      <p className="text-sm text-muted-foreground">{patientMetadata.scan_type}</p>
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
                  <CardTitle className="text-lg font-medium">Diagnosis Details</CardTitle>
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="overview" className="tab-button">
                      <FileText className="mr-2 h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="images" className="tab-button">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Images
                    </TabsTrigger>
                    <TabsTrigger value="ai-analysis" className="tab-button">
                      <Activity className="mr-2 h-4 w-4" />
                      AI Analysis
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Doctor's Notes</h3>
                    <div className="rounded-md bg-gray-50 p-4">
                      <p className="whitespace-pre-wrap text-gray-700">
                        {diagnosis.doctor_notes || "No notes provided"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Doctor's Assessment</h3>
                    <div className="rounded-md bg-gray-50 p-4">
                      <p className="whitespace-pre-wrap text-gray-700">
                        {diagnosis.doctor_assessment || "No notes provided"}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Diagnostic Images</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadAllImages}
                      disabled={!diagnosis.image_links || diagnosis.image_links.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All
                    </Button>
                  </div>
                  {!diagnosis.image_links || diagnosis.image_links.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <ImageIcon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mt-4 text-sm font-medium">No images available</h3>
                      <p className="mt-2 text-xs text-muted-foreground">Upload images to enhance the diagnosis</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {diagnosis.image_links.map((imageUrl: string, index: number) => (
                        <div key={index} className="group relative aspect-square overflow-hidden rounded-md border">
                          <img
                            src={imageUrl || "/placeholder.svg"}
                            alt={`Diagnostic image ${index + 1}`}
                            className="h-full w-full object-cover transition-all group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewImage(imageUrl)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadImage(imageUrl, index)
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ai-analysis" className="mt-0 space-y-6">
  <div>
    <h3 className="mb-2 text-lg font-medium">AI Analysis Results</h3>
    {Array.isArray(aiAnalysis.per_image) && aiAnalysis.per_image.length > 0 && (
      <>
        {/* 🔶 Warning badge */}
        <div className="border-2 border-amber-500 p-3 mb-4 bg-amber-50 text-amber-800 text-sm">
          <strong>Note:</strong> The AI analysis is provided as a supplementary tool and should be reviewed
          by a qualified medical professional.
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {aiAnalysis.per_image.map((imageData: any, index: number) => {
            const isPositive = imageData.label === "Pneumonia Positive"

            return (
              <div key={index} className="relative overflow-hidden rounded-md border shadow-sm">
                <img
                  src={imageData.imageUrl}
                  alt={`AI result ${index + 1}`}
                  className="h-48 w-full object-cover transition-transform hover:scale-105 cursor-zoom-in"
                  onClick={() => window.open(imageData.imageUrl, "_blank")}
                />
                <div className="absolute bottom-2 left-2">
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 px-2 py-1 text-sm ${isPositive ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}
                  >
                    {isPositive ? (
                      <>
                        <AlertCircle className="h-4 w-4" /> {imageData.label}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" /> {imageData.label}
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </>
    )}
    {!aiAnalysis || Object.keys(aiAnalysis).length === 0 ? (
      <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-4 text-sm font-medium">No AI analysis available</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          Run AI analysis to get insights on this diagnosis
        </p>
      </div>
    ) : (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium">Summary</h4>
            <p className="mt-1 text-gray-700">
  {aiAnalysis.overall_summary || aiAnalysis.prediction_label || ''}
  {aiAnalysis.confidence || aiAnalysis.confidence_score ? (
    <Badge className="ml-2">
      {aiAnalysis.confidence || aiAnalysis.confidence_score}%
    </Badge>
  ) : null}
</p>

          </CardContent>
        </Card>

        {aiAnalysis.findings && aiAnalysis.findings.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium">Findings</h4>
              <ul className="mt-2 space-y-2">
                {aiAnalysis.findings.map((finding: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {aiAnalysis.potential_conditions && aiAnalysis.potential_conditions.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium">Potential Conditions</h4>
              <div className="mt-4 space-y-3">
                {aiAnalysis.potential_conditions.map(
                  (condition: { name: string; probability: number }, index: number) => (
                    <div key={index}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">{condition.name}</span>
                        <span className="text-sm">{Math.round(condition.probability * 100)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.round(condition.probability * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mapping over the diseases and displaying them with confidence */}
        {aiAnalysis.diseases && aiAnalysis.diseases.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium">Diseases and Confidence Scores</h4>
              <ul className="mt-2 space-y-2">
                {aiAnalysis.diseases.map((disease: { disease: string; confidence: number }, index: number) => (
                  <li key={index} className="flex items-start justify-between">
                    <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <span className="font-medium">{disease.disease}</span>
                    <span className="text-sm">{disease.confidence}%</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {aiAnalysis.analysis_duration_ms !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">AI Model Accuracy</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              93%
            </Badge>
          </div>
        )}

        {aiAnalysis.analysisTimestamp && (
          <div className="text-xs text-muted-foreground">
            Analysis performed on {format(new Date(aiAnalysis.analysisTimestamp), "PPP p")}
          </div>
        )}
      </div>
    )}
  </div>
</TabsContent>

              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
      <Dialog open={isEditingNotes} onOpenChange={setIsEditingNotes}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Doctor Notes</DialogTitle>
      <DialogDescription>
        Update the doctor’s notes and assessment for this diagnosis.
      </DialogDescription>
    </DialogHeader>

    <DoctorNotesForm
      diagnosisId={diagnosis.id}
      initialNotes={diagnosis.doctor_notes || ""}
      initialAssessment={diagnosis.doctor_assessment || ""}
      onSuccess={handleNotesSuccess}
    />

    {/* Optional Footer if you want to include cancel/save buttons outside the form */}
    <DialogFooter>
      {/* Could place cancel button here if needed */}
    </DialogFooter>
  </DialogContent>
</Dialog>
      

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Diagnostic Image</DialogTitle>
            <DialogDescription>From diagnosis: {diagnosis.title}</DialogDescription>
          </DialogHeader>

          <div className="flex justify-center my-4">
            {selectedImage && (
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Diagnostic image"
                className="max-h-[60vh] object-contain"
              />
            )}
          </div>

          <div className="text-sm text-amber-600 bg-amber-50 p-3 border border-amber-200 rounded-md">
            <strong>Disclaimer:</strong> This image is part of an AI-assisted diagnosis and should be reviewed by a
            qualified medical professional. It should not be used as the sole basis for medical decisions.
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedImage(null)}>
              Close
            </Button>
            {selectedImage && (
              <Button
                onClick={() => {
                  const index = diagnosis.image_links.indexOf(selectedImage)
                  handleDownloadImage(selectedImage, index >= 0 ? index : 0)
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download with Disclaimer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
