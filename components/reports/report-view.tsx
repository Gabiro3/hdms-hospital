"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Edit,
  Share2,
  FileText,
  UserCircle,
  Calendar,
  Clock,
  Printer,
  MessageSquare,
  PaperclipIcon,
  Send,
  MoreVertical,
} from "lucide-react"
import { generateReportPDF } from "@/lib/utils/pdf-utils"
import ReportSharing from "./report-sharing"
import { addReportComment } from "@/services/report-service"
import ClinicalReportContent from "./report-content/clinical-report"
import ProgressReportContent from "./report-content/progress-report"
import DischargeReportContent from "./report-content/discharge-report"
import RadiologyReportContent from "./report-content/radiology-report"
import GenericReportContent from "./report-content/generic-report"

interface ReportViewProps {
  report: any
  shares: any[]
  comments: any[]
  currentUser: any
  colleagues: any[]
  isOwner: boolean
}

export default function ReportView({ report, shares, comments, currentUser, colleagues, isOwner }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [displayedComments, setDisplayedComments] = useState(comments)
  const router = useRouter()

  // Handle generating PDF
  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      await generateReportPDF(report)
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

  // Handle submitting a comment
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return

    setSubmittingComment(true)
    try {
      const { comment, error } = await addReportComment(report.id, currentUser.id, commentText)

      if (error) {
        throw new Error(error)
      }

      setCommentText("")
      // Add the new comment to the displayed comments
      if (comment) {
        setDisplayedComments([...displayedComments, comment])
      }

      toast({
        title: "Comment Added",
        description: "Your comment has been added to the report",
      })
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  // Render the appropriate report content based on type
  const renderReportContent = () => {
    switch (report.report_type) {
      case "clinical":
        return <ClinicalReportContent content={report.content} />
      case "progress":
        return <ProgressReportContent content={report.content} />
      case "discharge":
        return <DischargeReportContent content={report.content} />
      case "radiology":
      case "laboratory":
      case "pathology":
        return <RadiologyReportContent content={report.content} reportType={report.report_type} />
      default:
        return <GenericReportContent content={report.content} />
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
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{report.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{report.report_type?.charAt(0).toUpperCase() + report.report_type?.slice(1) || "Report"}</span>
              <span>•</span>
              <span>Created on {format(new Date(report.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button variant="outline" asChild>
              <Link href={`/reports/${report.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {isOwner && (
            <Button variant="outline" onClick={() => setShowShareDialog(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}
          <Button variant="outline" onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                Generating...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{report.report_type || "General"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <UserCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creator</p>
                  <p className="font-medium">{report.creator?.full_name || "Unknown"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(report.created_at), "MMMM d, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{format(new Date(report.updated_at), "MMMM d, yyyy h:mm a")}</p>
                </div>
              </div>

              {report.patients && (
                <div className="flex items-start gap-2">
                  <UserCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient</p>
                    <p className="font-medium">
                      {report.patients.name ? (
                        <Link href={`/patients/${report.patient_id}`} className="text-primary hover:underline">
                          {report.patients.name}
                        </Link>
                      ) : (
                        "No patient specified"
                      )}
                    </p>
                  </div>
                </div>
              )}

              {report.diagnosis_id && (
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Linked Diagnosis</p>
                    <p className="font-medium">
                      <Link href={`/diagnoses/${report.diagnosis_id}`} className="text-primary hover:underline">
                        View Diagnosis
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Badge
                  variant={report.status === "draft" ? "outline" : "secondary"}
                  className={report.status === "draft" ? "border-amber-500 bg-amber-50 text-amber-700" : ""}
                >
                  {report.status === "draft" ? "Draft" : "Finalized"}
                </Badge>
              </div>

              {shares.length > 0 && (
                <div className="pt-2">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Shared With</p>
                  <div className="flex flex-wrap gap-2">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {share.shared_with_user?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{share.shared_with_user?.full_name || "Unknown"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Report Details</CardTitle>
                  <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="details">Report Content</TabsTrigger>
                    <TabsTrigger value="comments">
                      Comments {displayedComments.length > 0 && `(${displayedComments.length})`}
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="details" className="mt-0 space-y-4">
                  {renderReportContent()}
                </TabsContent>

                <TabsContent value="comments" className="mt-0">
                  <div className="space-y-4">
                    <div className="rounded-md border p-4">
                      <h3 className="mb-2 text-sm font-medium">Add Comment</h3>
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Write your comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="h-20 resize-none"
                        />
                        <div className="flex items-center justify-between">
                          <Button variant="outline" size="sm" type="button" className="gap-1">
                            <PaperclipIcon className="h-4 w-4" />
                            <span>Attach</span>
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            className="gap-1"
                            onClick={handleSubmitComment}
                            disabled={submittingComment || !commentText.trim()}
                          >
                            {submittingComment ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            <span>Send</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {displayedComments.length === 0 ? (
                        <div className="rounded-md border border-dashed p-6 text-center">
                          <MessageSquare className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                          <h3 className="text-sm font-medium">No Comments Yet</h3>
                          <p className="mt-1 text-xs text-muted-foreground">Be the first to comment on this report.</p>
                        </div>
                      ) : (
                        displayedComments.map((comment) => (
                          <div key={comment.id} className="rounded-md border p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{comment.users?.full_name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{comment.users?.full_name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(comment.created_at), "MMM d, yyyy h:mm a")}
                                  </p>
                                </div>
                              </div>
                              {comment.user_id === currentUser.id && (
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{comment.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Report</DialogTitle>
          </DialogHeader>
          <ReportSharing
            reportId={report.id}
            colleagues={colleagues}
            existingShares={shares}
            currentUserId={currentUser.id}
            onShareComplete={() => {
              setShowShareDialog(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
