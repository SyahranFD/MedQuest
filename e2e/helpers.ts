import { expect, type Page } from '@playwright/test'

/** Seed UI preferences before the app boots. Onboarding stays pending unless `onboarded` is true. */
export async function seed(page: Page, opts: { locale?: 'id' | 'en'; onboarded?: boolean; reducedMotion?: 'system' | 'reduce' | 'full' } = {}) {
  const { locale = 'id', onboarded = true, reducedMotion = 'system' } = opts
  await page.addInitScript(
    ([l, o, r]) => {
      if (sessionStorage.getItem('e2e-seeded')) return
      sessionStorage.setItem('e2e-seeded', '1')
      localStorage.setItem('mq-ui', JSON.stringify({ state: { locale: l, quality: 'lite', reducedMotion: r }, version: 0 }))
      if (o) localStorage.setItem('mq-onboarded', '1')
    },
    [locale, onboarded, reducedMotion] as const,
  )
}

/** Fail the test on console errors and on any request that leaves localhost. */
export function watch(page: Page) {
  const errors: string[] = []
  const external: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  void page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (['localhost', '127.0.0.1'].includes(url.hostname) || url.protocol === 'data:' || url.protocol === 'blob:') return route.continue()
    external.push(url.href)
    return route.abort()
  })
  return {
    expectClean() {
      expect(external, 'outbound requests').toEqual([])
      expect(errors, 'console errors').toEqual([])
    },
  }
}

export async function startPoli(page: Page) {
  await page.goto('/app/kasus')
  await page.getByRole('link', { name: /Batuk lebih dari tiga minggu/ }).click()
  await page.getByRole('button', { name: 'Mulai konsultasi' }).click()
  await expect(page).toHaveURL(/\/app\/sesi\//)
  await expect(page.getByTestId('anamnesis-panel')).toBeVisible()
}

export async function startEr(page: Page) {
  await page.goto('/app/kasus')
  await page.getByRole('link', { name: /Nyeri dada dengan elevasi ST/ }).click()
  await page.getByRole('button', { name: 'Mulai shift IGD' }).click()
  await expect(page).toHaveURL(/\/app\/sesi\//)
  await expect(page.getByTestId('bed-strip')).toBeVisible()
}
