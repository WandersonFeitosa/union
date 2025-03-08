import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { cookies, headers } from "next/headers"

// GET /api/characters - Get user's characters
export async function GET() {
  try {
    // Use the headers and cookies before getServerSession
    headers();
    cookies();
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const userId = session.user.id
    
    const characters = await prisma.character.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(characters)
  } catch (error) {
    console.error("Error fetching characters:", error)
    return NextResponse.json({ error: "Failed to fetch characters" }, { status: 500 })
  }
}

// POST /api/characters - Create a new character
export async function POST(request: NextRequest) {
  try {
    // Use the headers and cookies before getServerSession
    headers();
    cookies();
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const data = await request.json()
    const { name, class: wowClass } = data
    
    // Get user ID from session
    const userId = session.user.id
    
    // Create the character
    const character = await prisma.character.create({
      data: {
        name,
        class: wowClass,
        user: {
          connect: { id: userId }
        }
      }
    })
    
    return NextResponse.json(character, { status: 201 })
  } catch (error) {
    console.error("Error creating character:", error)
    return NextResponse.json({ error: "Failed to create character" }, { status: 500 })
  }
} 