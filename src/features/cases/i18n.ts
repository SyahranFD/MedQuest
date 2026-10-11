import { registerMessages } from '@/lib/i18n'

const id = {
  'gender.M': 'Laki-laki',
  'gender.F': 'Perempuan',
  'mode.er': 'IGD',
  'mode.poli': 'Poliklinik',
  'category.infection': 'Infeksi tropis',
  'category.cardio': 'Kardiovaskular',
  'category.endocrine': 'Endokrin',
  'category.pulmo': 'Paru',
  'category.neuro': 'Saraf',
}

const en: Record<keyof typeof id, string> = {
  'gender.M': 'Male',
  'gender.F': 'Female',
  'mode.er': 'ER',
  'mode.poli': 'Outpatient',
  'category.infection': 'Tropical infection',
  'category.cardio': 'Cardiovascular',
  'category.endocrine': 'Endocrine',
  'category.pulmo': 'Pulmonary',
  'category.neuro': 'Neurology',
}

registerMessages('cases', { id, en })

export type CasesKey = keyof typeof id
