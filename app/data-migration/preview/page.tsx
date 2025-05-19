"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import DataPreview from "@/components/data-migration/data-preview"
import { type MigrationPreviewData, type MigrationResult, migrateData } from "@/services/data-migration-service"

export default function DataPreviewPage() {
  const [previewData, setPreviewData] = useState<MigrationPreviewData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | undefined>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    // Get preview data from session storage
    const storedData = sessionStorage.getItem("migrationPreviewData")
    if (storedData) {
      try {
        setPreviewData(JSON.parse(storedData))
      } catch (err) {
        console.error("Error parsing preview data:", err)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load preview data. Please try again.",
        })
        router.push("/data-migration")
      }
    } else {
      // No preview data, redirect back to upload page
      router.push("/data-migration")
    }
  }, [router, toast])

  const handleConfirmMigration = async (mappings: Record<string, string>) => {
    if (!previewData) return

    try {
      setIsProcessing(true)

      // Get the file content from session storage
      const fileContent = sessionStorage.getItem("migrationFileContent")
      if (!fileContent) {
        throw new Error("File content not found")
      }

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

      toast({
        variant: "destructive",
        title: "Migration Failed",
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBack = () => {
    router.push("/data-migration")
  }

  if (!previewData) {
    return <div className="container py-8">Loading preview data...</div>
  }

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Data Preview</h1>

      <DataPreview
        previewData={previewData}
        onConfirm={handleConfirmMigration}
        onBack={handleBack}
        isProcessing={isProcessing}
        result={migrationResult}
      />
    </div>
  )
}
