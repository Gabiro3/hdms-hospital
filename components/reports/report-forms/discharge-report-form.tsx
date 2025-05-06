"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"

interface DischargeReportFormProps {
  content: any
  setContent: (content: any) => void
}

export default function DischargeReportForm({ content, setContent }: DischargeReportFormProps) {
  const [medications, setMedications] = useState<any[]>(content.medications || [])

  const handleChange = (field: string, value: string) => {
    setContent({
      ...content,
      [field]: value,
    })
  }

  const handleDateChange = (field: string, value: string) => {
    setContent({
      ...content,
      [field]: value ? new Date(value).toISOString() : "",
    })
  }

  const addMedication = () => {
    const newMedication = {
      name: "",
      dosage: "",
      frequency: "",
      instructions: "",
    }
    const updatedMedications = [...medications, newMedication]
    setMedications(updatedMedications)
    setContent({
      ...content,
      medications: updatedMedications,
    })
  }

  const updateMedication = (index: number, field: string, value: string) => {
    const updatedMedications = [...medications]
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value,
    }
    setMedications(updatedMedications)
    setContent({
      ...content,
      medications: updatedMedications,
    })
  }

  const removeMedication = (index: number) => {
    const updatedMedications = medications.filter((_, i) => i !== index)
    setMedications(updatedMedications)
    setContent({
      ...content,
      medications: updatedMedications,
    })
  }

  // Format date for input
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="admissionDate">Admission Date</Label>
          <Input
            id="admissionDate"
            type="date"
            value={formatDate(content.admissionDate || "")}
            onChange={(e) => handleDateChange("admissionDate", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dischargeDate">Discharge Date</Label>
          <Input
            id="dischargeDate"
            type="date"
            value={formatDate(content.dischargeDate || "")}
            onChange={(e) => handleDateChange("dischargeDate", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admissionDiagnosis">Admission Diagnosis</Label>
        <Textarea
          id="admissionDiagnosis"
          value={content.admissionDiagnosis || ""}
          onChange={(e) => handleChange("admissionDiagnosis", e.target.value)}
          placeholder="Enter admission diagnosis"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dischargeDiagnosis">Discharge Diagnosis</Label>
        <Textarea
          id="dischargeDiagnosis"
          value={content.dischargeDiagnosis || ""}
          onChange={(e) => handleChange("dischargeDiagnosis", e.target.value)}
          placeholder="Enter discharge diagnosis"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatmentSummary">Treatment Summary</Label>
        <Textarea
          id="treatmentSummary"
          value={content.treatmentSummary || ""}
          onChange={(e) => handleChange("treatmentSummary", e.target.value)}
          placeholder="Enter treatment summary"
          className="min-h-[150px]"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Discharge Medications</Label>
          <Button type="button" size="sm" variant="outline" onClick={addMedication}>
            <Plus className="mr-1 h-4 w-4" />
            Add Medication
          </Button>
        </div>

        {medications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No medications added. Click "Add Medication" to add one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {medications.map((medication, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`medication-name-${index}`} className="text-xs">
                        Medication Name
                      </Label>
                      <Input
                        id={`medication-name-${index}`}
                        value={medication.name || ""}
                        onChange={(e) => updateMedication(index, "name", e.target.value)}
                        placeholder="Medication name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`medication-dosage-${index}`} className="text-xs">
                        Dosage
                      </Label>
                      <Input
                        id={`medication-dosage-${index}`}
                        value={medication.dosage || ""}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                        placeholder="e.g., 10mg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`medication-frequency-${index}`} className="text-xs">
                        Frequency
                      </Label>
                      <Input
                        id={`medication-frequency-${index}`}
                        value={medication.frequency || ""}
                        onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                        placeholder="e.g., Twice daily"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`medication-instructions-${index}`} className="text-xs">
                          Instructions
                        </Label>
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeMedication(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <Input
                        id={`medication-instructions-${index}`}
                        value={medication.instructions || ""}
                        onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                        placeholder="e.g., Take with food"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="followUpInstructions">Follow-up Instructions</Label>
        <Textarea
          id="followUpInstructions"
          value={content.followUpInstructions || ""}
          onChange={(e) => handleChange("followUpInstructions", e.target.value)}
          placeholder="Enter follow-up instructions"
          className="min-h-[150px]"
        />
      </div>
    </div>
  )
}
