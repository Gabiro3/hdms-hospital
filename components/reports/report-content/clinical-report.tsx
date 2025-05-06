interface ClinicalReportContentProps {
    content: any
  }
  
  export default function ClinicalReportContent({ content }: ClinicalReportContentProps) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-medium">Clinical Findings</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.findings || "No findings recorded"}</p>
          </div>
        </div>
  
        <div>
          <h3 className="mb-2 text-lg font-medium">Diagnosis</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.diagnosis || "No diagnosis recorded"}</p>
          </div>
        </div>
  
        <div>
          <h3 className="mb-2 text-lg font-medium">Treatment</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.treatment || "No treatment recorded"}</p>
          </div>
        </div>
  
        <div>
          <h3 className="mb-2 text-lg font-medium">Recommendations</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">
              {content.recommendations || "No recommendations recorded"}
            </p>
          </div>
        </div>
      </div>
    )
  }
  