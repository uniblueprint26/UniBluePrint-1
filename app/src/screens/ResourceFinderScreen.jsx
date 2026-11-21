/**
 * Resource finder: the national search over shared notes, past papers and
 * links. It is the same screen as Study resources (Course Connect scope), so
 * browse, filter, add a file or link, save, rate, Report and Block all work
 * the same here.
 */
import StudyResourcesScreen from './StudyResourcesScreen'

export default function ResourceFinderScreen({ navigation, route }) {
  const params = { ...(route?.params || {}), scope: route?.params?.scope || 'course' }
  return <StudyResourcesScreen navigation={navigation} route={{ ...route, params }} />
}
