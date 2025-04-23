"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PatientsListProps {
  hospitalId: string
}

interface Patient {
  id: string
  name: string
  created_at: string
  diagnoses_count: number
  last_diagnosis_date: string | null
}

export default function PatientsList({ hospitalId }: PatientsListProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true)
      try {
        // First, get all unique patient IDs from diagnoses for this hospital
        const { data: diagnosesData, error: diagnosesError } = await supabase
          .from("diagnoses")
          .select("patient_id, patient_metadata, created_at")
          .eq("hospital_id", hospitalId)
          .order("created_at", { ascending: false })

        if (diagnosesError) throw diagnosesError

        // Process the data to get unique patients with their latest diagnosis
        const patientMap = new Map<string, any>()

        diagnosesData?.forEach((diagnosis) => {
          const patientId = diagnosis.patient_id
          const metadata = diagnosis.patient_metadata || {}
          const name = metadata.name || patientId

          if (
            !patientMap.has(patientId) ||
            new Date(diagnosis.created_at) > new Date(patientMap.get(patientId).last_diagnosis_date)
          ) {
            patientMap.set(patientId, {
              id: patientId,
              name,
              created_at: diagnosis.created_at,
              diagnoses_count: patientMap.has(patientId) ? patientMap.get(patientId).diagnoses_count : 0,
              last_diagnosis_date: diagnosis.created_at,
            })
          }

          // Increment diagnoses count
          if (patientMap.has(patientId)) {
            const patient = patientMap.get(patientId)
            patient.diagnoses_count += 1
            patientMap.set(patientId, patient)
          }
        })

        // Convert map to array and sort by last diagnosis date
        const patientsArray = Array.from(patientMap.values()).sort(
          (a, b) => new Date(b.last_diagnosis_date).getTime() - new Date(a.last_diagnosis_date).getTime(),
        )

        setPatients(patientsArray)
        setTotal(patientsArray.length)
        setTotalPages(Math.ceil(patientsArray.length / limit))
      } catch (error) {
        console.error("Error fetching patients:", error)
      } finally {
        setLoading(false)
      }
    }

    if (hospitalId) {
      fetchPatients()
    }
  }, [hospitalId, supabase, limit])

  // Filter patients based on search
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Paginate the filtered patients
  const paginatedPatients = filteredPatients.slice((page - 1) * limit, page * limit)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search patients..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1) // Reset to first page when searching
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg border bg-white"></div>
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No patients found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery
              ? "We couldn't find any patients matching your search criteria."
              : "There are no patients in the system yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Diagnoses</TableHead>
                  <TableHead>Last Diagnosis</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.id}</TableCell>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {patient.diagnoses_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {patient.last_diagnosis_date
                        ? format(new Date(patient.last_diagnosis_date), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link href={`/patients/${patient.id}`} className="flex w-full">
                              View details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredPatients.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
              {Math.min(page * limit, filteredPatients.length)} of {filteredPatients.length} patients
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages || totalPages === 0}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
