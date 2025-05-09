"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { toast } from "@/components/ui/use-toast"
import { getRadiologyStudyById, saveRadiologyReport, uploadRadiologyImage } from "@/services/radiology-service"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Define types for our state
export type Annotation = {
  id: string
  type: string
  [key: string]: any
}

export type ViewboxSettings = {
  panOffset: { x: number; y: number }
  zoom: number
  brightness: number
  contrast: number
  invert: boolean
  rotation: number
  flipped: { horizontal: boolean; vertical: boolean }
}

export type ImageState = {
  url: string
  annotations: Annotation[]
  viewboxSettings: ViewboxSettings
}

export type ReportState = {
  findings: string
  impression: string
  recommendations: string
  status: string
  lastSaved?: string
  isDirty: boolean
}

export type RadiologyState = {
  studyId: string
  study: any
  images: ImageState[]
  currentImageIndex: number
  activeViewboxIndex: number
  layout: string
  viewMode: "images" | "report" | "info"
  reportState: ReportState
  isLoading: boolean
  error: string | null
}

type RadiologyContextType = {
  state: RadiologyState
  setCurrentImageIndex: (index: number) => void
  setActiveViewboxIndex: (index: number) => void
  setLayout: (layout: string) => void
  setViewMode: (mode: "images" | "report" | "info") => void
  updateViewboxSettings: (imageIndex: number, settings: Partial<ViewboxSettings>) => void
  updateAnnotations: (imageIndex: number, annotations: Annotation[]) => void
  uploadImages: (files: File[]) => Promise<void>
  deleteImage: (index: number) => void
  updateReportState: (updates: Partial<ReportState>) => void
  saveReport: () => Promise<void>
  finalizeReport: () => Promise<void>
  refreshStudy: () => Promise<void>
}

const defaultViewboxSettings: ViewboxSettings = {
  panOffset: { x: 0, y: 0 },
  zoom: 100,
  brightness: 100,
  contrast: 100,
  invert: false,
  rotation: 0,
  flipped: { horizontal: false, vertical: false },
}

const defaultReportState: ReportState = {
  findings: "",
  impression: "",
  recommendations: "",
  status: "pending",
  isDirty: false,
}

const initialState: RadiologyState = {
  studyId: "",
  study: null,
  images: [],
  currentImageIndex: 0,
  activeViewboxIndex: 0,
  layout: "1x1",
  viewMode: "images",
  reportState: defaultReportState,
  isLoading: true,
  error: null,
}

// Create context
const RadiologyContext = createContext<RadiologyContextType | undefined>(undefined)

