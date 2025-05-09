// components/auth/client-session.tsx
"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Session } from "@supabase/auth-helpers-nextjs"

export default function ClientSessionWrapper({
  children,
}: {
  children: (session: Session | null) => React.ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const supabase = createClientComponentClient()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  return <>{children(session)}</>
}
