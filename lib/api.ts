// API utility functions

// Fetch runs for a specific month
export async function fetchRuns(date?: Date) {
  const url = date 
    ? `/api/runs?date=${date.toISOString()}` 
    : '/api/runs'
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error('Failed to fetch runs')
  }
  
  return response.json()
}

// Create a new run
export async function createRun(data: {
  dungeon: string
  datetime: string
  characterId: string
  isCarrier: boolean
  isLeader: boolean
  itemIds?: string[]
}) {
  const response = await fetch('/api/runs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create run')
  }
  
  return response.json()
}

// Join a run
export async function joinRun(runId: string, data: {
  characterId: string
  isCarrier: boolean
  isLeader: boolean
  itemIds?: string[]
}) {
  const response = await fetch(`/api/runs/${runId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to join run')
  }
  
  return response.json()
}

// Leave a run
export async function leaveRun(runId: string) {
  const response = await fetch(`/api/runs/${runId}/leave`, {
    method: 'POST',
  })
  
  if (!response.ok) {
    throw new Error('Failed to leave run')
  }
  
  return response.json()
}

// Fetch user's characters
export async function fetchCharacters() {
  const response = await fetch('/api/characters')
  
  if (!response.ok) {
    throw new Error('Failed to fetch characters')
  }
  
  return response.json()
}

// Create a new character
export async function createCharacter(data: {
  name: string
  class: string
}) {
  const response = await fetch('/api/characters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create character')
  }
  
  return response.json()
}

// Fetch all items
export async function fetchItems() {
  const response = await fetch('/api/items')
  
  if (!response.ok) {
    throw new Error('Failed to fetch items')
  }
  
  return response.json()
} 