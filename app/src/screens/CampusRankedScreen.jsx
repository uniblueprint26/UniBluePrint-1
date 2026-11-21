import { useState, useEffect, useCallback } from 'react'
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Trophy } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { Card, EmptyNote, PrimaryButton, useTone } from '../components/campusConnect/CampusKit'
import { supabase } from '../lib/supabase'
import { RANKING_MIN_MEMBERS, useCampus } from '../lib/campus'
import { fonts } from '../constants/theme'

// Campus ranked: colleges compared by how much their members use shared
// resources, per member. Real data only, and a college shows only once
// RANKING_MIN_MEMBERS members have it as their campus, so no small group is
// singled out. The score counts notes and past papers shared, downloads of
// them, busy spot reports and study room hand overs.
export default function CampusRankedScreen({ navigation }) {
  const { colors, accent, tint } = useTone('campus')
  const insets = useSafeAreaInsets()
  const campus = useCampus()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setFailed(false)
    const { data, error } = await supabase.rpc('campus_ranking', { p_min_members: RANKING_MIN_MEMBERS })
    if (error) setFailed(true)
    else setRows(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <PageTitle title="Campus ranked" subtitle="Which college uses its resources best." />
        <View style={s.body}>
          {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.textPrimary} />
          : failed ? (
            <EmptyNote title="Could not load the ranking" body="Check your connection and try again.">
              <PrimaryButton label="Try again" onPress={load} />
            </EmptyNote>
          ) : rows.length === 0 ? (
            <EmptyNote Icon={Trophy} title="No college is ranked yet" body={`A college appears once ${RANKING_MIN_MEMBERS} members have joined from it. Invite your friends and share notes to get yours on the board.`} />
          ) : (
            <>
              <Text style={[s.meta, { color: colors.textSecondary }]}>
                Score is resources shared, downloads, busy spot reports and study room hand overs, per member.
              </Text>
              {rows.map(r => {
                const mine = campus.institution && r.institution === campus.institution
                return (
                  <Card key={r.institution} style={[{ marginTop: 12 }, mine && { borderWidth: 1.5, borderColor: accent }]}>
                    <View style={s.row}>
                      <View style={[s.rank, { backgroundColor: tint }]}><Text style={[s.rankText, { color: accent }]}>{r.rank}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.name, { color: colors.textPrimary }]}>{r.institution}{mine ? '  (yours)' : ''}</Text>
                        <Text style={[s.meta, { color: colors.textSecondary }]}>{Number(r.members).toLocaleString('en-IE')} members</Text>
                      </View>
                      <Text style={[s.score, { color: colors.textPrimary }]}>{Number(r.score).toFixed(1)}</Text>
                    </View>
                    <Text style={[s.meta, { color: colors.textSecondary, marginTop: 10 }]}>
                      {r.resources_shared} shared, {r.downloads} downloads, {r.spot_reports} spot reports, {r.rooms_handed_over} rooms handed over
                    </Text>
                  </Card>
                )
              })}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  meta: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontFamily: fonts.serif, fontSize: 20 },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22 },
  score: { fontFamily: fonts.serif, fontSize: 28 },
})
