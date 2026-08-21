import SiteNav from '@/components/marketing/SiteNav'
import SiteFooter from '@/components/marketing/SiteFooter'

/**
 * Every marketing page now gets the same header and footer. Before this
 * layout existed, /features, /pricing, /blog, /privacy and /terms rendered
 * with no navigation whatsoever — no logo, no links, no theme toggle, no
 * way back to the site.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteNav />
      <main id="main" className="pt-[72px]">{children}</main>
      <SiteFooter />
    </div>
  )
}
