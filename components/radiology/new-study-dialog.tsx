"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { createRadiologyStudy } from "@/services/radiology-service"
import { getGeneralPatients } from "@/services/patient-service"
import { useToast } from "@/components/ui/use-toast"

interface NewStudyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  hospitalId: string
  onStudyCreated: (studyId: string) => void
}

const formSchema = z.object({
  patient_id: z.string().min(1, "Patient ID is required"),
  patient_name: z.string().min(1, "Patient name is required"),
  accession_number: z.string().optional(),
  study_description: z.string().min(1, "Study description is required"),
  study_date: z.date({
    required_error: "Study date is required",
  }),
  modality: z.string({
    required_error: "Modality is required",
  }),
  referring_physician: z.string().optional(),
  clinical_information: z.string().optional(),
})

export default function NewStudyDialog({
  open,
  onOpenChange,
  userId,
  hospitalId,
  onStudyCreated,
}: NewStudyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_id: "",
      patient_name: "",
      accession_number: "",
      study_description: "",
      study_date: new Date(),
      modality: "",
      referring_physician: "",
      clinical_information: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const { study, error } = await createRadiologyStudy({
        ...values,
        created_by: userId,
        hospital_id: hospitalId,
      })

      if (error) {
        throw new Error(error)
      }

      if (study) {
        onStudyCreated(study.id)
        router.refresh()
      }
    } catch (error) {
      console.error("Error creating study:", error)
      toast({
        title: "Error",
        description: "Failed to create new study. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { patients: patientData } = await getGeneralPatients(hospitalId)
        if (patientData) {
          setPatients(patientData)
        }
      } catch (error) {
        console.error("Error fetching patients:", error)
      }
    }
  
    if (open) {
      fetchPatients()
    }
  }, [hospitalId, open])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Radiological Study</DialogTitle>
          <DialogDescription>
            Enter the details for the new radiological study. Once created, you'll be able to upload and view images.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {patients.map((patient) => (
  <SelectItem key={patient.id} value={patient.id}>
    {patient.name}
  </SelectItem>
))}

</SelectContent>

                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accession_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accession Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter accession number (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modality</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select modality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CR">CR (Computed Radiography)</SelectItem>
                        <SelectItem value="CT">CT (Computed Tomography)</SelectItem>
                        <SelectItem value="MR">MR (Magnetic Resonance)</SelectItem>
                        <SelectItem value="US">US (Ultrasound)</SelectItem>
                        <SelectItem value="XA">XA (X-Ray Angiography)</SelectItem>
                        <SelectItem value="MG">MG (Mammography)</SelectItem>
                        <SelectItem value="PT">PT (Positron Emission Tomography)</SelectItem>
                        <SelectItem value="NM">NM (Nuclear Medicine)</SelectItem>
                        <SelectItem value="DX">DX (Digital Radiography)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="study_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Study Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
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
                name="referring_physician"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referring Physician</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter referring physician (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="study_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter study description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clinical_information"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinical Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter relevant clinical information or notes (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include any relevant clinical history, symptoms, or diagnostic questions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} onClick={() => onSubmit(form.getValues())}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Study"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
