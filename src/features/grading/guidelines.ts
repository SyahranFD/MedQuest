// Fixed guideline registry. Grader citations may ONLY reference these ids.
// Entries are real documents to the best of our knowledge; years are listed only where certain.
// Every entry is flagged verifyBeforeRealUse: a medical consultant must confirm edition, wording
// and applicability before anything here is shown as clinical guidance.

export interface Guideline {
  id: string
  title: string
  issuer: string
  year?: number
  topic:
    | 'dengue'
    | 'acs'
    | 'malaria'
    | 'tb'
    | 'hypertension'
    | 'diabetes'
    | 'stroke'
    | 'sepsis'
    | 'pneumonia'
    | 'copd'
    | 'anaphylaxis'
    | 'ugib'
    | 'typhoid'
    | 'asthma'
    | 'uti'
    | 'pregnancy-htn'
    | 'leprosy'
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
  {
    id: 'ada-hyperglycemic-crises-2024',
    title: 'Hyperglycemic Crises in Adults With Diabetes: A Consensus Report',
    issuer: 'American Diabetes Association, EASD, JBDS, AACE, and Diabetes Technology Society',
    year: 2024,
    topic: 'diabetes',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'perdossi-stroke',
    title: 'Guideline Stroke',
    issuer: 'Perhimpunan Dokter Spesialis Saraf Indonesia (PERDOSSI)',
    topic: 'stroke',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'kemenkes-pnpk-stroke',
    title: 'Pedoman Nasional Pelayanan Kedokteran Tata Laksana Stroke',
    issuer: 'Kementerian Kesehatan RI',
    topic: 'stroke',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'aha-asa-stroke-2019',
    title: 'Guidelines for the Early Management of Patients With Acute Ischemic Stroke: 2019 Update to the 2018 Guidelines',
    issuer: 'American Heart Association / American Stroke Association',
    year: 2019,
    topic: 'stroke',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'ssc-2021',
    title: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021',
    issuer: 'Society of Critical Care Medicine and European Society of Intensive Care Medicine',
    year: 2021,
    topic: 'sepsis',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'pdpi-pneumonia-komunitas',
    title: 'Pneumonia Komunitas: Pedoman Diagnosis dan Penatalaksanaan di Indonesia',
    issuer: 'Perhimpunan Dokter Paru Indonesia (PDPI)',
    topic: 'pneumonia',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'ats-idsa-cap-2019',
    title: 'Diagnosis and Treatment of Adults with Community-acquired Pneumonia',
    issuer: 'American Thoracic Society and Infectious Diseases Society of America',
    year: 2019,
    topic: 'pneumonia',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'kemenkes-pedoman-tifoid',
    title: 'Pedoman Pengendalian Demam Tifoid',
    issuer: 'Kementerian Kesehatan RI',
    topic: 'typhoid',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'gina-asma',
    title: 'Global Strategy for Asthma Management and Prevention',
    issuer: 'Global Initiative for Asthma (GINA)',
    topic: 'asthma',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'pdpi-asma',
    title: 'Asma: Pedoman Diagnosis dan Penatalaksanaan di Indonesia',
    issuer: 'Perhimpunan Dokter Paru Indonesia (PDPI)',
    topic: 'asthma',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'idsa-esc-isk-2010',
    title: 'International Clinical Practice Guidelines for the Treatment of Acute Uncomplicated Cystitis and Pyelonephritis in Women: A 2010 Update',
    issuer: 'Infectious Diseases Society of America and European Society for Microbiology and Infectious Diseases',
    topic: 'uti',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'iaui-isk',
    title: 'Guideline Penatalaksanaan Infeksi Saluran Kemih dan Genitalia Pria',
    issuer: 'Ikatan Ahli Urologi Indonesia (IAUI)',
    topic: 'uti',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'acog-pb203-htn-kronik',
    title: 'Chronic Hypertension in Pregnancy (Practice Bulletin No. 203)',
    issuer: 'American College of Obstetricians and Gynecologists (ACOG)',
    year: 2019,
    topic: 'pregnancy-htn',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'kemenkes-pnpk-preeklamsia',
    title: 'Pedoman Nasional Pelayanan Kedokteran Diagnosis dan Tata Laksana Pre-Eklampsia',
    issuer: 'Kementerian Kesehatan RI',
    topic: 'pregnancy-htn',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'kemenkes-kusta',
    title: 'Pedoman Nasional Program Pengendalian Penyakit Kusta',
    issuer: 'Kementerian Kesehatan RI',
    topic: 'leprosy',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'who-kusta-2018',
    title: 'Guidelines for the diagnosis, treatment and prevention of leprosy',
    issuer: 'World Health Organization',
    year: 2018,
    topic: 'leprosy',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'pdpi-ppok',
    title: 'PPOK: Pedoman Praktis Diagnosis dan Penatalaksanaan di Indonesia',
    issuer: 'Perhimpunan Dokter Paru Indonesia (PDPI)',
    topic: 'copd',
    region: 'ID',
    verifyBeforeRealUse: true,
  },
  {
    id: 'gold-copd-2024',
    title: 'Global Strategy for the Prevention, Diagnosis and Management of COPD: 2024 Report',
    issuer: 'Global Initiative for Chronic Obstructive Lung Disease (GOLD)',
    year: 2024,
    topic: 'copd',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'wao-anaphylaxis-2020',
    title: 'World Allergy Organization Anaphylaxis Guidance 2020',
    issuer: 'World Allergy Organization',
    year: 2020,
    topic: 'anaphylaxis',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'baveno-vii',
    title: 'Baveno VII: Renewing consensus in portal hypertension',
    issuer: 'Baveno VII Faculty (Journal of Hepatology)',
    year: 2022,
    topic: 'ugib',
    region: 'INT',
    verifyBeforeRealUse: true,
  },
  {
    id: 'acg-ugib-2021',
    title: 'ACG Clinical Guideline: Upper Gastrointestinal and Ulcer Bleeding',
    issuer: 'American College of Gastroenterology',
    year: 2021,
    topic: 'ugib',
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
