"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, CircleEllipsis, FileText, Save, Send, Printer, Download } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RadiologyReportProps {
  study: any
}

export default function RadiologyReport({ study }: RadiologyReportProps) {
  const [reportStatus, setReportStatus] = useState<string>(study.report_status || "pending")
  const [activeTab, setActiveTab] = useState("findings")

  const {
    register,
    handleSubmit,
    formState: { isDirty, isSubmitting },
  } = useForm({
    defaultValues: {
      findings: study.report?.findings || "",
      impression: study.report?.impression || "",
      recommendations: study.report?.recommendations || "",
    },
  })

  const onSubmit = async (data: any) => {
    try {
      // In a real application, this would save the report to the database
      toast({
        title: "Report Saved",
        description: "Radiology report has been saved successfully",
      })

      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update the report status if needed
      if (reportStatus === "final") {
        toast({
          title: "Report Finalized",
          description: "The report has been finalized and is now available for viewing",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save the report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePrint = () => {
    toast({
      title: "Printing",
      description: "Preparing report for printing...",
    })
  }

  const handleDownload = () => {
    toast({
      title: "Downloading",
      description: "Preparing report for download...",
    })
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Radiology Report</h2>
          <p className="text-muted-foreground text-sm">
            {study.patient_name} • {format(new Date(study.study_date), "PPP")}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={reportStatus} onValueChange={setReportStatus}>
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Report Details</CardTitle>
            <Badge
              variant={reportStatus === "final" ? "secondary" : reportStatus === "preliminary" ? "outline" : "default"}
            >
              {reportStatus === "final" ? "Final" : reportStatus === "preliminary" ? "Preliminary" : "Pending"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  {...register("findings")}
                />
              </TabsContent>

              <TabsContent value="impression" className="pt-4">
                <Textarea
                  placeholder="Enter your diagnostic impression..."
                  className="min-h-[300px]"
                  {...register("impression")}
                />
              </TabsContent>

              <TabsContent value="recommendations" className="pt-4">
                <Textarea
                  placeholder="Enter recommendations for follow-up..."
                  className="min-h-[300px]"
                  {...register("recommendations")}
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
                <Button type="submit" variant="outline" disabled={!isDirty || isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setReportStatus("final")
                    handleSubmit(onSubmit)()
                  }}
                  disabled={isSubmitting}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Finalize Report
                </Button>
              </div>
            </div>
          </form>
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
              <dd>{format(new Date(study.study_date), "PPP")}</dd>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <dt className="text-muted-foreground text-sm">Modality:</dt>
              <dd>{study.modality}</dd>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <dt className="text-muted-foreground text-sm">Patient ID:</dt>
              <dd>{study.patient_id || "Not Available"}</dd>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <dt className="text-muted-foreground text-sm">Accession #:</dt>
              <dd>{study.accession_number || "Not Available"}</dd>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <dt className="text-muted-foreground text-sm">Referring Physician:</dt>
              <dd>{study.referring_physician || "Not Available"}</dd>
            </div>
          </dl>

          <Separator className="my-4" />

          <h3 className="text-sm font-medium mb-2">Clinical Information</h3>
          <p className="text-sm">{study.clinical_information || "No clinical information provided."}</p>
        </CardContent>
      </Card>
    </div>
  )
}
