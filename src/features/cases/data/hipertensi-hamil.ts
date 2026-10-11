// Kasus (Poliklinik): hipertensi kronik pada kehamilan 13 minggu dengan penghambat reseptor angiotensin. SINTETIS.
// Konsultan medis (dokter obstetri) harus memvalidasi pilihan antihipertensi, dosis aspirin, dan waktu mulai sebelum dipakai di luar simulasi.

import { buildRubric, crit, defaultFallbacks, exam, iceEntries, makeTests, P, pickDispositions, pickTreatments, q, safetyNetCriterion, vitals } from '../builders'
import type { Case } from '../types'

const MODE = 'poli' as const

export const hipertensiHamilCase: Case = {
  id: 'poli-hipertensi-hamil',
  mode: MODE,
  specialty: 'Obstetri / Penyakit Dalam',
  difficulty: 'sulit',
  synthetic: true,
  severity: 'urgent',
  title: 'Darah tinggi saat hamil muda',
  patient: { name: 'Ratna Kusuma Dewi', age: 34, gender: 'F', occupation: 'Guru sekolah dasar' },
  arrivalBlurb: 'Perempuan 34 tahun, hamil kedua sekitar 13 minggu, punya darah tinggi sejak tiga tahun dan masih minum obat tensinya.',
  chiefComplaint: 'Saya hamil lagi, Dok, dan tensi saya masih tinggi. Saya mau periksa kehamilan sekaligus tensi.',
  vitals: vitals(84, '148/96', 18, 98, 36.7),
  initialTrust: 50,
  greeting: 'Selamat pagi, Dok.',
  farewell: 'Terima kasih, Dok. Saya ganti obatnya dan akan kontrol sesuai jadwal. Semoga bayi saya sehat.',
  fallbacks: defaultFallbacks(),
  dialogue: [
    q('keluhan-utama', 'rps', 'Keluhan atau tujuan Ibu datang hari ini apa?', 'Saya hamil lagi, Dok, periksa kehamilan. Sama mau cek tensi, karena saya darah tinggi.', ['keluhan utama', 'apa keluhan', 'keluhan apa', 'ada keluhan', 'cerita keluhan', 'mengapa datang', 'tujuan datang']),
    q('usia-hamil', 'rps', 'Haid terakhir kapan, dan sekarang usia kehamilannya berapa minggu?', 'Haid terakhir tiga bulan lalu, Dok, kira-kira sudah tiga belas minggu. Tadi di bidan sudah di-USG, katanya janinnya hidup.', ['haid terakhir', 'usia kehamilan', 'berapa minggu hamil', 'hpht', 'umur kehamilan', 'hamil berapa', 'haid']),
    q('keluhan-hamil', 'rps', 'Bagaimana keluhan kehamilannya, apakah ada mual, muntah, atau perdarahan?', 'Mual pagi hari saja, Dok, sudah mulai berkurang. Perdarahan tidak ada.', ['mual muntah', 'mual hamil', 'perdarahan vagina', 'flek', 'keluhan hamil', 'perdarahan']),
    q('sakit-kepala', 'rps', 'Apakah ada sakit kepala hebat, pandangan kabur, atau nyeri ulu hati?', 'Kadang pusing ringan, Dok. Pandangan kabur tidak, ulu hati juga tidak sakit.', ['sakit kepala hebat', 'nyeri kepala', 'pandangan kabur', 'nyeri ulu hati', 'pusing', 'penglihatan'], { red: true }),
    q('bengkak', 'rps', 'Apakah ada bengkak di kaki, tangan, atau wajah, dan sesak napas?', 'Kaki tidak bengkak, Dok. Sesak napas tidak ada.', ['bengkak kaki', 'bengkak wajah', 'edema', 'sesak', 'bengkak tangan'], { red: true }),
    q('nyeri-dada', 'rps', 'Apakah ada nyeri dada atau jantung berdebar?', 'Tidak ada nyeri dada, Dok. Berdebar kadang kalau naik tangga di sekolah.', ['nyeri dada', 'jantung berdebar', 'berdebar', 'dada sakit'], { red: true }),
    q('rpd-ht', 'rpd', 'Sejak kapan Ibu menderita darah tinggi, dan bagaimana tensi hariannya?', 'Sejak tiga tahun lalu, Dok. Di rumah biasanya sekitar 140 per 90.', ['sejak kapan hipertensi', 'menderita hipertensi', 'riwayat hipertensi', 'hipertensi', 'tensi', 'tekanan darah', 'riwayat penyakit', 'penyakit dahulu']),
    q('obat-sudah', 'obat', 'Obat tekanan darah apa yang Ibu minum, dan apakah masih diminum?', 'Telmisartan empat puluh miligram tiap pagi, Dok. Saya baru tahu hamil sebulan lalu dan masih saya minum. Waktu itu saya belum bertanya apakah aman.', ['obat tensi', 'obat hipertensi', 'minum obat apa', 'obat apa', 'telmisartan', 'obat darah tinggi', 'obat rutin', 'obat tekanan darah']),
    q('obat-lain', 'obat', 'Apakah Ibu minum vitamin, jamu, atau obat lain selama hamil?', 'Vitamin dari bidan dan asam folat, Dok. Jamu tidak.', ['vitamin', 'jamu', 'obat lain', 'suplemen', 'asam folat', 'obat herbal']),
    q('hamil-pertama', 'rpd', 'Bagaimana kehamilan dan persalinan yang pertama? Apakah ada tensi tinggi atau kejang waktu itu?', 'Anak pertama lahir di usia 34 minggu, Dok. Waktu hamil tensi saya naik dan ada bengkak dan protein di urin, kata dokter pre-eklamsia. Dilahirkan lebih cepat.', ['kehamilan pertama', 'persalinan pertama', 'riwayat preeklamsia', 'preeklamsia', 'kejang hamil', 'kehamilan sebelumnya', 'anak pertama', 'riwayat hamil'], { gate: [56, 'Kehamilan pertama biasa saja, Dok, lahir normal.'] }),
    q('rpd-ginjal', 'rpd', 'Apakah ada riwayat sakit ginjal, kencing manis, lupus, atau penyakit autoimun?', 'Tidak ada, Dok. Ginjal dan gula terakhir diperiksa tahun lalu normal.', ['riwayat ginjal', 'penyakit ginjal', 'diabetes', 'lupus', 'autoimun', 'kencing manis', 'sakit ginjal']),
    q('diet-garam', 'sosial', 'Bagaimana pola makan Ibu? Suka makanan asin atau berlemak?', 'Biasa saja, Dok. Kadang jajan gorengan dan mie instan di sekolah.', ['pola makan', 'makanan asin', 'garam', 'diet', 'mie instan', 'makan']),
    q('aktivitas-stres', 'sosial', 'Bagaimana pekerjaan dan tidur Ibu? Apakah banyak beban pikiran?', 'Mengajar enam jam sehari, Dok, kadang pulang capek. Tidur cukup, beban pikiran biasa.', ['pekerjaan', 'beban pikiran', 'stres', 'tidur', 'kerja', 'capek']),
    ...iceEntries(
      'Saya kira tensi naik karena hamil dan capek mengajar, Dok.',
      'Saya takut obat yang saya minum membahayakan bayi, Dok, dan takut pre-eklamsia lagi seperti anak pertama.',
      'Saya mau hamil kali ini selamat sampai cukup bulan, Dok. Obatnya yang aman saja.',
    ),
    q('keluarga', 'keluarga', 'Apakah ada riwayat darah tinggi atau pre-eklamsia di keluarga?', 'Ibu saya darah tinggi dan kakak perempuan saya pernah pre-eklamsia, Dok.', ['riwayat keluarga', 'keluarga hipertensi', 'keluarga preeklamsia', 'keluarga sakit', 'keluarga']),
    q('alergi-obat', 'alergi', 'Apakah Ibu punya alergi obat?', 'Tidak ada, Dok.', ['alergi obat', 'alergi']),
    q('keguguran', 'rpd', 'Apakah pernah keguguran atau melahirkan bayi yang meninggal sebelumnya?', 'Tidak pernah, Dok. Anak pertama saya sehat, sekarang kelas dua SD.', ['keguguran', 'abortus', 'gugur kandungan', 'bayi meninggal', 'lahir mati']),
    q('kehamilan-direncanakan', 'sosial', 'Apakah kehamilan ini direncanakan, dan sebelumnya konsultasi dulu tentang obat tensi?', 'Tidak direncanakan, Dok. Saya tidak sempat konsultasi ke dokter sebelum hamil.', ['direncanakan', 'program hamil', 'rencana hamil', 'konsultasi sebelum hamil', 'kontrasepsi', 'kehamilan direncanakan']),
    q('merokok', 'sosial', 'Apakah Ibu merokok atau minum alkohol?', 'Tidak, Dok.', ['rokok', 'merokok', 'alkohol'], { distractor: true }),
    q('demam', 'rps', 'Apakah ada demam, batuk, atau keputihan berbau?', 'Tidak ada, Dok.', ['demam', 'batuk', 'keputihan'], { distractor: true }),
  ],
  exam: [
    exam('tekanan-darah', 'umum', 'Tekanan darah ulang (duduk tenang, manset sesuai)', 'Lengan kanan 146/94, lengan kiri 150/96 mmHg setelah istirahat 5 menit.', { abnormal: true }),
    exam('umum', 'umum', 'Keadaan umum dan IMT', 'Compos mentis, tampak baik. BB 68 kg, TB 158 cm, IMT 27,2.', { abnormal: true }),
    exam('edema', 'ekstremitas', 'Ekstremitas dan edema', 'Tidak ada edema tungkai maupun wajah.'),
    exam('jantung', 'jantung', 'Jantung', 'Iktus kordis normal, S1 S2 reguler, tidak ada murmur.'),
    exam('paru', 'paru', 'Paru', 'Vesikuler, tidak ada ronki maupun mengi.'),
    exam('abdomen', 'abdomen', 'Abdomen', 'Datar, fundus uteri belum teraba di atas simfisis, tidak ada nyeri tekan epigastrium.'),
    exam('neuro', 'neurologi', 'Neurologi dan refleks', 'Refleks fisiologis normal, tidak ada klonus, tidak ada defisit fokal.'),
    exam('tiroid', 'kepala-leher', 'Tiroid', 'Tidak teraba pembesaran.', { distractor: true }),
  ],
  tests: makeTests(MODE, [
    ['usg-obstetri', [{ text: 'USG obstetri: janin tunggal intrauterin hidup, DJJ 158x/menit, usia kehamilan 13 minggu 2 hari, tidak ada gambaran mola.', abnormal: false }]],
    ['tes-kehamilan', [{ text: 'Tes kehamilan urin: positif.', abnormal: true }]],
    ['urinalisis', [{ text: 'Urinalisis: protein negatif, glukosa negatif, leukosit dan eritrosit negatif.', abnormal: false }]],
    ['uacr', [{ text: 'Rasio albumin-kreatinin urin 14 mg/g (normal). Ini menjadi nilai dasar sebelum usia kehamilan 20 minggu.', abnormal: false }]],
    ['ureum-kreatinin', [{ text: 'Ureum 20, kreatinin 0,7 mg/dL (normal).', abnormal: false }]],
    ['dpl', [{ text: 'Hb 11,6 g/dL, leukosit 8.600/uL, trombosit 248.000/uL (nilai dasar).', abnormal: false }]],
    ['sgot-sgpt', [{ text: 'SGOT 22 U/L, SGPT 20 U/L (normal, nilai dasar).', abnormal: false }]],
    ['elektrolit', [{ text: 'Na 139, K 4,0, Cl 103 mmol/L (normal). Tidak ada hipokalemia.', abnormal: false }]],
    ['gula-puasa', [{ text: 'Glukosa darah puasa 86 mg/dL.', abnormal: false }]],
    ['ekg', [{ text: 'EKG: irama sinus 84x/menit, tanpa hipertrofi ventrikel kiri atau iskemia.', abnormal: false }]],
    'foto-toraks',
  ]),
  panels: [
    { id: 'panel-hamil-ht', label: 'Panel dasar hipertensi dalam kehamilan', testIds: ['urinalisis', 'uacr', 'ureum-kreatinin', 'dpl', 'sgot-sgpt'] },
  ],
  diagnoses: [
    { id: 'htn-kronik-hamil', label: 'Hipertensi kronik pada kehamilan 13 minggu' },
    { id: 'preeklamsia', label: 'Preeklamsia' },
    { id: 'htn-gestasional', label: 'Hipertensi gestasional' },
    { id: 'htn-sekunder', label: 'Hipertensi sekunder (renal atau endokrin)' },
    { id: 'mola-hidatidosa', label: 'Kehamilan mola' },
  ],
  correctDiagnosisId: 'htn-kronik-hamil',
  differentialIds: ['preeklamsia', 'htn-gestasional', 'htn-sekunder', 'mola-hidatidosa'],
  treatments: pickTreatments([
    'nifedipin-xl-30',
    'metildopa-250',
    'aspirin-81',
    'edukasi-hamil-htn',
    'telmisartan-40',
    'enalapril-10',
    'parasetamol',
  ]),
  indicatedTreatmentIds: ['nifedipin-xl-30', 'metildopa-250', 'aspirin-81', 'edukasi-hamil-htn'],
  criticalTreatmentIds: ['nifedipin-xl-30'],
  contraindicated: [
    { id: 'telmisartan-40', reason: 'ARB bersifat fetotoksik dan dikontraindikasikan pada kehamilan; harus dihentikan dan diganti.' },
    { id: 'enalapril-10', reason: 'Penghambat ACE bersifat teratogenik dan fetotoksik dan dikontraindikasikan pada kehamilan.' },
  ],
  dispositions: pickDispositions(['pulang-kontrol', 'pulang', 'rawat-bangsal', 'rujuk-lanjut']),
  correctDispositionId: 'pulang-kontrol',
  acceptableDispositionIds: ['rujuk-lanjut'],
  guidelineIds: ['acog-pb203-htn-kronik', 'kemenkes-pnpk-preeklamsia', 'esc-esh-htn-2018'],
  rubric: buildRubric({
    criteria: [
      crit('an-01', 'anamnesis', 3, 'Usia kehamilan', P.asked(['usia-hamil']), {
        met: 'Usia kehamilan ditanyakan.',
        missed: 'Usia kehamilan tidak ditanyakan.',
      }, { improve: 'Tanyakan HPHT dan usia kehamilan: menentukan keamanan obat dan waktu mulai aspirin.' }),
      crit('an-02', 'anamnesis', 3, 'Obat antihipertensi yang sedang diminum', P.asked(['obat-sudah']), {
        met: 'Obat antihipertensi ditanyakan dan telmisartan terungkap.',
        missed: 'Obat yang sedang diminum tidak ditanyakan.',
      }, { ref: 'acog-pb203-htn-kronik', improve: 'Tanyakan obat tensi: ARB dan ACEi tidak boleh dipakai pada kehamilan.', highlight: 'Anda menemukan ARB yang masih diminum pada kehamilan.' }),
      crit('an-03', 'anamnesis', 3, 'Riwayat preeklamsia pada kehamilan sebelumnya', P.asked(['hamil-pertama', 'keluarga'], 2), {
        met: 'Riwayat kehamilan sebelumnya dan keluarga digali.',
        partial: 'Hanya salah satu digali.',
        missed: 'Riwayat preeklamsia tidak digali.',
      }, { partial: P.asked(['hamil-pertama', 'keluarga'], 1), ref: 'acog-pb203-htn-kronik', improve: 'Riwayat preeklamsia dan hipertensi kronik adalah faktor risiko tinggi yang memengaruhi profilaksis aspirin.', highlight: 'Anda menggali faktor risiko preeklamsia dengan lengkap.' }),
      crit('an-04', 'anamnesis', 2, 'Tanda bahaya', P.asked(['sakit-kepala', 'bengkak', 'nyeri-dada'], 3), {
        met: 'Gejala berat ditanyakan.',
        partial: 'Sebagian tanda bahaya ditanyakan.',
        missed: 'Tanda bahaya tidak ditanyakan.',
      }, { partial: P.asked(['sakit-kepala', 'bengkak', 'nyeri-dada'], 2), ref: 'kemenkes-pnpk-preeklamsia', improve: 'Tanyakan sakit kepala hebat, pandangan kabur, nyeri ulu hati, bengkak, dan sesak.' }),
      crit('an-05', 'anamnesis', 2, 'Penyebab sekunder dan komorbid', P.asked(['rpd-ginjal', 'rpd-ht'], 2), {
        met: 'Penyakit ginjal, diabetes, dan perjalanan hipertensi ditanyakan.',
        partial: 'Hanya sebagian ditanyakan.',
        missed: 'Penyebab sekunder dan komorbid tidak digali.',
      }, { partial: P.asked(['rpd-ginjal', 'rpd-ht'], 1), improve: 'Tanyakan penyakit ginjal, diabetes, autoimun, dan sejak kapan hipertensi.' }),
      crit('an-06', 'anamnesis', 1, 'Alergi dan suplemen', P.asked(['alergi-obat', 'obat-lain'], 2), {
        met: 'Alergi dan suplemen ditanyakan.',
        partial: 'Hanya salah satu ditanyakan.',
        missed: 'Alergi dan suplemen tidak ditanyakan.',
      }, { partial: P.asked(['alergi-obat', 'obat-lain'], 1), improve: 'Tanyakan alergi dan suplemen sebelum meresepkan.' }),
      crit('pe-01', 'pemeriksaan', 2, 'Mengulang tekanan darah', P.examined(['tekanan-darah']), {
        met: 'Tekanan darah diukur ulang.',
        missed: 'Tekanan darah tidak diukur ulang.',
      }, { ref: 'acog-pb203-htn-kronik', improve: 'Ukur ulang tekanan darah dengan manset sesuai setelah istirahat.' }),
      crit('pe-02', 'pemeriksaan', 2, 'Edema, jantung, dan paru', P.examined(['edema', 'jantung', 'paru'], 2), {
        met: 'Pemeriksaan sistem terkait dilakukan.',
        partial: 'Hanya satu sistem diperiksa.',
        missed: 'Edema, jantung, dan paru tidak diperiksa.',
      }, { partial: P.examined(['edema', 'jantung', 'paru'], 1), improve: 'Periksa edema, jantung, dan paru untuk tanda kerusakan organ.' }),
      crit('pe-03', 'pemeriksaan', 1, 'Neurologi dan refleks', P.examined(['neuro']), {
        met: 'Neurologi diperiksa.',
        missed: 'Neurologi tidak diperiksa.',
      }, { improve: 'Periksa refleks dan klonus.' }),
      crit('pn-01', 'penalaran', 3, 'Nilai dasar organ target sebelum 20 minggu', P.ordered(['urinalisis', 'uacr', 'ureum-kreatinin', 'dpl', 'sgot-sgpt'], 3), {
        met: 'Nilai dasar urin, ginjal, darah, dan hati dipesan.',
        partial: 'Sebagian nilai dasar dipesan.',
        missed: 'Nilai dasar organ target tidak dipesan.',
      }, { partial: P.ordered(['urinalisis', 'uacr', 'ureum-kreatinin', 'dpl', 'sgot-sgpt'], 2), ref: 'acog-pb203-htn-kronik', improve: 'Pesan urinalisis atau protein urin, kreatinin, trombosit, dan fungsi hati sebagai nilai dasar.', highlight: 'Anda menyiapkan nilai dasar untuk mendeteksi preeklamsia superimposed.' }),
      crit('pn-02', 'penalaran', 2, 'Konfirmasi kehamilan dan usia gestasi', P.ordered(['usg-obstetri', 'tes-kehamilan'], 1), {
        met: 'Kehamilan dan usia gestasi dikonfirmasi.',
        missed: 'Kehamilan tidak dikonfirmasi.',
      }, { improve: 'USG obstetri menentukan usia kehamilan dan menyingkirkan mola.' }),
      crit('pn-03', 'penalaran', 3, 'Diagnosis hipertensi kronik pada kehamilan', P.dx, {
        met: 'Diagnosis benar.',
        missed: 'Diagnosis tidak sesuai.',
      }, { ref: 'acog-pb203-htn-kronik', improve: 'Hipertensi sebelum kehamilan atau sebelum usia 20 minggu adalah hipertensi kronik, bukan preeklamsia.' }),
      crit('pn-04', 'penalaran', 1, 'Pemeriksaan efisien', P.not(P.ordered(['foto-toraks'])), {
        met: 'Tidak ada pemeriksaan yang tidak perlu.',
        missed: 'Foto toraks dipesan tanpa indikasi pada kehamilan.',
      }, { improve: 'Hindari radiasi yang tidak perlu pada kehamilan.' }),
      crit('tr-01', 'terapi', 3, 'Antihipertensi yang aman untuk kehamilan', P.treated(['nifedipin-xl-30', 'metildopa-250']), {
        met: 'Antihipertensi yang aman diresepkan.',
        missed: 'Antihipertensi yang aman pada kehamilan tidak diresepkan.',
      }, { ref: 'acog-pb203-htn-kronik', improve: 'Ganti ARB dengan nifedipin lepas lambat, metildopa, atau labetalol, dengan target di bawah 160/110 hingga sekitar 135/85.', highlight: 'Antihipertensi pengganti aman untuk kehamilan.' }),
      crit('tr-02', 'terapi', 3, 'Aspirin dosis rendah', P.treated(['aspirin-81']), {
        met: 'Aspirin dosis rendah diresepkan.',
        missed: 'Aspirin dosis rendah tidak diresepkan.',
      }, { ref: 'acog-pb203-htn-kronik', improve: 'Pada hipertensi kronik, mulai aspirin dosis rendah antara usia kehamilan 12 dan 28 minggu untuk menurunkan risiko preeklamsia.' }),
      crit('tr-03', 'terapi', 2, 'Edukasi tanda bahaya dan jadwal antenatal', P.treated(['edukasi-hamil-htn']), {
        met: 'Edukasi diberikan.',
        missed: 'Edukasi tidak diberikan.',
      }, { ref: 'kemenkes-pnpk-preeklamsia', improve: 'Edukasi pantau tensi di rumah, tanda bahaya preeklamsia, dan jadwal kontrol antenatal yang lebih sering.' }),
      crit('tr-04', 'terapi', 2, 'Rawat jalan dengan kontrol dan koordinasi obstetri', P.dispo, {
        met: 'Pasien pulang dengan jadwal kontrol.',
        missed: 'Disposisi tidak sesuai.',
      }, { improve: 'Tanpa kerusakan organ, rawat jalan dengan kontrol dua minggu dan koordinasi dengan dokter kandungan.' }),
      crit('ks-01', 'keselamatan', 3, 'Tidak melanjutkan ARB atau ACE inhibitor', P.not(P.treated('contraindicated')), {
        met: 'Tidak ada obat kontraindikasi.',
        missed: 'ARB atau penghambat ACE dilanjutkan atau diresepkan pada kehamilan.',
      }, { ref: 'acog-pb203-htn-kronik', improve: 'ARB dan penghambat ACE fetotoksik; hentikan segera pada kehamilan.' }),
      safetyNetCriterion(2, 'kemenkes-pnpk-preeklamsia'),
    ],
    breaches: [
      { id: 'br-kontra', when: P.treated('contraindicated'), what: 'Meresepkan atau melanjutkan ARB atau penghambat ACE pada kehamilan.', guidelineRef: 'acog-pb203-htn-kronik' },
      { id: 'br-tanpa-obat', when: P.not(P.treated(['nifedipin-xl-30', 'metildopa-250'])), what: 'Hipertensi kronik dalam kehamilan tidak diberi antihipertensi yang aman.', guidelineRef: 'acog-pb203-htn-kronik' },
    ],
    teachingPoints: [
      'Setiap perempuan usia subur yang minum ARB atau ACEi perlu ditanya tentang kehamilan; hentikan segera bila hamil.',
      'Hipertensi sebelum usia kehamilan 20 minggu adalah hipertensi kronik; tetapkan nilai dasar organ target untuk mendeteksi preeklamsia superimposed.',
      'Hipertensi kronik dan riwayat preeklamsia adalah indikasi aspirin dosis rendah mulai trimester kedua.',
    ],
  }),
}
