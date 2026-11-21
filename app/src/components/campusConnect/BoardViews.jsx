import { useState, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, useWindowDimensions } from 'react-native'
import { Clock, MapPin, Search, Flag, MessageCircle, Trash2, CalendarPlus, Image as ImageIcon, UserX } from 'lucide-react-native'
import { Card, Chip, Pill, Stamp, EmptyNote, PrimaryButton, useTone } from './CampusKit'
import Sheet from './Sheet'
import { RoomyMark } from './RoomyMark'
import { ROOMY } from '../../constants/partnerBrands'
import { EXAMPLE_EVENTS, EXAMPLE_RIDES, EXAMPLE_LOST_FOUND } from '../../constants/campusExamples'
import { formatCarpoolDays } from '../../constants/campusBoards'
import { nextSevenDays, dowOfIso, timeAgo } from '../../lib/campus'
import { fonts } from '../../constants/theme'

// Board views for Campus Connect (founder picks r3-12 to r3-15): Events as date
// cards, Ride shares as route cards with a seven day row, Lost and found as a
// photo grid, and Accommodation with Roomy.ie as the partner. Each view gets
// the board's rows and a few actions from BoardDetailScreen, so every member
// post here has Report and Block through the shared sheet.
//
// props: rows, user, onPost, onReport(item, type), onBlock(item), onRemove(item),
//        onChat(item, roomName, subtitle), onRoomy

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DOWS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const ownerOf = r => r.user_id ?? r.created_by ?? null

function Actions({ item, own, user, onReport, onBlock, onRemove, type, extra }) {
  const { colors } = useTone()
  if (own) {
    return (
      <TouchableOpacity onPress={() => onRemove(item)} style={s.rowBtn} accessibilityRole="button" accessibilityLabel="Remove this post">
        <Trash2 size={16} color={colors.textSecondary} strokeWidth={1.8} />
        <Text style={[s.small, { color: colors.textSecondary }]}>Remove</Text>
      </TouchableOpacity>
    )
  }
  return (
    <View style={s.actions}>
      {extra}
      <TouchableOpacity onPress={() => onReport(item, type)} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Report this post">
        <Flag size={18} color={colors.textSecondary} strokeWidth={1.8} />
      </TouchableOpacity>
      {!!ownerOf(item) && (
        <TouchableOpacity onPress={() => onBlock(item)} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Block this member">
          <UserX size={18} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Events ────────────────────────────────────────────────────────────────
export function EventsView({ rows, user, onPost, onReport, onBlock, onRemove }) {
  const { colors, accent, tint } = useTone()
  const [f, setF] = useState('all')
  const real = useMemo(() => {
    return rows
      .filter(r => f === 'all' || (f === 'free' && !r.is_ticketed) || (f === 'ticketed' && r.is_ticketed) || (f === 'society' && /society|soc\b|club/i.test(r.organiser || '')))
      .sort((a, b) => String(a.event_date || '9').localeCompare(String(b.event_date || '9')))
  }, [rows, f])
  const examples = rows.length < 3 && (f === 'all' || f === 'free' || f === 'ticketed') ? EXAMPLE_EVENTS.filter(e => f === 'all' || (f === 'free' ? e.free : !e.free && !e.priority)) : []

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {[['all', 'All'], ['free', 'Free'], ['ticketed', 'Ticketed'], ['society', 'Society']].map(([k, l]) => <Chip key={k} label={l} active={f === k} onPress={() => setF(k)} />)}
      </ScrollView>
      {real.length === 0 && examples.length === 0 && (
        <View style={{ marginTop: 16 }}>
          <EmptyNote Icon={CalendarPlus} title="No events yet" body="Societies and students can post what is on. Be the first.">
            <PrimaryButton label="Post an event" onPress={onPost} />
          </EmptyNote>
        </View>
      )}
      {real.map(r => {
        const d = r.event_date ? new Date(`${r.event_date}T12:00:00`) : null
        const own = ownerOf(r) === user?.id
        return (
          <Card key={r.id} style={s.card}>
            <View style={s.top}>
              <DateBlock d={d} />
              <View style={{ flex: 1 }}>
                <Text style={[s.title, { color: colors.textPrimary }]}>{r.event_name}</Text>
                <View style={s.meta}>
                  <Clock size={14} color={colors.textSecondary} strokeWidth={1.8} />
                  <Text style={[s.small, { color: colors.textSecondary }]}>{r.event_time}</Text>
                  <MapPin size={14} color={colors.textSecondary} strokeWidth={1.8} />
                  <Text style={[s.small, { color: colors.textSecondary, flexShrink: 1 }]} numberOfLines={1}>{r.location}</Text>
                </View>
                <View style={s.pills}>
                  <Pill label={r.organiser} />
                  <Pill label={r.is_ticketed ? 'Ticketed' : 'Free'} tone={r.is_ticketed ? 'accent' : 'good'} />
                </View>
              </View>
            </View>
            {!!r.description && <Text style={[s.body, { color: colors.textSecondary }]} numberOfLines={3}>{r.description}</Text>}
            <Actions item={r} own={own} user={user} onReport={onReport} onBlock={onBlock} onRemove={onRemove} type="campus_event" />
          </Card>
        )
      })}
      {examples.map(e => (
        <Card key={e.id} style={s.card}>
          <View style={s.top}>
            <DateBlock d={null} />
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: colors.textPrimary }]}>{e.name}</Text>
              <View style={s.meta}>
                <Clock size={14} color={colors.textSecondary} strokeWidth={1.8} />
                <Text style={[s.small, { color: colors.textSecondary }]}>Time ?</Text>
                <MapPin size={14} color={colors.textSecondary} strokeWidth={1.8} />
                <Text style={[s.small, { color: colors.textSecondary }]}>{e.priority ? `${e.where}, venue ?` : e.where}</Text>
              </View>
              <View style={s.pills}>
                <Pill label={e.organiser} />
                <Stamp label="Example" style={{ transform: [{ rotate: '0deg' }] }} />
              </View>
            </View>
          </View>
        </Card>
      ))}
    </View>
  )
}

