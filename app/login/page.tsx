"use client"

import { useEffect, useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [authStatus, setAuthStatus] = useState<any>(null)
  
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/schedule")
    }
  }, [status, router])
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/check")
        const data = await res.json()
        setAuthStatus(data)
      } catch (error) {
        console.error("Error checking auth:", error)
      }
    }
    
    checkAuth()
  }, [])
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-6 rounded-lg shadow-lg bg-gray-900 border border-gray-800">
        <h1 className="text-2xl font-bold text-center text-white">Login</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-md">
            <h2 className="font-medium mb-2">Auth Status:</h2>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(authStatus, null, 2)}
            </pre>
          </div>
          
          <div className="p-4 bg-gray-800 rounded-md">
            <h2 className="font-medium mb-2">Session Status: {status}</h2>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>
        
        <Button 
          className="w-full"
          onClick={() => signIn("discord", { callbackUrl: "/schedule" })}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Loading..." : "Sign in with Discord"}
        </Button>
      </div>
    </main>
  )
} 