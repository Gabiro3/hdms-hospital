"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, FilePlus, Search, MoreVertical, Share2, Eye, Edit, Trash2, UserCircle, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { deleteReport } from "@/services/report-service"
import CreateReportDialog from "./create-report-dialog"

interface ReportsDashboardProps {
    reports: any[]
    currentUser: any
}

export default function ReportsDashboard({ reports, currentUser }: ReportsDashboardProps) {
    const [activeTab, setActiveTab] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const router = useRouter()

    // Filter reports based on the active tab and search query
    const filteredReports = reports.filter((report) => {
        // Filter by search query
        const matchesSearch =
            !searchQuery ||
            report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (report.patients?.name && report.patients.name.toLowerCase().includes(searchQuery.toLowerCase()))

        if (!matchesSearch) return false

        // Filter by tab
        switch (activeTab) {
            case "own":
                return report.isOwn
            case "shared":
                return report.isShared
            case "draft":
                return report.status === "draft"
            case "final":
                return report.status === "final"
            case "all":
            default:
                return true
        }
    })

    // Group reports by type for better organization
    const reportsByType: { [key: string]: any[] } = {}
    filteredReports.forEach((report) => {
        const type = report.report_type || "Other"
        if (!reportsByType[type]) {
            reportsByType[type] = []
        }
        reportsByType[type].push(report)
    })

    // Handle report deletion
    const handleDeleteReport = async (reportId: string) => {
        if (confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
            try {
                const { error } = await deleteReport(reportId)
                if (error) {
                    toast({
                        title: "Error",
                        description: error,
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Success",
                        description: "Report deleted successfully",
                    })
                    router.refresh()
                }
            } catch (error) {
                console.error("Error deleting report:", error)
                toast({
                    title: "Error",
                    description: "An unexpected error occurred",
                    variant: "destructive",
                })
            }
        }
    }

    // Handle create report button click
    const handleCreateReport = () => {
        setShowCreateDialog(true)
    }

    // Handle report creation success
    const handleReportCreated = (reportId: string) => {
        setShowCreateDialog(false)
        router.push(`/reports/${reportId}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Reports</h1>
                    <p className="text-muted-foreground">Create, manage and share clinical reports with colleagues</p>
                </div>
                <Button onClick={handleCreateReport}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Create Report
                </Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search reports by title or patient name..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="own">My Reports</TabsTrigger>
                            <TabsTrigger value="shared">Shared</TabsTrigger>
                            <TabsTrigger value="draft">Drafts</TabsTrigger>
                            <TabsTrigger value="final">Finalized</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {Object.keys(reportsByType).length === 0 ? (
                <Card>
                    <CardContent className="flex h-60 flex-col items-center justify-center p-6 text-center">
                        <div className="mb-4 rounded-full bg-primary/10 p-3">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium">No reports found</h3>
                        <p className="mb-4 max-w-md text-sm text-muted-foreground">
                            {searchQuery
                                ? "No reports match your search criteria. Try adjusting your search or filters."
                                : "No reports match your current filters."}
                        </p>
                        <Button onClick={handleCreateReport}>
                            <FilePlus className="mr-2 h-4 w-4" />
                            Create Report
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(reportsByType).map(([type, typeReports]) => (
                        <div key={type}>
                            <h2 className="mb-4 text-lg font-medium">
                                {type.charAt(0).toUpperCase() + type.slice(1)} Reports
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {typeReports.map((report) => (
                                    <Card key={report.id} className="overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="line-clamp-1">{report.title}</CardTitle>
                                                    <CardDescription className="line-clamp-1">
                                                        {report.patients?.name ? `Patient: ${report.patients.name}` : "No patient specified"}
                                                    </CardDescription>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                            <span className="sr-only">Menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/reports/${report.id}`}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {(report.isOwn || report.canEdit) && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/reports/${report.id}/edit`}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {report.isOwn && (
                                                            <DropdownMenuItem onClick={() => handleDeleteReport(report.id)} className="text-red-500">
                                                                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-2">
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>{format(new Date(report.updated_at), "MMM d, yyyy")}</span>
                                            </div>
                                            <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                                                <UserCircle className="h-4 w-4" />
                                                <span>
                                                    {report.isShared
                                                        ? `Shared by ${report.sharedBy?.full_name || "Unknown"}`
                                                        : `Created by ${report.creator?.full_name || "Unknown"}`}
                                                </span>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex items-center justify-between pt-2">
                                            <Badge variant={report.status === "draft" ? "outline" : "secondary"}>
                                                {report.status === "draft" ? "Draft" : "Finalized"}
                                            </Badge>
                                            {report.isShared && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                    Shared with you
                                                </Badge>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateReportDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                userId={currentUser.id}
                hospitalId={currentUser.hospital_id}
                onReportCreated={handleReportCreated}
            />
        </div>
    )
}
