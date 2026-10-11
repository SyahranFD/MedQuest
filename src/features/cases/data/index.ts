import type { Case } from '../types'
import { acsCase } from './acs'
import { anafilaksisCase } from './anafilaksis'
import { dengueCase } from './dengue'
import { diabetesCase } from './diabetes'
import { hypertensionCase } from './hypertension'
import { kadCase } from './kad'
import { malariaCase } from './malaria'
import { ppokCase } from './ppok'
import { sepsisCase } from './sepsis'
import { strokeCase } from './stroke'
import { asmaCase } from './asma'
import { hipertensiHamilCase } from './hipertensi-hamil'
import { iskCase } from './isk'
import { kustaCase } from './kusta'
import { pneumoniaCase } from './pneumonia'
import { tifoidCase } from './tifoid'
import { tbCase } from './tb'
import { ugibCase } from './ugib'

export const ALL_CASES: readonly Case[] = [
  acsCase,
  dengueCase,
  malariaCase,
  tbCase,
  hypertensionCase,
  tifoidCase,
  iskCase,
  asmaCase,
  pneumoniaCase,
  hipertensiHamilCase,
  kustaCase,
  diabetesCase,
  strokeCase,
  sepsisCase,
  kadCase,
  ppokCase,
  ugibCase,
  anafilaksisCase,
]