function DateBlock({ d }) {
  const { accent, tint } = useTone()
  return (
    <View style={[s.date, { backgroundColor: tint }]}>
      <Text style={[s.dow, { color: accent }]}>{d ? DOWS[d.getDay()] : 'DATE'}</Text>
      <Text style={[s.day, { color: accent }]}>{d ? d.getDate() : '?'}</Text>
    </View>
  )
}

// ── Ride shares ────────────────────────────────────────────────────────────
export function RidesView({ rows, user, onPost, onReport, onBlock, onRemove, onChat }) {
  const { colors, accent, tint } = useTone()
  const [q, setQ] = useState('')
  const [day, setDay] = useState('any')
  const days = useMemo(nextSevenDays, [])
  const needle = q.trim().toLowerCase()

  function matches(r) {
    if (needle) {
      const hay = [r.from_location, r.to_location, ...(r.stops || [])].join(' ').toLowerCase()
      if (!hay.includes(needle)) return false
    }
    if (day === 'any') return true
    if (r.ride_date) return r.ride_date === day
    return (r.days || []).includes(dowOfIso(day))
  }
  const real = rows.filter(matches)
  const examples = rows.length < 3 ? EXAMPLE_RIDES.filter(matches) : []

  return (
    <View>
      <View style={[s.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color={colors.textSecondary} strokeWidth={1.8} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Filter by route or stop, for example Cork"
          placeholderTextColor={colors.textTertiary}
          style={[s.searchInput, { color: colors.textPrimary }]}
          accessibilityLabel="Filter rides"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        <Chip label="Any day" active={day === 'any'} onPress={() => setDay('any')} />
        {days.map(d => <Chip key={d.key} label={`${d.label} ${d.day}`} active={day === d.key} onPress={() => setDay(d.key)} />)}
      </ScrollView>
      <TouchableOpacity onPress={onPost} style={[s.plan, { borderColor: accent }]} accessibilityRole="button" accessibilityLabel="Plan ahead, post a ride for a later date">
        <CalendarPlus size={18} color={accent} strokeWidth={1.9} />
        <Text style={[s.planText, { color: accent }]}>Plan ahead</Text>
        <Text style={[s.small, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>Post a ride for any date</Text>
      </TouchableOpacity>

      {real.length === 0 && examples.length === 0 && (
        <View style={{ marginTop: 16 }}>
          <EmptyNote Icon={MapPin} title="No rides match" body="Try another day, or post your own route and others can message you.">
            <PrimaryButton label="Post a ride" onPress={onPost} />
          </EmptyNote>
        </View>
      )}
      {real.map(r => <RideCard key={r.id} r={r} user={user} onReport={onReport} onBlock={onBlock} onRemove={onRemove} onChat={onChat} />)}
      {examples.map(r => <RideCard key={r.id} r={r} example />)}
      <Text style={[s.small, { color: colors.textSecondary, marginTop: 16 }]}>
        Always meet in a public place first. Share your plans with someone you trust. The carpool safety terms apply.
      </Text>
    </View>
  )
}

function RideCard({ r, user, example, onReport, onBlock, onRemove, onChat }) {
  const { colors, accent, tint } = useTone()
  const own = !example && ownerOf(r) === user?.id
  const stops = [r.from_location, ...(r.stops || []), r.to_location]
  const when = r.ride_date
    ? new Date(`${r.ride_date}T12:00:00`).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })
    : formatCarpoolDays(r.days)
  return (
    <Card style={s.card}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          {stops.map((p, i) => (
            <View key={`${p}-${i}`} style={s.stopRow}>
              <View style={s.rail}>
                <View style={[s.dot, i === stops.length - 1 ? { backgroundColor: accent } : { borderColor: accent, borderWidth: 2 }]} />
                {i < stops.length - 1 && <View style={[s.line, { backgroundColor: colors.divider }]} />}
              </View>
              <Text style={[i === 0 || i === stops.length - 1 ? s.title : s.stop, { color: colors.textPrimary }]}>{p}</Text>
            </View>
          ))}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.time, { color: colors.textPrimary }]}>{r.departure_time}</Text>
          <Text style={[s.small, { color: colors.textSecondary, textAlign: 'right' }]}>{when}</Text>
        </View>
      </View>
      <View style={s.pills}>
        <Pill label={`${r.seats_available} seat${r.seats_available === 1 ? '' : 's'}`} tone="accent" />
        <Pill label={`Contribution: ${String(r.contribution || '').toLowerCase()}`} />
        {example && <Stamp label="Example" style={{ transform: [{ rotate: '0deg' }] }} />}
      </View>
      {!!r.notes && <Text style={[s.body, { color: colors.textSecondary }]}>{r.notes}</Text>}
      {!example && (
        <Actions
          item={r} own={own} user={user} onReport={onReport} onBlock={onBlock} onRemove={onRemove} type="carpool_route"
          extra={<PrimaryButton label="Chat" Icon={MessageCircle} onPress={() => onChat(r, `${r.from_location} to ${r.to_location}`, r.departure_time)} style={s.chat} />}
        />
      )}
    </Card>
  )
}

