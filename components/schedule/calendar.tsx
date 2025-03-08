"use client"

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fetchRuns } from "@/lib/api"
import { useRouter } from "next/navigation"

// Run event component
function RunEvent({ run }: { run: any }) {
  const router = useRouter()
  
  // Count carriers and boosted players
  const carriers = run.players.filter((p: any) => p.isCarrier).length
  const boosted = run.players.filter((p: any) => !p.isCarrier).length
  
  return (
    <div 
      className={cn(
        "text-xs p-1 rounded cursor-pointer flex flex-col",
        run.players.some((p: any) => p.isCarrier) ? "bg-amber-950 border border-amber-800" : "bg-blue-950 border border-blue-800"
      )}
      onClick={() => router.push(`/runs/${run.id}`)}
    >
      <div className="font-medium truncate">{run.dungeon}</div>
      <div className="flex justify-between items-center">
        <span>{format(new Date(run.datetime), "h:mm a")}</span>
        <div className="flex items-center gap-1">
          <span>{carriers}/{5} C | {boosted}/{6} B</span>
        </div>
      </div>
    </div>
  )
}

// Define the ref type
export type CalendarRef = {
  loadRuns: () => Promise<void>
}

const Calendar = forwardRef<CalendarRef, {}>((props, ref) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Create a function to load runs that can be called from outside
  const loadRuns = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchRuns(currentMonth)
      setRuns(data)
    } catch (error) {
      console.error("Failed to load runs:", error)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])
  
  // Expose the loadRuns function via ref
  useImperativeHandle(ref, () => ({
    loadRuns
  }))
  
  // Load runs when component mounts or month changes
  useEffect(() => {
    loadRuns()
  }, [loadRuns])
  
  // Set up an interval to refresh runs every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadRuns()
    }, 30000) // 30 seconds
    
    return () => clearInterval(intervalId)
  }, [loadRuns])
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Create a grid with 7 columns (days of week)
  const dayOfWeek = monthStart.getDay()
  const emptyDaysBefore = Array(dayOfWeek).fill(null)
  
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-gray-800">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 border-b border-gray-800">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {emptyDaysBefore.map((_, index) => (
            <div key={`empty-${index}`} className="h-32 p-1 border-b border-r border-gray-800" />
          ))}
          
          {days.map((day) => {
            // Get runs for this day
            const runsOnDay = runs.filter(run => 
              isSameDay(new Date(run.datetime), day)
            )
            
            return (
              <div 
                key={day.toString()} 
                className={cn(
                  "h-32 p-1 border-b border-r border-gray-800 relative",
                  isToday(day) && "bg-gray-800/50"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-sm font-medium p-1 rounded-full w-7 h-7 flex items-center justify-center",
                    isToday(day) && "bg-blue-600 text-white"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>
                
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                  {runsOnDay.map(run => (
                    <RunEvent key={run.id} run={run} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

Calendar.displayName = "Calendar"

export default Calendar 