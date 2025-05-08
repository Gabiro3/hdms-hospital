"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, UserCheck, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { shareRadiologyStudy, getDoctorColleagues } from "@/services/radiology-service"

interface SharedStudiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  study: any
  currentUser: any
}

const shareFormSchema = z.object({
  colleagues: z.array(z.string()).min(1, "Select at least one colleague to share with"),
  shareType: z.enum(["view", "collaborate"], {
    required_error: "Please select sharing permissions",
  }),
  message: z.string().optional(),
  notifyByEmail: z.boolean().default(false),
})

type ShareFormValues = z.infer<typeof shareFormSchema>

export default function SharedStudiesDialog({ open, onOpenChange, study, currentUser }: SharedStudiesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [colleagues, setColleagues] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<ShareFormValues>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      colleagues: [],
      shareType: "view",
      message: "",
      notifyByEmail: true,
    },
  })

  // Fetch colleagues list when dialog opens
  useEffect(() => {
    if (open) {
      fetchColleagues()
    }
  }, [open])

  const fetchColleagues = async () => {
    setIsLoading(true)
    try {
      const { colleagues: colleaguesList, error } = await getDoctorColleagues(currentUser.id, currentUser.hospital_id)

      if (error) {
        throw new Error(error)
      }

      setColleagues(colleaguesList || [])
    } catch (error) {
      console.error("Error fetching colleagues:", error)
      toast({
        title: "Error",
        description: "Failed to load colleagues. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter colleagues based on search query
  const filteredColleagues = colleagues.filter(
    (colleague) =>
      colleague.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      colleague.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      colleague.expertise?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const onSubmit = async (values: ShareFormValues) => {
    try {
      setIsLoading(true)

      // Share with each selected colleague
      const sharePromises = values.colleagues.map((colleagueId) =>
        shareRadiologyStudy({
          study_id: study.id,
          shared_by: currentUser.id,
          shared_with: colleagueId,
          can_edit: values.shareType === "collaborate",
          message: values.message || null,
          notify_by_email: values.notifyByEmail,
        }),
      )

      const results = await Promise.all(sharePromises)
      const errors = results.filter((r) => r.error).map((r) => r.error)

      if (errors.length > 0) {
        throw new Error(`Failed to share with some colleagues: ${errors.join(", ")}`)
      }

      toast({
        title: "Study Shared Successfully",
        description: `Shared with ${values.colleagues.length} colleague${values.colleagues.length > 1 ? "s" : ""}`,
      })

      // Close dialog and refresh data
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error sharing study:", error)
      toast({
        title: "Error",
        description: "Failed to share the study. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Radiology Study</DialogTitle>
          <DialogDescription>
            Share this study with other doctors in your hospital. They will be notified when you share it.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search colleagues by name or expertise..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredColleagues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <UserPlus className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground font-medium">No colleagues found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery ? "Try a different search term" : "No colleagues available to share with"}
                  </p>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="colleagues"
                  render={() => (
                    <FormItem>
                      <FormLabel>Select colleagues to share with</FormLabel>
                      <ScrollArea className="h-[180px] border rounded-md">
                        <div className="p-4 space-y-2">
                          {filteredColleagues.map((colleague) => (
                            <FormField
                              key={colleague.id}
                              control={form.control}
                              name="colleagues"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(colleague.id)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...field.value, colleague.id]
                                          : field.value.filter((value) => value !== colleague.id)
                                        field.onChange(newValue)
                                      }}
                                    />
                                  </FormControl>
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {colleague.full_name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium leading-none">{colleague.full_name}</p>
                                      <p className="text-xs text-muted-foreground">{colleague.expertise || "Doctor"}</p>
                                    </div>
                                  </div>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="shareType"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Sharing Permissions</FormLabel>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="view" />
                        </FormControl>
                        <FormLabel className="font-normal">View only (They can only view the study)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="collaborate" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Collaborate (They can edit and contribute to reports)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add a message to your colleagues" {...field} />
                    </FormControl>
                    <FormDescription>This message will be included in the notification.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyByEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Notify colleagues by email when sharing</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || colleagues.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Share Study
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
