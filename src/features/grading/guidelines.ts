// Fixed guideline registry. Grader citations may ONLY reference these ids.
// Entries are real documents to the best of our knowledge; years are listed only where certain.
// Every entry is flagged verifyBeforeRealUse: a medical consultant must confirm edition, wording
// and applicability before anything here is shown as clinical guidance.

export interface Guideline {
  id: string
  title: string
  issuer: string
  year?: number
  topic: 'dengue' | 'acs' | 'malaria' | 'tb' | 'hypertension' | 'diabetes'
  region: 'ID' | 'INT'
  verifyBeforeRealUse: true
}

export const GUIDELINES: readonly Guideline[] = [
  {
    id: 'kemenkes-pnpk-dengue',
    title: 'Pedoman Nasional Pelayanan Kedokteran Tata Laksana Infeksi Dengue',
    issuer: 'Kementerian Kesehatan RI',
    topic: 'dengue',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'who-dengue-2009',
    title: 'Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control',
    issuer: 'World Health Organization',
    year: 2009,
    topic: 'dengue',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'perki-aks',
    title: 'Pedoman Tatalaksana Sindrom Koroner Akut',
    issuer: 'Perhimpunan Dokter Spesialis Kardiovaskular Indonesia (PERKI)',
    topic: 'acs',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'esc-acs-2023',
    title: '2023 ESC Guidelines for the management of acute coronary syndromes',
    issuer: 'European Society of Cardiology',
    year: 2023,
    topic: 'acs',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'kemenkes-malaria',
    title: 'Pedoman Tatalaksana Malaria',
    issuer: 'Kementerian Kesehatan RI',
    topic: 'malaria',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'who-malaria',
    title: 'WHO Guidelines for malaria',
    issuer: 'World Health Organization',
    topic: 'malaria',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'kemenkes-pnpk-tb',
    title: 'Pedoman Nasional Pelayanan Kedokteran Tata Laksana Tuberkulosis',
    issuer: 'Kementerian Kesehatan RI',
    topic: 'tb',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'who-tb-treatment',
    title: 'WHO consolidated guidelines on tuberculosis: treatment',
    issuer: 'World Health Organization',
    topic: 'tb',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'perhi-hipertensi',
    title: 'Konsensus Penatalaksanaan Hipertensi',
    issuer: 'Perhimpunan Dokter Hipertensi Indonesia (PERHI)',
    topic: 'hypertension',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'kemenkes-pnpk-htn',
    title: 'Pedoman Nasional Pelayanan Kedokteran Tata Laksana Hipertensi pada Dewasa',
    issuer: 'Kementerian Kesehatan RI',
    topic: 'hypertension',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'esc-esh-htn-2018',
    title: '2018 ESC/ESH Guidelines for the management of arterial hypertension',
    issuer: 'European Society of Cardiology and European Society of Hypertension',
    year: 2018,
    topic: 'hypertension',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'perkeni-dm2-2021',
    title: 'Pedoman Pengelolaan dan Pencegahan Diabetes Melitus Tipe 2 di Indonesia',
    issuer: 'Perkumpulan Endokrinologi Indonesia (PERKENI)',
    year: 2021,
    topic: 'diabetes',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'kemenkes-pnpk-dm2',
    title: 'Pedoman Nasional Pelayanan Kedokteran Tata Laksana Diabetes Melitus Tipe 2 Dewasa',
    issuer: 'Kementerian Kesehatan RI',
    topic: 'diabetes',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'ada-standards',
    title: 'Standards of Care in Diabetes',
    issuer: 'American Diabetes Association',
    topic: 'diabetes',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
]

export const GUIDELINE_IDS: readonly string[] = GUIDELINES.map((g) => g.id)

export function getGuideline(id: string): Guideline | undefined {
  return GUIDELINES.find((g) => g.id === id)
}

export function citationFor(id: string) {
  const g = getGuideline(id)
  if (!g) return undefined
  return { id: g.id, title: g.title, issuer: g.issuer, ...(g.year ? { year: g.year } : {}) }
}
