import type { FloorLayout } from '../types'

export const floor13ELayout: FloorLayout = {
  floorNumber: '13 East',
  name: 'Floor 13 East',
  dimensions: { width: 1200, height: 1000 },

  zones: [
    { id: '01', name: 'Zone 1', x: 30, y: 30, width: 380, height: 170 },
    { id: '02', name: 'Zone 2', x: 430, y: 30, width: 370, height: 170 },
    { id: '03', name: 'Zone 3', x: 820, y: 30, width: 360, height: 170 },
  ],

  landmarks: [
    { id: 'desk1', type: 'desk-area', x: 30, y: 220, width: 700, height: 170 },
    { id: 'project1', type: 'project-room', x: 750, y: 220, width: 420, height: 170 },

    { id: 'lift1', type: 'lift', x: 30, y: 410, width: 120, height: 170 },
    { id: 'stairs1', type: 'stairs', x: 170, y: 410, width: 100, height: 170 },
    { id: 'lounge1', type: 'collaboration-booth', x: 290, y: 410, width: 400, height: 170 },
    { id: 'meeting1', type: 'meeting-room', x: 710, y: 410, width: 200, height: 170 },
    { id: 'coffee-bar1', type: 'coffee-bar', x: 930, y: 410, width: 240, height: 170 },

    { id: 'restricted1', type: 'restricted', x: 30, y: 600, width: 1140, height: 370 },
  ],
  
  corridors: [] 
}
