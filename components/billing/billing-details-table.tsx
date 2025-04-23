"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { Search, Filter, ChevronDown } from "lucide-react"

interface BillingDetailsTableProps {
  diagnoses: any[]
  formatCurrency: (amount: number) => string
}

export default function BillingDetailsTable({ diagnoses, formatCurrency }: BillingDetailsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  // Get unique diagnosis types
  const diagnosisTypes = Array.from(new Set(diagnoses.map((d) => d.diagnosisType)))

  // Filter diagnoses based on search and type filter
  const filteredDiagnoses = diagnoses.filter((diagnosis) => {
    const matchesSearch =
      diagnosis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diagnosis.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (diagnosis.users?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = !typeFilter || diagnosis.diagnosisType === typeFilter

    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search diagnoses..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" />
              {typeFilter || "All Types"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTypeFilter(null)}>All Types</DropdownMenuItem>
            {diagnosisTypes.map((type) => (
              <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Diagnosis Title</TableHead>
              <TableHead>Patient Ref</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDiagnoses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No diagnoses found.
                </TableCell>
              </TableRow>
            ) : (
              filteredDiagnoses.map((diagnosis) => (
                <TableRow key={diagnosis.id}>
                  <TableCell>{format(new Date(diagnosis.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-medium">{diagnosis.title}</TableCell>
                  <TableCell>{diagnosis.patient_id}</TableCell>
                  <TableCell>{diagnosis.diagnosisType}</TableCell>
                  <TableCell>{diagnosis.users?.full_name || "Unknown"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(diagnosis.cost)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
