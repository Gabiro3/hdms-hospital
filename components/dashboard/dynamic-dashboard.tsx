"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Users,
  FileText,
  UserPlus,
  Activity,
  ClipboardList,
  Share2,
  Microscope,
  ImageIcon,
  Bot,
  TicketCheck,
  FilePlus,
  FlaskRoundIcon as Flask,
  FileSearch,
  Logs,
} from "lucide-react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import DashboardStats from "./dashboard-stats"

interface DynamicDashboardProps {
  userData: any
}

export default function DynamicDashboard({ userData }: DynamicDashboardProps) {
  const [greeting, setGreeting] = useState<string>("Hello")

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning")
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Good afternoon")
    } else {
      setGreeting("Good evening")
    }
  }, [])

  // Determine which dashboard to show based on user role
  const userRole = userData.role?.toUpperCase()

  // Doctor's dashboard cards
  const doctorCards = [
    {
      title: "View Patients",
      description: "Access and manage patient records",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/patients",
    },
    {
      title: "Lab Tests",
      description: "View and request laboratory tests",
      icon: <Microscope className="h-8 w-8 text-primary" />,
      href: "/lab",
    },
    {
      title: "Image Viewer",
      description: "View and analyze medical images",
      icon: <ImageIcon className="h-8 w-8 text-primary" />,
      href: "/radiology",
    },
    {
      title: "Register Patient",
      description: "Register a new patient",
      icon: <UserPlus className="h-8 w-8 text-primary" />,
      href: "/patients/new",
    },
    {
      title: "AI Assistant",
      description: "Get AI-powered diagnostic assistance",
      icon: <Bot className="h-8 w-8 text-primary" />,
      href: "/ai-assistant",
    },
    {
      title: "Support Tickets",
      description: "View and create support tickets",
      icon: <TicketCheck className="h-8 w-8 text-primary" />,
      href: "/support",
    },
    {
      title: "Record Diagnosis",
      description: "Create a new patient diagnosis",
      icon: <FilePlus className="h-8 w-8 text-primary" />,
      href: "/diagnoses/new",
    },
    {
      title: "Request Lab Test",
      description: "Request a new laboratory test",
      icon: <Flask className="h-8 w-8 text-primary" />,
      href: "/lab",
    },
    {
      title: "My Reports",
      description: "View and manage your reports",
      icon: <FileSearch className="h-8 w-8 text-primary" />,
      href: "/reports",
    },
    {
      title: "Activity Log",
      description: "View your activity logs",
      icon: <Logs className="h-8 w-8 text-primary" />,
      href: "/profile",
    },
  ]

  // Lab technician's dashboard cards
  const labCards = [
    {
      title: "View Lab Requests",
      description: "View and process lab test requests",
      icon: <ClipboardList className="h-8 w-8 text-primary" />,
      href: "/lab",
    },
    {
      title: "View Patients",
      description: "Access patient records",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/patients",
    },
    {
      title: "AI Assistant",
      description: "Get AI-powered lab analysis",
      icon: <Bot className="h-8 w-8 text-primary" />,
      href: "/ai-assistant",
    },
    {
      title: "New Lab Test",
      description: "Create a new lab test result",
      icon: <Flask className="h-8 w-8 text-primary" />,
      href: "/lab/create",
    },
    {
      title: "My Reports",
      description: "View and manage your reports",
      icon: <FileSearch className="h-8 w-8 text-primary" />,
      href: "/reports",
    },
    {
      title: "Activity Log",
      description: "View your activity logs",
      icon: <Logs className="h-8 w-8 text-primary" />,
      href: "/profile",
    },
  ]

  // Hospital admin dashboard cards
  const adminCards = [
    {
      title: "Total Users",
      description: "Manage hospital users",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/hospital-admin/users",
    },
    {
      title: "Total Patients",
      description: "View all registered patients",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/patients",
    },
    {
      title: "Create New User",
      description: "Register a new hospital user",
      icon: <UserPlus className="h-8 w-8 text-primary" />,
      href: "/hospital-admin/users/create",
    },
    {
      title: "Share Patient Records",
      description: "Manage patient record sharing",
      icon: <Share2 className="h-8 w-8 text-primary" />,
      href: "/hospital-admin/records",
    },
    {
      title: "Total Diagnoses",
      description: "View all patient diagnoses",
      icon: <FileText className="h-8 w-8 text-primary" />,
      href: "/diagnoses",
    },
    {
      title: "View Patients",
      description: "Access and manage patient records",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/patients",
    },
    {
      title: "Support Tickets",
      description: "Manage support tickets",
      icon: <TicketCheck className="h-8 w-8 text-primary" />,
      href: "/support",
    },
    {
      title: "System Monitoring",
      description: "Monitor system activity and logs",
      icon: <Activity className="h-8 w-8 text-primary" />,
      href: "/hospital-admin",
    },
  ]

  // Determine which cards to display based on user role
  let dashboardCards = doctorCards
  let dashboardTitle = "Doctor Dashboard"

  if (userRole === "LAB") {
    dashboardCards = labCards
    dashboardTitle = "Lab Technician Dashboard"
  } else if (userRole === "HP_ADMIN") {
    dashboardCards = adminCards
    dashboardTitle = "Hospital Administration Dashboard"
  } else if (userRole === "IMAGING") {
    dashboardTitle = "Imaging Specialist Dashboard"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {greeting}, {userData.full_name || userData.email}
        </h1>
        <p className="text-sm text-gray-500">
          Welcome to {userData.hospitals?.name || "your hospital"} {dashboardTitle.toLowerCase()}
        </p>
      </div>

      {/* Role-specific dashboard stats */}
      {(userRole === "DOCTOR" || userRole === "IMAGING" || userRole === "HP_ADMIN") && (
        <DashboardStats hospitalId={userData.hospital_id} />
      )}

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => (
          <Link href={card.href} key={index}>
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <CardHeader className="pb-2">
                <div className="rounded-full bg-primary/10 p-3 w-fit">{card.icon}</div>
                <CardTitle className="mt-4">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="ghost" className="w-full justify-start p-0 text-primary">
                  Access {card.title.toLowerCase()} →
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
