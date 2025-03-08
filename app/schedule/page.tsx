"use client"

import { useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { CreateRunDialog } from "@/components/schedule/create-run-dialog"

// Import the Calendar component with no SSR to avoid hydration issues
const Calendar = dynamic(
  () => import("@/components/schedule/calendar"),
  { ssr: false }
)

export default function SchedulePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const calendarRef = useRef<{ loadRuns: () => Promise<void> } | null>(null)
  
  // Function to handle run creation success
  const handleRunCreated = () => {
    // Refresh the calendar
    if (calendarRef.current) {
      calendarRef.current.loadRuns()
    }
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dungeon Schedule</h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Create Run
        </Button>
      </div>
      
      <Calendar ref={calendarRef} />
      
      <CreateRunDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleRunCreated}
      />
    </div>
  )
} 