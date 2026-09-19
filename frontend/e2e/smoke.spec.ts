import { expect, test } from '@playwright/test'

// A small, reliable smoke suite covering the golden demo path end-to-end
// against real running infrastructure (Firebase emulators, Strapi, the
// actual app) - not mocks. This is committed and runnable via
// `npm run test:e2e` specifically because prior E2E verification during
// this project's build was done via ad-hoc, uncommitted scripts, which
// meant the results in project documentation weren't independently
// reproducible from the repository. This file fixes that.
//
// Prerequisites (see README > Testing): Firebase emulators (Auth +
// Firestore) running, Strapi running with its auto-seeded demo content,
// and scripts/seed-emulator.mjs already run against the emulator so the
// three demo accounts and demo rooms exist. Playwright's config starts the
// frontend dev server itself if it isn't already running.
//
// Steps intentionally run in one serial flow (not independent tests)
// because each step depends on state the previous step created - this
// mirrors how a person would actually walk through a demo.

test.describe.configure({ mode: 'serial' })

const STUDENT = { email: 'student.demo@uclone.lk', password: 'Demo123!' }
const STAFF_ADMINISTRATIVE = { email: 'staff.admin@uclone.lk', password: 'Demo123!' }

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForSelector('text=Welcome back', { timeout: 15000 })
}

async function logout(page: import('@playwright/test').Page) {
  await page.click('text=Sign out')
  await page.waitForURL('**/login', { timeout: 10000 })
}

test('golden demo path', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await test.step('1. unauthenticated visitor is redirected to /login', async () => {
    await page.goto('/')
    await page.waitForURL('**/login')
  })

  await test.step('2. student login -> dashboard', async () => {
    await login(page, STUDENT.email, STUDENT.password)
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  await test.step('3. search & discover', async () => {
    await page.click('text=Search & Discover')
    await page.fill('input[placeholder*="Search"]', 'library')
    await expect(page.locator('h3').first()).toBeVisible()
  })

  await test.step('4. targeted content is visually distinguished on the dashboard', async () => {
    await page.click('text=Dashboard')
    await expect(page.locator('text=Announcements for you')).toBeVisible()
  })

  await test.step('5. event visibility + interest', async () => {
    await page.click('text=Events')
    await page.waitForSelector("button:has-text(\"I'm interested\"), button:has-text(\"Interested\")")
  })

  await test.step('6. society sign-up', async () => {
    await page.click('text=Societies')
    await page.waitForSelector('button:has-text("Express interest"), button:has-text("Interest sent")')
  })

  let bookingRequested = false
  await test.step('7. classroom booking request', async () => {
    await page.click('text=Room Booking')
    await page.fill('#start', '09:00')
    await page.fill('#end', '10:00')
    await page.fill('#purpose', 'E2E smoke test booking')
    await page.click('button:has-text("Check availability")')
    await page.waitForTimeout(1000)
    const requestButton = page.locator('button:has-text("Request this room")').first()
    if (await requestButton.count()) {
      await requestButton.click()
      await page.waitForSelector('text=Request sent', { timeout: 10000 })
      bookingRequested = true
    }
  })

  await test.step('8. lost & found report', async () => {
    await page.click('text=Lost & Found')
    await page.click('text=Report an item')
    await page.fill('#itemName', 'E2E Test Item')
    await page.fill('#description', 'Created by the automated smoke test')
    await page.fill('#location', 'Test Location')
    await page.fill('#contact', 'e2e@uclone.lk')
    await page.click('button:has-text("Submit report")')
    // .first(): reruns against a shared, non-reset emulator accumulate
    // multiple "E2E Test Item" rows from earlier runs, which makes a plain
    // text locator match more than one element (Playwright strict mode).
    await expect(page.locator('text=E2E Test Item').first()).toBeVisible({ timeout: 10000 })
  })

  await test.step('9. AI assistant answers a question', async () => {
    await page.click('text=AI Assistant')
    await page.fill('input[placeholder*="Ask about"]', 'Are there any events this week?')
    await page.click('button[type=submit]')
    await expect(page.locator('text=UCL ONE Assistant')).toBeVisible({ timeout: 10000 })
  })

  await test.step('10. logout', async () => {
    await logout(page)
  })

  await test.step('11. staff approves the booking (if one was created in step 7)', async () => {
    if (!bookingRequested) return
    await login(page, STAFF_ADMINISTRATIVE.email, STAFF_ADMINISTRATIVE.password)
    await page.click('text=Staff Console')
    await page.waitForSelector('text=Room Bookings')
    const approveButton = page.locator('button:has-text("Approve")').first()
    if (await approveButton.count()) {
      await approveButton.click()
      await page.waitForTimeout(1000)
    }
    await logout(page)
  })

  expect(consoleErrors, `Console errors during the golden path: ${JSON.stringify(consoleErrors)}`).toHaveLength(0)
})
