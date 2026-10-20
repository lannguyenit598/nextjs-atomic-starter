'use client'

import { Menu } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/atoms/button'
import { Dialog } from '@/components/molecules/dialog'
import { NavMenu, type NavItem } from '@/components/molecules/nav-menu'

export type MobileNavProps = {
  items: readonly NavItem[]
}

/** Menu button + drawer for small screens. Reuses the Dialog primitive for focus management. */
export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open navigation"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden />
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Navigation"
        className="mt-0 ml-0 h-dvh max-h-dvh w-72 max-w-[85vw] rounded-none rounded-r-lg"
      >
        <nav aria-label="Main">
          <NavMenu items={items} onNavigate={() => setOpen(false)} />
        </nav>
      </Dialog>
    </>
  )
}
