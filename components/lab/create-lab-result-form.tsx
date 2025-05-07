"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Upload, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { createLabResult } from "@/services/lab-service"
import { getPatients } from "@/services/patient-service"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  patient_id: z.string({
    required_error: "Please select a patient",
  }),
  result_type: z.string({
    required_error: "Please select a result type",
  }),
  results: z.any(),
  status: z.string().default("completed"),
})

interface CreateLabResultFormProps {
  userId: string
  hospitalId: string
  request?: any
}

export default function CreateLabResultForm({ userId, hospitalId, request }: CreateLabResultFormProps) {
  const [patients, setPatients] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("details")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: request ? `${request.test_type.charAt(0).toUpperCase() + request.test_type.slice(1)} Test Results` : "",
      patient_id: request?.patient_id || "",
      result_type: request?.test_type || "",
      status: "completed",
      results: getDefaultResults(request?.test_type || ""),
    },
  })

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { patients: patientData } = await getPatients(hospitalId)
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
  }, [hospitalId, toast])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      // Prepare the lab result data
      const labResultData = {
        title: values.title,
        patient_id: values.patient_id,
        hospital_id: hospitalId,
        created_by: userId,
        result_type: values.result_type,
        status: values.status,
        results: values.results,
        request_id: request?.id || null,
      }

      // Create the lab result
      const { result, error } = await createLabResult(labResultData, selectedFiles)

      if (error) {
        throw new Error(error)
      }

      toast({
        title: "Success",
        description: "Lab result created successfully",
      })

      // Redirect to the lab result detail page
      router.push(`/lab/${result.id}`)
    } catch (error) {
      console.error("Error creating lab result:", error)
      toast({
        title: "Error",
        description: "Failed to create lab result. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: File[] = []
    let totalSize = 0
    let hasInvalidFile = false

    // Check each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      totalSize += file.size

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        hasInvalidFile = true
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit.`,
          variant: "destructive",
        })
        continue
      }

      newFiles.push(file)
    }

    // Check total size
    if (totalSize > MAX_FILE_SIZE * 5) {
      toast({
        title: "Total size too large",
        description: "Total file size exceeds 50MB limit.",
        variant: "destructive",
      })
      return
    }

    if (!hasInvalidFile) {
      setSelectedFiles([...selectedFiles, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    setSelectedFiles(newFiles)
  }

  function getDefaultResults(type: string) {
    switch (type) {
      case "blood":
        return {
          panels: [
            {
              name: "Complete Blood Count (CBC)",
              tests: [
                {
                  name: "Hemoglobin",
                  value: "",
                  unit: "g/dL",
                  reference_range: "12.0-16.0",
                  flag: false,
                  description: "Protein in red blood cells that carries oxygen",
                },
                {
                  name: "White Blood Cell Count",
                  value: "",
                  unit: "K/µL",
                  reference_range: "4.5-11.0",
                  flag: false,
                  description: "Cells that fight infection",
                },
                {
                  name: "Platelet Count",
                  value: "",
                  unit: "K/µL",
                  reference_range: "150-450",
                  flag: false,
                  description: "Cells that help blood clot",
                },
              ],
            },
          ],
          comments: "",
        }
      case "urine":
        return {
          physical: {
            color: "",
            appearance: "",
            specific_gravity: "",
            ph: "",
          },
          chemical: {
            glucose: "",
            protein: "",
            ketones: "",
            blood: "",
            nitrite: "",
            leukocyte_esterase: "",
          },
          microscopic: {
            red_blood_cells: "",
            white_blood_cells: "",
            epithelial_cells: "",
            bacteria: "",
            crystals: "",
            casts: "",
          },
          comments: "",
        }
      case "imaging":
        return {
          procedure: "",
          modality: "",
          body_part: "",
          contrast: false,
          findings: "",
          impression: "",
          recommendations: "",
        }
      default:
        return {
          sections: [
            {
              title: "Results",
              content: "",
            },
          ],
          conclusion: "",
        }
    }
  }

  const renderResultsForm = () => {
    const resultType = form.watch("result_type")

    switch (resultType) {
      case "blood":
        return renderBloodTestForm()
      case "urine":
        return renderUrineTestForm()
      case "imaging":
        return renderImagingForm()
      default:
        return renderGenericForm()
    }
  }

  const renderBloodTestForm = () => {
    const results = form.watch("results") || getDefaultResults("blood")

    return (
      <div className="space-y-6">
        {results.panels.map((panel: any, panelIndex: number) => (
          <div key={panelIndex} className="border rounded-md p-4">
            <FormItem>
              <FormLabel>Panel Name</FormLabel>
              <FormControl>
                <Input
                  value={panel.name}
                  onChange={(e) => {
                    const newResults = { ...results }
                    newResults.panels[panelIndex].name = e.target.value
                    form.setValue("results", newResults)
                  }}
                />
              </FormControl>
            </FormItem>

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Tests</h4>
              {panel.tests.map((test: any, testIndex: number) => (
                <div key={testIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 border rounded-md">
                  <div>
                    <FormItem>
                      <FormLabel>Test Name</FormLabel>
                      <FormControl>
                        <Input
                          value={test.name}
                          onChange={(e) => {
                            const newResults = { ...results }
                            newResults.panels[panelIndex].tests[testIndex].name = e.target.value
                            form.setValue("results", newResults)
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  </div>

                  <div>
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            value={test.value}
                            onChange={(e) => {
                              const newResults = { ...results }
                              newResults.panels[panelIndex].tests[testIndex].value = e.target.value
                              form.setValue("results", newResults)
                            }}
                          />
                        </FormControl>
                        <Input
                          value={test.unit}
                          onChange={(e) => {
                            const newResults = { ...results }
                            newResults.panels[panelIndex].tests[testIndex].unit = e.target.value
                            form.setValue("results", newResults)
                          }}
                          className="w-20"
                          placeholder="Unit"
                        />
                      </div>
                    </FormItem>
                  </div>

                  <div>
                    <FormItem>
                      <FormLabel>Reference Range</FormLabel>
                      <FormControl>
                        <Input
                          value={test.reference_range}
                          onChange={(e) => {
                            const newResults = { ...results }
                            newResults.panels[panelIndex].tests[testIndex].reference_range = e.target.value
                            form.setValue("results", newResults)
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  </div>

                  <div>
                    <FormItem>
                      <FormLabel>Flag Abnormal</FormLabel>
                      <FormControl>
                        <Select
                          value={test.flag ? "true" : "false"}
                          onValueChange={(value) => {
                            const newResults = { ...results }
                            newResults.panels[panelIndex].tests[testIndex].flag = value === "true"
                            form.setValue("results", newResults)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Normal</SelectItem>
                            <SelectItem value="true">Abnormal</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  </div>

                  <div className="md:col-span-2">
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          value={test.description}
                          onChange={(e) => {
                            const newResults = { ...results }
                            newResults.panels[panelIndex].tests[testIndex].description = e.target.value
                            form.setValue("results", newResults)
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newResults = { ...results }
                  newResults.panels[panelIndex].tests.push({
                    name: "",
                    value: "",
                    unit: "",
                    reference_range: "",
                    flag: false,
                    description: "",
                  })
                  form.setValue("results", newResults)
                }}
              >
                Add Test
              </Button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const newResults = { ...results }
            newResults.panels.push({
              name: "",
              tests: [
                {
                  name: "",
                  value: "",
                  unit: "",
                  reference_range: "",
                  flag: false,
                  description: "",
                },
              ],
            })
            form.setValue("results", newResults)
          }}
        >
          Add Panel
        </Button>

        <FormItem>
          <FormLabel>Comments</FormLabel>
          <FormControl>
            <Textarea
              value={results.comments}
              onChange={(e) => {
                const newResults = { ...results }
                newResults.comments = e.target.value
                form.setValue("results", newResults)
              }}
              placeholder="Additional comments or interpretations"
              className="min-h-[100px]"
            />
          </FormControl>
        </FormItem>
      </div>
    )
  }

  const renderUrineTestForm = () => {
    const results = form.watch("results") || getDefaultResults("urine")

    return (
      <div className="space-y-6">
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Physical Examination</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results.physical).map(([key, value]) => (
              <FormItem key={key}>
                <FormLabel className="capitalize">{key.replace("_", " ")}</FormLabel>
                <FormControl>
                  <Input
                    value={value as string}
                    onChange={(e) => {
                      const newResults = { ...results }
                      newResults.physical[key] = e.target.value
                      form.setValue("results", newResults)
                    }}
                  />
                </FormControl>
              </FormItem>
            ))}
          </div>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Chemical Examination</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results.chemical).map(([key, value]) => (
              <FormItem key={key}>
                <FormLabel className="capitalize">{key.replace("_", " ")}</FormLabel>
                <FormControl>
                  <Input
                    value={value as string}
                    onChange={(e) => {
                      const newResults = { ...results }
                      newResults.chemical[key] = e.target.value
                      form.setValue("results", newResults)
                    }}
                  />
                </FormControl>
              </FormItem>
            ))}
          </div>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Microscopic Examination</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results.microscopic).map(([key, value]) => (
              <FormItem key={key}>
                <FormLabel className="capitalize">{key.replace("_", " ")}</FormLabel>
                <FormControl>
                  <Input
                    value={value as string}
                    onChange={(e) => {
                      const newResults = { ...results }
                      newResults.microscopic[key] = e.target.value
                      form.setValue("results", newResults)
                    }}
                  />
                </FormControl>
              </FormItem>
            ))}
          </div>
        </div>

        <FormItem>
          <FormLabel>Comments</FormLabel>
          <FormControl>
            <Textarea
              value={results.comments}
              onChange={(e) => {
                const newResults = { ...results }
                newResults.comments = e.target.value
                form.setValue("results", newResults)
              }}
              placeholder="Additional comments or interpretations"
              className="min-h-[100px]"
            />
          </FormControl>
        </FormItem>
      </div>
    )
  }

  const renderImagingForm = () => {
    const results = form.watch("results") || getDefaultResults("imaging")

    return (
      <div className="space-y-6">
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Imaging Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Procedure</FormLabel>
              <FormControl>
                <Input
                  value={results.procedure}
                  onChange={(e) => {
                    const newResults = { ...results }
                    newResults.procedure = e.target.value
                    form.setValue("results", newResults)
                  }}
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Modality</FormLabel>
              <FormControl>
                <Select
                  value={results.modality}
                  onValueChange={(value) => {
                    const newResults = { ...results }
                    newResults.modality = value
                    form.setValue("results", newResults)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select modality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="X-Ray">X-Ray</SelectItem>
                    <SelectItem value="CT Scan">CT Scan</SelectItem>
                    <SelectItem value="MRI">MRI</SelectItem>
                    <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                    <SelectItem value="PET Scan">PET Scan</SelectItem>
                    <SelectItem value="Mammography">Mammography</SelectItem>
                    <SelectItem value="Fluoroscopy">Fluoroscopy</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Body Part</FormLabel>
              <FormControl>
                <Input
                  value={results.body_part}
                  onChange={(e) => {
                    const newResults = { ...results }
                    newResults.body_part = e.target.value
                    form.setValue("results", newResults)
                  }}
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Contrast Used</FormLabel>
              <FormControl>
                <Select
                  value={results.contrast ? "true" : "false"}
                  onValueChange={(value) => {
                    const newResults = { ...results }
                    newResults.contrast = value === "true"
                    form.setValue("results", newResults)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          </div>
        </div>

        <FormItem>
          <FormLabel>Findings</FormLabel>
          <FormControl>
            <Textarea
              value={results.findings}
              onChange={(e) => {
                const newResults = { ...results }
                newResults.findings = e.target.value
                form.setValue("results", newResults)
              }}
              placeholder="Detailed description of findings"
              className="min-h-[150px]"
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Impression</FormLabel>
          <FormControl>
            <Textarea
              value={results.impression}
              onChange={(e) => {
                const newResults = { ...results }
                newResults.impression = e.target.value
                form.setValue("results", newResults)
              }}
              placeholder="Clinical impression based on findings"
              className="min-h-[100px]"
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Recommendations</FormLabel>
          <FormControl>
            <Textarea
              value={results.recommendations}
              onChange={(e) => {
                const newResults = { ...results }
                newResults.recommendations = e.target.value
                form.setValue("results", newResults)
              }}
              placeholder="Recommendations for follow-up or additional tests"
              className="min-h-[100px]"
            />
          </FormControl>
        </FormItem>
      </div>
    )
  }

  const renderGenericForm = () => {
    const results = form.watch("results") || getDefaultResults("")

    return (
      <div className="space-y-6">
        {results.sections.map((section: any, index: number) => (
          <div key={index} className="border rounded-md p-4">
            <FormItem>
              <FormLabel>Section Title</FormLabel>
              <FormControl>
                <Input
                  value={section.title}
                  onChange={(e) => {
                    const newResults = { ...results }
                    newResults.sections[index].title = e.target.value
                    form.setValue("results", newResults)
                  }}
                />
              </FormControl>
            </FormItem>

            <FormItem className="mt-4">
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  value={section.content}
                  onChange={(e) => {
                    const newResults = { ...results }
                    newResults.sections[index].content = e.target.value
                    form.setValue("results", newResults)
                  }}
                  className="min-h-[150px]"
                />
              </FormControl>
            </FormItem>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const newResults = { ...results }
            newResults.sections.push({
              title: "",
              content: "",
            })
            form.setValue("results", newResults)
          }}
        >
          Add Section
        </Button>

        <FormItem>
          <FormLabel>Conclusion</FormLabel>
          <FormControl>
            <Textarea
              value={results.conclusion}
              onChange={(e) => {
                const newResults = { ...results }
                newResults.conclusion = e.target.value
                form.setValue("results", newResults)
              }}
              placeholder="Overall conclusion or summary"
              className="min-h-[100px]"
            />
          </FormControl>
        </FormItem>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.push("/lab")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Lab Result</h1>
          <p className="text-sm text-muted-foreground">
            {request ? "Create a lab result for the requested test" : "Create a new laboratory result"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Basic Details</TabsTrigger>
              <TabsTrigger value="results">Result Data</TabsTrigger>
              <TabsTrigger value="files">Files & Attachments</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Enter the basic details for this lab result</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Lab result title" {...field} />
                        </FormControl>
                        <FormDescription>A descriptive title for this lab result</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patient_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={!!request}
                        >
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
                        <FormDescription>The patient this lab result is for</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="result_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Result Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            // Reset results when type changes
                            form.setValue("results", getDefaultResults(value))
                          }}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={!!request}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select result type" />
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
                        <FormDescription>The type of laboratory result</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>The current status of this lab result</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => router.push("/lab")}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("results")}>
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Result Data</CardTitle>
                  <CardDescription>Enter the detailed results for this lab test</CardDescription>
                </CardHeader>
                <CardContent>{renderResultsForm()}</CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("details")}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("files")}>
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Files & Attachments</CardTitle>
                  <CardDescription>Upload files related to this lab result (optional)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOCX, JPG, PNG (MAX. 10MB each)</p>
                        </div>
                        <input id="file-upload" type="file" className="hidden" multiple onChange={handleFileChange} />
                      </label>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Selected Files</h3>
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("results")}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Lab Result"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  )
}
