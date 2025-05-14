"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, FileText, AlertCircle } from "lucide-react"
import { getPatientsByInsurer } from "@/services/insurance-service"
import { format, isValid } from "date-fns"

interface InsurancePatientsTableProps {
  insurerId: string
  searchQuery: string
}

export default function InsurancePatientsTable({ insurerId, searchQuery }: InsurancePatientsTableProps) {
  const [patients, setPatients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchPatients() {
      if (!insurerId) return

      setIsLoading(true)
      try {
        const { patients: patientsList, error } = await getPatientsByInsurer(insurerId)
        if (!error) {
          setPatients(patientsList || [])
        }
      } catch (error) {
        console.error("Error fetching patients:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [insurerId])

  // Filter patients based on search query
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.insurance_policies[0]?.policy_number || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (filteredPatients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No Patients Found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {searchQuery
            ? "No patients match your search criteria. Try a different search term."
            : "This insurance provider doesn't have any patients yet."}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Policy Number</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Coverage Period</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredPatients.map((patient) => {
          const policy = patient.insurance_policies[0] || null

          return (
            <TableRow key={patient.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">{getInitials(patient.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {patient.id.substring(0, 8)}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{policy?.policy_number || "N/A"}</TableCell>
              <TableCell>
                {policy ? (
                  <Badge
                    variant="outline"
                    className={
                      policy.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    No Policy
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {policy ? (
                  <div className="text-sm">
                    <p>
                      {isValid(new Date(policy.start_date))
                        ? format(new Date(policy.start_date), "MMM d, yyyy")
                        : "Invalid date"}
                      {policy.end_date && isValid(new Date(policy.end_date))
                        ? ` - ${format(new Date(policy.end_date), "MMM d, yyyy")}`
                        : ""}
                    </p>
                  </div>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/patients/${patient.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View patient</span>
                    </Link>
                  </Button>
                  {policy && (
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/insurance/policies/${policy.id}`}>
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">View policy</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
