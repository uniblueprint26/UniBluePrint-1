import { useState, useEffect, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Eye, MousePointerClick, Mail, Star, TrendingUp, AlertCircle,
  Inbox, HeartHandshake, ToggleLeft, ToggleRight, Save,
} from 'lucide-react'
import {
  StudioShell, StudioCard as Card, SectionTitle, EmptyNote, StatStrip, ComparisonWidget, StatusDot, TaskBoard, RequestPanel,
  NAVY, CREAM, GREY, MUTED, GREEN, AMBER, RED, HUB_ACCENTS, FONT_SERIF, FONT_SANS,
  GlanceCard, tint,
} from '../../components/studio'
import {
  getMarketingEngagementFunnel, getMarketingEngagementByPartner, getMarketingDealClaimsComparison,
  getMarketingEarlyAccessSignups, getMarketingEarlyAccessSignupsByMonth,
  getMarketingFeaturedContent, setMarketingFeaturedContentActive, updateMarketingFeaturedContentDetails,
  getTeamTasks, getTeamRoster, createTeamTask, setTeamTaskStatus,
  listStudioRequests, createStudioRequest, approveStudioRequest, denyStudioRequest,
} from '../../lib/studioMetrics'

// Marketing Hub (Studio Phase 5) -- for Alex, Elizabeth, Ethan and Fabz, the
// team that grows top-of-funnel awareness and curates what gets promoted.
// Built on the Studio component library from Phases 1-4 (StudioShell/
// MetricBarChart/ComparisonWidget/TaskBoard etc.), gated by the new
// 'marketing' app_role the same way finance/legal/tech/outreach already are.
//
// Real data throughout, via supabase/migrations/20261022200000_marketing_
// role_enum.sql and 20261022200100_marketing_hub_schema.sql:
//   - Deal engagement funnel: activity_events' real partner_deal_viewed/
//     partner_deal_claimed counts, excluding banned demo/QA accounts.
//     Checked live (brief flagged this, re-verified before writing a
//     single query): of 1818 raw rows, 1652 of 1653 views and all 165
//     claims belong to banned accounts -- the real organic funnel is 1
//     view, 0 claims. Shown as that honest near-zero, with the raw totals
//     kept alongside for context, never as the headline number.
//   - Per-partner breakdown: additionally excludes the synthetic "Example/
//     Placeholder/Sample" partner rows Legal/Outreach Hub also exclude --
//     every single contaminated row in this table turned out to belong to
//     one of those synthetic partners. Genuinely one real row today (1
//     view, for "Saiemsent").
//   - Early access signups: the 4 real early_access_signups rows, as a
//     real lead list (with source) and a real month-by-month trend.
//   - Featured Content: the real "what's currently featured" management
//     view over the existing featured_content table (13 real rows, all
//     active today) -- a genuine toggle (pull out of rotation / bring
//     back) and a genuine edit (caption/CTA/display order), writing
//     straight through to the live home-screen carousel. Creating a new
//     pin is out of scope here (see migration header) -- content_type +
//     ref_id must resolve against five different real entity tables, and
//     there's no safe generic picker for that from this pass.
//   - Content & Campaign Task Board: the existing generic team_tasks table
//     (Legal Hub, Studio Phase 2) with team='marketing' -- no new task
//     table. This is also the real tool for blog/content-calendar batches
//     and targets, since blog posts (src/data/blogPosts.js) are static JS,
//     not a database table to build analytics against.
//
// Deliberately left OUT (judgment calls, flagged in the handback report):
// referrals (0 rows, attribution-only, already surfaced on Outreach Hub --
// showing it here too would double-count the same fact under a second
// hub), ads/student_ads (0 real rows, but that's a business-development
// fact about Ad Board inventory, not something Marketing's own campaign
// work drives), and weekly_issues/content/reading_progress (0 rows, real
// but genuinely unused infrastructure with no authoring workflow anywhere
// in this codebase yet -- an honest zero with nothing behind it would be
// noise, not signal, unlike Outreach's empty-but-wired inbound pipeline).
//
// CONFIRMED, not changed (Studio Phase 11, was TODO(phase-2-access-system)):
// re-checked live before building the new lead-tier access system -- the
// brief still names no lead among Alex/Elizabeth/Ethan/Fabz, so every RPC
// this page calls stays gated on the whole marketing/founder/admin group,
// an honest team-wide "everyone sees the data" gate, not a fabricated
// lead. user_roles.is_lead exists for Marketing too (schema is generic)
// and works the moment a real lead is named -- Studio Phase 11 also adds
// a real cross-hub Requests section below (hand a task to another hub, or
// ask for access into one), the "no access-request flow anywhere" gap
// the audit flagged.

