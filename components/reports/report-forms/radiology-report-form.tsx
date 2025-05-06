"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface RadiologyReportFormProps {
  content: any
  setContent: (content: any) => void
  reportType: string
}

export default function RadiologyReportForm({ content, setContent, reportType }: RadiologyReportFormProps) {
  // Get appropriate field labels based on report type
  const getFieldLabels = () => {
    switch (reportType) {
      case "radiology":
        return {
          examination: "Examination",
          clinicalInformation: "Clinical Information",
          technique: "Technique",
          findings: "Findings",
          impression: "Impression",
        }
      case "laboratory":
        return {
          examination: "Test Name",
          clinicalInformation: "Clinical Information",
          technique: "Method",
          findings: "Results",
          impression: "Interpretation",
        }
      case "pathology":
        return {
          examination: "Specimen",
          clinicalInformation: "Clinical History",
          technique: "Procedure",
          findings: "Findings",
          impression: "Diagnosis",
        }
      default:
        return {
          examination: "Examination",
          clinicalInformation: "Clinical Information",
          technique: "Technique",
          findings: "Findings",
          impression: "Impression",
        }
    }
  }

  const labels = getFieldLabels()

  const handleChange = (field: string, value: string) => {
    setContent({
      ...content,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="examination">{labels.examination}</Label>
        <Textarea
          id="examination"
          value={content.examination || ""}
          onChange={(e) => handleChange("examination", e.target.value)}
          placeholder={`Enter ${labels.examination.toLowerCase()}`}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clinicalInformation">{labels.clinicalInformation}</Label>
        <Textarea
          id="clinicalInformation"
          value={content.clinicalInformation || ""}
          onChange={(e) => handleChange("clinicalInformation", e.target.value)}
          placeholder={`Enter ${labels.clinicalInformation.toLowerCase()}`}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="technique">{labels.technique}</Label>
        <Textarea
          id="technique"
          value={content.technique || ""}
          onChange={(e) => handleChange("technique", e.target.value)}
          placeholder={`Enter ${labels.technique.toLowerCase()}`}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="findings">{labels.findings}</Label>
        <Textarea
          id="findings"
          value={content.findings || ""}
          onChange={(e) => handleChange("findings", e.target.value)}
          placeholder={`Enter ${labels.findings.toLowerCase()}`}
          className="min-h-[150px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="impression">{labels.impression}</Label>
        <Textarea
          id="impression"
          value={content.impression || ""}
          onChange={(e) => handleChange("impression", e.target.value)}
          placeholder={`Enter ${labels.impression.toLowerCase()}`}
          className="min-h-[150px]"
        />
      </div>
    </div>
  )
}
