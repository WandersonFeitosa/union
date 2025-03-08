"use client"

import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Users } from "lucide-react"

interface RunEventProps {
  run: {
    id: string
    title: string
    datetime: Date
    players: any[]
    dungeon: string
  }
}

export function RunEvent({ run }: RunEventProps) {
  // Count carriers and boosted players
  const carriers = run.players.filter(p => p.isCarrier).length
  const boosted = run.players.filter(p => !p.isCarrier).length
  const maxCarriers = 5
  const maxBoosted = 6
  
  return (
    <div 
      className={cn(
        "text-xs p-1 rounded cursor-pointer flex flex-col",
        carriers > 0 ? "bg-amber-950 border border-amber-800" : "bg-blue-950 border border-blue-800"
      )}
      onClick={() => console.log("View run details", run.id)}
    >
      <div className="font-medium truncate">{run.dungeon || run.title}</div>
      <div className="flex justify-between items-center">
        <span>{format(new Date(run.datetime), "h:mm a")}</span>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{carriers}/{maxCarriers}C | {boosted}/{maxBoosted}B</span>
        </div>
      </div>
    </div>
  )
} 