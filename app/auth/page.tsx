"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

export default function AuthPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-6 rounded-lg shadow-lg bg-gray-900 border border-gray-800">
        <h1 className="text-2xl font-bold text-center text-white">Welcome to Union</h1>
        <p className="text-center text-gray-400">Sign in to get started</p>
        
        <Button 
          className="w-full flex items-center justify-center gap-2" 
          variant="secondary"
          size="lg"
          onClick={() => signIn("discord", { callbackUrl: "/" })}
        >
          <MessageSquare className="w-5 h-5" />
          Sign in with Discord
        </Button>
      </div>
    </main>
  )
} 