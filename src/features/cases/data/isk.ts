// Kasus (Poliklinik): sistitis akut tanpa komplikasi dengan riwayat alergi kotrimoksazol. SINTETIS.
// Konsultan medis harus memvalidasi pilihan antibiotik, dosis, dan pola resistansi lokal sebelum dipakai di luar simulasi.

import { buildRubric, crit, defaultFallbacks, exam, iceEntries, makeTests, P, pickDispositions, pickTreatments, q, safetyNetCriterion, vitals } from '../builders'
import type { Case } from '../types'

const MODE = 'poli' as const

export const iskCase: Case = {
  id: 'poli-isk',
  mode: MODE,
  specialty: 'Penyakit Dalam / Urologi',
  difficulty: 'mudah',
  synthetic: true,
  severity: 'stable',
  title: 'Nyeri saat kencing dan anyang-anyangan (ISK)',
  patient: { name: 'Putri Maharani', age: 24, gender: 'F', occupation: 'Karyawati minimarket' },
  arrivalBlurb: 'Perempuan 24 tahun dengan nyeri saat buang air kecil, sering kencing sedikit-sedikit sejak dua hari.',
  chiefComplaint: 'Kencing saya perih dan anyang-anyangan terus, Dok, sudah dua hari.',
  vitals: vitals(86, '112/70', 18, 99, 37.4),
  initialTrust: 54,
  greeting: 'Selamat pagi, Dok.',
  farewell: 'Baik, Dok. Obatnya saya minum sampai habis dan saya banyak minum air putih. Terima kasih.',
  fallbacks: defaultFallbacks(),
  dialogue: [
    q('keluhan-utama', 'rps', 'Keluhan utama kamu apa?', 'Kencing terasa perih dan saya anyang-anyangan, Dok, sedikit-sedikit tapi sering.', ['keluhan utama', 'apa keluhan', 'keluhan apa', 'ada keluhan', 'cerita keluhan', 'mengapa datang']),
    q('onset', 'rps', 'Keluhannya mulai sejak kapan?', 'Dua hari yang lalu, Dok. Awalnya cuma tidak enak, kemarin makin perih.', ['sejak kapan', 'kapan mulai', 'sudah berapa lama', 'berapa hari', 'mulai kapan']),
    q('disuria', 'rps', 'Seperti apa nyeri saat kencing? Di awal, di akhir, atau sepanjang kencing?', 'Seperti terbakar, Dok, terutama di akhir kencing. Setelah selesai masih perih sebentar.', ['nyeri kencing', 'perih kencing', 'kencing nyeri', 'kencing terbakar', 'disuria', 'nyeri saat kencing', 'kencing perih']),
    q('frekuensi', 'rps', 'Seberapa sering Anda kencing, dan apakah tidak bisa menahan?', 'Hampir tiap setengah jam, Dok, tapi keluarnya sedikit. Kadang sudah kebelet sekali, hampir tidak tertahan.', ['sering kencing', 'frekuensi kencing', 'berapa kali kencing', 'anyang-anyangan', 'tidak tertahan', 'kebelet']),
    q('tidak-tuntas', 'rps', 'Apakah setelah kencing masih terasa belum tuntas?', 'Iya, Dok, rasanya masih ada sisa dan ada nyeri tumpul di bawah pusar.', ['kencing tuntas', 'belum tuntas', 'rasa sisa', 'nyeri bawah pusar', 'nyeri suprapubik', 'tidak tuntas']),
    q('urin-berubah', 'rps', 'Apakah warna urin berubah, keruh, berbau, atau ada darah?', 'Keruh dan baunya menyengat, Dok. Kemarin sempat ada bercak merah muda di akhir.', ['warna urin', 'urin keruh', 'kencing berdarah', 'darah urin', 'urin berbau', 'kencing keruh', 'bau urin'], { red: true }),
    q('demam', 'rps', 'Apakah ada demam atau menggigil?', 'Badan agak hangat semalam, Dok, tapi tidak menggigil.', ['demam', 'menggigil', 'meriang', 'panas'], { red: true }),
    q('nyeri-pinggang', 'rps', 'Apakah ada nyeri pinggang atau nyeri di sisi punggung bawah?', 'Tidak, Dok. Nyerinya cuma di bawah perut.', ['nyeri pinggang', 'sakit pinggang', 'nyeri punggung', 'punggung bawah', 'pinggang'], { red: true }),
    q('mual-muntah', 'rps', 'Apakah ada mual atau muntah?', 'Tidak ada, Dok.', ['mual', 'muntah', 'mual muntah'], { red: true }),
    q('keputihan', 'rps', 'Apakah ada keputihan, gatal, atau luka di area kemaluan?', 'Tidak ada, Dok. Keputihan biasa saja, tidak gatal.', ['keputihan', 'gatal kemaluan', 'cairan vagina', 'luka kemaluan', 'keluar cairan']),
    q('haid-hamil', 'rps', 'Kapan haid terakhir, dan apakah ada kemungkinan hamil?', 'Haid terakhir tiga minggu lalu, Dok, lancar seperti biasa. Kemungkinan hamil kecil karena suami pakai kondom.', ['haid terakhir', 'hamil', 'kemungkinan hamil', 'menstruasi', 'telat haid', 'terlambat haid', 'hpht'], { red: true }),
    q('batu-ginjal', 'rpd', 'Apakah pernah ada batu ginjal, kolik, atau penyakit ginjal sebelumnya?', 'Tidak pernah, Dok.', ['batu ginjal', 'kencing batu', 'penyakit ginjal', 'nyeri kolik', 'riwayat ginjal', 'batu saluran']),
    q('isk-sebelumnya', 'rpd', 'Apakah pernah mengalami keluhan serupa atau infeksi kencing sebelumnya?', 'Pernah sekali setahun lalu, Dok. Diberi obat dari puskesmas dan sembuh.', ['keluhan serupa', 'isk sebelumnya', 'infeksi kencing', 'riwayat isk', 'pernah sakit', 'kambuh', 'riwayat infeksi']),
    q('diabetes', 'rpd', 'Apakah ada kencing manis atau penyakit kronis lain?', 'Tidak ada, Dok.', ['diabetes', 'gula', 'penyakit kronis', 'riwayat penyakit', 'penyakit dahulu', 'penyakit lain']),
    q('aktivitas-seksual', 'sosial', 'Apakah keluhan muncul setelah berhubungan intim, dan apakah ada pasangan baru?', 'Dua hari sebelum mulai memang habis berhubungan dengan suami, Dok. Pasangan baru tidak ada.', ['hubungan intim', 'berhubungan', 'pasangan baru', 'seksual', 'setelah berhubungan', 'ims'], { gate: [58, 'Itu urusan pribadi, Dok, tidak ada hubungannya.'] }),
    q('minum-air', 'sosial', 'Berapa banyak Anda minum air sehari, dan apakah sering menahan kencing?', 'Kurang, Dok, paling dua gelas. Kerja berdiri di kasir, sering menahan kencing berjam-jam.', ['minum air', 'banyak minum', 'menahan kencing', 'cairan', 'air putih', 'kurang minum']),
    q('kebersihan', 'sosial', 'Bagaimana cara membersihkan area kemaluan setelah buang air, dan apakah memakai pembersih khusus?', 'Cebok dari belakang ke depan kadang, Dok. Saya pakai sabun sirih kewanitaan tiap hari.', ['cebok', 'membersihkan', 'sabun kewanitaan', 'pembersih', 'kebersihan', 'sabun sirih', 'depan belakang']),
    ...iceEntries(
      'Saya kira karena kurang minum dan kecapekan kerja, Dok.',
      'Saya takut ini penyakit menular atau kena ginjal, Dok, apalagi sudah dua kali begini.',
      'Saya mau keluhannya cepat hilang, Dok, besok sudah masuk kerja lagi.',
    ),
    q('keluarga', 'keluarga', 'Apakah ada riwayat penyakit ginjal atau kencing manis di keluarga?', 'Ibu saya kencing manis, Dok. Ginjal tidak ada.', ['riwayat keluarga', 'keluarga sakit', 'keluarga penyakit', 'keluarga']),
    q('alergi-obat', 'alergi', 'Apakah Anda punya alergi obat?', 'Ada, Dok. Dulu waktu radang tenggorokan saya minum obat yang namanya Bactrim kalau tidak salah, habis itu bentol-bentol dan bibir bengkak.', ['alergi obat', 'alergi', 'bentol obat', 'reaksi obat', 'bibir bengkak']),
    q('obat-sudah', 'obat', 'Obat atau ramuan apa yang sudah Anda minum untuk keluhan ini?', 'Jamu kunyit dan air kelapa, Dok, sama minum obat penurun panas sekali. Antibiotik belum.', ['obat apa', 'sudah minum obat', 'minum obat', 'obat warung', 'jamu', 'ramuan', 'antibiotik', 'minum apa']),
    q('kontrasepsi', 'sosial', 'Apakah memakai alat kontrasepsi, dan jenis apa?', 'Kondom saja, Dok. Kadang spermisida.', ['kontrasepsi', 'kb', 'kondom', 'spermisida', 'alat kontrasepsi'], { distractor: true }),
    q('sesak', 'rps', 'Apakah ada sesak napas atau batuk?', 'Tidak ada, Dok.', ['sesak', 'batuk', 'napas'], { distractor: true }),
  ],
  exam: [
    exam('umum', 'umum', 'Keadaan umum', 'Tampak baik, compos mentis, tidak tampak dehidrasi. Suhu 37,4 derajat.'),
    exam('suprapubik', 'abdomen', 'Abdomen dan suprapubik', 'Datar, lemas, nyeri tekan ringan di suprapubik, kandung kemih tidak teraba penuh, tidak ada defans.', { abnormal: true }),
    exam('cva', 'abdomen', 'Nyeri ketok sudut kostovertebra', 'Negatif kiri dan kanan.'),
    exam('jantung', 'jantung', 'Jantung', 'S1 S2 reguler, tidak ada murmur.', { distractor: true }),
    exam('paru', 'paru', 'Paru', 'Vesikuler, tidak ada ronki maupun mengi.', { distractor: true }),
  ],
  tests: makeTests(MODE, [
    ['urinalisis', [{ text: 'Urinalisis: leukosit esterase +3, nitrit positif, eritrosit +1, protein negatif. Sedimen: leukosit 25-30/LPB, bakteri banyak.', abnormal: true }]],
    ['kultur-urin', [{ text: 'Kultur urin: Escherichia coli lebih dari 100.000 CFU/mL. Sensitif terhadap nitrofurantoin dan fosfomisin; resistan terhadap ampisilin dan kotrimoksazol.', abnormal: true }]],
    ['tes-kehamilan', [{ text: 'Tes kehamilan urin: negatif.', abnormal: false }]],
    ['dpl', [{ text: 'Hb 12,6 g/dL, leukosit 9.400/uL, trombosit 290.000/uL.', abnormal: false }]],
    ['ureum-kreatinin', [{ text: 'Ureum 22, kreatinin 0,7 mg/dL (normal).', abnormal: false }]],
    ['gds', [{ text: 'Glukosa darah sewaktu 98 mg/dL.', abnormal: false }]],
    ['usg-abdomen', [{ text: 'USG ginjal dan kandung kemih: ginjal normal, tidak ada hidronefrosis maupun batu, dinding kandung kemih sedikit menebal.', abnormal: false }]],
  ]),
  panels: [
    { id: 'panel-isk', label: 'Panel infeksi saluran kemih', testIds: ['urinalisis', 'kultur-urin', 'tes-kehamilan', 'ureum-kreatinin'] },
  ],
  diagnoses: [
    { id: 'sistitis-akut', label: 'Sistitis akut tanpa komplikasi' },
    { id: 'pielonefritis-akut', label: 'Pielonefritis akut' },
    { id: 'uretritis-ims', label: 'Uretritis atau infeksi menular seksual' },
    { id: 'vaginitis', label: 'Vaginitis atau kandidiasis vulvovaginal' },
    { id: 'batu-saluran-kemih', label: 'Batu saluran kemih' },
  ],
  correctDiagnosisId: 'sistitis-akut',
  differentialIds: ['pielonefritis-akut', 'uretritis-ims', 'vaginitis', 'batu-saluran-kemih'],
  treatments: pickTreatments([
    'fosfomisin-3g',
    'nitrofurantoin-100',
    'kotrimoksazol-960',
    'siprofloksasin-500',
    'amoksisilin',
    'parasetamol',
    'edukasi-isk',
  ]),
  indicatedTreatmentIds: ['fosfomisin-3g', 'nitrofurantoin-100', 'edukasi-isk'],
  criticalTreatmentIds: ['fosfomisin-3g'],
  contraindicated: [
    { id: 'kotrimoksazol-960', reason: 'Pasien melaporkan reaksi alergi (bentol dan bibir bengkak) setelah minum kotrimoksazol (Bactrim); obat ini dikontraindikasikan.' },
  ],
  dispositions: pickDispositions(['pulang-kontrol', 'pulang', 'rawat-bangsal', 'rujuk-lanjut']),
  correctDispositionId: 'pulang-kontrol',
  acceptableDispositionIds: [],
  guidelineIds: ['idsa-esc-isk-2010', 'iaui-isk'],
  rubric: buildRubric({
    criteria: [
      crit('an-01', 'anamnesis', 3, 'Gejala khas sistitis', P.asked(['disuria', 'frekuensi', 'tidak-tuntas'], 3), {
        met: 'Disuria, frekuensi, dan rasa belum tuntas ditanyakan.',
        partial: 'Sebagian gejala berkemih ditanyakan.',
        missed: 'Gejala berkemih tidak digali.',
      }, { partial: P.asked(['disuria', 'frekuensi', 'tidak-tuntas'], 2), ref: 'iaui-isk', improve: 'Tanyakan nyeri saat kencing, frekuensi, urgensi, dan rasa belum tuntas.' }),
      crit('an-02', 'anamnesis', 3, 'Menyingkirkan ISK atas dan komplikasi', P.asked(['demam', 'nyeri-pinggang', 'mual-muntah'], 3), {
        met: 'Demam, nyeri pinggang, dan mual ditanyakan.',
        partial: 'Sebagian tanda ISK atas ditanyakan.',
        missed: 'Tanda pielonefritis tidak ditanyakan.',
      }, { partial: P.asked(['demam', 'nyeri-pinggang', 'mual-muntah'], 2), ref: 'idsa-esc-isk-2010', improve: 'Tanyakan demam, nyeri pinggang, dan muntah untuk menyingkirkan pielonefritis.', highlight: 'Anda membedakan sistitis dari pielonefritis lewat tanda bahaya.' }),
      crit('an-03', 'anamnesis', 2, 'Kemungkinan kehamilan', P.asked(['haid-hamil']), {
        met: 'Haid terakhir dan kemungkinan hamil ditanyakan.',
        missed: 'Kemungkinan kehamilan tidak ditanyakan.',
      }, { improve: 'Pada perempuan usia subur, tanyakan kehamilan sebelum memilih antibiotik.' }),
      crit('an-04', 'anamnesis', 3, 'Alergi obat', P.asked(['alergi-obat']), {
        met: 'Alergi obat ditanyakan dan reaksi terhadap kotrimoksazol terungkap.',
        missed: 'Alergi obat tidak ditanyakan sebelum meresepkan antibiotik.',
      }, { improve: 'Selalu tanyakan alergi obat sebelum meresepkan antibiotik.', highlight: 'Anda menemukan alergi kotrimoksazol sebelum meresepkan.' }),
      crit('an-05', 'anamnesis', 2, 'Faktor risiko dan diferensial', P.asked(['keputihan', 'aktivitas-seksual', 'minum-air', 'isk-sebelumnya'], 3), {
        met: 'Faktor risiko dan diferensial IMS atau vaginitis digali.',
        partial: 'Sebagian faktor risiko digali.',
        missed: 'Faktor risiko tidak digali.',
      }, { partial: P.asked(['keputihan', 'aktivitas-seksual', 'minum-air', 'isk-sebelumnya'], 2), improve: 'Tanyakan keputihan, hubungan intim, kebiasaan minum dan menahan kencing, serta riwayat ISK.' }),
      crit('an-06', 'anamnesis', 1, 'Komorbid', P.asked(['diabetes', 'batu-ginjal'], 1), {
        met: 'Komorbid atau riwayat batu ditanyakan.',
        missed: 'Komorbid tidak ditanyakan.',
      }, { improve: 'Tanyakan diabetes dan batu saluran kemih: menentukan ISK tanpa atau dengan komplikasi.' }),
      crit('pe-01', 'pemeriksaan', 2, 'Abdomen dan nyeri ketok sudut kostovertebra', P.examined(['suprapubik', 'cva'], 2), {
        met: 'Suprapubik dan sudut kostovertebra diperiksa.',
        partial: 'Hanya salah satu diperiksa.',
        missed: 'Abdomen dan sudut kostovertebra tidak diperiksa.',
      }, { partial: P.examined(['suprapubik', 'cva'], 1), improve: 'Periksa nyeri tekan suprapubik dan nyeri ketok sudut kostovertebra.' }),
      crit('pe-02', 'pemeriksaan', 1, 'Keadaan umum dan suhu', P.examined(['umum']), {
        met: 'Keadaan umum dinilai.',
        missed: 'Keadaan umum tidak dinilai.',
      }, { improve: 'Nilai keadaan umum dan tanda dehidrasi.' }),
      crit('pn-01', 'penalaran', 3, 'Urinalisis', P.ordered(['urinalisis']), {
        met: 'Urinalisis dipesan.',
        missed: 'Urinalisis tidak dipesan.',
      }, { ref: 'iaui-isk', improve: 'Urinalisis (leukosit esterase dan nitrit) mendukung diagnosis sistitis.' }),
      crit('pn-02', 'penalaran', 2, 'Tes kehamilan', P.ordered(['tes-kehamilan']), {
        met: 'Tes kehamilan dipesan.',
        missed: 'Tes kehamilan tidak dipesan.',
      }, { improve: 'Pada perempuan usia subur, tes kehamilan menentukan keamanan antibiotik.' }),
      crit('pn-03', 'penalaran', 3, 'Diagnosis sistitis akut', P.dx, {
        met: 'Diagnosis sistitis akut benar.',
        missed: 'Diagnosis tidak sesuai dengan klinis dan hasil urinalisis.',
      }, { ref: 'idsa-esc-isk-2010', improve: 'Gejala berkemih tanpa demam atau nyeri pinggang dengan nitrit positif mengarah ke sistitis.' }),
      crit('pn-04', 'penalaran', 1, 'Kultur urin', P.ordered(['kultur-urin']), {
        met: 'Kultur urin dipesan.',
        missed: 'Kultur urin tidak dipesan.',
      }, { improve: 'Kultur membantu pada riwayat ISK berulang atau resistansi lokal tinggi.' }),
      crit('pn-05', 'penalaran', 1, 'Pemeriksaan efisien', P.not(P.ordered(['usg-abdomen'])), {
        met: 'Tidak ada pemeriksaan yang tidak perlu.',
        missed: 'USG dipesan tanpa indikasi.',
      }, { improve: 'USG tidak diperlukan pada sistitis tanpa komplikasi.' }),
      crit('tr-01', 'terapi', 3, 'Antibiotik lini pertama yang sesuai', P.treated(['fosfomisin-3g', 'nitrofurantoin-100']), {
        met: 'Antibiotik lini pertama yang aman diresepkan.',
        missed: 'Antibiotik yang sesuai tidak diresepkan.',
      }, { ref: 'idsa-esc-isk-2010', improve: 'Pada sistitis tanpa komplikasi, nitrofurantoin atau fosfomisin dosis tunggal adalah pilihan; hindari obat yang pasien alergi.', highlight: 'Antibiotik yang dipilih tepat dan aman bagi pasien ini.' }),
      crit('tr-02', 'terapi', 2, 'Edukasi minum, kebiasaan, dan kebersihan', P.treated(['edukasi-isk']), {
        met: 'Edukasi pencegahan diberikan.',
        missed: 'Edukasi tidak diberikan.',
      }, { ref: 'iaui-isk', improve: 'Edukasi cukup minum, jangan menahan kencing, cebok dari depan ke belakang, kencing setelah berhubungan.' }),
      crit('tr-03', 'terapi', 2, 'Rawat jalan dengan kontrol', P.dispo, {
        met: 'Pasien pulang dengan jadwal kontrol.',
        missed: 'Disposisi tidak sesuai.',
      }, { improve: 'Sistitis tanpa komplikasi diobati rawat jalan; kontrol bila tidak membaik dalam 2 sampai 3 hari.' }),
      crit('ks-01', 'keselamatan', 3, 'Tidak memberi obat yang pasien alergi', P.not(P.treated('contraindicated')), {
        met: 'Tidak ada obat kontraindikasi.',
        missed: 'Kotrimoksazol diberikan walau pasien alergi.',
      }, { ref: 'iaui-isk', improve: 'Periksa kembali riwayat alergi sebelum menulis resep.' }),
      safetyNetCriterion(2, 'idsa-esc-isk-2010'),
    ],
    breaches: [
      { id: 'br-alergi', when: P.treated('contraindicated'), what: 'Meresepkan kotrimoksazol pada pasien dengan riwayat alergi berat terhadap obat tersebut.', guidelineRef: 'iaui-isk' },
      { id: 'br-tanpa-antibiotik', when: P.not(P.treated(['fosfomisin-3g', 'nitrofurantoin-100', 'siprofloksasin-500'])), what: 'Sistitis bergejala tidak diberi antibiotik.', guidelineRef: 'idsa-esc-isk-2010' },
    ],
    teachingPoints: [
      'Selalu tanyakan alergi obat sebelum meresepkan antibiotik; reaksi terhadap sulfa adalah jebakan umum.',
      'Sistitis tanpa demam dan tanpa nyeri pinggang dapat diobati rawat jalan; tanda ISK atas mengubah pilihan obat dan lama terapi.',
      'Pada perempuan usia subur, pastikan kehamilan sebelum memilih antibiotik dan pesan kultur bila ada riwayat berulang.',
    ],
  }),
}
