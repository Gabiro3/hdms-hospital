interface RadiologyReportContentProps {
    content: any
    reportType: string
  }
  
  export default function RadiologyReportContent({ content, reportType }: RadiologyReportContentProps) {
    // Handle different report types with similar structure
    const getFieldLabels = () => {
      switch (reportType) {
        case "radiology":
          return {
            examination: "Examination",
            clinicalInformation: "Clinical Information",
            technique: "Technique",
            findings: "Findings",
            impression: "Impression",
          }
        case "laboratory":
          return {
            examination: "Test Name",
            clinicalInformation: "Clinical Information",
            technique: "Method",
            findings: "Results",
            impression: "Interpretation",
          }
        case "pathology":
          return {
            examination: "Specimen",
            clinicalInformation: "Clinical History",
            technique: "Procedure",
            findings: "Findings",
            impression: "Diagnosis",
          }
        default:
          return {
            examination: "Examination",
            clinicalInformation: "Clinical Information",
            technique: "Technique",
            findings: "Findings",
            impression: "Impression",
          }
      }
    }
  
    const labels = getFieldLabels()
  
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-medium">{labels.examination}</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.examination || "Not recorded"}</p>
          </div>
        </div>
  
        <div>
          <h3 className="mb-2 text-lg font-medium">{labels.clinicalInformation}</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.clinicalInformation || "Not recorded"}</p>
          </div>
        </div>
  
        <div>
          <h3 className="mb-2 text-lg font-medium">{labels.technique}</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.technique || "Not recorded"}</p>
          </div>
        </div>
  
        <div>
          <h3 className="mb-2 text-lg font-medium">{labels.findings}</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.findings || "Not recorded"}</p>
          </div>
        </div>
  
        <div>
          <h3 className="mb-2 text-lg font-medium">{labels.impression}</h3>
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.impression || "Not recorded"}</p>
          </div>
        </div>
  
        {reportType === "laboratory" && content.results && typeof content.results === "object" && (
          <div>
            <h3 className="mb-2 text-lg font-medium">Test Results</h3>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2">Test</th>
                    <th className="px-4 py-2">Result</th>
                    <th className="px-4 py-2">Reference Range</th>
                    <th className="px-4 py-2">Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(content.results).map(([test, result]: [string, any]) => (
                    <tr key={test}>
                      <td className="px-4 py-2 text-sm font-medium">{test}</td>
                      <td className="px-4 py-2 text-sm">{result.value}</td>
                      <td className="px-4 py-2 text-sm">{result.reference || "N/A"}</td>
                      <td className="px-4 py-2 text-sm">{result.units || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }
  