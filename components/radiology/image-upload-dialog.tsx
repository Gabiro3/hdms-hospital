"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileImage, File } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (files: File[]) => void
  isUploading: boolean
}

export default function ImageUploadDialog({ open, onOpenChange, onUpload, isUploading }: ImageUploadDialogProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  // Process the files
  const handleFiles = (files: File[]) => {
    // Filter for supported file types
    const supportedFiles = files.filter((file) => {
      const fileType = file.type.toLowerCase()
      const fileName = file.name.toLowerCase()

      return fileType.includes("image/") || fileType.includes("dicom") || fileName.endsWith(".dcm")
    })

    if (supportedFiles.length !== files.length) {
      toast({
        title: "Unsupported File Types",
        description: "Some files were skipped because they are not supported image formats.",
        variant: "destructive",
      })
    }

    if (supportedFiles.length === 0) {
      toast({
        title: "No Valid Files",
        description: "Please select valid image files (JPEG, PNG, DICOM, etc.).",
        variant: "destructive",
      })
      return
    }

    setSelectedFiles((prev) => [...prev, ...supportedFiles])
  }

  // Remove a file from the selection
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Trigger file input click
  const onButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle upload
  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload.",
        variant: "destructive",
      })
      return
    }

    // Simulate progress for better UX
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      if (progress > 90) {
        clearInterval(interval)
      }
      setUploadProgress(progress)
    }, 100)

    // Call the parent's upload handler
    onUpload(selectedFiles)

    // Reset state after upload
    setTimeout(() => {
      setSelectedFiles([])
      setUploadProgress(0)
    }, 1000)
  }

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()

    if (fileType.includes("image/")) {
      return <FileImage className="h-5 w-5 text-blue-500" />
    } else if (fileType.includes("dicom") || fileName.endsWith(".dcm")) {
      return <File className="h-5 w-5 text-purple-500" />
    } else {
      return <File className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
          <DialogDescription>
            Upload images to this radiology study. Supported formats: JPEG, PNG, DICOM.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              dragActive ? "border-primary bg-primary/5" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.dcm,application/dicom"
              onChange={handleChange}
              className="hidden"
            />

            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium">
              Drag and drop files here, or{" "}
              <button type="button" onClick={onButtonClick} className="text-primary hover:underline focus:outline-none">
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500 mt-1">JPEG, PNG, DICOM files up to 50MB</p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="border rounded-md">
              <div className="p-2 bg-muted/50 border-b">
                <h3 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h3>
              </div>
              <ul className="divide-y max-h-40 overflow-auto">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 text-sm">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file)}
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFiles([])
                onOpenChange(false)
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
