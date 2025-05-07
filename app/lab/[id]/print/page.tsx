import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getLabResultById } from "@/services/lab-service"
import PrintLabResult from "@/components/lab/print-lab-result"

export const metadata = {
  title: "Print Lab Result | Hospital Diagnosis Management System",
  description: "Print laboratory result",
}

export default async function PrintLabResultPage({ params }: { params: { id: string } }) {
  // Check authentication
  const supabase = createServerComponentClient({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
  
    if (!session) {
      redirect("/login")
    }
  
    // Get authenticated user data
    const {
      data: { user },
    } = await supabase.auth.getUser()
  
    if (!user) {
      redirect("/login")
    }

  // Get lab result data
  const { result, error } = await getLabResultById(params.id)

  if (error || !result) {
    redirect("/lab")
  }

  return <PrintLabResult result={result} />
}
