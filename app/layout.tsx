import type React from "react"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationsProvider } from "@/hooks/use-nofitications"
import ToastNotification from "@/components/notifications/toast-notification"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Hospital Diagnosis Management System",
  description: "A comprehensive system for managing hospital diagnoses",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <NotificationsProvider>
            <AuthProvider>{children}</AuthProvider>
            <ToastNotification />
          </NotificationsProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
