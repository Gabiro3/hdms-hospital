import type { MigrationTarget } from "@/services/data-migration-service"

type ValidationError = {
  field: string
  message: string
}

/**
 * Validates data against target schema
 */
export function validateData(data: any, target: MigrationTarget): ValidationError[] {
  const errors: ValidationError[] = []

  // Get validation rules for target
  const validationRules = getValidationRules(target)

  // Apply validation rules
  for (const [field, rule] of Object.entries(validationRules)) {
    if (field in data) {
      const value = data[field]
      const fieldErrors = validateField(value, rule, field)
      errors.push(...fieldErrors)
    }
  }

  return errors
}

/**
 * Returns validation rules for a target table
 */
function getValidationRules(target: MigrationTarget): Record<string, ValidationRule> {
  switch (target) {
    case "patients":
      return {
        first_name: { required: true, type: "string", maxLength: 50 },
        last_name: { required: true, type: "string", maxLength: 50 },
        date_of_birth: { required: false, type: "date" },
        identification_card_number: { required: true, type: "string", maxLength: 20 },
        gender: { required: false, type: "string", enum: ["male", "female", "other", "M", "F", "O", "V", "H"] },
        email: { required: false, type: "email" },
        phone: { required: false, type: "string" },
      }

    case "lab_results":
      return {
        patient_id: { required: true, type: "number" },
        test_number: { required: true, type: "string" },
        test_date: { required: false, type: "date" },
        result_type: { required: true, type: "string" },
      }

    default:
      return {}
  }
}

/**
 * Validates a field against a rule
 */
function validateField(value: any, rule: ValidationRule, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = []

  // Check required
  if (rule.required && (value === undefined || value === null || value === "")) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`,
    })
    return errors // Skip other validations if required field is missing
  }

  // Skip validation for null/undefined optional fields
  if ((value === undefined || value === null) && !rule.required) {
    return errors
  }

  // Check type
  switch (rule.type) {
    case "string":
      if (typeof value !== "string") {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be a string`,
        })
      } else {
        // Check max length
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be at most ${rule.maxLength} characters`,
          })
        }

        // Check enum values
        if (rule.enum && !rule.enum.includes(value)) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be one of: ${rule.enum.join(", ")}`,
          })
        }
      }
      break

    case "number":
      if (typeof value !== "number" && isNaN(Number(value))) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be a number`,
        })
      }
      break

    case "date":
      if (!isValidDate(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid date`,
        })
      }
      break

    case "email":
      if (typeof value === "string" && !isValidEmail(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid email address`,
        })
      }
      break
  }

  return errors
}

/**
 * Checks if a value is a valid date
 */
function isValidDate(value: any): boolean {
  if (value instanceof Date) return !isNaN(value.getTime())

  if (typeof value === "string") {
    // Try to parse date string
    const date = new Date(value)
    return !isNaN(date.getTime())
  }

  return false
}

/**
 * Checks if a string is a valid email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validation rule type
 */
type ValidationRule = {
  required: boolean
  type: "string" | "number" | "date" | "email"
  maxLength?: number
  enum?: string[]
}
