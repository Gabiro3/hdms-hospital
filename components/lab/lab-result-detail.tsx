"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Printer,
  Share2,
  User,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { deleteLabResult } from "@/services/lab-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LabResultDetailProps {
  result: any
  shares: any[]
  userId: string
}

export default function LabResultDetail({ result, shares, userId }: LabResultDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()

  const isOwner = result.created_by === userId
  const isLabTechnician = result.creator?.role === "LAB"

  const handleDelete = async () => {
    try {
      const { error } = await deleteLabResult(result.id)

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "Success",
        description: "Lab result deleted successfully",
      })

      router.push("/lab")
    } catch (error) {
      console.error("Error deleting lab result:", error)
      toast({
        title: "Error",
        description: "Failed to delete lab result. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handlePrint = () => {
    router.push(`/lab/${result.id}/print`)
  }

  const handleShare = () => {
    router.push(`/lab/${result.id}/share`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderResultContent = () => {
    const resultData = result.results

    switch (result.result_type) {
      case "blood":
        return renderBloodTestResult(resultData)
      case "urine":
        return renderUrineTestResult(resultData)
      case "imaging":
        return renderImagingResult(resultData)
      default:
        return renderGenericResult(resultData)
    }
  }

  const renderBloodTestResult = (data: any) => {
    return (
      <div className="space-y-4">
        {data.panels &&
          data.panels.map((panel: any, index: number) => (
            <div key={index} className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-2">{panel.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {panel.tests &&
                  panel.tests.map((test: any, testIndex: number) => (
                    <div key={testIndex} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${test.flag ? "text-red-600" : ""}`}>
                          {test.value} {test.unit}
                          {test.flag && <AlertTriangle className="inline ml-1 h-4 w-4 text-red-600" />}
                        </p>
                        <p className="text-xs text-muted-foreground">Reference: {test.reference_range}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

        {data.comments && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Comments</h3>
            <p className="text-sm">{data.comments}</p>
          </div>
        )}
      </div>
    )
  }

  const renderUrineTestResult = (data: any) => {
    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4">
          <h3 className="text-lg font-medium mb-2">Physical Examination</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.physical &&
              Object.entries(data.physical).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between items-center">
                  <p className="font-medium capitalize">{key.replace("_", " ")}</p>
                  <p>{value}</p>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-md border p-4">
          <h3 className="text-lg font-medium mb-2">Chemical Examination</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.chemical &&
              Object.entries(data.chemical).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between items-center">
                  <p className="font-medium capitalize">{key.replace("_", " ")}</p>
                  <p>{value}</p>
                </div>
              ))}
          </div>
        </div>

        {data.microscopic && (
          <div className="rounded-md border p-4">
            <h3 className="text-lg font-medium mb-2">Microscopic Examination</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.microscopic).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between items-center">
                  <p className="font-medium capitalize">{key.replace("_", " ")}</p>
                  <p>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.comments && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Comments</h3>
            <p className="text-sm">{data.comments}</p>
          </div>
        )}
      </div>
    )
  }

  const renderImagingResult = (data: any) => {
    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4">
          <h3 className="text-lg font-medium mb-2">Imaging Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <p className="font-medium">Procedure</p>
              <p>{data.procedure}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-medium">Modality</p>
              <p>{data.modality}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-medium">Body Part</p>
              <p>{data.body_part}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-medium">Contrast</p>
              <p>{data.contrast ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {data.findings && (
          <div className="rounded-md border p-4">
            <h3 className="text-lg font-medium mb-2">Findings</h3>
            <p className="whitespace-pre-line">{data.findings}</p>
          </div>
        )}

        {data.impression && (
          <div className="rounded-md border p-4">
            <h3 className="text-lg font-medium mb-2">Impression</h3>
            <p className="whitespace-pre-line">{data.impression}</p>
          </div>
        )}

        {data.recommendations && (
          <div className="rounded-md border p-4">
            <h3 className="text-lg font-medium mb-2">Recommendations</h3>
            <p className="whitespace-pre-line">{data.recommendations}</p>
          </div>
        )}
      </div>
    )
  }

  const renderGenericResult = (data: any) => {
    return (
      <div className="space-y-4">
        {data.sections &&
          data.sections.map((section: any, index: number) => (
            <div key={index} className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-2">{section.title}</h3>
              <p className="whitespace-pre-line">{section.content}</p>
            </div>
          ))}

        {!data.sections && data.content && (
          <div className="rounded-md border p-4">
            <p className="whitespace-pre-line">{data.content}</p>
          </div>
        )}

        {data.conclusion && (
          <div className="rounded-md border p-4">
            <h3 className="text-lg font-medium mb-2">Conclusion</h3>
            <p className="whitespace-pre-line">{data.conclusion}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/lab")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{result.title}</h1>
              <p className="text-sm text-muted-foreground">
                Lab result for {result.patients?.name || "Unknown Patient"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            {isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={() => router.push(`/lab/${result.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="files">Files & Attachments</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Lab Result Details</CardTitle>
                    <CardDescription>
                      {result.result_type.charAt(0).toUpperCase() + result.result_type.slice(1)} test results
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(result.status)}
                      <Badge variant="outline" className="capitalize">
                        {result.result_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>{renderResultContent()}</CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="files" className="mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Files & Attachments</CardTitle>
                    <CardDescription>View and download files attached to this lab result</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.file_links && result.file_links.length > 0 ? (
                      <div className="space-y-4">
                        {result.file_links.map((fileLink: string, index: number) => {
                          const fileName = fileLink.split("/").pop() || `File ${index + 1}`
                          return (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                                <span>{fileName}</span>
                              </div>
                              <a
                                href={fileLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No files attached to this lab result</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Patient</h3>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Link href={`/patients/${result.patient_id}`} className="hover:underline">
                        {result.patients?.name || "Unknown Patient"}
                      </Link>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created By</h3>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{result.creator?.full_name || "Unknown"}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Date Created</h3>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{format(new Date(result.created_at), "PPP")}</span>
                    </div>
                  </div>

                  {result.lab_requests && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Request</h3>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Link href={`/lab/requests/${result.request_id}`} className="hover:underline">
                          View Original Request
                        </Link>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Shared With</h3>
                    {shares.length > 0 ? (
                      <div className="space-y-2">
                        {shares.map((share) => (
                          <div key={share.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{share.shared_with_user?.full_name || "Unknown"}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(share.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not shared with anyone</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Result
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lab result and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
