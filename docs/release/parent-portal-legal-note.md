# For parents page: note for Legal

Status: built for launch, wording needs Legal review before the 26 December 2026 release. Owner of the review: Legal team.

## What was built
A read only page called "For parents" in the app (Profile, then For parents). It explains in plain words what UniBlueprint is and lists public information that already ships in the app: the five parts of the app, the Foundation services, the Elevation coaches (names and categories), the Lifestyle partners (names, categories and counties), the Campus Connect and Course Connect explainer, safety points, Irish helplines and the support email.

## What it does not do
- It has no sign up, no invite, no link to a child and no form. It stores nothing and sends nothing.
- No messaging with anyone, and nothing about any person under 18.
- No accounts for under 18s. UBP stays 18 and over: the age gate at sign up is unchanged.
- No prices, no purchase buttons and no member content (posts, names, photos).

## Decision for the founder and Legal to confirm
The brief said a parent looks at UBP "for their child, who accesses UBP through the parent". That is in tension with "members are 18 or over and UBP never works with minors". The page was built to the safer reading: the parent reads about UBP from inside their own adult account, and there is no way for a child under 18 to use UBP through it. If the founder wants a child to use the app through a parent's account, that is a children's data and child safety question (GDPR Article 8, the Data Protection Act 2018 age of digital consent in Ireland, Apple Kids and Families rules, Google Families policy, the Online Safety and Media Regulation Act). It would need its own design, consent flow and review. It is not built.

## Wording for Legal to check (all in app/src/screens/ParentInfoScreen.jsx)
1. "UniBlueprint is for people aged 18 and over. We do not make accounts for anyone under 18 and we never message anyone under 18. Nothing on this page collects information about your child."
2. "Members must be 18 or over. We do not allow under 18s on UniBlueprint."
3. "Every post can be reported, and any member can be blocked."
4. "Posts are checked for harmful language before they go up." (Checked on the phone and again on the server for the text fields covered by the text guard. Not every field is covered, so Legal may want a softer line.)
5. "If you think someone under 18 is using the app, tell us at support@uniblueprint.ie and we will act on it." Needs a named process and an owner for that inbox.
6. The helplines are the verified list already in app/src/data/mentalHealthSupport.js. Childline (ISPCC) is not listed. Add it only after the number is verified.

## Questions for Legal
- Is a page for parents inside an 18 and over app acceptable for Apple App Review (age rating, Kids category not selected) and Google Play (target audience 18 and over)?
- Does the Lifestyle and Elevation listing here need the partner or coach consent already recorded in docs/release/brand-permissions.md?
- Should the privacy policy mention this page? Nothing is collected, so the proposal is one line only.
