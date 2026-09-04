// Cross-cutting findings that apply to every generator, not one industry —
// researched directly rather than assumed, because getting this wrong at scale
// is a real risk specific to a platform generating many applications, not a
// single freelance writer's risk.
//
// Finding 1 — no major ATS (Workday, Greenhouse, iCIMS, SAP SuccessFactors, Lever,
// Oracle Taleo) actually detects "AI-written" prose; they extract structured fields
// and rank against the requisition. Standalone AI-text detectors (GPTZero,
// Originality.ai etc.) are unreliable enough that OpenAI shut down its own
// classifier at 26% accuracy — so "evading AI detection" is not the real problem.
// The real problem is what actually gets an application rejected: generic,
// interchangeable phrasing that could describe any candidate, missing specific
// keywords because they got replaced with buzzwords, and — specific to a
// platform generating at scale — convergent phrasing across many users' outputs,
// which genuinely is a detectable pattern real detectors do pick up on.
// Source: Jobscan, "Can ATS Detect AI Resumes in 2026?" — https://www.jobscan.co/blog/can-ats-detect-ai-resume/
//
// Finding 2 — the actual difference between "tailored" and "mail-merge" is not
// using the company/role name. It's citing something specific and true (a real
// project, a real thing the company does) versus a generic compliment ("your
// excellent reputation", "your innovative culture") that could be pasted into
// any cover letter for any employer.
// Source: HeroHunt / recruiter personalization research
//
// Finding 3 — 2026 ATS increasingly score semantic relevance, not just literal
// keyword presence, so keyword-stuffing alone is a declining strategy — but
// literal keyword matching is still the first-pass filter most systems apply,
// so both still matter, not one instead of the other.
// Source: TailorForge, "What Recruiters Actually Look For in 2026"

export const ANTI_GENERIC_RULE = `SPECIFICITY & ANTI-CONVERGENCE — this platform generates applications for many different people, which creates a real, specific risk: if your phrasing patterns are formulaic, outputs for different people with similar backgrounds will converge on similar wording, and convergent phrasing across many candidates is a genuine, detectable AI-tell recruiters and detection tools do notice. Counter this actively:
  - Never reach for a stock phrase or sentence template — build every sentence fresh from this specific person's specific input, so two people with similar jobs still read as two different people.
  - The test for whether a line is too generic: could this exact sentence be pasted into someone else's application unchanged? If yes, rewrite it to be true only of this person.
  - Specificity is not the same as length — a short, concrete detail beats a long, vague one.
  - This is the same standard applied to compliments about a company: never write generic flattery ("your excellent reputation", "your innovative culture", "I've always admired your work") — only reference something specific and true that the person actually told you about the company or role. If they gave you nothing specific, don't manufacture false specificity — write around it honestly rather than inventing a detail.`
