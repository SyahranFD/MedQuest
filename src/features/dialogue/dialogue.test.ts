import { describe, expect, it } from 'vitest'
import { ALL_CASES } from '@/features/cases/data'
import { acsCase } from '@/features/cases/data/acs'
import { dengueCase } from '@/features/cases/data/dengue'
import { hypertensionCase } from '@/features/cases/data/hypertension'
import { tbCase } from '@/features/cases/data/tb'
import { buildQuestionCatalogue } from './catalogue'
import { matchReply } from './match'
import { contentTokens, normalizeText, tokenMatches } from './normalize'
import { classifyTone, detectIntents, isClosedQuestion } from './tone'

const calm = { trust: 70 }

describe('normalization', () => {
  it('lowercases, strips punctuation and expands colloquial words', () => {
    expect(normalizeText('Gimana, Dok?! Udah GAK sakit...')).toBe('bagaimana dok sudah tidak sakit')
  })

  it('unifies synonyms and phrases', () => {
    expect(contentTokens('Rasanya nyeri')).toContain(contentTokens('sakit')[0])
    expect(contentTokens('panas')).toEqual(contentTokens('demam'))
    expect(contentTokens('darah tinggi')).toEqual(contentTokens('hipertensi'))
  })
})

describe('every authored question matches its own entry', () => {
  for (const c of ALL_CASES) {
    it(`${c.id}: clickable questions resolve to themselves`, () => {
      for (const d of c.dialogue) {
        const r = matchReply(c, d.question, { trust: 100 })
        expect(r.entry?.id, `${d.id}: "${d.question}" matched ${r.entry?.id}`).toBe(d.id)
      }
    })

    it(`${c.id}: every pattern is answerable`, () => {
      for (const d of c.dialogue) {
        for (const p of d.patterns) {
          const r = matchReply(c, p, { trust: 100 })
          expect(r.kind === 'answer' || r.kind === 'withheld', `${d.id} pattern "${p}"`).toBe(true)
        }
      }
    })
  }
})

describe('matchReply on colloquial Indonesian', () => {
  it('handles "sejak kapan" variants', () => {
    for (const t of ['sejak kapan dok nyerinya', 'kapan mulai sakit dadanya', 'Nyeri dada mulai kapan ya pak?', 'udah berapa lama pak']) {
      expect(matchReply(acsCase, t, calm).entry?.id, t).toBe('onset')
    }
  })

  it('handles allergy and medication phrasing', () => {
    expect(matchReply(acsCase, 'ada alergi obat gak pak?', calm).entry?.id).toBe('alergi-obat')
    expect(matchReply(acsCase, 'minum obat apa aja pak', calm).entry?.id).toBe('obat-rutin')
    expect(matchReply(dengueCase, 'Ibu sudah makan obat apa sebelum ke sini?', calm).entry?.id).toBe('obat-demam')
    expect(matchReply(hypertensionCase, 'ada riwayat darah tinggi di keluarga?', calm).entry?.id).toBe('keluarga')
  })

  it('tolerates small typos', () => {
    expect(tokenMatches('kepatuhann', 'kepatuhan')).toBe(true)
    expect(tokenMatches('sepak', 'sesak')).toBe(false)
    expect(matchReply(hypertensionCase, 'apakah obat tensinya diminum teratur', calm).entry?.id).toBe('kepatuhan')
  })

  it('falls back with a clarification that costs patience', () => {
    const r = matchReply(tbCase, 'bagaimana pendapat anda tentang sepak bola', calm)
    expect(r.kind).toBe('unclear')
    expect(tbCase.fallbacks.unclear).toContain(r.reply)
    expect(r.action.outcome).toBe('unclear')
  })

  it('rotates unclear replies with the variant index', () => {
    const a = matchReply(tbCase, 'qwerty zxcv', calm, { variantIndex: 0 }).reply
    const b = matchReply(tbCase, 'qwerty zxcv', calm, { variantIndex: 1 }).reply
    expect(a).not.toBe(b)
  })

  it('answers social intents without a clinical match', () => {
    expect(matchReply(tbCase, 'Selamat pagi pak, perkenalkan saya dokter muda', calm).kind).toBe('social')
    expect(matchReply(tbCase, 'saya mengerti ini pasti berat bagi bapak', calm).reply).toBe(tbCase.fallbacks.empathyReply)
    expect(matchReply(tbCase, 'jangan khawatir, kami akan bantu', calm).reply).toBe(tbCase.fallbacks.reassureReply)
  })
})

