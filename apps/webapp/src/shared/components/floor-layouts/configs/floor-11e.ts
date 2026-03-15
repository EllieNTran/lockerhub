import type { FloorLayout } from '../types'

export const floor11eLayout: FloorLayout = {
  floorNumber: '11E',
  name: 'Floor 11 East',
  dimensions: { width: 1000, height: 900 },

  zones: [
    { id: '01', name: 'Zone 1', x: 670, y: 30, width: 300, height: 180 },
    { id: '02', name: 'Zone 2', x: 30, y: 225, width: 300, height: 180 },
    { id: '03', name: 'Zone 3', x: 350, y: 225, width: 300, height: 180 },
    { id: '04', name: 'Zone 4', x: 30, y: 420, width: 300, height: 180 },
    { id: '05', name: 'Zone 5', x: 350, y: 420, width: 330, height: 180 },
  ],

  landmarks: [
    { id: 'desk1', type: 'desk-area', x: 30, y: 30, width: 620, height: 180 },
    { id: 'meet1', type: 'meeting-room', x: 670, y: 225, width: 150, height: 180 },
    { id: 'meet2', type: 'meeting-room', x: 840, y: 225, width: 130, height: 180 },
    { id: 'lift1', type: 'lift', x: 700, y: 420, width: 130, height: 180 },
    { id: 'stairs1', type: 'stairs', x: 850, y: 420, width: 120, height: 180 },

    { id: 'restricted1', type: 'restricted', x: 30, y: 620, width: 940, height: 250 },
  ],
  
  corridors: [] 
}
