import { format } from "date-fns"

interface DischargeReportContentProps {
  content: any
}

export default function DischargeReportContent({ content }: DischargeReportContentProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium">Admission Date</h3>
          <div className="rounded-md bg-gray-50 p-2">
            <p className="text-gray-700">
              {content.admissionDate ? format(new Date(content.admissionDate), "MMMM d, yyyy") : "Not recorded"}
            </p>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Discharge Date</h3>
          <div className="rounded-md bg-gray-50 p-2">
            <p className="text-gray-700">
              {content.dischargeDate ? format(new Date(content.dischargeDate), "MMMM d, yyyy") : "Not recorded"}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium">Admission Diagnosis</h3>
        <div className="rounded-md bg-gray-50 p-4">
          <p className="whitespace-pre-wrap text-gray-700">
            {content.admissionDiagnosis || "No admission diagnosis recorded"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium">Discharge Diagnosis</h3>
        <div className="rounded-md bg-gray-50 p-4">
          <p className="whitespace-pre-wrap text-gray-700">
            {content.dischargeDiagnosis || "No discharge diagnosis recorded"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium">Treatment Summary</h3>
        <div className="rounded-md bg-gray-50 p-4">
          <p className="whitespace-pre-wrap text-gray-700">
            {content.treatmentSummary || "No treatment summary recorded"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium">Discharge Medications</h3>
        {content.medications && content.medications.length > 0 ? (
          <div className="space-y-2">
            {content.medications.map((medication: any, index: number) => (
              <div key={index} className="rounded-md border p-3">
                <div className="font-medium">{medication.name}</div>
                <div className="mt-1 text-sm text-gray-600">
                  Dosage: {medication.dosage}, Frequency: {medication.frequency}
                </div>
                {medication.instructions && (
                  <div className="mt-1 text-sm text-gray-600">Instructions: {medication.instructions}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md bg-gray-50 p-4">
            <p className="text-gray-700">No medications recorded</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium">Follow-up Instructions</h3>
        <div className="rounded-md bg-gray-50 p-4">
          <p className="whitespace-pre-wrap text-gray-700">
            {content.followUpInstructions || "No follow-up instructions recorded"}
          </p>
        </div>
      </div>
    </div>
  )
}
