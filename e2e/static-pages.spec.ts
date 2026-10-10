import { expect, test } from '@playwright/test'
import { seed, watch } from './helpers'

test.describe('landing and static pages', () => {
  test('landing loads and the CTA reaches /app', async ({ page }) => {
    await seed(page)
    const w = watch(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main')).toHaveCount(1)
    await page.getByRole('link', { name: 'Coba demo' }).first().click()
    await expect(page).toHaveURL(/\/app\/?$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    w.expectClean()
  })

  test('onboarding appears on first visit and can be dismissed', async ({ page }) => {
    await seed(page, { onboarded: false })
    await page.goto('/app')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Lewati' }).click()
    await expect(dialog).toBeHidden()
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('onboarding steps through to start', async ({ page }) => {
    await seed(page, { onboarded: false })
    await page.goto('/app')
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Lanjut' }).click()
    await dialog.getByRole('button', { name: 'Lanjut' }).click()
    await dialog.getByRole('button', { name: 'Mulai berlatih' }).click()
    await expect(dialog).toBeHidden()
  })

  test('language toggle switches the interface to English and back', async ({ page }) => {
    await seed(page)
    await page.goto('/app')
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    await page.getByRole('button', { name: 'Pengaturan' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('radio', { name: 'English' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(dialog.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await dialog.getByRole('radio', { name: 'Indonesia' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  })

  test('reduced-motion setting is stored and applied', async ({ page }) => {
    await seed(page)
    await page.goto('/app')
    await page.getByRole('button', { name: 'Pengaturan' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('radio', { name: 'Kurangi' }).click()
    await expect(dialog.getByRole('radio', { name: 'Kurangi' })).toBeChecked()
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mq-ui') ?? '{}').state.reducedMotion)
    expect(stored).toBe('reduce')
  })

  test('unknown route shows the 404 page', async ({ page }) => {
    await seed(page)
    await page.goto('/tidak-ada')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('main').getByRole('link').click()
    await expect(page).toHaveURL(/\/$/)
  })

  for (const path of ['/syarat', '/privasi']) {
    test(`${path} renders one h1 and one main`, async ({ page }) => {
      await seed(page)
      const w = watch(page)
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.locator('main')).toHaveCount(1)
      w.expectClean()
    })
  }
})