describe('trust gate', () => {
  const gated = acsCase.dialogue.find((d) => d.id === 'obat-kuat')!

  it('withholds the sensitive answer below the threshold and reveals it above', () => {
    const low = matchReply(acsCase, gated.question, { trust: 40 })
    expect(low.withheld).toBe(true)
    expect(low.reply).toBe(gated.gatedAnswer)
    const high = matchReply(acsCase, gated.question, { trust: 80 })
    expect(high.withheld).toBe(false)
    expect(high.reply).toContain('Viagra')
  })

  it('marks a repeated question and prefixes the reply', () => {
    const r = matchReply(tbCase, 'sejak kapan batuknya', calm, { askedIds: ['onset'] })
    expect(r.repeated).toBe(true)
    expect(r.tone).toBe('mengabaikan')
    expect(r.reply.startsWith(tbCase.fallbacks.repeatPrefix)).toBe(true)
  })
})

describe('tone and intents', () => {
  it('classifies the five tones', () => {
    expect(classifyTone('Saya mengerti, ini pasti tidak nyaman').tone).toBe('empatik')
    expect(classifyTone('sejak kapan batuknya').tone).toBe('netral')
    expect(classifyTone('sejak kapan batuknya', { interrupted: true }).tone).toBe('menyela')
    expect(classifyTone('Makanya jangan bandel, salah sendiri').tone).toBe('menghakimi')
    expect(classifyTone('hmm').tone).toBe('mengabaikan')
    expect(classifyTone('Cepat jawab saja, saya tidak punya waktu').tone).toBe('mengabaikan')
    expect(classifyTone('Anda ini merepotkan').tone).toBe('menghakimi')
    expect(classifyTone('sejak kapan', { repeated: true }).tone).toBe('mengabaikan')
  })

  it('detects intents', () => {
    expect(detectIntents('Selamat siang, perkenalkan nama saya Ani')).toEqual(expect.arrayContaining(['greet', 'intro']))
    expect(detectIntents('izin ya pak, saya periksa dulu')).toContain('consent')
    expect(detectIntents('Apa yang paling bapak khawatirkan?')).toContain('ice-concerns')
    expect(detectIntents('jangan khawatir pak')).not.toContain('ice-concerns')
    expect(detectIntents('segera kembali jika sesak bertambah')).toContain('safety-net')
    expect(detectIntents('jadi sejak tiga hari ya pak')).toContain('summary')
  })

  it('detects closed versus open questions', () => {
    expect(isClosedQuestion('Apakah ada alergi obat?')).toBe(true)
    expect(isClosedQuestion('Sejak kapan nyerinya?')).toBe(false)
    expect(isClosedQuestion('Ceritakan keluhan Bapak')).toBe(false)
  })
})

describe('question catalogue', () => {
  it('derives clickable questions per category from the case', () => {
    const cat = buildQuestionCatalogue(acsCase)
    expect(cat.map((g) => g.category)).toEqual(['rps', 'rpd', 'keluarga', 'alergi', 'obat', 'sosial'])
    const all = cat.flatMap((g) => g.questions)
    expect(all).toHaveLength(acsCase.dialogue.length)
    expect(all.find((q) => q.id === 'obat-kuat')?.gated).toBe(true)
    expect(all.find((q) => q.id === 'trauma')?.relevant).toBe(false)
  })
})
