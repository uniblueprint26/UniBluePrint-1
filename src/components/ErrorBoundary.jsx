import { Component } from 'react'
import UBPLogo from './ui/UBPLogo'

// Top-level crash guard. Without this, any unhandled render error anywhere
// in the tree unmounts the whole app and the visitor gets a blank white
// page with no way back — the worst possible first impression during
// launch week. Uses plain <a> tags rather than react-router's Link
// deliberately: if the render tree crashed, client-side routing state
// can't be trusted, so recovery goes through a real page reload.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error caught by ErrorBoundary:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section style={{
        background: '#F5F0E8', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '480px' }}>
          <a href="/" aria-label="UniBlueprint home" style={{ display: 'inline-block', marginBottom: '32px' }}>
            <UBPLogo height={80} />
          </a>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', color: '#1E3A5F', margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B7280',
            marginTop: '12px', lineHeight: 1.65,
          }}>
            The page hit an unexpected error. Reloading usually fixes it — if it keeps
            happening, let us know and we'll take a look.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
            <a
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '48px', padding: '0 28px',
                background: '#1E3A5F', color: '#F5F0E8',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Back to home
            </a>
            <a
              href="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '48px', padding: '0 28px',
                background: 'none', color: '#1E3A5F',
                border: '1.5px solid rgba(30,58,95,0.2)',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Contact us
            </a>
          </div>
        </div>
      </section>
    )
  }
}
