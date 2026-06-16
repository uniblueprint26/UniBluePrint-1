import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }

    let attempts = 0
    const id = hash.slice(1)
    const timer = setInterval(() => {
      attempts += 1
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        clearInterval(timer)
      } else if (attempts >= 20) {
        clearInterval(timer)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [pathname, hash])
}
