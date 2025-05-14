"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { patientSignIn } from "@/services/patient-auth-service"

const formSchema = z.object({
  loginCode: z.string().length(7, "Login code must be 7 digits").regex(/^\d+$/, "Login code must contain only numbers"),
  fullName: z.string().min(3, "Full name is required"),
})

export default function PatientLoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loginCode: "",
      fullName: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await patientSignIn(values.loginCode, values.fullName)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.success) {
        router.push("/patient-portal/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="loginCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>7-Digit Login Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your login code"
                    {...field}
                    maxLength={16}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Access My Records"
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          Don't have a login code?{" "}
          <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/patient-portal/help")}>
            Contact your healthcare provider
          </Button>
        </p>
      </div>
    </div>
  )
}
