"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Search, UserPlus, LinkIcon, AlertCircle } from "lucide-react"
import { searchPatientByICN } from "@/services/patient-service"
import { validateICN } from "@/lib/utils/security-utils"
import { useToast } from "@/hooks/use-toast"

interface PatientSearchProps {
  hospitalId: string
  onPatientFound?: (patient: any) => void
  onContinueWithNew?: () => void
}

export default function PatientSearch({ hospitalId, onPatientFound, onContinueWithNew }: PatientSearchProps) {
  const [icn, setIcn] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleSearch = async () => {
    // Validate ICN format
    if (!validateICN(icn)) {
      setError("Please enter a valid 16-digit ICN")
      return
    }

    setIsSearching(true)
    setError(null)
    setSearchResult(null)

    try {
      const { patient, error } = await searchPatientByICN(icn)

      if (error) {
        throw new Error(error)
      }

      setSearchResult(patient)

      if (patient && onPatientFound) {
        onPatientFound(patient)
      }
    } catch (err) {
      setError("No patient found with this ICN")
    } finally {
      setIsSearching(false)
    }
  }

  const handleLinkPatient = async () => {
    if (!searchResult) return

    try {
      const response = await fetch(`/api/patients/${searchResult.id}/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hospitalId }),
      })

      if (!response.ok) {
        throw new Error("Failed to link patient")
      }

      toast({
        title: "Patient Linked",
        description: `${searchResult.name} has been linked to your hospital.`,
      })

      // Redirect to patient page
      router.push(`/patients/${searchResult.id}`)
      router.refresh()
    } catch (err) {
      console.error("Error linking patient:", err)
      toast({
        title: "Error",
        description: "Failed to link patient to your hospital. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleContinueWithNew = () => {
    if (onContinueWithNew) {
      onContinueWithNew()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
          <CardDescription>
            Search for an existing patient by their Identity Card Number (ICN) before creating a new record
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Enter 16-digit ICN"
                className="pl-9"
                value={icn}
                onChange={(e) => setIcn(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Search
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {searchResult && (
            <div className="mt-4">
              <Alert className="bg-green-50 border-green-200">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <AlertTitle className="text-green-800 mr-2">Patient Found</AlertTitle>
                    {searchResult.accessed_hospitals?.includes(hospitalId) && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Already in your hospital
                      </span>
                    )}
                  </div>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-green-800">{searchResult.name}</p>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>ICN: {searchResult.icn}</p>
                        {searchResult.patient_info?.demographics?.dateOfBirth && (
                          <p>Date of Birth: {searchResult.patient_info.demographics.dateOfBirth}</p>
                        )}
                        {searchResult.patient_info?.demographics?.gender && (
                          <p>Gender: {searchResult.patient_info.demographics.gender}</p>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </div>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleContinueWithNew}>
            <UserPlus className="h-4 w-4 mr-2" />
            Continue with New Patient
          </Button>

          {searchResult && !searchResult.accessed_hospitals?.includes(hospitalId) && (
            <Button onClick={handleLinkPatient}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Link Existing Patient
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
