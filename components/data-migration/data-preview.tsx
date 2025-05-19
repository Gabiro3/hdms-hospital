"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Check, ChevronLeft, ChevronRight, Database, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { MigrationPreviewData, MigrationResult } from "@/services/data-migration-service"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import ColumnMapper from "./column-mapper"

type DataPreviewProps = {
  previewData: MigrationPreviewData
  onConfirm: (mappings: Record<string, string>) => Promise<void>
  onBack: () => void
  isProcessing: boolean
  result?: MigrationResult
}

export default function DataPreview({ previewData, onConfirm, onBack, isProcessing, result }: DataPreviewProps) {
  const [mappings, setMappings] = useState<Record<string, string>>(previewData.mappings)
  const [activeTab, setActiveTab] = useState<string>("preview")
  const router = useRouter()

  const handleMappingChange = (sourceField: string, targetField: string) => {
    setMappings((prev) => ({
      ...prev,
      [sourceField]: targetField,
    }))
  }

  const handleConfirm = async () => {
    await onConfirm(mappings)
    setActiveTab("result")
  }

  const getFieldsToDisplay = () => {
    // Get all fields from the first record
    if (previewData.data.length === 0) return []

    const allFields = Object.keys(previewData.data[0])

    // Sort fields: mapped fields first, then unmapped fields
    return allFields.sort((a, b) => {
      const aIsMapped = mappings[a] !== undefined
      const bIsMapped = mappings[b] !== undefined

      if (aIsMapped && !bIsMapped) return -1
      if (!aIsMapped && bIsMapped) return 1
      return a.localeCompare(b)
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Migration Preview</CardTitle>
        <CardDescription>
          Review the data before importing it into the system.
          {previewData.unmappedFields.length > 0 && (
            <span className="block mt-1 text-amber-500">
              Some fields could not be automatically mapped and will be stored in the open_metadata column.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="preview" disabled={activeTab === "result"}>
              Data Preview
            </TabsTrigger>
            <TabsTrigger value="mapping" disabled={activeTab === "result"}>
              Column Mapping
            </TabsTrigger>
            {result && <TabsTrigger value="result">Migration Result</TabsTrigger>}
          </TabsList>

          <TabsContent value="preview">
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Preview</AlertTitle>
                <AlertDescription>
                  Showing the first {previewData.data.length} records from your SQL file.
                  {previewData.data.length === 10 && " There may be more records in the actual file."}
                </AlertDescription>
              </Alert>

              <ScrollArea className="h-[400px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      {getFieldsToDisplay().map((field) => (
                        <TableHead key={field}>
                          {field}
                          {mappings[field] && (
                            <Badge variant="outline" className="ml-2">
                              → {mappings[field]}
                            </Badge>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.data.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        {getFieldsToDisplay().map((field) => (
                          <TableCell key={field}>
                            {record[field] !== null && record[field] !== undefined ? (
                              String(record[field])
                            ) : (
                              <span className="text-muted-foreground italic">null</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="mapping">
            <ColumnMapper
              sourceFields={Object.keys(previewData.data[0] || {})}
              mappings={mappings}
              target={previewData.target}
              onMappingChange={handleMappingChange}
            />
          </TabsContent>

          <TabsContent value="result">
            {result && (
              <div className="space-y-4">
                <Alert variant={result.success ? "default" : "destructive"}>
                  {result.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{result.success ? "Migration Successful" : "Migration Completed with Issues"}</AlertTitle>
                  <AlertDescription>
                    {result.recordsProcessed} records processed:
                    <ul className="list-disc list-inside mt-2">
                      <li>{result.recordsInserted} records inserted</li>
                      <li>{result.recordsUpdated} records updated</li>
                      <li>{result.recordsSkipped} records skipped</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Errors ({result.errors.length})</h3>
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      <ul className="space-y-2">
                        {result.errors.map((error, index) => (
                          <li key={index} className="text-sm text-destructive">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <Button onClick={() => router.push("/dashboard")} className="mx-auto">
                    Return to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {activeTab !== "result" && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack} disabled={isProcessing}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {activeTab === "preview" ? (
            <Button onClick={() => setActiveTab("mapping")} disabled={isProcessing}>
              Configure Mappings
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Import Data
                </>
              )}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
