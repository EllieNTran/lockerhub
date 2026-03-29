import type { FloorLayout } from '../types'

export const floor11Layout: FloorLayout = {
  floorNumber: '11',
  name: 'Floor 11',
  dimensions: { width: 1000, height: 2230 },

  zones: [
    { id: '01', name: 'Zone 1', x: 30, y: 30, width: 300, height: 170 },
    { id: '02', name: 'Zone 2', x: 350, y: 30, width: 300, height: 170 },
    { id: '03', name: 'Zone 3', x: 670, y: 30, width: 300, height: 170 },

    { id: '04', name: 'Zone 4', x: 30, y: 440, width: 300, height: 170 },
    { id: '05', name: 'Zone 5', x: 350, y: 440, width: 300, height: 170 },
    { id: '06', name: 'Zone 6', x: 670, y: 440, width: 300, height: 170 },

    { id: '07', name: 'Zone 7', x: 30, y: 630, width: 300, height: 170 },
    { id: '08', name: 'Zone 8', x: 670, y: 630, width: 300, height: 170 },

    { id: '09', name: 'Zone 9', x: 30, y: 1290, width: 300, height: 170 },
    { id: '10', name: 'Zone 10', x: 670, y: 1290, width: 300, height: 170 },

    { id: '11', name: 'Zone 11', x: 30, y: 1670, width: 300, height: 170 },
    { id: '12', name: 'Zone 12', x: 350, y: 1670, width: 300, height: 170 },
    { id: '13', name: 'Zone 13', x: 670, y: 1670, width: 300, height: 170 },

    { id: '14', name: 'Zone 14', x: 30, y: 2030, width: 300, height: 170 },
    { id: '15', name: 'Zone 15', x: 350, y: 2030, width: 300, height: 170 },
    { id: '16', name: 'Zone 16', x: 670, y: 2030, width: 300, height: 170 },
  ],

  landmarks: [
    { id: 'desk1', type: 'desk-area', x: 30, y: 220, width: 600, height: 200 },
    { id: 'meet1', type: 'meeting-room', x: 650, y: 220, width: 150, height: 200 },
    { id: 'meet2', type: 'meeting-room', x: 820, y: 220, width: 150, height: 200 },

    { id: 'coffee1', type: 'coffee-bar', x: 350, y: 630, width: 300, height: 170 },
    { id: 'meet3', type: 'meeting-room', x: 30, y: 820, width: 300, height: 170 },
    { id: 'meet4', type: 'meeting-room', x: 670, y: 820, width: 300, height: 170 },

    { id: 'lift1', type: 'lift', x: 350, y: 820, width: 300, height: 170 },

    { id: 'project1', type: 'project-room', x: 30, y: 1020, width: 390, height: 240 },
    { id: 'project2', type: 'project-room', x: 580, y: 1020, width: 390, height: 240 },

    { id: 'lift2', type: 'lift', x: 350, y: 1290, width: 300, height: 170 },

    { id: 'meet5', type: 'meeting-room', x: 30, y: 1475, width: 220, height: 180 },
    { id: 'project3', type: 'project-room', x: 270, y: 1475, width: 700, height: 180 },

    { id: 'desk4', type: 'desk-area', x: 30, y: 1860, width: 940, height: 150 },
  ],

  corridors: [
    { id: 'corridor1', x: 450, y: 1020, width: 100, height: 240, orientation: 'vertical', label: 'Corridor' },
  ]
}