// Provider component
export default function RadiologyStateProvider({
  children,
  studyId,
}: {
  children: ReactNode
  studyId: string
}) {
  const [state, setState] = useState<RadiologyState>({
    ...initialState,
    studyId,
  })
  const supabase = createClientComponentClient()

  // Load study data
  const loadStudy = useCallback(async () => {
    if (!studyId) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get user data
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Authentication required",
        }))
        return
      }

      // Get user's hospital
      const { data: userData } = await supabase.from("users").select("hospital_id").eq("id", user.id).single()

      if (!userData) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "User data not found",
        }))
        return
      }

      // Get study data
      const { study, error } = await getRadiologyStudyById(studyId, userData.hospital_id)

      if (error || !study) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error || "Study not found",
        }))
        return
      }

      // Initialize images array
      const imageUrls = study.image_urls || []
      const images: ImageState[] = imageUrls.map((url: string) => ({
        url,
        annotations: [],
        viewboxSettings: { ...defaultViewboxSettings },
      }))

      // If no images, add placeholder
      if (images.length === 0) {
        images.push({
          url: "/placeholder.svg?height=800&width=800",
          annotations: [],
          viewboxSettings: { ...defaultViewboxSettings },
        })
      }

      // Initialize report state
      const reportState: ReportState = {
        findings: study.report?.findings || "",
        impression: study.report?.impression || "",
        recommendations: study.report?.recommendations || "",
        status: study.report_status || "pending",
        lastSaved: study.updated_at,
        isDirty: false,
      }

      setState((prev) => ({
        ...prev,
        study,
        images,
        reportState,
        isLoading: false,
      }))

      // Load saved state from localStorage if available
      const savedState = localStorage.getItem(`radiology_state_${studyId}`)
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)

          // Merge saved annotations and viewbox settings with current state
          const mergedImages = images.map((img, index) => {
            if (parsedState.images[index]) {
              return {
                ...img,
                annotations: parsedState.images[index].annotations || [],
                viewboxSettings: parsedState.images[index].viewboxSettings || { ...defaultViewboxSettings },
              }
            }
            return img
          })

          setState((prev) => ({
            ...prev,
            images: mergedImages,
            layout: parsedState.layout || "1x1",
            currentImageIndex: Math.min(parsedState.currentImageIndex || 0, mergedImages.length - 1),
            activeViewboxIndex: parsedState.activeViewboxIndex || 0,
          }))
        } catch (e) {
          console.error("Error parsing saved state:", e)
        }
      }
    } catch (error) {
      console.error("Error loading study:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load study data",
      }))
    }
  }, [studyId, supabase])

  // Initial load
  useEffect(() => {
    loadStudy()
  }, [loadStudy])

  // Save state to localStorage when it changes
  useEffect(() => {
    if (state.studyId && !state.isLoading) {
      const stateToSave = {
        images: state.images.map((img) => ({
          annotations: img.annotations,
          viewboxSettings: img.viewboxSettings,
        })),
        currentImageIndex: state.currentImageIndex,
        activeViewboxIndex: state.activeViewboxIndex,
        layout: state.layout,
      }
      localStorage.setItem(`radiology_state_${state.studyId}`, JSON.stringify(stateToSave))
    }
  }, [state.images, state.currentImageIndex, state.activeViewboxIndex, state.layout, state.studyId, state.isLoading])

  // Set current image index
  const setCurrentImageIndex = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentImageIndex: Math.max(0, Math.min(index, prev.images.length - 1)),
    }))
  }, [])

  // Set active viewbox index
  const setActiveViewboxIndex = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      activeViewboxIndex: index,
    }))
  }, [])

  // Set layout
  const setLayout = useCallback((layout: string) => {
    setState((prev) => ({
      ...prev,
      layout,
      activeViewboxIndex: 0, // Reset active viewbox when changing layout
    }))
  }, [])

  // Set view mode
  const setViewMode = useCallback((mode: "images" | "report" | "info") => {
    setState((prev) => ({
      ...prev,
      viewMode: mode,
    }))
  }, [])

  // Update viewbox settings
  const updateViewboxSettings = useCallback((imageIndex: number, settings: Partial<ViewboxSettings>) => {
    setState((prev) => {
      if (imageIndex < 0 || imageIndex >= prev.images.length) return prev

      const updatedImages = [...prev.images]
      updatedImages[imageIndex] = {
        ...updatedImages[imageIndex],
        viewboxSettings: {
          ...updatedImages[imageIndex].viewboxSettings,
          ...settings,
        },
      }

      return {
        ...prev,
        images: updatedImages,
      }
    })
  }, [])

  // Update annotations
  const updateAnnotations = useCallback((imageIndex: number, annotations: Annotation[]) => {
    setState((prev) => {
      if (imageIndex < 0 || imageIndex >= prev.images.length) return prev

      const updatedImages = [...prev.images]
      updatedImages[imageIndex] = {
        ...updatedImages[imageIndex],
        annotations,
      }

      return {
        ...prev,
        images: updatedImages,
      }
    })
  }, [])

  // Upload images
  const uploadImages = useCallback(
    async (files: File[]) => {
      if (!state.studyId || !state.study) {
        toast({
          title: "Upload Error",
          description: "Study ID is missing. Cannot upload images.",
          variant: "destructive",
        })
        return
      }

      setState((prev) => ({ ...prev, isLoading: true }))

      try {
        const newImages = [...state.images]
        let successCount = 0

        for (const file of files) {
          // Check file type
          const fileType = file.type.toLowerCase()
          const isValidType =
            fileType.includes("image/") || fileType.includes("dicom") || file.name.toLowerCase().endsWith(".dcm")

          if (!isValidType) {
            toast({
              title: "Invalid File Type",
              description: `File ${file.name} is not a supported image format.`,
              variant: "destructive",
            })
            continue
          }

          // Create object URL for immediate display
          const objectUrl = URL.createObjectURL(file)

          // Add new image with default settings
          newImages.push({
            url: objectUrl,
            annotations: [],
            viewboxSettings: { ...defaultViewboxSettings },
          })

          // Upload to server
          const { imageUrl, error } = await uploadRadiologyImage(file, state.studyId)

          if (error) {
            toast({
              title: "Upload Failed",
              description: `Failed to upload ${file.name}: ${error}`,
              variant: "destructive",
            })
            // Remove the object URL if upload failed
            const index = newImages.findIndex((img) => img.url === objectUrl)
            if (index !== -1) {
              newImages.splice(index, 1)
            }
          } else if (imageUrl) {
            // Replace object URL with actual URL
            const index = newImages.findIndex((img) => img.url === objectUrl)
            if (index !== -1) {
              newImages[index].url = imageUrl
            }
            successCount++
          }
        }

        setState((prev) => ({
          ...prev,
          images: newImages,
          currentImageIndex: newImages.length - 1, // Navigate to the newly added image
          isLoading: false,
        }))

        if (successCount > 0) {
          toast({
            title: "Upload Successful",
            description: `${successCount} image${successCount > 1 ? "s" : ""} uploaded successfully.`,
          })
        }
      } catch (error) {
        console.error("Error uploading files:", error)
        toast({
          title: "Upload Error",
          description: "An unexpected error occurred during upload.",
          variant: "destructive",
        })
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [state.studyId, state.study, state.images],
  )

  // Delete image
  const deleteImage = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= prev.images.length) return prev

      // Don't allow deleting the last image
      if (prev.images.length <= 1) {
        toast({
          title: "Cannot Delete",
          description: "At least one image must remain in the study.",
          variant: "destructive",
        })
        return prev
      }

      const updatedImages = [...prev.images]
      updatedImages.splice(index, 1)

      // Adjust current image index if needed
      let newCurrentIndex = prev.currentImageIndex
      if (newCurrentIndex >= updatedImages.length) {
        newCurrentIndex = updatedImages.length - 1
      }

      toast({
        title: "Image Deleted",
        description: "The image has been removed from the study.",
      })

      return {
        ...prev,
        images: updatedImages,
        currentImageIndex: newCurrentIndex,
      }
    })
  }, [])

  // Update report state
  const updateReportState = useCallback((updates: Partial<ReportState>) => {
    setState((prev) => ({
      ...prev,
      reportState: {
        ...prev.reportState,
        ...updates,
        isDirty: true,
      },
    }))
  }, [])

  // Save report
  const saveReport = useCallback(async () => {
    if (!state.studyId) return

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const { report, error } = await saveRadiologyReport(state.studyId, {
        findings: state.reportState.findings,
        impression: state.reportState.impression,
        recommendations: state.reportState.recommendations,
        status: state.reportState.status,
      })

      if (error) {
        toast({
          title: "Save Error",
          description: "Failed to save the report. Please try again.",
          variant: "destructive",
        })
        setState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      setState((prev) => ({
        ...prev,
        reportState: {
          ...prev.reportState,
          lastSaved: new Date().toISOString(),
          isDirty: false,
        },
        isLoading: false,
      }))

      toast({
        title: "Report Saved",
        description: "The radiology report has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving report:", error)
      toast({
        title: "Save Error",
        description: "An unexpected error occurred while saving the report.",
        variant: "destructive",
      })
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [state.studyId, state.reportState])

  // Finalize report
  const finalizeReport = useCallback(async () => {
    if (!state.studyId) return

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const { report, error } = await saveRadiologyReport(state.studyId, {
        findings: state.reportState.findings,
        impression: state.reportState.impression,
        recommendations: state.reportState.recommendations,
        status: "final",
      })

      if (error) {
        toast({
          title: "Finalization Error",
          description: "Failed to finalize the report. Please try again.",
          variant: "destructive",
        })
        setState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      setState((prev) => ({
        ...prev,
        reportState: {
          ...prev.reportState,
          status: "final",
          lastSaved: new Date().toISOString(),
          isDirty: false,
        },
        isLoading: false,
      }))

      toast({
        title: "Report Finalized",
        description: "The radiology report has been finalized and is now available for viewing.",
      })
    } catch (error) {
      console.error("Error finalizing report:", error)
      toast({
        title: "Finalization Error",
        description: "An unexpected error occurred while finalizing the report.",
        variant: "destructive",
      })
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [state.studyId, state.reportState])

  // Refresh study data
  const refreshStudy = useCallback(async () => {
    await loadStudy()
  }, [loadStudy])

  // Context value
  const contextValue: RadiologyContextType = {
    state,
    setCurrentImageIndex,
    setActiveViewboxIndex,
    setLayout,
    setViewMode,
    updateViewboxSettings,
    updateAnnotations,
    uploadImages,
    deleteImage,
    updateReportState,
    saveReport,
    finalizeReport,
    refreshStudy,
  }

  return <RadiologyContext.Provider value={contextValue}>{children}</RadiologyContext.Provider>
}

// Custom hook to use the context
export function useRadiologyState() {
  const context = useContext(RadiologyContext)
  if (context === undefined) {
    throw new Error("useRadiologyState must be used within a RadiologyStateProvider")
  }
  return context
}
