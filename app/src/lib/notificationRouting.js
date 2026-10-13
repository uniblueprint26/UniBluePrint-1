import { supabase } from './supabase'
import { COACHES, coachSlug } from '../screens/ElevationScreen'

// ── Deep-link routing ────────────────────────────────────────────────────────
// notifications.related_entity_type/related_entity_id are generic (an
// entity kind + id, not a route name — see the notification_center
// migration header) so the mapping to an actual in-app screen lives here,
// not in the schema. A chat_room needs one extra lookup (its context_type/
// context_id, which is what ChatRoomScreen actually keys off) since the
// notification only carries the room's own id. problem_solution, coach_booking
// and module_answer notifications carry the id of the solution/booking/answer
// row itself (see notify_on_* in 20260915090000_notification_center.sql and
// 20260907120000_coach_bookings.sql), not the parent thread's id — so each
// needs one extra lookup here to resolve the specific thread/booking before
// navigating, instead of just dropping the user on the whole board/list.
//
// Shared by two callers that each have a different kind of `navigation`
// object: NotificationsScreen's own `navigation` prop (tapping a row while
// the list is open) and useNotificationDeepLinking's `navigationRef` (tapping
// the OS push notification itself, app backgrounded or killed) — both expose
// the same `.navigate(name, params)` method, which is all this needs.
export async function goToRelatedEntity(navigation, notif, userId) {
  const type = notif.related_entity_type
  const id = notif.related_entity_id
  if (!type || !id) return

  switch (type) {
    case 'submission':
      navigation.navigate('MyOutputs')
      return
    case 'coach_booking': {
      const { data: booking } = await supabase
        .from('coach_bookings')
        .select('coach_slug, user_id')
        .eq('id', id)
        .maybeSingle()
      if (!booking) { navigation.navigate('Elevation'); return }
      // Is the signed-in user the coach on this booking (rather than the
      // student who made it)? If so, their own bookings live in the Studio,
      // not the student-facing Elevation browse list.
      const { data: ownProfile } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('coach_slug', booking.coach_slug)
        .eq('user_id', userId)
        .maybeSingle()
      if (ownProfile) {
        navigation.navigate('CoachStudio')
        return
      }
      const coach = COACHES.find(c => coachSlug(c.id) === booking.coach_slug)
      if (coach) navigation.navigate('CoachProfile', { coach })
      else navigation.navigate('Elevation')
      return
    }
    case 'problem_solution': {
      const { data: solution } = await supabase
        .from('problem_solutions')
        .select('problem_id')
        .eq('id', id)
        .maybeSingle()
      navigation.navigate('BoardDetail', {
        boardKey: 'problems',
        openProblemId: solution?.problem_id || null,
      })
      return
    }
    case 'module_answer': {
      const { data: answer } = await supabase
        .from('module_answers')
        .select('question_id')
        .eq('id', id)
        .maybeSingle()
      navigation.navigate('ModuleQA', { openQuestionId: answer?.question_id || null })
      return
    }
    case 'chat_room': {
      const { data } = await supabase
        .from('chat_rooms')
        .select('context_type, context_id, name')
        .eq('id', id)
        .maybeSingle()
      if (data) {
        navigation.navigate('ChatRoom', {
          contextType: data.context_type,
          contextId: data.context_id,
          roomName: data.name || 'Chat',
          subtitle: null,
        })
      }
      return
    }
    default:
      return
  }
}
