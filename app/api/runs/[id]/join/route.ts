import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { cookies, headers } from "next/headers"

// POST /api/runs/[id]/join - Join a run
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the headers and cookies before getServerSession
    const headersList = headers();
    const cookiesList = cookies();
    
    // Access params before getServerSession
    const runId = params.id;
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const userId = session.user.id
    
    const data = await request.json()
    const { 
      characterId, 
      isCarrier, 
      isLeader, 
      itemIds 
    } = data
    
    // Check if run exists
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        players: {
          include: {
            character: true
          }
        }
      }
    })
    
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 })
    }
    
    // Check if user is already in the run
    const existingPlayer = run.players.find(player => player.userId === userId)
    if (existingPlayer) {
      return NextResponse.json({ error: "You are already in this run" }, { status: 400 })
    }
    
    // Check if there's a leader if the user wants to be one
    if (isLeader) {
      const existingLeader = run.players.find(player => player.isLeader)
      if (existingLeader) {
        return NextResponse.json({ error: "This run already has a leader" }, { status: 400 })
      }
    }
    
    // Check carrier and boosted limits
    const carrierCount = run.players.filter(player => player.isCarrier).length
    const boostedCount = run.players.filter(player => !player.isCarrier).length
    const maxCarriers = 5
    const maxBoosted = 6
    
    if (isCarrier && carrierCount >= maxCarriers) {
      return NextResponse.json({ 
        error: `This run already has the maximum number of carriers (${maxCarriers})` 
      }, { status: 400 })
    }
    
    if (!isCarrier && boostedCount >= maxBoosted) {
      return NextResponse.json({ 
        error: `This run already has the maximum number of boosted players (${maxBoosted})` 
      }, { status: 400 })
    }
    
    // Check priest/shaman requirement for carriers
    if (isCarrier && carrierCount >= 3) {
      // Get the character class of the joining player
      const character = await prisma.character.findUnique({
        where: { id: characterId }
      })
      
      if (!character) {
        return NextResponse.json({ error: "Character not found" }, { status: 404 })
      }
      
      // Count priests and shamans among carriers
      const priestOrShamanCount = run.players.filter(
        player => player.isCarrier && 
        (player.character.class === "PRIEST" || player.character.class === "SHAMAN")
      ).length
      
      // If there are less than 2 priests/shamans, the joining player must be one
      if (priestOrShamanCount < 2 && 
          character.class !== "PRIEST" && 
          character.class !== "SHAMAN") {
        return NextResponse.json({ 
          error: "This run requires at least 2 priests or shamans among carriers" 
        }, { status: 400 })
      }
    }
    
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Add user to the run
      const player = await tx.runPlayer.create({
        data: {
          run: {
            connect: { id: runId }
          },
          user: {
            connect: { id: userId }
          },
          character: {
            connect: { id: characterId }
          },
          isCarrier,
          isLeader
        },
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
      })
      
      // Add item reservations if any (only for non-carriers)
      let reservations = []
      if (!isCarrier && itemIds && itemIds.length > 0) {
        for (const itemId of itemIds) {
          const reservation = await tx.reservation.create({
            data: {
              run: {
                connect: { id: runId }
              },
              item: {
                connect: { id: itemId }
              },
              userId
            },
            include: {
              item: true
            }
          })
          reservations.push(reservation)
        }
      }
      
      return { player, reservations }
    })
    
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error joining run:", error)
    return NextResponse.json({ error: "Failed to join run" }, { status: 500 })
  }
} 