import { expect, test } from '@playwright/test'
import { seed, startPoli, watch } from './helpers'

const ROUTES = ['/', '/app', '/app/kasus', '/app/riwayat', '/dosen', '/dosen/mahasiswa', '/dosen/mahasiswa/s01', '/dosen/perpustakaan', '/syarat', '/privasi']

test.describe('reflow', () => {
  // 320 and 390 are phones; 720 is a 1440px window at 200% zoom
  for (const width of [320, 390, 720]) {
    test(`no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await seed(page, { reducedMotion: 'reduce' })
      for (const route of ROUTES) {
        await page.goto(route)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, `${route} at ${width}`).toBeLessThanOrEqual(1)
      }
    })
  }

  test('session has no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await seed(page, { reducedMotion: 'reduce' })
    await startPoli(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})

test('touch targets are at least 44px on coarse pointers', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await context.newPage()
  await seed(page, { reducedMotion: 'reduce' })
  for (const route of ['/', '/app', '/app/kasus', '/dosen', '/dosen/mahasiswa']) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const small = await page.evaluate(() => {
      const out: string[] = []
      for (const el of document.querySelectorAll<HTMLElement>('a[href],button,[role=tab],[role=radio],input,select')) {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        if (r.width === 0 || cs.visibility === 'hidden' || el.closest('[aria-hidden=true]') || el.matches('a[href="#main"]')) continue
        if (el.tagName === 'A' && cs.display === 'inline') continue
        if (r.height < 43.5 || r.width < 43.5) out.push(`${el.tagName}:${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 20)} ${Math.round(r.width)}x${Math.round(r.height)}`)
      }
      return out
    })
    expect(small, route).toEqual([])
  }
  await context.close()
})

test.describe('keyboard', () => {
  test('skip link is first, reveals on focus and moves to main', async ({ page }) => {
    await seed(page)
    await page.goto('/app/kasus')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Lewati ke konten' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main$/)
  })

  test('every early tab stop shows a visible focus indicator', async ({ page }) => {
    await seed(page)
    await page.goto('/app/kasus')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      const visible = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        const cs = getComputedStyle(el)
        return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== 'none'
      })
      expect(visible, `tab stop ${i + 1}`).toBe(true)
    }
  })

  test('session is operable from the keyboard: hotkeys, slash, tab arrows, dialog focus return', async ({ page }) => {
    await seed(page)
    await startPoli(page)
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('1')
    await expect(page.getByTestId('question-counter')).toContainText(/^1 dari/)
    await page.keyboard.press('/')
    await expect(page.getByRole('textbox', { name: 'Ketik ucapan untuk pasien' })).toBeFocused()
    await page.keyboard.press('Escape')
    const tab = page.getByRole('tab', { name: 'Anamnesis' })
    await tab.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: 'Periksa' })).toHaveAttribute('aria-selected', 'true')
    const end = page.getByTestId('end-session')
    await end.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(end).toBeFocused()
  })
})

test.describe('live regions', () => {
  test('trust changes and toasts are polite, nothing is assertive', async ({ page }) => {
    await seed(page)
    await startPoli(page)
    await expect(page.getByTestId('trust-reason').first()).toHaveAttribute('aria-live', 'polite')
    await expect(page.locator('[aria-live="assertive"], [role="alert"]')).toHaveCount(0)
    await expect(page.locator('section[aria-label^="Notifikasi sesi"]')).toHaveCount(1)
  })
})

test.describe('user preferences', () => {
  test('prefers-reduced-motion shows final numbers without counting', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await seed(page)
    await page.goto('/dosen')
    const kpi = page.locator('[data-slot="count-up"]').first()
    await expect(kpi).toBeVisible()
    const first = await kpi.textContent()
    await page.waitForTimeout(100)
    expect(await kpi.textContent()).toBe(first)
  })

  test('prefers-contrast: more makes chrome opaque with defined borders', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' })
    await seed(page)
    await page.goto('/app')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const style = await page.evaluate(() => {
      const header = document.querySelector('.mq-translucent') as HTMLElement
      return { backdrop: getComputedStyle(header).backdropFilter, line: getComputedStyle(document.documentElement).getPropertyValue('--mq-line').trim() }
    })
    expect(style.backdrop).toBe('none')
    expect(style.line).toBe('#6f8178')
  })

  test('the in-app reduced motion setting stops infinite idle loops on the landing page', async ({ page }) => {
    await seed(page, { reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity).length)
    expect(running).toBe(0)
  })
})

test('the demo works offline: non-local requests are blocked and nothing fails', async ({ page }) => {
  await seed(page)
  const w = watch(page)
  const failed: string[] = []
  page.on('requestfailed', (r) => failed.push(r.url()))
  for (const route of ['/', '/app', '/app/kasus', '/app/riwayat', '/dosen', '/dosen/mahasiswa/s01', '/dosen/perpustakaan', '/syarat']) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  expect(failed).toEqual([])
  w.expectClean()
})
