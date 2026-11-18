// Envelope paper colours for the Foundation Blueprint envelopes.
// Light mode: warm cream paper with a navy seal. Dark mode: deeper navy
// tinted paper with a cream seal. Everything else (text, borders) comes from
// useTheme() at the call site.
export function envelopePaper(isDark) {
  if (isDark) {
    return {
      body: '#274468',
      flap: '#203B5D',
      inner: '#17304C',
      letter: '#2F5080',
      letterText2: '#D6CEBA',
      edge: 'rgba(251,246,232,0.20)',
      sealBg: '#FBF6E8',
      sealFg: '#1E3A5F',
      shadow: 'rgba(0,0,0,0.5)',
    }
  }
  return {
    body: '#F4ECDC',
    flap: '#EADFC7',
    inner: '#DDCFB2',
    letter: '#FFFDF8',
    letterText2: '#6B7280',
    edge: 'rgba(30,58,95,0.16)',
    sealBg: '#1E3A5F',
    sealFg: '#F5F0E8',
    shadow: 'rgba(30,58,95,0.4)',
  }
}

// How far down (as a fraction of the envelope height) the flap's point reaches.
export const FLAP_DEPTH = 0.56
