"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, PlusCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { savePatient } from "@/services/patient-service"
import { toast } from "@/components/ui/use-toast"
import { getAllInsurers, createInsurer } from "@/services/insurance-service"
import { generateUniqueLoginCode } from "@/services/patient-auth-service"
import { validateICN } from "@/lib/utils/security-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DatePicker } from "../ui/date-picker"

// Define the form schema
const patientFormSchema = z.object({
  // Demographics
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select a gender." }),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),

  // Identification
  icn: z
    .string()
    .min(8, { message: "ICN must be at least 8 characters." })
    .max(15, { message: "ICN must be at most 15 characters." })
    .regex(/^[a-zA-Z0-9]+$/, { message: "ICN must contain only letters and numbers." }),
  loginCode: z.string().length(7, { message: "Login code must be 7 digits." }),

  // Contact Information
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal("")),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).optional().or(z.literal("")),
  address: z.string().optional(),

  // Medical Information
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"], {
    required_error: "Please select a blood type.",
  }),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),

  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),

  // Additional Notes
  notes: z.string().optional(),
  insurerId: z.string().optional(),
})

type PatientFormValues = z.infer<typeof patientFormSchema> & {
  insurerId?: string
}

interface PatientFormProps {
  hospitalId: string
  userId: string
  doctorName: string
  existingPatient?: any
}

