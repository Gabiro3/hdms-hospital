"use client"

import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, AlertCircle, Clock } from "lucide-react"

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error"

type UploadStatusIndicatorProps = {
  status: UploadStatus
  progress?: number
  message?: string
}

export default function UploadStatusIndicator({ status, progress = 0, message }: UploadStatusIndicatorProps) {
  const getStatusContent = () => {
    switch (status) {
      case "idle":
        return (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Ready to Upload</AlertTitle>
            <AlertDescription>Select a file to begin the data migration process.</AlertDescription>
          </Alert>
        )

      case "uploading":
        return (
          <div className="space-y-2">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Uploading File</AlertTitle>
              <AlertDescription>Uploading your SQL file. Please wait...</AlertDescription>
            </Alert>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-right">{progress}%</p>
          </div>
        )

      case "processing":
        return (
          <div className="space-y-2">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Processing Data</AlertTitle>
              <AlertDescription>Analyzing and extracting data from your SQL file.</AlertDescription>
            </Alert>
            <Progress value={progress} className="h-2" />
          </div>
        )

      case "success":
        return (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{message || "File processed successfully."}</AlertDescription>
          </Alert>
        )

      case "error":
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message || "An error occurred during processing."}</AlertDescription>
          </Alert>
        )

      default:
        return null
    }
  }

  return <div className="my-4">{getStatusContent()}</div>
}
