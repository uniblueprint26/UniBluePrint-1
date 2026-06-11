export default function Footer() {
  return (
    <footer style={{ padding: '32px 24px', background: 'var(--color-primary)', color: '#fff' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}>
        &copy; {new Date().getFullYear()} Uniblueprint. All rights reserved.
      </p>
    </footer>
  )
}
