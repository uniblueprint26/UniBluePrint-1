import type { ReactNode } from 'react'
import Callout from '../components/Callout'

export const MODULE_CONTENT: Record<number, ReactNode> = {
  1: (
    <>
      <h1>What You Are Part Of</h1>
      <p>
        UniBlueprint is built around one idea: <strong>"The Structure Behind Your Success."</strong>{' '}
        Students come to us for Foundation Blueprint services (CVs, LinkedIn profiles, cover
        letters, application forms, interview preparation and CAO support), Elevation Blueprint
        coaching and mentorship, Lifestyle Blueprint partner discounts, and the Campus Connect and
        Course Connect communities — a single structure supporting them through college,
        apprenticeships, and their first steps into work.
      </p>

      <h2>Where You Fit In</h2>
      <p>
        As a Campus Handler, you sit at the centre of the Foundation Blueprint. Every CV, cover
        letter, LinkedIn profile, and application form a student submits passes through you before
        it reaches them. You are the last check before that document goes out to apply for
        something that matters — a job, a college place, an apprenticeship.
      </p>

      <h2>Why This Role Matters</h2>
      <p>
        Students trust us with something personal: their next step. An AI-generated first draft is
        only ever a starting point. Your review is what decides whether the version that reaches
        the student is actually good enough to put their name on.
      </p>
      <Callout type="warning">
        A rushed or careless review isn't a shortcut — it's a broken promise to the student who
        trusted us with their CV.
      </Callout>

      <h2>What's Expected of You</h2>
      <table>
        <thead>
          <tr>
            <th>Standard</th>
            <th>What it looks like</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Accuracy</td>
            <td>Nothing invented, nothing wrong</td>
          </tr>
          <tr>
            <td>Care</td>
            <td>Every ticket reviewed properly, every time</td>
          </tr>
          <tr>
            <td>Judgement</td>
            <td>Flag when you're unsure, rather than guess</td>
          </tr>
          <tr>
            <td>Confidentiality</td>
            <td>Student information stays private</td>
          </tr>
          <tr>
            <td>Professionalism</td>
            <td>Deadlines met, tone respected</td>
          </tr>
        </tbody>
      </table>

      <h2>How Training Works</h2>
      <p>
        There are six modules. Modules 2, 3, and 5 end with a short quiz — you need to score 80% or
        above to pass, and you can retake as many times as you need. Modules unlock in order:
        finishing one unlocks the next. Operations can see exactly where you are in training at any
        time.
      </p>
      <Callout type="success">
        Take your time on each module. There's no reward for rushing training — only for doing the
        job well afterwards.
      </Callout>
    </>
  ),

  2: (
    <>
      <h1>The Foundation Blueprint Services</h1>
      <p>
        As a Handler you'll review submissions across every Foundation Blueprint service. This
        module walks through each one, what typically goes wrong with the AI-generated draft, and
        what you're checking for before it reaches a student.
      </p>

      <h2>CV Optimisation</h2>
      <p>
        The most common failure mode is <strong>generic bullet points</strong> — lines that could
        describe almost anyone, with no active language and no specific outcome.
      </p>
      <Callout type="danger">"Responsible for managing social media."</Callout>
      <Callout type="success">
        "Grew Instagram engagement 40% in one semester by planning and posting a weekly content
        calendar."
      </Callout>
      <p>
        Also check that the CV would actually survive an <strong>ATS</strong> (Applicant Tracking
        System) — the software many employers use to scan CVs before a human ever sees one. Odd
        formatting, tables, or graphics can cause a strong CV to be filtered out automatically.
      </p>

      <h2>LinkedIn Profile Optimisation</h2>
      <p>
        The About section should always be written in the <strong>first person</strong> — it needs
        to sound like the student introducing themselves, not a corporate bio written about them in
        the third person.
      </p>

      <h2>Cover Letter Assistance</h2>
      <p>
        The single most common AI failure here is a <strong>generic opening line</strong>. A cover
        letter that could have been sent to any company, for any role, has already failed —
        Accuracy, Completeness, and Tone & Voice all at once.
      </p>
      <Callout type="danger">"I am writing to apply for this position at your esteemed company."</Callout>
      <Callout type="success">
        An opening line that names the actual company, the actual role, and why this student
        specifically wants it.
      </Callout>

      <h2>Application Form Assistance</h2>
      <p>
        Application answers should follow the <strong>STAR</strong> framework — Situation, Task,
        Action, Result. <strong>Result</strong> is the component most often missing: AI drafts
        frequently describe what the student did and stop there, without ever stating the outcome.
      </p>

      <h2>Interview Preparation & College Interview Preparation</h2>
      <p>
        These are two different services. General Interview Preparation covers job interviews.
        College Interview Preparation covers college entry interviews, which can follow very
        different formats — a traditional panel interview, or an <strong>MMI</strong> (Multiple Mini
        Interview), commonly used for courses like medicine and health sciences. Know which format a
        student is preparing for before reviewing their material.
      </p>

      <h2>CAO Personal Statement</h2>
      <Callout type="warning">
        A personal statement that opens with a famous quote should be flagged immediately — it's a
        generic device that doesn't reflect the student's own voice, and colleges see it constantly.
      </Callout>

      <h2>When Something's Been Invented</h2>
      <Callout type="danger">
        If an AI output invents experience, qualifications, or achievements the student never
        mentioned, flag it to Operations immediately. Never approve it, and never quietly edit it
        yourself.
      </Callout>

      <h2>You'll Be Tested On This</h2>
      <p>Score 80% or above on the quiz to unlock Module 3.</p>
    </>
  ),

  3: (
    <>
      <h1>The Quality Checklist</h1>
      <p>
        Every ticket you review gets scored across five dimensions. This is the framework behind
        every decision you make as a Handler.
      </p>

      <h2>The Five Dimensions</h2>
      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>What it asks</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Accuracy</td>
            <td>Is everything true, with nothing invented?</td>
          </tr>
          <tr>
            <td>Quality</td>
            <td>Is this genuinely good — not just technically correct?</td>
          </tr>
          <tr>
            <td>Completeness</td>
            <td>Is anything missing — unfilled placeholders, half-finished sections?</td>
          </tr>
          <tr>
            <td>Tone & Voice</td>
            <td>Does it sound like a professional version of this specific student?</td>
          </tr>
          <tr>
            <td>Deliverability</td>
            <td>Can the student use this right now, with nothing left to fix?</td>
          </tr>
        </tbody>
      </table>

      <h2>Scoring</h2>
      <p>Each dimension is scored out of 5, giving a composite score out of 25.</p>
      <table>
        <thead>
          <tr>
            <th>Composite</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>21–25</td>
            <td>Excellent — approve</td>
          </tr>
          <tr>
            <td>16–20</td>
            <td>Good — approve</td>
          </tr>
          <tr>
            <td>14–15</td>
            <td>Review carefully, lean toward flagging</td>
          </tr>
          <tr>
            <td>Below 14</td>
            <td>Flag — this isn't ready</td>
          </tr>
        </tbody>
      </table>

      <h2>The One Rule That Overrides Everything</h2>
      <Callout type="danger">
        If any single dimension scores a 1, flag to Operations — regardless of how high the
        composite is. A high composite cannot cover for one serious problem.
      </Callout>

      <h2>Completeness in Practice</h2>
      <Callout type="warning">
        Placeholder brackets like [Company Name] left unfilled are a Completeness failure, not a
        minor typo — it means the student can't use the document as it stands, which also fails
        Deliverability.
      </Callout>

      <h2>What Good Tone & Voice Sounds Like</h2>
      <Callout type="success">
        It should sound like the student — only clearer and more polished. Not like a corporate
        template.
      </Callout>

      <h2>You'll Be Tested On This</h2>
      <p>Score 80% or above on the quiz to unlock Module 4.</p>
    </>
  ),

  4: (
    <>
      <h1>The Ticket Workflow</h1>
      <p>
        This is the exact path every submission takes, from the moment a student submits it to the
        moment they receive it back.
      </p>

      <h2>The Five Stages</h2>
      <table>
        <thead>
          <tr>
            <th>Stage</th>
            <th>What happens</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Submitted</td>
            <td>The student completes the service form and pays; the ticket enters the queue with a timestamp.</td>
          </tr>
          <tr>
            <td>In Queue</td>
            <td>The ticket waits for a Handler to become available.</td>
          </tr>
          <tr>
            <td>Assigned</td>
            <td>The ticket is assigned to you — the clock is running.</td>
          </tr>
          <tr>
            <td>In Review</td>
            <td>You are actively working through the Quality Checklist against the AI-generated draft.</td>
          </tr>
          <tr>
            <td>Delivered</td>
            <td>The final version reaches the student, and the timestamp is logged.</td>
          </tr>
        </tbody>
      </table>

      <h2>When a Ticket Is Assigned to You</h2>
      <p>
        Open both the student's original input and the AI-generated draft. If anything is unclear,
        check what the student actually submitted before assuming.
      </p>

      <h2>While In Review</h2>
      <p>
        Apply the Quality Checklist from Module 3. If something falls short, use the flag reasons
        from Module 5 rather than guessing or quietly fixing it yourself.
      </p>

      <h2>Delivered</h2>
      <Callout type="warning">
        Once you approve, the document goes straight to the student — there is no second check
        after you. Take the extra thirty seconds before you click Approve.
      </Callout>

      <h2>After Delivery: Feedback & Ratings</h2>
      <p>
        The ticket doesn't end for you the moment you click Approve. Students can leave feedback
        and a rating on the service they received — and that feedback is attached to your review.
      </p>
      <Callout type="warning">
        Check back on your feedback and ratings regularly. Don't deliver a ticket and forget about
        it — following up is part of the job, not optional.
      </Callout>
      <p>
        If a rating comes back low, read the feedback properly before reacting. It's there to help
        you improve, the same way a rejected flag from Operations is (Module 5). If a pattern shows
        up across multiple tickets, that's exactly the kind of thing worth adjusting for next time.
      </p>

      <h2>Timestamps Matter</h2>
      <p>
        Every stage change is timestamped and visible to Operations. This is how your speed and
        consistency are measured, and how we protect students' expectations for turnaround time.
      </p>
    </>
  ),

  5: (
    <>
      <h1>Flagging to Operations</h1>
      <p>
        Flagging is not failure. It's the correct call when something needs a second set of eyes,
        and it's built into the process for exactly that reason.
      </p>

      <h2>When to Flag</h2>
      <p>
        Common reasons include an accuracy issue (invented content), a safeguarding concern, a
        completeness issue, or simply being unsure. Select every reason that applies — you are not
        limited to one.
      </p>
      <Callout type="danger">
        Content suggesting a student may be at risk should be flagged immediately, with the
        Safeguarding reason and urgent escalation. This is never something to handle alone or delay
        on.
      </Callout>

      <h2>Selecting Flag Reasons</h2>
      <p>
        Select every reason that applies to the ticket — not just the first one that fits, and not
        capped at one or two. If three things are wrong, flag all three.
      </p>

      <h2>Using "Other"</h2>
      <p>
        Only use "Other" when nothing else fits, and always include a written explanation of at
        least 50 words. A vague one-liner isn't enough for Operations to act on.
      </p>

      <h2>What Happens After You Flag</h2>
      <Callout type="success">
        Once flagged, it's Operations' ticket. You don't need to follow up, chase, or contact the
        student — that's their job from here.
      </Callout>

      <h2>Response Times</h2>
      <p>Premium tickets are resolved by Operations within 30 minutes of being flagged.</p>

      <h2>If Operations Disagrees With Your Flag</h2>
      <p>
        Read their reasoning, learn from it, and approve the ticket. That isn't a loss — it's
        calibration.
      </p>

      <h2>Your Flag Acceptance Rate</h2>
      <p>
        A high flag acceptance rate is a good sign — it means your judgement is well calibrated with
        Operations, not that you're too strict. A low rate isn't punished; it simply triggers a
        calibration conversation to realign expectations.
      </p>
      <Callout type="success">
        When in doubt, flag. It is always the correct professional decision — never a sign of
        weakness.
      </Callout>

      <h2>You'll Be Tested On This</h2>
      <p>Score 80% or above on the quiz to unlock Module 6.</p>
    </>
  ),

  6: (
    <>
      <h1>Being a Campus Handler</h1>
      <p>
        This final module is the professional and ethical standard behind everything you've learned
        so far.
      </p>

      <h2>Confidentiality</h2>
      <p>
        Everything you see — CVs, personal statements, application details — is private. Never
        share, discuss, or reference a student's information outside of the review itself.
      </p>

      <h2>Professionalism</h2>
      <p>
        Meet your assigned turnaround times, and treat every ticket with the same care regardless of
        how busy the queue is.
      </p>

      <h2>Boundaries</h2>
      <p>
        You review and improve — you don't add personal opinions or unrelated commentary into a
        student's document. You are not their career coach; that role belongs to Elevation
        Blueprint.
      </p>

      <h2>Consistency</h2>
      <p>
        Apply the Quality Checklist the same way on your 200th ticket as your 1st. Standards don't
        slip because it's late, you're tired, or the queue is long.
      </p>

      <h2>Accountability</h2>
      <Callout type="warning">
        Every review you approve carries your judgement. If something goes wrong after delivery,
        Operations will look at what was approved and why.
      </Callout>
      <p>
        That includes student feedback and ratings, covered in Module 4 — checking back on them
        isn't a courtesy, it's part of how your work as a Handler is measured.
      </p>

      <h2>The Standard</h2>
      <Callout type="success">
        Ask yourself before every approval: "Would I be comfortable putting my own name on this
        document?" If not, it's not ready.
      </Callout>

      <h2>Completing Your Training</h2>
      <p>
        This is the final module. Once you confirm you've read and understood it, your training is
        complete, and Operations will be notified that you're ready to review tickets.
      </p>
    </>
  ),
}
