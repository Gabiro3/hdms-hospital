"use client"

import { useRadiologyState } from "./radiology-state-provider"
import RadiologyViewer from "./radiology-viewer"
import RadiologyReport from "./radiology-report"
import PatientInfo from "./patient-info"
import { Loader2 } from "lucide-react"

interface RadiologyViewerContainerProps {
  initialStudy: any
  currentUser: any
}

export default function RadiologyViewerContainer({ initialStudy, currentUser }: RadiologyViewerContainerProps) {
  const { state } = useRadiologyState()

  if (state.isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading radiology study...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="max-w-md p-6 bg-card rounded-lg shadow-lg border">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{state.error}</p>
          <a href="/radiology" className="text-primary hover:underline">
            Return to Radiology Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Render the appropriate view based on the current view mode
  return (
    <div className="h-[98vh] overflow-y-auto flex flex-col bg-background text-foreground">
      {state.viewMode === "images" && <RadiologyViewer currentUser={currentUser} />}
      {state.viewMode === "report" && <RadiologyReport />}
      {state.viewMode === "info" && <PatientInfo />}
    </div>
  )
}
