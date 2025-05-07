"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Search, Share2, Trash2, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { getDoctors, shareLabResult, removeLabResultShare } from "@/services/lab-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LabResultSharingProps {
  result: any
  existingShares: any[]
  userId: string
}

export default function LabResultSharing({ result, existingShares, userId }: LabResultSharingProps) {
  const [doctors, setDoctors] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shareToDelete, setShareToDelete] = useState<string | null>(null)
  const [shares, setShares] = useState(existingShares)
  const router = useRouter()

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { doctors: doctorsData, error } = await getDoctors(result.hospital_id, userId)

        if (error) {
          throw new Error(error)
        }

        if (doctorsData) {
          // Filter out doctors who already have shares
          const existingShareUserIds = shares.map((share) => share.shared_with)
          const filteredDoctors = doctorsData.filter((doctor) => !existingShareUserIds.includes(doctor.id))
          setDoctors(filteredDoctors)
        }
      } catch (error) {
        console.error("Error fetching doctors:", error)
        toast({
          title: "Error",
          description: "Failed to load doctors. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchDoctors()
  }, [result.hospital_id, userId, shares, toast])

  const handleShare = async () => {
    if (selectedDoctors.length === 0) {
      toast({
        title: "No doctors selected",
        description: "Please select at least one doctor to share with.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Share with each selected doctor
      for (const doctorId of selectedDoctors) {
        const { share, error } = await shareLabResult(result.id, userId, doctorId)

        if (error) {
          throw new Error(error)
        }

        if (share) {
          // Find the doctor info
          const doctor = doctors.find((d) => d.id === doctorId)

          // Add the new share to the list
          setShares((prev) => [
            ...prev,
            {
              ...share,
              shared_with_user: doctor,
            },
          ])
        }
      }

      // Clear selection
      setSelectedDoctors([])

      toast({
        title: "Success",
        description: `Lab result shared with ${selectedDoctors.length} doctor(s).`,
      })

      // Update the doctors list
      const updatedDoctors = doctors.filter((doctor) => !selectedDoctors.includes(doctor.id))
      setDoctors(updatedDoctors)
    } catch (error) {
      console.error("Error sharing lab result:", error)
      toast({
        title: "Error",
        description: "Failed to share lab result. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveShare = async () => {
    if (!shareToDelete) return

    try {
      const { error } = await removeLabResultShare(shareToDelete)

      if (error) {
        throw new Error(error)
      }

      // Remove the share from the list
      const removedShare = shares.find((share) => share.id === shareToDelete)
      setShares((prev) => prev.filter((share) => share.id !== shareToDelete))

      // Add the doctor back to the doctors list
      if (removedShare && removedShare.shared_with_user) {
        setDoctors((prev) => [...prev, removedShare.shared_with_user])
      }

      toast({
        title: "Success",
        description: "Share removed successfully.",
      })
    } catch (error) {
      console.error("Error removing share:", error)
      toast({
        title: "Error",
        description: "Failed to remove share. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setShareToDelete(null)
    }
  }

  const filteredDoctors = doctors.filter(
    (doctor) =>
      searchTerm === "" ||
      doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.expertise && doctor.expertise.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push(`/lab/${result.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Share Lab Result</h1>
            <p className="text-sm text-muted-foreground">Share "{result.title}" with other doctors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Doctors</CardTitle>
              <CardDescription>Choose doctors to share this lab result with</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search doctors..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                  {filteredDoctors.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchTerm ? "No doctors match your search" : "No doctors available to share with"}
                    </div>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <div key={doctor.id} className="flex items-center p-3">
                        <Checkbox
                          id={`doctor-${doctor.id}`}
                          checked={selectedDoctors.includes(doctor.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDoctors([...selectedDoctors, doctor.id])
                            } else {
                              setSelectedDoctors(selectedDoctors.filter((id) => id !== doctor.id))
                            }
                          }}
                        />
                        <label htmlFor={`doctor-${doctor.id}`} className="flex flex-col ml-3 text-sm cursor-pointer">
                          <span className="font-medium">{doctor.full_name}</span>
                          <span className="text-muted-foreground">{doctor.email}</span>
                          {doctor.expertise && (
                            <span className="text-xs text-muted-foreground">{doctor.expertise}</span>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleShare} disabled={isLoading || selectedDoctors.length === 0}>
                <Share2 className="mr-2 h-4 w-4" />
                {isLoading ? "Sharing..." : "Share with Selected Doctors"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currently Shared With</CardTitle>
              <CardDescription>Doctors who already have access to this lab result</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                {shares.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    This lab result has not been shared with anyone yet
                  </div>
                ) : (
                  shares.map((share) => (
                    <div key={share.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{share.shared_with_user?.full_name || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">
                            Shared {format(new Date(share.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setShareToDelete(share.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => router.push(`/lab/${result.id}`)}>
            Done
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove access to this lab result for the selected doctor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveShare}>Remove Access</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
