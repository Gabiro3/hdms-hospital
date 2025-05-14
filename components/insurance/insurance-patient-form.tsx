"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, PlusCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { savePatient } from "@/services/patient-service"
import { createInsurancePolicy } from "@/services/insurance-service"
import { toast } from "@/components/ui/use-toast"
import { DatePicker } from "../ui/date-picker"

// Define the form schema
const patientFormSchema = z.object({
  // Demographics
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select a gender." }),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),

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

  // Insurance Information
  insurerId: z.string({ required_error: "Please select an insurance provider." }),
  policyNumber: z.string().min(5, { message: "Policy number must be at least 5 characters." }),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date().optional(),
  coverageType: z.string().min(2, { message: "Coverage type is required." }),
  deductible: z.number().min(0, { message: "Deductible must be a positive number." }).optional(),
  copay: z.number().min(0, { message: "Co-pay must be a positive number." }).optional(),
  coverageLimit: z.number().min(0, { message: "Coverage limit must be a positive number." }).optional(),

  // Additional Notes
  notes: z.string().optional(),
})

type PatientFormValues = z.infer<typeof patientFormSchema> & {
  coveredServices: string[]
  exclusions: string[]
}

interface InsurancePatientFormProps {
  insurers: any[]
  userId: string
  hospitalId: string
  existingPatient?: any
}

export default function InsurancePatientForm({
  insurers,
  userId,
  hospitalId,
  existingPatient,
}: InsurancePatientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("demographics")
  const [coveredServices, setCoveredServices] = useState<string[]>([])
  const [newService, setNewService] = useState("")
  const [exclusions, setExclusions] = useState<string[]>([])
  const [newExclusion, setNewExclusion] = useState("")
  const router = useRouter()

  // Default values for the form
  const defaultValues: Partial<PatientFormValues> = {
    name: existingPatient?.name || "",
    gender: existingPatient?.patient_info?.demographics?.gender || "male",
    dateOfBirth: existingPatient?.patient_info?.demographics?.dateOfBirth
      ? new Date(existingPatient.patient_info.demographics.dateOfBirth)
      : undefined,
    email: existingPatient?.patient_info?.contact?.email || "",
    phone: existingPatient?.patient_info?.contact?.phone || "",
    address: existingPatient?.patient_info?.contact?.address || "",
    bloodType: existingPatient?.patient_info?.medical?.bloodType || "unknown",
    allergies: existingPatient?.patient_info?.medical?.allergies || "",
    chronicConditions: existingPatient?.patient_info?.medical?.chronicConditions || "",
    insurerId: existingPatient?.insurer_id || "",
    policyNumber: "",
    startDate: new Date(),
    coverageType: "comprehensive",
    notes: "",
    coveredServices: [],
    exclusions: [],
  }

  // Initialize the form
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
  })

  // Handle form submission
  async function onSubmit(data: PatientFormValues) {
    setIsSubmitting(true)

    try {
      // Prepare patient data
      const patientId = existingPatient?.id || uuidv4()

      const patientData = {
        id: patientId,
        name: data.name,
        hospital_id: hospitalId,
        insurer_id: data.insurerId,
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
          notes: data.notes,
          created_by: userId,
        },
      }

      // Save patient data
      const { patient, error } = await savePatient(patientData)

      if (error || !patient) {
        throw new Error(error || "Failed to save patient")
      }

      // Create insurance policy
      const policyData = {
        patient_id: patientId,
        insurer_id: data.insurerId,
        policy_number: data.policyNumber,
        start_date: format(data.startDate, "yyyy-MM-dd"),
        end_date: data.endDate ? format(data.endDate, "yyyy-MM-dd") : null,
        coverage_details: {
          coverageType: data.coverageType,
          deductible: data.deductible,
          copay: data.copay,
          coverageLimit: data.coverageLimit,
          coveredServices: coveredServices,
          exclusions: exclusions,
          notes: data.notes,
        },
        status: "active",
      }

      const { policy, error: policyError } = await createInsurancePolicy(policyData)

      if (policyError) {
        throw new Error(policyError)
      }

      toast({
        title: "Patient Created",
        description: `${data.name}'s information and insurance policy have been saved successfully.`,
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
    if (activeTab === "demographics") setActiveTab("contact")
    else if (activeTab === "contact") setActiveTab("medical")
    else if (activeTab === "medical") setActiveTab("insurance")
    else if (activeTab === "insurance") setActiveTab("coverage")
    else if (activeTab === "coverage") setActiveTab("notes")
  }

  // Navigate to previous tab
  function goToPreviousTab() {
    if (activeTab === "notes") setActiveTab("coverage")
    else if (activeTab === "coverage") setActiveTab("insurance")
    else if (activeTab === "insurance") setActiveTab("medical")
    else if (activeTab === "medical") setActiveTab("contact")
    else if (activeTab === "contact") setActiveTab("demographics")
  }

  // Add covered service
  function addCoveredService() {
    if (newService.trim() && !coveredServices.includes(newService.trim())) {
      setCoveredServices([...coveredServices, newService.trim()])
      setNewService("")
    }
  }

  // Remove covered service
  function removeCoveredService(service: string) {
    setCoveredServices(coveredServices.filter((s) => s !== service))
  }

  // Add exclusion
  function addExclusion() {
    if (newExclusion.trim() && !exclusions.includes(newExclusion.trim())) {
      setExclusions([...exclusions, newExclusion.trim()])
      setNewExclusion("")
    }
  }

  // Remove exclusion
  function removeExclusion(exclusion: string) {
    setExclusions(exclusions.filter((e) => e !== exclusion))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="demographics">Demographics</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="insurance">Insurance</TabsTrigger>
                <TabsTrigger value="coverage">Coverage</TabsTrigger>
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

              <TabsContent value="insurance" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="insurerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select insurance provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {insurers.map((insurer) => (
                            <SelectItem key={insurer.id} value={insurer.id}>
                              {insurer.name}
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
                  name="policyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. POL-12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < (form.getValues("startDate") || new Date())}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>Leave blank for lifetime or ongoing coverage</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coverageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coverage Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select coverage type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="comprehensive">Comprehensive</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="catastrophic">Catastrophic</SelectItem>
                          <SelectItem value="specialized">Specialized</SelectItem>
                        </SelectContent>
                      </Select>
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

              <TabsContent value="coverage" className="space-y-4 pt-4">
                <div className="grid gap-4 grid-cols-3">
                  <FormField
                    control={form.control}
                    name="deductible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deductible ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="copay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Co-pay ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coverageLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coverage Limit ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Covered Services</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a covered service"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addCoveredService()
                        }
                      }}
                    />
                    <Button type="button" onClick={addCoveredService}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {coveredServices.map((service, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {service}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeCoveredService(service)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </Badge>
                    ))}
                    {coveredServices.length === 0 && (
                      <p className="text-sm text-muted-foreground">No covered services added yet.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Exclusions</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an exclusion"
                      value={newExclusion}
                      onChange={(e) => setNewExclusion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addExclusion()
                        }
                      }}
                    />
                    <Button type="button" onClick={addExclusion}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {exclusions.map((exclusion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200"
                      >
                        {exclusion}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeExclusion(exclusion)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </Badge>
                    ))}
                    {exclusions.length === 0 && (
                      <p className="text-sm text-muted-foreground">No exclusions added yet.</p>
                    )}
                  </div>
                </div>

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
                          placeholder="Any additional information about the patient or their insurance coverage"
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
                    Create Patient
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
