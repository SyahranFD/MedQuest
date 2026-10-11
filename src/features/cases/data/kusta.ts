// Kasus (Poliklinik): kusta tipe multibasiler baru, bercak mati rasa dengan stigma. SINTETIS.
// Konsultan medis harus memvalidasi klasifikasi, regimen MDT, dan dosis sebelum dipakai di luar simulasi.

import { buildRubric, crit, defaultFallbacks, exam, iceEntries, makeTests, P, pickDispositions, pickTreatments, q, safetyNetCriterion, vitals } from '../builders'
import type { Case } from '../types'

const MODE = 'poli' as const

export const kustaCase: Case = {
  id: 'poli-kusta',
  mode: MODE,
  specialty: 'Kulit dan Kelamin / Penyakit Dalam',
  difficulty: 'sulit',
  synthetic: true,
  severity: 'stable',
  title: 'Bercak kulit mati rasa (kusta)',
  patient: { name: 'Sutrisno Hadi', age: 38, gender: 'M', occupation: 'Petani tambak garam' },
  arrivalBlurb: 'Laki-laki 38 tahun dengan bercak kemerahan di badan dan lengan yang tidak gatal, kesemutan di tangan, sejak delapan bulan.',
  chiefComplaint: 'Kulit saya bercak-bercak merah, Dok, tidak gatal tapi tebal rasanya. Tangan juga sering kesemutan.',
  vitals: vitals(78, '122/78', 18, 99, 36.8),
  initialTrust: 46,
  greeting: 'Selamat siang, Dok.',
  farewell: 'Baik, Dok. Saya akan minum obatnya tiap hari dan ambil yang bulanan di puskesmas. Terima kasih sudah tidak menjauhi saya.',
  fallbacks: defaultFallbacks(),
  dialogue: [
    q('keluhan-utama', 'rps', 'Keluhan utama Bapak apa?', 'Bercak merah di badan dan lengan, Dok, tidak gatal tapi terasa tebal. Tangan kesemutan terus.', ['keluhan utama', 'apa keluhan', 'keluhan apa', 'ada keluhan', 'cerita keluhan', 'mengapa datang']),
    q('onset', 'rps', 'Bercaknya mulai sejak kapan, dan bagaimana perkembangannya?', 'Kira-kira delapan bulan, Dok. Awalnya satu di punggung, sekarang banyak sampai ke lengan dan wajah.', ['bercak sejak kapan', 'sejak kapan', 'kapan mulai', 'sudah berapa lama', 'berapa bulan', 'mulai kapan', 'perkembangan']),
    q('karakter-bercak', 'rps', 'Seperti apa bercaknya? Gatal, nyeri, bersisik, atau berair?', 'Tidak gatal dan tidak sakit, Dok. Tidak bersisik juga. Warnanya kemerahan dan agak mengilap.', ['karakter bercak', 'bercak gatal', 'bercak bersisik', 'bercak nyeri', 'gatal', 'bercak merah', 'bercak']),
    q('mati-rasa', 'rps', 'Apakah bercaknya terasa kurang rasa atau mati rasa saat disentuh?', 'Iya, Dok. Kalau dicubit atau kena panas di bercak itu saya kurang terasa. Pernah tangan kena knalpot tidak terasa panas.', ['mati rasa', 'kurang rasa', 'baal', 'tebal rasa', 'tidak terasa', 'sensasi', 'raba bercak']),
    q('kesemutan', 'rps', 'Bagaimana kesemutan di tangan dan kaki? Apakah sampai lemas?', 'Kesemutan di jari manis dan kelingking, Dok. Kadang genggaman lemah, sendok sering jatuh.', ['kesemutan', 'kesemutan tangan', 'kesemutan kaki', 'tangan lemas', 'genggaman lemah', 'kelemahan tangan', 'kebas']),
    q('luka-tak-terasa', 'rps', 'Apakah pernah luka, melepuh, atau terbakar tanpa terasa sakit?', 'Pernah, Dok. Ada luka kecil di jari yang tidak saya sadari baru berdarah.', ['luka tidak terasa', 'melepuh', 'terbakar', 'luka jari', 'luka', 'lecet'], { red: true }),
    q('mata', 'rps', 'Apakah ada mata merah, perih, kabur, atau sulit menutup mata rapat?', 'Mata kiri sering merah dan berair, Dok. Menutup mata masih bisa.', ['mata merah', 'mata kabur', 'mata perih', 'sulit menutup mata', 'gangguan mata', 'mata'], { red: true }),
    q('benjolan', 'rps', 'Apakah ada benjolan di telinga, wajah, atau badan, dan alis rontok?', 'Daun telinga agak tebal, Dok, dan alis bagian luar mulai tipis. Benjolan lain tidak ada.', ['benjolan', 'alis rontok', 'telinga tebal', 'nodul', 'rambut alis', 'madarosis']),
    q('hidung', 'rps', 'Apakah ada hidung tersumbat terus atau sering mimisan?', 'Kadang tersumbat sebelah, Dok, tapi saya kira pilek biasa.', ['hidung tersumbat', 'mimisan', 'hidung', 'pilek terus']),
    q('demam-nyeri-saraf', 'rps', 'Apakah belakangan ini ada demam, nyeri di sepanjang lengan atau kaki, atau bercak yang tiba-tiba membengkak?', 'Tidak ada demam, Dok. Nyeri saraf juga tidak.', ['demam', 'nyeri saraf', 'bercak membengkak', 'reaksi kusta', 'nyeri lengan', 'nyeri sepanjang'], { red: true }),
    q('batuk-tb', 'rps', 'Apakah ada batuk lama, batuk darah, atau berat badan turun?', 'Tidak ada, Dok. Batuk cuma karena rokok kadang pagi.', ['batuk lama', 'batuk darah', 'berat badan turun', 'keringat malam', 'tb', 'batuk']),
    q('obat-sudah', 'obat', 'Obat atau salep apa yang sudah Bapak pakai untuk bercaknya?', 'Salep panu dan krim dari warung, Dok. Ada juga salep warna merah dari mantri, katanya mengandung steroid, tapi tidak mempan.', ['obat apa', 'salep', 'krim', 'sudah minum obat', 'obat kulit', 'pakai obat', 'obat warung', 'jamu', 'obat panu']),
    q('berobat-sebelumnya', 'rpd', 'Sebelumnya sudah ke puskesmas atau dokter kulit? Apa kata mereka?', 'Ke puskesmas dua kali, Dok. Katanya panu dan jamur, diberi salep. Tidak ada yang bilang penyakit lain.', ['puskesmas', 'dokter kulit', 'diagnosis sebelumnya', 'katanya penyakit', 'kata puskesmas', 'kata mereka']),
    q('riwayat-kontak', 'keluarga', 'Apakah ada anggota keluarga atau tetangga yang punya bercak serupa atau pernah berobat kusta?', 'Dulu paman saya di kampung kena kusta, Dok, kakinya cacat. Keluarga tidak ada yang tahu kalau saya begini.', ['riwayat kusta', 'kusta keluarga', 'keluarga bercak', 'kontak kusta', 'tetangga kusta', 'penyakit kulit keluarga', 'keluarga'], { gate: [58, 'Tidak ada, Dok. Keluarga saya sehat semua.'] }),
    q('lingkungan', 'sosial', 'Bagaimana lingkungan tempat tinggal Bapak? Berapa orang serumah, apakah padat?', 'Serumah delapan orang, Dok, dua kamar. Air untuk mandi dari sumur bersama.', ['lingkungan', 'tinggal serumah', 'rumah padat', 'rumah', 'kondisi rumah', 'serumah', 'sumur']),
    q('pekerjaan', 'sosial', 'Pekerjaan Bapak apa, dan apakah pekerjaan terganggu oleh keluhan ini?', 'Petani tambak garam, Dok. Saya kesulitan memegang cangkul kalau tangan lemas.', ['pekerjaan', 'kerja', 'profesi', 'terganggu kerja', 'cangkul']),
    q('rpd', 'rpd', 'Apakah ada kencing manis, HIV, atau penyakit kronis lain?', 'Tidak ada, Dok. Gula pernah diperiksa dan normal.', ['kencing manis', 'diabetes', 'hiv', 'penyakit kronis', 'riwayat penyakit', 'penyakit dahulu', 'penyakit lain']),
    ...iceEntries(
      'Saya kira panu atau alergi tambak garam, Dok.',
      'Saya takut ini kusta, Dok. Nanti saya dikucilkan, anak-anak tidak boleh sekolah, dan tidak ada yang mau beli garam saya.',
      'Saya mau tahu betul sakit apa, Dok, dan bisa sembuh tanpa orang kampung tahu.',
    ),
    q('alergi-obat', 'alergi', 'Apakah Bapak punya alergi obat?', 'Tidak ada, Dok.', ['alergi obat', 'alergi']),
    q('merokok', 'sosial', 'Apakah Bapak merokok atau minum alkohol?', 'Merokok, Dok, setengah bungkus sehari. Alkohol tidak.', ['rokok', 'merokok', 'alkohol'], { distractor: true }),
    q('gigitan', 'rps', 'Apakah sebelum bercak muncul ada gigitan serangga atau kontak dengan hewan?', 'Tidak ingat, Dok.', ['gigitan serangga', 'kontak hewan', 'gigitan', 'digigit'], { distractor: true }),
  ],
  exam: [
    exam('kulit', 'kulit', 'Inspeksi kulit', 'Plak dan makula eritem multipel (lebih dari 5), hampir simetris, di punggung, lengan, dan wajah, batas tidak tegas, permukaan mengilap, tidak bersisik. Madarosis alis lateral ringan, daun telinga menebal.', { abnormal: true }),
    exam('sensibilitas', 'kulit', 'Tes sensibilitas bercak (raba dan nyeri)', 'Hipoestesia sampai anestesi pada bercak untuk sentuhan kapas dan tusukan jarum; sensasi di kulit sehat di sekitarnya normal.', { abnormal: true }),
    exam('saraf', 'neurologi', 'Palpasi saraf tepi', 'Pembesaran dan penebalan saraf ulnaris kiri dan kanan serta auricularis magnus kanan, nyeri tekan ringan, konsistensi kenyal.', { abnormal: true }),
    exam('motorik', 'neurologi', 'Kekuatan otot tangan dan sensasi telapak', 'Abduksi jari kelingking 4/5 di kedua tangan, genggaman 4/5, hipoestesia telapak dan jari 4-5 (pola sarung tangan ringan). Tidak ada kontraktur atau jari cakar.', { abnormal: true }),
    exam('mata', 'kepala-leher', 'Mata dan wajah', 'Visus 6/6 kedua mata, hiperemis konjungtiva ringan mata kiri, kedipan baik, tidak ada lagoftalmos, sensibilitas kornea utuh.', { abnormal: true }),
    exam('ekstremitas', 'ekstremitas', 'Ekstremitas dan luka', 'Ulkus superfisial 5 mm di ujung jari kedua tangan kanan, bersih, tanpa tanda infeksi. Tidak ada mutilasi atau deformitas.', { abnormal: true }),
    exam('paru', 'paru', 'Paru', 'Vesikuler, tidak ada ronki maupun mengi.'),
    exam('abdomen', 'abdomen', 'Abdomen', 'Datar, lemas, hepar dan lien tidak teraba.', { distractor: true }),
  ],
  tests: makeTests(MODE, [
    ['kerokan-kulit', [{ text: 'Kerokan jaringan kulit (slit skin smear) dari cuping telinga dan bercak: BTA positif, indeks bakteri (IB) 3+, indeks morfologi 4%. Sesuai kusta multibasiler.', abnormal: true, critical: true }]],
    ['biopsi-kulit', [{ text: 'Histopatologi kulit: infiltrat sel busa (foamy) dan makrofag mengelilingi saraf kulit, zona bebas (Grenz) di bawah epidermis. Konsisten dengan kusta spektrum lepromatosa.', abnormal: true }]],
    ['dpl', [{ text: 'Hb 13,0 g/dL, leukosit 7.900/uL, trombosit 276.000/uL (nilai dasar sebelum dapson).', abnormal: false }]],
    ['sgot-sgpt', [{ text: 'SGOT 24 U/L, SGPT 21 U/L (nilai dasar sebelum MDT).', abnormal: false }]],
    ['foto-toraks', [{ text: 'Foto toraks PA: jantung dan paru dalam batas normal, tidak ada infiltrat atau kavitas.', abnormal: false }]],
    ['genexpert', [{ text: 'GeneXpert MTB/RIF sputum: M. tuberculosis tidak terdeteksi. TB aktif disingkirkan sebelum rifampisin.', abnormal: false }]],
    ['hiv', [{ text: 'Tes HIV: non-reaktif.', abnormal: false }]],
    'gds',
  ]),
  panels: [
    { id: 'panel-kusta', label: 'Panel evaluasi kusta dan dasar MDT', testIds: ['kerokan-kulit', 'dpl', 'sgot-sgpt', 'foto-toraks'] },
  ],
  diagnoses: [
    { id: 'kusta-mb', label: 'Kusta tipe multibasiler (MB), kasus baru' },
    { id: 'kusta-pb', label: 'Kusta tipe pausibasiler (PB)' },
    { id: 'tinea-korporis', label: 'Tinea korporis (panu atau kurap)' },
    { id: 'vitiligo', label: 'Vitiligo' },
    { id: 'neuropati-diabetik', label: 'Neuropati diabetik' },
  ],
  correctDiagnosisId: 'kusta-mb',
  differentialIds: ['kusta-pb', 'tinea-korporis', 'vitiligo', 'neuropati-diabetik'],
  treatments: pickTreatments([
    'mdt-mb',
    'mdt-pb',
    'rifampisin-tunggal',
    'edukasi-kusta',
    'skrining-kontak',
    'ketokonazol-krim',
    'parasetamol',
  ]),
  indicatedTreatmentIds: ['mdt-mb', 'edukasi-kusta', 'skrining-kontak'],
  criticalTreatmentIds: ['mdt-mb'],
  contraindicated: [
    { id: 'mdt-pb', reason: 'Regimen PB 6 bulan tanpa klofazimin tidak memadai untuk kusta MB dan membuka risiko relaps, resistansi, dan kecacatan.' },
    { id: 'rifampisin-tunggal', reason: 'Monoterapi rifampisin memicu resistansi pada kusta (dan TB); pengobatan harus kombinasi MDT.' },
  ],
  dispositions: pickDispositions(['pulang-kontrol', 'pulang', 'rawat-bangsal', 'rujuk-lanjut']),
  correctDispositionId: 'pulang-kontrol',
  acceptableDispositionIds: [],
  guidelineIds: ['kemenkes-kusta', 'who-kusta-2018'],
  rubric: buildRubric({
    criteria: [
      crit('an-01', 'anamnesis', 2, 'Karakter dan perjalanan bercak', P.asked(['onset', 'karakter-bercak'], 2), {
        met: 'Onset dan karakter bercak ditanyakan.',
        partial: 'Hanya sebagian ditanyakan.',
        missed: 'Karakter bercak tidak digali.',
      }, { partial: P.asked(['onset', 'karakter-bercak'], 1), improve: 'Tanyakan onset, gatal, dan sisik.' }),
      crit('an-02', 'anamnesis', 3, 'Mati rasa dan gangguan saraf', P.asked(['mati-rasa', 'kesemutan', 'luka-tak-terasa'], 3), {
        met: 'Mati rasa, kesemutan, dan luka tanpa nyeri ditanyakan.',
        partial: 'Sebagian gejala saraf ditanyakan.',
        missed: 'Gejala saraf tidak ditanyakan.',
      }, { partial: P.asked(['mati-rasa', 'kesemutan', 'luka-tak-terasa'], 2), ref: 'kemenkes-kusta', improve: 'Tanyakan mati rasa pada bercak, kesemutan, kelemahan tangan, dan luka tanpa nyeri: tanda kardinal kusta.', highlight: 'Anda menggali tanda kardinal kusta dengan lengkap.' }),
      crit('an-03', 'anamnesis', 2, 'Gejala mata, hidung, telinga, dan alis', P.asked(['mata', 'benjolan', 'hidung'], 2), {
        met: 'Mata dan gejala wajah digali.',
        partial: 'Hanya sebagian digali.',
        missed: 'Gejala wajah dan mata tidak digali.',
      }, { partial: P.asked(['mata', 'benjolan', 'hidung'], 1), improve: 'Tanyakan mata, benjolan, alis rontok, dan hidung tersumbat.' }),
      crit('an-04', 'anamnesis', 2, 'Tanda reaksi kusta', P.asked(['demam-nyeri-saraf']), {
        met: 'Tanda reaksi kusta ditanyakan.',
        missed: 'Tanda reaksi kusta tidak ditanyakan.',
      }, { ref: 'who-kusta-2018', improve: 'Tanyakan demam, nyeri saraf, dan bercak membengkak: tanda reaksi yang perlu penanganan segera.' }),
      crit('an-05', 'anamnesis', 2, 'Riwayat kontak dan pengobatan sebelumnya', P.asked(['riwayat-kontak', 'berobat-sebelumnya', 'obat-sudah'], 2), {
        met: 'Kontak dan riwayat berobat digali.',
        partial: 'Hanya sebagian digali.',
        missed: 'Kontak dan riwayat berobat tidak digali.',
      }, { partial: P.asked(['riwayat-kontak', 'berobat-sebelumnya', 'obat-sudah'], 1), ref: 'kemenkes-kusta', improve: 'Bangun kepercayaan agar pasien terbuka tentang kontak dan pengobatan sebelumnya.' }),
      crit('an-06', 'anamnesis', 2, 'Menyingkirkan TB aktif sebelum rifampisin', P.asked(['batuk-tb']), {
        met: 'Gejala TB ditanyakan.',
        missed: 'Gejala TB tidak ditanyakan.',
      }, { improve: 'MDT mengandung rifampisin: singkirkan TB aktif agar tidak terjadi monoterapi tersembunyi.' }),
      crit('pe-01', 'pemeriksaan', 3, 'Inspeksi kulit dan tes sensibilitas', P.examined(['kulit', 'sensibilitas'], 2), {
        met: 'Kulit dan sensibilitas diperiksa.',
        partial: 'Hanya salah satu diperiksa.',
        missed: 'Kulit dan sensibilitas tidak diperiksa.',
      }, { partial: P.examined(['kulit', 'sensibilitas'], 1), ref: 'kemenkes-kusta', improve: 'Periksa bercak dan uji sensibilitas (raba dan nyeri) sebelum menyimpulkan.' }),
      crit('pe-02', 'pemeriksaan', 3, 'Palpasi saraf tepi dan kekuatan otot', P.examined(['saraf', 'motorik'], 2), {
        met: 'Saraf tepi dan fungsi motorik diperiksa.',
        partial: 'Hanya salah satu diperiksa.',
        missed: 'Saraf tepi dan fungsi motorik tidak diperiksa.',
      }, { partial: P.examined(['saraf', 'motorik'], 1), ref: 'kemenkes-kusta', improve: 'Palpasi saraf ulnaris, auricularis magnus, peroneus, dan nilai kekuatan otot untuk menentukan kecacatan.' }),
      crit('pe-03', 'pemeriksaan', 1, 'Mata dan ekstremitas', P.examined(['mata', 'ekstremitas'], 1), {
        met: 'Mata atau ekstremitas diperiksa.',
        missed: 'Mata dan ekstremitas tidak diperiksa.',
      }, { improve: 'Periksa mata dan luka di ekstremitas untuk menentukan derajat cacat.' }),
      crit('pn-01', 'penalaran', 3, 'Kerokan kulit (BTA)', P.ordered(['kerokan-kulit']), {
        met: 'Kerokan kulit dipesan.',
        missed: 'Kerokan kulit tidak dipesan.',
      }, { ref: 'kemenkes-kusta', improve: 'Kerokan jaringan kulit mendukung diagnosis dan klasifikasi MB.', highlight: 'Anda memakai kerokan kulit untuk mengonfirmasi diagnosis.' }),
      crit('pn-02', 'penalaran', 3, 'Diagnosis dan klasifikasi MB', P.dx, {
        met: 'Diagnosis kusta MB benar.',
        missed: 'Diagnosis atau klasifikasi tidak sesuai.',
      }, { ref: 'who-kusta-2018', improve: 'Lebih dari 5 lesi, saraf menebal, dan BTA positif menunjukkan kusta MB.' }),
      crit('pn-03', 'penalaran', 2, 'Pemeriksaan dasar sebelum MDT', P.ordered(['dpl', 'sgot-sgpt'], 1), {
        met: 'Pemeriksaan dasar dipesan.',
        missed: 'Pemeriksaan dasar tidak dipesan.',
      }, { improve: 'Pesan darah lengkap dan fungsi hati sebelum dapson dan rifampisin.' }),
      crit('pn-04', 'penalaran', 1, 'Menyingkirkan TB paru', P.ordered(['foto-toraks', 'genexpert'], 1), {
        met: 'Pemeriksaan TB dipesan.',
        missed: 'TB aktif tidak disingkirkan.',
      }, { improve: 'Foto toraks atau tes cepat molekuler menyingkirkan TB aktif sebelum rifampisin.' }),
      crit('tr-01', 'terapi', 3, 'MDT multibasiler 12 bulan', P.treated(['mdt-mb']), {
        met: 'MDT MB diresepkan.',
        missed: 'MDT MB tidak diresepkan.',
      }, { ref: 'who-kusta-2018', improve: 'Kusta MB: rifampisin, klofazimin, dan dapson selama 12 bulan, dengan dosis bulanan diawasi.', highlight: 'Regimen MDT sesuai tipe kusta.' }),
      crit('tr-02', 'terapi', 2, 'Edukasi, perawatan diri, dan stigma', P.treated(['edukasi-kusta']), {
        met: 'Edukasi diberikan.',
        missed: 'Edukasi tidak diberikan.',
      }, { ref: 'kemenkes-kusta', improve: 'Jelaskan kusta dapat disembuhkan, penularan berhenti setelah pengobatan dimulai, perawatan tangan dan kaki, serta tanda reaksi.' }),
      crit('tr-03', 'terapi', 2, 'Pemeriksaan kontak serumah', P.treated(['skrining-kontak']), {
        met: 'Skrining kontak dilakukan.',
        missed: 'Skrining kontak tidak dilakukan.',
      }, { ref: 'kemenkes-kusta', improve: 'Periksa seluruh anggota rumah tangga dan kontak dekat.' }),
      crit('tr-04', 'terapi', 2, 'Rawat jalan dengan kontrol bulanan', P.dispo, {
        met: 'Pasien pulang dengan jadwal kontrol.',
        missed: 'Disposisi tidak sesuai.',
      }, { improve: 'Kusta tanpa reaksi berat diobati rawat jalan dengan dosis bulanan di fasilitas kesehatan.' }),
      crit('ks-01', 'keselamatan', 3, 'Tidak memberi monoterapi atau regimen PB', P.not(P.treated('contraindicated')), {
        met: 'Tidak ada obat kontraindikasi.',
        missed: 'Monoterapi atau regimen PB diberikan pada kusta MB.',
      }, { ref: 'who-kusta-2018', improve: 'Hindari monoterapi rifampisin dan regimen yang kurang dari kebutuhan tipe MB.' }),
      safetyNetCriterion(2, 'kemenkes-kusta'),
    ],
    breaches: [
      { id: 'br-kontra', when: P.treated('contraindicated'), what: 'Memberikan monoterapi rifampisin atau regimen PB pada kusta MB.', guidelineRef: 'who-kusta-2018' },
      { id: 'br-tanpa-mdt', when: P.not(P.treated(['mdt-mb'])), what: 'Kusta MB terkonfirmasi tidak diberi MDT multibasiler.', guidelineRef: 'who-kusta-2018' },
    ],
    teachingPoints: [
      'Bercak kulit mati rasa dan saraf tepi menebal adalah tanda kardinal kusta; jangan berhenti pada diagnosis panu.',
      'Kusta MB memerlukan MDT 12 bulan dengan tiga obat; monoterapi memicu resistansi.',
      'Stigma adalah hambatan utama berobat. Bahasa yang menenangkan dan menjaga kerahasiaan membangun kepercayaan.',
    ],
  }),
}
