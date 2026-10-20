import { test as base, expect } from '@playwright/test'

/**
 * Import `test`/`expect` from here instead of '@playwright/test'.
 * Every test then fails if the page reports a Content-Security-Policy violation, so new features
 * are checked against the CSP in next.config.ts automatically.
 */
export const test = base.extend<{ cspGuard: void }>({
  cspGuard: [
    async ({ page }, use) => {
      const violations: string[] = []
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          console.error(
            `CSP violation: ${event.violatedDirective} ${event.blockedURI} at ${event.sourceFile}:${event.lineNumber}`,
          )
        })
      })
      page.on('console', (message) => {
        if (message.text().startsWith('CSP violation')) violations.push(message.text())
      })
      await use()
      expect(violations, 'Content-Security-Policy violations').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