const TEAM = 'marketing'

const CONTENT_TYPE_LABELS = {
  foundation_service: 'Foundation service', coach: 'Coach', lifestyle_partner: 'Lifestyle partner',
  campus_board: 'Campus board', course_board: 'Course board',
}

const PAGE_STYLES = `
  .mh-two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
  .mh-edit-input { font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: #1E3A5F; height: 32px; padding: 0 9px; border-radius: 7px; border: 1px solid rgba(30,58,95,0.16); background: #FFFFFF; width: 100%; box-sizing: border-box; }
  .mh-edit-input:focus { outline: none; border-color: var(--studio-accent); box-shadow: 0 0 0 3px var(--studio-accent-tint); }
  @media (max-width: 1100px) { .mh-two-col { grid-template-columns: minmax(0, 1fr); } }
`

function fmt(n) { return n === null || n === undefined ? '—' : n.toLocaleString('en-IE') }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }


export default function MarketingDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [funnel, setFunnel] = useState(null)
  const [byPartner, setByPartner] = useState([])
  const [comparisonWindow, setComparisonWindow] = useState('week')
  const [comparison, setComparison] = useState(null)

  const [signups, setSignups] = useState([])
  const [signupsByMonth, setSignupsByMonth] = useState([])

  const [featured, setFeatured] = useState([])
  const [featuredDrafts, setFeaturedDrafts] = useState({})
  const [savingFeaturedId, setSavingFeaturedId] = useState(null)

  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [requests, setRequests] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [
        funnelRes, byPartnerRes, compareRes, signupsRes, signupsMonthRes, featuredRes, tasksRes, membersRes, requestsRes,
      ] = await Promise.all([
        getMarketingEngagementFunnel(),
        getMarketingEngagementByPartner(),
        getMarketingDealClaimsComparison(comparisonWindow),
        getMarketingEarlyAccessSignups(),
        getMarketingEarlyAccessSignupsByMonth(),
        getMarketingFeaturedContent(),
        getTeamTasks(TEAM),
        getTeamRoster(TEAM),
        listStudioRequests(TEAM),
      ])
      setFunnel(funnelRes.value || null)
      setByPartner(byPartnerRes.value || [])
      setComparison(compareRes.value || null)
      setSignups(signupsRes.value || [])
      setSignupsByMonth(signupsMonthRes.value || [])
      const featuredRows = featuredRes.value || []
      setFeatured(featuredRows)
      setFeaturedDrafts(Object.fromEntries(featuredRows.map(f => [f.id, {
        caption: f.caption || '', ctaLabel: f.cta_label || '', priority: String(f.priority ?? 0),
      }])))
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

  // ── Featured Content ─────────────────────────────────────────────────────
  async function toggleFeaturedActive(id, active) {
    setSavingFeaturedId(id)
    try {
      await setMarketingFeaturedContentActive(id, active)
      const r = await getMarketingFeaturedContent()
      const rows = r.value || []
      setFeatured(rows)
      setFeaturedDrafts(Object.fromEntries(rows.map(f => [f.id, {
        caption: f.caption || '', ctaLabel: f.cta_label || '', priority: String(f.priority ?? 0),
      }])))
    } catch (err) {
      setError(err.message || 'Could not update that featured content row.')
    } finally {
      setSavingFeaturedId(null)
    }
  }

  async function saveFeaturedDraft(id) {
    const draft = featuredDrafts[id]
    if (!draft) return
    setSavingFeaturedId(id)
    try {
      await updateMarketingFeaturedContentDetails(id, {
        caption: draft.caption.trim() || null,
        ctaLabel: draft.ctaLabel.trim() || null,
        priority: draft.priority !== '' ? Number(draft.priority) : null,
      })
      const r = await getMarketingFeaturedContent()
      const rows = r.value || []
      setFeatured(rows)
      setFeaturedDrafts(Object.fromEntries(rows.map(f => [f.id, {
        caption: f.caption || '', ctaLabel: f.cta_label || '', priority: String(f.priority ?? 0),
      }])))
    } catch (err) {
      setError(err.message || 'Could not save that featured content row.')
    } finally {
      setSavingFeaturedId(null)
    }
  }

  function updateDraft(id, field, value) {
    setFeaturedDrafts(d => ({ ...d, [id]: { ...d[id], [field]: value } }))
  }

  // ── Content & Campaign Task Board ───────────────────────────────────────
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
  const tasksByStatus = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 }
    for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1
    return counts
  }, [tasks])

  const featuredByType = useMemo(() => {
    const counts = {}
    for (const f of featured) if (f.active) counts[f.content_type] = (counts[f.content_type] || 0) + 1
    return counts
  }, [featured])

  const activeFeaturedCount = featured.filter(f => f.active).length

  const sections = [
    { id: 'mh-health', label: 'Health Overview' },
    { id: 'mh-featured', label: 'Featured Content' },
    { id: 'mh-leads', label: 'Early Access Leads' },
    { id: 'mh-comparison', label: 'Comparison' },
    { id: 'mh-tasks', label: 'Content & Campaign Task Board' },
    { id: 'mh-requests', label: 'Requests' },
  ]

  const heroCharts = [
    {
      key: 'engagement-funnel', eyebrow: 'Real, banned-excluded', title: 'Deal views → claims',
      caption: funnel
        ? `Of ${fmt(funnel.total_views)} raw views and ${fmt(funnel.total_claims)} raw claims logged, ${fmt(funnel.banned_views)} views and all ${fmt(funnel.banned_claims)} claims belong to banned demo/QA accounts. The real organic funnel is honestly near-zero today -- not padded.`
        : 'Loading…',
      data: funnel ? [
        { name: 'Real views', value: funnel.real_views, color: HUB_ACCENTS.marketing },
        { name: 'Real claims', value: funnel.real_claims, color: funnel.real_claims > 0 ? GREEN : RED },
      ] : [],
      emptyLabel: 'Loading…',
    },
    {
      key: 'early-access-trend', eyebrow: 'Top of funnel', title: 'Early access signups (real, per month)',
      caption: 'Real early_access_signups.created_at, by month -- includes real zero months, not skipped. Only 4 real rows exist today.',
      type: 'trend',
      data: signupsByMonth.map(m => ({ x: m.month_label, y: m.signup_count })),
      emptyLabel: 'Not enough real signups yet to show a monthly trend.',
    },
    {
      key: 'featured-by-type', eyebrow: 'Live', title: 'Currently featured, by type',
      caption: `${fmt(activeFeaturedCount)} of ${fmt(featured.length)} featured_content rows are active right now -- a genuinely proportional mix, real rotation shown on the home screen today.`,
      type: 'donut',
      data: Object.keys(CONTENT_TYPE_LABELS).map((k, i) => ({
        name: CONTENT_TYPE_LABELS[k], value: featuredByType[k] || 0, color: tint(HUB_ACCENTS.marketing, 1 - i * 0.14),
      })),
      emptyLabel: 'Nothing currently featured.',
    },
  ]

  return (
    <>
      <Helmet>
        <title>Marketing Hub | UniBlueprint</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{PAGE_STYLES}</style>
      </Helmet>

      <StudioShell
        heroChartsLoading={loading}
        hubKey="marketing"
        title="Marketing Hub"
        subtitle="Real deal engagement, early-access leads, the featured-content rotation, and the content/campaign task board -- for Alex, Elizabeth, Ethan and Fabz. Real data throughout, excluding banned demo/QA accounts and synthetic partner rows. Read/write access is team-wide today, see the notes below."
        accentColor={HUB_ACCENTS.marketing}
        heroCharts={heroCharts}
        sections={sections}
        glanceCard={(
          <GlanceCard
            accentColor={HUB_ACCENTS.marketing}
            loading={loading}
            items={[
              { key: 'featured-active', label: 'Active featured pins', value: fmt(activeFeaturedCount), sub: `of ${fmt(featured.length)} total` },
              { key: 'real-views', label: 'Real deal views', value: fmt(funnel?.real_views), health: funnel?.real_claims > 0 ? 'good' : 'neutral' },
              { key: 'early-access', label: 'Early access signups', value: fmt(signups.length) },
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
        <div id="mh-health" >
          <Card style={{ marginBottom: 'var(--studio-gap)' }}>
            <SectionTitle eyebrow="Snapshot" title="Engagement at a glance"
              caption="Real counts, excluding banned demo/QA accounts. The raw totals are shown as context, never as the headline." />
            <StatStrip
              columns={4}
              cells={[
                { key: 'real-views', label: 'Real deal views', value: fmt(funnel?.real_views), icon: Eye, accent: HUB_ACCENTS.marketing },
                { key: 'real-claims', label: 'Real deal claims', value: fmt(funnel?.real_claims), icon: MousePointerClick, accent: funnel?.real_claims > 0 ? GREEN : AMBER },
                { key: 'early-access', label: 'Early access signups', value: fmt(signups.length), icon: Mail, accent: NAVY },
                { key: 'featured-active', label: 'Active featured pins', value: fmt(activeFeaturedCount), icon: Star, accent: HUB_ACCENTS.marketing },
              ]}
            />
          </Card>

          <Card style={{ marginBottom: 'var(--studio-gap)' }}>
            <SectionTitle eyebrow="Drill-down" title="Per-partner engagement (real)"
              caption="activity_events.detail holds the partner id (confirmed live). Excludes banned demo/QA accounts AND the synthetic 'Example/Placeholder/Sample' partner rows Legal/Outreach Hub also exclude -- every contaminated row in this table belonged to one of those synthetic partners." />
            {byPartner.length === 0 ? (
              <EmptyNote><Inbox size={12} /> No real per-partner engagement yet.</EmptyNote>
            ) : (
              <div className="studio-table-wrap">
                <table className="studio-table">
                  <thead><tr><th>Partner</th><th>Real views</th><th>Real claims</th></tr></thead>
                  <tbody>
                    {byPartner.map(p => (
                      <tr key={p.partner_name}>
                        <td style={{ fontWeight: 600 }}>{p.partner_name}</td>
                        <td>{fmt(p.real_views)}</td>
                        <td>{fmt(p.real_claims)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ══ FEATURED CONTENT ═════════════════════════════════════════ */}
        <Card id="mh-featured" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="Manage" title="Featured Content"
            caption="Real featured_content rows -- what's actually in rotation on the home-screen Spotlight carousel today. Toggle a pin out of rotation or back in, or edit its caption/CTA/display order (lower priority shows first). Writes through to the live carousel immediately. Adding a brand-new pin isn't exposed here -- see the migration's own note on why." />
          {/* CONFIRMED, not changed (Studio Phase 11, was TODO(phase-2-
              access-system)): re-checked live -- the brief still names no
              lead among Alex/Elizabeth/Ethan/Fabz, so this stays an honest
              team-wide gate, not a fabricated one. */}
          {featured.length === 0 ? (
            <EmptyNote><Inbox size={12} /> Loading…</EmptyNote>
          ) : (
            <div className="studio-table-wrap">
              <table className="studio-table">
                <thead><tr><th>Type</th><th>Ref</th><th>Caption</th><th>CTA label</th><th>Priority</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {featured.map(f => {
                    const draft = featuredDrafts[f.id] || { caption: '', ctaLabel: '', priority: '0' }
                    return (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 600 }}>{CONTENT_TYPE_LABELS[f.content_type] || f.content_type}</td>
                        <td style={{ color: GREY }}>{f.ref_id}</td>
                        <td style={{ minWidth: '220px', width: '32%' }}>
                          <input className="mh-edit-input" type="text" value={draft.caption}
                            onChange={e => updateDraft(f.id, 'caption', e.target.value)} placeholder="Editorial caption…" />
                        </td>
                        <td style={{ minWidth: '130px' }}>
                          <input className="mh-edit-input" type="text" value={draft.ctaLabel}
                            onChange={e => updateDraft(f.id, 'ctaLabel', e.target.value)} placeholder="CTA override…" />
                        </td>
                        <td style={{ minWidth: '70px', width: '90px' }}>
                          <input className="mh-edit-input" type="number" value={draft.priority}
                            onChange={e => updateDraft(f.id, 'priority', e.target.value)} />
                        </td>
                        <td>
                          <button
                            type="button" disabled={savingFeaturedId === f.id}
                            onClick={() => toggleFeaturedActive(f.id, !f.active)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none',
                              cursor: savingFeaturedId === f.id ? 'not-allowed' : 'pointer', padding: 0,
                              fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 600, color: f.active ? GREEN : MUTED,
                            }}
                          >
                            {f.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            {f.active ? 'Active' : 'Off'}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button" disabled={savingFeaturedId === f.id}
                            onClick={() => saveFeaturedDraft(f.id)}
                            title="Save caption/CTA/priority"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px', background: HUB_ACCENTS.marketing, color: '#fff',
                              border: 'none', borderRadius: '7px', height: '32px', padding: '0 12px', fontFamily: FONT_SANS, fontSize: '12px', fontWeight: 700,
                              cursor: savingFeaturedId === f.id ? 'not-allowed' : 'pointer', opacity: savingFeaturedId === f.id ? 0.6 : 1,
                            }}
                          >
                            <Save size={12} /> Save
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ══ EARLY ACCESS LEADS ═══════════════════════════════════════ */}
        <Card id="mh-leads" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="Real" title="Early Access Leads"
            caption="Every real early_access_signups row -- a genuine, if small, top-of-funnel lead list. 4 real rows today, nothing padded." />
          {signups.length === 0 ? (
            <EmptyNote><Mail size={12} /> No early access signups yet.</EmptyNote>
          ) : (
            <div className="studio-table-wrap">
              <table className="studio-table">
                <thead><tr><th>Email</th><th>Source</th><th>Marketing consent</th><th>Signed up</th></tr></thead>
                <tbody>
                  {signups.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.email}</td>
                      <td>{s.source || '—'}</td>
                      <td><StatusDot status={s.marketing_consent ? 'green' : 'grey'} showLabel label={s.marketing_consent ? 'Yes' : 'No'} /></td>
                      <td>{fmtDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ══ COMPARISON ═══════════════════════════════════════════════ */}
        <div id="mh-comparison" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="Progress" title="What You've Got vs What You're Missing"
            caption="Real, banned-excluded partner_deal_claimed count this window vs the window before it. Like Legal/Tech/Outreach's own comparisons, this is a single hub-wide total, not a cohort of comparable people -- there is no real 'top performer' or 'category floor' to rank against, so top/lowest are left honestly blank; only the self-vs-last-period row below is real." />
          <ComparisonWidget
            entityLabel="Real deal claims"
            value={comparison?.claims_this_period ?? null}
            topValue={null}
            lowestValue={null}
            lastPeriodValue={comparison?.claims_last_period ?? null}
            unit="claims"
            window={comparisonWindow}
            onWindowChange={setComparisonWindow}
            accentColor={HUB_ACCENTS.marketing}
            loading={loading}
            emptyNote={comparison && comparison.claims_this_period === 0 && comparison.claims_last_period === 0
              ? 'No real (banned-excluded) deal claims exist this window or last -- an honest 0, all 165 raw claim rows belong to banned demo/QA accounts. This fills in the moment a real student claims a real deal.'
              : null}
          />
        </div>

        {/* ══ CONTENT & CAMPAIGN TASK BOARD ════════════════════════════ */}
        <Card id="mh-tasks" style={{ marginTop: 'var(--studio-gap)' }}>
          <SectionTitle eyebrow="New" title="Content & Campaign Task Board"
            caption="Real, generic team_tasks rows for the Marketing team (the same reusable TaskBoard component Legal/Tech/Outreach use) -- content batches, campaign targets, and delegated work Alex/Elizabeth/Ethan/Fabz assign to each other. This is also the real tool for blog/content-calendar planning, since blog posts are static JS files, not a database table. Seeded empty on purpose -- nothing below is a placeholder." />
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
            accentColor={HUB_ACCENTS.marketing}
            emptyLabel="No content/campaign tasks yet -- add the first real one above."
          />
        </Card>

        {/* ══ REQUESTS ═══════════════════════════════════════════════════
            Studio Phase 11 -- cross-hub task handoff / access requests. */}
        <Card id="mh-requests" style={{ marginTop: 'var(--studio-gap)' }}>
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
            accentColor={HUB_ACCENTS.marketing}
          />
        </Card>

      </StudioShell>
    </>
  )
}
