import { expect, test } from '@playwright/test'
import { seed, watch } from './helpers'

test('ER shift basics: beds, select, order, clock speed, end', async ({ page }) => {
  await seed(page)
  const w = watch(page)

  await page.goto('/app/kasus')
  await page.getByRole('button', { name: 'ER', exact: true }).click()
  await page.getByRole('link', { name: /Nyeri dada dengan elevasi ST/ }).click()
  await expect(page.getByText('Cara kerja shift IGD')).toBeVisible()
  await page.getByRole('button', { name: 'Mulai shift IGD' }).click()
  await expect(page).toHaveURL(/\/app\/sesi\//)

  // three patients in total: arrived beds plus the ones still on their way
  const strip = page.getByTestId('bed-strip')
  await expect(strip).toBeVisible()
  const arrived = await strip.getByRole('button').count()
  const incomingText = await strip.getByText(/pasien akan tiba/).textContent().catch(() => null)
  const incoming = incomingText ? Number(/\d+/.exec(incomingText)?.[0]) : 0
  expect(arrived + incoming).toBe(3)

  // select a patient
  const bed = strip.getByRole('button').first()
  await bed.click()
  await expect(bed).toHaveAttribute('aria-pressed', 'true')

  // place in a bed and triage
  await page.getByRole('button', { name: 'Bed 1', exact: true }).click()
  await page.getByRole('group', { name: 'Zona triase' }).getByRole('button', { name: 'Merah' }).click()
  await expect(bed).toContainText('Bed 1')

  // order a test
  await page.getByRole('tab', { name: 'Lab' }).click()
  const order = page.getByRole('tabpanel').locator('section ul button:not([disabled])').first()
  await order.click()
  await expect(page.getByRole('tabpanel').getByText('Dipesan').first()).toBeVisible()

  // clock speed
  const speed = page.getByRole('group', { name: 'Kecepatan jam' })
  await speed.getByRole('button', { name: '4x' }).click()
  await expect(speed.getByRole('button', { name: '4x' })).toHaveAttribute('aria-pressed', 'true')
  await expect(speed.getByRole('button', { name: '1x' })).toHaveAttribute('aria-pressed', 'false')

  // end the shift
  await page.getByTestId('end-session').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Akhiri sesi?' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Kembali ke sesi' }).click()
  await expect(dialog).toBeHidden()
  await page.getByTestId('end-session').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Akhiri dan nilai' }).click()
  await page.getByRole('button', { name: 'Lewati' }).click({ timeout: 5_000 }).catch(() => undefined)
  await expect(page).toHaveURL(/\/app\/debrief\//)
  await expect(page.getByTestId('debrief')).toBeVisible()
  w.expectClean()
})
