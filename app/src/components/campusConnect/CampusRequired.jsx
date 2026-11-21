import { useState } from 'react'
import { Building2 } from 'lucide-react-native'
import CampusGateModal from './CampusGateModal'
import { EmptyNote, PrimaryButton } from './CampusKit'

// Shown on campus tools when the member has not chosen a campus yet. The
// tools are scoped to your own campus, so there is nothing to show without one.
export default function CampusRequired({ onChosen, what = 'this' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EmptyNote
        Icon={Building2}
        title="Choose your campus first"
        body={`${what} is shared with people on your own campus. Pick yours and it will appear.`}
      >
        <PrimaryButton label="Choose my campus" onPress={() => setOpen(true)} />
      </EmptyNote>
      <CampusGateModal visible={open} onClose={() => setOpen(false)} onSelected={() => { setOpen(false); onChosen && onChosen() }} />
    </>
  )
}
