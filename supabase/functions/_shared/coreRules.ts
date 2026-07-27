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
