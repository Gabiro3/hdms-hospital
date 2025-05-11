"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "./chat-interface"
import { BrainCircuit } from "lucide-react"

export function AskAIButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 p-0 flex items-center justify-center"
        onClick={() => setIsOpen(true)}
      >
        <BrainCircuit className="h-6 w-6" />
        <span className="sr-only">Ask AI</span>
      </Button>

      <ChatInterface isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
