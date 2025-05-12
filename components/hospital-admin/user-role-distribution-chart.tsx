"use client"

import { useRef } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface UserRoleDistributionChartProps {
  data: Array<{
    role: string
    count: number
  }>
}

export default function UserRoleDistributionChart({ data }: UserRoleDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

  const formattedData = data.map((item, index) => ({
    name: item.role,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }))

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No user role data available</p>
      </div>
    )
  }

  return (
    <div ref={chartRef} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} users`, "Count"]}
            contentStyle={{ borderRadius: "0.375rem", border: "1px solid #e2e8f0" }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
