"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { AskAIButton } from "./ask-ai-button"

interface AIAssistantContextType {
  openAssistant: () => void
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined)

export function useAIAssistant() {
  const context = useContext(AIAssistantContext)
  if (!context) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider")
  }
  return context
}

interface AIAssistantProviderProps {
  children: ReactNode
}

export function AIAssistantProvider({ children }: AIAssistantProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const openAssistant = () => {
    setIsOpen(true)
  }

  return (
    <AIAssistantContext.Provider value={{ openAssistant }}>
      {children}
      <AskAIButton />
    </AIAssistantContext.Provider>
  )
}
