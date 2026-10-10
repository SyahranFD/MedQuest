import { useEffect, useMemo } from 'react'
import type { ComponentType } from 'react'
import { useClay } from './clay-context'
import { getClayMaterial } from './clay-material'
import type { Vec3 } from './geometry'
import { buildClayObject, type ClayObjectName } from './objects/builders'

export interface ClayObjectProps {
  /** Main body color override (any CSS hex). Accents stay on the palette. */
  color?: string
  scale?: number
  rotation?: Vec3
  position?: Vec3
}

/** Resting pose that reads best for each object (radians). */
export const DEFAULT_ROTATION: Record<ClayObjectName, Vec3> = {
  pill: [0, 0.2, 0.55],
  cross: [0.1, -0.35, 0],
  heart: [0, -0.35, 0.12],
  stethoscope: [0, 0.3, 0],
  syringe: [0, 0.3, 0.7],
  thermometer: [0, 0.25, -0.55],
  clipboard: [0, -0.3, 0.1],
  firstAid: [0.05, -0.4, 0],
  plaster: [0.25, -0.3, 0.3],
  potion: [0, 0.4, -0.08],
  briefcase: [0.04, -0.38, 0],
}

export function ClayObject({ name, color, scale = 1, rotation, position }: ClayObjectProps & { name: ClayObjectName }) {
  const { palette, quality } = useClay()
  const geometry = useMemo(() => buildClayObject(name, palette, quality, color), [name, palette, quality, color])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh
      geometry={geometry}
      material={getClayMaterial()}
      scale={scale}
      rotation={rotation ?? DEFAULT_ROTATION[name]}
      position={position}
    />
  )
}

function make(name: ClayObjectName): ComponentType<ClayObjectProps> {
  const Component = (props: ClayObjectProps) => <ClayObject name={name} {...props} />
  Component.displayName = `Clay${name[0]?.toUpperCase()}${name.slice(1)}`
  return Component
}

export const ClayPill = make('pill')
export const ClayCross = make('cross')
export const ClayHeart = make('heart')
export const ClayStethoscope = make('stethoscope')
export const ClaySyringe = make('syringe')
export const ClayThermometer = make('thermometer')
export const ClayClipboard = make('clipboard')
export const ClayFirstAid = make('firstAid')
export const ClayPlaster = make('plaster')
export const ClayPotion = make('potion')
export const ClayBriefcase = make('briefcase')
