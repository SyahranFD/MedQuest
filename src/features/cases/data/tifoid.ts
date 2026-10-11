// Kasus (Poliklinik): demam tifoid tanpa komplikasi pada mahasiswa. SINTETIS.
// Konsultan medis harus memvalidasi pilihan antibiotik, dosis, dan kriteria rawat jalan sebelum dipakai di luar simulasi.

import { buildRubric, crit, defaultFallbacks, exam, iceEntries, makeTests, P, pickDispositions, pickTreatments, q, safetyNetCriterion, vitals } from '../builders'
import type { Case } from '../types'

const MODE = 'poli' as const

export const tifoidCase: Case = {
  id: 'poli-tifoid',
  mode: MODE,
  specialty: 'Penyakit Dalam / Infeksi Tropis',
  difficulty: 'mudah',
  synthetic: true,
  severity: 'urgent',
  title: 'Demam seminggu pada anak kos (tifoid)',
  patient: { name: 'Dimas Prasetyo', age: 19, gender: 'M', occupation: 'Mahasiswa' },
  arrivalBlurb: 'Laki-laki 19 tahun, demam naik turun seminggu, lidah pahit, perut tidak enak dan susah buang air besar.',
  chiefComplaint: 'Saya demam sudah seminggu, Dok, tidak turun-turun, perut juga tidak enak.',
  vitals: vitals(84, '110/70', 20, 98, 38.9),
  initialTrust: 58,
  greeting: 'Selamat siang, Dok.',
  farewell: 'Baik, Dok. Obatnya saya habiskan dan saya jaga makan. Terima kasih.',
  fallbacks: defaultFallbacks(),
  dialogue: [
    q('keluhan-utama', 'rps', 'Keluhan utama kamu apa?', 'Demam sudah seminggu, Dok, perut tidak enak, dan badan lemas sekali.', ['keluhan utama', 'apa keluhan', 'keluhan apa', 'ada keluhan', 'cerita keluhan', 'mengapa datang']),
    q('onset', 'rps', 'Demamnya mulai sejak kapan?', 'Seminggu yang lalu, Dok, hari Senin lalu mulai hangat-hangat.', ['demam sejak kapan', 'sejak kapan', 'kapan mulai', 'sudah berapa lama', 'berapa hari', 'mulai kapan']),
    q('pola-demam', 'rps', 'Bagaimana pola demamnya? Naik terus atau naik turun, dan paling tinggi berapa?', 'Awalnya rendah, makin sore makin tinggi. Beberapa hari ini naik terus, tertinggi 39 lebih, Dok. Turun sedikit kalau minum parasetamol, lalu naik lagi.', ['pola demam', 'demam naik terus', 'demam tertinggi', 'demam sore', 'suhu tertinggi', 'demam turun']),
    q('menggigil', 'rps', 'Apakah demamnya disertai menggigil hebat dan berkeringat?', 'Menggigil tidak sampai hebat, Dok. Cuma meriang, keringat biasa saja.', ['demam menggigil', 'menggigil hebat', 'menggigil', 'berkeringat']),
    q('nyeri-kepala', 'rps', 'Apakah ada sakit kepala?', 'Ada, Dok, nyeri di dahi, terutama waktu demam naik.', ['nyeri kepala', 'sakit kepala', 'kepala sakit', 'pusing']),
    q('nyeri-perut', 'rps', 'Bagaimana perutnya? Di mana terasa tidak enak dan seperti apa?', 'Ulu hati dan perut bawah terasa perih dan kembung, Dok. Tidak sampai melilit.', ['nyeri perut', 'sakit perut', 'perut tidak enak', 'perut kembung', 'perut perih', 'perut']),
    q('mual-nafsu', 'rps', 'Apakah mual, muntah, atau nafsu makan menurun?', 'Mual terus, Dok, muntah dua kali. Lidah rasanya pahit, makan jadi tidak selera.', ['mual muntah', 'mual', 'muntah', 'nafsu makan', 'lidah pahit']),
    q('bab', 'rps', 'Bagaimana buang air besarnya? Diare atau sembelit?', 'Sudah tiga hari susah, Dok, keras. Sebelumnya sempat diare satu hari, encer tidak berdarah.', ['buang air besar', 'bab', 'diare', 'sembelit', 'konstipasi', 'susah bab']),
    q('bab-hitam', 'rps', 'Apakah ada BAB hitam atau berdarah, atau nyeri perut yang tiba-tiba hebat?', 'Tidak ada, Dok. BAB tidak hitam, nyeri perutnya biasa saja.', ['bab hitam', 'bab berdarah', 'darah bab', 'nyeri perut hebat', 'tinja hitam', 'perut tiba-tiba'], { red: true }),
    q('perdarahan', 'rps', 'Apakah ada mimisan, gusi berdarah, atau bintik merah di kulit?', 'Tidak ada, Dok. Cuma ada bercak kemerahan sedikit di dada kemarin, tapi hilang sendiri.', ['mimisan', 'gusi berdarah', 'bintik merah', 'bercak merah', 'ruam', 'perdarahan'], { red: true }),
    q('nyeri-otot', 'rps', 'Apakah ada nyeri otot, nyeri belakang mata, atau nyeri betis?', 'Pegal-pegal badan saja, Dok. Belakang mata dan betis tidak sakit.', ['nyeri otot', 'nyeri belakang mata', 'nyeri betis', 'pegal badan', 'betis', 'otot']),
    q('batuk-pilek', 'rps', 'Apakah ada batuk, pilek, atau nyeri menelan?', 'Tidak ada, Dok.', ['batuk', 'pilek', 'nyeri menelan', 'radang tenggorokan'], { distractor: true }),
    q('kencing', 'rps', 'Bagaimana buang air kecilnya? Apakah nyeri atau berubah warna?', 'Normal, Dok, kuning agak pekat karena kurang minum.', ['buang air kecil', 'kencing', 'kencing nyeri', 'urin pekat'], { distractor: true }),
    ...iceEntries(
      'Saya kira cuma tipes biasa atau masuk angin, Dok. Kata teman kos juga tipes.',
      'Saya takut harus opname lama, Dok, minggu depan ada ujian akhir semester.',
      'Saya mau demamnya cepat turun dan bisa ikut ujian, Dok.',
    ),
    q('jajan', 'sosial', 'Bagaimana kebiasaan makan dan minumnya? Sering jajan di luar?', 'Hampir setiap hari makan di warung dekat kos, Dok, kadang jajan es dan gorengan pinggir jalan. Air minum dari galon isi ulang.', ['kebiasaan makan', 'jajan', 'makan warung', 'makan luar', 'air minum', 'minum es', 'makanan']),
    q('kebersihan', 'sosial', 'Bagaimana kebersihan kos, kamar mandi, dan kebiasaan cuci tangan?', 'Kamar mandi dipakai ramai-ramai, Dok. Cuci tangan sebelum makan kadang lupa kalau buru-buru.', ['kebersihan', 'cuci tangan', 'kamar mandi', 'sanitasi', 'higiene', 'kos']),
    q('kontak-sakit', 'sosial', 'Apakah ada teman kos atau orang rumah dengan keluhan serupa?', 'Ada, Dok, satu teman kos sebelah demam juga dua minggu lalu, katanya tipes dan dirawat.', ['teman sakit', 'keluhan serupa', 'kontak sakit', 'tertular', 'menular', 'teman kos', 'sakit serupa']),
    q('perjalanan', 'sosial', 'Apakah belakangan ini bepergian, kena banjir, atau berenang di sungai?', 'Tidak, Dok. Dua bulan ini di kota saja.', ['bepergian', 'perjalanan', 'banjir', 'berenang', 'sungai', 'ke luar kota']),
    q('gigitan-nyamuk', 'sosial', 'Apakah lingkungan kos banyak nyamuk atau ada yang sakit demam berdarah?', 'Nyamuk ada, Dok, tapi seingat saya tidak ada yang kena demam berdarah.', ['nyamuk', 'demam berdarah', 'gigitan nyamuk', 'lingkungan', 'genangan']),
    q('obat-sudah', 'obat', 'Obat apa yang sudah kamu minum untuk demam ini?', 'Parasetamol dari apotek, Dok. Ada juga amoksisilin dua hari, tapi saya berhenti karena tidak turun-turun, sisanya masih ada.', ['obat apa', 'sudah minum obat', 'minum obat', 'antibiotik', 'amoksisilin', 'obat demam', 'obat apotek', 'parasetamol'], { gate: [56, 'Cuma parasetamol, Dok.'] }),
    q('vaksin', 'rpd', 'Apakah pernah divaksin tifoid atau pernah sakit tifoid sebelumnya?', 'Belum pernah divaksin, Dok. Dulu waktu SMP pernah tipes, dirawat empat hari.', ['vaksin', 'vaksin tifoid', 'pernah tifoid', 'riwayat tifoid', 'pernah tipes', 'riwayat tipes', 'tipes']),
    q('rpd', 'rpd', 'Apakah ada penyakit lain seperti sakit lambung, hati, atau penyakit kronis?', 'Maag kadang kambuh, Dok. Selain itu tidak ada.', ['penyakit lain', 'penyakit kronis', 'riwayat penyakit', 'penyakit dahulu', 'maag', 'sakit lambung', 'riwayat sakit']),
    q('keluarga', 'keluarga', 'Apakah ada riwayat penyakit di keluarga?', 'Tidak ada yang penting, Dok. Ayah punya darah tinggi.', ['riwayat keluarga', 'keluarga sakit', 'keluarga penyakit', 'keluarga']),
    q('alergi-obat', 'alergi', 'Apakah kamu punya alergi obat atau makanan?', 'Tidak ada, Dok.', ['alergi obat', 'alergi makanan', 'alergi']),
    q('merokok', 'sosial', 'Apakah kamu merokok atau minum alkohol?', 'Merokok kadang-kadang, Dok, alkohol tidak.', ['rokok', 'merokok', 'alkohol'], { distractor: true }),
  ],
  exam: [
    exam('umum', 'umum', 'Keadaan umum dan nadi', 'Tampak sakit sedang, compos mentis, lemas. Nadi 84x/menit pada suhu 38,9 derajat (bradikardia relatif).', { abnormal: true }),
    exam('lidah', 'kepala-leher', 'Mulut dan lidah', 'Lidah kotor dengan ujung dan tepi hiperemis, bibir kering. Faring tidak hiperemis, tonsil T1-T1.', { abnormal: true }),
    exam('mata', 'kepala-leher', 'Konjungtiva dan sklera', 'Konjungtiva tidak anemis, sklera tidak ikterik.'),
    exam('abdomen', 'abdomen', 'Abdomen', 'Distensi ringan, nyeri tekan epigastrium dan kuadran bawah, tidak ada defans muskular. Hepar teraba 2 cm di bawah arkus kosta, lien Schuffner I.', { abnormal: true }),
    exam('kulit', 'kulit', 'Kulit', 'Tidak ada petekie maupun ikterus. Tampak beberapa bercak makula kemerahan kecil di dada yang memucat bila ditekan (roseola).', { abnormal: true }),
    exam('paru', 'paru', 'Paru', 'Vesikuler, tidak ada ronki maupun mengi.'),
    exam('jantung', 'jantung', 'Jantung', 'S1 S2 reguler, tidak ada murmur.'),
    exam('neurologi', 'neurologi', 'Neurologi', 'Tidak ada kaku kuduk, kesadaran baik, tidak ada tremor.', { distractor: true }),
  ],
  tests: makeTests(MODE, [
    ['dpl', [{ text: 'Hb 13,1 g/dL, hematokrit 39%, leukosit 3.800/uL (leukopenia), hitung jenis netrofil rendah, trombosit 152.000/uL.', abnormal: true }]],
    ['widal', [{ text: 'Widal: titer O 1/320 dan H 1/160. Nilai ini mendukung tetapi tidak cukup sendirian untuk diagnosis; spesifisitasnya terbatas.', abnormal: true }]],
    ['kultur-darah', [{ text: 'Kultur darah: tumbuh Salmonella Typhi, sensitif terhadap seftriakson, azitromisin, dan kloramfenikol (hasil terkonfirmasi).', abnormal: true, critical: true }]],
    ['ns1', [{ text: 'NS1 antigen dengue: negatif.', abnormal: false }]],
    ['rdt-malaria', [{ text: 'RDT malaria: negatif untuk P. falciparum dan P. vivax.', abnormal: false }]],
    ['sgot-sgpt', [{ text: 'SGOT 58 U/L, SGPT 52 U/L (meningkat ringan, sering ditemukan pada tifoid).', abnormal: true }]],
    ['urinalisis', [{ text: 'Urinalisis: protein negatif, leukosit dan eritrosit negatif, keton +1.', abnormal: false }]],
    ['usg-abdomen', [{ text: 'USG abdomen: hepar sedikit membesar, lien membesar ringan, tidak ada cairan bebas, tidak ada penebalan dinding kandung empedu.', abnormal: true }]],
    ['foto-toraks', [{ text: 'Foto toraks PA: jantung dan paru dalam batas normal.', abnormal: false }]],
    'tourniquet',
  ]),
  panels: [
    { id: 'panel-febris', label: 'Panel demam tropis', testIds: ['dpl', 'ns1', 'rdt-malaria', 'widal', 'sgot-sgpt', 'urinalisis'] },
  ],
  diagnoses: [
    { id: 'demam-tifoid', label: 'Demam tifoid tanpa komplikasi' },
    { id: 'dbd', label: 'Demam dengue atau demam berdarah dengue' },
    { id: 'malaria', label: 'Malaria' },
    { id: 'hepatitis-a', label: 'Hepatitis A akut' },
    { id: 'leptospirosis', label: 'Leptospirosis' },
  ],
  correctDiagnosisId: 'demam-tifoid',
  differentialIds: ['dbd', 'malaria', 'hepatitis-a', 'leptospirosis'],
  treatments: pickTreatments([
    'sefiksim-200',
    'azitromisin-500',
    'kloramfenikol',
    'parasetamol',
    'edukasi-tifoid',
    'amoksisilin',
    'levofloksasin',
    'ibuprofen',
    'deksametason',
  ]),
  indicatedTreatmentIds: ['azitromisin-500', 'sefiksim-200', 'parasetamol', 'edukasi-tifoid'],
  criticalTreatmentIds: ['azitromisin-500'],
  contraindicated: [
    { id: 'ibuprofen', reason: 'OAINS menambah risiko perdarahan dan iritasi saluran cerna pada tifoid dengan trombosit menurun, dan menutupi pantauan demam.' },
    { id: 'deksametason', reason: 'Kortikosteroid tidak diindikasikan pada tifoid tanpa komplikasi dan dapat menutupi gejala perforasi usus.' },
  ],
  dispositions: pickDispositions(['pulang-kontrol', 'pulang', 'rawat-bangsal', 'rujuk-lanjut']),
  correctDispositionId: 'pulang-kontrol',
  acceptableDispositionIds: ['rawat-bangsal'],
  guidelineIds: ['kemenkes-pedoman-tifoid', 'who-dengue-2009'],
  rubric: buildRubric({
    criteria: [
      crit('an-01', 'anamnesis', 2, 'Pola dan lama demam', P.asked(['onset', 'pola-demam'], 2), {
        met: 'Lama dan pola demam ditanyakan.',
        partial: 'Hanya sebagian karakter demam ditanyakan.',
        missed: 'Karakter demam tidak digali.',
      }, { partial: P.asked(['onset', 'pola-demam'], 1), improve: 'Tanyakan lama demam, pola harian, dan suhu tertinggi.' }),
      crit('an-02', 'anamnesis', 3, 'Gejala saluran cerna khas tifoid', P.asked(['nyeri-perut', 'mual-nafsu', 'bab'], 3), {
        met: 'Nyeri perut, mual dan nafsu makan, serta pola BAB ditanyakan.',
        partial: 'Sebagian gejala saluran cerna ditanyakan.',
        missed: 'Gejala saluran cerna tidak ditanyakan.',
      }, { partial: P.asked(['nyeri-perut', 'mual-nafsu', 'bab'], 2), ref: 'kemenkes-pedoman-tifoid', improve: 'Tanyakan nyeri perut, mual, nafsu makan, serta diare atau sembelit.' }),
      crit('an-03', 'anamnesis', 3, 'Tanda bahaya komplikasi', P.asked(['bab-hitam', 'perdarahan'], 2), {
        met: 'BAB hitam dan perdarahan ditanyakan.',
        partial: 'Hanya salah satu tanda bahaya ditanyakan.',
        missed: 'Tanda bahaya perdarahan usus dan perdarahan lain tidak ditanyakan.',
      }, { partial: P.asked(['bab-hitam', 'perdarahan'], 1), ref: 'kemenkes-pedoman-tifoid', improve: 'Tanyakan BAB hitam, nyeri perut hebat mendadak, dan perdarahan: tanda komplikasi tifoid.', highlight: 'Anda menyingkirkan komplikasi usus dengan menanyakan tanda bahaya.' }),
      crit('an-04', 'anamnesis', 2, 'Paparan makanan, kebersihan, dan kontak', P.asked(['jajan', 'kebersihan', 'kontak-sakit'], 2), {
        met: 'Kebiasaan makan, kebersihan, dan kontak sakit ditanyakan.',
        partial: 'Hanya satu faktor paparan ditanyakan.',
        missed: 'Faktor paparan tidak ditanyakan.',
      }, { partial: P.asked(['jajan', 'kebersihan', 'kontak-sakit'], 1), improve: 'Tanyakan jajan di luar, kebersihan air dan tangan, serta teman yang sakit serupa.' }),
      crit('an-05', 'anamnesis', 2, 'Menyingkirkan dengue dan penyakit tropis lain', P.asked(['perdarahan', 'nyeri-otot', 'gigitan-nyamuk', 'perjalanan'], 2), {
        met: 'Gejala dan paparan dengue serta penyakit tropis lain ditanyakan.',
        partial: 'Hanya sebagian diferensial tropis digali.',
        missed: 'Diferensial penyakit tropis tidak digali.',
      }, { partial: P.asked(['perdarahan', 'nyeri-otot', 'gigitan-nyamuk', 'perjalanan'], 1), improve: 'Gali nyeri otot, nyamuk, dan riwayat banjir untuk dengue dan leptospirosis.' }),
      crit('an-06', 'anamnesis', 1, 'Obat yang sudah diminum dan alergi', P.asked(['obat-sudah', 'alergi-obat'], 2), {
        met: 'Obat yang sudah diminum dan alergi ditanyakan.',
        partial: 'Hanya salah satu ditanyakan.',
        missed: 'Obat sebelumnya dan alergi tidak ditanyakan.',
      }, { partial: P.asked(['obat-sudah', 'alergi-obat'], 1), improve: 'Tanyakan antibiotik yang sudah diminum tanpa menghakimi, dan alergi obat.' }),
      crit('pe-01', 'pemeriksaan', 2, 'Abdomen', P.examined(['abdomen']), {
        met: 'Abdomen diperiksa.',
        missed: 'Abdomen tidak diperiksa.',
      }, { improve: 'Periksa nyeri tekan, defans, hepar, dan lien.' }),
      crit('pe-02', 'pemeriksaan', 1, 'Lidah dan keadaan umum', P.examined(['umum', 'lidah'], 2), {
        met: 'Keadaan umum dan lidah dinilai.',
        partial: 'Hanya salah satu dinilai.',
        missed: 'Keadaan umum dan lidah tidak dinilai.',
      }, { partial: P.examined(['umum', 'lidah'], 1), improve: 'Nilai nadi terhadap suhu (bradikardia relatif) dan lidah.' }),
      crit('pe-03', 'pemeriksaan', 1, 'Kulit', P.examined(['kulit']), {
        met: 'Kulit diperiksa.',
        missed: 'Kulit tidak diperiksa.',
      }, { improve: 'Cari roseola dan petekie.' }),
      crit('pn-01', 'penalaran', 3, 'Darah perifer lengkap', P.ordered(['dpl']), {
        met: 'Darah perifer lengkap dipesan.',
        missed: 'Darah perifer lengkap tidak dipesan.',
      }, { ref: 'kemenkes-pedoman-tifoid', improve: 'Leukopenia dan trombosit membantu membedakan tifoid dari dengue.' }),
      crit('pn-02', 'penalaran', 3, 'Konfirmasi tifoid', P.ordered(['kultur-darah', 'widal'], 1), {
        met: 'Pemeriksaan penunjang tifoid dipesan.',
        missed: 'Pemeriksaan penunjang tifoid tidak dipesan.',
      }, { ref: 'kemenkes-pedoman-tifoid', improve: 'Kultur darah adalah baku emas; Widal saja kurang spesifik.', highlight: 'Anda memesan pemeriksaan konfirmasi tifoid.' }),
      crit('pn-03', 'penalaran', 2, 'Menyingkirkan dengue dan malaria', P.ordered(['ns1', 'rdt-malaria'], 1), {
        met: 'Dengue atau malaria disingkirkan dengan tes cepat.',
        missed: 'Dengue dan malaria tidak disingkirkan.',
      }, { ref: 'who-dengue-2009', improve: 'Demam sepekan di daerah endemik: singkirkan dengue dan malaria dengan tes cepat.' }),
      crit('pn-04', 'penalaran', 3, 'Diagnosis demam tifoid', P.dx, {
        met: 'Diagnosis tifoid benar.',
        missed: 'Diagnosis tidak sesuai dengan klinis dan hasil laboratorium.',
      }, { ref: 'kemenkes-pedoman-tifoid', improve: 'Demam lebih dari 7 hari, bradikardia relatif, lidah kotor, leukopenia, dan kultur positif mengarah ke tifoid.' }),
      crit('pn-05', 'penalaran', 1, 'Pemeriksaan efisien', P.not(P.ordered(['foto-toraks', 'usg-abdomen'])), {
        met: 'Tidak ada pemeriksaan yang tidak perlu.',
        missed: 'Foto toraks atau USG dipesan tanpa indikasi.',
      }, { improve: 'Tanpa batuk atau tanda komplikasi, foto toraks dan USG belum diperlukan.' }),
      crit('tr-01', 'terapi', 3, 'Antibiotik yang sesuai', P.treated(['azitromisin-500', 'sefiksim-200', 'kloramfenikol']), {
        met: 'Antibiotik yang sesuai untuk tifoid diresepkan.',
        missed: 'Antibiotik untuk tifoid tidak diresepkan.',
      }, { ref: 'kemenkes-pedoman-tifoid', improve: 'Berikan antibiotik yang sesuai pola kepekaan; azitromisin atau sefiksim lazim dipakai, hindari kuinolon bila resistan.', highlight: 'Antibiotik yang Anda pilih sesuai untuk tifoid.' }),
      crit('tr-02', 'terapi', 1, 'Antipiretik yang aman', P.treated(['parasetamol']), {
        met: 'Parasetamol diresepkan.',
        missed: 'Antipiretik tidak diresepkan.',
      }, { improve: 'Parasetamol adalah antipiretik yang aman untuk pasien ini.' }),
      crit('tr-03', 'terapi', 2, 'Edukasi istirahat, diet, dan kebersihan', P.treated(['edukasi-tifoid']), {
        met: 'Edukasi diet, istirahat, dan kebersihan diberikan.',
        missed: 'Edukasi tidak diberikan.',
      }, { ref: 'kemenkes-pedoman-tifoid', improve: 'Edukasi istirahat, diet lunak, minum cukup, cuci tangan, dan menghabiskan antibiotik.' }),
      crit('tr-04', 'terapi', 2, 'Rawat jalan dengan kontrol', P.dispo, {
        met: 'Pasien pulang dengan jadwal kontrol.',
        missed: 'Disposisi tidak sesuai.',
      }, { improve: 'Tifoid tanpa komplikasi dan masih dapat minum diobati rawat jalan dengan kontrol 3 hari.' }),
      crit('ks-01', 'keselamatan', 3, 'Tidak memberi OAINS atau steroid', P.not(P.treated('contraindicated')), {
        met: 'Tidak ada obat kontraindikasi.',
        missed: 'OAINS atau steroid diberikan.',
      }, { ref: 'kemenkes-pedoman-tifoid', improve: 'Hindari ibuprofen dan deksametason pada tifoid tanpa komplikasi.' }),
      safetyNetCriterion(2, 'kemenkes-pedoman-tifoid'),
    ],
    breaches: [
      { id: 'br-kontra', when: P.treated('contraindicated'), what: 'Memberikan OAINS atau steroid pada tifoid tanpa komplikasi.', guidelineRef: 'kemenkes-pedoman-tifoid' },
      { id: 'br-tanpa-antibiotik', when: P.not(P.treated(['azitromisin-500', 'sefiksim-200', 'kloramfenikol'])), what: 'Tifoid tidak diberi antibiotik.', guidelineRef: 'kemenkes-pedoman-tifoid' },
    ],
    teachingPoints: [
      'Demam lebih dari 7 hari dengan bradikardia relatif, lidah kotor, dan leukopenia mengarah ke tifoid; Widal saja tidak cukup, kultur darah menjadi baku emas.',
      'Selalu singkirkan dengue dan malaria di daerah endemik sebelum menetapkan tifoid.',
      'Tanda bahaya perdarahan usus dan perforasi (BAB hitam, nyeri perut mendadak) harus disampaikan sebagai safety-netting.',
    ],
  }),
}
