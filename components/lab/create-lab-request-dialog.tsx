"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { toast } from "@/hooks/use-toast"
import { createLabRequest, getLabTechnicians } from "@/services/lab-service"
import { getGeneralPatients } from "@/services/patient-service"

const formSchema = z.object({
  patient_id: z.string({
    required_error: "Please select a patient",
  }),
  test_type: z.string({
    required_error: "Please select a test type",
  }),
  assigned_to: z.string({
    required_error: "Please select a lab technician",
  }),
  priority: z.string().default("normal"),
  notes: z.string().optional(),
})

interface CreateLabRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  hospitalId: string
  onRequestCreated: () => void
}

export default function CreateLabRequestDialog({
  open,
  onOpenChange,
  userId,
  hospitalId,
  onRequestCreated,
}: CreateLabRequestDialogProps) {
  const [patients, setPatients] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priority: "normal",
      notes: "",
    },
  })

  useEffect(() => {
    if (open && hospitalId) {
      const fetchData = async () => {
        try {
          // Fetch patients
          const { patients: patientData } = await getGeneralPatients(hospitalId)
          if (patientData) {
            setPatients(patientData)
          }

          // Fetch lab technicians
          const { technicians: techData } = await getLabTechnicians(hospitalId)
          if (techData) {
            setTechnicians(techData)
          }
        } catch (error) {
          console.error("Error fetching data:", error)
          toast({
            title: "Error",
            description: "Failed to load data. Please try again.",
            variant: "destructive",
          })
        }
      }

      fetchData()
    }
  }, [open, hospitalId, toast])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!hospitalId) {
      toast({
        title: "Error",
        description: "Hospital ID is required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { request, error } = await createLabRequest({
        patient_id: values.patient_id,
        hospital_id: hospitalId,
        requested_by: userId,
        assigned_to: values.assigned_to,
        test_type: values.test_type,
        priority: values.priority,
        notes: values.notes || null,
      })

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "Success",
        description: "Lab test request created successfully",
      })

      form.reset()
      onOpenChange(false)
      onRequestCreated()
    } catch (error) {
      console.error("Error creating lab request:", error)
      toast({
        title: "Error",
        description: "Failed to create lab test request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Lab Test</DialogTitle>
          <DialogDescription>
            Create a new lab test request for a patient. The request will be sent to the selected lab technician.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="test_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="blood">Blood Test</SelectItem>
                      <SelectItem value="urine">Urine Test</SelectItem>
                      <SelectItem value="imaging">Imaging</SelectItem>
                      <SelectItem value="pathology">Pathology</SelectItem>
                      <SelectItem value="microbiology">Microbiology</SelectItem>
                      <SelectItem value="biochemistry">Biochemistry</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lab Technician</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lab technician" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.full_name}
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
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes for the lab technician"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Include any specific instructions or relevant clinical information.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
