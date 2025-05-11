"use server";

import { GoogleGenAI, type GenerationConfig } from "@google/genai";

// Define types for structured AI response
export interface Source {
  title: string;
  url: string;
  publication?: string;
  description?: string;
  date?: string;
}

export interface AIResponse {
  text: string;
  sources: Source[];
}

// Instantiate the GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

// System prompt for medical assistant
const SYSTEM_PROMPT = `
You are MedAssist AI, a medical assistant for healthcare professionals.

- Provide concise, evidence-based responses to medical queries
- Include citations to medical literature and research
- Format your response in Markdown
- For each claim or piece of information, provide a numbered citation
- At the end of your response, list all sources with their titles, publications, and URLs
- Only cite reputable medical sources like peer-reviewed journals, medical textbooks, or official guidelines
- If you're uncertain, clearly state the limitations of your knowledge
- Do not provide definitive medical advice, but rather evidence-based information to support clinical decision-making
- Remember that you are assisting medical professionals, so you can use appropriate medical terminology
`;

// AI call function
export async function getAIResponse(query: string): Promise<AIResponse> {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\n${query}` }],
          },
        ],
      });
      
      
      const text = await response.text ?? "";
      
    
    // Simple regex-based source extraction
    const sources: Source[] = [];
    const sourceRegex = /\[(\d+)\]\s*([^:]+):\s*(https?:\/\/[^\s]+)/g;
    let match;

    while ((match = sourceRegex.exec(text)) !== null) {
      sources.push({
        title: match[2].trim(),
        url: match[3].trim(),
      });
    }

    return { text, sources };
  } catch (err) {
    console.error("AI generation failed:", err);
    throw new Error("AI generation failed");
  }
}

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

export interface ChatMessage {
  id: string
  conversation_id: string
  role: "user" | "assistant"
  content: string
  sources?: any
  code?: {
    language: string
    content: string
  }
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

// Create a new conversation
export async function createConversation(userId: string, title = "New conversation"): Promise<Conversation | null> {
  try {
    const supabase = createServerSupabaseClient()

    const conversationId = uuidv4()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({
        id: conversationId,
        user_id: userId,
        title,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating conversation:", error)
      return null
    }

    return data as Conversation
  } catch (error) {
    console.error("Error in createConversation:", error)
    return null
  }
}

// Get all conversations for a user
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error getting user conversations:", error)
      return []
    }

    return data as Conversation[]
  } catch (error) {
    console.error("Error in getUserConversations:", error)
    return []
  }
}

// Get a specific conversation
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("ai_conversations").select("*").eq("id", conversationId).single()

    if (error) {
      console.error("Error getting conversation:", error)
      return null
    }

    return data as Conversation
  } catch (error) {
    console.error("Error in getConversation:", error)
    return null
  }
}

// Update conversation title
export async function updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("ai_conversations")
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)

    if (error) {
      console.error("Error updating conversation title:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateConversationTitle:", error)
    return false
  }
}

// Delete a conversation and its messages
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    // Delete all messages in the conversation
    const { error: messagesError } = await supabase.from("ai_messages").delete().eq("conversation_id", conversationId)

    if (messagesError) {
      console.error("Error deleting conversation messages:", messagesError)
      return false
    }

    // Delete the conversation
    const { error: conversationError } = await supabase.from("ai_conversations").delete().eq("id", conversationId)

    if (conversationError) {
      console.error("Error deleting conversation:", conversationError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteConversation:", error)
    return false
  }
}

// Add a message to a conversation
export async function addMessageToConversation(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  sources?: any,
  code?: { language: string; content: string },
): Promise<ChatMessage | null> {
  try {
    const supabase = createServerSupabaseClient()

    const messageId = uuidv4()
    const now = new Date().toISOString()

    // Add the message
    const { data, error } = await supabase
      .from("ai_messages")
      .insert({
        id: messageId,
        conversation_id: conversationId,
        role,
        content,
        sources,
        code,
        created_at: now,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding message:", error)
      return null
    }

    // Update the conversation's updated_at timestamp
    await supabase.from("ai_conversations").update({ updated_at: now }).eq("id", conversationId)

    return data as ChatMessage
  } catch (error) {
    console.error("Error in addMessageToConversation:", error)
    return null
  }
}

// Get all messages for a conversation
export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error getting conversation messages:", error)
      return []
    }

    return data as ChatMessage[]
  } catch (error) {
    console.error("Error in getConversationMessages:", error)
    return []
  }
}

// Generate a title for a conversation based on the first user message
export async function generateConversationTitle(conversationId: string, firstMessage: string): Promise<boolean> {
  try {
    // Generate a title based on the first message
    // For simplicity, we'll just use the first few words of the message
    let title = firstMessage.split(" ").slice(0, 5).join(" ")

    // Add ellipsis if the message is longer than 5 words
    if (firstMessage.split(" ").length > 5) {
      title += "..."
    }

    // Update the conversation title
    return await updateConversationTitle(conversationId, title)
  } catch (error) {
    console.error("Error in generateConversationTitle:", error)
    return false
  }
}
