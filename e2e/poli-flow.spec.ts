import { expect, test } from '@playwright/test'
import { seed, watch } from './helpers'

test('poli case full flow to debrief', async ({ page }) => {
  await seed(page)
  const w = watch(page)

  // library to brief
  await page.goto('/app/kasus')
  await page.getByRole('button', { name: 'Poliklinik', exact: true }).click()
  await page.getByRole('link', { name: /Batuk lebih dari tiga minggu/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('Keluhan utama').first()).toBeVisible()
  await page.getByRole('button', { name: 'Mulai konsultasi' }).click()
  await expect(page).toHaveURL(/\/app\/sesi\//)

  // anamnesis: three questions
  const panel = page.getByTestId('anamnesis-panel')
  await expect(panel).toBeVisible()
  const questions = panel.locator('section ul button:not([disabled])')
  for (let i = 0; i < 3; i++) await questions.first().click()
  await expect(page.getByTestId('question-counter')).toContainText(/^3 dari/)

  // an empathic message raises trust (wait until the patient stops talking, interrupting costs trust)
  await expect(page.locator('[data-talking="true"]')).toHaveCount(0)
  const meter = page.getByRole('meter', { name: 'Kepercayaan pasien' }).first()
  const before = Number(await meter.getAttribute('aria-valuenow'))
  await page.getByRole('textbox', { name: 'Ketik ucapan untuk pasien' }).fill('Saya mengerti ini pasti tidak nyaman bagi Anda. Silakan ceritakan dengan tenang.')
  await page.getByRole('button', { name: 'Kirim' }).click()
  await expect.poll(async () => Number(await meter.getAttribute('aria-valuenow'))).toBeGreaterThan(before)
  await expect(page.getByTestId('trust-reason').first()).toContainText(/empatik|kepercayaan/i)

  // examination
  await page.getByRole('tab', { name: 'Periksa' }).click()
  const exam = page.getByRole('tabpanel').locator('section ul button').first()
  await exam.click()
  await expect(exam).toHaveAttribute('aria-expanded', 'true')

  // order a test
  await page.getByRole('tab', { name: 'Lab' }).click()
  const order = page.getByRole('tabpanel').locator('section ul button:not([disabled])').first()
  await order.click()
  await expect(page.getByRole('tabpanel').getByText('Dipesan').first()).toBeVisible()

  // diagnosis
  await page.getByRole('tab', { name: 'Diagnosis' }).click()
  await expect(page.getByText('Alat latihan, bukan alat keputusan klinis').first()).toBeVisible()
  await page.getByRole('radio').first().click()
  await page.getByRole('button', { name: 'Tetapkan diagnosis' }).click()
  await expect(page.getByText('Terapi kini terbuka')).toBeVisible()

  // treatment and disposition
  await page.getByRole('tab', { name: 'Terapi' }).click()
  await page.getByRole('tabpanel').locator('section ul button').first().click()
  await page.getByRole('button', { name: 'Resepkan' }).click()
  await page.getByRole('radio').first().click()
  await page.getByRole('button', { name: 'Tetapkan disposisi' }).click()
  await expect(page.getByText(/sudah selesai ditangani/).first()).toBeVisible()

  // end dialog and debrief
  await page.getByTestId('end-session').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Akhiri sesi?' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Akhiri dan nilai' }).click()
  const skip = page.getByRole('button', { name: 'Lewati' })
  await skip.click({ timeout: 5_000 }).catch(() => undefined)
  await expect(page).toHaveURL(/\/app\/debrief\//)
  await expect(page.getByTestId('debrief')).toBeVisible()
  await expect(page.getByTestId('debrief-percent')).toBeVisible()
  await expect(page.getByTestId('debrief-band')).toBeVisible()
  await expect(page.getByTestId('cite-chip').first()).toBeVisible()
  await expect(page.getByTestId('timeline')).toBeVisible()
  w.expectClean()
})
