"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface ProgressReportFormProps {
  content: any
  setContent: (content: any) => void
}

export default function ProgressReportForm({ content, setContent }: ProgressReportFormProps) {
  // Initialize objective if it doesn't exist
  const initialObjective = content.objective || { vitals: {}, examination: "" }

  // Set up local state for vitals to make them easier to work with
  const [vitals, setVitals] = useState({
    blood_pressure: initialObjective.vitals?.blood_pressure || "",
    heart_rate: initialObjective.vitals?.heart_rate || "",
    temperature: initialObjective.vitals?.temperature || "",
    respiratory_rate: initialObjective.vitals?.respiratory_rate || "",
    oxygen_saturation: initialObjective.vitals?.oxygen_saturation || "",
  })

  const handleChange = (field: string, value: string) => {
    setContent({
      ...content,
      [field]: value,
    })
  }

  const handleExaminationChange = (value: string) => {
    setContent({
      ...content,
      objective: {
        ...content.objective,
        examination: value,
      },
    })
  }

  const handleVitalChange = (field: string, value: string) => {
    const newVitals = {
      ...vitals,
      [field]: value,
    }

    setVitals(newVitals)

    setContent({
      ...content,
      objective: {
        ...content.objective,
        vitals: newVitals,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="subjective">Subjective</Label>
        <Textarea
          id="subjective"
          value={content.subjective || ""}
          onChange={(e) => handleChange("subjective", e.target.value)}
          placeholder="Enter patient's subjective information"
          className="min-h-[150px]"
        />
      </div>

      <div className="space-y-4">
        <Label>Objective</Label>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-sm">Vitals</Label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="blood_pressure" className="text-xs">
                    Blood Pressure
                  </Label>
                  <Input
                    id="blood_pressure"
                    value={vitals.blood_pressure}
                    onChange={(e) => handleVitalChange("blood_pressure", e.target.value)}
                    placeholder="e.g., 120/80 mmHg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heart_rate" className="text-xs">
                    Heart Rate
                  </Label>
                  <Input
                    id="heart_rate"
                    value={vitals.heart_rate}
                    onChange={(e) => handleVitalChange("heart_rate", e.target.value)}
                    placeholder="e.g., 72 bpm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature" className="text-xs">
                    Temperature
                  </Label>
                  <Input
                    id="temperature"
                    value={vitals.temperature}
                    onChange={(e) => handleVitalChange("temperature", e.target.value)}
                    placeholder="e.g., 37.0 °C"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="respiratory_rate" className="text-xs">
                    Respiratory Rate
                  </Label>
                  <Input
                    id="respiratory_rate"
                    value={vitals.respiratory_rate}
                    onChange={(e) => handleVitalChange("respiratory_rate", e.target.value)}
                    placeholder="e.g., 16 breaths/min"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oxygen_saturation" className="text-xs">
                    Oxygen Saturation
                  </Label>
                  <Input
                    id="oxygen_saturation"
                    value={vitals.oxygen_saturation}
                    onChange={(e) => handleVitalChange("oxygen_saturation", e.target.value)}
                    placeholder="e.g., 98%"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="examination">Examination Findings</Label>
          <Textarea
            id="examination"
            value={content.objective?.examination || ""}
            onChange={(e) => handleExaminationChange(e.target.value)}
            placeholder="Enter examination findings"
            className="min-h-[150px]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assessment">Assessment</Label>
        <Textarea
          id="assessment"
          value={content.assessment || ""}
          onChange={(e) => handleChange("assessment", e.target.value)}
          placeholder="Enter assessment"
          className="min-h-[150px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">Plan</Label>
        <Textarea
          id="plan"
          value={content.plan || ""}
          onChange={(e) => handleChange("plan", e.target.value)}
          placeholder="Enter treatment plan"
          className="min-h-[150px]"
        />
      </div>
    </div>
  )
}
