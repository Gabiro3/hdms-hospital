"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Eye, Printer } from "lucide-react"
import { updateReport } from "@/services/report-service"
import { generateReportPDF } from "@/lib/utils/pdf-utils"
import ClinicalReportForm from "./report-forms/clinical-report-form"
import ProgressReportForm from "./report-forms/progress-report-form"
import DischargeReportForm from "./report-forms/discharge-report-form"
import RadiologyReportForm from "./report-forms/radiology-report-form"

interface ReportEditFormProps {
  report: any
  currentUser: any
}

export default function ReportEditForm({ report, currentUser }: ReportEditFormProps) {
  const [title, setTitle] = useState(report.title || "")
  const [status, setStatus] = useState(report.status || "draft")
  const [content, setContent] = useState(report.content || {})
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const router = useRouter()

  // Handle saving the report
  const handleSaveReport = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Report title cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { report: updatedReport, error } = await updateReport(report.id, {
        title,
        content,
        status,
        updated_at: new Date().toISOString(),
      })

      if (error) throw new Error(error)

      toast({
        title: "Success",
        description: "Report saved successfully",
      })

      router.push(`/reports/${report.id}`)
    } catch (error) {
      console.error("Error saving report:", error)
      toast({
        title: "Error",
        description: "Failed to save report",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle generating PDF
  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      await generateReportPDF({
        ...report,
        title,
        content,
        status,
      })
      toast({
        title: "Success",
        description: "PDF generated successfully",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Render the appropriate report form based on type
  const renderReportForm = () => {
    switch (report.report_type) {
      case "clinical":
        return <ClinicalReportForm content={content} setContent={setContent} />
      case "progress":
        return <ProgressReportForm content={content} setContent={setContent} />
      case "discharge":
        return <DischargeReportForm content={content} setContent={setContent} />
      case "radiology":
      case "laboratory":
      case "pathology":
        return <RadiologyReportForm content={content} setContent={setContent} reportType={report.report_type} />
      default:
        return <GenericReportForm content={content} setContent={setContent} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Edit Report</h1>
            <p className="text-muted-foreground">Edit and update the report details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/reports/${report.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button variant="outline" onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                Generating...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Preview PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
          <CardDescription>Basic information about the report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter report title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {status === "draft"
                ? "Draft reports can be edited later."
                : "Final reports cannot be edited once finalized. Make sure all information is correct."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Report Type</Label>
            <Input
              value={report.report_type?.charAt(0).toUpperCase() + report.report_type?.slice(1) || "Unknown"}
              disabled
            />
          </div>

          {report.patient_id && (
            <div className="space-y-2">
              <Label>Patient</Label>
              <Input value={report.patients?.name || report.patient_id} disabled />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Content</CardTitle>
          <CardDescription>Enter the details of the report</CardDescription>
        </CardHeader>
        <CardContent>{renderReportForm()}</CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSaveReport} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Report
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Generic report form for report types that don't have a specialized form
function GenericReportForm({ content, setContent }: { content: any; setContent: (content: any) => void }) {
  const [text, setText] = useState(
    typeof content === "string" ? content : content.text || JSON.stringify(content, null, 2),
  )

  useEffect(() => {
    try {
      // Try to parse as JSON if it looks like it might be JSON
      if (text.trim().startsWith("{") && text.trim().endsWith("}")) {
        const parsedContent = JSON.parse(text)
        setContent(parsedContent)
      } else {
        // Otherwise treat as plain text
        setContent({ text })
      }
    } catch (e) {
      // If parsing fails, treat as plain text
      setContent({ text })
    }
  }, [text, setContent])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">Report Content</Label>
        <Textarea
          id="content"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter report content"
          className="min-h-[300px] font-mono"
        />
      </div>
    </div>
  )
}
