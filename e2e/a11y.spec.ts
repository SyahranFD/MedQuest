import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { closeTablet, openTablet, seed, startEr, startPoli } from './helpers'

const ROUTES = ['/', '/app', '/app/kasus', '/app/riwayat', '/dosen', '/dosen/mahasiswa', '/dosen/mahasiswa/s01', '/dosen/perpustakaan', '/syarat', '/privasi', '/tidak-ada']

async function expectNoViolations(page: Page, label: string) {
  await page.waitForLoadState('networkidle')
  const { violations } = await new AxeBuilder({ page }).analyze()
  const summary = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
  expect(summary, `axe on ${label}`).toEqual([])
}

for (const locale of ['id', 'en'] as const) {
  test.describe(`axe routes (${locale})`, () => {
    for (const route of ROUTES) {
      test(`${route}`, async ({ page }) => {
        await seed(page, { locale, reducedMotion: 'reduce' })
        await page.goto(route)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.locator('main')).toHaveCount(1)
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        await expectNoViolations(page, route)
      })
    }
  })
}

test.describe('axe states', () => {
  test('onboarding and settings dialogs', async ({ page }) => {
    await seed(page, { onboarded: false, reducedMotion: 'reduce' })
    await page.goto('/app')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoViolations(page, 'onboarding dialog')
    await page.getByRole('dialog').getByRole('button', { name: 'Lewati' }).click()
    const trigger = page.getByRole('button', { name: 'Pengaturan' })
    await trigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoViolations(page, 'settings dialog')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('poli session: every tab, end dialog, debrief', async ({ page }) => {
    await seed(page, { reducedMotion: 'reduce' })
    await startPoli(page)
    await expectNoViolations(page, 'session closed')
    await openTablet(page)
    await expectNoViolations(page, 'session anamnesis')
    for (const tab of ['Periksa', 'Lab', 'Diagnosis', 'Terapi']) {
      await page.getByRole('tab', { name: tab }).click()
      await expectNoViolations(page, `session ${tab}`)
    }
    await closeTablet(page)
    const end = page.getByTestId('end-session')
    await end.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoViolations(page, 'end dialog')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(end).toBeFocused()
    await end.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Akhiri dan nilai' }).click()
    await page.getByRole('button', { name: 'Lewati' }).click({ timeout: 5_000 }).catch(() => undefined)
    await expect(page.getByTestId('debrief')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expectNoViolations(page, 'debrief')
  })

  test('ER session and bed overview', async ({ page }) => {
    await seed(page, { reducedMotion: 'reduce' })
    await startEr(page)
    await expectNoViolations(page, 'er session')
  })

  test('mobile session sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, { reducedMotion: 'reduce' })
    await startPoli(page)
    await expectNoViolations(page, 'mobile session')
  })
})
