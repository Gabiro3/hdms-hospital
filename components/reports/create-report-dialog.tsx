"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createReport } from "@/services/report-service"

interface CreateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  hospitalId: string
  onReportCreated?: (reportId: string) => void
}

const REPORT_TYPES = [
  { id: "clinical", name: "Clinical Report" },
  { id: "progress", name: "Progress Notes" },
  { id: "discharge", name: "Discharge Summary" },
  { id: "consultation", name: "Consultation Report" },
  { id: "operative", name: "Operative Report" },
  { id: "radiology", name: "Radiology Report" },
  { id: "laboratory", name: "Laboratory Report" },
  { id: "pathology", name: "Pathology Report" },
  { id: "work", name: "Work Report" },
]

// Default content templates for different report types
const DEFAULT_CONTENT: { [key: string]: any } = {
  clinical: {
    findings: "",
    diagnosis: "",
    treatment: "",
    recommendations: "",
  },
  progress: {
    subjective: "",
    objective: {
      vitals: {},
      examination: "",
    },
    assessment: "",
    plan: "",
  },
  discharge: {
    admissionDate: "",
    dischargeDate: "",
    admissionDiagnosis: "",
    dischargeDiagnosis: "",
    treatmentSummary: "",
    medications: [],
    followUpInstructions: "",
  },
  consultation: {
    reasonForConsultation: "",
    findings: "",
    impression: "",
    recommendations: "",
  },
  operative: {
    preOperativeDiagnosis: "",
    postOperativeDiagnosis: "",
    procedure: "",
    surgeon: "",
    anesthesia: "",
    findings: "",
    complications: "",
    disposition: "",
  },
  radiology: {
    examination: "",
    clinicalInformation: "",
    technique: "",
    findings: "",
    impression: "",
  },
  laboratory: {
    specimenCollected: "",
    testPerformed: "",
    results: {},
    interpretation: "",
    reference: {},
  },
  pathology: {
    specimenReceived: "",
    clinicalHistory: "",
    grossDescription: "",
    microscopicDescription: "",
    diagnosis: "",
    comments: "",
  },
  work: {
    period: "",
    summary: "",
    achievements: [],
    challenges: [],
    nextSteps: [],
  },
}

export default function CreateReportDialog({
  open,
  onOpenChange,
  userId,
  hospitalId,
  onReportCreated,
}: CreateReportDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [reportType, setReportType] = useState<string>("")
  const { toast } = useToast()
  const router = useRouter()

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form fields when closing
      setTitle("")
      setReportType("")
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title for the report.",
        variant: "destructive",
      })
      return
    }

    if (!reportType) {
      toast({
        title: "Missing Information",
        description: "Please select a report type.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Get default content for the selected report type
      const content = DEFAULT_CONTENT[reportType] || {}

      const { report, error } = await createReport({
        title,
        content,
        report_type: reportType,
        created_by: userId,
        hospital_id: hospitalId,
        status: "draft",
        is_template: false,
      })

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "Report Created",
        description: "Your new report has been created successfully.",
      })

      if (onReportCreated && report) {
        onReportCreated(report.id)
      } else {
        router.push(`/reports/${report.id}`)
      }
    } catch (error) {
      console.error("Error creating report:", error)
      toast({
        title: "Error",
        description: "Failed to create report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
          <DialogDescription>Create a new clinical report by entering the details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input
              id="title"
              placeholder="Enter report title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Medical Reports</SelectLabel>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                  Creating...
                </>
              ) : (
                "Create Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
