// Indonesian text normalization: lowercase, strip punctuation and diacritics, expand colloquial
// forms, light affix stemming, and synonym canonicalization. The same pipeline runs on user input
// and on authored patterns, so any consistent stem is fine; it does not need to be linguistically correct.

const PHRASES: [RegExp, string][] = [
  [/\borang tua\b/g, 'ortu'],
  [/\bbuang air kecil(nya)?\b/g, 'kencing'],
  [/\bbuang air besar(nya)?\b/g, 'bab'],
  [/\bdarah tinggi\b/g, 'hipertensi'],
  [/\bkencing manis\b/g, 'diabetes'],
  [/\bsakit gula\b/g, 'diabetes'],
  [/\bsakit kepala\b/g, 'nyeri kepala'],
  [/\bmau muntah\b/g, 'mual'],
  [/\b(susah|sulit|kesulitan) (bernapas|bernafas|napas|nafas)\b/g, 'sesak'],
  [/\bsesak (napas|nafas)\b/g, 'sesak'],
  [/\bnafas\b/g, 'napas'],
  [/\bkeringat dingin\b/g, 'keringatdingin'],
  [/\bkeringat malam\b/g, 'keringatmalam'],
  [/\bpanas dingin\b/g, 'demam'],
  [/\b(nggak|ngga|gak|ga|enggak|tdk|tak|bukan)\b/g, 'tidak'],
  [/\b(udah|sdh|telah)\b/g, 'sudah'],
  [/\b(gimana|gmn|bgmn)\b/g, 'bagaimana'],
  [/\b(knp|kenapa)\b/g, 'mengapa'],
  [/\b(kpn)\b/g, 'kapan'],
  [/\b(brp)\b/g, 'berapa'],
  [/\b(yg)\b/g, 'yang'],
  [/\b(dgn)\b/g, 'dengan'],
  [/\b(lg|lagi)\b/g, 'lagi'],
  [/\b(berak|pup)\b/g, 'bab'],
]

const STOPWORDS = new Set([
  'dok',
  'dokter',
  'ya',
  'sih',
  'nih',
  'dong',
  'deh',
  'kok',
  'lho',
  'loh',
  'yang',
  'itu',
  'ini',
  'tuh',
  'nah',
  'pak',
  'bu',
  'bapak',
  'ibu',
  'mas',
  'mbak',
  'kak',
  'saya',
  'aku',
  'anda',
  'kamu',
  'kita',
  'dengan',
  'untuk',
  'dari',
  'pada',
  'dan',
  'atau',
  'di',
  'ke',
  'apakah',
  'adakah',
  'boleh',
  'bisa',
  'mau',
  'coba',
  'tolong',
  'sedang',
  'lagi',
  'sekarang',
])

