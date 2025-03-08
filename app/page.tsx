"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      {status === "authenticated" ? (
        <div className="space-y-6 text-center">
          <h1 className="text-4xl font-bold">Welcome, {session.user.name}!</h1>
          <Button 
            variant="outline"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </div>
      ) : (
        <h1 className="text-4xl font-bold">Please sign in to continue</h1>
      )}
    </main>
  )
}
