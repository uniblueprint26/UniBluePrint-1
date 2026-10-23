// Per-hub quote pools for <QuoteBanner>. The founder is writing the real
// quotes himself later -- each hub is seeded with exactly one, clearly
// placeholder-labeled, confirmed internal-facing line so the rotation
// mechanism is visibly working today without putting words in his mouth.
// Swapping in real quotes later is a one-line change per hub: add more
// strings to that hub's array, nothing about QuoteBanner itself changes.
//
// Studio Phase 9 note: with every pool at length 1, the rotation above was a
// visible no-op -- every hub showed the exact same literal string. The
// entries below PLACEHOLDER_QUOTE in each pool are AI-drafted placeholder
// copy (unattributed, written to reflect what each team's hub actually
// does), added so the rotation reads as real variation while the founder's
// real quotes are still pending. Nobody should mistake these for
// founder-authored lines -- they're scaffolding, same as PLACEHOLDER_QUOTE
// itself, and PLACEHOLDER_QUOTE stays first in every pool so nothing that
// depended on it breaks.

export const PLACEHOLDER_QUOTE =
  'The hardest thing about being the standard is that we are the standard. Thank you for making UniBlueprint the standard.'

export const HUB_QUOTES = {
  finance: [
    PLACEHOLDER_QUOTE,
    'Every payout that lands on time is a promise kept to a coach or a partner who trusted us with their work.',
    'Margin is not a spreadsheet exercise here -- it is the difference between a sustainable platform and a lucky quarter.',
    'A clean ledger is quiet by design. Thank you for doing the unglamorous work that keeps it that way.',
    'Behind every revenue number is a student who paid for something real -- treat the accounting with that weight.',
  ],
  founder: [
    PLACEHOLDER_QUOTE,
    'This dashboard exists so no decision here has to be made on vibes -- the numbers are real, and so is the responsibility that comes with them.',
    'Every hub below is a team trusting you to see the whole board clearly. Look closely before you move.',
    'The standard was never a slogan -- it is the sum of what every team on this page chooses to do today.',
    'Company-wide visibility is a privilege the rest of the team does not have. Use it to clear their path, not just to watch.',
  ],
  operations: [
    PLACEHOLDER_QUOTE,
    'Every ticket in the queue is a student waiting on us to be better than "eventually." Keep the line moving.',
    'The Sunday Queue is where our word gets tested. Showing up for it is how trust compounds.',
    'Fast is good. Fast and right is the actual job -- the queue remembers both.',
    'A quiet queue is not luck. It is the sum of a hundred small decisions made well, one ticket at a time.',
  ],
  legal: [
    PLACEHOLDER_QUOTE,
    'A contract nobody reads twice is the goal -- that means we got the clause right the first time.',
    'Compliance is not the department of "no." It is the reason the rest of the company gets to keep saying "yes."',
    'Every GDPR request answered on time is a person trusting us with their data and us earning that trust back.',
    'The fine print is where reputations are actually built. Thank you for reading it so closely.',
  ],
  tech: [
    PLACEHOLDER_QUOTE,
    'Reliability is a feature nobody notices until it is missing. Keep making it invisible.',
    'Every idea triaged in this inbox is someone on the team noticing something worth fixing. Give it a real look.',
    'Uptime is not an accident -- it is a hundred quiet decisions about what gets shipped and when.',
    'The best bug report is the one that never has to exist because someone caught it first. That someone is you.',
  ],
  outreach: [
    PLACEHOLDER_QUOTE,
    'Every coach and partner in this pipeline chose to trust us before we had proven anything to them. Earn it back daily.',
    'A relationship built in one outreach call can carry the platform for years -- treat every first contact like it matters.',
    'The inbound queue is full of people who already believe in what we are building. Do not make them wait to find out they were right.',
    'Recruitment is not a numbers game here -- it is the slow work of finding people who will actually show up for students.',
  ],
  marketing: [
    PLACEHOLDER_QUOTE,
    'Every click in this funnel is a real person deciding whether we are worth their time. Make the case honestly.',
    'What we choose to feature says what we stand for -- curate like someone is always watching, because someone always is.',
    'Early access signups are a vote of confidence before the product has even proven itself. Do not waste that trust.',
    'Growth that cannot be explained in one sentence is growth we do not actually understand yet.',
  ],
  co_director: [
    PLACEHOLDER_QUOTE,
    'Oversight is not about catching mistakes after the fact -- it is about seeing clearly enough that fewer happen in the first place.',
    'Every hub on this page is a team that trusts someone is watching the whole picture so they do not have to. That is the job.',
    'The decisions that cross your desk are the ones nobody else could make alone -- give them the attention that implies.',
    'Company-wide visibility means company-wide responsibility. Use both in the same breath.',
  ],
  handler: [
    PLACEHOLDER_QUOTE,
    'Every submission in this queue is a student who did the work and is waiting on us to match that effort.',
    'A fast claim and a careful review are not in tension -- the best handlers do both, every time.',
    'The two-sentence rule exists because real feedback takes real thought. Give it the thought.',
    'Escalations are not failures -- they are the system working exactly as it should when something needs a second look.',
  ],
}

export function getQuotePool(hubKey) {
  return HUB_QUOTES[hubKey] && HUB_QUOTES[hubKey].length ? HUB_QUOTES[hubKey] : [PLACEHOLDER_QUOTE]
}
