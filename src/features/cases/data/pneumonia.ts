// Kasus (Poliklinik): pneumonia komunitas rawat jalan dengan diabetes dan faktor risiko TB. SINTETIS.
// Konsultan medis harus memvalidasi skor keparahan, pilihan antibiotik, dan dosis sebelum dipakai di luar simulasi.

import { buildRubric, crit, defaultFallbacks, exam, iceEntries, makeTests, P, pickDispositions, pickTreatments, q, safetyNetCriterion, vitals } from '../builders'
import type { Case } from '../types'

const MODE = 'poli' as const

export const pneumoniaCase: Case = {
  id: 'poli-pneumonia',
  mode: MODE,
  specialty: 'Paru / Penyakit Dalam',
  difficulty: 'sedang',
  synthetic: true,
  severity: 'urgent',
  title: 'Batuk berdahak dan demam tiga hari (pneumonia)',
  patient: { name: 'Bambang Hartono', age: 56, gender: 'M', occupation: 'Pedagang pasar' },
  arrivalBlurb: 'Laki-laki 56 tahun dengan diabetes, batuk berdahak kuning kehijauan, demam, dan nyeri dada saat menarik napas selama tiga hari.',
  chiefComplaint: 'Saya batuk berdahak dan demam tinggi tiga hari ini, Dok, dada kanan sakit kalau tarik napas.',
  vitals: vitals(98, '128/80', 24, 94, 38.6),
  initialTrust: 52,
  greeting: 'Selamat pagi, Dok.',
  farewell: 'Baik, Dok. Obatnya saya habiskan dan saya kontrol dua hari lagi. Terima kasih.',
  fallbacks: defaultFallbacks(),
  dialogue: [
    q('keluhan-utama', 'rps', 'Keluhan utama Bapak apa?', 'Batuk berdahak dan demam tinggi, Dok, dada sebelah kanan nyeri kalau menarik napas.', ['keluhan utama', 'apa keluhan', 'keluhan apa', 'ada keluhan', 'cerita keluhan', 'mengapa datang']),
    q('onset', 'rps', 'Keluhannya mulai sejak kapan, dan mulainya mendadak atau pelan-pelan?', 'Tiga hari lalu, Dok, mendadak. Awalnya pilek dan tenggorokan gatal, besoknya demam dan batuk.', ['sejak kapan', 'kapan mulai', 'sudah berapa lama', 'berapa hari', 'mulai kapan', 'mendadak']),
    q('dahak', 'rps', 'Dahaknya seperti apa, warna dan banyaknya?', 'Kuning kehijauan, Dok, kental, kemarin ada sedikit bercampur warna karat. Banyaknya satu sendok makan tiap pagi.', ['dahak', 'warna dahak', 'dahak kuning', 'dahak banyak', 'batuk berdahak', 'dahak karat']),
    q('demam', 'rps', 'Apakah demamnya tinggi atau menggigil?', 'Tinggi, Dok, semalam 39 lebih dan menggigil sampai selimutan, lalu berkeringat.', ['demam', 'menggigil', 'demam tinggi', 'meriang', 'panas']),
    q('nyeri-dada', 'rps', 'Bagaimana nyeri dadanya? Bertambah saat menarik napas atau batuk?', 'Iya, Dok, seperti ditusuk di dada kanan bawah, makin sakit kalau tarik napas dalam atau batuk.', ['nyeri dada', 'sakit dada', 'dada sakit', 'nyeri tarik napas', 'nyeri pleuritik', 'dada kanan']),
    q('sesak', 'rps', 'Apakah ada sesak napas, dan seberapa berat?', 'Agak sesak kalau jalan jauh atau naik tangga, Dok. Saat duduk tenang tidak.', ['sesak', 'napas', 'sesak berat', 'napas cepat'], { red: true }),
    q('bingung', 'rps', 'Apakah merasa bingung, sangat mengantuk, atau lupa sesuatu belakangan ini?', 'Tidak, Dok. Pikiran jernih, cuma lemas dan pusing karena demam.', ['bingung', 'mengantuk', 'penurunan kesadaran', 'linglung', 'lupa', 'kesadaran'], { red: true }),
    q('batuk-darah', 'rps', 'Apakah pernah batuk darah segar?', 'Tidak pernah, Dok. Cuma dahak berwarna karat itu.', ['batuk darah', 'darah segar', 'berdarah', 'dahak darah'], { red: true }),
    q('gejala-tb', 'rps', 'Apakah sebelumnya sudah batuk lama, keringat malam, atau berat badan turun?', 'Sebelumnya tidak, Dok. Batuk baru tiga hari ini. Berat badan tetap, keringat malam tidak ada.', ['batuk lama', 'keringat malam', 'berat badan turun', 'gejala tb', 'penurunan berat badan', 'batuk berminggu']),
    q('makan-minum', 'rps', 'Apakah masih bisa makan dan minum?', 'Nafsu makan turun, Dok, tapi masih bisa minum dan makan bubur.', ['makan minum', 'nafsu makan', 'masih makan', 'bisa minum', 'dehidrasi']),
    q('tersedak', 'rps', 'Apakah sebelumnya tersedak atau pernah pingsan?', 'Tidak ada, Dok.', ['tersedak', 'pingsan', 'aspirasi', 'kejang'], { distractor: true }),
    ...iceEntries(
      'Saya kira karena masuk angin dan kecapekan, Dok. Pagi buta saya sering kena angin di pasar.',
      'Saya takut ini paru-paru basah atau TBC, Dok, apalagi saya perokok dan punya gula.',
      'Saya mau cepat sembuh, Dok, dan sebisanya jangan sampai opname karena warung tidak ada yang jaga.',
    ),
    q('rpd-dm', 'rpd', 'Apakah Bapak punya kencing manis, dan bagaimana kontrolnya?', 'Ada, Dok, sudah delapan tahun. Minum metformin, tapi kontrol sudah lama tidak, gula terakhir katanya 190.', ['riwayat diabetes', 'diabetes', 'gula', 'kencing manis', 'metformin', 'kontrol gula']),
    q('rpd-paru', 'rpd', 'Apakah ada riwayat asma, PPOK, TBC, atau penyakit paru lain?', 'Tidak ada, Dok. Cuma batuk-batuk perokok kalau pagi.', ['riwayat paru', 'asma', 'ppok', 'penyakit paru', 'tbc', 'riwayat penyakit', 'penyakit dahulu', 'riwayat tbc']),
    q('rpd-jantung', 'rpd', 'Apakah ada penyakit jantung, ginjal, atau hati?', 'Tidak ada, Dok. Tensi kadang agak tinggi tapi tidak pernah minum obat.', ['penyakit jantung', 'penyakit ginjal', 'penyakit hati', 'riwayat jantung', 'ginjal', 'hati']),
    q('merokok', 'sosial', 'Apakah Bapak merokok? Berapa batang sehari?', 'Satu bungkus sehari, Dok, sudah tiga puluh tahun. Alkohol kadang kalau ada acara.', ['rokok', 'merokok', 'alkohol', 'perokok', 'batang rokok'], { gate: [54, 'Sedikit saja, Dok, tidak banyak.'] }),
    q('kontak-sakit', 'sosial', 'Apakah ada orang di rumah atau di pasar yang menderita TBC atau sakit serupa?', 'Ada pedagang sebelah batuk-batuk lama, Dok, tapi saya tidak tahu sakit apa. Di rumah tidak ada.', ['menderita tbc', 'orang tbc', 'kontak tb', 'sakit serupa', 'kontak sakit', 'tertular', 'menular', 'tetangga', 'teman batuk']),
    q('vaksin', 'rpd', 'Apakah pernah divaksin influenza atau pneumonia?', 'Belum pernah, Dok. Baru dengar ada vaksinnya.', ['vaksin', 'vaksin influenza', 'vaksin pneumonia', 'imunisasi', 'vaksinasi']),
    q('obat-sudah', 'obat', 'Obat apa yang sudah Bapak minum untuk batuk dan demam ini?', 'Parasetamol dan obat batuk sirup, Dok. Antibiotik beli sendiri dua kapsul kemarin, tapi tidak diteruskan.', ['obat apa', 'sudah minum obat', 'minum obat', 'obat batuk', 'antibiotik', 'obat warung', 'obat apotek', 'parasetamol'], { gate: [52, 'Cuma parasetamol dan obat batuk, Dok.'] }),
    q('keluarga', 'keluarga', 'Apakah ada riwayat penyakit paru atau kencing manis di keluarga?', 'Ayah kencing manis, Dok. Penyakit paru tidak ada.', ['riwayat keluarga', 'keluarga sakit', 'keluarga penyakit', 'keluarga']),
    q('alergi-obat', 'alergi', 'Apakah Bapak punya alergi obat, misalnya penisilin?', 'Tidak ada, Dok.', ['alergi obat', 'alergi penisilin', 'alergi']),
    q('pekerjaan', 'sosial', 'Bagaimana pekerjaan Bapak, apakah terpapar debu, asap, atau bahan kimia?', 'Dagang sayur di pasar, Dok. Debu dan asap kendaraan tiap hari, bahan kimia tidak.', ['pekerjaan', 'paparan debu', 'asap', 'bahan kimia', 'kerja', 'profesi']),
    q('nyeri-sendi', 'rps', 'Apakah ada nyeri sendi atau bengkak di kaki?', 'Tidak ada, Dok.', ['nyeri sendi', 'bengkak kaki', 'sendi'], { distractor: true }),
    q('diare', 'rps', 'Apakah ada diare atau muntah?', 'Tidak ada, Dok.', ['diare', 'muntah', 'mual'], { distractor: true }),
  ],
  exam: [
    exam('umum', 'umum', 'Keadaan umum dan tanda vital', 'Tampak sakit sedang, compos mentis, bicara kalimat penuh. RR 24x/menit, SpO2 94% udara ruangan, suhu 38,6 derajat.', { abnormal: true }),
    exam('paru', 'paru', 'Paru', 'Perkusi redup di lapang bawah paru kanan, fremitus meningkat, ronki basah halus dan suara napas bronkial di basal kanan.', { abnormal: true }),
    exam('jantung', 'jantung', 'Jantung', 'Takikardia reguler, S1 S2 normal, tidak ada murmur.'),
    exam('orofaring', 'kepala-leher', 'Orofaring', 'Faring sedikit hiperemis, tonsil T1-T1, tidak ada sekret purulen.'),
    exam('abdomen', 'abdomen', 'Abdomen', 'Datar, lemas, tidak ada nyeri tekan, hepar dan lien tidak teraba.', { distractor: true }),
    exam('ekstremitas', 'ekstremitas', 'Ekstremitas', 'Akral hangat, tidak ada edema, tidak ada jari tabuh.', { distractor: true }),
  ],
  tests: makeTests(MODE, [
    ['foto-toraks', [{ text: 'Foto toraks PA: konsolidasi homogen dengan air bronchogram di lobus bawah paru kanan, sinus kostofrenikus kanan tumpul ringan, tidak ada kavitas.', abnormal: true }]],
    ['dpl', [{ text: 'Hb 13,4 g/dL, leukosit 15.800/uL dengan netrofil 84%, trombosit 342.000/uL.', abnormal: true }]],
    ['crp', [{ text: 'CRP 96 mg/L (meningkat).', abnormal: true }]],
    ['ureum-kreatinin', [{ text: 'Ureum 32 mg/dL (BUN sekitar 15 mg/dL), kreatinin 1,0 mg/dL.', abnormal: false }]],
    ['gds', [{ text: 'Glukosa darah sewaktu 248 mg/dL (hiperglikemia, kontrol diabetes buruk).', abnormal: true }]],
    ['genexpert', [{ text: 'GeneXpert MTB/RIF: M. tuberculosis tidak terdeteksi.', abnormal: false }]],
    ['bta', [{ text: 'BTA sputum sewaktu: negatif pada dua spesimen.', abnormal: false }]],
    ['hiv', [{ text: 'Tes HIV: non-reaktif.', abnormal: false }]],
    'urinalisis',
    'ekg',
  ]),
  panels: [
    { id: 'panel-pneumonia', label: 'Panel pneumonia', testIds: ['foto-toraks', 'dpl', 'crp', 'ureum-kreatinin', 'gds'] },
  ],
  diagnoses: [
    { id: 'pneumonia-komunitas', label: 'Pneumonia komunitas, derajat ringan (rawat jalan)' },
    { id: 'tb-paru', label: 'Tuberkulosis paru' },
    { id: 'bronkitis-akut', label: 'Bronkitis akut' },
    { id: 'efusi-pleura', label: 'Efusi pleura' },
    { id: 'gagal-jantung', label: 'Gagal jantung akut' },
  ],
  correctDiagnosisId: 'pneumonia-komunitas',
  differentialIds: ['tb-paru', 'bronkitis-akut', 'efusi-pleura', 'gagal-jantung'],
  treatments: pickTreatments([
    'koamoksiklav-625',
    'azitromisin-500',
    'parasetamol',
    'edukasi-pneumonia',
    'amoksisilin',
    'levofloksasin',
    'deksametason',
  ]),
  indicatedTreatmentIds: ['koamoksiklav-625', 'azitromisin-500', 'parasetamol', 'edukasi-pneumonia'],
  criticalTreatmentIds: ['koamoksiklav-625'],
  contraindicated: [
    { id: 'deksametason', reason: 'Kortikosteroid rutin tidak dianjurkan pada pneumonia komunitas tidak berat dan memperburuk hiperglikemia pada pasien diabetes.' },
  ],
  dispositions: pickDispositions(['pulang-kontrol', 'pulang', 'rawat-bangsal', 'rujuk-lanjut']),
  correctDispositionId: 'pulang-kontrol',
  acceptableDispositionIds: [],
  guidelineIds: ['pdpi-pneumonia-komunitas', 'ats-idsa-cap-2019', 'kemenkes-pnpk-tb'],
  rubric: buildRubric({
    criteria: [
      crit('an-01', 'anamnesis', 2, 'Karakter batuk dan dahak', P.asked(['onset', 'dahak'], 2), {
        met: 'Onset dan karakter dahak ditanyakan.',
        partial: 'Hanya sebagian ditanyakan.',
        missed: 'Karakter batuk tidak digali.',
      }, { partial: P.asked(['onset', 'dahak'], 1), improve: 'Tanyakan onset dan warna dahak.' }),
      crit('an-02', 'anamnesis', 2, 'Demam dan nyeri dada pleuritik', P.asked(['demam', 'nyeri-dada'], 2), {
        met: 'Demam dan nyeri dada ditanyakan.',
        partial: 'Hanya salah satu ditanyakan.',
        missed: 'Demam dan nyeri dada tidak ditanyakan.',
      }, { partial: P.asked(['demam', 'nyeri-dada'], 1), ref: 'pdpi-pneumonia-komunitas', improve: 'Tanyakan demam dan nyeri dada saat menarik napas.' }),
      crit('an-03', 'anamnesis', 3, 'Komponen keparahan (sesak dan kesadaran)', P.asked(['sesak', 'bingung'], 2), {
        met: 'Sesak dan kesadaran ditanyakan untuk menilai keparahan.',
        partial: 'Hanya salah satu ditanyakan.',
        missed: 'Penilaian keparahan tidak digali.',
      }, { partial: P.asked(['sesak', 'bingung'], 1), ref: 'ats-idsa-cap-2019', improve: 'Tanyakan sesak dan kebingungan: bagian dari skor keparahan seperti CURB-65.', highlight: 'Anda menilai keparahan pneumonia sebelum memutuskan rawat jalan.' }),
      crit('an-04', 'anamnesis', 2, 'Menyingkirkan TB', P.asked(['gejala-tb', 'batuk-darah', 'kontak-sakit'], 2), {
        met: 'Gejala dan kontak TB digali.',
        partial: 'Hanya sebagian digali.',
        missed: 'TB tidak disingkirkan dari anamnesis.',
      }, { partial: P.asked(['gejala-tb', 'batuk-darah', 'kontak-sakit'], 1), ref: 'kemenkes-pnpk-tb', improve: 'Di Indonesia, selalu gali gejala dan kontak TB pada batuk dengan infiltrat.' }),
      crit('an-05', 'anamnesis', 2, 'Komorbid dan faktor risiko', P.asked(['rpd-dm', 'merokok', 'rpd-paru'], 2), {
        met: 'Komorbid dan kebiasaan merokok digali.',
        partial: 'Hanya sebagian digali.',
        missed: 'Komorbid dan faktor risiko tidak digali.',
      }, { partial: P.asked(['rpd-dm', 'merokok', 'rpd-paru'], 1), ref: 'pdpi-pneumonia-komunitas', improve: 'Komorbid (diabetes, PPOK) dan merokok menentukan pilihan antibiotik.' }),
      crit('an-06', 'anamnesis', 1, 'Alergi dan antibiotik sebelumnya', P.asked(['alergi-obat', 'obat-sudah'], 2), {
        met: 'Alergi dan obat yang sudah diminum ditanyakan.',
        partial: 'Hanya salah satu ditanyakan.',
        missed: 'Alergi dan obat sebelumnya tidak ditanyakan.',
      }, { partial: P.asked(['alergi-obat', 'obat-sudah'], 1), improve: 'Tanyakan alergi penisilin dan antibiotik yang sudah diminum.' }),
      crit('pe-01', 'pemeriksaan', 3, 'Pemeriksaan paru', P.examined(['paru']), {
        met: 'Paru diperiksa.',
        missed: 'Paru tidak diperiksa.',
      }, { ref: 'pdpi-pneumonia-komunitas', improve: 'Perkusi dan auskultasi paru mencari konsolidasi.' }),
      crit('pe-02', 'pemeriksaan', 2, 'Tanda vital dan keadaan umum', P.examined(['umum']), {
        met: 'Tanda vital dan keadaan umum dinilai.',
        missed: 'Tanda vital tidak dinilai.',
      }, { improve: 'Nilai frekuensi napas, saturasi, dan kesadaran.' }),
      crit('pe-03', 'pemeriksaan', 1, 'Jantung', P.examined(['jantung']), {
        met: 'Jantung diperiksa.',
        missed: 'Jantung tidak diperiksa.',
      }, { improve: 'Periksa jantung untuk menyingkirkan gagal jantung.' }),
      crit('pn-01', 'penalaran', 3, 'Foto toraks', P.ordered(['foto-toraks']), {
        met: 'Foto toraks dipesan.',
        missed: 'Foto toraks tidak dipesan.',
      }, { ref: 'pdpi-pneumonia-komunitas', improve: 'Foto toraks mengonfirmasi infiltrat dan menyingkirkan efusi.', highlight: 'Anda memastikan diagnosis dengan foto toraks.' }),
      crit('pn-02', 'penalaran', 2, 'Laboratorium keparahan', P.ordered(['dpl', 'ureum-kreatinin', 'crp'], 2), {
        met: 'Laboratorium untuk menilai keparahan dipesan.',
        partial: 'Hanya satu pemeriksaan dipesan.',
        missed: 'Laboratorium keparahan tidak dipesan.',
      }, { partial: P.ordered(['dpl', 'ureum-kreatinin', 'crp'], 1), ref: 'ats-idsa-cap-2019', improve: 'Darah lengkap, ureum, dan CRP membantu menilai keparahan dan infeksi bakteri.' }),
      crit('pn-03', 'penalaran', 2, 'Menyingkirkan TB dengan pemeriksaan', P.ordered(['genexpert', 'bta'], 1), {
        met: 'Pemeriksaan TB dipesan.',
        missed: 'TB tidak disingkirkan dengan pemeriksaan.',
      }, { ref: 'kemenkes-pnpk-tb', improve: 'Pada pasien berisiko, periksa dahak untuk TB agar tidak terlewat dan tidak menutupinya dengan antibiotik yang tidak tepat.' }),
      crit('pn-04', 'penalaran', 1, 'Glukosa darah', P.ordered(['gds']), {
        met: 'Glukosa darah diperiksa.',
        missed: 'Glukosa darah tidak diperiksa.',
      }, { improve: 'Periksa gula darah pada pasien diabetes yang sakit akut.' }),
      crit('pn-05', 'penalaran', 3, 'Diagnosis pneumonia komunitas', P.dx, {
        met: 'Diagnosis pneumonia benar.',
        missed: 'Diagnosis tidak sesuai.',
      }, { ref: 'pdpi-pneumonia-komunitas', improve: 'Demam, batuk dahak purulen, nyeri pleuritik, ronki lokal, dan infiltrat mengarah ke pneumonia.' }),
      crit('tr-01', 'terapi', 3, 'Antibiotik sesuai komorbid', P.treated(['koamoksiklav-625', 'azitromisin-500'], undefined, 2), {
        met: 'Kombinasi beta-laktam dan makrolid diresepkan.',
        partial: 'Hanya satu antibiotik diresepkan; pasien dengan komorbid memerlukan kombinasi atau pilihan setara.',
        missed: 'Antibiotik yang sesuai tidak diresepkan.',
      }, { partial: P.treated(['koamoksiklav-625', 'azitromisin-500', 'amoksisilin', 'levofloksasin'], undefined, 1), ref: 'pdpi-pneumonia-komunitas', improve: 'Pada pasien dengan komorbid (diabetes), pilih beta-laktam dengan penghambat beta-laktamase ditambah makrolid.', highlight: 'Pilihan antibiotik Anda sesuai komorbid pasien.' }),
      crit('tr-02', 'terapi', 1, 'Antipiretik', P.treated(['parasetamol']), {
        met: 'Parasetamol diresepkan.',
        missed: 'Antipiretik tidak diresepkan.',
      }, { improve: 'Parasetamol untuk demam dan nyeri pleuritik.' }),
      crit('tr-03', 'terapi', 2, 'Edukasi dan berhenti merokok', P.treated(['edukasi-pneumonia']), {
        met: 'Edukasi diberikan.',
        missed: 'Edukasi tidak diberikan.',
      }, { ref: 'pdpi-pneumonia-komunitas', improve: 'Edukasi minum cukup, istirahat, berhenti merokok, kontrol gula, dan vaksinasi.' }),
      crit('tr-04', 'terapi', 2, 'Rawat jalan dengan kontrol 48 sampai 72 jam', P.dispo, {
        met: 'Pasien pulang dengan jadwal kontrol.',
        missed: 'Disposisi tidak sesuai.',
      }, { improve: 'Skor keparahan rendah dan saturasi baik: rawat jalan dengan kontrol 2 sampai 3 hari.' }),
      crit('ks-01', 'keselamatan', 3, 'Tidak memberi steroid rutin', P.not(P.treated('contraindicated')), {
        met: 'Tidak ada obat kontraindikasi.',
        missed: 'Steroid diberikan pada pneumonia tidak berat dengan diabetes.',
      }, { ref: 'ats-idsa-cap-2019', improve: 'Hindari kortikosteroid rutin pada pneumonia tidak berat, apalagi pada diabetes tidak terkontrol.' }),
      safetyNetCriterion(2, 'pdpi-pneumonia-komunitas'),
    ],
    breaches: [
      { id: 'br-kontra', when: P.treated('contraindicated'), what: 'Memberikan kortikosteroid rutin pada pneumonia komunitas tidak berat pada pasien diabetes.', guidelineRef: 'ats-idsa-cap-2019' },
      { id: 'br-tanpa-antibiotik', when: P.not(P.treated(['koamoksiklav-625', 'azitromisin-500', 'amoksisilin', 'levofloksasin'])), what: 'Pneumonia bakteri tidak diberi antibiotik.', guidelineRef: 'pdpi-pneumonia-komunitas' },
    ],
    teachingPoints: [
      'Nilai keparahan (misalnya CURB-65) sebelum memutuskan rawat jalan atau rawat inap.',
      'Komorbid seperti diabetes mengubah pilihan antibiotik: beta-laktam dengan penghambat beta-laktamase ditambah makrolid.',
      'Di Indonesia, TB harus selalu dipertimbangkan pada infiltrat paru dan tidak boleh ditutupi oleh terapi yang tidak tepat.',
    ],
  }),
}
