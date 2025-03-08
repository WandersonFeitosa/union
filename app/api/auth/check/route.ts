import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies, headers } from "next/headers"

export async function GET() {
  try {
    // Use the headers and cookies before getServerSession
    headers();
    cookies();
    
    const session = await getServerSession(authOptions)
    
    // Get user details from database if we have a session
    let dbUser = null
    if (session?.user?.id) {
      dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true }
      })
    }
    
    return NextResponse.json({
      authenticated: !!session,
      session,
      dbUser
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Auth check failed" }, { status: 500 })
  }
} 