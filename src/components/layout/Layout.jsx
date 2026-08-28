import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import TrialBanner from './TrialBanner'
import Navbar from './Navbar'
import Footer from './Footer'
import CookieBanner from './CookieBanner'
import BackToTop from '../ui/BackToTop'
import Breadcrumbs from '../ui/Breadcrumbs'
import SearchModal from '../ui/SearchModal'

const SITE_URL = 'https://uniblueprint.ie'

export default function Layout() {
  const location = useLocation()
  const canonical = `${SITE_URL}${location.pathname}`
  const [searchOpen, setSearchOpen] = useState(false)

  // Founder/Operations/Partner portal users are staff and partners, not
  // members shopping for a subscription, so the September trial marketing
  // banner has nothing to say to them.
  const isInternalPortal = location.pathname.startsWith('/admin') || location.pathname.startsWith('/portal')

  return (
    <>
      <Helmet>
        {/* Default OG + Twitter Card — individual pages override these */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="UniBlueprint" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content="UniBlueprint, Ireland's Platform for Young People" />
        <meta property="og:description" content="The structure behind your success: Foundation Blueprint, Elevation Blueprint, Campus Connect, and more." />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="UniBlueprint, Ireland's Platform for Young People" />
        <meta name="twitter:description" content="The structure behind your success: Foundation Blueprint, Elevation Blueprint, Campus Connect, and more." />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {!isInternalPortal && <div className="no-print"><TrialBanner /></div>}
      <Navbar onSearchOpen={() => setSearchOpen(true)} />
      <Breadcrumbs />
      <main id="main-content">
        <div key={location.pathname} className="route-fade">
          <Outlet />
        </div>
      </main>
      <Footer />
      <div className="no-print"><CookieBanner /></div>
      <BackToTop />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
