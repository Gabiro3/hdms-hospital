"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface PrintLabResultProps {
  result: any
}

export default function PrintLabResult({ result }: PrintLabResultProps) {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add print-specific styles
    const style = document.createElement("style")
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-container, #print-container * {
          visibility: visible;
        }
        #print-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const renderResultContent = () => {
    const resultData = result.results

    switch (result.result_type) {
      case "blood":
        return renderBloodTestResult(resultData)
      case "urine":
        return renderUrineTestResult(resultData)
      case "imaging":
        return renderImagingResult(resultData)
      default:
        return renderGenericResult(resultData)
    }
  }

  const renderBloodTestResult = (data: any) => {
    return (
      <div className="space-y-4">
        {data.panels &&
          data.panels.map((panel: any, index: number) => (
            <div key={index} className="mb-4">
              <h3 className="text-lg font-medium mb-2 border-b pb-1">{panel.name}</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Test</th>
                    <th className="border p-2 text-left">Result</th>
                    <th className="border p-2 text-left">Reference Range</th>
                    <th className="border p-2 text-left">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {panel.tests &&
                    panel.tests.map((test: any, testIndex: number) => (
                      <tr key={testIndex}>
                        <td className="border p-2">
                          <div className="font-medium">{test.name}</div>
                          <div className="text-xs text-gray-500">{test.description}</div>
                        </td>
                        <td className="border p-2">
                          {test.value} {test.unit}
                        </td>
                        <td className="border p-2">{test.reference_range}</td>
                        <td className="border p-2">
                          {test.flag ? (
                            <span className="text-red-600 font-medium">Abnormal</span>
                          ) : (
                            <span className="text-green-600">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}

        {data.comments && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2 border-b pb-1">Comments</h3>
            <p className="text-sm">{data.comments}</p>
          </div>
        )}
      </div>
    )
  }

  const renderUrineTestResult = (data: any) => {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 border-b pb-1">Physical Examination</h3>
          <table className="w-full border-collapse">
            <tbody>
              {data.physical &&
                Object.entries(data.physical).map(([key, value]: [string, any]) => (
                  <tr key={key}>
                    <td className="border p-2 font-medium w-1/3 capitalize">{key.replace("_", " ")}</td>
                    <td className="border p-2">{value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 border-b pb-1">Chemical Examination</h3>
          <table className="w-full border-collapse">
            <tbody>
              {data.chemical &&
                Object.entries(data.chemical).map(([key, value]: [string, any]) => (
                  <tr key={key}>
                    <td className="border p-2 font-medium w-1/3 capitalize">{key.replace("_", " ")}</td>
                    <td className="border p-2">{value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data.microscopic && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 border-b pb-1">Microscopic Examination</h3>
            <table className="w-full border-collapse">
              <tbody>
                {Object.entries(data.microscopic).map(([key, value]: [string, any]) => (
                  <tr key={key}>
                    <td className="border p-2 font-medium w-1/3 capitalize">{key.replace("_", " ")}</td>
                    <td className="border p-2">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.comments && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2 border-b pb-1">Comments</h3>
            <p className="text-sm">{data.comments}</p>
          </div>
        )}
      </div>
    )
  }

  const renderImagingResult = (data: any) => {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 border-b pb-1">Imaging Details</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="border p-2 font-medium w-1/3">Procedure</td>
                <td className="border p-2">{data.procedure}</td>
              </tr>
              <tr>
                <td className="border p-2 font-medium w-1/3">Modality</td>
                <td className="border p-2">{data.modality}</td>
              </tr>
              <tr>
                <td className="border p-2 font-medium w-1/3">Body Part</td>
                <td className="border p-2">{data.body_part}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {data.findings && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 border-b pb-1">Findings</h3>
            <p className="text-sm">{data.findings}</p>
          </div>
        )}

        {data.impression && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 border-b pb-1">Impression</h3>
            <p className="text-sm">{data.impression}</p>
          </div>
        )}

        {data.comments && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2 border-b pb-1">Comments</h3>
            <p className="text-sm">{data.comments}</p>
          </div>
        )}
      </div>
    )
  }

  const renderGenericResult = (data: any) => {
    return (
      <div>
        <h3 className="text-lg font-medium mb-2 border-b pb-1">Result</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    )
  }
  return (
    <div ref={printRef} id="print-container" className="p-6">
      {renderResultContent()}
    </div>
  )  
}
