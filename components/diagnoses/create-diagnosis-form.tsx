"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Steps, Step } from "@/components/ui/steps"
import ImageUploader from "@/components/diagnoses/image-uploader"
import PatientForm, { type PatientFormValues, SCAN_TYPE_TO_ENDPOINT } from "@/components/diagnoses/patient-form"
import { toast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreateDiagnosisForm({ user }: { user: any }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [patientFormValues, setPatientFormValues] = useState<PatientFormValues | null>(null)
  const [apiEndpoint, setApiEndpoint] = useState<string>("/api/analyze")
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [diagnosisCreated, setDiagnosisCreated] = useState(false)
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null)

  const handleScanTypeChange = useCallback((scanType: string) => {
    // Set the appropriate API endpoint based on scan type
    const endpoint = SCAN_TYPE_TO_ENDPOINT[scanType as keyof typeof SCAN_TYPE_TO_ENDPOINT] || "/api/analyze"
    setApiEndpoint(endpoint)
    console.log(`Scan type changed to ${scanType}, using endpoint: ${endpoint}`)
  }, [])

  const handleFileSelect = useCallback((files: File[]) => {
    setSelectedFiles(files)
  }, [])

  const handlePatientFormChange = useCallback((values: PatientFormValues) => {
    setPatientFormValues(values)
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep === 1 && selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image file to continue.",
        variant: "destructive",
      })
      return
    }

    if (currentStep === 0 && (!patientFormValues || !patientFormValues.patientName || !patientFormValues.patientId)) {
      toast({
        title: "Incomplete patient information",
        description: "Please fill in all required patient information to continue.",
        variant: "destructive",
      })
      return
    }

    setCurrentStep((prev) => Math.min(prev + 1, 2))
  }, [currentStep, selectedFiles.length, patientFormValues])

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleViewDiagnosis = useCallback(() => {
    if (diagnosisId) {
      router.push(`/diagnoses/${diagnosisId}`)
    }
  }, [diagnosisId, router])

  const handleSubmit = useCallback(async () => {
    if (!patientFormValues || selectedFiles.length === 0) {
      toast({
        title: "Missing information",
        description: "Please complete all required fields before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setError(null)
    setProcessingStatus("Uploading image...")

    try {
      // Create form data for submission
      const formData = new FormData()
      if (selectedFiles.length > 1) {
        for (const file of selectedFiles) {
          formData.append("image", file)
        }
      }
      

      // Add the first image file (current implementation handles one image)
      formData.append("image", selectedFiles[0])

      // Add hospital ID from user
      formData.append("hospitalId", user.hospital_id)
      formData.append("userId", user.id)

      // Add patient metadata
      formData.append(
        "metadata",
        JSON.stringify({
          patientName: patientFormValues.patientName,
          patientId: patientFormValues.patientId,
          ageRange: patientFormValues.ageRange,
          scanType: patientFormValues.scanType,
          notes: patientFormValues.notes || "",
        }),
      )

      // Use the dynamically selected API endpoint based on scan type
      console.log(`Submitting to endpoint: ${apiEndpoint}`)
      setProcessingStatus("Processing with AI model...")

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create diagnosis")
      }

      const data = await response.json()

      setProcessingStatus("Diagnosis created successfully!")
      setDiagnosisCreated(true)
      setDiagnosisId(data.diagnosisId)

      toast({
        title: "Diagnosis created",
        description: "Your diagnosis has been successfully created and stored.",
      })

      // Move to success step
      setCurrentStep(3)
    } catch (err) {
      console.error("Error creating diagnosis:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create diagnosis",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [patientFormValues, selectedFiles, apiEndpoint, user.hospital_id])

  return (
    <div className="space-y-8">
      <Steps currentStep={currentStep} className="mb-8">
        <Step title="Patient Information" description="Enter patient details" />
        <Step title="Upload Images" description="Upload Scan Images" />
        <Step title="Review & Submit" description="Review and create diagnosis" />
        <Step title="Complete" description="Diagnosis created" />
      </Steps>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">

          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Patient Information</h3>
              <p className="text-sm text-muted-foreground">Enter patient details and scan information.</p>
              <PatientForm
                onFormValuesChange={handlePatientFormChange}
                onScanTypeChange={handleScanTypeChange}
                defaultValues={patientFormValues || undefined}
              />
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Upload Medical Images</h3>
              <p className="text-sm text-muted-foreground">
                Upload medical scan images for AI analysis. Supported formats: JPG, PNG, DICOM.
              </p>
              <ImageUploader onImagesChange={handleFileSelect} maxImages={30} />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Review & Submit</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Selected Images</h4>
                  <p className="text-sm text-muted-foreground">{selectedFiles.length} image(s) selected</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="border rounded p-2 text-sm">
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">Patient Information</h4>
                  {patientFormValues && (
                    <div className="mt-2 space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Name:</span> {patientFormValues.patientName}
                      </p>
                      <p>
                        <span className="font-medium">ID:</span> {patientFormValues.patientId}
                      </p>
                      <p>
                        <span className="font-medium">Age Range:</span> {patientFormValues.ageRange}
                      </p>
                      <p>
                        <span className="font-medium">Scan Type:</span> {patientFormValues.scanType}
                      </p>
                      {patientFormValues.notes && (
                        <p>
                          <span className="font-medium">Notes:</span> {patientFormValues.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Using specialized analysis for: {patientFormValues.scanType} ({apiEndpoint})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium">Diagnosis Created Successfully</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Your diagnosis has been created and stored in the system. The AI analysis has been completed and is
                ready for review.
              </p>
              <Button onClick={handleViewDiagnosis} className="mt-6">
                View Diagnosis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {currentStep < 3 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || isSubmitting}>
            Back
          </Button>

          {currentStep < 2 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {processingStatus}
                </>
              ) : (
                "Create Diagnosis"
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
