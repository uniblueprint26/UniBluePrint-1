import PartnerPage from '../../components/explore/PartnerPage'
import { KOBO } from '../../constants/partnerBrands'

// Kobo partner page. Kobo is in closed beta with test money only, so this page
// never offers to send money. The one action is joining the waitlist on their
// own site. Wording follows kobopayments.com.
export default function KoboPartnerScreen({ navigation }) {
  return (
    <PartnerPage
      navigation={navigation}
      brand={{ bg: KOBO.teal, fg: KOBO.cream, accent: KOBO.mint, button: KOBO.amber, buttonText: KOBO.tealDeep, heading: KOBO.fonts.heading, body: KOBO.fonts.body, bodySemi: KOBO.fonts.heading }}
      logo={require('../../../assets/partners/kobo/logo-light.png')}
      tag="In beta"
      eyebrow="Our partner"
      title="Kobo"
      tagline="Send money home."
      what="Kobo is an app to send euros from Ireland to family in Nigeria. Your family holds digital dollars until they convert them to naira. Kobo is not a bank."
      facts={[
        { label: 'Stage', text: 'Closed beta. Test money only.' },
        { label: 'Prices', text: 'Not set yet.' },
        { label: 'How to get in', text: 'The waitlist is the only way in for now.' },
      ]}
      primary={{ label: 'Join the Kobo waitlist', url: KOBO.waitlistUrl }}
      note="Opens kobopayments.com in your browser. UBP does not move or hold any money."
    />
  )
}
