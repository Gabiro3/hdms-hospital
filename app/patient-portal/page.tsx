import type { Metadata } from "next"
import PatientLoginForm from "@/components/patient-portal/patient-login-form"
import { checkPatientAuthentication } from "@/lib/patient-auth"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Patient Portal | Hospital Diagnosis Management System",
  description: "Access your medical information securely",
}

export default async function PatientPortalPage() {
  // Check if patient is already authenticated
  const { authenticated } = await checkPatientAuthentication()

  if (authenticated) {
    redirect("/patient-portal/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">Patient Portal</h1>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">Welcome</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Access your medical information securely</p>
        </div>
        <div className="mt-8 rounded-lg bg-white p-8 shadow">
          <PatientLoginForm />
        </div>
      </div>
    </div>
  )
}
