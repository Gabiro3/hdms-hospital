"use client"

import { MessageSquare } from "lucide-react"

interface EmptyStateProps {
  onExampleClick?: (message: string) => void
  onStartNewConversation: (message?: string | undefined) => void
}

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  const examples = [
    "What are the latest treatment guidelines for hypertension?",
    "Explain the differential diagnosis for chest pain",
    "What are the common side effects of metformin?",
    "How should I interpret elevated troponin levels?",
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4 text-center">
      <div className="mb-8">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">MedGPT</h2>
        <p className="text-gray-500">Your AI medical assistant powered by Gemini 2.5 Flash</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="col-span-1 md:col-span-3">
          <h3 className="font-medium mb-3 text-center">Examples</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {examples.map((example, index) => (
              <button
                key={index}
                className="text-left p-3 border rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => onExampleClick && onExampleClick(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3 text-center">Capabilities</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="bg-gray-100 p-1 rounded">•</span>
              <span>Remembers what was said earlier in the conversation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-gray-100 p-1 rounded">•</span>
              <span>Access user-provided files and images</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-gray-100 p-1 rounded">•</span>
              <span>Provides citations for medical information</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium mb-3 text-center">Limitations</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="bg-gray-100 p-1 rounded">•</span>
              <span>May occasionally generate incorrect information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-gray-100 p-1 rounded">•</span>
              <span>May occasionally produce harmful or biased content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-gray-100 p-1 rounded">•</span>
              <span>Limited knowledge of world events after 2023</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
