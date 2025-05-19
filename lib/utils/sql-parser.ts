/**
 * Parses SQL file content and extracts data
 */
export function parseSqlFile(fileContent: string): any[] {
  try {
    // Remove comments
    const contentWithoutComments = fileContent.replace(/\/\*[\s\S]*?\*\/|--.*$/gm, "")

    // Check if this is a CREATE TABLE statement
    const createTableMatch = contentWithoutComments.match(/CREATE\s+TABLE\s+(\w+)\s*$$([\s\S]*?)$$\s*ENGINE/i)
    if (createTableMatch) {
      // This is a table structure, not data
      return []
    }

    // Look for INSERT statements
    const insertStatements = extractInsertStatements(contentWithoutComments)
    if (insertStatements.length > 0) {
      return parseInsertStatements(insertStatements)
    }

    // If no INSERT statements found, try to parse as CSV-like data
    return parseCsvLikeData(contentWithoutComments)
  } catch (error) {
    console.error("Error parsing SQL file:", error)
    throw new Error(`Failed to parse SQL file: ${error}`)
  }
}

/**
 * Extracts INSERT statements from SQL content
 */
function extractInsertStatements(content: string): string[] {
  const insertRegex = /INSERT\s+INTO\s+\w+\s*($$[^)]+$$)?\s*VALUES\s*$$[\s\S]*?$$;/gi
  return content.match(insertRegex) || []
}

/**
 * Parses INSERT statements into structured data
 */
function parseInsertStatements(statements: string[]): any[] {
  const results: any[] = []

  for (const statement of statements) {
    try {
      // Extract table name
      const tableMatch = statement.match(/INSERT\s+INTO\s+(\w+)/i)
      const tableName = tableMatch ? tableMatch[1] : ""

      // Extract column names if provided
      let columns: string[] = []
      const columnsMatch = statement.match(/INSERT\s+INTO\s+\w+\s*$$([^)]+)$$/i)
      if (columnsMatch) {
        columns = columnsMatch[1].split(",").map((col) => col.trim())
      }

      // Extract values
      const valuesMatch = statement.match(/VALUES\s*$$([\s\S]*?)$$;/i)
      if (!valuesMatch) continue

      // Handle multiple value sets (multiple rows)
      const valuesSets = valuesMatch[1].split("),(").map((set) => {
        // Clean up the first and last sets
        return set.replace(/^$$|$$$/g, "")
      })

      for (const valueSet of valuesSets) {
        // Parse the values, handling quoted strings and other data types
        const values = parseValueSet(valueSet)

        // Create object with column names if available
        const record: any = {}
        if (columns.length > 0) {
          columns.forEach((col, index) => {
            record[col] = index < values.length ? values[index] : null
          })
        } else {
          // If no column names provided, use index as keys
          values.forEach((val, index) => {
            record[`field${index}`] = val
          })
        }

        results.push(record)
      }
    } catch (error) {
      console.warn(`Error parsing INSERT statement: ${error}`)
      // Continue with next statement
    }
  }

  return results
}

/**
 * Parses a set of values from an INSERT statement
 */
function parseValueSet(valueSet: string): any[] {
  const values: any[] = []
  let currentValue = ""
  let inQuote = false
  let quoteChar = ""

  for (let i = 0; i < valueSet.length; i++) {
    const char = valueSet[i]

    if ((char === "'" || char === '"') && (i === 0 || valueSet[i - 1] !== "\\")) {
      if (!inQuote) {
        inQuote = true
        quoteChar = char
      } else if (char === quoteChar) {
        inQuote = false
      } else {
        currentValue += char
      }
    } else if (char === "," && !inQuote) {
      // End of value
      values.push(parseValue(currentValue.trim()))
      currentValue = ""
    } else {
      currentValue += char
    }
  }

  // Add the last value
  if (currentValue.trim()) {
    values.push(parseValue(currentValue.trim()))
  }

  return values
}

/**
 * Parses a value to the appropriate type
 */
function parseValue(value: string): any {
  // Handle NULL
  if (value.toUpperCase() === "NULL") {
    return null
  }

  // Handle quoted strings
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    return value.substring(1, value.length - 1)
  }

  // Handle numbers
  if (/^-?\d+$/.test(value)) {
    return Number.parseInt(value, 10)
  }

  if (/^-?\d+\.\d+$/.test(value)) {
    return Number.parseFloat(value)
  }

  // Handle booleans
  if (value.toUpperCase() === "TRUE") return true
  if (value.toUpperCase() === "FALSE") return false

  // Handle dates
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value // Return as string, will be parsed later
  }

  // Default to string
  return value
}

/**
 * Attempts to parse SQL content as CSV-like data
 */
function parseCsvLikeData(content: string): any[] {
  const lines = content.split("\n").filter((line) => line.trim())
  if (lines.length < 2) return [] // Need at least header and one data row

  // Assume first line is header
  const headers = lines[0].split(",").map((header) => header.trim())

  const results: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((val) => val.trim())
    const record: any = {}

    headers.forEach((header, index) => {
      record[header] = index < values.length ? parseValue(values[index]) : null
    })

    results.push(record)
  }

  return results
}
