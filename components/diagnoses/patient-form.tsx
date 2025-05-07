"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEffect } from "react"

const patientFormSchema = z.object({
  patientName: z.string().min(2, "Patient name must be at least 2 characters"),
  patientId: z.string().min(2, "Patient ID must be at least 2 characters"),
  ageRange: z.string().min(1, "Age range is required"),
  scanType: z.string().min(1, "Scan type is required"),
  notes: z.string().optional(),
})

export type PatientFormValues = z.infer<typeof patientFormSchema>

interface PatientFormProps {
  onFormValuesChange: (values: PatientFormValues) => void
  onScanTypeChange?: (scanType: string) => void
  defaultValues?: Partial<PatientFormValues>
}

// Map scan types to appropriate API endpoints
export const SCAN_TYPE_TO_ENDPOINT = {
  MRI: "/api/diagnoses/create/brain-mri",
  "X-Ray": "/api/diagnoses/create/chest-14",
  Ultrasound: "/api/diagnoses/create/breast-ultrasound",
  "CT Kidney": "/api/diagnoses/create/ct-kidney",
  "Pneumonia": "/api/diagnoses/create/pneumonia",
  "PET Scan": "/api/analyze",
  "Fracture": "/api/diagnoses/create/bone-fracture",
  Mammogram: "/api/analyze",
}

export default function PatientForm({ onFormValuesChange, onScanTypeChange, defaultValues }: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      patientName: defaultValues?.patientName || "",
      patientId: defaultValues?.patientId || "",
      ageRange: defaultValues?.ageRange || "",
      scanType: defaultValues?.scanType || "",
      notes: defaultValues?.notes || "",
    },
    mode: "onChange",
  })

  // Watch for form changes and notify parent component
  form.watch((data) => {
    if (form.formState.isValid) {
      onFormValuesChange(data as PatientFormValues)
    }
  })

  // Watch specifically for scan type changes
  const scanType = form.watch("scanType")

  useEffect(() => {
    if (scanType && onScanTypeChange) {
      onScanTypeChange(scanType)
    }
  }, [scanType, onScanTypeChange])

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="patientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter patient name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter patient ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="ageRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age Range</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0-18">0-18 years (Pediatric)</SelectItem>
                    <SelectItem value="19-39">19-39 years (Young Adult)</SelectItem>
                    <SelectItem value="40-59">40-59 years (Middle-aged)</SelectItem>
                    <SelectItem value="60+">60+ years (Senior)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scanType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scan Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="X-Ray">Chest X-Ray (General Scan)</SelectItem>
                    <SelectItem value="CT Kidney">CT Scan (Kidney Cyst, Stone, and Tumor Detection)</SelectItem>
                    <SelectItem value="MRI">MRI (Brain Cancer Detection)</SelectItem>
                    <SelectItem value="Pneumonia">Chest X-Ray / CT Scan (Pneumonia Detection)</SelectItem>
                    <SelectItem value="Ultrasound">Ultrasound (Breast Cancer Detection)</SelectItem>
                    <SelectItem value="Fracture">X-Ray (Bone Fracture Detection)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor's Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional notes or observations"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Include any relevant observations or context for the AI analysis</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
