"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchCharacters, fetchItems, createCharacter, createRun } from "@/lib/api"
import { toast } from "sonner"

// WoW classes
const wowClasses = [
  "WARLOCK",
  "WARRIOR",
  "DRUID",
  "HUNTER",
  "MAGE",
  "PALADIN",
  "ROGUE",
  "SHAMAN",
  "PRIEST",
]

// Mock data for dungeons
const dungeons = [
  "Blackrock Depths",
  "Scholomance",
  "Stratholme",
  "Dire Maul",
  "Shadowfang Keep",
  "Deadmines",
]

interface CreateRunDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateRunDialog({ open, onOpenChange, onSuccess }: CreateRunDialogProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isCarrier, setIsCarrier] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewCharacterForm, setShowNewCharacterForm] = useState(false)
  
  const [formData, setFormData] = useState({
    characterId: "",
    characterName: "",
    characterClass: "",
    dungeon: "Upper Blackrock Spire",
    date: "",
    time: "",
    isLeader: false,
  })

  // Load characters and items when dialog opens
  useEffect(() => {
    if (open && status === "authenticated") {
      loadCharacters()
      loadItems()
    }
  }, [open, status])

  async function loadCharacters() {
    try {
      const data = await fetchCharacters()
      setCharacters(data)
    } catch (error) {
      console.error("Failed to load characters:", error)
      toast.error("Failed to load characters")
    }
  }

  async function loadItems() {
    try {
      const data = await fetchItems()
      setItems(data)
    } catch (error) {
      console.error("Failed to load items:", error)
      toast.error("Failed to load items")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.characterName || !formData.characterClass) {
      toast.error("Please fill in all character fields")
      return
    }
    
    try {
      setLoading(true)
      const character = await createCharacter({
        name: formData.characterName,
        class: formData.characterClass
      })
      
      setCharacters(prev => [...prev, character])
      setFormData(prev => ({ ...prev, characterId: character.id }))
      setShowNewCharacterForm(false)
      toast.success("Character created successfully")
    } catch (error) {
      console.error("Failed to create character:", error)
      toast.error("Failed to create character")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.characterId || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields")
      return
    }
    
    try {
      setLoading(true)
      
      // Combine date and time
      const datetime = `${formData.date}T${formData.time}:00`
      
      const run = await createRun({
        dungeon: "Upper Blackrock Spire",
        datetime,
        characterId: formData.characterId,
        isCarrier,
        isLeader: formData.isLeader,
        itemIds: !isCarrier ? selectedItems : undefined
      })
      
      toast.success("Run created successfully")
      router.refresh()
      onOpenChange(false)
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to create run:", error)
      toast.error("Failed to create run")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Dungeon Run</DialogTitle>
          <DialogDescription>
            Schedule a new dungeon run and reserve items you want.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Character Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Character Information</h3>
            
            {!showNewCharacterForm ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="characterId" className="text-sm font-medium">
                    Select Character
                  </label>
                  {characters.length > 0 ? (
                    <div className="flex gap-2">
                      <Select 
                        value={formData.characterId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, characterId: value }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select character" />
                        </SelectTrigger>
                        <SelectContent>
                          {characters.map((character) => (
                            <SelectItem key={character.id} value={character.id}>
                              {character.name} ({character.class.charAt(0) + character.class.slice(1).toLowerCase()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowNewCharacterForm(true)}
                      >
                        New Character
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-gray-400 mb-2">No characters found</p>
                      <Button 
                        type="button" 
                        onClick={() => setShowNewCharacterForm(true)}
                      >
                        Create Character
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 border border-gray-800 p-4 rounded-md">
                <h4 className="font-medium">New Character</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="characterName" className="text-sm font-medium">
                      Character Name
                    </label>
                    <Input
                      id="characterName"
                      name="characterName"
                      value={formData.characterName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="characterClass" className="text-sm font-medium">
                      Class
                    </label>
                    <Select 
                      value={formData.characterClass} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, characterClass: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {wowClasses.map((wowClass) => (
                          <SelectItem key={wowClass} value={wowClass}>
                            {wowClass.charAt(0) + wowClass.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewCharacterForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleCreateCharacter}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Character"}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Carrier option */}
            {session?.user && formData.characterId && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isCarrier" 
                  checked={isCarrier}
                  onCheckedChange={(checked) => setIsCarrier(checked as boolean)}
                />
                <label
                  htmlFor="isCarrier"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Join as carrier
                </label>
              </div>
            )}
            
            {/* Leader option (only for carriers) */}
            {isCarrier && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isLeader" 
                  checked={formData.isLeader}
                  onCheckedChange={(checked) => handleCheckboxChange("isLeader", checked as boolean)}
                />
                <label
                  htmlFor="isLeader"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Be the run leader
                </label>
              </div>
            )}
          </div>
          
          {/* Run Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Run Information</h3>
            
            <div className="space-y-2">
              <label htmlFor="dungeon" className="text-sm font-medium">
                Dungeon
              </label>
              <div className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm items-center">
                Upper Blackrock Spire (10-man)
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">
                  Date
                </label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="time" className="text-sm font-medium">
                  Time
                </label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Item Reservations (only for non-carriers) */}
          {!isCarrier && formData.characterId && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Item Reservations</h3>
              <p className="text-sm text-gray-400">Select items you want to reserve if they drop.</p>
              
              {items.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-800 rounded-md">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`item-${item.id}`} 
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => handleItemToggle(item.id)}
                        />
                        <label
                          htmlFor={`item-${item.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.name}
                        </label>
                      </div>
                      <span className="text-sm text-amber-400">{item.price} gold</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 border border-gray-800 rounded-md">
                  <p className="text-gray-400">No items available</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.characterId}
            >
              {loading ? "Creating..." : "Create Run"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 