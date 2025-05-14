"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface InsuranceClaimsTableProps {
  insurerId: string
  searchQuery: string
}

export default function InsuranceClaimsTable({ insurerId, searchQuery }: InsuranceClaimsTableProps) {
  const [claims, setClaims] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchClaims() {
      if (!insurerId) return

      setIsLoading(true)
      try {
        // In a real implementation, we would fetch all claims for this insurer
        // For now, we'll just show a placeholder
        setClaims([
          {
            id: "claim1",
            policy_id: "policy1",
            claim_amount: 1250.0,
            approved_amount: 1000.0,
            status: "approved",
            submitted_date: "2023-05-01T10:00:00Z",
            processed_date: "2023-05-05T14:30:00Z",
            insurance_policies: {
              policy_number: "POL-12345",
              patients: {
                id: "patient1",
                name: "John Doe",
              },
            },
          },
          {
            id: "claim2",
            policy_id: "policy2",
            claim_amount: 3500.0,
            approved_amount: null,
            status: "pending",
            submitted_date: "2023-05-10T09:15:00Z",
            processed_date: null,
            insurance_policies: {
              policy_number: "POL-23456",
              patients: {
                id: "patient2",
                name: "Jane Smith",
              },
            },
          },
          {
            id: "claim3",
            policy_id: "policy3",
            claim_amount: 750.0,
            approved_amount: 0,
            status: "rejected",
            submitted_date: "2023-04-20T11:30:00Z",
            processed_date: "2023-04-25T16:45:00Z",
            insurance_policies: {
              policy_number: "POL-34567",
              patients: {
                id: "patient3",
                name: "Robert Johnson",
              },
            },
          },
        ])
      } catch (error) {
        console.error("Error fetching claims:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClaims()
  }, [insurerId])

  // Filter claims based on search query
  const filteredClaims = claims.filter(
    (claim) =>
      claim.insurance_policies.patients.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.insurance_policies.policy_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (filteredClaims.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No Claims Found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {searchQuery
            ? "No claims match your search criteria. Try a different search term."
            : "There are no claims for this insurance provider yet."}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Claim ID</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Policy Number</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredClaims.map((claim) => (
          <TableRow key={claim.id}>
            <TableCell className="font-medium">#{claim.id.substring(0, 8)}</TableCell>
            <TableCell>{claim.insurance_policies.patients.name}</TableCell>
            <TableCell>{claim.insurance_policies.policy_number}</TableCell>
            <TableCell>${claim.claim_amount.toLocaleString()}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  claim.status === "approved"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : claim.status === "rejected"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                }
              >
                {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>{format(new Date(claim.submitted_date), "MMM d, yyyy")}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/insurance/claims/${claim.id}`}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View claim</span>
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
