"use client"

import { useRef } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ActivityTypeChartProps {
  data: Array<{
    activity_type: string
    count: number
  }>
}

export default function ActivityTypeChart({ data }: ActivityTypeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  const formattedData = data.map((item) => ({
    name: item.activity_type.replace(/_/g, " "),
    count: item.count,
  }))

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No activity data available</p>
      </div>
    )
  }

  return (
    <div ref={chartRef} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} interval={0} />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [`${value} actions`, "Count"]}
            contentStyle={{ borderRadius: "0.375rem", border: "1px solid #e2e8f0" }}
          />
          <Bar dataKey="count" fill="#4f46e5" name="Actions" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
