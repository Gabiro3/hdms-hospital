"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  format?: string
}

export function DatePicker({
  date,
  setDate,
  className,
  placeholder = "Select date",
  disabled = false,
  format: dateFormat = "PPP",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState<string>(date ? format(date, "yyyy-MM-dd") : "")

  // Update input value when date changes externally
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "yyyy-MM-dd"))
    } else {
      setInputValue("")
    }
  }, [date])

  // Handle manual date input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Try to parse the date
    if (value) {
      const parsedDate = parse(value, "yyyy-MM-dd", new Date())
      if (isValid(parsedDate)) {
        setDate(parsedDate)
      }
    } else {
      setDate(undefined)
    }
  }

  // Handle input blur
  const handleInputBlur = () => {
    if (inputValue && !date) {
      // If input has value but date is invalid, reset input
      setInputValue(date ? format(date, "yyyy-MM-dd") : "")
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex gap-2">
          <Input
            type="date"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-full"
            disabled={disabled}
            placeholder="YYYY-MM-DD"
          />
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn("w-10 p-0", !date && "text-muted-foreground")}
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            selected={date}
            onSelect={(date) => {
              setDate(date)
              setIsOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
