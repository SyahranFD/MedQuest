import { expect, test } from '@playwright/test'
import { seed, watch } from './helpers'

test('lecturer dashboard to student detail', async ({ page }) => {
  await seed(page)
  const w = watch(page)
  await page.goto('/dosen')
  await expect(page.getByRole('heading', { level: 1, name: 'Dasbor kelas' })).toBeVisible()
  await expect(page.locator('main')).toHaveCount(1)
  await page.getByRole('link', { name: 'Mahasiswa' }).first().click()
  await expect(page).toHaveURL(/\/dosen\/mahasiswa\/?$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Mahasiswa' })).toBeVisible()
  await page.getByRole('searchbox').fill('Aulia')
  const row = page.getByRole('link', { name: /Aulia Rahmawati/ })
  await expect(row).toHaveCount(1)
  await row.click()
  await expect(page).toHaveURL(/\/dosen\/mahasiswa\/s01$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Aulia Rahmawati' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Beri tugas kasus' })).toBeVisible()
  w.expectClean()
})

test('lecturer case library lists guideline sources', async ({ page }) => {
  await seed(page)
  await page.goto('/dosen/perpustakaan')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tugaskan ke kelas' })).toHaveCount(6)
})

test('student history shows seeded demo sessions', async ({ page }) => {
  await seed(page)
  await page.goto('/app/riwayat')
  await expect(page.getByRole('heading', { level: 1, name: 'Riwayat' })).toBeVisible()
})
