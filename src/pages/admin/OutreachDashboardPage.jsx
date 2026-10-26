import { useState, useEffect, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Inbox, Users, UserCheck, TrendingUp, Heart, AlertCircle,
  PhoneCall, HeartHandshake, Handshake, Megaphone,
} from 'lucide-react'
import {
  StudioShell, StudioCard as Card, SectionTitle, EmptyNote, StatStrip, MetricBarChart, ComparisonWidget, StatusDot, TaskBoard, RequestPanel,
  NAVY, CREAM, GREY, MUTED, GREEN, AMBER, RED, HUB_ACCENTS, FONT_SERIF, FONT_SANS,
  StudioField, STUDIO_INPUT, STUDIO_SELECT_SM, studioButton, tint,
  GlanceCard, MiniCalendar, ActivityHeatmap, getStatusColor,
} from '../../components/studio'
import {
  getOutreachInboundPipeline, getOutreachCoachRecruitmentSnapshot, getOutreachPartnerSnapshot,
  getOutreachPartnerGrowthByMonth, getOutreachPartnerFollowTrendByMonth,
  getOutreachContacts, createOutreachContact, setOutreachContactStatus, getOutreachContactsSignedComparison,
  getTeamTasks, getTeamRoster, createTeamTask, setTeamTaskStatus,
  listStudioRequests, createStudioRequest, approveStudioRequest, denyStudioRequest,
  getTaskDueDateDensity, getTeamActivityHeatmap,
} from '../../lib/studioMetrics'

// Outreach Hub (Studio Phase 4) -- for Sienna, Ethan, Fabz and James, the
// team that grows and maintains UBP's real-world partner/coach/community
// relationships (recruiting Lifestyle Blueprint partners and Elevation
// coaches, inbound application/enquiry handling, outreach campaigns). Built
// on the Studio component library from Phases 1-3 (StudioShell/
// MetricBarChart/ComparisonWidget/TaskBoard etc.), gated by the new
// 'outreach' app_role the same way finance/legal/tech already are.
//
// Real data throughout, via supabase/migrations/20261022190000_outreach_role_
// enum.sql and 20261022190100_outreach_hub_schema.sql:
//   - Inbound pipeline: all 8 real enquiry/application tables Outreach is
//     the natural owner of, genuinely 0 rows each today -- an honest
//     pre-launch "0 inbound right now", not a broken chart. A live query,
//     not a cached snapshot, so it fills in on its own.
//   - Coach recruitment: surfaces the real fact (checked live, same as
//     Legal Hub's own finding on coach_profiles) that ZERO real, live
//     coaches exist today -- 13 of 16 coach_profiles rows are seed
//     listings with no real person behind them, the other 3 belong to
//     banned demo/QA accounts. Shown prominently, not buried.
//   - Partner growth/engagement: real partners.created_at growth (34
//     total, 7 synthetic "Example/Placeholder/Sample" rows excluded, same
//     as Legal Hub) and real partner_follows trend (20 rows, but 19 of 20
//     belong to banned demo/QA accounts -- only 1 real follow exists
//     today). Both genuinely near-zero, not padded.
//   - Outreach Log: the new outreach_contacts / outreach_contact_status_log
//     tables -- no structured record of partner/coach outreach existed
//     before this. Seeded EMPTY on purpose (see that migration's header
//     for why a known real round of outreach emails this session was NOT
//     back-filled here) -- every row from here on is logged through real
//     use of this page.
//   - Campaign Task Board: the existing generic team_tasks table (Legal
//     Hub, Studio Phase 2) with team='outreach' -- no new task table,
//     exactly what it was built generic for.
//
// CONFIRMED, not changed (Studio Phase 11, was TODO(phase-2-access-system)):
// re-checked live before building the new lead-tier access system -- the
// brief still names no lead among Sienna/Ethan/Fabz/James, so every RPC
// this page calls stays gated on the whole outreach/founder/admin group,
// an honest team-wide "everyone sees the data" gate, not a fabricated lead.
// user_roles.is_lead exists for Outreach too (schema is generic) and
// _is_team_lead_or_admin('outreach') works the moment a real lead is named
// -- Studio Phase 11 also adds a real cross-hub Requests section below
// (hand a task to another hub, or ask for access into one), the "no
// access-request flow anywhere" gap the audit flagged.

