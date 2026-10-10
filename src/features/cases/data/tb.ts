// Kasus 4 (Poliklinik): tuberkulosis paru kasus baru. SINTETIS.
// Konsultan medis harus memvalidasi dosis OAT per berat badan dan alur diagnosis sebelum dipakai di luar simulasi.

import { buildRubric, crit, defaultFallbacks, exam, iceEntries, makeTests, P, pickDispositions, pickTreatments, q, safetyNetCriterion, vitals } from '../builders'
import type { Case } from '../types'

const MODE = 'poli' as const

export const tbCase: Case = {
  id: 'poli-tb-paru',
  mode: MODE,
  specialty: 'Penyakit Dalam / Paru',
  difficulty: 'sedang',
  synthetic: true,
  severity: 'urgent',
  title: 'Batuk lebih dari tiga minggu (TB paru)',
  patient: { name: 'Slamet Riyadi', age: 42, gender: 'M', occupation: 'Sopir angkutan kota' },
  arrivalBlurb: 'Laki-laki 42 tahun datang dengan batuk berdahak lebih dari 3 minggu, berat badan turun, keringat malam.',
  chiefComplaint: 'Batuk saya tidak sembuh-sembuh, Dok, sudah lebih dari tiga minggu.',
  vitals: vitals(92, '118/76', 20, 96, 37.6),
  initialTrust: 55,
  greeting: 'Selamat pagi, Dok.',
  farewell: 'Baik, Dok. Saya akan minum obatnya teratur. Terima kasih.',
  fallbacks: defaultFallbacks(),
  dialogue: [
    q('keluhan-utama', 'rps', 'Keluhan utama Bapak apa?', 'Batuk berdahak, Dok, sudah lebih dari tiga minggu tidak sembuh-sembuh.', ['keluhan utama', 'apa keluhan', 'keluhan apa', 'ada keluhan', 'cerita keluhan', 'mengapa datang']),
    q('onset', 'rps', 'Batuknya sejak kapan?', 'Kira-kira tiga setengah minggu, Dok. Awalnya kecil, lama-lama makin sering, terutama malam.', ['batuk sejak kapan', 'sejak kapan', 'kapan mulai', 'sudah berapa lama', 'berapa lama batuk', 'berapa minggu']),
    q('dahak', 'rps', 'Dahaknya seperti apa, warnanya dan banyaknya?', 'Dahak kental warna kuning kehijauan, Dok, setiap pagi banyak, satu sendok teh lebih.', ['dahak', 'dahak warna', 'warna dahak', 'batuk berdahak', 'dahak banyak']),
    q('batuk-darah', 'rps', 'Apakah pernah batuk darah?', 'Seminggu ini kadang ada bercak darah di dahak, Dok, sedikit saja.', ['batuk darah', 'darah dahak', 'berdarah', 'bercak darah'], { red: true }),
    q('demam-sore', 'rps', 'Apakah ada demam, terutama sore atau malam hari?', 'Iya, Dok, badan hangat-hangat sore hari, tidak terlalu tinggi.', ['demam', 'demam sore', 'demam malam', 'meriang', 'panas']),
    q('keringat-malam', 'rps', 'Apakah sering berkeringat malam sampai baju basah?', 'Sering, Dok, bangun tidur baju sampai basah padahal tidak panas.', ['keringatmalam', 'keringat malam', 'keringat', 'baju basah']),
    q('bb-turun', 'rps', 'Apakah berat badan Bapak turun belakangan ini?', 'Turun, Dok, dari 58 jadi sekitar 52 kilo dalam dua bulan.', ['berat badan turun', 'berat badan', 'turun berat', 'kurus', 'timbangan', 'bb']),
    q('nafsu', 'rps', 'Bagaimana nafsu makannya?', 'Berkurang, Dok, cepat kenyang.', ['nafsu makan', 'nafsu', 'selera makan', 'makan']),
    q('sesak', 'rps', 'Apakah ada sesak napas atau nyeri dada saat batuk?', 'Sesak sedikit kalau naik tangga. Nyeri dada tidak ada.', ['sesak', 'nyeri dada', 'napas', 'dada sakit'], { red: true }),
    ...iceEntries(
      'Saya kira karena rokok atau masuk angin, Dok. Sudah minum obat batuk tapi tidak mempan.',
      'Saya takut ini TBC, Dok. Nanti anak istri saya tertular dan saya tidak boleh narik angkot.',
      'Saya mau tahu sakit apa dan cepat sembuh, Dok, biar bisa kerja lagi.',
    ),
    q('kontak-tb', 'rps', 'Apakah ada yang batuk lama atau menderita TBC di rumah atau lingkungan kerja?', 'Ayah saya dulu batuk lama dan meninggal, Dok. Sekarang tetangga sebelah rumah katanya sedang minum obat TBC.', ['kontak tb', 'batuk lama', 'tbc', 'tertular', 'menular', 'serumah', 'tetangga', 'kontak']),
    q('riwayat-tb', 'rpd', 'Apakah Bapak pernah menderita TBC atau minum obat TBC sebelumnya?', 'Belum pernah, Dok.', ['riwayat tbc', 'pernah tbc', 'obat tbc', 'tbc sebelumnya', 'pengobatan tb', 'riwayat tb', 'pernah minum obat tb']),
    q('rpd-dm', 'rpd', 'Apakah ada riwayat kencing manis atau penyakit kronis lain?', 'Tidak ada, Dok. Cek gula terakhir bertahun-tahun lalu normal.', ['riwayat diabetes', 'diabetes', 'gula', 'penyakit kronis', 'riwayat penyakit', 'penyakit dahulu', 'penyakit lain']),
    q('hiv-risiko', 'sosial', 'Apakah Bapak pernah melakukan tes HIV, atau punya faktor risiko seperti berganti-ganti pasangan atau penggunaan jarum suntik?', 'Belum pernah tes, Dok. Dulu saya pernah... beberapa kali berhubungan dengan orang lain di luar istri, Dok. Malu sebenarnya.', ['hiv', 'tes hiv', 'faktor risiko hiv', 'berganti pasangan', 'jarum suntik', 'berhubungan', 'seksual', 'narkoba'], { gate: [62, 'Tidak, Dok, saya setia sama istri.'] }),
    q('keluarga', 'keluarga', 'Apakah ada riwayat penyakit di keluarga?', 'Ayah saya meninggal karena batuk lama, katanya paru-paru.', ['riwayat keluarga', 'keluarga sakit', 'keluarga penyakit', 'keluarga']),
    q('alergi-obat', 'alergi', 'Apakah Bapak punya alergi obat?', 'Tidak ada, Dok.', ['alergi obat', 'alergi']),
    q('obat-sudah', 'obat', 'Obat apa saja yang sudah Bapak minum untuk batuk ini?', 'Obat batuk sirup dari warung dan jamu, Dok, tidak ada yang cocok. Antibiotik belum pernah.', ['minum obat apa', 'obat apa', 'sudah minum obat', 'obat batuk', 'obat warung', 'jamu', 'makan obat', 'antibiotik']),
    q('merokok', 'sosial', 'Apakah Bapak merokok atau minum alkohol?', 'Merokok, Dok, sekitar satu setengah bungkus sehari sudah lama. Alkohol kadang-kadang.', ['rokok', 'merokok', 'alkohol', 'perokok'], { gate: [55, 'Sedikit saja, Dok.'] }),
    q('rumah', 'sosial', 'Bapak tinggal bersama siapa, dan bagaimana kondisi rumahnya?', 'Dengan istri dan tiga anak, Dok, di rumah kontrakan dua kamar, ventilasinya kurang.', ['tinggal', 'tinggal dengan siapa', 'rumah', 'kondisi rumah', 'ventilasi', 'serumah']),
    q('pekerjaan', 'sosial', 'Pekerjaan Bapak apa?', 'Sopir angkot, Dok, sehari-hari banyak ketemu penumpang.', ['kerja', 'pekerjaan', 'profesi']),
    q('trauma', 'rps', 'Apakah ada riwayat benturan atau luka di dada?', 'Tidak ada, Dok.', ['trauma', 'benturan', 'luka dada', 'kecelakaan'], { distractor: true }),
    q('nyeri-sendi', 'rps', 'Apakah ada nyeri sendi atau bengkak di kaki?', 'Tidak ada, Dok.', ['nyeri sendi', 'bengkak kaki', 'sendi'], { distractor: true }),
  ],
  exam: [
    exam('umum', 'umum', 'Keadaan umum dan gizi', 'Tampak kurus, kesadaran compos mentis. BB 52 kg, TB 168 cm, IMT 18,4.', { abnormal: true }),
    exam('paru', 'paru', 'Paru', 'Ronki basah kasar di apeks paru kanan, suara napas bronkial di apeks kanan, tidak ada mengi.', { abnormal: true }),
    exam('limfonodi', 'kepala-leher', 'Kelenjar getah bening leher', 'Tidak teraba pembesaran kelenjar getah bening.'),
    exam('jantung', 'jantung', 'Jantung', 'S1 S2 reguler, tidak ada murmur.'),
    exam('abdomen', 'abdomen', 'Abdomen', 'Datar, lemas, hepar dan lien tidak teraba.'),
    exam('ekstremitas', 'ekstremitas', 'Ekstremitas', 'Tidak ada edema, tidak ada jari tabuh.', { distractor: true }),
  ],
  tests: makeTests(MODE, [
    ['genexpert', [{ text: 'GeneXpert MTB/RIF: M. tuberculosis terdeteksi (jumlah sedang), resistansi rifampisin tidak terdeteksi.', abnormal: true, critical: true }]],
    ['bta', [{ text: 'BTA sputum sewaktu-pagi-sewaktu: positif 2+ pada dua dari tiga spesimen.', abnormal: true }]],
    ['foto-toraks', [{ text: 'Foto toraks PA: infiltrat dengan kavitas di lapang atas paru kanan, tidak ada efusi pleura.', abnormal: true, imageId: 'cxr-tb-upper-lobe-cavity' }]],
    ['dpl', [{ text: 'Hb 11,8 g/dL, leukosit 11.200/uL, trombosit 410.000/uL.', abnormal: true }]],
    ['led', [{ text: 'LED 68 mm/jam (meningkat).', abnormal: true }]],
    ['hiv', [{ text: 'Tes HIV: non-reaktif. Disarankan tes ulang bila ada risiko dalam masa jendela.', abnormal: false }]],
    ['gula-puasa', [{ text: 'Glukosa darah puasa 96 mg/dL.', abnormal: false }]],
    ['sgot-sgpt', [{ text: 'SGOT 28 U/L, SGPT 26 U/L (baseline normal sebelum OAT).', abnormal: false }]],
    ['ureum-kreatinin', [{ text: 'Ureum 26, kreatinin 0,9 mg/dL.', abnormal: false }]],
    'ekg',
  ]),
  panels: [
    { id: 'panel-tb', label: 'Panel evaluasi TB', testIds: ['genexpert', 'foto-toraks', 'dpl', 'hiv', 'gula-puasa', 'sgot-sgpt'] },
  ],
  diagnoses: [
    { id: 'tb-paru-bakteriologis', label: 'TB paru terkonfirmasi bakteriologis (kasus baru)' },
    { id: 'pneumonia', label: 'Pneumonia komunitas' },
    { id: 'bronkiektasis', label: 'Bronkiektasis' },
    { id: 'keganasan-paru', label: 'Keganasan paru' },
    { id: 'ppok', label: 'PPOK eksaserbasi' },
  ],
  correctDiagnosisId: 'tb-paru-bakteriologis',
  differentialIds: ['pneumonia', 'bronkiektasis', 'keganasan-paru', 'ppok'],
  treatments: pickTreatments([
    'oat-kdt',
    'piridoksin',
    'edukasi-pmo',
    'skrining-kontak',
    'lapor-sitb',
    'rifampisin-tunggal',
    'levofloksasin',
    'amoksisilin',
    'parasetamol',
  ]),
  indicatedTreatmentIds: ['oat-kdt', 'edukasi-pmo', 'skrining-kontak', 'lapor-sitb', 'piridoksin'],
  criticalTreatmentIds: ['oat-kdt'],
  contraindicated: [
    { id: 'rifampisin-tunggal', reason: 'Monoterapi rifampisin memicu resistansi; OAT harus kombinasi.' },
    { id: 'levofloksasin', reason: 'Fluorokuinolon bukan lini pertama TB dan dapat menutupi diagnosis serta memicu resistansi.' },
  ],
  dispositions: pickDispositions(['pulang-kontrol', 'pulang', 'rawat-bangsal', 'rujuk-lanjut']),
  correctDispositionId: 'pulang-kontrol',
  acceptableDispositionIds: [],
  guidelineIds: ['kemenkes-pnpk-tb', 'who-tb-treatment'],
  rubric: buildRubric({
    criteria: [
      crit('an-01', 'anamnesis', 2, 'Karakter batuk', P.asked(['onset', 'dahak'], 2), {
        met: 'Lama batuk dan karakter dahak ditanyakan.',
        partial: 'Hanya sebagian karakter batuk ditanyakan.',
        missed: 'Karakter batuk tidak digali.',
      }, { partial: P.asked(['onset', 'dahak'], 1), improve: 'Tanyakan lama batuk dan karakter dahak.' }),
      crit('an-02', 'anamnesis', 3, 'Gejala konstitusional TB', P.asked(['demam-sore', 'keringat-malam', 'bb-turun', 'nafsu'], 3), {
        met: 'Demam, keringat malam, penurunan berat badan, dan nafsu makan ditanyakan.',
        partial: 'Sebagian gejala konstitusional ditanyakan.',
        missed: 'Gejala konstitusional tidak ditanyakan.',
      }, { partial: P.asked(['demam-sore', 'keringat-malam', 'bb-turun', 'nafsu'], 2), ref: 'kemenkes-pnpk-tb', improve: 'Tanyakan demam, keringat malam, penurunan berat badan, dan nafsu makan.' }),
      crit('an-03', 'anamnesis', 2, 'Tanda bahaya: batuk darah dan sesak', P.asked(['batuk-darah', 'sesak'], 2), {
        met: 'Batuk darah dan sesak ditanyakan.',
        partial: 'Hanya salah satu tanda bahaya ditanyakan.',
        missed: 'Tanda bahaya tidak ditanyakan.',
      }, { partial: P.asked(['batuk-darah', 'sesak'], 1), improve: 'Tanyakan batuk darah dan sesak napas.' }),
      crit('an-04', 'anamnesis', 2, 'Kontak dan riwayat pengobatan TB', P.asked(['kontak-tb', 'riwayat-tb'], 2), {
        met: 'Kontak TB dan riwayat pengobatan ditanyakan.',
        partial: 'Hanya salah satu dari kontak atau riwayat pengobatan ditanyakan.',
        missed: 'Kontak TB dan riwayat pengobatan tidak ditanyakan.',
      }, { partial: P.asked(['kontak-tb', 'riwayat-tb'], 1), improve: 'Tanyakan kontak TB dan riwayat pengobatan TB sebelumnya (menentukan tipe kasus).' }),
      crit('an-05', 'anamnesis', 1, 'Komorbid dan faktor risiko HIV', P.asked(['rpd-dm', 'hiv-risiko'], 2), {
        met: 'Diabetes dan faktor risiko HIV ditanyakan.',
        partial: 'Hanya salah satu komorbid ditanyakan.',
        missed: 'Komorbid tidak ditanyakan.',
      }, { partial: P.asked(['rpd-dm', 'hiv-risiko'], 1), ref: 'kemenkes-pnpk-tb', improve: 'Tanyakan diabetes dan faktor risiko HIV. Bangun kepercayaan agar pasien terbuka.' }),
      crit('an-06', 'anamnesis', 1, 'Alergi obat', P.asked(['alergi-obat']), {
        met: 'Alergi obat ditanyakan.',
        missed: 'Alergi obat tidak ditanyakan sebelum meresepkan OAT.',
      }, { improve: 'Tanyakan alergi sebelum meresepkan.' }),
      crit('pe-01', 'pemeriksaan', 2, 'Pemeriksaan paru', P.examined(['paru']), {
        met: 'Paru diperiksa.',
        missed: 'Paru tidak diperiksa.',
      }, { improve: 'Periksa paru: ronki di apeks sering ditemukan pada TB.' }),
      crit('pe-02', 'pemeriksaan', 1, 'Status gizi', P.examined(['umum']), {
        met: 'Keadaan umum dan gizi dinilai.',
        missed: 'Status gizi tidak dinilai.',
      }, { improve: 'Timbang berat badan: dosis OAT bergantung pada berat badan.' }),
      crit('pe-03', 'pemeriksaan', 1, 'Kelenjar getah bening leher', P.examined(['limfonodi']), {
        met: 'Kelenjar getah bening diperiksa.',
        missed: 'Kelenjar getah bening tidak diperiksa.',
      }, { improve: 'Periksa kelenjar getah bening leher untuk TB ekstraparu.' }),
      crit('pn-01', 'penalaran', 3, 'Tes cepat molekuler (GeneXpert)', P.ordered(['genexpert']), {
        met: 'GeneXpert dipesan.',
        missed: 'GeneXpert tidak dipesan.',
      }, { ref: 'kemenkes-pnpk-tb', improve: 'Tes cepat molekuler adalah alat diagnosis utama TB dan menilai resistansi rifampisin.', highlight: 'Anda memakai tes cepat molekuler sebagai alat diagnosis utama.' }),
      crit('pn-02', 'penalaran', 2, 'Foto toraks', P.ordered(['foto-toraks']), {
        met: 'Foto toraks dipesan.',
        missed: 'Foto toraks tidak dipesan.',
      }, { ref: 'kemenkes-pnpk-tb', improve: 'Foto toraks membantu menilai luas lesi.' }),
      crit('pn-03', 'penalaran', 3, 'Diagnosis TB paru', P.dx, {
        met: 'Diagnosis TB paru benar.',
        missed: 'Diagnosis tidak sesuai dengan hasil pemeriksaan.',
      }, { ref: 'kemenkes-pnpk-tb', improve: 'GeneXpert terdeteksi MTB dengan klinis khas mengonfirmasi TB paru.' }),
      crit('pn-04', 'penalaran', 1, 'Tes HIV dan gula darah', P.ordered(['hiv', 'gula-puasa'], 1), {
        met: 'Tes HIV atau gula darah dipesan.',
        missed: 'Skrining komorbid tidak dipesan.',
      }, { ref: 'kemenkes-pnpk-tb', improve: 'Tawarkan tes HIV dan periksa gula darah pada pasien TB.' }),
      crit('pn-05', 'penalaran', 1, 'Fungsi hati baseline', P.ordered(['sgot-sgpt']), {
        met: 'Fungsi hati baseline diperiksa.',
        missed: 'Fungsi hati baseline tidak diperiksa.',
      }, { improve: 'Periksa fungsi hati sebelum OAT sebagai pembanding.' }),
      crit('tr-01', 'terapi', 3, 'OAT kombinasi dosis tetap', P.treated(['oat-kdt']), {
        met: 'OAT KDT fase intensif diresepkan.',
        missed: 'OAT tidak diresepkan.',
      }, { ref: 'kemenkes-pnpk-tb', improve: 'Kasus baru TB paru: 2RHZE lalu 4RH, dosis menurut berat badan.', highlight: 'Regimen OAT sesuai untuk kasus baru.' }),
      crit('tr-02', 'terapi', 2, 'Edukasi dan pengawas menelan obat', P.treated(['edukasi-pmo']), {
        met: 'Edukasi dan PMO dilakukan.',
        missed: 'Edukasi dan PMO tidak dilakukan.',
      }, { ref: 'kemenkes-pnpk-tb', improve: 'Tunjuk PMO dan jelaskan pentingnya minum obat teratur sampai selesai.' }),
      crit('tr-03', 'terapi', 1, 'Skrining kontak dan pelaporan', P.treated(['skrining-kontak', 'lapor-sitb'], undefined, 1), {
        met: 'Skrining kontak atau pelaporan dilakukan.',
        missed: 'Skrining kontak dan pelaporan tidak dilakukan.',
      }, { ref: 'kemenkes-pnpk-tb', improve: 'Skrining kontak serumah dan catat kasus di SITB.' }),
      crit('tr-04', 'terapi', 1, 'Vitamin B6 pendamping', P.treated(['piridoksin']), {
        met: 'Piridoksin diresepkan.',
        missed: 'Piridoksin tidak diresepkan.',
      }, { improve: 'Piridoksin dapat membantu mencegah neuropati akibat isoniazid.' }),
      crit('tr-05', 'terapi', 2, 'Rawat jalan dengan kontrol', P.dispo, {
        met: 'Pasien pulang dengan jadwal kontrol.',
        missed: 'Disposisi tidak sesuai.',
      }, { improve: 'TB tanpa tanda bahaya berat diobati rawat jalan dengan kontrol teratur.' }),
      crit('ks-01', 'keselamatan', 3, 'Tidak memberi monoterapi atau fluorokuinolon', P.not(P.treated('contraindicated')), {
        met: 'Tidak ada obat kontraindikasi.',
        missed: 'Obat yang tidak sesuai (monoterapi atau fluorokuinolon) diberikan.',
      }, { ref: 'kemenkes-pnpk-tb', improve: 'Hindari monoterapi dan fluorokuinolon untuk TB sensitif obat.' }),
      safetyNetCriterion(2, 'kemenkes-pnpk-tb'),
    ],
    breaches: [
      { id: 'br-kontra', when: P.treated('contraindicated'), what: 'Memberikan monoterapi rifampisin atau fluorokuinolon untuk TB paru.', guidelineRef: 'kemenkes-pnpk-tb' },
      { id: 'br-tanpa-oat', when: P.not(P.treated(['oat-kdt'])), what: 'TB paru terkonfirmasi tidak diberi OAT.', guidelineRef: 'kemenkes-pnpk-tb' },
    ],
    teachingPoints: [
      'Batuk lebih dari 2 minggu memerlukan evaluasi TB; GeneXpert adalah pemeriksaan diagnostik utama.',
      'OAT kasus baru: 2RHZE lalu 4RH dengan dosis menurut berat badan, dipantau PMO.',
      'Faktor risiko sensitif seperti HIV baru terbuka bila pasien percaya Anda.',
    ],
  }),
}
