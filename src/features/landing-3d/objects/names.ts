export const CLAY_OBJECT_NAMES = [
  'pill',
  'cross',
  'heart',
  'stethoscope',
  'syringe',
  'thermometer',
  'clipboard',
  'firstAid',
  'plaster',
  'potion',
  'briefcase',
] as const

export type ClayObjectName = (typeof CLAY_OBJECT_NAMES)[number]
