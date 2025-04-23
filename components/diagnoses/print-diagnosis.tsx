"use client"

import { format } from "date-fns"
import { AI_DISCLAIMER } from "@/lib/utils/print-utils"

interface PrintDiagnosisProps {
  diagnosis: any
  id: string
}

export default function PrintDiagnosis({ diagnosis, id }: PrintDiagnosisProps) {
  // Extract patient metadata
  const patientMetadata = diagnosis.patient_metadata || {}
  const aiAnalysis = diagnosis.ai_analysis_results || {}

  return (
    <div id={`diagnosis-print-${id}`} className="hidden">
      <div className="print-only">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{diagnosis.hospitals?.name || "Hospital"} - Diagnosis Report</h1>
          <p className="text-sm text-gray-500">Generated on {format(new Date(), "PPP")}</p>
        </div>

        {/* Disclaimer */}
        <div className="border-2 border-red-500 p-4 mb-6 bg-red-50 text-red-800 font-medium">{AI_DISCLAIMER}</div>

        {/* Diagnosis Info */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-2 mb-4">{diagnosis.title}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Patient ID:</strong> {diagnosis.patient_id}
              </p>
              {patientMetadata.name && (
                <p>
                  <strong>Patient Name:</strong> {patientMetadata.name}
                </p>
              )}
              {patientMetadata.age_range && (
                <p>
                  <strong>Age Range:</strong> {patientMetadata.age_range}
                </p>
              )}
            </div>
            <div>
              <p>
                <strong>Date:</strong> {format(new Date(diagnosis.created_at), "PPP")}
              </p>
              <p>
                <strong>Doctor:</strong> {diagnosis.users?.full_name || "Unknown"}
              </p>
              {patientMetadata.scan_type && (
                <p>
                  <strong>Scan Type:</strong> {patientMetadata.scan_type}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Doctor's Notes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Doctor's Notes</h3>
          <div className="border p-4 bg-gray-50">
            <p className="whitespace-pre-wrap">{diagnosis.doctor_notes || "No notes provided"}</p>
          </div>
        </div>
        {/* Doctor's Notes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Doctor's Assessment</h3>
          <div className="border p-4 bg-gray-50">
            <p className="whitespace-pre-wrap">{diagnosis.doctor_assessment || "No notes provided"}</p>
          </div>
        </div>

        {/* AI Analysis */}
        {aiAnalysis && Object.keys(aiAnalysis).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
            <div className="border p-4">
              {aiAnalysis.overall_summary && (
                <div className="mb-4">
                  <h4 className="font-medium">AI Summary</h4>
                  <p>{aiAnalysis.overall_summary}</p>
                </div>
              )}

              {aiAnalysis.findings && aiAnalysis.findings.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium">Findings</h4>
                  <ul className="list-disc pl-5 mt-2">
                    {aiAnalysis.findings.map((finding: string, index: number) => (
                      <li key={index}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium">Recommendations</h4>
                  <ul className="list-disc pl-5 mt-2">
                    {aiAnalysis.recommendations.map((recommendation: string, index: number) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAnalysis.potential_conditions && aiAnalysis.potential_conditions.length > 0 && (
                <div>
                  <h4 className="font-medium">Potential Conditions</h4>
                  <ul className="list-disc pl-5 mt-2">
                    {aiAnalysis.potential_conditions.map((condition: any, index: number) => (
                      <li key={index}>
                        {condition.name} ({Math.round(condition.probability * 100)}% confidence)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Images */}
        {diagnosis.image_links && diagnosis.image_links.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Diagnostic Images</h3>
            <div className="grid grid-cols-2 gap-4">
              {diagnosis.image_links.map((imageUrl: string, index: number) => (
                <div key={index} className="border p-2">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt={`Diagnostic image ${index + 1}`}
                    className="max-h-40 mx-auto"
                  />
                  <p className="text-center text-sm mt-2">Image {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>This report is confidential and intended for medical professionals only.</p>
          <p className="font-bold mt-2">{AI_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  )
}
