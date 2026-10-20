import { LayoutDashboard, ListTodo } from 'lucide-react'

import type { NavItem } from '@/components/molecules/nav-menu'

/** Main navigation. Add an entry here when you add a feature route. */
export const mainNavigation: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { href: '/tasks', label: 'Tasks', icon: <ListTodo /> },
]
