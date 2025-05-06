"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ClinicalReportFormProps {
  content: any
  setContent: (content: any) => void
}

export default function ClinicalReportForm({ content, setContent }: ClinicalReportFormProps) {
  const handleChange = (field: string, value: string) => {
    setContent({
      ...content,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="findings">Clinical Findings</Label>
        <Textarea
          id="findings"
          value={content.findings || ""}
          onChange={(e) => handleChange("findings", e.target.value)}
          placeholder="Enter clinical findings"
          className="min-h-[150px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Textarea
          id="diagnosis"
          value={content.diagnosis || ""}
          onChange={(e) => handleChange("diagnosis", e.target.value)}
          placeholder="Enter diagnosis"
          className="min-h-[150px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment">Treatment</Label>
        <Textarea
          id="treatment"
          value={content.treatment || ""}
          onChange={(e) => handleChange("treatment", e.target.value)}
          placeholder="Enter treatment plan"
          className="min-h-[150px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recommendations">Recommendations</Label>
        <Textarea
          id="recommendations"
          value={content.recommendations || ""}
          onChange={(e) => handleChange("recommendations", e.target.value)}
          placeholder="Enter recommendations"
          className="min-h-[150px]"
        />
      </div>
    </div>
  )
}
