"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { CalendarIcon, Download, FileText, CreditCard, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/billing-utils"
import BillingBreakdownChart from "@/components/billing/billing-breakdown-chart"
import BillingDetailsTable from "@/components/billing/billing-details-table"
import InvoicesList from "@/components/billing/invoices-list"
import { getBillingData } from "@/services/billing-service"

interface HospitalBillingDashboardProps {
  hospitalId: string
  initialBillingData: any
  initialInvoices: any[]
}

export default function HospitalBillingDashboard({
  hospitalId,
  initialBillingData,
  initialInvoices,
}: HospitalBillingDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [billingPeriod, setBillingPeriod] = useState("last-30-days")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [billingData, setBillingData] = useState(initialBillingData)
  const [invoices, setInvoices] = useState(initialInvoices)
  const [isLoading, setIsLoading] = useState(false)

  // Function to fetch billing data based on selected period
  const fetchBillingData = async () => {
    setIsLoading(true)
    try {
      let startDate, endDate

      switch (billingPeriod) {
        case "current-month":
          const currentMonth = new Date()
          startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd")
          endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd")
          break
        case "previous-month":
          const lastMonth = subMonths(new Date(), 1)
          startDate = format(startOfMonth(lastMonth), "yyyy-MM-dd")
          endDate = format(endOfMonth(lastMonth), "yyyy-MM-dd")
          break
        case "last-30-days":
          startDate = format(subMonths(new Date(), 1), "yyyy-MM-dd")
          endDate = format(new Date(), "yyyy-MM-dd")
          break
        case "custom-range":
          startDate = format(dateRange.from, "yyyy-MM-dd")
          endDate = format(dateRange.to, "yyyy-MM-dd")
          break
        default:
          startDate = format(subMonths(new Date(), 1), "yyyy-MM-dd")
          endDate = format(new Date(), "yyyy-MM-dd")
      }

      const { billingData: newData } = await getBillingData({
        hospitalId,
        startDate,
        endDate,
      })

      setBillingData(newData)
    } catch (error) {
      console.error("Error fetching billing data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when period changes
  useEffect(() => {
    if (billingPeriod !== "custom-range") {
      fetchBillingData()
    }
  }, [billingPeriod, hospitalId])

  // Fetch data when custom date range changes
  useEffect(() => {
    if (billingPeriod === "custom-range" && dateRange.from && dateRange.to) {
      fetchBillingData()
    }
  }, [dateRange, billingPeriod, hospitalId])

  // Extract hospital data from billing data
  const hospitalData = billingData?.hospitals?.[0] || {
    totalAmount: 0,
    diagnosisCounts: {},
    diagnosisCosts: {},
    diagnoses: [],
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Billing Overview</h2>
          <p className="text-sm text-muted-foreground">View and manage your hospital's billing information</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={billingPeriod} onValueChange={setBillingPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="previous-month">Previous Month</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="custom-range">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {billingPeriod === "custom-range" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange(range as { from: Date; to: Date })
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billing Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(hospitalData.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              For{" "}
              {billingPeriod === "current-month"
                ? "current month"
                : billingPeriod === "previous-month"
                  ? "previous month"
                  : billingPeriod === "last-30-days"
                    ? "last 30 days"
                    : "selected period"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Diagnoses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hospitalData.diagnoses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Across all diagnosis types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.filter((inv) => inv.status === "pending").length}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hospitalData.diagnoses?.length > 0
                ? formatCurrency(hospitalData.totalAmount / hospitalData.diagnoses.length)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per diagnosis</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Billing Details</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Billing Breakdown</CardTitle>
                <CardDescription>Distribution of costs by diagnosis type</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <BillingBreakdownChart data={hospitalData} />
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Diagnosis Type Summary</CardTitle>
                <CardDescription>Count and cost by diagnosis type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(hospitalData.diagnosisCounts).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{type}</p>
                        <p className="text-sm text-muted-foreground">{String(count)} diagnoses</p>
                      </div>
                      <div className="font-medium">{formatCurrency(hospitalData.diagnosisCosts[type] || 0)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Billing Details</CardTitle>
              <CardDescription>Detailed breakdown of all diagnoses and their costs</CardDescription>
            </CardHeader>
            <CardContent>
              <BillingDetailsTable diagnoses={hospitalData.diagnoses || []} formatCurrency={formatCurrency} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>View and manage your hospital's invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <InvoicesList invoices={invoices} formatCurrency={formatCurrency} isAdmin={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
