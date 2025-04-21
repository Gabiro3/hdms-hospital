"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Plus, Search } from "lucide-react"
import { format } from "date-fns"

interface DiagnosesListProps {
  hospitalId: string
}

interface Diagnosis {
  id: string
  title: string
  created_at: string
  patient_id: string
  users: {
    full_name: string
  }
  image_links: string[] | null
}

export default function DiagnosesList({ hospitalId }: DiagnosesListProps) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchDiagnoses = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("diagnoses")
          .select(`
            id,
            title,
            created_at,
            patient_id,
            image_links,
            users (
              full_name
            )
          `)
          .eq("hospital_id", hospitalId)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setDiagnoses(data || [])
      } catch (error) {
        console.error("Error fetching diagnoses:", error)
      } finally {
        setLoading(false)
      }
    }

    if (hospitalId) {
      fetchDiagnoses()
    }
  }, [hospitalId, supabase])

  const filteredDiagnoses = diagnoses.filter(
    (diagnosis) =>
      diagnosis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diagnosis.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diagnosis.users?.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search diagnoses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Link href="/diagnoses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Diagnosis
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Patient ID</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Images</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredDiagnoses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No diagnoses found
                </TableCell>
              </TableRow>
            ) : (
              filteredDiagnoses.map((diagnosis) => (
                <TableRow key={diagnosis.id}>
                  <TableCell className="font-medium">{diagnosis.title}</TableCell>
                  <TableCell>{diagnosis.patient_id}</TableCell>
                  <TableCell>{diagnosis.users?.full_name}</TableCell>
                  <TableCell>{format(new Date(diagnosis.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>{diagnosis.image_links ? diagnosis.image_links.length : 0}</TableCell>
                  <TableCell>
                    <Link href={`/diagnoses/${diagnosis.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
