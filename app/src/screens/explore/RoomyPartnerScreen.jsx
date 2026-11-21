import PartnerPage from '../../components/explore/PartnerPage'
import { ROOMY } from '../../constants/partnerBrands'

// Roomy.ie partner page. Text comes from the Roomy.ie entry in the Lifestyle
// partner list (data/lifestylePartners.js). Roomy is also the accommodation
// partner on the Campus Connect Accommodation board.
export default function RoomyPartnerScreen({ navigation }) {
  return (
    <PartnerPage
      navigation={navigation}
      brand={{ bg: ROOMY.deep, fg: '#F3FAF3', accent: ROOMY.mint, button: ROOMY.teal, buttonText: '#FFFFFF', heading: ROOMY.fonts.heading, body: ROOMY.fonts.body, bodySemi: ROOMY.fonts.bodySemi }}
      logo={require('../../../assets/partners/roomy/logo.png')}
      tag="Accommodation partner"
      eyebrow="Our partner"
      title="Roomy.ie"
      tagline="Safe. Simple. Connected."
      what="A housing platform that makes finding a room or home in Ireland simpler, safer and more transparent. It connects room seekers with landlords and property listers nationwide, for students, young professionals, newcomers and landlords."
      facts={[
        { label: 'What you can do', text: 'Browse rooms and homes, post what you are looking for, find flatmate groups.' },
        { label: 'Staying safe', text: 'Roomy.ie shares safety and scam awareness resources for renters.' },
      ]}
      primary={{ label: 'Visit roomy.ie', url: ROOMY.siteUrl }}
      note="Opens roomy.ie in your browser."
    />
  )
}
