// Canonical website URLs the app links out to. Anything involving money or
// legal document text lives on the website, never duplicated or forked into
// the app bundle — the app always deep-links out for these, it never renders
// its own copy or collects payment details itself.

export const SITE_URL = 'https://uniblueprint.com'

export const WEBSITE_LINKS = {
  terms:         `${SITE_URL}/terms`,
  privacy:       `${SITE_URL}/privacy`,
  refundPolicy:  `${SITE_URL}/refund-policy`,
  cookies:       `${SITE_URL}/cookies`,
  pricing:       `${SITE_URL}/pricing`,
  contact:       `${SITE_URL}/contact`,
}
