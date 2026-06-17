import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useUTMCapture() {
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const utm = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const val = params.get(key)
      if (val) utm[key] = val
    }
    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem('ubp_utm', JSON.stringify(utm))
    }
  }, [location.search])
}