export default function PatientForm({ hospitalId, userId, doctorName, existingPatient }: PatientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("demographics")
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const router = useRouter()
  const [insurers, setInsurers] = useState<any[]>([])
  const [isLoadingInsurers, setIsLoadingInsurers] = useState(true)
  const [showAddInsurerDialog, setShowAddInsurerDialog] = useState(false)
  const [newInsurerName, setNewInsurerName] = useState("")
  const [newInsurerPhone, setNewInsurerPhone] = useState("")
  const [isAddingInsurer, setIsAddingInsurer] = useState(false)
  const [isCheckingICN, setIsCheckingICN] = useState(false)
  const [icnError, setIcnError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInsurers() {
      setIsLoadingInsurers(true)
      try {
        const { insurers: insurersList } = await getAllInsurers()
        setInsurers(insurersList || [])
      } catch (error) {
        console.error("Error fetching insurers:", error)
      } finally {
        setIsLoadingInsurers(false)
      }
    }

    fetchInsurers()
  }, [])

  // Generate a login code when the form is first loaded (for new patients)
  useEffect(() => {
    if (!existingPatient) {
      generateLoginCode()
    }
  }, [existingPatient])

  async function handleAddInsurer() {
    if (!newInsurerName || !newInsurerPhone) {
      toast({
        title: "Error",
        description: "Insurer name and phone number are required",
        variant: "destructive",
      })
      return
    }

    setIsAddingInsurer(true)

    try {
      const { insurer, error } = await createInsurer({
        name: newInsurerName,
        contact_phone: newInsurerPhone,
      })

      if (error) throw new Error(error)

      setInsurers([...insurers, insurer])
      form.setValue("insurerId", insurer.id)

      setNewInsurerName("")
      setNewInsurerPhone("")
      setShowAddInsurerDialog(false)

      toast({
        title: "Success",
        description: `${insurer.name} has been added as an insurer`,
      })
    } catch (error) {
      console.error("Error adding insurer:", error)
      toast({
        title: "Error",
        description: "Failed to add insurer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingInsurer(false)
    }
  }

  async function generateLoginCode() {
    setIsGeneratingCode(true)
    try {
      const loginCode = await generateUniqueLoginCode()
      form.setValue("loginCode", loginCode)
    } catch (error) {
      console.error("Error generating login code:", error)
      toast({
        title: "Error",
        description: "Failed to generate login code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingCode(false)
    }
  }

  async function checkICNUniqueness(icn: string) {
    if (!validateICN(icn)) {
      setIcnError("ICN must be 8-15 alphanumeric characters")
      return false
    }

    setIsCheckingICN(true)
    setIcnError(null)

    try {
      const supabase = createServerSupabaseClient()

      // Check if ICN already exists
      const { data, error } = await supabase.from("patients").select("id").eq("icn", icn).maybeSingle()

      if (error) throw error

      // If data exists and it's not the current patient, the ICN is not unique
      if (data && (!existingPatient || data.id !== existingPatient.id)) {
        setIcnError("This ICN is already in use")
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking ICN uniqueness:", error)
      setIcnError("Failed to verify ICN uniqueness")
      return false
    } finally {
      setIsCheckingICN(false)
    }
  }

  // Default values for the form
  const defaultValues: Partial<PatientFormValues> = {
    name: existingPatient?.name || "",
    gender: existingPatient?.patient_info?.demographics?.gender || "male",
    dateOfBirth: existingPatient?.patient_info?.demographics?.dateOfBirth
      ? new Date(existingPatient.patient_info.demographics.dateOfBirth)
      : undefined,
    icn: existingPatient?.icn || "",
    loginCode: existingPatient?.login_code || "",
    email: existingPatient?.patient_info?.contact?.email || "",
    phone: existingPatient?.patient_info?.contact?.phone || "",
    address: existingPatient?.patient_info?.contact?.address || "",
    bloodType: existingPatient?.patient_info?.medical?.bloodType || "unknown",
    allergies: existingPatient?.patient_info?.medical?.allergies || "",
    chronicConditions: existingPatient?.patient_info?.medical?.chronicConditions || "",
    emergencyContactName: existingPatient?.patient_info?.emergency?.name || "",
    emergencyContactPhone: existingPatient?.patient_info?.emergency?.phone || "",
    emergencyContactRelation: existingPatient?.patient_info?.emergency?.relation || "",
    notes: existingPatient?.patient_info?.notes || "",
    insurerId: existingPatient?.insurer_id || "",
  }

  // Initialize the form
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
  })

  // Handle form submission
  async function onSubmit(data: PatientFormValues) {
    // Validate ICN uniqueness
    const isICNValid = await checkICNUniqueness(data.icn)
    if (!isICNValid) return

    setIsSubmitting(true)

    try {
      // Prepare patient data
      const patientId = existingPatient?.id || uuidv4()

      const patientData = {
        id: patientId,
        name: data.name,
        hospital_id: hospitalId,
        insurer_id: data.insurerId || null,
        icn: data.icn,
        login_code: data.loginCode,
        patient_info: {
          demographics: {
            gender: data.gender,
            dateOfBirth: format(data.dateOfBirth, "yyyy-MM-dd"),
            age: calculateAge(data.dateOfBirth),
          },
          contact: {
            email: data.email,
            phone: data.phone,
            address: data.address,
          },
          medical: {
            bloodType: data.bloodType,
            allergies: data.allergies,
            chronicConditions: data.chronicConditions,
          },
          emergency: {
            name: data.emergencyContactName,
            phone: data.emergencyContactPhone,
            relation: data.emergencyContactRelation,
          },
          notes: data.notes,
          created_by: userId,
          created_by_name: doctorName,
        },
      }

      // Save patient data
      const { patient, error } = await savePatient(patientData)

      if (error || !patient) {
        throw new Error(error || "Failed to save patient")
      }

      toast({
        title: existingPatient ? "Patient Updated" : "Patient Created",
        description: `${data.name}'s information has been ${existingPatient ? "updated" : "saved"} successfully.`,
      })

      // Redirect to patient page
      router.push(`/patients/${patientId}`)
      router.refresh()
    } catch (error) {
      console.error("Error saving patient:", error)
      toast({
        title: "Error",
        description: "Failed to save patient information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate age from date of birth
  function calculateAge(dateOfBirth: Date): number {
    const today = new Date()
    let age = today.getFullYear() - dateOfBirth.getFullYear()
    const monthDifference = today.getMonth() - dateOfBirth.getMonth()

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--
    }

    return age
  }

  // Handle tab change
  function handleTabChange(value: string) {
    setActiveTab(value)
  }

  // Navigate to next tab
  function goToNextTab() {
    if (activeTab === "demographics") setActiveTab("identification")
    else if (activeTab === "identification") setActiveTab("contact")
    else if (activeTab === "contact") setActiveTab("medical")
    else if (activeTab === "medical") setActiveTab("emergency")
    else if (activeTab === "emergency") setActiveTab("insurance")
    else if (activeTab === "insurance") setActiveTab("notes")
  }

  // Navigate to previous tab
  function goToPreviousTab() {
    if (activeTab === "notes") setActiveTab("insurance")
    else if (activeTab === "insurance") setActiveTab("emergency")
    else if (activeTab === "emergency") setActiveTab("medical")
    else if (activeTab === "medical") setActiveTab("contact")
    else if (activeTab === "contact") setActiveTab("identification")
    else if (activeTab === "identification") setActiveTab("demographics")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="demographics">Demographics</TabsTrigger>
                <TabsTrigger value="identification">ID</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="emergency">Emergency</TabsTrigger>
                <TabsTrigger value="insurance">Insurance</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="demographics" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="male" />
                            </FormControl>
                            <FormLabel className="font-normal">Male</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="female" />
                            </FormControl>
                            <FormLabel className="font-normal">Female</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="other" />
                            </FormControl>
                            <FormLabel className="font-normal">Other</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          className="mt-1"
                          disabled={false}
                          placeholder="YYYY-MM-DD"
                        />

                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="button" onClick={goToNextTab}>
                    Next
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="identification" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="icn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identification Card Number (ICN)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter patient's ICN"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            setIcnError(null)
                          }}
                          onBlur={(e) => {
                            field.onBlur()
                            if (e.target.value) {
                              checkICNUniqueness(e.target.value)
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier from patient's ID card (8-15 alphanumeric characters)
                      </FormDescription>
                      {icnError && <p className="text-sm font-medium text-destructive mt-1">{icnError}</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loginCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Login Code</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="7-digit code" {...field} readOnly className="font-mono" />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={generateLoginCode} disabled={isGeneratingCode}>
                          {isGeneratingCode ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormDescription>
                        This 7-digit code will be used by the patient to access their portal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    Previous
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Next
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormDescription>Patient's email address for communication</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+250 7XX XXX XXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St, Kigali, Rwanda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    Previous
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Next
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="bloodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List any known allergies (medications, food, etc.)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chronicConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chronic Conditions</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List any chronic conditions (diabetes, hypertension, etc.)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    Previous
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Next
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="emergency" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+250 7XX XXX XXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactRelation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship to Patient</FormLabel>
                      <FormControl>
                        <Input placeholder="Spouse, Parent, Child, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    Previous
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Next
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="insurance" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="insurerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Provider</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoadingInsurers}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select insurance provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {insurers.map((insurer) => (
                                <SelectItem key={insurer.id} value={insurer.id}>
                                  {insurer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Dialog open={showAddInsurerDialog} onOpenChange={setShowAddInsurerDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" type="button">
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Add New
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Insurance Provider</DialogTitle>
                              <DialogDescription>Enter the details of the new insurance provider.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="insurerName">Provider Name</Label>
                                <Input
                                  id="insurerName"
                                  value={newInsurerName}
                                  onChange={(e) => setNewInsurerName(e.target.value)}
                                  placeholder="Enter provider name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="insurerPhone">Contact Phone</Label>
                                <Input
                                  id="insurerPhone"
                                  value={newInsurerPhone}
                                  onChange={(e) => setNewInsurerPhone(e.target.value)}
                                  placeholder="Enter contact phone number"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setShowAddInsurerDialog(false)}
                                disabled={isAddingInsurer}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleAddInsurer} disabled={isAddingInsurer}>
                                {isAddingInsurer ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  "Add Provider"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormDescription>
                        Select the patient's insurance provider or add a new one if not listed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    Previous
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Next
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information about the patient"
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    Previous
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="ml-auto">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {existingPatient ? "Update Patient" : "Create Patient"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
