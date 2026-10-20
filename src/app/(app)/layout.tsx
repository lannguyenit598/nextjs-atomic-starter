import { ThemeToggle } from '@/components/molecules/theme-toggle'
import { AppHeader } from '@/components/organisms/app-header'
import { AppSidebar } from '@/components/organisms/app-sidebar'
import { MobileNav } from '@/components/organisms/mobile-nav'
import { DashboardTemplate } from '@/components/templates/dashboard-template'
import { mainNavigation } from '@/config/navigation'
import { siteConfig } from '@/config/site'

/** Route layout: fills the DashboardTemplate slots with organisms + app config. */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <DashboardTemplate
      sidebar={<AppSidebar brand={siteConfig.name} items={mainNavigation} />}
      header={
        <AppHeader
          start={
            <>
              <MobileNav items={mainNavigation} />
              <span className="font-semibold md:hidden">{siteConfig.name}</span>
            </>
          }
          end={<ThemeToggle />}
        />
      }
    >
      {children}
    </DashboardTemplate>
  )
}
