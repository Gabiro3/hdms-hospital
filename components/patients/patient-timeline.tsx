"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { FileText, Activity, Stethoscope } from "lucide-react"

interface PatientTimelineProps {
  patient: any
}

export default function PatientTimeline({ patient }: PatientTimelineProps) {
  // Combine visits and diagnoses into a single timeline
  const timelineEvents = useMemo(() => {
    const events: { id: any; type: string; date: any; title: any; doctor: any; data: any }[] = []

    // Add visits to timeline
    if (patient.visits) {
      patient.visits.forEach((visit: any) => {
        events.push({
          id: visit.id,
          type: "visit",
          date: visit.visit_date,
          title: visit.reason,
          doctor: visit.users?.full_name || "Unknown",
          data: visit,
        })
      })
    }

    // Add diagnoses to timeline
    if (patient.diagnoses) {
      patient.diagnoses.forEach((diagnosis: any) => {
        events.push({
          id: diagnosis.id,
          type: "diagnosis",
          date: diagnosis.created_at,
          title: diagnosis.title,
          doctor: diagnosis.users?.full_name || "Unknown",
          data: diagnosis,
        })
      })
    }

    // Sort by date (newest first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [patient])

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No medical history available for this patient.</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Medical Timeline</h3>
      <div className="space-y-4">
        {timelineEvents.slice(0, 5).map((event) => (
          <div key={`${event.type}-${event.id}`} className="flex">
            <div className="mr-4 flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {event.type === "visit" ? (
                  <Stethoscope className="h-5 w-5 text-primary" />
                ) : (
                  <FileText className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="h-full w-px bg-border" />
            </div>
            <div className="pb-8">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">{format(parseISO(event.date), "MMMM d, yyyy")}</p>
                <p className="text-xs text-muted-foreground">Dr. {event.doctor}</p>
              </div>
              <h4 className="font-medium mt-1">{event.title}</h4>
              {event.type === "visit" && event.data.vitals && (
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <Activity className="h-4 w-4 mr-1" />
                  <span>
                    BP: {event.data.vitals.blood_pressure || "N/A"} | HR: {event.data.vitals.heart_rate || "N/A"} bpm |
                    Temp: {event.data.vitals.temperature || "N/A"}°C
                  </span>
                </div>
              )}
              {event.type === "diagnosis" && event.data.ai_analysis_results && (
                <div className="mt-2 text-sm">
                  <p className="text-muted-foreground line-clamp-2">
                    {event.data.ai_analysis_results.overall_summary || "AI analysis performed"}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