/** Canonical form -> variants. Matching is on the stem of each variant. */
const SYNONYM_GROUPS: Record<string, string[]> = {
  nyeri: ['sakit', 'nyeri', 'perih', 'pedih', 'ngilu', 'kesakitan', 'sakitnya', 'nyut'],
  demam: ['demam', 'panas', 'meriang', 'febris', 'menggigil', 'hangat'],
  mulai: ['mulai', 'awal', 'muncul', 'timbul', 'onset', 'terjadi', 'dimulai', 'bermula'],
  lama: ['lama', 'lamanya', 'durasi'],
  obat: ['obat', 'pil', 'tablet', 'kapsul', 'jamu', 'suplemen', 'vitamin', 'terapi'],
  minum: ['minum', 'konsumsi', 'pakai', 'gunakan', 'makan obat', 'dikonsumsi', 'diminum', 'meminum'],
  alergi: ['alergi', 'alergik', 'biduran', 'gatal gatal'],
  riwayat: ['riwayat', 'pernah', 'dulu', 'sebelumnya', 'dahulu', 'masa lalu'],
  keluarga: ['keluarga', 'turunan', 'keturunan', 'saudara', 'kerabat', 'ortu'],
  rokok: ['rokok', 'merokok', 'ngerokok', 'perokok', 'vape', 'tembakau'],
  alkohol: ['alkohol', 'miras', 'minuman keras', 'bir'],
  kerja: ['kerja', 'pekerjaan', 'bekerja', 'profesi', 'kantor', 'berkerja'],
  tinggal: ['tinggal', 'domisili', 'alamat', 'bermukim'],
  pergi: ['pergi', 'bepergian', 'perjalanan', 'berpergian', 'traveling', 'mudik', 'dinas', 'dari luar kota'],
  periksa: ['periksa', 'pemeriksaan', 'diperiksa', 'memeriksa', 'cek'],
  nafsu: ['nafsu', 'selera'],
  turun: ['turun', 'menurun', 'susut', 'kurus', 'berkurang'],
  muntah: ['muntah', 'muntahkan', 'memuntahkan'],
  kencing: ['kencing', 'bak', 'pipis', 'berkemih', 'urin', 'air seni'],
  bab: ['bab', 'tinja', 'feses', 'kotoran'],
  pusing: ['pusing', 'vertigo', 'berkunang', 'melayang'],
  lemas: ['lemas', 'lemah', 'letih', 'lelah', 'capek', 'loyo', 'lesu'],
  dahak: ['dahak', 'lendir', 'riak', 'sputum'],
  darah: ['darah', 'berdarah', 'perdarahan', 'mimisan', 'gusi berdarah'],
  haus: ['haus', 'dahaga', 'polidipsi'],
  keluhan: ['keluhan', 'gejala', 'masalah', 'penyebab'],
  rasa: ['rasa', 'rasakan', 'merasa', 'dirasakan', 'dirasa', 'terasa'],
  cerita: ['cerita', 'ceritakan', 'menceritakan', 'jelaskan', 'terangkan', 'tuturkan', 'uraikan'],
  ada: ['ada', 'punya', 'memiliki', 'mengalami', 'dialami', 'alami'],
  tidur: ['tidur', 'tidurnya', 'insomnia', 'begadang'],
  makan: ['makan', 'makanan', 'diet', 'pola makan', 'asupan'],
  olahraga: ['olahraga', 'berolahraga', 'aktivitas', 'gerak', 'senam'],
  rumah: ['rumah', 'serumah'],
  menular: ['menular', 'tertular', 'penularan', 'kontak'],
  rutin: ['rutin', 'teratur', 'tiap hari', 'setiap hari', 'harian'],
  berhenti: ['berhenti', 'putus', 'stop', 'lupa', 'terlewat', 'lewat'],
  takut: ['takut', 'khawatir', 'cemas', 'kuatir', 'was was'],
  nyamuk: ['nyamuk', 'gigitan'],
  tekanan: ['tekanan', 'tensi'],
  tinggi: ['tinggi', 'naik', 'meningkat'],
  berat: ['berat', 'parah', 'hebat', 'kuat'],
  jantung: ['jantung', 'berdebar', 'jantungan', 'debar'],
  dada: ['dada', 'ulu hati', 'dadanya'],
  kaki: ['kaki', 'telapak', 'kesemutan', 'baal', 'kebas'],
  luka: ['luka', 'borok', 'lecet', 'koreng'],
  mata: ['mata', 'penglihatan', 'pandangan', 'kabur'],
  berhubungan: ['berhubungan', 'hubungan', 'seksual', 'seks'],
}

const PREFIXES = ['meng', 'meny', 'peng', 'peny', 'mem', 'men', 'pem', 'pen', 'ber', 'ter', 'per', 'me', 'pe', 'di']
const SUFFIXES = ['kan', 'nya', 'lah', 'kah', 'pun', 'an', 'ku', 'mu', 'i']

export function stripDiacritics(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Lowercase, no punctuation, colloquial expansions. Stop words are kept. */
export function normalizeText(text: string) {
  let s = stripDiacritics(text.toLowerCase())
  s = s.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  for (const [re, to] of PHRASES) s = s.replace(re, to)
  return s
}

export function stem(word: string) {
  if (word.length <= 4) return word
  let w = word
  for (const p of PREFIXES) {
    if (w.startsWith(p) && w.length - p.length >= 4) {
      w = w.slice(p.length)
      break
    }
  }
  for (const s of SUFFIXES) {
    if (w.endsWith(s) && w.length - s.length >= 4) {
      w = w.slice(0, -s.length)
      break
    }
  }
  return w
}

const synonymMap = new Map<string, string>()
for (const [canon, variants] of Object.entries(SYNONYM_GROUPS)) {
  const canonStem = stem(canon)
  synonymMap.set(canonStem, canonStem)
  for (const v of variants) {
    // multi-word variants are handled as phrases below
    if (!v.includes(' ')) synonymMap.set(stem(v), canonStem)
  }
}

export function canonical(word: string) {
  const st = stem(word)
  return synonymMap.get(st) ?? st
}

/** Content tokens: stemmed, synonym-canonical, stop words removed, unique, order preserved. */
export function contentTokens(text: string) {
  const out: string[] = []
  for (const raw of normalizeText(text).split(' ')) {
    if (!raw || STOPWORDS.has(raw)) continue
    const c = canonical(raw)
    if (c && !out.includes(c)) out.push(c)
  }
  return out
}

export function levenshtein(a: string, b: string) {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > 1) return 2
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

/** True when token matches `target` exactly or within one edit for tokens of 6+ characters. */
export function tokenMatches(token: string, target: string) {
  if (token === target) return true
  return target.length >= 6 && token.length >= 6 && levenshtein(token, target) <= 1
}

/** Stable small hash for deterministic choices (fallback rotation, jitter). */
export function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
