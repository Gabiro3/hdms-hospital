"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Filter,
  UserPlus,
  MoreHorizontal,
  UserX,
  UserCheck,
  KeyRound,
  Shield,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import {
  disableUserAccount,
  enableUserAccount,
  resetUserPassword,
  updateUserAdminStatus,
} from "@/services/hospital-admin-service"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  full_name: string
  email: string
  is_admin: boolean
  is_verified: boolean
  is_disabled: boolean
  last_login: string | null
  hospital_id: string
  created_at: string
  role: string
  hospitals: {
    name: string
    code: string
  }
}

interface UsersManagementProps {
  initialUsers: User[]
  totalUsers: number
  totalPages: number
  currentPage: number
  hospitalId: string
  adminId: string
}

export default function UsersManagement({
  initialUsers,
  totalUsers,
  totalPages,
  currentPage,
  hospitalId,
  adminId,
}: UsersManagementProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("filter") || "")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<
    "disable" | "enable" | "resetPassword" | "makeAdmin" | "removeAdmin" | null
  >(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (roleFilter) params.set("role", roleFilter)
    if (statusFilter) params.set("filter", statusFilter)
    params.set("page", "1") // Reset to first page when searching

    router.push(`/hospital-admin/users?${params.toString()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`/hospital-admin/users?${params.toString()}`)
  }

  const handleUserAction = async () => {
    if (!selectedUser || !actionType) return

    setIsProcessing(true)
    try {
      let result

      switch (actionType) {
        case "disable":
          result = await disableUserAccount(adminId, selectedUser.id)
          if (result.success) {
            setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, is_disabled: true } : u)))
            toast({
              title: "User Disabled",
              description: `${selectedUser.full_name}'s account has been disabled.`,
            })
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to disable user account",
              variant: "destructive",
            })
          }
          break

        case "enable":
          result = await enableUserAccount(adminId, selectedUser.id)
          if (result.success) {
            setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, is_disabled: false } : u)))
            toast({
              title: "User Enabled",
              description: `${selectedUser.full_name}'s account has been enabled.`,
            })
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to enable user account",
              variant: "destructive",
            })
          }
          break

        case "resetPassword":
          result = await resetUserPassword(adminId, selectedUser.id)
          if (result.success) {
            setTemporaryPassword(result.temporaryPassword)
            toast({
              title: "Password Reset",
              description: "A temporary password has been generated.",
            })
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to reset password",
              variant: "destructive",
            })
            setIsActionDialogOpen(false)
            setActionType(null)
          }
          break

        case "makeAdmin":
          result = await updateUserAdminStatus(adminId, selectedUser.id, true)
          if (result.success) {
            setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, is_admin: true } : u)))
            toast({
              title: "Admin Privileges Granted",
              description: `${selectedUser.full_name} is now an administrator.`,
            })
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to update admin status",
              variant: "destructive",
            })
          }
          break

        case "removeAdmin":
          result = await updateUserAdminStatus(adminId, selectedUser.id, false)
          if (result.success) {
            setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, is_admin: false } : u)))
            toast({
              title: "Admin Privileges Removed",
              description: `${selectedUser.full_name} is no longer an administrator.`,
            })
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to update admin status",
              variant: "destructive",
            })
          }
          break
      }

      if (actionType !== "resetPassword") {
        setIsActionDialogOpen(false)
        setActionType(null)
        setSelectedUser(null)
      }
    } catch (error) {
      console.error(`Error performing ${actionType} action:`, error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getStatusBadge = (user: User) => {
    if (user.is_disabled) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Disabled
        </Badge>
      )
    }
    if (!user.is_verified) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Unverified
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Active
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { bg: string; text: string; border: string }> = {
      doctor: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      nurse: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
      technician: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
      staff: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
      admin: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    }

    const { bg, text, border } = roles[role.toLowerCase()] || roles.staff

    return (
      <Badge variant="outline" className={`${bg} ${text} ${border}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage hospital users, roles, and permissions</p>
        </div>
        <Link href="/hospital-admin/users/create">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="nurse">Nurse</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSearch}>
            Apply Filters
          </Button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No users found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || roleFilter || statusFilter
              ? "Try adjusting your search or filter criteria."
              : "There are no users in the system yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name}</span>
                        {user.is_admin && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>
                      {user.last_login ? format(new Date(user.last_login), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/hospital-admin/users/${user.id}`}>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setActionType("resetPassword")
                              setIsActionDialogOpen(true)
                            }}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>

                          {user.is_disabled ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType("enable")
                                setIsActionDialogOpen(true)
                              }}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Enable User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType("disable")
                                setIsActionDialogOpen(true)
                              }}
                              className="text-amber-600"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Disable User
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {user.is_admin ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType("removeAdmin")
                                setIsActionDialogOpen(true)
                              }}
                            >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Remove Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType("makeAdmin")
                                setIsActionDialogOpen(true)
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Action Confirmation Dialog */}
      <AlertDialog open={isActionDialogOpen && actionType !== "resetPassword"} onOpenChange={setIsActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "disable" && "Disable User Account"}
              {actionType === "enable" && "Enable User Account"}
              {actionType === "makeAdmin" && "Grant Administrator Privileges"}
              {actionType === "removeAdmin" && "Remove Administrator Privileges"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "disable" &&
                "This will prevent the user from accessing the system. They will not be able to log in until their account is enabled again."}
              {actionType === "enable" &&
                "This will restore the user's access to the system. They will be able to log in again."}
              {actionType === "makeAdmin" &&
                "This will grant administrator privileges to this user. They will have access to all administrative functions."}
              {actionType === "removeAdmin" &&
                "This will remove administrator privileges from this user. They will no longer have access to administrative functions."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUserAction}
              disabled={isProcessing}
              className={actionType === "disable" ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {isProcessing ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={actionType === "resetPassword"}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null)
            setSelectedUser(null)
            setTemporaryPassword(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              {!temporaryPassword
                ? "This will generate a new temporary password for the user. They will need to change it upon their next login."
                : "Password has been reset successfully. Make sure to share this temporary password with the user securely."}
            </DialogDescription>
          </DialogHeader>

          {!temporaryPassword ? (
            <div className="space-y-4">
              <p className="text-sm">You are about to reset the password for:</p>
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedUser ? getInitials(selectedUser.full_name) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionType(null)
                    setSelectedUser(null)
                    setIsActionDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUserAction} disabled={isProcessing}>
                  {isProcessing ? "Generating..." : "Reset Password"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="bg-amber-50 border-amber-200">
                <div className="p-4">
                  <p className="font-medium text-amber-800 mb-2">Temporary Password</p>
                  <p className="font-mono text-lg bg-white p-2 rounded border border-amber-200 text-center">
                    {temporaryPassword}
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
                    This password will only be shown once. Make sure to copy it now.
                  </p>
                </div>
              </Card>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setActionType(null)
                    setSelectedUser(null)
                    setTemporaryPassword(null)
                    setIsActionDialogOpen(false)
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
