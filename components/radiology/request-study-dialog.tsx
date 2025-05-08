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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { createRadiologyRequest } from "@/services/radiology-service"
import { getGeneralPatients } from "@/services/patient-service"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface RequestStudyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  hospitalId: string
  onStudyRequested: () => void
}

const formSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  study_type: z.string().min(1, "Study type is required"),
  clinical_details: z.string().min(1, "Clinical details are required"),
  priority: z.string().default("normal"),
  scheduled_date: z.date().optional(),
  is_urgent: z.boolean().default(false),
  additional_notes: z.string().optional(),
})

export default function RequestStudyDialog({
  open,
  onOpenChange,
  userId,
  hospitalId,
  onStudyRequested,
}: RequestStudyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_id: "",
      study_type: "",
      clinical_details: "",
      priority: "normal",
      is_urgent: false,
      additional_notes: "",
    },
  })

  // Watch is_urgent to update priority
  const isUrgent = form.watch("is_urgent")

  useEffect(() => {
    if (isUrgent) {
      form.setValue("priority", "urgent")
    } else {
      form.setValue("priority", "normal")
    }
  }, [isUrgent, form])

  // Fetch patients when dialog opens
  useEffect(() => {
    if (open && hospitalId) {
      const fetchPatients = async () => {
        try {
          const { patients: patientData } = await getGeneralPatients(hospitalId)
          if (patientData) {
            setPatients(patientData)
          }
        } catch (error) {
          console.error("Error fetching patients:", error)
          toast({
            title: "Error",
            description: "Failed to load patients. Please try again.",
            variant: "destructive",
          })
        }
      }

      fetchPatients()
    }
  }, [open, hospitalId, toast])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const { request, error } = await createRadiologyRequest({
        patient_id: values.patient_id,
        hospital_id: hospitalId,
        requested_by: userId,
        study_type: values.study_type,
        clinical_details: values.clinical_details,
        priority: values.priority,
        scheduled_date: values.scheduled_date ? values.scheduled_date.toISOString() : null,
        additional_notes: values.additional_notes || null,
      })

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "Request Submitted",
        description: "Your radiology study request has been submitted successfully.",
      })

      onStudyRequested()
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error creating request:", error)
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Radiology Study</DialogTitle>
          <DialogDescription>
            Fill out this form to request a new radiology study for a patient. The request will be sent to the radiology
            department.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <FormField
              control={form.control}
              name="study_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select study type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="CT Scan">CT Scan</SelectItem>
                      <SelectItem value="MRI">MRI</SelectItem>
                      <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="Mammography">Mammography</SelectItem>
                      <SelectItem value="PET Scan">PET Scan</SelectItem>
                      <SelectItem value="Nuclear Medicine">Nuclear Medicine</SelectItem>
                      <SelectItem value="Angiography">Angiography</SelectItem>
                      <SelectItem value="Fluoroscopy">Fluoroscopy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Preferred Date (Optional)</FormLabel>
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Select a preferred date for the study (subject to availability)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_urgent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Urgent Request</FormLabel>
                    <FormDescription>Mark this request as urgent if it requires immediate attention</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clinical_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinical Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter relevant clinical information, symptoms, and diagnostic questions"
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include patient history, symptoms, and specific diagnostic questions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additional_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information for the radiologist"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Special instructions, allergies, or other relevant information</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
