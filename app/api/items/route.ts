import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { cookies, headers } from "next/headers"

// GET /api/items - Get all items
export async function GET() {
  try {
    // Use the headers and cookies before getServerSession
    const headersList = headers();
    const cookiesList = cookies();
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const items = await prisma.item.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

// POST /api/items - Create a new item (admin only)
export async function POST(request: NextRequest) {
  try {
    // Use the headers and cookies before getServerSession
    const headersList = headers();
    const cookiesList = cookies();
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // In a real app, you'd check if the user is an admin
    // For now, we'll allow any authenticated user to create items
    
    const data = await request.json()
    const { name, price, imageUrl } = data
    
    // Create the item
    const item = await prisma.item.create({
      data: {
        name,
        price,
        imageUrl
      }
    })
    
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Error creating item:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
} 