// ── Lost and found (photo grid) ────────────────────────────────────────────
export function LostFoundView({ rows, user, onPost, onReport, onBlock, onRemove, onChat }) {
  const { colors, accent, tint, isDark } = useTone()
  const { width } = useWindowDimensions()
  const [f, setF] = useState('all')
  const [open, setOpen] = useState(null)
  const cardW = (width - 32 - 12) / 2
  const real = rows.filter(r => f === 'all' || r.status.toLowerCase() === f)
  const examples = rows.length < 3 ? EXAMPLE_LOST_FOUND.filter(e => f === 'all' || e.status.toLowerCase() === f) : []
  const sel = open ? [...rows, ...EXAMPLE_LOST_FOUND].find(r => r.id === open) : null
  const isExample = sel && String(sel.id).startsWith('ex-')

  const Tile = ({ r, example }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => setOpen(r.id)}
      accessibilityRole="button"
      accessibilityLabel={`${r.status}: ${r.item_description}`}
      style={[s.tile, { width: cardW, backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[s.photo, { backgroundColor: tint }]}>
        {r.photo_url ? <Image source={{ uri: r.photo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <ImageIcon size={28} color={accent} strokeWidth={1.5} />}
        <View style={[s.tag, { backgroundColor: r.status === 'Found' ? (isDark ? '#14532D' : '#DCFCE7') : (isDark ? '#7C2D12' : '#FFEDD5') }]}>
          <Text style={[s.tagText, { color: r.status === 'Found' ? (isDark ? '#86EFAC' : '#15803D') : (isDark ? '#FDBA74' : '#C2410C') }]}>{r.status}</Text>
        </View>
      </View>
      <View style={{ padding: 12 }}>
        <Text style={[s.stop, { color: colors.textPrimary, fontFamily: fonts.sansSemiBold }]} numberOfLines={2}>{r.item_description}</Text>
        <Text style={[s.small, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>{r.location}</Text>
        <Text style={[s.small, { color: colors.textSecondary }]}>{example ? 'Example' : timeAgo(r.created_at)}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {[['all', 'All'], ['found', 'Found'], ['lost', 'Lost']].map(([k, l]) => <Chip key={k} label={l} active={f === k} onPress={() => setF(k)} />)}
      </ScrollView>
      {real.length === 0 && examples.length === 0 ? (
        <View style={{ marginTop: 16 }}>
          <EmptyNote Icon={Search} title="Nothing here yet" body="Lost something or found something? Post it so it can find its owner.">
            <PrimaryButton label="Report an item" onPress={onPost} />
          </EmptyNote>
        </View>
      ) : (
        <View style={s.grid}>
          {real.map(r => <Tile key={r.id} r={r} />)}
          {examples.map(r => <Tile key={r.id} r={r} example />)}
        </View>
      )}
      <Sheet visible={!!sel} onClose={() => setOpen(null)} title={sel?.item_description || ''} subtitle={sel ? `${sel.status}, ${sel.location}` : ''}>
        {sel && (
          <View>
            {!!sel.photo_url && <Image source={{ uri: sel.photo_url }} style={s.big} resizeMode="cover" />}
            <View style={s.pills}>
              <Pill label={sel.status} tone="accent" />
              {isExample ? <Stamp label="Example" style={{ transform: [{ rotate: '0deg' }] }} /> : !!sel.date_occurred && <Pill label={sel.date_occurred} />}
            </View>
            {!isExample && ownerOf(sel) !== user?.id && (
              <>
                <PrimaryButton label="Message" Icon={MessageCircle} onPress={() => { setOpen(null); onChat(sel, `${sel.status}: ${sel.item_description}`.slice(0, 60), sel.location) }} />
                <View style={[s.actions, { marginTop: 8 }]}>
                  <TouchableOpacity onPress={() => { setOpen(null); onReport(sel, 'lost_found_post') }} style={s.rowBtn} accessibilityRole="button">
                    <Flag size={16} color={colors.textSecondary} strokeWidth={1.8} /><Text style={[s.small, { color: colors.textSecondary }]}>Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setOpen(null); onBlock(sel) }} style={s.rowBtn} accessibilityRole="button">
                    <UserX size={16} color={colors.textSecondary} strokeWidth={1.8} /><Text style={[s.small, { color: colors.textSecondary }]}>Block</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {!isExample && ownerOf(sel) === user?.id && (
              <TouchableOpacity onPress={() => { setOpen(null); onRemove(sel) }} style={[s.rowBtn, { marginTop: 14 }]} accessibilityRole="button">
                <Trash2 size={16} color={colors.textSecondary} strokeWidth={1.8} /><Text style={[s.small, { color: colors.textSecondary }]}>Remove my post</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Sheet>
    </View>
  )
}

// ── Accommodation (Roomy.ie partner first, then member posts) ──────────────
export function AccommodationView({ rows, user, onPost, onReport, onBlock, onRemove, onChat, onRoomy, onRoomyPage }) {
  const { colors, accent, tint, isDark } = useTone()
  const [f, setF] = useState('all')
  const shown = rows.filter(r => f === 'all' || r.post_type === f)
  return (
    <View>
      <Card>
        <View style={s.top}>
          <RoomyMark size={52} />
          <View style={{ flex: 1 }}>
            <Text style={[s.small, { color: isDark ? ROOMY.mint : ROOMY.teal, fontFamily: fonts.sansBold, letterSpacing: 0.8 }]}>ACCOMMODATION PARTNER</Text>
            <Text style={[s.title, { color: colors.textPrimary }]}>Roomy.ie</Text>
          </View>
        </View>
        <Text style={[s.body, { color: colors.textSecondary }]}>Looking for a room or a houseshare? Browse on Roomy.ie, then come back and post here.</Text>
        <View style={[s.actions, { marginTop: 14 }]}>
          <PrimaryButton label="Open roomy.ie" onPress={onRoomy} style={s.chat} />
          <TouchableOpacity onPress={onRoomyPage} style={s.rowBtn} accessibilityRole="button"><Text style={[s.small, { color: accent, fontFamily: fonts.sansSemiBold }]}>About Roomy.ie</Text></TouchableOpacity>
        </View>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {['all', 'Looking for room', 'Room available', 'Flat to share'].map(k => <Chip key={k} label={k === 'all' ? 'All' : k} active={f === k} onPress={() => setF(k)} />)}
      </ScrollView>
      {shown.length === 0 && (
        <EmptyNote Icon={MapPin} title="No member posts yet" body="Have a spare room, or looking for one? Post it here for your campus.">
          <PrimaryButton label="Post to Accommodation" onPress={onPost} />
        </EmptyNote>
      )}
      {shown.map(r => {
        const own = ownerOf(r) === user?.id
        return (
          <Card key={r.id} style={s.card}>
            {!!r.photo_url && <Image source={{ uri: r.photo_url }} style={s.listing} resizeMode="cover" accessibilityLabel={r.title} />}
            <View style={[s.pills, { marginTop: r.photo_url ? 12 : 0 }]}>
              <Pill label={r.post_type} tone="accent" />
              {r.rent_per_month != null && <Pill label={`${r.rent_per_month} euro a month`} />}
            </View>
            <Text style={[s.title, { color: colors.textPrimary, marginTop: 10 }]}>{r.title}</Text>
            <View style={s.meta}>
              <MapPin size={14} color={colors.textSecondary} strokeWidth={1.8} />
              <Text style={[s.small, { color: colors.textSecondary, flexShrink: 1 }]}>{r.location}</Text>
            </View>
            <Text style={[s.body, { color: colors.textSecondary }]} numberOfLines={4}>{r.description}</Text>
            <Text style={[s.small, { color: colors.textSecondary, marginTop: 8 }]}>{r.poster_name || 'A member'}, {timeAgo(r.created_at)}</Text>
            <Actions
              item={r} own={own} user={user} onReport={onReport} onBlock={onBlock} onRemove={onRemove} type="accommodation_post"
              extra={<PrimaryButton label="Message" Icon={MessageCircle} onPress={() => onChat(r, r.title, r.location)} style={s.chat} />}
            />
          </Card>
        )
      })}
      <Text style={[s.small, { color: colors.textSecondary, marginTop: 16 }]}>
        UBP never takes rent or deposits. Never send money before you have seen a place and met the person.
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  chips: { gap: 8, paddingVertical: 14 },
  card: { marginTop: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 18, lineHeight: 24 },
  stop: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  body: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, marginTop: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  iconBtn: { padding: 10 },
  rowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingRight: 12 },
  chat: { marginTop: 0, flex: 1, paddingVertical: 11 },
  date: { width: 64, height: 68, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dow: { fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 1 },
  day: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, height: 52 },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginTop: 2 },
  planText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  stopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 28 },
  rail: { width: 14, alignItems: 'center', paddingTop: 7 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, minHeight: 12, marginVertical: 2 },
  time: { fontFamily: fonts.sansBold, fontSize: 17 },
  chat2: {},
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  photo: { height: 110, alignItems: 'center', justifyContent: 'center' },
  tag: { position: 'absolute', top: 8, left: 8, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontFamily: fonts.sansBold, fontSize: 11 },
  big: { width: '100%', height: 200, borderRadius: 16, marginBottom: 6 },
  listing: { width: '100%', height: 170, borderRadius: 14 },
})
