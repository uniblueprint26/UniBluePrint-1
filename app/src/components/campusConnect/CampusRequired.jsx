import { useState } from 'react'
import { Building2 } from 'lucide-react-native'
import CampusGateModal from './CampusGateModal'
import { useUserType } from '../../hooks/useUserType'
import { USER_TYPE_APPRENTICE, USER_TYPE_WORKER } from '../../constants/userTypes'
import { EmptyNote, PrimaryButton } from './CampusKit'

// Shown on campus tools when the member has not chosen a campus yet. The
// tools are scoped to your own campus, so there is nothing to show without one.
export default function CampusRequired({ onChosen, what = 'this' }) {
  const [open, setOpen] = useState(false)
  const { userType } = useUserType()
  const group = userType === USER_TYPE_APPRENTICE ? 'training provider' : userType === USER_TYPE_WORKER ? 'industry' : 'campus'
  return (
    <>
      <EmptyNote
        Icon={Building2}
        title={`Choose your ${group} first`}
        body={`${what} is shared with people in your own ${group === 'campus' ? 'campus' : 'Campus Connect group'}. Pick yours and it will appear.`}
      >
        <PrimaryButton label={`Choose my ${group}`} onPress={() => setOpen(true)} />
      </EmptyNote>
      <CampusGateModal visible={open} onClose={() => setOpen(false)} onSelected={() => { setOpen(false); onChosen && onChosen() }} />
    </>
  )
}
