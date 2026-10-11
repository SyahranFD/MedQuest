// Kasus (Poliklinik): asma bronkial yang memburuk setelah penyekat beta nonselektif. SINTETIS.
// Konsultan medis harus memvalidasi derajat serangan, regimen inhaler, dan dosis sebelum dipakai di luar simulasi.

import { buildRubric, crit, defaultFallbacks, exam, iceEntries, makeTests, P, pickDispositions, pickTreatments, q, safetyNetCriterion, vitals } from '../builders'
import type { Case } from '../types'

const MODE = 'poli' as const

export const asmaCase: Case = {
  id: 'poli-asma',
  mode: MODE,
  specialty: 'Paru / Penyakit Dalam',
  difficulty: 'sedang',
  synthetic: true,
  severity: 'urgent',
  title: 'Sesak dan mengi malam hari (asma)',
  patient: { name: 'Sari Wulandari', age: 31, gender: 'F', occupation: 'Penjahit konveksi' },
  arrivalBlurb: 'Perempuan 31 tahun dengan sesak dan mengi, batuk malam hari, memburuk sejak dua minggu.',
  chiefComplaint: 'Dada saya bunyi ngik-ngik dan sesak, Dok, terutama malam, sudah dua minggu makin parah.',
  vitals: vitals(98, '124/78', 22, 95, 36.8),
  initialTrust: 54,
  greeting: 'Selamat siang, Dok.',
  farewell: 'Baik, Dok. Saya pakai inhalernya sesuai anjuran dan kontrol minggu depan. Terima kasih.',
  fallbacks: defaultFallbacks(),
  dialogue: [
    q('keluhan-utama', 'rps', 'Keluhan utama Ibu apa?', 'Sesak dan dada bunyi ngik-ngik, Dok, apalagi malam sampai terbangun.', ['keluhan utama', 'apa keluhan', 'keluhan apa', 'ada keluhan', 'cerita keluhan', 'mengapa datang']),
    q('onset', 'rps', 'Sesaknya mulai sejak kapan?', 'Sekitar dua minggu, Dok, makin lama makin sering.', ['sesak sejak kapan', 'sejak kapan', 'kapan mulai', 'sudah berapa lama', 'mulai kapan', 'berapa minggu']),
    q('mengi', 'rps', 'Apakah dada bunyi ngik-ngik atau terasa berat saat bernapas?', 'Iya, Dok, bunyi ngik-ngik terutama waktu menarik napas dalam, dada terasa berat seperti ditekan.', ['mengi', 'bunyi napas', 'ngik', 'dada berat', 'dada bunyi', 'bunyi ngik']),
    q('batuk', 'rps', 'Apakah ada batuk? Berdahak atau kering?', 'Batuk kering, Dok, paling sering tengah malam dan subuh. Dahak hampir tidak ada.', ['batuk', 'batuk kering', 'batuk berdahak', 'dahak']),
    q('malam-hari', 'rps', 'Seberapa sering Ibu terbangun malam karena sesak atau batuk?', 'Hampir tiap malam, Dok, tiga sampai empat kali seminggu terbangun.', ['terbangun malam', 'malam hari', 'bangun malam', 'sesak malam', 'sering bangun']),
    q('pemicu', 'rps', 'Apa yang biasanya memicu sesaknya? Debu, udara dingin, aktivitas, atau bau tertentu?', 'Debu kain di tempat kerja, Dok, dan udara dingin pagi hari. Kalau naik tangga cepat juga ngik-ngik.', ['pemicu', 'apa yang memicu', 'debu', 'udara dingin', 'bau menyengat', 'kambuh kalau', 'faktor pencetus']),
    q('aktivitas', 'rps', 'Apakah sesak mengganggu pekerjaan dan aktivitas sehari-hari?', 'Mengganggu, Dok. Mengayuh mesin jahit lama tidak kuat, harus berhenti dulu.', ['mengganggu aktivitas', 'aktivitas', 'mengganggu kerja', 'sesak aktivitas', 'berhenti kerja']),
    q('jantung-berdebar', 'rps', 'Apakah ada jantung berdebar, nyeri dada, atau bengkak pada kaki?', 'Jantung berdebar sering, Dok, itu yang bikin saya periksa dua minggu lalu. Nyeri dada dan kaki bengkak tidak ada.', ['jantung berdebar', 'berdebar', 'nyeri dada', 'bengkak kaki', 'dada sakit', 'jantung'], { red: true }),
    q('sulit-bicara', 'rps', 'Apakah sesaknya sampai sulit berbicara satu kalimat penuh, atau bibir terlihat kebiruan?', 'Belum sampai begitu, Dok. Masih bisa bicara, tapi kalau kambuh harus berhenti sebentar.', ['sulit bicara', 'bicara putus-putus', 'bibir biru', 'sianosis', 'berbicara', 'kalimat penuh'], { red: true }),
    q('demam-dahak', 'rps', 'Apakah ada demam, pilek, atau dahak kuning hijau?', 'Tidak ada demam, Dok. Pilek kadang kalau pagi, bersin-bersin.', ['demam', 'pilek', 'dahak kuning', 'dahak hijau', 'infeksi']),
    q('rpd-asma', 'rpd', 'Apakah Ibu pernah sesak atau mengi sebelumnya, misalnya waktu kecil?', 'Waktu SD sering sesak kalau capek atau hujan, Dok. Sejak SMA jarang sekali, kira-kira lima tahun terakhir hampir tidak ada.', ['riwayat asma', 'asma', 'pernah sesak', 'waktu kecil', 'sesak sebelumnya', 'mengi sebelumnya', 'pernah mengi']),
    q('atopi', 'rpd', 'Apakah ada alergi lain seperti bersin pagi hari, hidung gatal, atau eksim?', 'Bersin pagi dan hidung meler sering, Dok, kulit juga mudah gatal kalau kena sabun tertentu.', ['alergi lain', 'bersin pagi', 'rinitis', 'hidung gatal', 'eksim', 'atopi', 'gatal kulit']),
    q('obat-sudah', 'obat', 'Obat apa yang Ibu minum akhir-akhir ini, termasuk dari puskesmas atau apotek?', 'Dua minggu lalu saya diperiksa karena jantung berdebar dan cemas, Dok. Dikasih obat propranolol sepuluh miligram, diminum tiga kali sehari. Setelah itu sesaknya malah makin sering.', ['obat apa', 'sudah minum obat', 'minum obat', 'obat puskesmas', 'obat rutin', 'propranolol', 'obat jantung', 'obat tensi']),
    q('inhaler-sebelumnya', 'obat', 'Apakah pernah memakai inhaler atau obat semprot untuk sesak?', 'Dulu waktu kuliah pernah dikasih inhaler biru, Dok, tapi saya tidak pakai lagi karena takut ketagihan dan jantung makin berdebar.', ['inhaler', 'obat semprot', 'obat hirup', 'ventolin', 'pernah inhaler', 'salbutamol'], { gate: [56, 'Pernah dikasih, Dok, tapi sudah lama tidak dipakai.'] }),
    q('lingkungan', 'sosial', 'Bagaimana kondisi rumah dan tempat kerja? Ada debu, kasur kapuk, hewan peliharaan, atau jamur?', 'Konveksi banyak debu kain, Dok. Di rumah ada kucing dan kasur kapuk, kamar agak lembap.', ['kondisi rumah', 'tempat kerja', 'debu', 'kapuk', 'kucing', 'hewan peliharaan', 'jamur', 'lembap']),
    q('merokok', 'sosial', 'Apakah Ibu merokok? Bagaimana dengan orang lain di rumah?', 'Saya tidak merokok, Dok. Suami merokok tapi di teras.', ['rokok', 'merokok', 'perokok', 'asap rokok']),
    ...iceEntries(
      'Saya kira karena kecapekan dan debu kain, Dok. Atau jantung saya yang bermasalah.',
      'Saya takut ini penyakit jantung atau paru-paru bocor, Dok. Saya sampai tidak berani tidur telentang.',
      'Saya mau bisa tidur nyenyak dan kerja tanpa sesak, Dok. Obatnya jangan yang bikin ketagihan.',
    ),
    q('keluarga', 'keluarga', 'Apakah ada riwayat asma atau alergi di keluarga?', 'Ibu saya asma dan adik saya alergi dingin, Dok.', ['riwayat keluarga', 'keluarga asma', 'keluarga alergi', 'keluarga sakit', 'keluarga']),
    q('alergi-obat', 'alergi', 'Apakah Ibu punya alergi obat atau makanan?', 'Obat tidak ada, Dok. Makanan, saya biduran kalau makan udang.', ['alergi obat', 'alergi makanan', 'alergi']),
    q('nsaid', 'obat', 'Apakah pernah sesak setelah minum obat pegal atau aspirin?', 'Tidak pernah, Dok. Saya aman minum obat pegal.', ['obat pegal', 'aspirin', 'obat nyeri', 'sesak obat', 'asetosal'], { distractor: true }),
    q('trauma', 'rps', 'Apakah ada benturan atau cedera pada dada?', 'Tidak ada, Dok.', ['trauma', 'benturan', 'cedera dada', 'kecelakaan'], { distractor: true }),
  ],
  exam: [
    exam('umum', 'umum', 'Keadaan umum dan bicara', 'Compos mentis, dapat berbicara dalam kalimat penuh, tidak tampak sianosis. SpO2 95% udara ruangan.'),
    exam('paru', 'paru', 'Paru', 'Mengi ekspirasi difus di kedua lapang paru, fase ekspirasi memanjang, tidak ada ronki basah, tidak ada retraksi.', { abnormal: true }),
    exam('jantung', 'jantung', 'Jantung', 'Takikardia reguler, S1 S2 normal, tidak ada murmur, tidak ada tanda gagal jantung.'),
    exam('hidung', 'kepala-leher', 'Hidung dan tenggorok', 'Mukosa hidung pucat dan edema, sekret bening, tidak ada polip.', { abnormal: true }),
    exam('ekstremitas', 'ekstremitas', 'Ekstremitas', 'Tidak ada edema, akral hangat, tidak ada jari tabuh.'),
    exam('abdomen', 'abdomen', 'Abdomen', 'Datar, lemas, tidak ada nyeri tekan.', { distractor: true }),
  ],
  tests: makeTests(MODE, [
    ['arus-puncak', [{ text: 'Arus puncak ekspirasi (APE) 290 L/menit, sekitar 60% dari nilai prediksi (480 L/menit).', abnormal: true }]],
    ['spirometri', [{ text: 'Spirometri: VEP1/KVP 68%, VEP1 64% prediksi. Setelah salbutamol VEP1 naik 18% (sekitar 380 mL): obstruksi reversibel, sesuai asma.', abnormal: true, critical: true }]],
    ['foto-toraks', [{ text: 'Foto toraks PA: hiperinflasi ringan, tidak ada infiltrat, kardiomegali, atau pneumotoraks.', abnormal: false }]],
    ['dpl', [{ text: 'Hb 12,9 g/dL, leukosit 8.100/uL, eosinofil 7% (meningkat), trombosit 310.000/uL.', abnormal: true }]],
    ['ekg', [{ text: 'EKG: sinus takikardia 98x/menit, tidak ada iskemia atau aritmia.', abnormal: false }]],
    ['gds', [{ text: 'Glukosa darah sewaktu 96 mg/dL.', abnormal: false }]],
  ]),
  panels: [
    { id: 'panel-asma', label: 'Panel evaluasi sesak', testIds: ['arus-puncak', 'spirometri', 'foto-toraks', 'dpl'] },
  ],
  diagnoses: [
    { id: 'asma-eksaserbasi', label: 'Asma bronkial, eksaserbasi ringan sampai sedang' },
    { id: 'ppok', label: 'PPOK eksaserbasi' },
    { id: 'bronkitis-akut', label: 'Bronkitis akut' },
    { id: 'gagal-jantung', label: 'Gagal jantung' },
    { id: 'gerd-batuk', label: 'Batuk akibat refluks (GERD)' },
  ],
  correctDiagnosisId: 'asma-eksaserbasi',
  differentialIds: ['ppok', 'bronkitis-akut', 'gagal-jantung', 'gerd-batuk'],
  treatments: pickTreatments([
    'salbutamol-mdi',
    'budesonid-formoterol',
    'stop-propranolol',
    'edukasi-asma',
    'propranolol-10',
    'teofilin-200',
    'amoksisilin',
  ]),
  indicatedTreatmentIds: ['salbutamol-mdi', 'budesonid-formoterol', 'stop-propranolol', 'edukasi-asma'],
  criticalTreatmentIds: ['stop-propranolol', 'salbutamol-mdi'],
  contraindicated: [
    { id: 'propranolol-10', reason: 'Penyekat beta nonselektif memicu bronkospasme dan merupakan kontraindikasi pada asma; pemakaiannya justru pencetus serangan ini.' },
  ],
  dispositions: pickDispositions(['pulang-kontrol', 'pulang', 'observasi-igd', 'rawat-bangsal']),
  correctDispositionId: 'pulang-kontrol',
  acceptableDispositionIds: [],
  guidelineIds: ['gina-asma', 'pdpi-asma'],
  rubric: buildRubric({
    criteria: [
      crit('an-01', 'anamnesis', 2, 'Karakter sesak dan mengi', P.asked(['onset', 'mengi'], 2), {
        met: 'Onset dan karakter sesak ditanyakan.',
        partial: 'Hanya sebagian karakter sesak ditanyakan.',
        missed: 'Karakter sesak tidak digali.',
      }, { partial: P.asked(['onset', 'mengi'], 1), improve: 'Tanyakan onset, mengi, dan rasa berat di dada.' }),
      crit('an-02', 'anamnesis', 2, 'Pola malam hari dan pemicu', P.asked(['malam-hari', 'pemicu', 'lingkungan'], 2), {
        met: 'Gejala malam dan pemicu digali.',
        partial: 'Hanya sebagian pola digali.',
        missed: 'Pola gejala dan pemicu tidak digali.',
      }, { partial: P.asked(['malam-hari', 'pemicu', 'lingkungan'], 1), ref: 'gina-asma', improve: 'Tanyakan gejala malam, pemicu, dan paparan di rumah serta tempat kerja.' }),
      crit('an-03', 'anamnesis', 3, 'Obat yang sedang diminum (penyekat beta)', P.asked(['obat-sudah']), {
        met: 'Obat yang sedang diminum ditanyakan dan propranolol terungkap.',
        missed: 'Obat yang sedang diminum tidak ditanyakan.',
      }, { ref: 'gina-asma', improve: 'Selalu tanyakan obat baru: penyekat beta, aspirin, dan OAINS dapat memicu serangan asma.', highlight: 'Anda menemukan propranolol sebagai pencetus serangan.' }),
      crit('an-04', 'anamnesis', 2, 'Tanda bahaya serangan berat', P.asked(['sulit-bicara', 'jantung-berdebar'], 2), {
        met: 'Kemampuan bicara dan gejala jantung ditanyakan.',
        partial: 'Hanya salah satu tanda bahaya ditanyakan.',
        missed: 'Tanda bahaya tidak ditanyakan.',
      }, { partial: P.asked(['sulit-bicara', 'jantung-berdebar'], 1), improve: 'Tanyakan sulit bicara, bibir biru, nyeri dada, dan berdebar.' }),
      crit('an-05', 'anamnesis', 2, 'Riwayat asma, atopi, dan keluarga', P.asked(['rpd-asma', 'atopi', 'keluarga'], 2), {
        met: 'Riwayat asma, atopi, dan keluarga digali.',
        partial: 'Hanya sebagian riwayat digali.',
        missed: 'Riwayat asma dan atopi tidak digali.',
      }, { partial: P.asked(['rpd-asma', 'atopi', 'keluarga'], 1), improve: 'Tanyakan asma masa kecil, alergi, dan riwayat keluarga.' }),
      crit('an-06', 'anamnesis', 1, 'Pengalaman dengan inhaler', P.asked(['inhaler-sebelumnya']), {
        met: 'Pengalaman dengan inhaler ditanyakan.',
        missed: 'Pengalaman dengan inhaler tidak ditanyakan.',
      }, { improve: 'Tanyakan inhaler sebelumnya; ketakutan ketagihan perlu diluruskan.' }),
      crit('pe-01', 'pemeriksaan', 3, 'Pemeriksaan paru', P.examined(['paru']), {
        met: 'Paru diperiksa.',
        missed: 'Paru tidak diperiksa.',
      }, { ref: 'gina-asma', improve: 'Auskultasi paru untuk mengi dan nilai tanda distres.' }),
      crit('pe-02', 'pemeriksaan', 1, 'Keadaan umum dan kemampuan bicara', P.examined(['umum']), {
        met: 'Keadaan umum dinilai.',
        missed: 'Keadaan umum tidak dinilai.',
      }, { improve: 'Nilai kemampuan bicara, saturasi, dan sianosis untuk derajat serangan.' }),
      crit('pe-03', 'pemeriksaan', 1, 'Jantung dan hidung', P.examined(['jantung', 'hidung'], 1), {
        met: 'Jantung atau hidung diperiksa.',
        missed: 'Jantung dan hidung tidak diperiksa.',
      }, { improve: 'Singkirkan gagal jantung dan cari rinitis alergi.' }),
      crit('pn-01', 'penalaran', 3, 'Faal paru objektif', P.ordered(['arus-puncak', 'spirometri'], 1), {
        met: 'APE atau spirometri dipesan.',
        missed: 'Faal paru tidak dinilai.',
      }, { ref: 'gina-asma', improve: 'Buktikan obstruksi reversibel dengan APE atau spirometri.', highlight: 'Anda memastikan diagnosis asma secara objektif.' }),
      crit('pn-02', 'penalaran', 3, 'Diagnosis asma', P.dx, {
        met: 'Diagnosis asma benar.',
        missed: 'Diagnosis tidak sesuai.',
      }, { ref: 'gina-asma', improve: 'Mengi berulang, pemicu khas, atopi, dan obstruksi reversibel menunjukkan asma.' }),
      crit('pn-03', 'penalaran', 1, 'Menyingkirkan penyebab lain', P.ordered(['foto-toraks', 'ekg'], 1), {
        met: 'Foto toraks atau EKG dipesan.',
        missed: 'Diferensial kardiak dan paru lain tidak disingkirkan.',
      }, { improve: 'Foto toraks dan EKG membantu menyingkirkan pneumonia dan penyebab jantung.' }),
      crit('tr-01', 'terapi', 3, 'Pelega dan pengendali sesuai pedoman', P.treated(['salbutamol-mdi', 'budesonid-formoterol'], undefined, 2), {
        met: 'Pelega dan pengendali berbasis kortikosteroid inhalasi diresepkan.',
        partial: 'Hanya pelega atau pengendali yang diresepkan.',
        missed: 'Terapi asma yang sesuai tidak diresepkan.',
      }, { partial: P.treated(['salbutamol-mdi', 'budesonid-formoterol'], undefined, 1), ref: 'gina-asma', improve: 'Berikan pelega untuk gejala akut dan kortikosteroid inhalasi (mis. budesonid-formoterol) sebagai pengendali; pelega saja tidak cukup.', highlight: 'Terapi Anda mencakup pelega dan pengendali.' }),
      crit('tr-02', 'terapi', 3, 'Menghentikan penyekat beta', P.treated(['stop-propranolol']), {
        met: 'Propranolol dihentikan dan dikoordinasikan dengan pemberi resep.',
        missed: 'Propranolol tidak dihentikan.',
      }, { ref: 'gina-asma', improve: 'Hentikan penyekat beta nonselektif pada asma dan cari alternatif untuk keluhan berdebar.' }),
      crit('tr-03', 'terapi', 2, 'Edukasi inhaler, pemicu, dan rencana tindakan', P.treated(['edukasi-asma']), {
        met: 'Edukasi asma diberikan.',
        missed: 'Edukasi asma tidak diberikan.',
      }, { ref: 'gina-asma', improve: 'Ajarkan teknik inhaler, hindari pemicu, dan jelaskan rencana tindakan tertulis.' }),
      crit('tr-04', 'terapi', 2, 'Rawat jalan dengan kontrol', P.dispo, {
        met: 'Pasien pulang dengan jadwal kontrol.',
        missed: 'Disposisi tidak sesuai.',
      }, { improve: 'Serangan ringan sampai sedang tanpa tanda bahaya diobati rawat jalan dan dikontrol 1 sampai 2 minggu.' }),
      crit('ks-01', 'keselamatan', 3, 'Tidak melanjutkan penyekat beta', P.not(P.treated('contraindicated')), {
        met: 'Tidak ada obat kontraindikasi.',
        missed: 'Propranolol diresepkan kembali pada pasien asma.',
      }, { ref: 'gina-asma', improve: 'Penyekat beta nonselektif dikontraindikasikan pada asma.' }),
      safetyNetCriterion(2, 'gina-asma'),
    ],
    breaches: [
      { id: 'br-kontra', when: P.treated('contraindicated'), what: 'Meresepkan propranolol (penyekat beta nonselektif) pada pasien asma yang sedang eksaserbasi.', guidelineRef: 'gina-asma' },
      { id: 'br-tanpa-terapi', when: P.not(P.treated(['salbutamol-mdi', 'budesonid-formoterol'])), what: 'Eksaserbasi asma tidak diberi pelega atau pengendali inhalasi.', guidelineRef: 'gina-asma' },
    ],
    teachingPoints: [
      'Tanyakan obat yang baru diminum: penyekat beta nonselektif adalah pencetus asma yang mudah terlewat.',
      'Asma tidak cukup diobati dengan pelega saja; kortikosteroid inhalasi (mis. dengan formoterol) menjadi pengendali.',
      'Ketakutan ketagihan inhaler adalah alasan umum pasien berhenti; luruskan dengan bahasa sederhana.',
    ],
  }),
}
