'use client'

import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { toggleTheme } from '@/lib/theme'

/** Icons swap via CSS (dark: variant), so server and client render identical markup. */
export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle color theme" onClick={toggleTheme}>
      <Sun aria-hidden className="hidden dark:block" />
      <Moon aria-hidden className="dark:hidden" />
    </Button>
  )
}
