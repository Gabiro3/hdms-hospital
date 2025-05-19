"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MigrationTarget } from "@/services/data-migration-service"
import { suggestMappings } from "@/lib/utils/schema-mapper"

type ColumnMapperProps = {
  sourceFields: string[]
  mappings: Record<string, string>
  target: MigrationTarget
  onMappingChange: (sourceField: string, targetField: string) => void
}

export default function ColumnMapper({ sourceFields, mappings, target, onMappingChange }: ColumnMapperProps) {
  // Use memoized target fields to prevent unnecessary recalculations
  const targetFields = useMemo(() => getTargetFields(target), [target])

  // Use memoized suggestions to prevent unnecessary recalculations
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({})

  // Use internal state to prevent infinite loops
  const [internalMappings, setInternalMappings] = useState<Record<string, string>>({})

  // Memoize unmapped fields calculation
  const unmappedFields = useMemo(() => {
    return sourceFields.filter((field) => !internalMappings[field])
  }, [sourceFields, internalMappings])

  // Memoize mapped fields calculation
  const mappedFields = useMemo(() => {
    return sourceFields.filter((field) => internalMappings[field])
  }, [sourceFields, internalMappings])

  // Initialize internal mappings from props only once
  useEffect(() => {
    setInternalMappings(mappings)
  }, []) // Empty dependency array means this runs once on mount

  // Generate suggestions for unmapped fields
  useEffect(() => {
    if (unmappedFields.length > 0) {
      const newSuggestions = suggestMappings(unmappedFields, target)
      setSuggestions(newSuggestions)
    }
  }, [unmappedFields, target])

  // Memoized handler to prevent recreation on every render
  const handleMappingChange = useCallback(
    (sourceField: string, targetField: string) => {
      // Update internal state
      setInternalMappings((prev) => {
        const newMappings = {
          ...prev,
          [sourceField]: targetField === "do_not_map" ? "" : targetField,
        }

        // Notify parent component via callback, but don't depend on its execution
        // This breaks the circular dependency
        setTimeout(() => {
          onMappingChange(sourceField, targetField === "do_not_map" ? "" : targetField)
        }, 0)

        return newMappings
      })
    },
    [onMappingChange],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Column Mappings</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10">
            {mappedFields.length} Mapped
          </Badge>
          <Badge variant="outline" className="bg-muted">
            {unmappedFields.length} Unmapped
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {/* Mapped Fields Section */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-medium mb-4">Mapped Fields</h4>
              {mappedFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fields mapped yet.</p>
              ) : (
                <div className="grid gap-4">
                  {mappedFields.map((field) => (
                    <MappedFieldRow
                      key={field}
                      field={field}
                      mapping={internalMappings[field]}
                      targetFields={targetFields}
                      onMappingChange={handleMappingChange}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unmapped Fields Section */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-medium mb-4">Unmapped Fields</h4>
              {unmappedFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">All fields are mapped.</p>
              ) : (
                <div className="grid gap-4">
                  {unmappedFields.map((field) => (
                    <UnmappedFieldRow
                      key={field}
                      field={field}
                      suggestions={suggestions[field] || []}
                      targetFields={targetFields}
                      onMappingChange={handleMappingChange}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground mt-4">
            <p>
              <strong>Note:</strong> Unmapped fields will be stored in the <code>open_metadata</code> column as JSON
              data, preserving all original information.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// Extracted component for mapped field rows to reduce re-renders
function MappedFieldRow({
  field,
  mapping,
  targetFields,
  onMappingChange,
}: {
  field: string
  mapping: string
  targetFields: string[]
  onMappingChange: (field: string, target: string) => void
}) {
  return (
    <div className="grid grid-cols-5 items-center gap-4">
      <div className="col-span-2">
        <Label className="text-sm">{field}</Label>
      </div>
      <div className="col-span-3">
        <Select defaultValue={mapping} onValueChange={(value) => onMappingChange(field, value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select target field">{mapping}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="do_not_map">-- Do not map --</SelectItem>
            {targetFields.map((targetField) => (
              <SelectItem key={targetField} value={targetField}>
                {targetField}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Extracted component for unmapped field rows to reduce re-renders
function UnmappedFieldRow({
  field,
  suggestions,
  targetFields,
  onMappingChange,
}: {
  field: string
  suggestions: string[]
  targetFields: string[]
  onMappingChange: (field: string, target: string) => void
}) {
  return (
    <div className="grid grid-cols-5 items-center gap-4">
      <div className="col-span-2">
        <Label className="text-sm">{field}</Label>
        {suggestions.length > 0 && <p className="text-xs text-muted-foreground mt-1">Suggested: {suggestions[0]}</p>}
      </div>
      <div className="col-span-3">
        <Select defaultValue="open_metadata" onValueChange={(value) => onMappingChange(field, value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select target field">-- Store in open_metadata --</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open_metadata">-- Store in open_metadata --</SelectItem>
            {targetFields.map((targetField) => (
              <SelectItem key={targetField} value={targetField}>
                {targetField}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
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
      ]

    default:
      return []
  }
}
