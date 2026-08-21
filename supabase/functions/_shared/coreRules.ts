// Canonical cross-generator rules. Before this file existed, every generator
// hand-rewrote its own near-identical "ANTI-HALLUCINATION" paragraph — seven
// slightly different wordings that could silently drift apart. Same pattern as
// antiGeneric.ts: state the rule once, import it everywhere.

export const ANTI_HALLUCINATION_RULE = `ABSOLUTE RULE — NEVER INVENT FACTS. Only use facts the person actually provided in the input (including, where given, their evidence bank stories). Never invent an employer, date, metric, achievement, qualification, credential, or experience. If no number was given for something, do not fabricate one — sharpen the action and outcome language instead. An invented detail is worse than a missing one: it can be caught in a screening call or reference check, and when it is, it destroys the person's credibility entirely. When the input is thin, the honest response is a tighter, smaller output — never a padded one.`

// Grounded in real graduate-recruitment guidance rather than optimism: Indeed
// Ireland's STAR guidance states grad-level examples are expected to come from
// societies, part-time work, sports teams and university projects — and
// publicjobs.ie's own interview advice tells candidates to build their evidence
// bank "from your work and life experience". Non-work evidence is the norm at
// this career stage, not a fallback.
export const NON_TRADITIONAL_EVIDENCE_RULE = `NON-TRADITIONAL EVIDENCE IS FULL-STRENGTH — most of this platform's users are students, apprentices, and first-time job seekers. Academic projects, coursework, societies and clubs, sports teams, volunteering, caring responsibilities, and part-time or casual work are legitimate, full-strength evidence at this career stage — graduate recruiters explicitly expect examples from these sources, and Ireland's own public-sector recruitment guidance says to draw on "work and life experience". Never frame this evidence apologetically ("although I have only...", "despite my limited experience...") and never compensate for a short work history by inventing or inflating one. Present what is real, at full confidence, and stop there.`

/**
 * Unsupported trait claims. Previously hand-written in three generators with
 * drifting lists — CV carried "motivated individual", LinkedIn carried "dynamic
 * professional", and neither had the other's. One base list now, with
 * generator-specific additions appended at the call site via
 * buzzwordRule('...extra terms...').
 */
const BUZZWORD_BASE_TERMS = '"passionate", "hardworking", "results-driven", "team player", "motivated individual", "dynamic professional", "detail-oriented", "go-getter"'

export function buzzwordRule(extra?: string): string {
  const terms = extra ? `${BUZZWORD_BASE_TERMS}, ${extra}` : BUZZWORD_BASE_TERMS
  return `BUZZWORD RULE — never write ${terms}, or similar unsupported claims, unless the person's own input gives you a specific fact that actually demonstrates the trait. If they haven't given you the evidence, don't make the claim: state the fact and let the reader draw the conclusion.`
}

/**
 * How to use the real, sourced examples each generator is given. The shared
 * half was written five slightly different ways; the generator-specific half
 * (what kind of example, from where) is passed in.
 */
export function realExamplesRule(whatTheyAre: string): string {
  return `CALIBRATION EXAMPLES — you will be given ${whatTheyAre} in the input as real_examples. They are there so you can calibrate what genuinely effective writing looks like in this context: the level of specificity, what kind of detail actually earns attention, how evidence gets used. Study why each one works.

Some are externally published and sourced; others are exemplars written in-house to demonstrate the standard. Both are calibration material only. Treat every name, employer, number and setting in them as illustrative — none of it describes the person you are writing for. NEVER copy an example's wording, numbers, structure, or facts into your output; everything you write must be built entirely from this specific person's own input.`
}

/** Shared description for the handler_notes field in every output schema. */
export const HANDLER_NOTES_DESCRIPTION =
  'Short notes for the reviewing Campus Handler — anything they should know before approving, e.g. "No metrics were provided for the retail role; bullets sharpened without inventing numbers." Empty array if nothing needs flagging.'
