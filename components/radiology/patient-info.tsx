"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { useRadiologyState } from "./radiology-state-provider"

export default function PatientInfo() {
  const { state, setViewMode } = useRadiologyState()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode("images")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Patient Information</h1>
            <div className="text-sm text-muted-foreground">{state.study?.patient_name || "Unknown Patient"}</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Patient Information</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-muted-foreground text-sm">Name:</span>
                      <span className="col-span-2 font-medium">{state.study?.patient_name || "Unknown"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-muted-foreground text-sm">Patient ID:</span>
                      <span className="col-span-2 font-medium">{state.study?.patient_id || "Unknown"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-muted-foreground text-sm">Birth Date:</span>
                      <span className="col-span-2 font-medium">Not Available</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-muted-foreground text-sm">Gender:</span>
                      <span className="col-span-2 font-medium">Not Available</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Study Information</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-muted-foreground text-sm">Study Date:</span>
                      <span className="col-span-2 font-medium">{format(new Date(state.study?.study_date), "PPP")}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-muted-foreground text-sm">Accession #:</span>
                      <span className="col-span-2 font-medium">{state.study?.accession_number || "Not Available"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-muted-foreground text-sm">Modality:</span>
                      <span className="col-span-2 font-medium">{state.study?.modality}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-muted-foreground text-sm">Referring Physician:</span>
                      <span className="col-span-2 font-medium">
                        {state.study?.referring_physician || "Not Available"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Clinical Information</h3>
                <p className="text-sm">{state.study?.clinical_information || "No clinical information provided."}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
