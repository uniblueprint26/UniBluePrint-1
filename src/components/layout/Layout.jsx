import { Outlet, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import TrialBanner from './TrialBanner'
import Navbar from './Navbar'
import Footer from './Footer'
import CookieBanner from './CookieBanner'

const SITE_URL = 'https://uniblueprint.com'

export default function Layout() {
  const location = useLocation()
  const canonical = `${SITE_URL}${location.pathname}`

  return (
    <>
      <Helmet>
        {/* Default OG + Twitter Card — individual pages override these */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Uniblueprint" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content="Uniblueprint — Ireland's Student Platform" />
        <meta property="og:description" content="The structure behind your success — Foundation Blueprint, Elevation Blueprint, Campus Connect, and more." />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Uniblueprint — Ireland's Student Platform" />
        <meta name="twitter:description" content="The structure behind your success — Foundation Blueprint, Elevation Blueprint, Campus Connect, and more." />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
      </Helmet>
      <TrialBanner />
      <Navbar />
      <main id="main-content">
        <div key={location.pathname} className="route-fade">
          <Outlet />
        </div>
      </main>
      <Footer />
      <CookieBanner />
    </>
  )
}
