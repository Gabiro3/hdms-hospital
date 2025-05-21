"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Send, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getHospitals } from "@/services/hospital-service"
import { createRecordRequest } from "@/services/patient-records-service"

interface PatientRecordsRequestProps {
  patientId: string
  patientName: string
  hospitalId: string
  userId: string
}

export default function PatientRecordsRequest({
  patientId,
  patientName,
  hospitalId,
  userId,
}: PatientRecordsRequestProps) {
  const [hospitals, setHospitals] = useState<any[]>([])
  const [selectedHospital, setSelectedHospital] = useState<string>("")
  const [recordType, setRecordType] = useState<string>("all")
  const [isUrgent, setIsUrgent] = useState<boolean>(false)
  const [reason, setReason] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoading(true)
      try {
        const { hospitals: hospitalsList, error } = await getHospitals()

        if (error) throw new Error(error)

        // Filter out current hospital
        const filteredHospitals = (hospitalsList ?? []).filter((h: any) => h.id !== hospitalId)
        setHospitals(filteredHospitals)
      } catch (error) {
        console.error("Error fetching hospitals:", error)
        toast({
          title: "Error",
          description: "Failed to load hospitals. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHospitals()
  }, [hospitalId, toast])

  const handleSubmit = async () => {
    if (!selectedHospital) {
      toast({
        title: "Error",
        description: "Please select a hospital to request records from.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { request, error } = await createRecordRequest({
        patient_id: patientId,
        patient_name: patientName,
        requesting_hospital_id: hospitalId,
        requested_hospital_id: selectedHospital,
        requesting_user_id: userId,
        record_type: recordType,
        reason: reason,
        is_urgent: isUrgent,
        status: "pending",
        created_at: new Date().toISOString(),
      })

      if (error) throw new Error(error)

      toast({
        title: "Request Sent",
        description: "Your request for patient records has been sent successfully.",
      })

      // Reset form
      setSelectedHospital("")
      setRecordType("all")
      setIsUrgent(false)
      setReason("")
    } catch (error) {
      console.error("Error submitting record request:", error)
      toast({
        title: "Error",
        description: "Failed to submit record request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Find selected hospital details
  const selectedHospitalDetails = hospitals.find((h) => h.id === selectedHospital)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Patient Records</CardTitle>
        <CardDescription>
          Request medical records for this patient from other hospitals where they have received care
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No other hospitals available for record requests.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="hospital">Select Hospital</Label>
              <select
                id="hospital"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
              >
                <option value="">Select a hospital</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Record Type</Label>
              <RadioGroup value={recordType} onValueChange={setRecordType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visits" id="visits" />
                  <Label htmlFor="visits" className="font-normal">
                    Visits
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lab_results" id="lab_results" />
                  <Label htmlFor="lab_results" className="font-normal">
                    Lab Tests
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal">
                    All Records
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Request</Label>
              <Input
                id="reason"
                placeholder="Enter reason for requesting records"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="urgent" checked={isUrgent} onCheckedChange={(checked) => setIsUrgent(!!checked)} />
              <label
                htmlFor="urgent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                This is an urgent request
              </label>
            </div>

            {selectedHospitalDetails && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Emergency Contact</p>
                    <p className="text-sm text-blue-700">
                      {selectedHospitalDetails.emergency_phone || selectedHospitalDetails.phone || "Not available"}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      For urgent cases, you can call this number to expedite the records request process.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting || isLoading || !selectedHospital}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Send Request
        </Button>
      </CardFooter>
    </Card>
  )
}
