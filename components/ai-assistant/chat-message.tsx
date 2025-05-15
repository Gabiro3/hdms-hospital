"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Check, Copy, ThumbsUp, ThumbsDown } from "lucide-react"
import type { Source } from "@/services/ai-service"
import ReactMarkdown from "react-markdown"

export interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  id?: string
  sources?: Source[]
  code?: {
    language: string
    content: string
  }
  isLoading?: boolean
}

export function ChatMessage({ role, content, id, sources, code, isLoading = false }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("response")
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type)
    // Here you would typically send the feedback to your backend
  }

  // Check if the message has code
  const hasCode = code && code.content

  // Check if the message has sources
  const hasSources = sources && Array.isArray(sources) && sources.length > 0

  return (
    <div className={`py-8 px-4 md:px-6 ${role === "assistant" ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-4xl mx-auto flex gap-4 md:gap-6">
        <div className="flex-shrink-0">
          {role === "user" ? (
            <Avatar>
              <AvatarImage src="/user-profile.png" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar>
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex justify-between">
            <div className="font-medium">
              {role === "user" ? "You" : "MedGPT"}
              {role === "assistant" && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">BETA</span>
              )}
            </div>
            {role === "assistant" && !isLoading && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-700"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
                <div className="flex border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-r-none ${
                      feedback === "up" ? "bg-green-50 text-green-600" : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => handleFeedback("up")}
                  >
                    <ThumbsUp size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-l-none border-l ${
                      feedback === "down" ? "bg-red-50 text-red-600" : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => handleFeedback("down")}
                  >
                    <ThumbsDown size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
            </div>
          ) : role === "assistant" && (hasSources || hasCode) ? (
            <Tabs defaultValue="response" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="response">Response</TabsTrigger>
                {hasSources && <TabsTrigger value="sources">Sources ({sources?.length})</TabsTrigger>}
              </TabsList>
              <TabsContent value="response" className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </TabsContent>
              {hasSources && (
                <TabsContent value="sources" className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <h3>Sources</h3>
                    <ul className="space-y-3">
                      {sources?.map((source, index) => (
                        <li key={index} className="border rounded-md p-3">
                          <div className="font-medium">{source.title}</div>
                          {source.publication && <div className="text-sm text-gray-500">{source.publication}</div>}
                          {source.description && <div className="mt-1 text-sm">{source.description}</div>}
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                          >
                            View source
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
