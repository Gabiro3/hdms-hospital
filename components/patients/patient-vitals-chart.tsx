"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

interface PatientVitalsChartProps {
  visits: any[]
}

export default function PatientVitalsChart({ visits }: PatientVitalsChartProps) {
  // Process visits data for the chart
  const chartData = useMemo(() => {
    // Filter visits with vitals and sort by date (oldest first)
    return visits
      .filter((visit) => visit.vitals)
      .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
      .map((visit) => ({
        date: format(parseISO(visit.visit_date), "MMM d"),
        heartRate: visit.vitals.heart_rate ? Number.parseInt(visit.vitals.heart_rate) : null,
        systolic: visit.vitals.blood_pressure ? Number.parseInt(visit.vitals.blood_pressure.split("/")[0]) : null,
        diastolic: visit.vitals.blood_pressure ? Number.parseInt(visit.vitals.blood_pressure.split("/")[1]) : null,
        temperature: visit.vitals.temperature ? Number.parseFloat(visit.vitals.temperature) : null,
        weight: visit.vitals.weight ? Number.parseFloat(visit.vitals.weight) : null,
      }))
  }, [visits])

  if (chartData.length < 2) {
    return (
      <div className="text-center py-4 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">
          {chartData.length === 0
            ? "No vitals data available for this patient."
            : "Not enough data points to display a chart."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="h-72 border rounded-md p-4">
        <h4 className="text-sm font-medium mb-4">Heart Rate & Blood Pressure</h4>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="heartRate"
              name="Heart Rate (bpm)"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="systolic"
              name="Systolic (mmHg)"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              name="Diastolic (mmHg)"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {chartData.some((data) => data.temperature !== null) && (
        <div className="h-72 border rounded-md p-4">
          <h4 className="text-sm font-medium mb-4">Temperature</h4>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} domain={[35, 40]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperature (°C)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.some((data) => data.weight !== null) && (
        <div className="h-72 border rounded-md p-4">
          <h4 className="text-sm font-medium mb-4">Weight</h4>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight"
                name="Weight (kg)"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
