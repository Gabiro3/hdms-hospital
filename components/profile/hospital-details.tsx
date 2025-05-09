"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Building2, Phone, Mail, MapPin, Clock, Award, Users, Calendar } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"

interface HospitalDetailsProps {
  userId: string
}

export default function HospitalDetails({ userId }: HospitalDetailsProps) {
  const [loading, setLoading] = useState(true)
  const [hospital, setHospital] = useState<any>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchHospitalDetails = async () => {
      setLoading(true)
      try {
        // Get user's hospital
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("hospital_id")
          .eq("id", userId)
          .single()

        if (userError) throw userError

        if (!userData.hospital_id) {
          setLoading(false)
          return
        }

        // Get hospital details
        const { data: hospitalData, error: hospitalError } = await supabase
          .from("hospitals")
          .select("*")
          .eq("id", userData.hospital_id)
          .single()

        if (hospitalError) throw hospitalError

        setHospital(hospitalData)

        // Get hospital departments
        const { data: departmentsData, error: departmentsError } = await supabase
          .from("hospital_departments")
          .select("*")
          .eq("hospital_id", userData.hospital_id)

        if (departmentsError) throw departmentsError

        setDepartments(departmentsData || [])
      } catch (error) {
        console.error("Error fetching hospital details:", error)
        toast({
          title: "Error",
          description: "Failed to load hospital information. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchHospitalDetails()
    }
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!hospital) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hospital Information</CardTitle>
          <CardDescription>Your hospital information is not available.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Hospital Assigned</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              You are not currently assigned to any hospital. Please contact your administrator for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{hospital.name}</CardTitle>
              <CardDescription>Hospital Information and Details</CardDescription>
            </div>
            <Badge variant={hospital.is_active ? "default" : "destructive"}>
              {hospital.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="accreditations">Accreditations</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium">Hospital Code</h4>
                      <p className="text-sm text-muted-foreground">{hospital.code}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium">Contact Number</h4>
                      <p className="text-sm text-muted-foreground">{hospital.phone || "Not available"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium">Email</h4>
                      <p className="text-sm text-muted-foreground">{hospital.email || "Not available"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium">Address</h4>
                      <p className="text-sm text-muted-foreground">
                        {hospital.address || "Not available"}
                        {hospital.city && `, ${hospital.city}`}
                        {hospital.state && `, ${hospital.state}`}
                        {hospital.zip && ` ${hospital.zip}`}
                        {hospital.country && `, ${hospital.country}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium">Operating Hours</h4>
                      <p className="text-sm text-muted-foreground">{hospital.operating_hours || "24/7 Operation"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium">Capacity</h4>
                      <p className="text-sm text-muted-foreground">
                        {hospital.bed_capacity ? `${hospital.bed_capacity} beds` : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium">Established</h4>
                      <p className="text-sm text-muted-foreground">{hospital.established_year || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium">Type</h4>
                      <p className="text-sm text-muted-foreground">{hospital.type || "General Hospital"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {hospital.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">About</h4>
                    <p className="text-sm text-muted-foreground">{hospital.description}</p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="departments" className="space-y-4">
              {departments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Departments Available</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    There are no departments listed for this hospital.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.map((dept) => (
                    <Card key={dept.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{dept.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {dept.description || "No description available"}
                        </p>
                        {dept.head_doctor && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Head:</span> {dept.head_doctor}
                          </div>
                        )}
                        {dept.contact && (
                          <div className="mt-1 text-sm">
                            <span className="font-medium">Contact:</span> {dept.contact}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="accreditations" className="space-y-4">
              {!hospital.accreditations || hospital.accreditations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Award className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Accreditations Available</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    There are no accreditations listed for this hospital.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hospital.accreditations.map((accreditation: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{accreditation.name}</h4>
                        <Badge>{accreditation.year}</Badge>
                      </div>
                      {accreditation.description && (
                        <p className="text-sm text-muted-foreground mt-2">{accreditation.description}</p>
                      )}
                      {accreditation.expiry && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Valid until:</span> {accreditation.expiry}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
