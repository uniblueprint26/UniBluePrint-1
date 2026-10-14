import { useAuth } from '../../context/AuthContext'
import { priceCents, formatEuro } from '../../lib/foundationPayment'

/** Submit-button text that states what the student is about to pay. */
export default function PayLabel({ table, tier, label }) {
  const { isPro } = useAuth()
  const cents = priceCents(table, tier, isPro)
  return <>{cents ? `Pay ${formatEuro(cents)} & ${label.charAt(0).toLowerCase()}${label.slice(1)}` : label}</>
}
