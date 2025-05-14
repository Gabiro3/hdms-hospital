"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getInsurerDashboardStats } from "@/services/insurance-service"
import { PieChart, Plus, Search } from "lucide-react"
import InsuranceStatsCards from "./insurance-stats-cards"
import InsuranceClaimsChart from "./insurance-claims-chart"
import InsuranceClaimsTable from "./insurance-claims-table"
import InsurancePatientsTable from "./insurance-patients-table"

interface InsuranceDashboardProps {
  insurers: any[]
  userId: string
  hospitalId: string
}

export default function InsuranceDashboard({ insurers, userId, hospitalId }: InsuranceDashboardProps) {
  const [selectedInsurer, setSelectedInsurer] = useState(insurers[0]?.id || "")
  const [timeRange, setTimeRange] = useState("6months")
  const [searchQuery, setSearchQuery] = useState("")
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleInsurerChange = async (insurerId: string) => {
    setSelectedInsurer(insurerId)
    await fetchDashboardStats(insurerId)
  }

  const handleTimeRangeChange = async (range: string) => {
    setTimeRange(range)
    // In a real implementation, we would refetch with the new time range
    // For now, we'll just use the existing stats
  }

  const fetchDashboardStats = async (insurerId: string) => {
    if (!insurerId) return

    setIsLoading(true)
    try {
      const stats = await getInsurerDashboardStats(insurerId)
      setDashboardStats(stats)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch stats when component mounts
  useEffect(() => {
    if (selectedInsurer) {
      fetchDashboardStats(selectedInsurer)
    }
  }, [selectedInsurer])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insurance Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage insurance policies, patients, and claims</p>
        </div>
        <div className="flex gap-2">
          <Link href="/insurance/patients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Select value={selectedInsurer} onValueChange={handleInsurerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select insurance provider" />
            </SelectTrigger>
            <SelectContent>
              {insurers.map((insurer) => (
                <SelectItem key={insurer.id} value={insurer.id}>
                  {insurer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : !selectedInsurer ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PieChart className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Select an Insurance Provider</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Please select an insurance provider from the dropdown above to view the dashboard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <InsuranceStatsCards stats={dashboardStats} />

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="claims">Claims</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Claims Over Time</CardTitle>
                    <CardDescription>Number of claims submitted over the selected time period</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <InsuranceClaimsChart data={dashboardStats?.timeSeriesData || []} />
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Claims Status</CardTitle>
                    <CardDescription>Distribution of claims by status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                          <span>Pending</span>
                        </div>
                        <span className="font-medium">{dashboardStats?.pendingClaims || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-green-500"></div>
                          <span>Approved</span>
                        </div>
                        <span className="font-medium">{dashboardStats?.approvedClaims || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-red-500"></div>
                          <span>Rejected</span>
                        </div>
                        <span className="font-medium">{dashboardStats?.rejectedClaims || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/insurance/${selectedInsurer}/claims`}>View All Claims</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="patients" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search patients..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link href="/insurance/patients/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Patient
                  </Button>
                </Link>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Patients</CardTitle>
                  <CardDescription>Patients covered by this insurance provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <InsurancePatientsTable insurerId={selectedInsurer} searchQuery={searchQuery} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search claims..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Claims</CardTitle>
                  <CardDescription>Recent insurance claims</CardDescription>
                </CardHeader>
                <CardContent>
                  <InsuranceClaimsTable insurerId={selectedInsurer} searchQuery={searchQuery} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
