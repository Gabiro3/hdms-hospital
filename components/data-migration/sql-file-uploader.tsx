"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, FileText, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { MigrationSource, MigrationTarget } from "@/services/data-migration-service"
import { useRouter } from "next/navigation"

type SqlFileUploaderProps = {
  onUpload: (file: File, source: MigrationSource, target: MigrationTarget) => Promise<void>
  isUploading: boolean
  error?: string
}

export default function SqlFileUploader({ onUpload, isUploading, error }: SqlFileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState<MigrationSource>("patient_tbl")
  const [target, setTarget] = useState<MigrationTarget>("patients")
  const [dragActive, setDragActive] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (file && source && target) {
      await onUpload(file, source, target)
    }
  }

  const getTargetOptions = (source: MigrationSource): MigrationTarget[] => {
    switch (source) {
      case "patient_tbl":
      case "history_tbl":
        return ["patients"]
      case "medical_test_tbl":
        return ["lab_results"]
      case "record_log_tbl":
        return ["patients", "lab_results"]
      default:
        return ["patients", "lab_results"]
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Upload SQL Data</CardTitle>
        <CardDescription>
          Upload SQL database exports to migrate data into the system. The system will handle schema differences
          automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="source">Source Table</Label>
              <Select
                value={source}
                onValueChange={(value) => {
                  setSource(value as MigrationSource)
                  // Reset target when source changes
                  setTarget(getTargetOptions(value as MigrationSource)[0])
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient_tbl">Patient Table (patient_tbl)</SelectItem>
                  <SelectItem value="medical_test_tbl">Medical Test Table (medical_test_tbl)</SelectItem>
                  <SelectItem value="history_tbl">History Table (history_tbl)</SelectItem>
                  <SelectItem value="record_log_tbl">Record Log Table (record_log_tbl)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target">Target Table</Label>
              <Select value={target} onValueChange={(value) => setTarget(value as MigrationTarget)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target table" />
                </SelectTrigger>
                <SelectContent>
                  {getTargetOptions(source).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "patients" ? "Patients" : "Lab Results"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="file">SQL File</Label>
              <div
                className={`border-2 border-dashed rounded-md p-6 ${
                  dragActive ? "border-primary bg-primary/10" : "border-border"
                } ${file ? "bg-muted/50" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  {file ? (
                    <>
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setFile(null)} type="button">
                        Change file
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Drag & drop your SQL file here</p>
                        <p className="text-sm text-muted-foreground">or click to browse files</p>
                      </div>
                      <Input id="file" type="file" accept=".sql" className="hidden" onChange={handleFileChange} />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => document.getElementById("file")?.click()}
                        type="button"
                      >
                        Select file
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <CardFooter className="flex justify-between px-0 pt-6">
            <Button variant="outline" onClick={() => router.push("/dashboard")} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={!file || isUploading}>
              {isUploading ? "Processing..." : "Preview Data"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}
