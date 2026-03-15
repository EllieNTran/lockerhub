import type { FloorLayout } from '../types'

export const floor2Layout: FloorLayout = {
  floorNumber: '2',
  name: 'Floor 2',
  dimensions: { width: 1200, height: 1000 },

  zones: [
    { id: '01', name: 'Zone 1', x: 30, y: 220, width: 300, height: 170 },
    { id: '02', name: 'Zone 2', x: 370, y: 220, width: 300, height: 170 },
    { id: '03', name: 'Zone 3', x: 690, y: 220, width: 480, height: 170 },

    { id: '04', name: 'Zone 4', x: 30, y: 600, width: 220, height: 170 },
    { id: '05', name: 'Zone 5', x: 270, y: 600, width: 200, height: 170 },
    { id: '06', name: 'Zone 6', x: 490, y: 600, width: 200, height: 170 },
    
    { id: '07', name: 'Zone 7', x: 710, y: 600, width: 200, height: 170 },
    { id: '08', name: 'Zone 8', x: 930, y: 600, width: 240, height: 170 },

    { id: '09', name: 'Zone 9', x: 30, y: 790, width: 240, height: 170 },
    { id: '10', name: 'Zone 10', x: 510, y: 790, width: 200, height: 170 },
  ],

  landmarks: [
    { id: 'desk1', type: 'desk-area', x: 30, y: 30, width: 700, height: 170 },
    { id: 'project1', type: 'project-room', x: 750, y: 30, width: 420, height: 170 },

    { id: 'lift1', type: 'lift', x: 30, y: 410, width: 120, height: 170 },
    { id: 'stairs1', type: 'stairs', x: 170, y: 410, width: 100, height: 170 },
    { id: 'lounge1', type: 'collaboration-booth', x: 290, y: 410, width: 400, height: 170 },

    { id: 'meeting1', type: 'meeting-room', x: 710, y: 410, width: 200, height: 170 },
    { id: 'coffee-bar1', type: 'coffee-bar', x: 930, y: 410, width: 240, height: 170 },

    { id: 'wc1', type: 'toilet', x: 290, y: 790, width: 200, height: 170 },
    { id: 'desk2', type: 'desk-area', x: 730, y: 790, width: 440, height: 170 },
  ],
  
  corridors: [] 
}
