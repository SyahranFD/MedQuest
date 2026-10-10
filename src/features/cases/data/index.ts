import type { Case } from '../types'
import { acsCase } from './acs'
import { dengueCase } from './dengue'
import { diabetesCase } from './diabetes'
import { hypertensionCase } from './hypertension'
import { malariaCase } from './malaria'
import { tbCase } from './tb'

export const ALL_CASES: readonly Case[] = [
  acsCase,
  dengueCase,
  malariaCase,
  tbCase,
  hypertensionCase,
  diabetesCase,
]
