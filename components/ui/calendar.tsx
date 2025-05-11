"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format, parse, isValid } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type CalendarProps = Omit<React.ComponentProps<typeof DayPicker>, "onSelect" | "mode"> & {
  showInput?: boolean
  onSelect?: (date: Date | undefined) => void
}


function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  showInput = false,
  selected,
  onSelect,
  ...props
}: CalendarProps) {
  const [inputValue, setInputValue] = React.useState<string>(() => {
    if (selected instanceof Date) {
      return format(selected, "yyyy-MM-dd")
    }
    return ""
  })

  // Update input when selected date changes
  React.useEffect(() => {
    if (selected instanceof Date) {
      setInputValue(format(selected, "yyyy-MM-dd"))
    } else {
      setInputValue("")
    }
  }, [selected])

  // Handle manual date input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if (value && onSelect) {
      const parsedDate = parse(value, "yyyy-MM-dd", new Date())
      if (isValid(parsedDate)) {
        onSelect(parsedDate)
      }
    }
  }

  // Handle input blur
  const handleInputBlur = () => {
    if (inputValue && !isValid(parse(inputValue, "yyyy-MM-dd", new Date()))) {
      // Reset to selected date if input is invalid
      if (selected instanceof Date) {
        setInputValue(format(selected, "yyyy-MM-dd"))
      } else {
        setInputValue("")
      }
    }
  }

  return (
    <div className="space-y-4">
      {showInput && (
        <div className="space-y-2">
          <Label htmlFor="date-input">Enter date</Label>
          <Input
            id="date-input"
            type="date"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="YYYY-MM-DD"
            className="w-full"
          />
        </div>
      )}
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        }}
        selected={selected}
        onSelect={onSelect}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
