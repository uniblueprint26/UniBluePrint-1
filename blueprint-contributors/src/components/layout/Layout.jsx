import { Outlet, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from './Navbar'
import Footer from './Footer'

const SITE_URL = 'https://contributors.uniblueprint.com'

export default function Layout() {
  const location = useLocation()
  const canonical = `${SITE_URL}${location.pathname}`

  return (
    <>
      <Helmet>
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="UniBlueprint" />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <Navbar />
      <main id="main-content">
        <div key={location.pathname} className="route-fade">
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  )
}
