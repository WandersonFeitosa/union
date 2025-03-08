import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { cookies, headers } from "next/headers"

// GET /api/runs - Get all runs
export async function GET(request: NextRequest) {
  try {
    // Use the headers and cookies before getServerSession
    const headersList = headers();
    const cookiesList = cookies();
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")
    
    let whereClause = {}
    
    if (date) {
      // If date is provided, filter runs for that month
      const startDate = new Date(date)
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
      endDate.setHours(23, 59, 59, 999)
      
      whereClause = {
        datetime: {
          gte: startDate,
          lte: endDate
        }
      }
    }
    
    const runs = await prisma.run.findMany({
      where: whereClause,
      include: {
        players: {
          include: {
            character: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        reservations: {
          include: {
            item: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        datetime: 'asc'
      }
    })
    
    return NextResponse.json(runs)
  } catch (error) {
    console.error("Error fetching runs:", error)
    return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 })
  }
}

// POST /api/runs - Create a new run
export async function POST(request: NextRequest) {
  try {
    // Use the headers and cookies before getServerSession
    const headersList = headers();
    const cookiesList = cookies();
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const data = await request.json()
    const { 
      datetime, 
      characterId, 
      isCarrier, 
      isLeader, 
      itemIds 
    } = data
    
    // Get user ID from session
    const userId = session.user.id
    
    // Create the run
    const run = await prisma.run.create({
      data: {
        dungeon: "Upper Blackrock Spire", // Always set to Upper Blackrock Spire
        datetime: new Date(datetime),
        createdBy: {
          connect: { id: userId }
        },
        // Add the creator as a player
        players: {
          create: {
            isCarrier,
            isLeader,
            user: {
              connect: { id: userId }
            },
            character: {
              connect: { id: characterId }
            }
          }
        },
        // Add item reservations if any
        reservations: itemIds && itemIds.length > 0 ? {
          create: itemIds.map((itemId: string) => ({
            item: {
              connect: { id: itemId }
            },
            userId: userId
          }))
        } : undefined
      },
      include: {
        players: {
          include: {
            character: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        reservations: {
          include: {
            item: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })
    
    return NextResponse.json(run, { status: 201 })
  } catch (error) {
    console.error("Error creating run:", error)
    return NextResponse.json({ error: "Failed to create run" }, { status: 500 })
  }
} 