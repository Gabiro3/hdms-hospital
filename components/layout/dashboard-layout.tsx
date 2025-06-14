"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  FileText,
  Users,
  Hospital,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  HelpCircle,
  FileBarChartIcon,
  FileArchive,
  FlaskConical,
  ComputerIcon,
  AmpersandsIcon,
  Settings2Icon,
  SettingsIcon,
  HeartCrackIcon,
  HeartPulseIcon,
  BrainIcon,
  BrainCircuitIcon,
  DatabaseBackup
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/hooks/use-nofitications"
import NotificationDialog from "@/components/notifications/notification-dialog"
import { AskAIButton } from "../ai-assistant/ask-ai-button"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const { unreadCount, refreshNotifications } = useNotifications()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Get user profile data
        const { data } = await supabase.from("users").select("*, hospitals(name)").eq("id", user.id).single()
        setUserProfile(data)
      }

      setLoading(false)

      if (!user) {
        router.push("/login")
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login")
      } else if (session) {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // Refresh notifications when component mounts
  useEffect(() => {
    if (user) {
      refreshNotifications()
    }
  }, [user, refreshNotifications])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Diagnoses", href: "/diagnoses", icon: FileText },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Insurance", href: "/insurance", icon: HeartPulseIcon },
    { name: "Radiology & Imaging", href: "/radiology", icon: ComputerIcon },
    { name: "AI Assistant", href: "/ai-assistant", icon: BrainCircuitIcon },
    { name: "Reports", href: "/reports", icon: FileArchive },
    {
      name: "Data Migration",
      href: "/data-migration",
      icon: DatabaseBackup,
    },
    { name: "Laboratory", href: "/lab", icon: FlaskConical },
    { name: "Support", href: "/support", icon: HelpCircle },
    { name: "My Profile", href: "/profile", icon: Settings2Icon },
  ]

  const navigation = baseNavigation
    .filter((item) => {
      if (userProfile?.role === "LAB") {
        return ["Dashboard", "Patients", "Reports", "Laboratory", "Support", "AI Assistant", "My Profile"].includes(item.name)
      }

      if (userProfile?.role === "IMAGING") {
        return ["Dashboard", "Patients", "Radiology & Imaging", "Support", "AI Assistant", "My Profile"].includes(item.name)
      }
      if (userProfile?.role === "INSURANCE") {
        return ["Dashboard", "Insurance", "Support"].includes(item.name)
      }
      if (userProfile?.role === "DOCTOR") {
        return ["Dashboard", "Patients", "Reports", "Radiology & Imaging", "Laboratory", "AI Assistant", "Support", "My Profile"].includes(item.name)
      }

      return true // all items for other roles
    })
    .concat(userProfile?.is_hpadmin ? [{ name: "Billings", href: "/billing", icon: FileBarChartIcon }, { name: "Hospital Admin", href: "/hospital-admin", icon: SettingsIcon }] : [])
    .concat(userProfile?.is_hpadmin ? [{ name: "Data Migration", href: "/data-migration", icon: DatabaseBackup }] : [])
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="fixed inset-0 z-40 lg:hidden">
        {sidebarOpen ? (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          ></div>
        ) : null}

        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white transition duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <Hospital className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-semibold">HDMS</span>
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col h-full">
            <div className="px-3 py-3">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-gray-100 text-primary" : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                        }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-primary" : "text-gray-400"}`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="mt-auto p-4">
              <div className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/user-profile.png" />
                  <AvatarFallback>{userProfile?.full_name ? getInitials(userProfile.full_name) : "U"}</AvatarFallback>
                </Avatar>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{userProfile?.full_name}</p>
                  <p className="truncate text-xs text-gray-500">{userProfile?.hospitals?.name}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-4 flex w-full items-center justify-center"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <Hospital className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-lg font-semibold">HDMS</span>
              </div>
            </div>
            <div className="flex flex-col h-full">
              <div className="px-3 py-4">
                <div className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-gray-100 text-primary" : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                          }`}
                      >
                        <item.icon
                          className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-primary" : "text-gray-400"}`}
                        />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="mt-auto p-4">
                <div className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/user-profile.png" />
                    <AvatarFallback>{userProfile?.full_name ? getInitials(userProfile.full_name) : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{userProfile?.full_name}</p>
                    <p className="truncate text-xs text-gray-500">{userProfile?.hospitals?.name}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 flex w-full items-center justify-center"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              <div className="max-w-2xl w-full lg:max-w-xs">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    placeholder="Search"
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => setNotificationDialogOpen(true)}
              >
                <span className="absolute -inset-1.5"></span>
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/user-profile.png" />
                      <AvatarFallback>
                        {userProfile?.full_name ? getInitials(userProfile.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings" className="flex w-full">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        {/* Floating Chatbot Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <AskAIButton />
        </div>


        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>

      {/* Notification Dialog */}
      {user && (
        <NotificationDialog
          open={notificationDialogOpen}
          onOpenChange={setNotificationDialogOpen}
          userId={user.id}
          onNotificationRead={refreshNotifications}
          onMarkAllRead={refreshNotifications}
        />
      )}
    </div>
  )
}
