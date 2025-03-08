import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { cookies, headers } from "next/headers"

// POST /api/runs/[id]/leave - Leave a run
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
    
    // Check if run exists
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        players: true,
        reservations: {
          where: {
            userId
          }
        }
      }
    })
    
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 })
    }
    
    // Check if user is in the run
    const player = run.players.find(player => player.userId === userId)
    if (!player) {
      return NextResponse.json({ error: "You are not in this run" }, { status: 400 })
    }
    
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Remove player from the run
      await tx.runPlayer.delete({
        where: {
          id: player.id
        }
      })
      
      // Remove any reservations
      if (run.reservations.length > 0) {
        await tx.reservation.deleteMany({
          where: {
            runId,
            userId
          }
        })
      }
      
      // If the player was the leader, update the run
      if (player.isLeader) {
        await tx.run.update({
          where: { id: runId },
          data: {
            leaderId: null
          }
        })
      }
    })
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error leaving run:", error)
    return NextResponse.json({ error: "Failed to leave run" }, { status: 500 })
  }
} 