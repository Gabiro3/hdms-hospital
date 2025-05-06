interface ProgressReportContentProps {
    content: any
  }
  
  export default function ProgressReportContent({ content }: ProgressReportContentProps) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-medium">Subjective</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">
              {content.subjective || "No subjective information recorded"}
            </p>
          </div>
        </div>
  
        <div>
          <h3 className="mb-2 text-lg font-medium">Objective</h3>
          <div className="rounded-md bg-gray-50 p-4">
            {content.objective?.vitals && Object.keys(content.objective.vitals).length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium">Vitals</h4>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {content.objective.vitals.blood_pressure && (
                    <div className="rounded-md bg-white p-2 text-sm">
                      <span className="font-medium">BP:</span> {content.objective.vitals.blood_pressure}
                    </div>
                  )}
                  {content.objective.vitals.heart_rate && (
                    <div className="rounded-md bg-white p-2 text-sm">
                      <span className="font-medium">HR:</span> {content.objective.vitals.heart_rate} bpm
                    </div>
                  )}
                  {content.objective.vitals.temperature && (
                    <div className="rounded-md bg-white p-2 text-sm">
                      <span className="font-medium">Temp:</span> {content.objective.vitals.temperature}°C
                    </div>
                  )}
                  {content.objective.vitals.respiratory_rate && (
                    <div className="rounded-md bg-white p-2 text-sm">
                      <span className="font-medium">RR:</span> {content.objective.vitals.respiratory_rate} breaths/min
                    </div>
                  )}
                  {content.objective.vitals.oxygen_saturation && (
                    <div className="rounded-md bg-white p-2 text-sm">
                      <span className="font-medium">O2 Sat:</span> {content.objective.vitals.oxygen_saturation}%
                    </div>
                  )}
                </div>
              </div>
            )}
            <p className="whitespace-pre-wrap text-gray-700">
              {content.objective?.examination || "No examination information recorded"}
            </p>
          </div>
        </div>
  
        <div>
          <h3 className="mb-2 text-lg font-medium">Assessment</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.assessment || "No assessment recorded"}</p>
          </div>
        </div>
  
        <div>
          <h3 className="mb-2 text-lg font-medium">Plan</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.plan || "No plan recorded"}</p>
          </div>
        </div>
      </div>
    )
  }
  