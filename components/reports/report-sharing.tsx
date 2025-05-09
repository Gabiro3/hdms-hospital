"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Check, ChevronsUpDown, Share2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { shareReport, removeShare } from "@/services/report-service"

interface ReportSharingProps {
  reportId: string
  colleagues: any[]
  existingShares: any[]
  currentUserId: string
  onShareComplete: () => void
}

export default function ReportSharing({
  reportId,
  colleagues,
  existingShares,
  currentUserId,
  onShareComplete,
}: ReportSharingProps) {
  const [open, setOpen] = useState(false)
  const [selectedColleague, setSelectedColleague] = useState<string | null>(null)
  const [allowEdit, setAllowEdit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shares, setShares] = useState(existingShares)

  // Filter out colleagues who are already shared with
  const filteredColleagues = colleagues.filter(
    (colleague) => !shares.some((share) => share.shared_with === colleague.id),
  )

  const handleShare = async () => {
    if (!selectedColleague) return

    setIsSubmitting(true)
    try {
      const { share, error } = await shareReport({
        report_id: reportId,
        shared_by: currentUserId,
        shared_with: selectedColleague,
        can_edit: allowEdit,
      })

      if (error) throw new Error(error)

      // Find the colleague details
      const colleague = colleagues.find((c) => c.id === selectedColleague)

      // Add the new share to state with user details
      if (share) {
        setShares([
          ...shares,
          {
            ...share,
            shared_with_user: colleague,
          },
        ])
      }

      setSelectedColleague(null)
      setAllowEdit(false)
      setOpen(false)

      toast({
        title: "Report Shared",
        description: `Report has been shared with ${colleague?.full_name || "colleague"}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    setIsSubmitting(true)
    try {
      const { error } = await removeShare(shareId)
      if (error) throw new Error(error)

      // Remove the share from state
      setShares(shares.filter((share) => share.id !== shareId))

      toast({
        title: "Share Removed",
        description: "The share has been removed successfully.",
      })
    } catch (error) {
      console.error("Error removing share:", error)
      toast({
        title: "Error",
        description: "Failed to remove share. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Share with Colleagues</p>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between md:w-[250px]">
                {selectedColleague
                  ? colleagues.find((colleague) => colleague.id === selectedColleague)?.full_name ||
                    "Select a colleague"
                  : "Select a colleague"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search colleagues..." />
                <CommandList>
                  <CommandEmpty>No colleagues found.</CommandEmpty>
                  <CommandGroup>
                    {filteredColleagues.map((colleague) => (
                      <CommandItem
                        key={colleague.id}
                        value={colleague.id}
                        onSelect={() => {
                          setSelectedColleague(selectedColleague === colleague.id ? null : colleague.id)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedColleague === colleague.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{colleague.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{colleague.full_name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow-edit"
            checked={allowEdit}
            onCheckedChange={(checked) => setAllowEdit(checked as boolean)}
          />
          <label htmlFor="allow-edit" className="text-sm text-muted-foreground">
            Allow editing
          </label>
        </div>

        <Button onClick={handleShare} disabled={!selectedColleague || isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
              Sharing...
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              Share Report
            </>
          )}
        </Button>
      </div>

      {shares.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Currently Shared With</p>
          <div className="space-y-2">
            {shares.map((share) => (
              <div key={share.id} className="flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {share.shared_with_user?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{share.shared_with_user?.full_name || "Unknown"}</span>
                  {share.can_edit && (
                    <Badge variant="outline" className="border-blue-500 bg-blue-50 text-blue-700 text-xs">
                      Can Edit
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemoveShare(share.id)}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onShareComplete}>
          Done
        </Button>
      </div>
    </div>
  )
}
