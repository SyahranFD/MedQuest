// Kasus 6 (Poliklinik): diabetes melitus tipe 2 tidak terkontrol. SINTETIS.
// Konsultan medis harus memvalidasi target glikemik, regimen, dan dosis sebelum dipakai di luar simulasi.

import { buildRubric, crit, defaultFallbacks, exam, iceEntries, makeTests, P, pickDispositions, pickTreatments, q, safetyNetCriterion, vitals } from '../builders'
import type { Case } from '../types'

const MODE = 'poli' as const

export const diabetesCase: Case = {
  id: 'poli-dm2',
  mode: MODE,
  specialty: 'Penyakit Dalam / Endokrin',
  difficulty: 'sedang',
  synthetic: true,
  severity: 'stable',
  title: 'Kencing manis yang tidak terkontrol',
  patient: { name: 'Hasan Basri', age: 52, gender: 'M', occupation: 'Sopir truk antarkota' },
  arrivalBlurb: 'Laki-laki 52 tahun, diabetes 3 tahun, sering haus dan kencing, kaki kesemutan, jarang kontrol.',
  chiefComplaint: 'Saya sering haus dan kencing malam, Dok, kaki juga kesemutan.',
  vitals: vitals(82, '138/86', 18, 98, 36.7),
  initialTrust: 52,
  greeting: 'Selamat siang, Dok.',
  farewell: 'Baik, Dok. Saya akan atur makan dan datang kontrol bulan depan.',
  fallbacks: defaultFallbacks(),
  dialogue: [
    q('keluhan-utama', 'rps', 'Keluhan utama Bapak apa?', 'Sering haus dan kencing, Dok, apalagi malam. Kaki kesemutan juga.', ['keluhan utama', 'apa keluhan', 'keluhan apa', 'ada keluhan', 'cerita keluhan', 'mengapa datang']),
    q('onset', 'rps', 'Keluhan ini mulai sejak kapan?', 'Sekitar tiga bulan terakhir makin terasa, Dok.', ['sejak kapan', 'kapan mulai', 'sudah berapa lama', 'berapa lama', 'mulai kapan']),
    q('poliuria-polidipsi', 'rps', 'Seberapa sering Bapak haus dan buang air kecil dalam sehari?', 'Minum banyak sekali, Dok, bisa tiga liter. Malam bangun kencing sampai empat kali.', ['sering haus', 'haus', 'banyak minum', 'sering kencing', 'kencing malam', 'kencing', 'seberapa sering']),
    q('bb-turun', 'rps', 'Apakah berat badan Bapak berubah belakangan ini?', 'Turun tiga kilo dalam dua bulan, Dok, padahal makan banyak.', ['berat badan turun', 'berat badan', 'turun berat', 'timbangan', 'kurus', 'bb']),
    q('kesemutan', 'rps', 'Apakah kaki atau tangan terasa kesemutan, baal, atau terbakar?', 'Kaki saya kesemutan dan seperti memakai kaus kaki tebal, Dok, terutama malam.', ['kesemutan', 'baal', 'kebas', 'kaki', 'terbakar', 'sensasi kaki']),
    q('luka-lambat', 'rps', 'Apakah ada luka yang lama sembuh?', 'Ada lecet di tumit sebulan lalu, lama sembuhnya, Dok. Sekarang sudah kering.', ['luka', 'luka lama sembuh', 'luka lambat', 'borok', 'lecet']),
    q('penglihatan', 'rps', 'Apakah penglihatan Bapak berubah atau kabur?', 'Agak kabur kalau malam waktu nyetir, Dok.', ['penglihatan', 'mata kabur', 'pandangan', 'melihat', 'mata']),
    q('kad-gejala', 'rps', 'Apakah pernah mual, muntah, nyeri perut, atau napas cepat dan dalam?', 'Tidak pernah, Dok.', ['mual', 'muntah', 'nyeri perut', 'napas dalam', 'napas cepat', 'napas bau'], { red: true }),
    q('hipoglikemia', 'rps', 'Apakah pernah tiba-tiba lemas, gemetar, keringat dingin, atau hampir pingsan?', 'Belum pernah, Dok.', ['gemetar', 'keringatdingin', 'keringat dingin', 'hampir pingsan', 'lemas mendadak', 'hipoglikemia', 'pingsan'], { red: true }),
    q('nyeri-dada', 'rps', 'Apakah ada nyeri dada atau sesak saat beraktivitas?', 'Tidak ada, Dok.', ['nyeri dada', 'sesak', 'dada sakit', 'berdebar'], { red: true }),
    ...iceEntries(
      'Saya kira karena kecapekan nyetir jauh, Dok. Tapi teman bilang gula saya naik.',
      'Saya takut kaki saya diamputasi, Dok. Paman saya begitu dulu.',
      'Saya mau gula saya turun, Dok, tapi saya tidak mau disuntik kalau bisa.',
    ),
    q('kepatuhan', 'obat', 'Apakah obat diabetes diminum teratur, dan seberapa sering kontrol?', 'Terus terang sering lupa kalau sedang di jalan, Dok. Sudah delapan bulan tidak kontrol karena sibuk narik.', ['minum teratur', 'teratur', 'kepatuhan', 'kontrol', 'lupa minum', 'putus obat', 'sering lupa', 'rutin'], { gate: [58, 'Diminum, Dok, kadang-kadang.'] }),
    q('obat-rutin', 'obat', 'Obat apa yang diminum untuk diabetes?', 'Metformin 500 miligram, Dok, dua kali sehari.', ['minum obat apa', 'obat apa', 'obat diabetes', 'obat gula', 'metformin', 'obat rutin', 'makan obat']),
    q('herbal', 'obat', 'Apakah Bapak minum jamu, suplemen, atau obat lain?', 'Kadang jamu pahit dari teman, Dok. Obat lain tidak ada.', ['jamu', 'suplemen', 'obat herbal', 'obat tradisional', 'obat lain', 'herbal']),
    q('diet', 'sosial', 'Bagaimana pola makan dan minum Bapak sehari-hari?', 'Makan di warung tepi jalan, Dok, nasi dua piring, gorengan, teh manis tiga gelas.', ['pola makan', 'makan', 'diet', 'makanan', 'teh manis', 'minuman manis', 'makan apa']),
    q('olahraga', 'sosial', 'Apakah Bapak berolahraga?', 'Hampir tidak pernah, Dok. Seharian duduk di truk.', ['olahraga', 'aktivitas', 'senam', 'jalan kaki']),
    q('merokok', 'sosial', 'Apakah Bapak merokok atau minum alkohol?', 'Merokok sebungkus sehari, Dok, alkohol tidak.', ['rokok', 'merokok', 'alkohol', 'perokok'], { gate: [55, 'Jarang, Dok.'] }),
    q('rpd-ht', 'rpd', 'Apakah ada riwayat darah tinggi atau kolesterol tinggi?', 'Tensi kadang agak tinggi, Dok, kolesterol belum pernah cek.', ['riwayat hipertensi', 'hipertensi', 'tensi', 'kolesterol', 'riwayat penyakit', 'penyakit dahulu', 'penyakit lain']),
    q('rpd-dm', 'rpd', 'Sejak kapan Bapak terdiagnosis diabetes?', 'Tiga tahun lalu, Dok, ketahuan waktu cek kesehatan sopir.', ['sejak terdiagnosis', 'riwayat diabetes', 'diabetes', 'kencing manis', 'gula', 'terdiagnosis']),
    q('keluarga-dm', 'keluarga', 'Apakah ada anggota keluarga dengan diabetes?', 'Ibu dan kakak saya kencing manis, Dok. Paman saya kakinya diamputasi.', ['riwayat keluarga', 'keluarga diabetes', 'keluarga sakit', 'keluarga']),
    q('alergi-obat', 'alergi', 'Apakah Bapak punya alergi obat?', 'Tidak ada, Dok.', ['alergi obat', 'alergi']),
    q('pekerjaan', 'sosial', 'Pekerjaan Bapak apa?', 'Sopir truk antarkota, Dok, sering di jalan berhari-hari.', ['kerja', 'pekerjaan', 'profesi']),
    q('demam', 'rps', 'Apakah ada demam atau batuk?', 'Tidak, Dok.', ['demam', 'batuk', 'pilek'], { distractor: true }),
    q('sendi', 'rps', 'Apakah ada nyeri sendi atau bengkak?', 'Tidak ada, Dok.', ['nyeri sendi', 'bengkak', 'sendi'], { distractor: true }),
  ],
  exam: [
    exam('umum', 'umum', 'Keadaan umum dan IMT', 'Compos mentis. BB 84 kg, TB 169 cm, IMT 29,4. Lingkar perut 102 cm.', { abnormal: true }),
    exam('kaki', 'ekstremitas', 'Pemeriksaan kaki (monofilamen, pulsasi, kulit)', 'Sensasi monofilamen berkurang di telapak kaki bilateral, nadi dorsalis pedis dan tibialis posterior teraba, kulit kering, tidak ada ulkus.', { abnormal: true }),
    exam('mata', 'kepala-leher', 'Visus', 'Visus 6/9 kedua mata, funduskopi tidak dapat dinilai di poliklinik (perlu rujuk mata).', { abnormal: true }),
    exam('kulit', 'kulit', 'Kulit', 'Akantosis nigrikans ringan di leher.', { abnormal: true }),
    exam('jantung', 'jantung', 'Jantung', 'S1 S2 reguler, tidak ada murmur.'),
    exam('paru', 'paru', 'Paru', 'Vesikuler, tidak ada ronki.'),
    exam('abdomen', 'abdomen', 'Abdomen', 'Obesitas sentral, lemas, hepar lien tidak teraba.'),
    exam('tiroid', 'kepala-leher', 'Tiroid', 'Tidak teraba pembesaran.', { distractor: true }),
  ],
  tests: makeTests(MODE, [
    ['hba1c', [{ text: 'HbA1c 9,2% (target umumnya di bawah 7%).', abnormal: true, critical: true }]],
    ['gula-puasa', [{ text: 'Glukosa darah puasa 214 mg/dL.', abnormal: true }]],
    ['gd2pp', [{ text: 'Glukosa darah 2 jam post prandial 298 mg/dL.', abnormal: true }]],
    ['gds', [{ text: 'Glukosa darah sewaktu 285 mg/dL.', abnormal: true }]],
    ['ureum-kreatinin', [{ text: 'Ureum 30, kreatinin 1,0 mg/dL, eGFR sekitar 85 mL/menit.', abnormal: false }]],
    ['uacr', [{ text: 'Rasio albumin-kreatinin urin 62 mg/g (mikroalbuminuria).', abnormal: true }]],
    ['urinalisis', [{ text: 'Urinalisis: glukosa +3, keton negatif, protein +1.', abnormal: true }]],
    ['lipid', [{ text: 'Kolesterol total 224, LDL 138, HDL 36, trigliserida 240 mg/dL.', abnormal: true }]],
    ['sgot-sgpt', [{ text: 'SGOT 34 U/L, SGPT 52 U/L (sedikit meningkat).', abnormal: true }]],
    ['ekg', [{ text: 'EKG: irama sinus 80x/menit, tidak ada tanda iskemia.', abnormal: false }]],
    ['dpl', [{ text: 'Hb 14,2 g/dL, leukosit 8.100/uL, trombosit 290.000/uL.', abnormal: false }]],
    'foto-toraks',
  ]),
  panels: [
    { id: 'panel-dm', label: 'Panel evaluasi diabetes', testIds: ['hba1c', 'gula-puasa', 'ureum-kreatinin', 'uacr', 'urinalisis', 'lipid'] },
  ],
  diagnoses: [
    { id: 'dm2-tidak-terkontrol', label: 'Diabetes melitus tipe 2 tidak terkontrol dengan neuropati perifer' },
    { id: 'dm-tipe-1', label: 'Diabetes melitus tipe 1' },
    { id: 'kad', label: 'Ketoasidosis diabetik' },
    { id: 'hhs', label: 'Status hiperosmolar hiperglikemik' },
    { id: 'prediabetes', label: 'Prediabetes' },
  ],
  correctDiagnosisId: 'dm2-tidak-terkontrol',
  differentialIds: ['dm-tipe-1', 'kad', 'hhs', 'prediabetes'],
  treatments: pickTreatments([
    'metformin-850',
    'glimepirid-2',
    'atorvastatin-20',
    'edukasi-dm',
    'insulin-basal',
    'glibenklamid-5',
    'prednison',
    'parasetamol',
  ]),
  indicatedTreatmentIds: ['metformin-850', 'glimepirid-2', 'edukasi-dm', 'atorvastatin-20'],
  criticalTreatmentIds: ['metformin-850', 'glimepirid-2'],
  contraindicated: [
    { id: 'glibenklamid-5', reason: 'Duplikasi sulfonilurea (bersama glimepirid) meningkatkan risiko hipoglikemia berat.' },
    { id: 'prednison', reason: 'Kortikosteroid memperburuk hiperglikemia.' },
  ],
  dispositions: pickDispositions(['pulang-kontrol', 'pulang', 'rujuk-lanjut', 'rawat-bangsal']),
  correctDispositionId: 'pulang-kontrol',
  acceptableDispositionIds: ['rujuk-lanjut'],
  guidelineIds: ['perkeni-dm2-2021', 'kemenkes-pnpk-dm2', 'ada-standards'],
  rubric: buildRubric({
    criteria: [
      crit('an-01', 'anamnesis', 2, 'Gejala hiperglikemia', P.asked(['poliuria-polidipsi', 'bb-turun'], 2), {
        met: 'Gejala klasik hiperglikemia ditanyakan.',
        partial: 'Hanya sebagian gejala hiperglikemia ditanyakan.',
        missed: 'Gejala hiperglikemia tidak digali.',
      }, { partial: P.asked(['poliuria-polidipsi', 'bb-turun'], 1), improve: 'Tanyakan haus, sering kencing, dan penurunan berat badan.' }),
      crit('an-02', 'anamnesis', 2, 'Gejala komplikasi kronik', P.asked(['kesemutan', 'luka-lambat', 'penglihatan', 'nyeri-dada'], 3), {
        met: 'Komplikasi kronik ditanyakan.',
        partial: 'Sebagian komplikasi ditanyakan.',
        missed: 'Komplikasi kronik tidak ditanyakan.',
      }, { partial: P.asked(['kesemutan', 'luka-lambat', 'penglihatan', 'nyeri-dada'], 2), ref: 'perkeni-dm2-2021', improve: 'Tanyakan gejala neuropati, luka kaki, mata, dan jantung.' }),
      crit('an-03', 'anamnesis', 3, 'Kepatuhan obat dan pola makan', P.asked(['kepatuhan', 'diet', 'obat-rutin'], 3), {
        met: 'Kepatuhan, diet, dan obat ditanyakan.',
        partial: 'Sebagian faktor pengendalian ditanyakan.',
        missed: 'Kepatuhan dan pola makan tidak ditanyakan.',
      }, { partial: P.asked(['kepatuhan', 'diet', 'obat-rutin'], 2), ref: 'perkeni-dm2-2021', improve: 'Gali kepatuhan dan pola makan tanpa menghakimi; kepercayaan membuka kejujuran.', highlight: 'Anda menemukan penyebab kontrol gula yang buruk.' }),
      crit('an-04', 'anamnesis', 2, 'Tanda bahaya akut', P.asked(['kad-gejala', 'hipoglikemia'], 1), {
        met: 'Tanda ketoasidosis atau hipoglikemia ditanyakan.',
        missed: 'Tanda bahaya akut tidak ditanyakan.',
      }, { improve: 'Tanyakan gejala ketoasidosis dan hipoglikemia.' }),
      crit('an-05', 'anamnesis', 1, 'Keluarga dan komorbid', P.asked(['keluarga-dm', 'rpd-ht'], 1), {
        met: 'Riwayat keluarga atau komorbid ditanyakan.',
        missed: 'Riwayat keluarga dan komorbid tidak ditanyakan.',
      }, { improve: 'Tanyakan riwayat keluarga, hipertensi, dan kolesterol.' }),
      crit('an-06', 'anamnesis', 1, 'Alergi dan jamu', P.asked(['alergi-obat', 'herbal'], 1), {
        met: 'Alergi atau obat herbal ditanyakan.',
        missed: 'Alergi dan obat herbal tidak ditanyakan.',
      }, { improve: 'Tanyakan alergi dan jamu atau suplemen.' }),
      crit('pe-01', 'pemeriksaan', 3, 'Pemeriksaan kaki', P.examined(['kaki']), {
        met: 'Kaki diperiksa.',
        missed: 'Kaki tidak diperiksa.',
      }, { ref: 'perkeni-dm2-2021', improve: 'Periksa kaki setiap kunjungan: sensasi monofilamen, pulsasi, dan kulit.', highlight: 'Pemeriksaan kaki dilakukan dengan baik.' }),
      crit('pe-02', 'pemeriksaan', 1, 'Antropometri', P.examined(['umum']), {
        met: 'Berat badan dan IMT dinilai.',
        missed: 'Antropometri tidak dinilai.',
      }, { improve: 'Ukur berat badan, tinggi, IMT, dan lingkar perut.' }),
      crit('pe-03', 'pemeriksaan', 1, 'Penglihatan', P.examined(['mata']), {
        met: 'Visus dinilai.',
        missed: 'Visus tidak dinilai.',
      }, { improve: 'Nilai visus dan rujuk untuk pemeriksaan retina.' }),
      crit('pn-01', 'penalaran', 3, 'HbA1c', P.ordered(['hba1c']), {
        met: 'HbA1c dipesan.',
        missed: 'HbA1c tidak dipesan.',
      }, { ref: 'perkeni-dm2-2021', improve: 'HbA1c menilai pengendalian 3 bulan terakhir.' }),
      crit('pn-02', 'penalaran', 2, 'Glukosa puasa atau 2 jam PP', P.ordered(['gula-puasa', 'gd2pp'], 1), {
        met: 'Glukosa darah diperiksa.',
        missed: 'Glukosa darah tidak diperiksa.',
      }, { improve: 'Periksa glukosa puasa dan 2 jam post prandial.' }),
      crit('pn-03', 'penalaran', 2, 'Skrining komplikasi', P.ordered(['ureum-kreatinin', 'uacr', 'urinalisis', 'lipid'], 3), {
        met: 'Ginjal dan lipid diperiksa.',
        partial: 'Sebagian skrining komplikasi dilakukan.',
        missed: 'Skrining komplikasi tidak dilakukan.',
      }, { partial: P.ordered(['ureum-kreatinin', 'uacr', 'urinalisis', 'lipid'], 2), improve: 'Pesan kreatinin, UACR, urinalisis, dan profil lipid.' }),
      crit('pn-04', 'penalaran', 3, 'Diagnosis DM tipe 2 tidak terkontrol', P.dx, {
        met: 'Diagnosis benar.',
        missed: 'Diagnosis tidak sesuai.',
      }, { ref: 'perkeni-dm2-2021', improve: 'HbA1c 9,2% dengan gejala dan neuropati adalah DM tipe 2 tidak terkontrol.' }),
      crit('pn-05', 'penalaran', 1, 'Pemeriksaan efisien', P.not(P.ordered(['foto-toraks'])), {
        met: 'Tidak ada pemeriksaan tidak relevan.',
        missed: 'Foto toraks dipesan tanpa indikasi.',
      }, { improve: 'Hindari pemeriksaan yang tidak mengubah tatalaksana.' }),
      crit('tr-01', 'terapi', 3, 'Intensifikasi terapi oral', P.treated(['metformin-850', 'glimepirid-2'], undefined, 2), {
        met: 'Metformin ditingkatkan dan ditambah sulfonilurea.',
        partial: 'Hanya salah satu dari penyesuaian metformin atau tambahan obat.',
        missed: 'Terapi tidak diintensifikasi.',
      }, { partial: P.treated(['metformin-850', 'glimepirid-2'], undefined, 1), ref: 'perkeni-dm2-2021', improve: 'Dengan HbA1c 9,2%, optimalkan metformin dan tambah obat kedua sambil edukasi.', highlight: 'Terapi diintensifikasi sesuai pedoman.' }),
      crit('tr-02', 'terapi', 2, 'Edukasi manajemen diri', P.treated(['edukasi-dm']), {
        met: 'Edukasi diet, olahraga, perawatan kaki, dan hipoglikemia diberikan.',
        missed: 'Edukasi tidak diberikan.',
      }, { ref: 'perkeni-dm2-2021', improve: 'Edukasi diet, aktivitas, perawatan kaki, dan gejala hipoglikemia.' }),
      crit('tr-03', 'terapi', 1, 'Statin', P.treated(['atorvastatin-20']), {
        met: 'Statin diresepkan.',
        missed: 'Statin tidak diresepkan.',
      }, { ref: 'ada-standards', improve: 'Pertimbangkan statin pada diabetes usia 40 tahun ke atas.' }),
      crit('tr-04', 'terapi', 2, 'Rawat jalan dengan kontrol', P.dispo, {
        met: 'Pasien pulang dengan kontrol.',
        partial: 'Dirujuk lanjut. Pilihan ini masih bisa diterima.',
        missed: 'Disposisi tidak sesuai.',
      }, { partial: { kind: 'disposition', equals: 'acceptable' }, improve: 'Tanpa tanda bahaya akut, rawat jalan dengan kontrol 4 minggu dan rujuk mata.' }),
      crit('ks-01', 'keselamatan', 3, 'Tidak duplikasi sulfonilurea atau steroid', P.not(P.treated('contraindicated')), {
        met: 'Tidak ada obat kontraindikasi.',
        missed: 'Obat kontraindikasi diberikan.',
      }, { ref: 'perkeni-dm2-2021', improve: 'Jangan memberi dua sulfonilurea sekaligus dan hindari steroid.' }),
      safetyNetCriterion(2, 'perkeni-dm2-2021'),
    ],
    breaches: [
      { id: 'br-kontra', when: P.treated('contraindicated'), what: 'Memberikan duplikasi sulfonilurea atau steroid pada diabetes tidak terkontrol.', guidelineRef: 'perkeni-dm2-2021' },
      { id: 'br-tanpa-terapi', when: P.not(P.treated('indicated')), what: 'Tidak memberikan terapi pada diabetes dengan HbA1c 9,2%.', guidelineRef: 'perkeni-dm2-2021' },
    ],
    teachingPoints: [
      'HbA1c menilai kontrol 3 bulan; gali kepatuhan dan pola makan tanpa menghakimi.',
      'Periksa kaki setiap kunjungan dan skrining komplikasi mata, ginjal, dan lipid.',
      'Intensifikasi terapi bertahap sambil edukasi, dan hindari duplikasi sulfonilurea.',
    ],
  }),
}
