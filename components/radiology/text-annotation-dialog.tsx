"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TextAnnotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (text: string) => void
}

export default function TextAnnotationDialog({ open, onOpenChange, onSave }: TextAnnotationDialogProps) {
  const [text, setText] = useState("")
  const [fontSize, setFontSize] = useState("16")
  const [color, setColor] = useState("#ff0000")

  const handleSave = () => {
    if (text.trim()) {
      onSave(text)
      setText("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Text Annotation</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="text" className="text-right">
              Text
            </Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="col-span-3"
              placeholder="Enter annotation text"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fontSize" className="text-right">
              Font Size
            </Label>
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger id="fontSize" className="col-span-3">
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">Small (12px)</SelectItem>
                <SelectItem value="16">Medium (16px)</SelectItem>
                <SelectItem value="20">Large (20px)</SelectItem>
                <SelectItem value="24">Extra Large (24px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-8 p-0"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!text.trim()}>
            Add Text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
