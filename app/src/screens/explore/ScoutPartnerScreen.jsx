import PartnerPage from '../../components/explore/PartnerPage'
import { SCOUT } from '../../constants/partnerBrands'

// ScoutByRohi partner page: hero, what it is in their own words, the tracker
// and alerts links, and a note that only official sources are used.
export default function ScoutPartnerScreen({ navigation }) {
  return (
    <PartnerPage
      navigation={navigation}
      brand={{ bg: SCOUT.forest, fg: '#F6F8F5', accent: SCOUT.signal, button: SCOUT.signal, buttonText: SCOUT.forest, heading: SCOUT.fonts.heading, body: SCOUT.fonts.body, bodySemi: SCOUT.fonts.bodySemi }}
      logo={require('../../../assets/partners/scout/logo.png')}
      logoBg={SCOUT.mint}
      eyebrow="Our partner"
      title="ScoutByRohi"
      tagline="Find the opening. Make your move."
      credit="Built by Rohi Aluede"
      what="The Irish internship and graduate scheme tracker. Internships, graduate schemes and insight programmes are collected from employers' own careers pages. Every listing links to the official application."
      facts={[
        { label: 'Where', text: 'Ireland and Northern Ireland.' },
        { label: 'Sources', text: 'Official sources only. Every listing links to the employer.' },
        { label: 'Stage', text: 'Live beta.' },
      ]}
      primary={{ label: 'Open the tracker', url: SCOUT.trackerUrl }}
      secondary={{ label: 'Get email alerts', url: SCOUT.alertsUrl }}
      note="Links open scoutbyrohi.com in your browser. UBP takes no applications."
    />
  )
}
