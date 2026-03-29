import { ArrowUpDown, DoorOpen, Users, Armchair, Presentation, Monitor, Toilet, Coffee, OctagonMinus } from 'lucide-react'
import type { Landmark as LandmarkType } from '../types'

interface LandmarkProps {
  landmark: LandmarkType
}

const landmarkIcons = {
  lift: ArrowUpDown,
  stairs: ArrowUpDown,
  toilet: Toilet,
  'meeting-room': Presentation,
  'project-room': Users,
  'collaboration-booth': Armchair,
  entrance: DoorOpen,
  'desk-area': Monitor,
  'coffee-bar': Coffee,
  'restricted': OctagonMinus,
}

const landmarkLabels: Record<LandmarkType['type'], string> = {
  lift: 'LIFTS',
  stairs: 'STAIRS',
  toilet: 'WC',
  'meeting-room': 'MEETING ROOM',
  'project-room': 'PROJECT ROOM',
  'collaboration-booth': 'LOUNGE AREA',
  entrance: 'ENTRANCE',
  'desk-area': 'DESK AREA',
  'coffee-bar': 'COFFEE BAR',
  'restricted': 'RESTRICTED AREA',
}

export const Landmark = ({ landmark }: LandmarkProps) => {
  const Icon = landmarkIcons[landmark.type]
  const isRestricted = landmark.type === 'restricted'
  const label = landmarkLabels[landmark.type]

  return (
    <div
      className={`absolute flex flex-col items-center justify-center rounded-lg border-2 border-dashed text-center ${
        isRestricted
          ? 'border-grey bg-grey/40'
          : 'border-grey-outline bg-background'
      }`}
      style={{
        left: `${landmark.x}px`,
        top: `${landmark.y}px`,
        width: `${landmark.width}px`,
        height: `${landmark.height}px`,
      }}
    >
      {Icon && <Icon className="h-4 w-4 text-grey mb-1" />}
      <span className="text-[9px] font-medium text-grey uppercase tracking-wider px-1">
        {label}
      </span>
    </div>
  )
}
