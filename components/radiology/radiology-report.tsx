"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  CircleEllipsis,
  FileText,
  Save,
  Send,
  Printer,
  Download,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRadiologyState } from "./radiology-state-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function RadiologyReport() {
  const { state, updateReportState, saveReport, finalizeReport, setViewMode } = useRadiologyState()
  const [activeTab, setActiveTab] = useState("findings")

  // Handle report status change
  const handleStatusChange = (status: string) => {
    updateReportState({ status })
  }

  // Handle text changes in the report
  const handleTextChange = (field: "findings" | "impression" | "recommendations", value: string) => {
    updateReportState({ [field]: value })
  }

  // Handle save draft
  const handleSaveDraft = async () => {
    await saveReport()
  }

  // Handle finalize report
  const handleFinalizeReport = async () => {
    await finalizeReport()
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  // Handle download
  const handleDownload = () => {
    // In a real application, this would generate a PDF or other document format
    alert("Downloading report...")
  }

  // Format the last saved date
  const formatLastSaved = () => {
    if (!state.reportState.lastSaved) return "Never"
    return format(new Date(state.reportState.lastSaved), "PPP 'at' h:mm a")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode("images")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Radiology Report</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Patient: {state.study?.patient_name || "Unknown"}</span>
              <span>•</span>
              <span>{format(new Date(state.study?.study_date), "PPP")}</span>
              <Badge variant="outline">{state.study?.modality}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={state.reportState.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">
                <div className="flex items-center">
                  <CircleEllipsis className="mr-2 h-4 w-4" />
                  Pending
                </div>
              </SelectItem>
              <SelectItem value="preliminary">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Preliminary
                </div>
              </SelectItem>
              <SelectItem value="final">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Final
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {state.reportState.isDirty && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Unsaved Changes</AlertTitle>
            <AlertDescription>
              You have unsaved changes in this report. Please save your work before navigating away.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Report Details</CardTitle>
              <Badge
                variant={
                  state.reportState.status === "final"
                    ? "secondary"
                    : state.reportState.status === "preliminary"
                      ? "outline"
                      : "default"
                }
              >
                {state.reportState.status === "final"
                  ? "Final"
                  : state.reportState.status === "preliminary"
                    ? "Preliminary"
                    : "Pending"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">Last saved: {formatLastSaved()}</div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="findings">Findings</TabsTrigger>
                <TabsTrigger value="impression">Impression</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="findings" className="pt-4">
                <Textarea
                  placeholder="Enter detailed findings based on image analysis..."
                  className="min-h-[300px]"
                  value={state.reportState.findings}
                  onChange={(e) => handleTextChange("findings", e.target.value)}
                />
              </TabsContent>

              <TabsContent value="impression" className="pt-4">
                <Textarea
                  placeholder="Enter your diagnostic impression..."
                  className="min-h-[300px]"
                  value={state.reportState.impression}
                  onChange={(e) => handleTextChange("impression", e.target.value)}
                />
              </TabsContent>

              <TabsContent value="recommendations" className="pt-4">
                <Textarea
                  placeholder="Enter recommendations for follow-up..."
                  className="min-h-[300px]"
                  value={state.reportState.recommendations}
                  onChange={(e) => handleTextChange("recommendations", e.target.value)}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button type="button" variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={!state.reportState.isDirty || state.isLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalizeReport}
                  disabled={state.isLoading || state.reportState.status === "final"}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Finalize Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <div className="grid grid-cols-2 gap-1">
                <dt className="text-muted-foreground text-sm">Study Date:</dt>
                <dd>{format(new Date(state.study?.study_date), "PPP")}</dd>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <dt className="text-muted-foreground text-sm">Modality:</dt>
                <dd>{state.study?.modality}</dd>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <dt className="text-muted-foreground text-sm">Patient ID:</dt>
                <dd>{state.study?.patient_id || "Not Available"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <dt className="text-muted-foreground text-sm">Accession #:</dt>
                <dd>{state.study?.accession_number || "Not Available"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <dt className="text-muted-foreground text-sm">Referring Physician:</dt>
                <dd>{state.study?.referring_physician || "Not Available"}</dd>
              </div>
            </dl>

            <Separator className="my-4" />

            <h3 className="text-sm font-medium mb-2">Clinical Information</h3>
            <p className="text-sm">{state.study?.clinical_information || "No clinical information provided."}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
