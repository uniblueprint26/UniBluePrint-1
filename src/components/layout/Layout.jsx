import { Outlet, useLocation } from 'react-router-dom'
import TrialBanner from './TrialBanner'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()

  return (
    <>
      <TrialBanner />
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