const TEAM = 'outreach'

const ENTITY_TYPE_LABELS = { partner: 'Partner', coach: 'Coach', ambassador: 'Ambassador', handler: 'Campus Handler', other: 'Other' }
const CONTACT_STATUS_LABELS = { contacted: 'Contacted', responded: 'Responded', declined: 'Declined', signed: 'Signed' }
const CONTACT_STATUS_DOT = { contacted: 'grey', responded: 'yellow', declined: 'red', signed: 'green' }

const PAGE_STYLES = `
  .oh-two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
  @media (max-width: 1100px) { .oh-two-col { grid-template-columns: minmax(0, 1fr); } }
`

function fmt(n) { return n === null || n === undefined ? '—' : n.toLocaleString('en-IE') }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }
function todayLocalISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}


export default function OutreachDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [pipeline, setPipeline] = useState([])
  const [coachSnapshot, setCoachSnapshot] = useState(null)
  const [partnerSnapshot, setPartnerSnapshot] = useState(null)
  const [partnerGrowth, setPartnerGrowth] = useState([])
  const [followTrend, setFollowTrend] = useState([])

  const [contacts, setContacts] = useState([])
  const [comparisonWindow, setComparisonWindow] = useState('week')
  const [comparison, setComparison] = useState(null)

  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [requests, setRequests] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [
        pipelineRes, coachRes, partnerRes, growthRes, followRes,
        contactsRes, compareRes, tasksRes, membersRes, requestsRes,
      ] = await Promise.all([
        getOutreachInboundPipeline(),
        getOutreachCoachRecruitmentSnapshot(),
        getOutreachPartnerSnapshot(),
        getOutreachPartnerGrowthByMonth(),
        getOutreachPartnerFollowTrendByMonth(),
        getOutreachContacts(),
        getOutreachContactsSignedComparison(comparisonWindow),
        getTeamTasks(TEAM),
        getTeamRoster(TEAM),
        listStudioRequests(TEAM),
      ])
      setPipeline(pipelineRes.value || [])
      setCoachSnapshot(coachRes.value || null)
      setPartnerSnapshot(partnerRes.value || null)
      setPartnerGrowth(growthRes.value || [])
      setFollowTrend(followRes.value || [])
      setContacts(contactsRes.value || [])
      setComparison(compareRes.value || null)
      setTasks(tasksRes.value || [])
      setMembers(membersRes.value || [])
      setRequests(requestsRes.value || [])
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [comparisonWindow])

  useEffect(() => { load() }, [load])

  // ── Outreach Log ─────────────────────────────────────────────────────────
  const [contactForm, setContactForm] = useState({
    entityType: 'partner', entityName: '', contactChannel: '', contactedAt: todayLocalISO(), notes: '',
  })
  const [submittingContact, setSubmittingContact] = useState(false)
  const [savingContactId, setSavingContactId] = useState(null)

  async function submitContact() {
    if (!contactForm.entityName.trim()) return
    setSubmittingContact(true)
    try {
      await createOutreachContact({
        entityType: contactForm.entityType,
        entityName: contactForm.entityName.trim(),
        contactChannel: contactForm.contactChannel.trim() || null,
        contactedAt: contactForm.contactedAt ? new Date(contactForm.contactedAt).toISOString() : null,
        notes: contactForm.notes.trim() || null,
        status: 'contacted',
      })
      setContactForm({ entityType: 'partner', entityName: '', contactChannel: '', contactedAt: todayLocalISO(), notes: '' })
      const r = await getOutreachContacts()
      setContacts(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not log that contact.')
    } finally {
      setSubmittingContact(false)
    }
  }

  async function changeContactStatus(id, status) {
    setSavingContactId(id)
    try {
      await setOutreachContactStatus(id, status)
      const r = await getOutreachContacts()
      setContacts(r.value || [])
      const c = await getOutreachContactsSignedComparison(comparisonWindow)
      setComparison(c.value || null)
    } catch (err) {
      setError(err.message || 'Could not update that contact.')
    } finally {
      setSavingContactId(null)
    }
  }

  // ── Campaign Task Board ──────────────────────────────────────────────────
  async function addTask(fields) {
    try {
      await createTeamTask(TEAM, fields)
      const r = await getTeamTasks(TEAM)
      setTasks(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not create that task.')
    }
  }
  async function changeTaskStatus(id, status) {
    try {
      await setTeamTaskStatus(id, status)
      const r = await getTeamTasks(TEAM)
      setTasks(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not update that task.')
    }
  }

  // ── Requests (Studio Phase 11 -- cross-hub task handoff / access requests) ──
  async function createRequest(fields) {
    try {
      await createStudioRequest(fields)
      const r = await listStudioRequests(TEAM)
      setRequests(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not send that request.')
    }
  }
  async function approveRequest(id, note, assignTo) {
    try {
      await approveStudioRequest(id, note, assignTo)
      const [r, t] = await Promise.all([listStudioRequests(TEAM), getTeamTasks(TEAM)])
      setRequests(r.value || [])
      setTasks(t.value || [])
    } catch (err) {
      setError(err.message || 'Could not approve that request.')
    }
  }
  async function denyRequest(id, note) {
    try {
      await denyStudioRequest(id, note)
      const r = await listStudioRequests(TEAM)
      setRequests(r.value || [])
    } catch (err) {
      setError(err.message || 'Could not deny that request.')
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const contactsByStatus = useMemo(() => {
    const counts = { contacted: 0, responded: 0, declined: 0, signed: 0 }
    for (const c of contacts) counts[c.status] = (counts[c.status] || 0) + 1
    return counts
  }, [contacts])

  const tasksByStatus = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 }
    for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1
    return counts
  }, [tasks])

  const totalPipeline = pipeline.reduce((s, p) => s + (p.pipeline_count || 0), 0)

  const sections = [
    { id: 'oh-health', label: 'Health Overview' },
    { id: 'oh-log', label: 'Outreach Log' },
    { id: 'oh-comparison', label: 'Comparison' },
    { id: 'oh-tasks', label: 'Campaign Task Board' },
    { id: 'oh-activity', label: 'Calendar & Activity' },
    { id: 'oh-requests', label: 'Requests' },
  ]

  // Studio Phase 13 -- memoized so MiniCalendar/ActivityHeatmap fetch
  // exactly once per scope/mount, not on every render.
  const fetchDueDates = useCallback(scope => getTaskDueDateDensity(TEAM, scope), [])
  const fetchHeatmap = useCallback(d => getTeamActivityHeatmap(TEAM, d), [])

  // Studio Phase 13 -- real month-by-month new-partner counts, oldest ->
  // newest, backing the "Real partners" StatStrip sparkline below. Same
  // real feed as the partner-growth trend chart, just reshaped to a plain
  // number array for Sparkline.
  const partnerGrowthTrend = partnerGrowth.map(m => m.new_partners)

  const heroCharts = [
    {
      key: 'inbound-pipeline', eyebrow: 'Live', title: 'Inbound pipeline by type',
      caption: totalPipeline === 0
        ? 'Genuinely 0 across all 8 enquiry/application tables today -- a real, honest pre-launch state (not a filtered-down or broken query). Fills in on its own the moment real inbound activity happens.'
        : `${fmt(totalPipeline)} real inbound records across all enquiry/application types.`,
      data: pipeline.map(p => ({ name: p.display_label, value: p.pipeline_count, color: HUB_ACCENTS.outreach })),
      emptyLabel: 'No pipeline data yet.',
      nameWidth: 160,
    },
    {
      key: 'coach-recruitment', eyebrow: 'Important', title: 'Coach recruitment',
      caption: 'Real coach_profiles breakdown, a genuinely proportional mix -- not a vanity metric to round up. Seed listings have no real person behind them at all; the rest belong to banned demo/QA accounts.',
      type: 'donut',
      data: coachSnapshot ? [
        { name: 'Real live coaches', value: coachSnapshot.real_live_coaches, color: coachSnapshot.real_live_coaches > 0 ? getStatusColor('green') : getStatusColor('red') },
        { name: 'Banned demo accounts', value: coachSnapshot.banned_demo_accounts, color: getStatusColor('grey') },
        { name: 'Seed listings (no real person)', value: coachSnapshot.seed_listings, color: getStatusColor('grey') },
      ] : [],
      emptyLabel: 'No coach_profiles rows found.',
    },
    {
      key: 'partner-growth', eyebrow: 'Growth', title: 'Partner growth (new, real, per month)',
      caption: 'Real partners.created_at, by month, excluding the 7 synthetic "Example/Placeholder/Sample" rows -- includes real zero months, not skipped.',
      type: 'trend',
      data: partnerGrowth.map(m => ({ x: m.month_label, y: m.new_partners })),
      emptyLabel: 'Not enough real partner growth yet to show a trend.',
    },
    {
      key: 'follow-trend', eyebrow: 'Engagement', title: 'Partner follows (real, per month)',
      caption: '19 of 20 partner_follows rows belong to banned demo/QA accounts -- excluded here. Only 1 real follow exists today. Honestly near-all-zero, not a broken chart.',
      type: 'trend',
      data: followTrend.map(m => ({ x: m.month_label, y: m.new_follows })),
      emptyLabel: 'Not enough real engagement yet to show a trend.',
    },
  ]

  return (
    <>
      <Helmet>
        <title>Outreach Hub | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <StudioShell
        heroChartsLoading={loading}
        hubKey="outreach"
        title="Outreach Hub"
        subtitle="Inbound pipeline, partner/coach recruitment, the outreach log, and the campaign task board -- for Sienna, Ethan, Fabz and James. Real data throughout, excluding banned demo/QA accounts and synthetic partner rows. Read/write access is team-wide today, see the Outreach Log note below."
        accentColor={HUB_ACCENTS.outreach}
        heroCharts={heroCharts}
        sections={sections}
        glanceCard={(
          <GlanceCard
            accentColor={HUB_ACCENTS.outreach}
            loading={loading}
            items={[
              { key: 'real-partners', label: 'Real partners', value: fmt(partnerSnapshot?.real_partners), sub: `${fmt(partnerSnapshot?.active_partners)} active` },
              { key: 'live-coaches', label: 'Real, live coaches', value: fmt(coachSnapshot?.real_live_coaches), health: coachSnapshot && coachSnapshot.real_live_coaches === 0 ? 'critical' : 'good' },
              { key: 'contacts-signed', label: 'Contacts signed', value: fmt(contactsByStatus.signed), sub: `of ${fmt(contacts.length)} logged` },
            ]}
          />
        )}
        error={!!error && (
          <Card style={{ marginBottom: 'var(--studio-gap)', border: `1px solid ${RED}`, background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: RED, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </p>
          </Card>
        )}
      >

        {/* ══ HEALTH OVERVIEW ══════════════════════════════════════════ */}
        <div id="oh-health" >
          <Card style={{ marginBottom: 'var(--studio-gap)' }}>
            <SectionTitle eyebrow="Snapshot" title="Partners & top-of-funnel at a glance"
              caption="Real counts, excluding the 7 synthetic 'Example/Placeholder/Sample' partner rows Legal Hub also found and excluded." />
            <StatStrip
              columns={4}
              cells={[
                { key: 'real-partners', label: 'Real partners', value: fmt(partnerSnapshot?.real_partners), icon: Handshake, accent: HUB_ACCENTS.outreach, trend: partnerGrowthTrend },
                { key: 'active-partners', label: 'Active partners', value: fmt(partnerSnapshot?.active_partners), icon: UserCheck, accent: GREEN },
                { key: 'verified-partners', label: 'Verified partners', value: fmt(partnerSnapshot?.verified_partners), icon: UserCheck, accent: partnerSnapshot?.verified_partners > 0 ? GREEN : AMBER },
                { key: 'early-access', label: 'Early access signups', value: fmt(partnerSnapshot?.early_access_signups), icon: Heart, accent: NAVY },
              ]}
            />
          </Card>

          <div className="oh-two-col" style={{ marginBottom: 'var(--studio-gap)' }}>
            <Card>
              <SectionTitle eyebrow="Drill-down" title="Inbound pipeline, full breakdown"
                caption="Every real enquiry/application table, by exact type." />
              {pipeline.length === 0 ? (
                <EmptyNote><Inbox size={12} /> No pipeline data yet.</EmptyNote>
              ) : (
                <div className="studio-table-wrap">
                  <table className="studio-table">
                    <thead><tr><th>Type</th><th>Count</th></tr></thead>
                    <tbody>
                      {pipeline.map(p => (
                        <tr key={p.entity_type}>
                          <td style={{ fontWeight: 600 }}>{p.display_label}</td>
                          <td>{fmt(p.pipeline_count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p style={{ fontFamily: FONT_SANS, fontSize: '12px', color: GREY, lineHeight: 1.5, margin: '12px 0 0' }}>
                Referrals (attribution-only, no reward attached): {fmt(partnerSnapshot?.referrals_count)} -- genuinely 0 today.
              </p>
            </Card>

            <Card>
              <SectionTitle eyebrow="Important" title="Real coach recruitment"
                caption="checked live against coach_profiles -- this is the real number, not rounded up." />
              {coachSnapshot ? (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px',
                    background: tint(coachSnapshot.real_live_coaches > 0 ? GREEN : RED, 0.06),
                    border: `1px solid ${tint(coachSnapshot.real_live_coaches > 0 ? GREEN : RED, 0.35)}`, marginBottom: '12px',
                  }}>
                    <StatusDot status={coachSnapshot.real_live_coaches > 0 ? 'green' : 'red'} size={10} />
                    <p style={{ fontFamily: FONT_SANS, fontSize: '13px', color: NAVY, margin: 0, lineHeight: 1.55 }}>
                      <strong>{fmt(coachSnapshot.real_live_coaches)} real, live Elevation coach{coachSnapshot.real_live_coaches === 1 ? '' : 'es'}</strong> today
                      {coachSnapshot.real_live_coaches === 0 && ' -- real coach recruitment has not landed a single live coach yet. This is the real state, not a vanity metric to hide.'}
                    </p>
                  </div>
                  <p style={{ fontFamily: FONT_SANS, fontSize: '12.5px', color: GREY, lineHeight: 1.6, margin: 0 }}>
                    Of {fmt(coachSnapshot.total_coach_profiles)} total coach_profiles rows: {fmt(coachSnapshot.seed_listings)} are seed listings with no real signed-up person behind them at all, and {fmt(coachSnapshot.banned_demo_accounts)} belong to banned demo/QA accounts.
                  </p>
                </>
              ) : <EmptyNote><Users size={12} /> Loading…</EmptyNote>}
            </Card>
          </div>
        </div>

        {/* ══ OUTREACH LOG ═════════════════════════════════════════════ */}
        <Card id="oh-log" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="New" title="Outreach Log"
            caption="Real log of who's been contacted, when, and the outcome -- nothing structured existed for this before. Seeded empty on purpose (a real round of outreach emails is known to have happened this session via Gmail, but could not be safely/unambiguously counted from here -- see the migration's own note). Every row below is a real one, logged by Sienna/Ethan/Fabz/James as outreach actually happens." />
          {/* CONFIRMED, not changed (Studio Phase 11, was TODO(phase-2-
              access-system)): re-checked live -- the brief still names no
              lead among Sienna/Ethan/Fabz/James, so this stays an honest
              team-wide gate, not a fabricated one. The is_lead column now
              exists on user_roles for Outreach too (schema is generic),
              ready the day the founder actually names a lead for this team. */}
          <div className="studio-form-panel">
            <div className="studio-form-row" style={{ gridTemplateColumns: '0.9fr 1.3fr 1fr 1fr 1.6fr auto' }}>
              <StudioField label="Type">
                <select value={contactForm.entityType} onChange={e => setContactForm(f => ({ ...f, entityType: e.target.value }))} style={STUDIO_INPUT}>
                  {Object.keys(ENTITY_TYPE_LABELS).map(k => <option key={k} value={k}>{ENTITY_TYPE_LABELS[k]}</option>)}
                </select>
              </StudioField>
              <StudioField label="Name">
                <input type="text" value={contactForm.entityName} onChange={e => setContactForm(f => ({ ...f, entityName: e.target.value }))}
                  placeholder="Who was contacted..." style={STUDIO_INPUT} />
              </StudioField>
              <StudioField label="Channel">
                <input type="text" value={contactForm.contactChannel} onChange={e => setContactForm(f => ({ ...f, contactChannel: e.target.value }))}
                  placeholder="Email, phone..." style={STUDIO_INPUT} />
              </StudioField>
              <StudioField label="Contacted">
                <input type="date" value={contactForm.contactedAt} onChange={e => setContactForm(f => ({ ...f, contactedAt: e.target.value }))}
                  style={STUDIO_INPUT} />
              </StudioField>
              <div className="studio-form-wide">
                <StudioField label="Notes">
                  <input type="text" value={contactForm.notes} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional detail..." style={STUDIO_INPUT} />
                </StudioField>
              </div>
              <button
                type="button" disabled={submittingContact || !contactForm.entityName.trim()} onClick={submitContact}
                className="studio-form-wide"
                style={studioButton(HUB_ACCENTS.outreach, !!contactForm.entityName.trim())}
              >
                <PhoneCall size={14} /> Log contact
              </button>
            </div>
          </div>

          <StatStrip
            columns={4}
            style={{ marginBottom: '16px' }}
            cells={[
              { key: 'contacted', label: 'Contacted', value: fmt(contactsByStatus.contacted), icon: PhoneCall, accent: MUTED },
              { key: 'responded', label: 'Responded', value: fmt(contactsByStatus.responded), icon: Megaphone, accent: AMBER },
              { key: 'declined', label: 'Declined', value: fmt(contactsByStatus.declined), icon: AlertCircle, accent: RED },
              { key: 'signed', label: 'Signed', value: fmt(contactsByStatus.signed), icon: HeartHandshake, accent: GREEN },
            ]}
          />

          {contacts.length === 0 ? (
            <EmptyNote><Inbox size={12} /> No outreach logged yet -- use the form above to log the first real contact attempt.</EmptyNote>
          ) : (
            <div className="studio-table-wrap">
              <table className="studio-table">
                <thead><tr><th>Name</th><th>Type</th><th>Channel</th><th>Status</th><th>Notes</th><th>Contacted</th><th>Logged by</th></tr></thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.entity_name}</td>
                      <td>{ENTITY_TYPE_LABELS[c.entity_type] || c.entity_type}</td>
                      <td>{c.contact_channel || '—'}</td>
                      <td>
                        <select
                          value={c.status}
                          disabled={savingContactId === c.id}
                          onChange={e => changeContactStatus(c.id, e.target.value)}
                          style={STUDIO_SELECT_SM}
                        >
                          {Object.keys(CONTACT_STATUS_LABELS).map(s => <option key={s} value={s}>{CONTACT_STATUS_LABELS[s]}</option>)}
                        </select>
                        <span style={{ marginLeft: '10px', display: 'inline-flex', verticalAlign: 'middle' }}><StatusDot status={CONTACT_STATUS_DOT[c.status]} /></span>
                      </td>
                      <td style={{ minWidth: '200px', maxWidth: '240px', whiteSpace: 'normal', color: c.notes ? GREY : MUTED }}>{c.notes || '—'}</td>
                      <td>{fmtDate(c.contacted_at)}</td>
                      <td>{c.logged_by_label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ══ COMPARISON ═══════════════════════════════════════════════ */}
        <div id="oh-comparison" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="Progress" title="What You've Got vs What You're Missing"
            caption="Real outreach contacts whose status moved to Signed this window vs the window before it, from outreach_contact_status_log -- an append-only history, not a guess. Like Legal's contracts-resolved and Tech's ideas-triaged comparisons, this is a single hub-wide total, not a cohort of comparable people -- there is no real 'top performer' or 'category floor' to rank against, so top/lowest are left honestly blank; only the self-vs-last-period row below is real." />
          <ComparisonWidget
            entityLabel="Contacts signed"
            value={comparison?.signed_this_period ?? null}
            topValue={null}
            lowestValue={null}
            lastPeriodValue={comparison?.signed_last_period ?? null}
            unit="contacts"
            window={comparisonWindow}
            onWindowChange={setComparisonWindow}
            accentColor={HUB_ACCENTS.outreach}
            loading={loading}
            emptyNote={comparison && comparison.signed_this_period === 0 && comparison.signed_last_period === 0
              ? 'No outreach contacts have moved to Signed yet this window or last -- honest 0s, the Outreach Log above is seeded empty, this fills in as real outreach closes out.'
              : null}
          />
        </div>

        {/* ══ CAMPAIGN TASK BOARD ══════════════════════════════════════ */}
        <Card id="oh-tasks" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="New" title="Campaign Task Board"
            caption="Real, generic team_tasks rows for the Outreach team (the same reusable TaskBoard component Legal/Tech use) -- outreach campaigns, targets, batches, and delegated work Sienna/Ethan/Fabz/James assign to each other. Seeded empty on purpose -- nothing below is a placeholder." />
          <StatStrip
            columns={3}
            style={{ marginBottom: '16px' }}
            cells={[
              { key: 'todo', label: 'To do', value: fmt(tasksByStatus.todo), icon: Inbox, accent: MUTED },
              { key: 'in-progress', label: 'In progress', value: fmt(tasksByStatus.in_progress), icon: TrendingUp, accent: AMBER },
              { key: 'done', label: 'Done', value: fmt(tasksByStatus.done), icon: HeartHandshake, accent: GREEN },
            ]}
          />
          <TaskBoard
            tasks={tasks}
            members={members}
            loading={loading}
            onCreate={addTask}
            onStatusChange={changeTaskStatus}
            accentColor={HUB_ACCENTS.outreach}
            emptyLabel="No campaign tasks yet -- add the first real one above."
          />
        </Card>

        {/* ══ CALENDAR & ACTIVITY ══════════════════════════════════════
            Studio Phase 13 -- real team_tasks.target_date due-date density
            and a real contribution-style activity heatmap off
            outreach_contact_status_log + team_tasks. */}
        <div id="oh-activity" className="oh-two-col" style={{ marginTop: 'var(--studio-gap)' }}>
          <Card>
            <SectionTitle eyebrow="New" title="Due-date calendar"
              caption="Real team_tasks.target_date rows for the Outreach team. 'UBP-wide' covers every hub's tasks -- founder/co_director/admin only." />
            <MiniCalendar team={TEAM} accentColor={HUB_ACCENTS.outreach} canViewAll onFetchScope={fetchDueDates} />
          </Card>
          <Card>
            <SectionTitle eyebrow="New" title="Activity heatmap"
              caption="Real per-day event density for the Outreach team over the last ~26 weeks -- outreach_contact_status_log changes plus team_tasks created/closed activity." />
            <ActivityHeatmap team={TEAM} accentColor={HUB_ACCENTS.outreach} onFetch={fetchHeatmap} exportFilename="outreach-activity-heatmap" />
          </Card>
        </div>

        {/* ══ REQUESTS ═══════════════════════════════════════════════════
            Studio Phase 11 -- cross-hub task handoff / access requests. */}
        <Card id="oh-requests" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="New" title="Requests"
            caption="Hand a task to a different hub, or ask another hub's leads for access -- real studio_requests rows, both directions. Approving a task handoff actually moves it to that hub's own board." />
          <RequestPanel
            team={TEAM}
            requests={requests}
            tasks={tasks}
            members={members}
            loading={loading}
            onCreate={createRequest}
            onApprove={approveRequest}
            onDeny={denyRequest}
            accentColor={HUB_ACCENTS.outreach}
          />
        </Card>

      </StudioShell>
    </>
  )
}
