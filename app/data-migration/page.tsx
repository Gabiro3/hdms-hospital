"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import SqlFileUploader from "@/components/data-migration/sql-file-uploader"
import DataPreview from "@/components/data-migration/data-preview"
import UploadStatusIndicator from "@/components/data-migration/upload-status-indicator"
import {
  type MigrationPreviewData,
  type MigrationResult,
  type MigrationSource,
  type MigrationTarget,
  generateMigrationPreview,
  migrateData,
} from "@/services/data-migration-service"
import { Card } from "@/components/ui/card"
import DashboardLayout from "@/components/layout/dashboard-layout"

export default function DataMigrationPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [previewData, setPreviewData] = useState<MigrationPreviewData | null>(null)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | undefined>()
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  // Memoized handler to prevent recreation on every render
  const handleFileUpload = useCallback(
    async (file: File, source: MigrationSource, target: MigrationTarget) => {
      try {
        setIsUploading(true)
        setError(undefined)
        setUploadStatus("uploading")

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 300)

        // Read file content
        const fileContent = await readFileAsText(file)

        // Clear upload progress interval
        clearInterval(progressInterval)
        setUploadProgress(100)

        // Process file
        setUploadStatus("processing")
        const preview = await generateMigrationPreview(fileContent, source, target)

        setPreviewData(preview)
        setUploadStatus("success")

        toast({
          title: "File Processed",
          description: "Your SQL file has been processed successfully.",
        })
      } catch (err) {
        console.error("Error uploading file:", err)
        setError(err instanceof Error ? err.message : String(err))
        setUploadStatus("error")

        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to process file: ${err instanceof Error ? err.message : String(err)}`,
        })
      } finally {
        setIsUploading(false)
      }
    },
    [toast],
  )

  // Memoized handler to prevent recreation on every render
  const handleConfirmMigration = useCallback(
    async (mappings: Record<string, string>) => {
      if (!previewData) return

      try {
        setIsProcessing(true)

        // Get the file content again
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (!fileInput.files || !fileInput.files[0]) {
          throw new Error("File not found")
        }

        const fileContent = await readFileAsText(fileInput.files[0])

        // Perform the migration
        const result = await migrateData(
          fileContent,
          previewData.source,
          previewData.target,
          mappings,
          "current-user-id", // This should be replaced with the actual user ID
        )

        setMigrationResult(result)

        if (result.success) {
          toast({
            title: "Migration Successful",
            description: `${result.recordsInserted} records inserted, ${result.recordsUpdated} records updated.`,
          })
        } else {
          toast({
            variant: "destructive",
            title: "Migration Completed with Issues",
            description: `${result.recordsInserted + result.recordsUpdated} records processed, ${result.recordsSkipped} records skipped.`,
          })
        }
      } catch (err) {
        console.error("Error during migration:", err)
        setError(err instanceof Error ? err.message : String(err))

        toast({
          variant: "destructive",
          title: "Migration Failed",
          description: err instanceof Error ? err.message : String(err),
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [previewData, toast],
  )

  // Memoized handler to prevent recreation on every render
  const handleBack = useCallback(() => {
    setPreviewData(null)
    setMigrationResult(undefined)
    setError(undefined)
    setUploadStatus("idle")
    setUploadProgress(0)
  }, [])

  return (
    <DashboardLayout>
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Data Migration Tool</h1>

      <div className="space-y-6">
        {!previewData ? (
          <>
            <Card className="p-6 bg-muted/40">
              <h2 className="text-xl font-semibold mb-4">Import Legacy Data</h2>
              <p className="mb-2">
                This tool allows you to import data from legacy systems into the hospital diagnosis system.
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Upload SQL database export files</li>
                <li>Preview and map data before importing</li>
                <li>Automatically handle schema differences</li>
                <li>Preserve all original data in the open_metadata column</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Supported tables: patient_tbl, medical_test_tbl, history_tbl, record_log_tbl
              </p>
            </Card>

            <UploadStatusIndicator status={uploadStatus} progress={uploadProgress} message={error} />

            <SqlFileUploader onUpload={handleFileUpload} isUploading={isUploading} error={error} />
          </>
        ) : (
          <DataPreview
            previewData={previewData}
            onConfirm={handleConfirmMigration}
            onBack={handleBack}
            isProcessing={isProcessing}
            result={migrationResult}
          />
        )}
      </div>
    </div>
    </DashboardLayout>
  )
}

/**
 * Reads a file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      if (!event.target || typeof event.target.result !== "string") {
        reject(new Error("Failed to read file"))
        return
      }
      resolve(event.target.result)
    }

    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }

    reader.readAsText(file)
  })
}
