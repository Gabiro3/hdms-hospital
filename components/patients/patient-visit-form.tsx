"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { addPatientVisit } from "@/services/patient-service"
import { toast } from "@/components/ui/use-toast"

// Define the form schema
const visitFormSchema = z.object({
  visitDate: z.date({ required_error: "Visit date is required." }),
  reason: z.string().min(2, { message: "Reason must be at least 2 characters." }),

  // Vitals
  bloodPressure: z.string().optional(),
  heartRate: z.string().optional(),
  temperature: z.string().optional(),
  respiratoryRate: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),

  // SOAP Notes
  subjective: z.string().optional(),
  examination: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),

  // Medications
  medications: z
    .array(
      z.object({
        name: z.string().min(1, "Medication name is required"),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
})

type VisitFormValues = z.infer<typeof visitFormSchema>

interface PatientVisitFormProps {
  patient: any
  hospitalId: string
  userId: string
  doctorName: string
  onSubmitted: () => void
}

export default function PatientVisitForm({
  patient,
  hospitalId,
  userId,
  doctorName,
  onSubmitted,
}: PatientVisitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [medications, setMedications] = useState<any[]>([])

  // Default values for the form
  const defaultValues: Partial<VisitFormValues> = {
    visitDate: new Date(),
    reason: "",
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
    subjective: "",
    examination: "",
    assessment: "",
    plan: "",
    medications: [],
  }

  // Initialize the form
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues,
  })

  // Handle form submission
  async function onSubmit(data: VisitFormValues) {
    setIsSubmitting(true)

    try {
      // Prepare visit data
      const visitData = {
        id: crypto.randomUUID(),
        patient_id: patient.id,
        hospital_id: hospitalId,
        user_id: userId,
        visit_date: data.visitDate.toISOString(),
        reason: data.reason,
        vitals: {
          blood_pressure: data.bloodPressure || null,
          heart_rate: data.heartRate || null,
          temperature: data.temperature || null,
          respiratory_rate: data.respiratoryRate || null,
          oxygen_saturation: data.oxygenSaturation || null,
          weight: data.weight || null,
          height: data.height || null,
        },
        notes: {
          subjective: data.subjective || null,
          examination: data.examination || null,
          assessment: data.assessment || null,
          plan: data.plan || null,
        },
        medications: medications.length > 0 ? medications : null,
        created_by: userId,
        created_by_name: doctorName,
      }

      // Save visit data
      const { visit, error } = await addPatientVisit(visitData)

      if (error || !visit) {
        throw new Error(error || "Failed to save visit")
      }

      toast({
        title: "Visit Recorded",
        description: `Visit for ${patient.name} has been recorded successfully.`,
      })

      onSubmitted()
    } catch (error) {
      console.error("Error saving visit:", error)
      toast({
        title: "Error",
        description: "Failed to save visit information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a new medication
  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", notes: "" }])
  }

  // Remove a medication
  const removeMedication = (index: number) => {
    const updatedMedications = [...medications]
    updatedMedications.splice(index, 1)
    setMedications(updatedMedications)
  }

  // Update medication field
  const updateMedication = (index: number, field: string, value: string) => {
    const updatedMedications = [...medications]
    updatedMedications[index] = { ...updatedMedications[index], [field]: value }
    setMedications(updatedMedications)
  }

  return (
    
    <div className="h-[75vh] overflow-y-auto p-6">
      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="visitDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Visit Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Visit</FormLabel>
                <FormControl>
                  <Input placeholder="Annual checkup, follow-up, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Vitals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="bloodPressure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Pressure (mmHg)</FormLabel>
                  <FormControl>
                    <Input placeholder="120/80" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="heartRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heart Rate (bpm)</FormLabel>
                  <FormControl>
                    <Input placeholder="72" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature (°C)</FormLabel>
                  <FormControl>
                    <Input placeholder="37.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="respiratoryRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Respiratory Rate (breaths/min)</FormLabel>
                  <FormControl>
                    <Input placeholder="16" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="oxygenSaturation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oxygen Saturation (%)</FormLabel>
                  <FormControl>
                    <Input placeholder="98" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input placeholder="70" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (cm)</FormLabel>
                  <FormControl>
                    <Input placeholder="170" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">SOAP Notes</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="subjective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subjective</FormLabel>
                  <FormDescription>Patient's description of symptoms and concerns</FormDescription>
                  <FormControl>
                    <Textarea placeholder="Patient reports..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="examination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objective/Examination</FormLabel>
                  <FormDescription>Physical examination findings</FormDescription>
                  <FormControl>
                    <Textarea placeholder="On examination..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assessment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment</FormLabel>
                  <FormDescription>Diagnosis or clinical impression</FormDescription>
                  <FormControl>
                    <Textarea placeholder="Assessment reveals..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <FormDescription>Treatment plan and follow-up</FormDescription>
                  <FormControl>
                    <Textarea placeholder="Plan includes..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Medications</h3>
            <Button type="button" variant="outline" size="sm" onClick={addMedication}>
              <Plus className="h-4 w-4 mr-1" />
              Add Medication
            </Button>
          </div>

          {medications.length === 0 ? (
            <div className="text-center py-4 border rounded-md bg-muted/20">
              <p className="text-muted-foreground">No medications added. Click "Add Medication" to prescribe.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {medications.map((medication, index) => (
                <div key={index} className="border rounded-md p-4 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => removeMedication(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <FormLabel className="text-sm">Medication Name</FormLabel>
                      <Input
                        value={medication.name}
                        onChange={(e) => updateMedication(index, "name", e.target.value)}
                        placeholder="Medication name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <FormLabel className="text-sm">Dosage</FormLabel>
                      <Input
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                        placeholder="e.g., 500mg"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <FormLabel className="text-sm">Frequency</FormLabel>
                      <Input
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                        placeholder="e.g., Twice daily"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel className="text-sm">Notes</FormLabel>
                    <Textarea
                      value={medication.notes}
                      onChange={(e) => updateMedication(index, "notes", e.target.value)}
                      placeholder="Additional instructions"
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Visit
          </Button>
        </div>
      </form>
    </Form>
    </div>
  )
}
