"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { fetchRuns, leaveRun } from "@/lib/api"
import { toast } from "sonner"
import { JoinRunDialog } from "@/components/runs/join-run-dialog"

export default function RunDetailPage() {
  // Use the useParams hook instead of the params prop
  const params = useParams()
  const runId = params?.id as string
  
  const { data: session, status } = useSession()
  const router = useRouter()
  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  
  useEffect(() => {
    async function loadRun() {
      try {
        setLoading(true)
        const runs = await fetchRuns()
        const foundRun = runs.find((r: any) => r.id === runId)
        
        if (foundRun) {
          setRun(foundRun)
        } else {
          toast.error("Run not found")
          router.push("/schedule")
        }
      } catch (error) {
        console.error("Failed to load run:", error)
        toast.error("Failed to load run")
      } finally {
        setLoading(false)
      }
    }
    
    if (status !== "loading" && runId) {
      loadRun()
    }
  }, [runId, router, status])
  
  const isUserInRun = run?.players.some((player: any) => 
    player.user.id === session?.user.id
  )
  
  const handleLeaveRun = async () => {
    try {
      await leaveRun(runId)
      toast.success("Left run successfully")
      router.push("/schedule")
    } catch (error) {
      console.error("Failed to leave run:", error)
      toast.error("Failed to leave run")
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  if (!run) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Run not found</h1>
        <Button onClick={() => router.push("/schedule")}>
          Back to Schedule
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push("/schedule")}
          className="mb-4"
        >
          Back to Schedule
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">{run.dungeon}</h1>
        <p className="text-gray-400 mb-6">
          {format(new Date(run.datetime), "EEEE, MMMM d, yyyy 'at' h:mm a")}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Players */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Players ({run.players.length}/5)</h2>
            
            <div className="space-y-2">
              {run.players.map((player: any) => (
                <div 
                  key={player.id} 
                  className={`p-3 rounded-md border ${
                    player.isCarrier 
                      ? "border-amber-800 bg-amber-950/30" 
                      : "border-blue-800 bg-blue-950/30"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{player.character.name}</p>
                      <p className="text-sm text-gray-400">
                        {player.character.class.charAt(0) + player.character.class.slice(1).toLowerCase()}
                        {player.isLeader && " (Leader)"}
                      </p>
                    </div>
                    <div className="text-sm">
                      {player.isCarrier ? "Carrier" : "Boosted"}
                    </div>
                  </div>
                </div>
              ))}
              
              {run.players.length < 5 && !isUserInRun && status === "authenticated" && (
                <Button 
                  className="w-full" 
                  onClick={() => setIsJoinDialogOpen(true)}
                >
                  Join Run
                </Button>
              )}
            </div>
          </div>
          
          {/* Reservations */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Item Reservations</h2>
            
            {run.reservations.length > 0 ? (
              <div className="space-y-2">
                {run.reservations.map((reservation: any) => (
                  <div 
                    key={reservation.id} 
                    className="p-3 rounded-md border border-gray-800 bg-gray-900"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{reservation.item.name}</p>
                      <p className="text-amber-400">{reservation.item.price} gold</p>
                    </div>
                    <p className="text-sm text-gray-400">
                      Reserved by: {run.players.find((p: any) => p.user.id === reservation.userId)?.character.name || "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No item reservations</p>
            )}
            
            {isUserInRun && (
              <div className="mt-8">
                <Button 
                  variant="destructive" 
                  onClick={handleLeaveRun}
                >
                  Leave Run
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <JoinRunDialog 
        open={isJoinDialogOpen} 
        onOpenChange={setIsJoinDialogOpen}
        runId={runId}
        runData={run}
        onSuccess={() => {
          router.refresh()
          // Reload the run data
          fetchRuns().then(runs => {
            const updatedRun = runs.find((r: any) => r.id === runId)
            if (updatedRun) setRun(updatedRun)
          })
        }}
      />
    </div>
  )
} 