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
  patient_info: any
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
        // Use raw SQL via Supabase's .rpc() function to handle array containment
    const { data: patientsData, error } = await supabase
      .rpc("fetch_patients_with_hospital_access", { input_hospital_id: hospitalId })
  
        if (error) throw error
  
        const formattedPatients = patientsData.map((p: any) => ({
          id: p.id,
          patient_info: p.patient_info,
          name: p.name,
          created_at: p.created_at,
          diagnoses_count: 0, // You'll need another query if you want this count
          last_diagnosis_date: null // Or join with diagnoses if needed
        }))
  
        setPatients(formattedPatients)
        setTotal(formattedPatients.length)
        setTotalPages(Math.ceil(formattedPatients.length / limit))
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
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{`${patient.id.slice(0, 4)}...${patient.id.slice(-4)}`}</TableCell>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {patient.patient_info.contact['phone']}
                      </Badge>
                    </TableCell>
                    <TableCell>
                    {patient.patient_info.created_by_name || 'Unknown'}
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
