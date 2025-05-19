import { createServerSupabaseClient } from "@/lib/supabase/server"
import { parseSqlFile } from "@/lib/utils/sql-parser"
import { mapSchemaToDatabase } from "@/lib/utils/schema-mapper"
import { validateData } from "@/lib/utils/data-validator"
import { logUserActivity } from "@/services/activity-service"

export type MigrationSource = "patient_tbl" | "medical_test_tbl" | "history_tbl" | "record_log_tbl"
export type MigrationTarget = "patients" | "lab_results"

export type MigrationPreviewData = {
  fields(fields: any, source: MigrationSource, target: MigrationTarget): { mappings: any }
  source: MigrationSource
  target: MigrationTarget
  data: any[]
  mappings: Record<string, string>
  unmappedFields: string[]
}

export type MigrationResult = {
  success: boolean
  recordsProcessed: number
  recordsInserted: number
  recordsUpdated: number
  recordsSkipped: number
  errors: string[]
}

/**
 * Parses an SQL file and extracts data for preview
 */
export async function extractDataFromSql(
  fileContent: string,
  source: MigrationSource,
): Promise<{ data: any[]; fields: string[] }> {
  try {
    // Parse the SQL file to extract data
    const parsedData = parseSqlFile(fileContent)

    if (!parsedData || !parsedData.length) {
      throw new Error(`No data found in the SQL file for ${source}`)
    }

    // Extract field names from the first record
    const fields = Object.keys(parsedData[0])

    return { data: parsedData, fields }
  } catch (error) {
    console.error("Error extracting data from SQL:", error)
    throw new Error(`Failed to extract data from SQL file: ${error}`)
  }
}

/**
 * Generates a preview of the data migration
 */
export async function generateMigrationPreview(
  fileContent: string,
  source: MigrationSource,
  target: MigrationTarget,
): Promise<MigrationPreviewData> {
  try {
    // Extract data from SQL file
    const { data, fields } = await extractDataFromSql(fileContent, source)

    // Get default mappings between source and target
    const { mappings, unmappedFields } = mapSchemaToDatabase(fields, source, target)

    return {
      fields: (fields: any, source: MigrationSource, target: MigrationTarget) => mapSchemaToDatabase(fields, source, target),
      source,
      target,
      data: data.slice(0, 10), // Only return first 10 records for preview
      mappings,
      unmappedFields,
    }
  } catch (error) {
    console.error("Error generating migration preview:", error)
    throw new Error(`Failed to generate migration preview: ${error}`)
  }
}

/**
 * Performs the actual data migration
 */
export async function migrateData(
  fileContent: string,
  source: MigrationSource,
  target: MigrationTarget,
  mappings: Record<string, string>,
  userId: string,
): Promise<MigrationResult> {
  const supabase = createServerSupabaseClient()
  const result: MigrationResult = {
    success: false,
    recordsProcessed: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    errors: [],
  }

  try {
    // Extract all data from SQL file
    const { data } = await extractDataFromSql(fileContent, source)
    result.recordsProcessed = data.length

    // Process each record
    for (const record of data) {
      try {
        // Transform the record according to mappings
        const { mappedData, openMetadata } = transformRecord(record, mappings)

        // Validate the data
        const validationErrors = validateData(mappedData, target)
        if (validationErrors.length > 0) {
          result.errors.push(`Validation failed for record: ${JSON.stringify(validationErrors)}`)
          result.recordsSkipped++
          continue
        }

        // Add open_metadata field with unmapped data
        mappedData.open_metadata = openMetadata

        // Check if record already exists (using appropriate unique identifier)
        const uniqueField = getUniqueFieldForTarget(target)
        const uniqueValue = mappedData[uniqueField]

        if (!uniqueValue) {
          result.errors.push(`Missing unique identifier (${uniqueField}) for record`)
          result.recordsSkipped++
          continue
        }

        const { data: existingData, error: lookupError } = await supabase
          .from(target)
          .select("id")
          .eq(uniqueField, uniqueValue)
          .maybeSingle()

        if (lookupError) {
          result.errors.push(`Error checking for existing record: ${lookupError.message}`)
          result.recordsSkipped++
          continue
        }

        if (existingData) {
          // Update existing record
          const { error: updateError } = await supabase.from(target).update(mappedData).eq("id", existingData.id)

          if (updateError) {
            result.errors.push(`Error updating record: ${updateError.message}`)
            result.recordsSkipped++
          } else {
            result.recordsUpdated++
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase.from(target).insert(mappedData)

          if (insertError) {
            result.errors.push(`Error inserting record: ${insertError.message}`)
            result.recordsSkipped++
          } else {
            result.recordsInserted++
          }
        }
      } catch (error) {
        result.errors.push(`Error processing record: ${error}`)
        result.recordsSkipped++
      }
    }

    // Log the activity
    await logUserActivity({
        user_id: userId,
        action: "DATA_MIGRATION",
        details: {
            source,
            target,
            recordsProcessed: result.recordsProcessed,
            recordsInserted: result.recordsInserted,
            recordsUpdated: result.recordsUpdated,
            recordsSkipped: result.recordsSkipped,
        },
        resource_type: undefined,
        resource_id: undefined,
        metadata: {},
        activity_type: "",
        description: ""
    })

    result.success = result.errors.length === 0 || result.recordsInserted + result.recordsUpdated > 0
    return result
  } catch (error) {
    console.error("Error during data migration:", error)
    result.errors.push(`Migration failed: ${error}`)
    return result
  }
}

/**
 * Transforms a record according to the provided mappings
 */
function transformRecord(record: any, mappings: Record<string, string>): { mappedData: any; openMetadata: any } {
  const mappedData: any = {}
  const openMetadata: any = {}

  // Process each field in the source record
  for (const [sourceField, value] of Object.entries(record)) {
    const targetField = mappings[sourceField]

    if (targetField) {
      // Field is mapped, add to mapped data
      mappedData[targetField] = value
    } else {
      // Field is not mapped, add to open_metadata
      openMetadata[sourceField] = value
    }
  }

  return { mappedData, openMetadata }
}

/**
 * Returns the unique field name for a given target table
 */
function getUniqueFieldForTarget(target: MigrationTarget): string {
  switch (target) {
    case "patients":
      return "identification_card_number" // ICN as unique identifier
    case "lab_results":
      return "test_number" // Assuming test_number is unique
    default:
      return "id"
  }
}
