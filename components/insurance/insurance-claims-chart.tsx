"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface InsuranceClaimsChartProps {
  data: any[]
}

export default function InsuranceClaimsChart({ data }: InsuranceClaimsChartProps) {
  // Format month for display
  const formattedData = data.map((item) => {
    const [year, month] = item.month.split("-")
    return {
      ...item,
      name: `${month}/${year.slice(2)}`,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={formattedData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Month</span>
                      <span className="font-bold text-muted-foreground">{payload[0].payload.name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Claims</span>
                      <span className="font-bold">{payload[0].value}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Amount</span>
                      <span className="font-bold">Rwf {payload[1]?.value?.toLocaleString() || "0"}</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 6 }} />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#10b981"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          hide={true} // Hide this line but keep it for the tooltip
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
