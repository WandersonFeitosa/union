"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchCharacters, fetchItems, createCharacter, joinRun } from "@/lib/api"
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

interface JoinRunDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  runId: string
  onSuccess?: () => void
  runData?: any // Add run data prop
}

export function JoinRunDialog({ open, onOpenChange, runId, onSuccess, runData }: JoinRunDialogProps) {
  const { data: session, status } = useSession()
  
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
    isLeader: false,
  })

  // Load characters and items when dialog opens
  useEffect(() => {
    if (open && status === "authenticated") {
      loadCharacters()
      loadItems()
    }
  }, [open, status])

  // Check if the run has reached the maximum number of carriers or boosted players
  const carrierCount = runData?.players?.filter((player: any) => player.isCarrier).length || 0
  const boostedCount = runData?.players?.filter((player: any) => !player.isCarrier).length || 0
  const maxCarriers = 5
  const maxBoosted = 6
  
  // Check if the run has at least 2 priests or shamans among carriers
  const priestOrShamanCount = runData?.players?.filter(
    (player: any) => 
      player.isCarrier && 
      (player.character.class === "PRIEST" || player.character.class === "SHAMAN")
  ).length || 0
  
  // Determine if carrier option should be disabled
  const disableCarrierOption = carrierCount >= maxCarriers || 
    (carrierCount >= 3 && priestOrShamanCount < 2 && 
     !(formData.characterClass === "PRIEST" || formData.characterClass === "SHAMAN"));

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
    
    if (!formData.characterId) {
      toast.error("Please select a character")
      return
    }
    
    // Check if the player is trying to join as a carrier but the limit is reached
    if (isCarrier && carrierCount >= maxCarriers) {
      toast.error(`This run already has the maximum number of carriers (${maxCarriers})`)
      return
    }
    
    // Check if the player is trying to join as boosted but the limit is reached
    if (!isCarrier && boostedCount >= maxBoosted) {
      toast.error(`This run already has the maximum number of boosted players (${maxBoosted})`)
      return
    }
    
    // Check if the run needs more priests/shamans
    if (isCarrier && carrierCount >= 3 && priestOrShamanCount < 2) {
      const selectedCharacter = characters.find(char => char.id === formData.characterId)
      if (selectedCharacter && 
          selectedCharacter.class !== "PRIEST" && 
          selectedCharacter.class !== "SHAMAN") {
        toast.error("This run requires at least 2 priests or shamans among carriers")
        return
      }
    }
    
    try {
      setLoading(true)
      
      await joinRun(runId, {
        characterId: formData.characterId,
        isCarrier,
        isLeader: formData.isLeader,
        itemIds: !isCarrier ? selectedItems : undefined
      })
      
      toast.success("Joined run successfully")
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Failed to join run:", error)
      toast.error("Failed to join run")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Join Dungeon Run</DialogTitle>
          <DialogDescription>
            Join this Upper Blackrock Spire run with your character.
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
                    <input
                      id="characterName"
                      name="characterName"
                      className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
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
                  disabled={disableCarrierOption}
                />
                <label
                  htmlFor="isCarrier"
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed ${disableCarrierOption ? 'text-gray-500' : ''}`}
                >
                  Join as carrier
                  {disableCarrierOption && carrierCount >= maxCarriers && (
                    <span className="ml-2 text-red-500">(Max carriers reached)</span>
                  )}
                  {disableCarrierOption && carrierCount >= 3 && priestOrShamanCount < 2 && (
                    <span className="ml-2 text-red-500">(Need Priest/Shaman)</span>
                  )}
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
              disabled={loading || !formData.characterId || 
                (isCarrier && disableCarrierOption) || 
                (!isCarrier && boostedCount >= maxBoosted)}
            >
              {loading ? "Joining..." : "Join Run"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 