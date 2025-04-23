"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const formSchema = z.object({
  doctorNotes: z.string().min(1, "Doctor's notes are required"),
  doctorAssessment: z.string().optional(),
})

interface DoctorNotesFormProps {
  diagnosisId: string
  initialNotes: string
  initialAssessment: string
  onSuccess: () => void
}

export default function DoctorNotesForm({
  diagnosisId,
  initialNotes,
  initialAssessment,
  onSuccess,
}: DoctorNotesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doctorNotes: initialNotes,
      doctorAssessment: initialAssessment,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setSubmitStatus(null)
    setErrorMessage("")

    try {
      // Update the diagnosis with the doctor's notes
      const { error } = await supabase
        .from("diagnoses")
        .update({
          doctor_notes: values.doctorNotes,
          doctor_assessment: values.doctorAssessment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", diagnosisId)

      if (error) {
        throw error
      }

      setSubmitStatus("success")
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (error) {
      console.error("Error updating doctor's notes:", error)
      setSubmitStatus("error")
      setErrorMessage("Failed to update doctor's notes. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {submitStatus === "success" && (
          <Alert className="bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Doctor's notes updated successfully!</AlertDescription>
          </Alert>
        )}

        {submitStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="doctorNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor's Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your medical notes about this diagnosis"
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include your observations, findings, and any relevant medical information.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="doctorAssessment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assessment of AI Analysis</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your assessment of the AI analysis results"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide your professional assessment of the AI-generated analysis, including agreements, disagreements,
                or additional insights.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Notes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
