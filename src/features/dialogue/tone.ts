import type { Intent, Tone } from '@/features/cases/types'
import { normalizeText } from './normalize'

// Small rule list: each intent is a set of phrases (substring of the normalized text) or a regex.
const PERSON = '(bapak|ibu|anda|pak|bu|saudara|mas|mbak|kakak)'

type Rule = (string | RegExp)[]

export const INTENT_RULES: Record<Intent, Rule> = {
  greet: [
    'selamat pagi',
    'selamat siang',
    'selamat sore',
    'selamat malam',
    'selamat datang',
    'halo',
    'hai',
    'assalamualaikum',
    'permisi',
    'apa kabar',
  ],
  intro: [
    'perkenalkan',
    'nama saya',
    'saya dokter',
    'saya koas',
    'saya mahasiswa',
    'saya yang bertugas',
    'saya yang akan',
    'saya dokter muda',
  ],
  consent: [
    'izin',
    'seizin',
    'boleh saya',
    'bolehkah saya',
    'apakah boleh',
    'izinkan',
    'boleh ya',
    'saya periksa dulu ya',
    'bersedia',
  ],
  agenda: [
    'saya akan menanyakan',
    'saya mau menanyakan',
    'beberapa pertanyaan',
    'kita mulai dari',
    'hari ini kita akan',
    'saya akan bertanya',
    'saya ingin bertanya',
    'yang ingin disampaikan',
  ],
  'ice-ideas': [
    new RegExp(`menurut ${PERSON}`),
    new RegExp(`apa yang ${PERSON} pikirkan`),
    new RegExp(`${PERSON} (kira|pikir|duga)`),
    'dugaan',
    'penyebabnya menurut',
  ],
  'ice-concerns': [
    new RegExp(`(apa|adakah|ada).*(khawatir|takut|cemas|kekhawatiran|dikhawatirkan|ditakutkan)`),
    'yang membuat khawatir',
    'yang mengganggu pikiran',
  ],
  'ice-expectations': [
    'harapan',
    'berharap',
    'yang diharapkan',
    'apa yang diinginkan',
    'ingin kami lakukan',
    'bisa saya bantu apa',
    'apa yang bisa kami bantu',
  ],
  empathy: [
    'pasti tidak nyaman',
    'pasti berat',
    'pasti sakit',
    'pasti sulit',
    'pasti melelahkan',
    'pasti menakutkan',
    'pasti khawatir',
    'saya mengerti',
    'saya paham',
    'saya turut',
    'turut prihatin',
    'maaf mendengar',
    'tidak enak',
    'saya bisa membayangkan',
    'terima kasih sudah',
    'saya ikut',
    'pasti cemas',
    'wajar jika',
    'wajar kalau',
  ],
  reassure: [
    'jangan khawatir',
    'jangan takut',
    'tidak perlu cemas',
    'tidak perlu khawatir',
    'tenang',
    'kami akan bantu',
    'akan kami bantu',
    'kita akan tangani',
    'kami tangani',
    'kami di sini',
    'kita cari tahu bersama',
    'tidak apa apa',
    'semua akan baik',
    'kami akan menolong',
    'kami usahakan',
  ],
  summary: [
    'saya rangkum',
    'ringkasnya',
    'saya simpulkan',
    'saya ulangi',
    'kalau saya tidak salah',
    'jadi sejak',
    'jadi keluhan',
    /\bjadi .*(bapak|ibu|anda)/,
    /\bberarti .*(sejak|bapak|ibu|anda)/,
  ],
  'safety-net': [
    'segera kembali',
    'segera ke igd',
    'segera datang',
    'segera ke rumah sakit',
    'kembali jika',
    'kembali bila',
    'kembali lagi jika',
    'bila memburuk',
    'jika memburuk',
    'jika bertambah',
    'bila bertambah',
    'tanda bahaya',
    'jika muncul',
    'apabila muncul',
    'hubungi kami',
    'kontrol',
    'datang lagi',
  ],
  'plain-language': ['artinya', 'maksudnya', 'dengan kata lain', 'sederhananya', 'singkatnya', 'istilahnya'],
}

const RUDE: Rule = [
  'salah sendiri',
  'makanya',
  'sudah dibilang',
  'kenapa baru',
  'mengapa baru',
  'dari dulu',
  'jangan bohong',
  'bohong',
  'bandel',
  'keras kepala',
  'bodoh',
  'dasar',
  'lebay',
  'alasan saja',
  'banyak alasan',
  'mana mungkin',
  'masa sih',
  'ah masa',
  'sok tahu',
  'cerewet',
  'berisik',
  'jangan mengeluh',
  'mengeluh terus',
  'pemalas',
  'malas',
  'tidak becus',
  'tidak penting',
  'jangan banyak tanya',
  'sama saja',
  'merepotkan',
  'menyusahkan',
]

const DISMISSIVE: Rule = [
  /^(hmm+|hm+|oh+|ok|oke|okay|ya|yah|terserah|lalu|terus|cepat|cepetan|singkat saja|langsung saja|ah)$/,
  'cepat ceritanya',
  'singkat saja',
  'langsung saja',
  'terserah',
  'tidak usah dijelaskan',
  'lama sekali',
  'cepat jawab',
  'jawab saja',
  'cepat saja',
  'buruan',
  'bertele tele',
  'tidak punya waktu',
  'saya sibuk',
]

function hits(norm: string, rules: Rule) {
  const padded = ` ${norm} `
  return rules.some((r) => (typeof r === 'string' ? padded.includes(` ${r} `) : r.test(norm)))
}

export function detectIntents(text: string): Intent[] {
  const norm = normalizeText(text)
  const found: Intent[] = []
  for (const [intent, rules] of Object.entries(INTENT_RULES) as [Intent, Rule][]) {
    if (hits(norm, rules)) found.push(intent)
  }
  // "jangan khawatir" is reassurance, not an ICE concerns question
  if (found.includes('reassure') && /\bjangan\b/.test(norm)) {
    return found.filter((i) => i !== 'ice-concerns')
  }
  return found
}

export function isRude(text: string) {
  return hits(normalizeText(text), RUDE)
}

export function isDismissive(text: string) {
  return hits(normalizeText(text), DISMISSIVE)
}

const OPEN_WORDS = /\b(apa|bagaimana|kapan|berapa|mengapa|siapa|dimana|di mana|seperti|ceritakan|jelaskan)\b/
const CLOSED_START = /^(apakah|adakah|pernah|sudah|ada|punya|masih|betul|benar|sering|biasa)\b/

/** A yes/no question ("apakah ada ..."). Open questions use wh-words or "ceritakan". */
export function isClosedQuestion(text: string) {
  const norm = normalizeText(text)
  if (OPEN_WORDS.test(norm)) return false
  return CLOSED_START.test(norm) || /\bapakah\b/.test(norm)
}

export interface ToneContext {
  /** Student acted before the patient finished speaking. */
  interrupted?: boolean
  /** Same question already answered. */
  repeated?: boolean
}

export interface ToneResult {
  tone: Tone
  intents: Intent[]
}

/** Classify the tone of a typed message or clicked question. Priority: rude, interrupt, ignore, kind, neutral. */
export function classifyTone(text: string, ctx: ToneContext = {}): ToneResult {
  const intents = detectIntents(text)
  if (isRude(text)) return { tone: 'menghakimi', intents }
  if (ctx.interrupted) return { tone: 'menyela', intents }
  if (ctx.repeated || isDismissive(text)) return { tone: 'mengabaikan', intents }
  if (intents.length > 0) return { tone: 'empatik', intents }
  return { tone: 'netral', intents }
}
