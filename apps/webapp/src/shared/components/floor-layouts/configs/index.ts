import { floor2Layout } from './floor-2'
import { floor3Layout } from './floor-3'
import { floor4Layout } from './floor-4'
import { floor6Layout } from './floor-6'
import { floor7Layout } from './floor-7'
import { floor8Layout } from './floor-8'
import { floor9Layout } from './floor-9'
import { floor10Layout } from './floor-10'
import { floor10ELayout } from './floor-10e'
import { floor11Layout } from './floor-11'
import { floor11eLayout } from './floor-11e'
import { floor13ELayout } from './floor-13e'
import type { FloorLayout } from '../types'

const floorLayouts: Record<string, FloorLayout> = {
  '2': floor2Layout,
  '3': floor3Layout,
  '4': floor4Layout,
  '6': floor6Layout,
  '7': floor7Layout,
  '8': floor8Layout,
  '9': floor9Layout,
  '10': floor10Layout,
  '10 East': floor10ELayout,
  '11': floor11Layout,
  '11 East': floor11eLayout,
  '13 East': floor13ELayout,
}

export const getFloorLayout = (floorNumber: string): FloorLayout | null => floorLayouts[floorNumber] || null

export { floor2Layout, floor3Layout, floor4Layout, floor6Layout, floor7Layout, floor8Layout, floor9Layout, floor10Layout, floor10ELayout, floor11Layout, floor11eLayout, floor13ELayout }
