export interface FloorLayout {
  floorNumber: string
  name: string
  dimensions: { width: number; height: number }
  zones: Zone[]
  landmarks: Landmark[]
  corridors: Corridor[]
}

export interface Zone {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color?: string
}

export interface Landmark {
  id: string
  type: 'lift' | 'stairs' | 'toilet' | 'meeting-room' | 'project-room' | 'collaboration-booth' | 'entrance' | 'desk-area' | 'coffee-bar' | 'restricted'
  x: number
  y: number
  width: number
  height: number
  icon?: string
}

export interface Corridor {
  id: string
  x: number
  y: number
  width: number
  height: number
  orientation: 'horizontal' | 'vertical'
  label?: string
}
