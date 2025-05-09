import type React from "react"
import type { Metadata } from "next"
import RadiologyStateProvider from "@/components/radiology/radiology-state-provider"

export const metadata: Metadata = {
  title: "Radiology Viewer | Hospital Diagnosis Management System",
  description: "Advanced radiology image viewer and reporting interface",
}

export default function RadiologyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  return (
    <RadiologyStateProvider studyId={params.id}>
      <div className="h-screen overflow-hidden">{children}</div>
    </RadiologyStateProvider>
  )
}

