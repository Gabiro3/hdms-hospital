"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, Search, Calendar, ImageIcon, User, Filter, FileText } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { markRadiologyStudyAsViewed } from "@/services/radiology-service"
import { useToast } from "@/components/ui/use-toast"

interface SharedStudiesListProps {
  studies: any[]
}

export default function SharedStudiesList({ studies }: SharedStudiesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [modalityFilter, setModalityFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("newest")
  const router = useRouter()
  const { toast } = useToast()

  // Filter and sort studies
  const filteredStudies = studies
    .filter((study) => {
      // Filter by search query
      const matchesSearch =
        !searchQuery ||
        study.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        study.study_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        study.modality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        study.sharedBy?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by modality
      const matchesModality = modalityFilter === "all" || study.modality === modalityFilter

      return matchesSearch && matchesModality
    })
    .sort((a, b) => {
      // Sort by date
      if (sortOrder === "newest") {
        return new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()
      } else {
        return new Date(a.sharedAt).getTime() - new Date(b.sharedAt).getTime()
      }
    })

  // Handle viewing a study
  const handleViewStudy = async (study: any) => {
    // If study hasn't been viewed yet, mark it as viewed
    if (!study.viewed && study.shareId) {
      try {
        await markRadiologyStudyAsViewed(study.shareId)
      } catch (error) {
        console.error("Error marking study as viewed:", error)
      }
    }

    // Navigate to the study viewer
    router.push(`/radiology/${study.id}`)
  }

  // Get unique modalities for the filter
  const uniqueModalities = Array.from(new Set(studies.map((study) => study.modality))).filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by patient, description or radiologist..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={modalityFilter} onValueChange={setModalityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by modality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modalities</SelectItem>
              {uniqueModalities.map((modality) => (
                <SelectItem key={modality} value={modality}>
                  {modality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredStudies.length === 0 ? (
        <Card>
          <CardContent className="flex h-60 flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Filter className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No shared studies found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {searchQuery || modalityFilter !== "all"
                ? "No studies match your search criteria. Try adjusting your search or filters."
                : "You don't have any studies shared with you yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredStudies.map((study) => (
            <Card
              key={study.id}
              className={`overflow-hidden transition-colors ${!study.viewed ? "border-primary/50 bg-primary/5" : ""}`}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{study.study_description}</h3>
                          <Badge variant="outline">{study.modality}</Badge>
                          {!study.viewed && <Badge>New</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Patient: {study.patient_name || "Unknown"}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">
                          Shared {formatDistanceToNow(new Date(study.sharedAt), { addSuffix: true })}
                        </p>
                        <p className="font-medium">By: {study.sharedBy?.full_name || "Unknown"}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{format(new Date(study.study_date), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center">
                        <ImageIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{study.image_count || 0} images</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>ID: {study.patient_id || "Unknown"}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>
                          Report:{" "}
                          {study.report_status ? (
                            <Badge variant={study.report_status === "completed" ? "secondary" : "outline"}>
                              {study.report_status}
                            </Badge>
                          ) : (
                            "Pending"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t md:border-l md:border-t-0 p-4 bg-muted/30">
                    <div className="hidden md:block">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10">
                          {study.modality?.substring(0, 2) || "IM"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <Button onClick={() => handleViewStudy(study)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Study
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
