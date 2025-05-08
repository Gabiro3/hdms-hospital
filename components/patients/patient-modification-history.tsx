"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Clock, User, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface PatientModificationHistoryProps {
  history: any[]
  isLoading: boolean
}

export default function PatientModificationHistory({ history, isLoading }: PatientModificationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Filter history based on search query
  const filteredHistory = history.filter((item) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      item.user_name?.toLowerCase().includes(searchLower) ||
      Object.keys(item.changes || {}).some((key) => key.toLowerCase().includes(searchLower)) ||
      Object.values(item.changes || {}).some(
        (change: any) =>
          String(change.previous).toLowerCase().includes(searchLower) ||
          String(change.current).toLowerCase().includes(searchLower),
      )
    )
  })

  // Toggle expanded state for an item
  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Format field name for display
  const formatFieldName = (fieldName: string) => {
    // Convert camelCase to Title Case with spaces
    return fieldName.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <p>Loading modification history...</p>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">No modification history available for this patient.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search history..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <div className="p-4 space-y-4">
          {filteredHistory.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No results match your search criteria.</p>
          ) : (
            filteredHistory.map((item, index) => (
              <Collapsible
                key={item.id || index}
                open={expandedItems[item.id || index]}
                onOpenChange={() => toggleExpanded(item.id || index)}
                className="border rounded-md"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10">
                      {format(parseISO(item.timestamp), "MMM d, yyyy")}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {format(parseISO(item.timestamp), "h:mm a")}
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="h-3.5 w-3.5 mr-1" />
                      {item.user_name || "Unknown User"}
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {expandedItems[item.id || index] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0 border-t">
                    <div className="space-y-2 mt-2">
                      {Object.entries(item.changes || {}).map(([field, change]: [string, any], i) => (
                        <div key={i} className="grid grid-cols-3 gap-2 text-sm">
                          <div className="font-medium">{formatFieldName(field)}</div>
                          <div
                            className={cn(
                              "line-through",
                              change.previous ? "text-red-500" : "text-muted-foreground italic",
                            )}
                          >
                            {change.previous || "Not set"}
                          </div>
                          <div className={cn(change.current ? "text-green-600" : "text-muted-foreground italic")}>
                            {change.current || "Removed"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
