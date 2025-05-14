"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Plus, Trash2, Search, AlertCircle, Pill } from "lucide-react"
import { createPrescription, getMedicationCatalog, addMedicationToCatalog } from "@/services/prescription-service"

interface PrescriptionFormProps {
  patient: any
  visit: any
  doctor: any
  hospitalId: string
  onSuccess?: () => void
}

export default function PrescriptionForm({ patient, visit, doctor, hospitalId, onSuccess }: PrescriptionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("catalog")
  const [searchQuery, setSearchQuery] = useState("")
  const [medications, setMedications] = useState<any[]>([])
  const [medicationCatalog, setMedicationCatalog] = useState<any[]>([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const [newMedication, setNewMedication] = useState({
    name: "",
    type: "tablet",
    strength: "",
    notes: "",
  })
  const [prescriptionNotes, setPrescriptionNotes] = useState("")
  const [duration, setDuration] = useState("7")

  // Fetch medication catalog on component mount
  useEffect(() => {
    async function fetchMedicationCatalog() {
      setIsLoadingCatalog(true)
      try {
        const { medications, error } = await getMedicationCatalog(hospitalId)
        if (error) throw new Error(error)
        setMedicationCatalog(medications || [])
      } catch (error) {
        console.error("Error fetching medication catalog:", error)
        toast({
          title: "Error",
          description: "Failed to load medication catalog. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingCatalog(false)
      }
    }

    fetchMedicationCatalog()
  }, [hospitalId])

  // Filter medication catalog based on search query
  const filteredCatalog = medicationCatalog.filter(
    (med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.type && med.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (med.strength && med.strength.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Add medication to prescription
  const addMedication = (medication: any) => {
    const newMed = {
      ...medication,
      dosage: "",
      frequency: "1-0-1",
      duration: duration,
      instructions: "",
    }
    setMedications([...medications, newMed])
    toast({
      title: "Medication Added",
      description: `${medication.name} has been added to the prescription.`,
    })
  }

  // Add custom medication
  const addCustomMedication = async () => {
    if (!newMedication.name) {
      toast({
        title: "Error",
        description: "Medication name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      // Add to catalog first
      const { medication, error } = await addMedicationToCatalog({
        name: newMedication.name,
        type: newMedication.type,
        strength: newMedication.strength,
        notes: newMedication.notes,
        hospital_id: hospitalId,
        created_by: doctor[0].id,
      })

      if (error) throw new Error(error)

      // Add to current prescription
      addMedication({
        id: medication.id,
        name: newMedication.name,
        type: newMedication.type,
        strength: newMedication.strength,
        notes: newMedication.notes,
      })

      // Reset form and update catalog
      setNewMedication({
        name: "",
        type: "tablet",
        strength: "",
        notes: "",
      })
      setMedicationCatalog([...medicationCatalog, medication])
      setActiveTab("current")
    } catch (error) {
      console.error("Error adding custom medication:", error)
      toast({
        title: "Error",
        description: "Failed to add custom medication. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Remove medication from prescription
  const removeMedication = (index: number) => {
    const updatedMedications = [...medications]
    updatedMedications.splice(index, 1)
    setMedications(updatedMedications)
    toast({
      title: "Medication Removed",
      description: "The medication has been removed from the prescription.",
    })
  }

  // Update medication details
  const updateMedication = (index: number, field: string, value: string) => {
    const updatedMedications = [...medications]
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value,
    }
    setMedications(updatedMedications)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (medications.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one medication to the prescription.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const prescriptionData = {
        id: crypto.randomUUID(),
        patient_id: patient.id,
        visit_id: visit.id,
        doctor_id: doctor[0].id,
        created_by: doctor[0].id,
        users: doctor[0],
        hospital_id: hospitalId,
        medications: medications,
        notes: prescriptionNotes,
        duration: Number.parseInt(duration),
        status: "active",
      }

      const { prescription, error } = await createPrescription(prescriptionData)

      if (error) throw new Error(error)

      toast({
        title: "Prescription Created",
        description: "The prescription has been created successfully.",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
        router.push(`/patients/${patient.id}?tab=prescriptions`)
      }
    } catch (error) {
      console.error("Error creating prescription:", error)
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Input id="patient" value={patient.name} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit-date">Visit Date</Label>
                <Input id="visit-date" value={format(new Date(visit.visit_date), "MMMM d, yyyy")} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit-reason">Visit Reason</Label>
                <Input id="visit-reason" value={visit.reason} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor">Prescribing Doctor</Label>
                <Input id="doctor" value={doctor.full_name} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Days)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="10">10 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Prescription Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional instructions or notes..."
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Medications</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="px-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="catalog">Medication Catalog</TabsTrigger>
                      <TabsTrigger value="custom">Add Custom</TabsTrigger>
                      <TabsTrigger value="current">
                        Current Prescription{" "}
                        {medications.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {medications.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="catalog" className="p-6 pt-4">
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search medications..."
                          className="pl-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      {isLoadingCatalog ? (
                        <div className="flex justify-center py-8">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                      ) : filteredCatalog.length === 0 ? (
                        <div className="text-center py-8">
                          <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-muted-foreground">No medications found matching your search.</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Try a different search term or add a custom medication.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredCatalog.map((medication) => (
                            <div
                              key={medication.id}
                              className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                            >
                              <div>
                                <p className="font-medium">{medication.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {medication.type && (
                                    <Badge variant="outline" className="capitalize">
                                      {medication.type}
                                    </Badge>
                                  )}
                                  {medication.strength && (
                                    <Badge variant="outline" className="bg-blue-50">
                                      {medication.strength}
                                    </Badge>
                                  )}
                                </div>
                                {medication.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">{medication.notes}</p>
                                )}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => addMedication(medication)}
                                disabled={medications.some((med) => med.id === medication.id)}
                              >
                                {medications.some((med) => med.id === medication.id) ? "Added" : "Add"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="custom" className="p-6 pt-4">
                    <div className="space-y-4">
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="med-name">Medication Name*</Label>
                          <Input
                            id="med-name"
                            placeholder="Enter medication name"
                            value={newMedication.name}
                            onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="med-type">Type</Label>
                          <Select
                            value={newMedication.type}
                            onValueChange={(value) => setNewMedication({ ...newMedication, type: value })}
                          >
                            <SelectTrigger id="med-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tablet">Tablet</SelectItem>
                              <SelectItem value="capsule">Capsule</SelectItem>
                              <SelectItem value="syrup">Syrup</SelectItem>
                              <SelectItem value="injection">Injection</SelectItem>
                              <SelectItem value="cream">Cream</SelectItem>
                              <SelectItem value="ointment">Ointment</SelectItem>
                              <SelectItem value="drops">Drops</SelectItem>
                              <SelectItem value="inhaler">Inhaler</SelectItem>
                              <SelectItem value="powder">Powder</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="med-strength">Strength</Label>
                        <Input
                          id="med-strength"
                          placeholder="e.g., 500mg, 10mg/ml"
                          value={newMedication.strength}
                          onChange={(e) => setNewMedication({ ...newMedication, strength: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="med-notes">Notes</Label>
                        <Textarea
                          id="med-notes"
                          placeholder="Additional information about the medication"
                          value={newMedication.notes}
                          onChange={(e) => setNewMedication({ ...newMedication, notes: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <Button type="button" onClick={addCustomMedication} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Prescription
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="current" className="p-6 pt-4">
                    {medications.length === 0 ? (
                      <div className="text-center py-8">
                        <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-muted-foreground">No medications added to this prescription yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add medications from the catalog or create custom medications.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {medications.map((medication, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{medication.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  {medication.type && (
                                    <Badge variant="outline" className="capitalize">
                                      {medication.type}
                                    </Badge>
                                  )}
                                  {medication.strength && (
                                    <Badge variant="outline" className="bg-blue-50">
                                      {medication.strength}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeMedication(index)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>

                            <Separator className="my-4" />

                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                                <Input
                                  id={`dosage-${index}`}
                                  placeholder="e.g., 1 tablet, 5ml"
                                  value={medication.dosage}
                                  onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                                <Select
                                  value={medication.frequency}
                                  onValueChange={(value) => updateMedication(index, "frequency", value)}
                                >
                                  <SelectTrigger id={`frequency-${index}`}>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1-0-0">Once daily (Morning)</SelectItem>
                                    <SelectItem value="0-1-0">Once daily (Afternoon)</SelectItem>
                                    <SelectItem value="0-0-1">Once daily (Evening)</SelectItem>
                                    <SelectItem value="1-0-1">Twice daily (Morning-Evening)</SelectItem>
                                    <SelectItem value="1-1-0">Twice daily (Morning-Afternoon)</SelectItem>
                                    <SelectItem value="0-1-1">Twice daily (Afternoon-Evening)</SelectItem>
                                    <SelectItem value="1-1-1">Three times daily</SelectItem>
                                    <SelectItem value="1-1-1-1">Four times daily</SelectItem>
                                    <SelectItem value="SOS">As needed (SOS)</SelectItem>
                                    <SelectItem value="other">Other (specify in instructions)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2 mt-4">
                              <Label htmlFor={`instructions-${index}`}>Special Instructions</Label>
                              <Textarea
                                id={`instructions-${index}`}
                                placeholder="e.g., Take after meals, Avoid alcohol"
                                value={medication.instructions}
                                onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {medications.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Prescription Summary</h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      You are prescribing {medications.length} medication{medications.length !== 1 ? "s" : ""} for{" "}
                      {patient.name} for a duration of {duration} days.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || medications.length === 0}>
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                Creating...
              </>
            ) : (
              "Create Prescription"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
