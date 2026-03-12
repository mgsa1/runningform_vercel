'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import Placeholder from './drill-animations/Placeholder'

// Maps drill.id (from drills.json) → animation component.
// Dynamic imports keep each animation out of the main bundle.
const registry: Record<string, ComponentType> = {
  'a-skip':            dynamic(() => import('./drill-animations/ASkip')),
  'high-knees':        dynamic(() => import('./drill-animations/HighKnees')),
  'butt-kicks':        dynamic(() => import('./drill-animations/ButtKicks')),
  'arm-drive-drill':   dynamic(() => import('./drill-animations/ArmDrive')),
  'elbow-angle-check': dynamic(() => import('./drill-animations/ArmDrive')),   // same motion family
  'cadence-builder':   dynamic(() => import('./drill-animations/CadenceBuilder')),
  'short-stride-run':  dynamic(() => import('./drill-animations/ShortStrideRun')),
  'wall-lean-drill':   dynamic(() => import('./drill-animations/WallLean')),
}

interface DrillAnimationProps {
  drillId: string
}

export default function DrillAnimation({ drillId }: DrillAnimationProps) {
  const Anim = registry[drillId] ?? Placeholder
  return (
    <div className="flex justify-center items-center min-h-[100px]">
      <Anim />
    </div>
  )
}
