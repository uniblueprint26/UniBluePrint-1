// useReferralCapture — sibling to useUTMCapture.js. Captures a ?ref=<code>
// query param (the referral code from someone's "share with friends" link)
// into sessionStorage, the same way UTM params are captured, so SignUpPage
// can read it back at submit time even if the person wanders the site
// before creating an account. getReferralCode() is the read side, used by
// SignUpPage to pre-fill its optional "Invite code" field.
//
// Attribution only — see the 20261015120000_referral_tracking migration.
// Capturing a code here doesn't grant anything; it's only read at signup
// and handed to handle_new_user() via signUp()'s metadata, same path
// marketing_consent and date_of_birth already use.

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const STORAGE_KEY = 'ubp_ref'

export function useReferralCapture() {
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const ref = params.get('ref')
    if (ref && ref.trim()) {
      try { sessionStorage.setItem(STORAGE_KEY, ref.trim()) } catch { /* private window etc. */ }
    }
  }, [location.search])
}

export function getReferralCode() {
  try { return sessionStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
}
