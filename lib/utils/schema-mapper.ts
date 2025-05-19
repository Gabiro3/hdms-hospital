import type { MigrationSource, MigrationTarget } from "@/services/data-migration-service"

type SchemaMapping = {
  mappings: Record<string, string>
  unmappedFields: string[]
}

/**
 * Maps fields from source schema to target database schema
 */
export function mapSchemaToDatabase(
  sourceFields: string[],
  source: MigrationSource,
  target: MigrationTarget,
): SchemaMapping {
  const mappings: Record<string, string> = {}
  const unmappedFields: string[] = []

  // Define known mappings for each source-target combination
  const knownMappings = getKnownMappings(source, target)

  // Apply mappings for each source field
  for (const field of sourceFields) {
    if (field in knownMappings) {
      mappings[field] = knownMappings[field]
    } else {
      unmappedFields.push(field)
    }
  }

  return { mappings, unmappedFields }
}

/**
 * Returns known mappings between source and target schemas
 */
function getKnownMappings(source: MigrationSource, target: MigrationTarget): Record<string, string> {
  // Define mappings for each source-target combination
  switch (`${source}-${target}`) {
    case "patient_tbl-patients":
      return {
        id_patient: "id",
        nif: "identification_card_number", // Map NIF to ICN
        first_name: "first_name",
        surname1: "last_name",
        surname2: "middle_name",
        address: "address",
        phone_contact: "phone",
        sex: "gender",
        race: "ethnicity",
        birth_date: "date_of_birth",
        birth_place: "place_of_birth",
        decease_date: "date_of_death",
        nts: "health_card_number",
        nss: "social_security_number",
        insurance_company: "insurance_provider",
      }

    case "medical_test_tbl-lab_results":
      return {
        id_test: "id",
        id_problem: "diagnosis_id",
        document_type: "result_type",
        path_filename: "file_path",
      }

    case "history_tbl-patients":
      return {
        id_patient: "id",
        birth_growth: "medical_history",
        habits: "lifestyle",
        medicinal_intolerance: "allergies",
        mental_illness: "mental_health_history",
        family_illness: "family_medical_history",
      }

    case "record_log_tbl-activity_logs":
      return {
        id_user: "user_id",
        login: "username",
        access_date: "timestamp",
        table_name: "resource_type",
        operation: "action",
        affected_row: "details",
      }

    default:
      return {}
  }
}

/**
 * Suggests possible mappings for unmapped fields
 */
export function suggestMappings(unmappedFields: string[], target: MigrationTarget): Record<string, string[]> {
  const suggestions: Record<string, string[]> = {}

  // Get available target fields
  const targetFields = getTargetFields(target)

  // For each unmapped field, suggest similar target fields
  for (const field of unmappedFields) {
    suggestions[field] = findSimilarFields(field, targetFields)
  }

  return suggestions
}

/**
 * Returns available fields for a target table
 */
function getTargetFields(target: MigrationTarget): string[] {
  switch (target) {
    case "patients":
      return [
        "id",
        "first_name",
        "last_name",
        "middle_name",
        "date_of_birth",
        "gender",
        "address",
        "phone",
        "email",
        "identification_card_number",
        "health_card_number",
        "social_security_number",
        "insurance_provider",
        "blood_type",
        "allergies",
        "medical_history",
        "family_medical_history",
        "emergency_contact_name",
        "emergency_contact_phone",
        "created_at",
        "updated_at",
        "hospital_id",
        "ethnicity",
        "place_of_birth",
        "date_of_death",
        "lifestyle",
        "mental_health_history",
        "open_metadata",
      ]

    case "lab_results":
      return [
        "id",
        "patient_id",
        "diagnosis_id",
        "test_number",
        "test_date",
        "result_type",
        "result_value",
        "result_unit",
        "reference_range",
        "is_abnormal",
        "notes",
        "performed_by",
        "verified_by",
        "file_path",
        "created_at",
        "updated_at",
        "hospital_id",
        "open_metadata",
      ]

    default:
      return []
  }
}

/**
 * Finds similar fields based on string similarity
 */
function findSimilarFields(field: string, targetFields: string[]): string[] {
  // Simple implementation - can be improved with more sophisticated algorithms
  return targetFields
    .filter((target) => {
      // Check if field is substring of target or vice versa
      return target.includes(field) || field.includes(target) || levenshteinDistance(field, target) <= 3 // Allow up to 3 character differences
    })
    .slice(0, 5) // Return top 5 suggestions
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}
