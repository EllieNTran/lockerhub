# Floor Layout System

A data-driven floor plan layout system for rendering different building floor configurations with walls, corridors, landmarks, and lockers using **zone-relative positioning**.

## Locker Positioning System

### Zone-Relative Coordinates

Lockers use **zone-relative coordinates** based on their locker number format:

**Locker Number Format:** `[L|DL]{floor}-{zone}-{locker}`

Examples:
- `L02-02-01` → Floor 02, Zone 02, Locker 01
- `DL11E-03-05` → Floor 11 East, Zone 03, Locker 05

### How It Works

1. **Locker number is parsed** to extract the zone ID (e.g., "02", "03")
2. **Zone configuration** defines the zone's position on the floor (x, y)
3. **Locker coordinates** in the database are relative to the zone's top-left corner
4. **Absolute position** = Zone position + Locker position

Example:
```typescript
Zone 02: { id: '02', x: 100, y: 200, width: 300, height: 150 }
Locker: { locker_number: 'L02-02-01', x_coordinate: 10, y_coordinate: 15 }
// Renders at: (110, 215) = (100 + 10, 200 + 15)
```

### Benefits

- ✅ Easy to reposition entire zones
- ✅ Lockers automatically grouped by zone
- ✅ Matches locker naming structure
- ✅ Cleaner data management
- ✅ Zone-specific layout updates don't affect other zones

## Structure

```
floor-layouts/
├── types.ts                 # TypeScript interfaces for floor layouts
├── configs/
│   ├── floor-2.ts          # Floor 2 layout configuration
│   ├── floor-3.ts          # Floor 3 layout configuration
│   ├── floor-4.ts          # Floor 4 layout configuration
│   ├── floor-10.ts         # Floor 10 layout configuration
│   └── index.ts            # Export all configs and helper function
├── Corridor.tsx            # Corridor rendering component
├── Wall.tsx                # Wall rendering component
├── Landmark.tsx            # Landmark (facilities) rendering component
├── FloorLayoutRenderer.tsx # Main renderer that composes all elements
└── index.ts                # Main exports
```

## Usage

### In a Component

```typescript
import { FloorPlan } from '@/components/FloorPlan'

<FloorPlan 
  lockers={lockersArray}
  onSelectLocker={handleSelect}
  floorNumber="1" // Pass the floor number to load its layout
/>
```

### Creating a New Floor Layout

1. Create a new file in `configs/` (e.g., `floor-11.ts`)

```typescript
import type { FloorLayout } from '../types'

export const floor11Layout: FloorLayout = {
  floorNumber: '5',
  name: 'Floor 11',
  dimensions: { width: 1000, height: 700 },
  
  walls: [
    { id: 'wall-top', x: 0, y: 0, width: 1000, height: 4 },
    // ... more walls
  ],
  
  corridors: [
    { 
      id: 'main-corridor', 
      x: 0, 
      y: 200, 
      width: 1000, 
      height: 300, 
      orientation: 'horizontal',
      label: 'Main Corridor'
    },
  ],
  
  landmarks: [
    {
      id: 'lift-1',
      type: 'lift',
      x: 100,
      y: 250,
      width: 80,
      height: 100,
      label: 'Lift',
    },
  ],
}
```

2. Export it in `configs/index.ts`

```typescript
import { floor11Layout } from './floor-11'

const floorLayouts: Record<string, FloorLayout> = {
  '1': floor2Layout,
  // ... existing floors
  '5': floor11Layout, // Add new floor
}
```

## Configuration Guide

### Setting Up Zones

Zones **must** have IDs that match the zone numbers in your locker codes:

```typescript
// For lockers like L02-01-05, L02-01-06 (zone "01")
// and L02-02-03, L02-02-04 (zone "02")
zones: [
  { 
    id: '01',  // Must match zone part of locker number
    name: 'Zone 1',
    x: 50,     // Position on floor
    y: 20,
    width: 400,
    height: 150,
  },
  { 
    id: '02',
    name: 'Zone 2',
    x: 50,
    y: 200,
    width: 400,
    height: 150,
  },
]
```

### Locker Coordinates

In your database, store locker coordinates **relative to the zone**:

```sql
-- For locker L02-01-05 in zone 01 (positioned at x:50, y:20)
-- If you want the locker at absolute (60, 30) on the floor:
-- Store: x_coordinate = 10, y_coordinate = 10
-- (because 50 + 10 = 60, 20 + 10 = 30)
```

### Dimensions
- Set the overall floor plan size in pixels
- Lockers are positioned absolutely within these bounds

### Walls
- Use to create perimeter and internal walls
- Can have optional labels (e.g., "Corridor")
- Positioned with `x`, `y`, `width`, `height`

### Corridors
- Highlighted walkway areas
- Uses light background and dashed borders
- Can span horizontally or vertically

### Landmarks
Available types:
- `lift` - Elevator
- `stairs` - Staircase
- `toilet` - Restrooms
- `meeting-room` - Meeting rooms
- `project-room` - Project rooms
- `collaboration-booth` - Collaboration spaces
- `entrance` - Building entrance

Each landmark:
- Has position (`x`, `y`) and size (`width`, `height`)
- Displays an icon and label
- Styled with dashed border and muted background

### Zones (Optional)
- Use to visually group lockers by area
- Not rendered by default but available for future features

## Coordinate System

- Origin (0,0) is top-left corner
- X increases rightward
- Y increases downward
- All measurements in pixels
- Lockers from database use same coordinate system

## Tips

1. **Start with walls**: Define the floor perimeter first
2. **Add corridors**: Mark main walkways
3. **Place landmarks**: Position facilities (lift, toilets, etc.)
4. **Test with mock data**: Use sample locker coordinates to verify layout
5. **Adjust dimensions**: Make sure all elements fit within floor dimensions

## Fallback Behavior

If no layout is found for a floor ID, FloorPlan renders a simple border with lockers positioned by their coordinates only.
