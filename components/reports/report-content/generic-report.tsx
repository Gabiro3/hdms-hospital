interface GenericReportContentProps {
    content: any
  }
  
  export default function GenericReportContent({ content }: GenericReportContentProps) {
    // Handle the case where content might be a string or an object
    if (typeof content === "string") {
      return (
        <div className="space-y-4">
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content}</p>
          </div>
        </div>
      )
    }
  
    if (content.text) {
      return (
        <div className="space-y-4">
          <div className="rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-gray-700">{content.text}</p>
          </div>
        </div>
      )
    }
  
    // If content is an object, display it in sections
    return (
      <div className="space-y-6">
        {Object.entries(content).map(([key, value]: [string, any]) => {
          // Skip rendering empty arrays or objects
          if (
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === "object" && value !== null && Object.keys(value).length === 0)
          ) {
            return null
          }
  
          // Format the key for display
          const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
  
          return (
            <div key={key}>
              <h3 className="mb-2 text-lg font-medium">{formattedKey}</h3>
              <div className="rounded-md bg-gray-50 p-4">
                {Array.isArray(value) ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {value.map((item, index) => (
                      <li key={index} className="text-gray-700">
                        {typeof item === "object" ? JSON.stringify(item) : String(item)}
                      </li>
                    ))}
                  </ul>
                ) : typeof value === "object" && value !== null ? (
                  <pre className="overflow-auto text-sm text-gray-700">{JSON.stringify(value, null, 2)}</pre>
                ) : (
                  <p className="whitespace-pre-wrap text-gray-700">{String(value)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  