// Kasus 3 (IGD): malaria berat (Plasmodium falciparum) setelah bepergian ke daerah endemis. SINTETIS.
// Konsultan medis harus memvalidasi dosis artesunat, ambang parasitemia, dan alur sebelum dipakai di luar simulasi.

import { buildRubric, crit, defaultFallbacks, exam, iceEntries, makeTests, P, pickDispositions, pickTreatments, q, safetyNetCriterion, vitals } from '../builders'
import type { Case } from '../types'

const MODE = 'er' as const

export const malariaCase: Case = {
  id: 'er-malaria-berat',
  mode: MODE,
  specialty: 'Penyakit Dalam / Tropik Infeksi / IGD',
  difficulty: 'sulit',
  synthetic: true,
  severity: 'critical',
  title: 'Malaria berat setelah bepergian dari daerah endemis',
  patient: { name: 'Hendra Saputra', age: 34, gender: 'M', occupation: 'Pekerja proyek konstruksi' },
  arrivalBlurb: 'Laki-laki 34 tahun diantar istri, demam menggigil 5 hari, mata kuning, tampak mengantuk dan kurang nyambung.',
  chiefComplaint: 'Demam menggigil terus, Dok, dan sekarang badan lemas sekali.',
  vitals: vitals(112, '100/60', 26, 94, 39.2, 13),
  initialTrust: 50,
  greeting: 'Dok... saya demam terus...',
  farewell: 'Terima kasih, Dok.',
  fallbacks: defaultFallbacks({
    unclear: [
      'Hah... apa Dok? Saya ngantuk sekali...',
      'Maaf Dok, saya kurang paham, bisa diulang?',
      'Maksud Dokter bagaimana ya?',
    ],
    empathyReply: 'Iya, Dok... saya capek sekali. Terima kasih.',
  }),
  dialogue: [
    q('keluhan-utama', 'rps', 'Keluhan utama Bapak apa?', 'Demam menggigil terus, Dok, sudah lima hari. Sekarang badan lemas dan mata kuning.', ['keluhan utama', 'apa keluhan', 'keluhan apa', 'ada keluhan', 'cerita keluhan', 'mengapa datang']),
    q('onset', 'rps', 'Demamnya sejak kapan?', 'Sudah lima hari, Dok. Awalnya hanya meriang, lama-lama tinggi sekali.', ['demam sejak kapan', 'sejak kapan', 'kapan mulai', 'sudah berapa lama', 'berapa lama demam', 'berapa hari']),
    q('pola-demam', 'rps', 'Bagaimana pola demamnya? Apakah menggigil lalu berkeringat?', 'Iya, Dok, menggigil hebat dulu, lalu panas tinggi, lalu keringatan banyak. Hilang timbul tidak teratur.', ['pola demam', 'menggigil', 'berkeringat', 'hilang timbul', 'demam terus', 'keringat']),
    q('perjalanan', 'rps', 'Apakah Bapak baru bepergian ke luar kota atau ke daerah lain, misalnya Papua atau Kalimantan?', 'Iya, Dok. Dua belas hari lalu saya pulang dari proyek di Timika, Papua, kerja di sana tiga bulan.', ['bepergian', 'perjalanan', 'luar kota', 'pulang dari', 'baru pergi', 'papua', 'daerah endemis', 'luar daerah', 'mudik', 'dari mana']),
    q('kemoprofilaksis', 'rps', 'Selama di sana, apakah Bapak minum obat pencegahan malaria atau memakai kelambu?', 'Tidak, Dok. Kelambu jarang dipakai, obat pencegahan tidak minum. Nyamuk di sana banyak sekali.', ['obat pencegahan', 'pencegahan malaria', 'kelambu', 'kemoprofilaksis', 'gigitan nyamuk', 'nyamuk', 'lotion nyamuk']),
    q('riwayat-malaria', 'rpd', 'Apakah Bapak pernah menderita malaria sebelumnya?', 'Pernah, Dok, tiga tahun lalu di Kalimantan, diobati lima hari lalu sembuh.', ['riwayat malaria', 'pernah malaria', 'malaria sebelumnya', 'pernah sakit malaria', 'malaria']),
    q('kuning', 'rps', 'Apakah mata atau kulit Bapak tampak kuning?', 'Kata istri saya mata saya kuning sejak kemarin.', ['kuning', 'mata kuning', 'kulit kuning', 'ikterus'], { red: true }),
    q('urin-gelap', 'rps', 'Bagaimana warna dan jumlah buang air kecilnya?', 'Warnanya seperti teh pekat, Dok, dan sedikit sekali dari kemarin.', ['warna kencing', 'kencing gelap', 'kencing teh', 'kencing', 'urin', 'urin sedikit'], { red: true }),
    q('kesadaran', 'rps', 'Apakah Bapak sempat bingung, sangat mengantuk, atau bicara tidak nyambung?', 'Kata istri saya kadang bicara melantur, Dok. Saya memang ngantuk terus dan susah konsentrasi.', ['bingung', 'mengantuk', 'melantur', 'tidak nyambung', 'kesadaran', 'penurunan kesadaran'], { red: true }),
    q('kejang', 'rps', 'Apakah pernah kejang?', 'Belum, Dok, tapi tadi pagi tangan saya gemetar.', ['kejang', 'gemetar', 'kaku'], { red: true }),
    q('muntah-sesak', 'rps', 'Apakah ada muntah atau sesak napas?', 'Muntah dua kali tadi, Dok. Napas agak cepat.', ['muntah', 'sesak', 'mual', 'napas cepat']),
    q('perdarahan', 'rps', 'Apakah ada perdarahan, misalnya mimisan atau BAB hitam?', 'Tidak ada, Dok.', ['perdarahan', 'mimisan', 'bab hitam', 'darah']),
    ...iceEntries(
      'Saya kira kecapekan dan kena angin, Dok, tapi istri curiga malaria lagi.',
      'Saya takut ini malaria otak, Dok. Teman proyek ada yang meninggal.',
      'Saya mau disembuhkan, Dok, dan jangan sampai kritis.',
    ),
    q('rpd-umum', 'rpd', 'Apakah ada penyakit lain, misalnya penyakit hati atau ginjal atau kurang darah?', 'Tidak ada, Dok. Dulu sempat dibilang kurang darah sedikit.', ['riwayat penyakit', 'penyakit lain', 'penyakit dahulu', 'penyakit hati', 'penyakit ginjal', 'kurang darah', 'riwayat sakit', 'kronis']),
    q('keluarga-g6pd', 'keluarga', 'Apakah ada keluarga yang punya kelainan darah, misalnya kekurangan enzim G6PD atau anemia sel sabit?', 'Setahu saya tidak ada, Dok. Adik saya pernah kuning setelah minum obat, tapi tidak tahu sebabnya.', ['kelainan darah', 'g6pd', 'riwayat keluarga', 'keluarga sakit', 'keluarga anemia', 'keluarga']),
    q('alergi-obat', 'alergi', 'Apakah Bapak punya alergi obat?', 'Tidak ada, Dok.', ['alergi obat', 'alergi', 'alergi makanan']),
    q('obat-sendiri', 'obat', 'Obat apa yang sudah Bapak minum sejak sakit?', 'Parasetamol dari warung. Dua hari ini juga minum pil kina dari teman, Dok.', ['minum obat apa', 'obat apa', 'sudah minum obat', 'obat warung', 'obat sendiri', 'kina', 'obat malaria', 'makan obat', 'obat tradisional'], { gate: [55, 'Cuma parasetamol dari warung, Dok.'] }),
    q('pekerjaan', 'sosial', 'Pekerjaan Bapak apa dan bekerja di mana?', 'Pengawas proyek konstruksi. Sebulan terakhir baru pulang ke Jawa, Dok.', ['kerja', 'pekerjaan', 'profesi', 'bekerja di mana']),
    q('alkohol', 'sosial', 'Apakah Bapak minum alkohol atau merokok?', 'Merokok saja, Dok, setengah bungkus sehari. Alkohol tidak.', ['alkohol', 'rokok', 'merokok', 'minum alkohol'], { distractor: true }),
    q('trauma', 'rps', 'Apakah ada benturan di kepala atau kecelakaan?', 'Tidak, Dok.', ['trauma', 'benturan kepala', 'kecelakaan', 'jatuh'], { distractor: true }),
  ],
  exam: [
    exam('umum', 'umum', 'Keadaan umum dan kesadaran', 'Tampak sakit berat, apatis, GCS 13 (E3 V4 M6). Demam teraba panas.', { abnormal: true }),
    exam('kepala-leher', 'kepala-leher', 'Mata dan mulut', 'Sklera ikterik, konjungtiva anemis.', { abnormal: true }),
    exam('abdomen', 'abdomen', 'Abdomen', 'Hepar teraba 2 jari di bawah arkus kosta, lien teraba Schuffner 2, tidak ada nyeri tekan menetap.', { abnormal: true }),
    exam('paru', 'paru', 'Paru', 'Ronki basah halus minimal di basal kedua paru, frekuensi napas cepat.', { abnormal: true }),
    exam('jantung', 'jantung', 'Jantung', 'Takikardia reguler, tidak ada murmur.'),
    exam('neuro', 'neurologi', 'Neurologi', 'Tidak ada kaku kuduk, tidak ada defisit fokal, refleks fisiologis normal, refleks patologis negatif.'),
    exam('kulit', 'kulit', 'Kulit', 'Kulit hangat, ikterik, tidak ada petekie atau ruam.', { abnormal: true }),
    exam('ekstremitas', 'ekstremitas', 'Ekstremitas', 'Akral hangat, tidak ada edema.', { distractor: true }),
  ],
  tests: makeTests(MODE, [
    ['rdt-malaria', [{ text: 'RDT malaria: positif P. falciparum (HRP-2).', abnormal: true, critical: true }]],
    [
      'apusan-malaria',
      [
        {
          text: 'Apusan darah tebal dan tipis: P. falciparum, stadium trofozoit dan gametosit, parasitemia sekitar 12% eritrosit terinfeksi (hiperparasitemia).',
          abnormal: true,
          critical: true,
          imageId: 'smear-falciparum',
        },
      ],
    ],
    ['dpl', [{ text: 'Hb 8,4 g/dL, leukosit 6.200/uL, trombosit 58.000/uL. Anemia dan trombositopenia.', abnormal: true }]],
    [
      'gds',
      [
        { text: 'Glukosa darah sewaktu 138 mg/dL (setelah koreksi).', abnormal: false, afterTreatment: ['dextrose-40'] },
        { text: 'Glukosa darah sewaktu 48 mg/dL (hipoglikemia).', abnormal: true, critical: true },
      ],
    ],
    ['bilirubin', [{ text: 'Bilirubin total 4,8 mg/dL, direk 2,6 mg/dL.', abnormal: true }]],
    ['sgot-sgpt', [{ text: 'SGOT 88 U/L, SGPT 74 U/L.', abnormal: true }]],
    ['ureum-kreatinin', [{ text: 'Ureum 92 mg/dL, kreatinin 2,4 mg/dL (gangguan ginjal akut).', abnormal: true, critical: true }]],
    ['laktat', [{ text: 'Laktat 4,5 mmol/L (meningkat).', abnormal: true }]],
    ['agd', [{ text: 'pH 7,28, pCO2 26, HCO3 13 (asidosis metabolik).', abnormal: true }]],
    ['urinalisis', [{ text: 'Urinalisis: warna cokelat tua, bilirubin positif, protein ++, eritrosit 2-3/LPB.', abnormal: true }]],
    ['ns1', [{ text: 'NS1 antigen dengue: negatif.', abnormal: false }]],
    ['ekg', [{ text: 'EKG: sinus takikardia 112x/menit, tidak ada kelainan ST-T.', abnormal: true }]],
    ['foto-toraks', [{ text: 'Foto toraks: infiltrat interstisial ringan basal bilateral, jantung normal.', abnormal: true, imageId: 'cxr-interstitial-mild' }]],
    ['ct-kepala', [{ text: 'CT kepala tanpa kontras: tidak tampak perdarahan, infark, atau massa.', abnormal: false }]],
  ]),
  panels: [
    { id: 'panel-malaria', label: 'Panel malaria berat', testIds: ['apusan-malaria', 'rdt-malaria', 'dpl', 'gds', 'bilirubin', 'ureum-kreatinin'] },
  ],
  diagnoses: [
    { id: 'malaria-berat-pf', label: 'Malaria berat (P. falciparum)' },
    { id: 'malaria-tanpa-komplikasi', label: 'Malaria falciparum tanpa komplikasi' },
    { id: 'dbd', label: 'Demam berdarah dengue' },
    { id: 'tifoid', label: 'Demam tifoid dengan komplikasi' },
    { id: 'leptospirosis', label: 'Leptospirosis' },
  ],
  correctDiagnosisId: 'malaria-berat-pf',
  differentialIds: ['malaria-tanpa-komplikasi', 'dbd', 'tifoid', 'leptospirosis'],
  treatments: pickTreatments([
    'akses-iv',
    'monitor',
    'oksigen',
    'artesunat-iv',
    'dextrose-40',
    'kristaloid-hati',
    'parasetamol',
    'klorokuin',
    'deksametason',
    'ondansetron',
  ]),
  indicatedTreatmentIds: ['artesunat-iv', 'dextrose-40', 'akses-iv', 'monitor', 'kristaloid-hati', 'parasetamol'],
  criticalTreatmentIds: ['artesunat-iv', 'dextrose-40'],
  contraindicated: [
    { id: 'klorokuin', reason: 'Malaria falciparum berat memerlukan artesunat IV; klorokuin tidak efektif dan tidak sesuai untuk malaria berat.' },
    { id: 'deksametason', reason: 'Kortikosteroid tidak bermanfaat dan dapat merugikan pada malaria serebral.' },
  ],
  dispositions: pickDispositions(['pulang', 'observasi-igd', 'rawat-bangsal', 'rawat-icu', 'rujuk-lanjut']),
  correctDispositionId: 'rawat-icu',
  acceptableDispositionIds: [],
  er: {
    arrivalSec: 180,
    triage: {
      esi: 2,
      zone: 'red',
      reason: 'Demam menggigil dengan riwayat dari daerah endemis disertai ikterus dan GCS 13: tanda malaria berat sampai terbukti sebaliknya.',
    },
    timeline: [
      {
        stage: 1,
        atSec: 180,
        vitalsDelta: { hr: 8, gcs: -3, spo2: -1 },
        line: 'Pasien makin sulit dibangunkan dan tampak berkeringat dingin (curiga hipoglikemia).',
        averted: ['dextrose-40'],
      },
      {
        stage: 2,
        atSec: 360,
        vitalsDelta: { hr: 14, sbp: -16, dbp: -10, rr: 6, spo2: -4, gcs: -3 },
        line: 'Pasien kejang dan penurunan kesadaran bertambah berat.',
        averted: ['artesunat-iv'],
      },
      {
        stage: 3,
        atSec: 570,
        vitalsDelta: { hr: -60, sbp: -45, spo2: -20, gcs: -6 },
        line: 'Pasien henti napas dan henti jantung.',
        averted: ['artesunat-iv'],
      },
    ],
    effects: [
      { treatmentId: 'artesunat-iv', improves: true, vitalsDelta: { temp: -0.4 } },
      { treatmentId: 'dextrose-40', improves: true, vitalsDelta: { gcs: 2 } },
      { treatmentId: 'oksigen', vitalsDelta: { spo2: 2 } },
      { treatmentId: 'parasetamol', vitalsDelta: { temp: -0.6 } },
      { treatmentId: 'klorokuin', harmful: true },
      { treatmentId: 'deksametason', harmful: true },
    ],
    criticalDeadlineSec: 300,
  },
  guidelineIds: ['kemenkes-malaria', 'who-malaria'],
  rubric: buildRubric({
    criteria: [
      crit('an-01', 'anamnesis', 3, 'Riwayat perjalanan ke daerah endemis', P.asked(['perjalanan']), {
        met: 'Riwayat bepergian ke daerah endemis ditanyakan dan terungkap.',
        missed: 'Riwayat bepergian tidak ditanyakan.',
      }, { improve: 'Pada demam, selalu tanyakan perjalanan ke daerah endemis malaria dalam beberapa bulan terakhir.', highlight: 'Anda menemukan riwayat perjalanan ke daerah endemis.' }),
      crit('an-02', 'anamnesis', 2, 'Pola demam', P.asked(['onset', 'pola-demam'], 2), {
        met: 'Lama dan pola demam ditanyakan.',
        partial: 'Hanya sebagian pola demam ditanyakan.',
        missed: 'Pola demam tidak digali.',
      }, { partial: P.asked(['onset', 'pola-demam'], 1), improve: 'Tanyakan lama demam dan pola menggigil, panas, berkeringat.' }),
      crit('an-03', 'anamnesis', 2, 'Tanda malaria berat', P.asked(['kuning', 'urin-gelap', 'kesadaran', 'kejang', 'muntah-sesak'], 3), {
        met: 'Tanda malaria berat (ikterus, urin gelap, kesadaran, kejang) ditanyakan.',
        partial: 'Sebagian tanda malaria berat ditanyakan.',
        missed: 'Tanda malaria berat tidak ditanyakan.',
      }, { partial: P.asked(['kuning', 'urin-gelap', 'kesadaran', 'kejang', 'muntah-sesak'], 2), ref: 'who-malaria', improve: 'Tanyakan ikterus, urin gelap, penurunan kesadaran, dan kejang.' }),
      crit('an-04', 'anamnesis', 1, 'Kemoprofilaksis dan riwayat malaria', P.asked(['kemoprofilaksis', 'riwayat-malaria']), {
        met: 'Pencegahan dan riwayat malaria ditanyakan.',
        missed: 'Pencegahan dan riwayat malaria tidak ditanyakan.',
      }, { improve: 'Tanyakan penggunaan kelambu, kemoprofilaksis, dan riwayat malaria.' }),
      crit('an-05', 'anamnesis', 2, 'Obat yang sudah diminum dan alergi', P.asked(['obat-sendiri', 'alergi-obat'], 2), {
        met: 'Obat sebelumnya dan alergi ditanyakan.',
        partial: 'Hanya salah satu dari obat atau alergi ditanyakan.',
        missed: 'Obat sebelumnya dan alergi tidak ditanyakan.',
      }, { partial: P.asked(['obat-sendiri', 'alergi-obat'], 1), improve: 'Tanyakan obat yang sudah diminum, termasuk kina dari luar, dan alergi.' }),
      crit('pe-01', 'pemeriksaan', 2, 'Kesadaran dan neurologi', P.examined(['umum', 'neuro'], 2), {
        met: 'Kesadaran dan neurologi diperiksa.',
        partial: 'Hanya sebagian status kesadaran dinilai.',
        missed: 'Kesadaran dan neurologi tidak dinilai.',
      }, { partial: P.examined(['umum', 'neuro'], 1), improve: 'Nilai GCS dan tanda rangsang meningeal.' }),
      crit('pe-02', 'pemeriksaan', 2, 'Ikterus dan anemia', P.examined(['kepala-leher']), {
        met: 'Sklera dan konjungtiva diperiksa.',
        missed: 'Sklera dan konjungtiva tidak diperiksa.',
      }, { improve: 'Periksa sklera dan konjungtiva untuk ikterus dan anemia.' }),
      crit('pe-03', 'pemeriksaan', 1, 'Hepar dan lien', P.examined(['abdomen']), {
        met: 'Abdomen diperiksa.',
        missed: 'Abdomen tidak diperiksa.',
      }, { improve: 'Periksa hepatosplenomegali.' }),
      crit('pe-04', 'pemeriksaan', 1, 'Paru (edema paru)', P.examined(['paru']), {
        met: 'Paru diperiksa.',
        missed: 'Paru tidak diperiksa.',
      }, { improve: 'Periksa paru untuk edema paru atau ARDS.' }),
      crit('pn-01', 'penalaran', 3, 'Konfirmasi parasit malaria', P.ordered(['apusan-malaria', 'rdt-malaria']), {
        met: 'Apusan darah atau RDT malaria dipesan.',
        missed: 'Pemeriksaan parasit malaria tidak dipesan.',
      }, { ref: 'kemenkes-malaria', improve: 'Konfirmasi parasit dengan apusan darah atau RDT sebelum tatalaksana definitif.' }),
      crit('pn-02', 'penalaran', 2, 'Glukosa darah', P.ordered(['gds']), {
        met: 'Glukosa darah diperiksa.',
        missed: 'Glukosa darah tidak diperiksa.',
      }, { ref: 'who-malaria', improve: 'Hipoglikemia sering menyertai malaria berat; periksa gula darah pada penurunan kesadaran.' }),
      crit('pn-03', 'penalaran', 2, 'Laboratorium komplikasi', P.ordered(['ureum-kreatinin', 'bilirubin', 'dpl'], 2), {
        met: 'Laboratorium komplikasi dipesan.',
        partial: 'Hanya sebagian laboratorium komplikasi dipesan.',
        missed: 'Laboratorium komplikasi tidak dipesan.',
      }, { partial: P.ordered(['ureum-kreatinin', 'bilirubin', 'dpl'], 1), improve: 'Nilai hemoglobin, fungsi ginjal, dan bilirubin untuk kriteria malaria berat.' }),
      crit('pn-04', 'penalaran', 3, 'Diagnosis malaria berat', P.dx, {
        met: 'Diagnosis malaria berat benar.',
        missed: 'Diagnosis tidak sesuai dengan kriteria malaria berat.',
      }, { ref: 'kemenkes-malaria', improve: 'Parasitemia tinggi dengan penurunan kesadaran, ikterus, dan gangguan ginjal adalah malaria berat.' }),
      crit('pn-05', 'penalaran', 1, 'Tidak menunda terapi dengan CT kepala', P.not(P.ordered(['ct-kepala'])), {
        met: 'Tidak ada pemeriksaan yang menunda terapi.',
        missed: 'CT kepala dipesan dan berpotensi menunda terapi.',
      }, { improve: 'Mulai artesunat tanpa menunggu pencitraan.' }),
      crit('pn-06', 'penalaran', 1, 'Triase zona merah', { kind: 'triage', equals: 'correct' }, {
        met: 'Pasien ditempatkan di zona merah.',
        missed: 'Zona triase tidak sesuai kegawatan.',
      }, { improve: 'Penurunan kesadaran membuat pasien masuk zona merah.' }),
      crit('tr-01', 'terapi', 3, 'Artesunat intravena', P.treated(['artesunat-iv']), {
        met: 'Artesunat IV diberikan.',
        missed: 'Artesunat IV tidak diberikan.',
      }, { ref: 'who-malaria', improve: 'Malaria berat diterapi artesunat IV segera.', highlight: 'Artesunat IV diberikan sesuai tatalaksana malaria berat.' }),
      crit('tr-02', 'terapi', 2, 'Koreksi hipoglikemia', P.treated(['dextrose-40']), {
        met: 'Hipoglikemia dikoreksi.',
        missed: 'Hipoglikemia tidak dikoreksi.',
      }, { ref: 'who-malaria', improve: 'Berikan dekstrosa IV pada hipoglikemia dan ulang pemeriksaan gula darah.' }),
      crit('tr-03', 'terapi', 1, 'Akses IV, cairan hati-hati, monitoring', P.treated(['akses-iv', 'kristaloid-hati', 'monitor'], undefined, 2), {
        met: 'Akses IV, cairan hati-hati, dan monitoring dilakukan.',
        partial: 'Sebagian suportif dilakukan.',
        missed: 'Terapi suportif tidak dilakukan.',
      }, { partial: P.treated(['akses-iv', 'kristaloid-hati', 'monitor'], undefined, 1), improve: 'Pasang akses IV, berikan cairan hati-hati, dan monitor kontinu.' }),
      crit('tr-04', 'terapi', 2, 'Disposisi ICU', P.dispo, {
        met: 'Pasien dirawat di ICU.',
        missed: 'Disposisi tidak sesuai dengan malaria berat.',
      }, { ref: 'kemenkes-malaria', improve: 'Malaria berat dirawat di ICU atau ruang intensif.' }),
      crit('tr-05', 'terapi', 1, 'Antipiretik', P.treated(['parasetamol']), {
        met: 'Parasetamol diberikan.',
        missed: 'Antipiretik tidak diberikan.',
      }, { improve: 'Parasetamol untuk demam tinggi.' }),
      crit('ks-01', 'keselamatan', 3, 'Artesunat dalam 5 menit sejak masuk bed', P.treated(['artesunat-iv'], 300), {
        met: 'Artesunat diberikan dalam batas waktu.',
        missed: 'Artesunat terlambat atau tidak diberikan.',
      }, { ref: 'who-malaria', improve: 'Artesunat IV tidak boleh ditunda pada malaria berat.' }),
      crit('ks-02', 'keselamatan', 3, 'Tidak memberi klorokuin atau steroid', P.not(P.treated('contraindicated')), {
        met: 'Tidak ada obat kontraindikasi.',
        missed: 'Klorokuin atau deksametason diberikan.',
      }, { ref: 'who-malaria', improve: 'Hindari klorokuin dan steroid pada malaria berat.' }),
      crit('ks-03', 'keselamatan', 3, 'Pasien selamat', P.survived, {
        met: 'Pasien selamat sampai disposisi.',
        missed: 'Pasien meninggal selama penanganan.',
      }, { improve: 'Koreksi hipoglikemia dan mulai artesunat lebih awal.' }),
      safetyNetCriterion(1),
    ],
    breaches: [
      { id: 'br-kontra', when: P.treated('contraindicated'), what: 'Memberikan klorokuin atau deksametason pada malaria berat.', guidelineRef: 'who-malaria' },
      { id: 'br-pulang', when: { kind: 'disposition', equals: 'pulang' }, what: 'Memulangkan pasien malaria berat.', guidelineRef: 'kemenkes-malaria' },
      { id: 'br-tanpa-kritis', when: P.not(P.treated('critical')), what: 'Tidak memberikan artesunat atau koreksi hipoglikemia pada malaria berat.', guidelineRef: 'who-malaria' },
    ],
    teachingPoints: [
      'Demam dengan riwayat perjalanan ke daerah endemis adalah malaria sampai terbukti bukan.',
      'Malaria berat: artesunat IV segera; periksa dan koreksi hipoglikemia.',
      'Jangan menunda terapi untuk pencitraan, dan hindari steroid.',
    ],
  }),
}
