import { useState, useEffect } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Linking,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  FileText, Users, MessageSquare, BookMarked, Search, Briefcase, Star,
  GraduationCap, Compass, Globe, Lightbulb,
  PenLine, BookOpenCheck, CalendarDays, Clock, BookOpen,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Repeat, Route,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import FeatureCard from '../components/ui/FeatureCard'
import MockContentBanner from '../components/ui/MockContentBanner'
import SectionHeader from '../components/ui/SectionHeader'
import UBPLogo from '../components/ui/UBPLogo'
import CourseBoardPickerModal from '../components/courseConnect/CourseBoardPickerModal'
import JourneyStageModal from '../components/courseConnect/JourneyStageModal'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'
import { useUserType } from '../hooks/useUserType'
import { useJourneyStage } from '../hooks/useJourneyStage'
import { JOURNEY_STAGES } from '../constants/journeyStages'
import {
  USER_TYPE_STUDENT, USER_TYPE_APPRENTICE, USER_TYPE_GAP_YEAR, USER_TYPE_WORKER,
  userTypeLabel as labelForUserType,
} from '../constants/userTypes'

// ─── Reframe, round 2: matched by journey stage, not by path ────────────────
// Round 1 (Phase 6, commit 0a67f782) made the copy below adapt to userType
// (Student/Apprentice/Gap Year/Worker) so it no longer read as a university
// portal with an apprentice-shaped asterisk. That was real progress but it
// didn't fix the actual complaint: everything a person was actually matched
// or grouped with — Course Boards, Study Groups, Notes, the old "Student
// Database" — was still keyed on course/subject/institution, i.e. exactly
// what they're doing. The founder's correction: Course Connect should
// connect people by shared SITUATION — same stage, same age, same journey —
// merging across student/apprentice/gap-year/worker, not siloed by it.
//
// This pass adds that missing axis: journeyStage (see
// constants/journeyStages.js + hooks/useJourneyStage.js), and makes it the
// PRIMARY grouping key for the "Journey Match" section below (see
// JOURNEY_PROFILES) — course/institution stays available only as a
// secondary filter via "Browse Full Directory". PATH_CONTENT below (and
// userType generally) is kept as-is and still useful: it says *what* a
// person is doing, which still legitimately changes which boards/copy make
// sense to show them. journeyStage says *where they are in it*, which is
// the actual connecting mechanism — the two are complementary, not the same
// thing, and conflating them was Round 1's gap.
const PATH_CONTENT = {
  [USER_TYPE_STUDENT]: {
    banner: "Course Connect is built around your course and college — boards, notes, and mentors all scoped to what you're studying.",
    sub: 'Notes, study groups, exam resources, and graduate mentors, built around your course and your college.',
    academicEyebrow: 'ACADEMIC SUPPORT',
    academicTitle: 'Built for how you actually study',
    toolsSub: 'Practical tools, relevant notes, and mentors who recently graduated from your course.',
    mentorsSub: 'Recently graduated from your course. Mentors who have been exactly where you are now.',
  },
  [USER_TYPE_APPRENTICE]: {
    banner: 'As an Apprentice, the boards and tools below adapt to your trade and training provider, not just to college courses.',
    sub: 'Discussion boards, shared resources, and a network of people on the same trade, apprentice to apprentice, not bolted onto a college portal.',
    academicEyebrow: 'COURSE & TRADE SUPPORT',
    academicTitle: 'Built for how you actually train',
    toolsSub: "Practical tools and peer resources for your apprenticeship, whatever stage you're at.",
    mentorsSub: "Recently graduated, several from routes other than a straight degree. Useful perspective wherever you're headed.",
  },
  [USER_TYPE_GAP_YEAR]: {
    banner: 'On a Gap Year, Course Connect shows you what every path actually looks like, from people already on college, trade, and work routes.',
    sub: 'Weighing up college, an apprenticeship, or work? Talk to people already on every path before you commit to yours.',
    academicEyebrow: 'SUPPORT FOR YOUR NEXT STEP',
    academicTitle: 'Built for wherever you land next',
    toolsSub: 'Tools and resources that work whichever way you end up going next.',
    mentorsSub: "Recently graduated from college, one route among several. Worth a look while you're still deciding.",
  },
  [USER_TYPE_WORKER]: {
    banner: 'As a Worker, Industry Discussions and the career-facing boards below are built for you, not just people still in college.',
    sub: 'Industry threads, career discussions, and a peer network for young people in work, not just people still in college.',
    academicEyebrow: 'CAREER SUPPORT',
    academicTitle: 'Built for how you actually work',
    toolsSub: "Practical tools and peer resources, useful whether you're studying part-time or just in the field.",
    mentorsSub: 'Recently graduated and now working. Their route was college, but the career advice travels either way.',
  },
}

// Hero stats: the sourced CAO/HE figures below are genuinely student- and
// CAO-specific, so showing them to an Apprentice, Gap Year, or Worker user
// would misrepresent what the hub covers for them. Rather than fabricate
// pathway-specific figures with no real source, those three user types see
// three honest, unsourced-figure-free stats instead (all 32 counties,
// the live tool/board count below, free to join) — the same category of
// claim Campus Connect's hero already uses.
const LIVE_TOOL_COUNT = 9 // COURSE_FEATURES.length, all "Live now" — see below

// ─── Course feature products (9 total, all live) ────────────────────────────

const COURSE_FEATURES = [
  {
    key: 'course_boards', label: 'COURSE BOARDS', Icon: GraduationCap, color: '#EFF6FF',
    headline: 'Talk to everyone on your path',
    sub: 'Discussion boards scoped to your course, programme, or workplace, not your campus — open to everyone on it, anywhere in Ireland.',
    count: 'Live now',
    preview: [
      { text: 'Computer Science, UCD · Anyone doing the optional AI module next year?', meta: 'CS' },
      { text: 'Electrical apprenticeship, ETB · Anyone else on Phase 4 this block?', meta: 'Trade' },
    ],
  },
  {
    key: 'notes', label: 'NOTES EXCHANGE', Icon: FileText, color: '#EFF6FF',
    headline: 'Get ahead with peer notes',
    sub: 'Upload and access module summaries, lecture notes, and revision guides shared by students like you.',
    count: 'Live now',
    preview: [
      { text: 'MG4021, Consumer Behaviour · Week 7 Summary · UL', meta: '142 views' },
      { text: 'CS2001, Data Structures · Linked Lists & Trees · UCD', meta: '98 views' },
    ],
  },
  {
    key: 'groups', label: 'STUDY GROUPS', Icon: Users, color: '#F0FDF4',
    headline: 'Study with people who get it',
    sub: 'Form or join groups by module, topic, or upcoming deadline, at any Irish college or training centre.',
    count: 'Live now',
    preview: [
      { text: 'CS2001 Exam Prep Group · UCD · 4 members', meta: 'Active' },
      { text: 'MG4021 Week 7 Revision · UL · 3 members', meta: 'Active' },
    ],
  },
  {
    key: 'qa', label: 'MODULE Q&A', Icon: MessageSquare, color: '#FDF4FF',
    headline: 'Get unstuck, fast',
    sub: 'Ask questions about your course, module, or on-the-job training, and get answers from people who have already been there.',
    count: 'Live now',
    preview: [
      { text: "What's the best way to approach Big O notation for the upcoming exam?", meta: 'CS2001' },
      { text: 'Can anyone explain the difference between void and voidable contracts?', meta: 'LA1102' },
    ],
  },
  {
    key: 'exams', label: 'EXAM RESOURCES', Icon: BookMarked, color: '#FFF7ED',
    headline: 'Past papers and revision guides in one place',
    sub: 'Access a growing library of past papers, exam tips, and revision guides across all Irish universities.',
    count: 'Live now',
    preview: [
      { text: 'UCD Business, 2023 Past Papers Bundle', meta: 'Past Paper' },
      { text: 'TCD Law, Essay structure and exam technique guide', meta: 'Guide' },
    ],
  },
  {
    key: 'resources', label: 'RESOURCE FINDER', Icon: Search, color: '#F0F9FF',
    headline: 'Find resources from any institution',
    sub: 'Search shared notes and past papers by subject, course, or keyword, across Ireland.',
    count: 'Live now',
  },
  {
    key: 'industry', label: 'INDUSTRY DISCUSSIONS', Icon: Briefcase, color: '#FEF9C3',
    headline: 'Talk to people already in your field',
    sub: 'Industry-specific threads for young people exploring careers, on any route in. Ask, listen, and connect with those ahead of you.',
    count: 'Live now',
  },
  {
    key: 'college_reviews', label: 'COLLEGE REVIEWS', Icon: Star, color: '#F0FDF4',
    headline: 'Real reviews of Irish colleges and courses',
    sub: 'Honest assessments from students across all institutions. Search by course, campus, or subject area.',
    count: 'Live now',
  },
  {
    key: 'cross_projects', label: 'PROJECT COLLABORATION', Icon: Lightbulb, color: '#FDF4FF',
    headline: 'Build something real, with anyone in Ireland',
    sub: 'Find teammates for college projects and side projects, from students at any Irish institution.',
    count: 'Live now',
    preview: [
      { text: 'Cross-college Hackathon Team · UCD + TCD · 2 spots open', meta: 'Mobile Dev' },
      { text: 'Sustainability Research Project · UCC · 1 spot open', meta: 'Research' },
    ],
  },
]

// Maps each Course Tools feature card to its real destination.
function openCourseFeature(navigation, key) {
  const boardRoute = k => navigation.navigate('BoardDetail', { boardKey: k, registry: 'course' })
  if (key === 'course_boards') return boardRoute('course-boards')
  if (key === 'notes') return boardRoute('notes')
  if (key === 'groups') return boardRoute('study-groups')
  if (key === 'qa') return navigation.navigate('ModuleQA')
  if (key === 'exams') return boardRoute('papers')
  if (key === 'resources') return navigation.navigate('ResourceFinder')
  if (key === 'industry') return boardRoute('industry')
  if (key === 'college_reviews') return boardRoute('course-reviews')
  if (key === 'cross_projects') return boardRoute('projects')
}

// ─── Academic Support: Course Tools (shells, exact tool set TBD) ─────────────
// NOTE: Exact tool set to be confirmed. Pattern and card structure built here.
const ACADEMIC_TOOLS = [
  {
    key: 'essay',       label: 'ESSAY & WRITING',    Icon: PenLine,      color: '#EFF6FF',
    headline: 'Write clearer, more structured essays',
    sub: 'Guidance on essay structure, argumentation, and academic writing style across disciplines.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'referencing', label: 'REFERENCING',         Icon: BookOpenCheck, color: '#F0FDF4',
    headline: 'Generate references in any style',
    sub: 'APA, Harvard, Chicago, and more. Build and export your bibliography in seconds.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'timetable',   label: 'TIMETABLE PLANNER',  Icon: CalendarDays,  color: '#FDF4FF',
    headline: 'Build your week before the week builds you',
    sub: 'Plan lectures, study sessions, and deadlines in one clear view. Syncs with your module list.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'tracker',     label: 'MODULE TRACKER',      Icon: Clock,         color: '#FFF7ED',
    headline: 'Stay on top of every assignment',
    sub: 'Log assessments, track grades, and never miss a submission deadline again.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'research',    label: 'RESEARCH SKILLS',     Icon: Search,        color: '#F0F9FF',
    headline: 'Find and evaluate academic sources',
    sub: 'Guidance on searching databases, evaluating sources, and building strong literature reviews.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'integrity',   label: 'ACADEMIC INTEGRITY',  Icon: BookOpen,      color: '#FEF9C3',
    headline: "Know your college's academic guidelines",
    sub: 'Plain-language summaries of plagiarism rules, proper citation, and what counts as collaboration.',
    count: 'Coming soon', coming: true,
  },
]

// ─── Popular Notes ────────────────────────────────────────────────────────────

const RECENT_NOTES = [
  { module: 'MG4021', title: 'Consumer Behaviour, Week 7 Summary', university: 'UL', views: 142, saved: 38 },
  { module: 'CS2001', title: 'Data Structures, Linked Lists & Trees', university: 'UCD', views: 98, saved: 22 },
  { module: 'LA1102', title: 'Contract Law, Offer & Acceptance Notes', university: 'TCD', views: 203, saved: 61 },
  { module: 'AC3010', title: 'Financial Accounting, Ratio Analysis', university: 'UCC', views: 87, saved: 19 },
]

// ─── Graduate Mentors ─────────────────────────────────────────────────────────

const GRADUATE_MENTORS = [
  {
    id: 'ciara', name: 'Ciara Nolan', shell: false,
    institution: 'UCD', course: 'Business & Finance', year: '2023',
    role: 'Graduate at KPMG Dublin',
    areas: ['Graduate Applications', 'Finance Careers', 'CV & LinkedIn'],
    bio: "Ciara completed her Business & Finance degree at UCD in 2023 and joined KPMG's graduate programme. She mentors students on navigating graduate applications, crafting strong CVs, and getting the most out of final year.",
    initials: 'CN', initBg: '#EFF6FF',
  },
  {
    id: 'james', name: 'James Healy', shell: false,
    institution: 'TCD', course: 'Computer Science', year: '2022',
    role: 'Software Engineer at Stripe',
    areas: ['Tech Careers', 'Technical Interviews', 'CS Projects'],
    bio: "James graduated from TCD's Computer Science programme in 2022 and joined Stripe's engineering team. He mentors on cracking technical interviews, building side projects that matter, and getting into top-tier tech roles.",
    initials: 'JH', initBg: '#F0FDF4',
  },
  {
    id: 'sarah', name: 'Sarah Fitzpatrick', shell: true,
    institution: 'UCC', course: 'Law', year: '2023',
    shellMessage: 'Full mentor profile coming soon.',
    initials: 'SF', initBg: '#FDF4FF',
  },
  {
    id: 'david', name: 'David Okafor', shell: true,
    institution: 'DCU', course: 'Communications', year: '2022',
    shellMessage: 'Full mentor profile coming soon.',
    initials: 'DO', initBg: '#FFF7ED',
  },
]

// ─── Journey Match (28 members) ──────────────────────────────────────────────
// THE reframe, concretely: this used to be a "Student Database" keyed on
// uni/course/cao — matching people by what they're literally doing. Per the
// founder's correction, that's backwards. Every profile below now carries a
// journeyStage (see constants/journeyStages.js) as its primary grouping key,
// and a userType (Student/Apprentice/Gap Year/Worker) that's deliberately
// MIXED within every stage rather than siloed — a Student, an Apprentice, a
// Gap Year person, and a Worker who are all "In the Thick of It" show up
// together, because that's the actual match. `what`/`place` (course, trade,
// employer) is kept only as a secondary detail line on the card, same role
// `cao` and `course` played before, just no longer the organizing principle.
const JOURNEY_PROFILES = [
  // ── Finding Your Feet ──
  { name: 'Ethan',    userType: USER_TYPE_STUDENT,    journeyStage: 'finding_feet',    what: 'Computer Science, UCD · 1st year',           skills: ['React', 'Python'],     initials: 'ET', color: '#EFF6FF' },
  { name: 'Fiza',      userType: USER_TYPE_APPRENTICE, journeyStage: 'finding_feet',    what: 'Electrical Apprenticeship, ETB Cork · Phase 1', skills: ['Wiring', 'Safety'],     initials: 'FZ', color: '#F0FDF4' },
  { name: 'Nicole',    userType: USER_TYPE_GAP_YEAR,   journeyStage: 'finding_feet',    what: 'Gap year · just started, still deciding',    skills: ['Open to anything'],     initials: 'NL', color: '#FDF4FF' },
  { name: 'Eman',      userType: USER_TYPE_WORKER,     journeyStage: 'finding_feet',    what: 'Marketing Assistant, Version 1 · new hire',  skills: ['PR', 'Content'],        initials: 'EN', color: '#FFF7ED' },
  { name: 'Mohammed',  userType: USER_TYPE_STUDENT,    journeyStage: 'finding_feet',    what: 'Engineering, UCD · 1st year',                skills: ['CAD', 'Matlab'],        initials: 'MH', color: '#FEF9C3' },
  { name: 'Wami',      userType: USER_TYPE_APPRENTICE, journeyStage: 'finding_feet',    what: 'Plumbing Apprenticeship, ETB Dublin · Phase 1', skills: ['Fitting', 'Reading Plans'], initials: 'WM', color: '#F0F9FF' },
  // ── In the Thick of It ──
  { name: 'Abdullah',  userType: USER_TYPE_STUDENT,    journeyStage: 'building_momentum', what: 'Computer Science, UCC · 2nd year',         skills: ['Java', 'React'],        initials: 'AB', color: '#EFF6FF' },
  { name: 'Siobhan',   userType: USER_TYPE_APPRENTICE, journeyStage: 'building_momentum', what: 'Carpentry Apprenticeship, ETB Limerick · Phase 3', skills: ['Joinery', 'CAD'],  initials: 'SB', color: '#F0FDF4' },
  { name: 'Ciaran',    userType: USER_TYPE_WORKER,     journeyStage: 'building_momentum', what: 'Civil Engineer, Arup · 2 years in',         skills: ['AutoCAD', 'Survey'],    initials: 'CI', color: '#FDF4FF' },
  { name: 'Aoife',     userType: USER_TYPE_GAP_YEAR,   journeyStage: 'building_momentum', what: 'Gap year · mid-way, working and saving',    skills: ['Writing', 'Sales'],     initials: 'AF', color: '#FFF7ED' },
  { name: 'Emily',     userType: USER_TYPE_STUDENT,    journeyStage: 'building_momentum', what: 'Journalism, DCU · 3rd year',               skills: ['Writing', 'Social'],    initials: 'EM', color: '#F0F9FF' },
  { name: 'Zafur',     userType: USER_TYPE_WORKER,     journeyStage: 'building_momentum', what: 'Software Engineer, Stripe · 2 years in',    skills: ['Python', 'AI/ML'],      initials: 'ZF', color: '#FEF9C3' },
  // ── At a Crossroads ──
  { name: 'Maura',     userType: USER_TYPE_STUDENT,    journeyStage: 'at_a_crossroads', what: 'Law, UCC · deciding masters vs. training contract', skills: ['Research', 'Advocacy'], initials: 'MR', color: '#EFF6FF' },
  { name: 'Billy',     userType: USER_TYPE_APPRENTICE, journeyStage: 'at_a_crossroads', what: 'Fitness trade · deciding specialise or go contracting', skills: ['Coaching', 'Business'], initials: 'BL', color: '#F0FDF4' },
  { name: 'Oisin',     userType: USER_TYPE_GAP_YEAR,   journeyStage: 'at_a_crossroads', what: 'Gap year · deciding: college, trade, or travel on',  skills: ['Research', 'Data'],     initials: 'OS', color: '#FDF4FF' },
  { name: 'Sinead',    userType: USER_TYPE_WORKER,     journeyStage: 'at_a_crossroads', what: 'In work · weighing going back to study Psychology', skills: ['Research', 'Stats'],    initials: 'SD', color: '#FFF7ED' },
  { name: 'Kofi',      userType: USER_TYPE_STUDENT,    journeyStage: 'at_a_crossroads', what: 'Engineering, TCD · considering a course change',    skills: ['Circuits', 'Python'],   initials: 'KF', color: '#F0F9FF' },
  { name: 'Seamus',    userType: USER_TYPE_WORKER,     journeyStage: 'at_a_crossroads', what: 'In Sales · weighing a switch into Marketing',        skills: ['Sales', 'Marketing'],   initials: 'SM', color: '#FEF9C3' },
  // ── Wrapping Up ──
  { name: 'Sean',      userType: USER_TYPE_STUDENT,    journeyStage: 'wrapping_up',     what: 'Business & French, UCC · final year, job hunting',  skills: ['French', 'Finance'],    initials: 'SN', color: '#EFF6FF' },
  { name: 'David',     userType: USER_TYPE_APPRENTICE, journeyStage: 'wrapping_up',     what: 'Electrical Apprenticeship · final phase, near qualified', skills: ['Wiring', 'Testing'], initials: 'DV', color: '#F0FDF4' },
  { name: 'Isaac',     userType: USER_TYPE_WORKER,     journeyStage: 'wrapping_up',     what: 'Contract ending · figuring out the next role',       skills: ['Languages', 'Trade'],   initials: 'IC', color: '#FDF4FF' },
  { name: 'Basmali',   userType: USER_TYPE_STUDENT,    journeyStage: 'wrapping_up',     what: 'Pharmacy, TCD · final year, registration exams ahead', skills: ['Chemistry', 'Science'], initials: 'BM', color: '#FFF7ED' },
  { name: 'Fatima',    userType: USER_TYPE_GAP_YEAR,   journeyStage: 'wrapping_up',     what: 'Gap year ending · starting college in September',   skills: ['Empathy', 'Policy'],    initials: 'FT', color: '#F0F9FF' },
  { name: 'Sienna',    userType: USER_TYPE_WORKER,     journeyStage: 'wrapping_up',     what: 'Leaving a role · lining up the next opportunity',    skills: ['Branding', 'Content'],  initials: 'SI', color: '#FEF9C3' },
  // ── A few more, spread out ──
  { name: 'Gigi',      userType: USER_TYPE_STUDENT,    journeyStage: 'finding_feet',    what: 'Business, NUIG · 1st year',                  skills: ['Marketing', 'Excel'],   initials: 'GG', color: '#EFF6FF' },
  { name: 'Alex',      userType: USER_TYPE_APPRENTICE, journeyStage: 'building_momentum', what: 'Architectural Technology Apprenticeship · mid-way', skills: ['Revit', 'SketchUp'], initials: 'AX', color: '#F0FDF4' },
  { name: 'Daniel',     userType: USER_TYPE_WORKER,     journeyStage: 'at_a_crossroads', what: 'In Commerce role · weighing a return to study',      skills: ['Accounting', 'Law'],    initials: 'DN', color: '#FDF4FF' },
  { name: 'Aisling',    userType: USER_TYPE_GAP_YEAR,   journeyStage: 'wrapping_up',     what: 'Gap year ending · apprenticeship offer accepted',   skills: ['Adaptable', 'Teamwork'], initials: 'AS', color: '#FFF7ED' },
]

// ─── Course Discussions ───────────────────────────────────────────────────────

const DISCUSSIONS = [
  { module: 'CS2001', question: "What's the best way to approach Big O notation for the upcoming exam?", replies: 14, university: 'UCD', time: '2h ago' },
  { module: 'MG4021', question: 'Looking for Week 6 lecture notes for Consumer Behaviour, anyone have them?', replies: 7, university: 'UL', time: '5h ago' },
  { module: 'LA1102', question: 'Can anyone explain the difference between void and voidable contracts?', replies: 22, university: 'TCD', time: '1d ago' },
]

// ─── Cross-Ireland Features ───────────────────────────────────────────────────
// For graduates, prospective students, apprentices, and young workers.
const CROSS_IRELAND_FEATURES = [
  {
    key: 'grad_network', label: 'GRADUATE NETWORK', Icon: GraduationCap, color: 'rgba(245,240,232,0.15)',
    headline: 'Stay connected after you graduate',
    sub: 'A network for recent graduates across Irish institutions. Share opportunities, advice, and experience.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'cao_guide', label: 'CAO COURSE GUIDE', Icon: Compass, color: 'rgba(245,240,232,0.15)',
    headline: 'Find your course before you apply',
    sub: 'Course profiles, points history, and student reviews for every CAO-listed course in Ireland.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'apprenticeship', label: 'APPRENTICESHIP CONNECT', Icon: Briefcase, color: 'rgba(245,240,232,0.15)',
    headline: 'Navigate apprenticeships and vocational routes',
    sub: 'For young people in trade apprenticeships or vocational training. Resources, community, and support.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'industry_paths', label: 'INDUSTRY PATHWAYS', Icon: Globe, color: 'rgba(245,240,232,0.15)',
    headline: 'Explore where your course leads',
    sub: 'Industry-specific routes, salary benchmarks, and career insights for graduates and final-year students.',
    count: 'Coming soon', coming: true,
  },
  {
    key: 'all_reviews', label: 'COLLEGE REVIEWS (ALL-IRELAND)', Icon: Star, color: 'rgba(245,240,232,0.15)',
    headline: 'Every Irish college, reviewed honestly',
    sub: 'Open to current students, graduates, and prospective applicants. Search by course or institution.',
    count: 'Live now',
  },
]

// ─── Mentor Card ──────────────────────────────────────────────────────────────

function MentorCard({ mentor }) {
  const [open, setOpen] = useState(false)
  const initials = mentor.name.split(' ').map(n => n[0]).join('')

  return (
    <View style={styles.mentorCard}>
      <TouchableOpacity
        style={styles.mentorRow}
        activeOpacity={mentor.shell ? 1 : 0.75}
        onPress={() => !mentor.shell && setOpen(v => !v)}
        disabled={mentor.shell}
      >
        <View style={[styles.mentorCircle, { backgroundColor: mentor.initBg }]}>
          <Text style={styles.mentorInitials}>{initials}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.mentorName}>{mentor.name}</Text>
          {mentor.shell ? (
            <Text style={styles.mentorShell}>{mentor.shellMessage}</Text>
          ) : (
            <>
              <Text style={styles.mentorRole}>{mentor.role}</Text>
              <Text style={styles.mentorCourse}>
                {mentor.course} · {mentor.institution} {mentor.year}
              </Text>
            </>
          )}
        </View>
        {!mentor.shell && (
          open
            ? <ChevronUp   size={15} color={colors.navy} />
            : <ChevronDown size={15} color={colors.muted} />
        )}
      </TouchableOpacity>

      {!mentor.shell && mentor.areas && (
        <View style={styles.mentorAreaRow}>
          {mentor.areas.map(a => (
            <View key={a} style={styles.mentorAreaPill}>
              <Text style={styles.mentorAreaPillText}>{a}</Text>
            </View>
          ))}
        </View>
      )}

      {open && !mentor.shell && (
        <View style={styles.mentorExpanded}>
          <View style={styles.mentorDivider} />
          <Text style={styles.mentorBioLabel}>ABOUT</Text>
          <Text style={styles.mentorBio}>{mentor.bio}</Text>
          <TouchableOpacity
            style={styles.mentorConnectBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(`mailto:uniblueprintoperations@gmail.com?subject=${encodeURIComponent(`Mentorship request: ${mentor.name}`)}`)}
          >
            <Text style={styles.mentorConnectBtnText}>Request Mentorship</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CourseConnectScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [stageModalOpen, setStageModalOpen] = useState(false)
  const { userType, label: userTypeLabel } = useUserType()
  const { journeyStage, label: journeyStageLabel } = useJourneyStage()
  const path = PATH_CONTENT[userType] || PATH_CONTENT[USER_TYPE_STUDENT]
  const isStudent = userType === USER_TYPE_STUDENT

  // Journey Match filter — defaults to the signed-in person's own stage once
  // they've set one, so the first thing they see is people at THEIR stage,
  // not an arbitrary default. Falls back to showing every stage until then.
  const [stageFilter, setStageFilter] = useState(journeyStage || 'all')
  useEffect(() => {
    if (journeyStage) setStageFilter(journeyStage)
  }, [journeyStage])
  const filteredProfiles = stageFilter === 'all'
    ? JOURNEY_PROFILES
    : JOURNEY_PROFILES.filter(p => p.journeyStage === stageFilter)

  function goToDirectory() {
    navigation.getParent()?.navigate('Directory')
  }

  function goToAccountType() {
    navigation.getParent()?.navigate('Profile', { screen: 'ProfileMain' })
  }

  return (
    <View style={styles.screen}>

      {/* ── Integrated header + hero (stats live in the navy block) ── */}
      <View style={[styles.heroBlock, { paddingTop: insets.top + 8 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
            <Text style={styles.backBtnText}>Home</Text>
          </TouchableOpacity>
          <UBPLogo height={33} color={colors.cream} onPress={() => goToHome(navigation)} />
          <View style={{ width: 70 }} />
        </View>

        <Text style={styles.heroEyebrow}>COURSE CONNECT</Text>
        <Text style={styles.heroTitle}>Course Connect</Text>
        <Text style={styles.heroTagline}>
          Not matched by course or path. Matched by where you're actually at — same
          stage, same age, same journey, whatever you're doing to get there.
        </Text>
        <Text style={styles.heroSub}>{path.sub}</Text>

        {/*
          Stats: real Irish HE figures, not platform usage metrics.
          Source: HEA.ie Annual Report 2022/23 and CAO.ie course listings.
          Shown only to Student-type users, since they're genuinely CAO/HE
          specific — see the PATH_CONTENT comment above for why every other
          userType sees three unsourced, pathway-neutral stats instead.

          TODO (permanent): Confirm exact CAO course count at cao.ie before publishing.
          TODO (permanent): Confirm HE enrolment figure at hea.ie before publishing.
          "All 32" refers to counties, CourseConnect covers the full island.
        */}
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatNumber}>All 32</Text>
            <Text style={styles.heroStatLabel}>Counties{'\n'}Across Ireland</Text>
          </View>
          <View style={styles.heroStatDivider} />
          {isStudent ? (
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>1,300+</Text>
              <Text style={styles.heroStatLabel}>CAO Courses{'\n'}Covered</Text>
            </View>
          ) : (
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>{LIVE_TOOL_COUNT}</Text>
              <Text style={styles.heroStatLabel}>Live Tools{'\n'}& Boards</Text>
            </View>
          )}
          <View style={styles.heroStatDivider} />
          {isStudent ? (
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>240k+</Text>
              <Text style={styles.heroStatLabel}>Young People{'\n'}in Irish HE</Text>
            </View>
          ) : (
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>Free</Text>
              <Text style={styles.heroStatLabel}>To join,{'\n'}every path</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 56 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

          {/* ── Journey Stage banner — the actual matching mechanism. This
              is the primary framing on the screen now: same situation,
              same age, same journey, not same course/industry/path. ── */}
          <TouchableOpacity style={styles.stageBanner} activeOpacity={0.85} onPress={() => setStageModalOpen(true)}>
            <View style={styles.stageBannerIcon}>
              <Route size={15} color={colors.cream} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stageBannerLabel}>
                YOUR STAGE · {journeyStageLabel ? journeyStageLabel.toUpperCase() : 'NOT SET'}
              </Text>
              <Text style={styles.stageBannerText}>
                {journeyStageLabel
                  ? `You're grouped with everyone else at "${journeyStageLabel}" below — students, apprentices, gap year, and working people alike.`
                  : "Tell us where you're at so we can group you with people in the same boat, not just the same course."}
              </Text>
              <Text style={styles.stageBannerChange}>
                {journeyStageLabel ? 'Change your stage →' : 'Set your stage →'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* ── Adaptive path banner — this is secondary now: it explains
              how the boards/tools below apply to *what* this person is
              doing (Student, Apprentice, Gap Year, Worker). The Journey
              Stage banner above is the primary "who you'll meet" framing. ── */}
          <TouchableOpacity style={styles.pathBanner} activeOpacity={0.85} onPress={goToAccountType}>
            <View style={styles.pathBannerIcon}>
              <Repeat size={15} color={colors.navy} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pathBannerLabel}>VIEWING AS · {userTypeLabel.toUpperCase()}</Text>
              <Text style={styles.pathBannerText}>{path.banner}</Text>
              <Text style={styles.pathBannerChange}>Not right? Change your account type in Settings →</Text>
            </View>
          </TouchableOpacity>

          {/* ── Course Tools ── */}
          <SectionHeader eyebrow="What's Available" title="Course Tools" style={{ marginTop: spacing.lg }} />
          <View style={{ gap: 14 }}>
            {COURSE_FEATURES.map(f => (
              <FeatureCard key={f.key} feature={f} onPress={() => openCourseFeature(navigation, f.key)} />
            ))}
          </View>

          {/* ── Academic Support (white breakout section) ── */}
          <View style={styles.academicSection}>
            <Text style={styles.academicEyebrow}>{path.academicEyebrow}</Text>
            <Text style={styles.academicTitle}>{path.academicTitle}</Text>
            <Text style={styles.academicSub}>{path.toolsSub}</Text>

            <Text style={[styles.academicSubLabel, { marginTop: spacing.lg }]}>COURSE TOOLS</Text>
            <Text style={styles.academicSubSub}>Practical tools for your studies or training. Exact tool set being confirmed.</Text>
            <View style={{ gap: 12, marginTop: spacing.md }}>
              {ACADEMIC_TOOLS.map(f => <FeatureCard key={f.key} feature={f} />)}
            </View>

            <Text style={[styles.academicSubLabel, { marginTop: spacing.xl }]}>POPULAR NOTES</Text>
            <Text style={styles.academicSubSub}>Surfaced from students on similar courses. Shown as examples until your course community grows.</Text>
            <MockContentBanner
              title="Example notes, shown until your course goes live"
              subtitle="These notes are illustrative. Notes relevant to your module and institution will surface here once students start sharing."
              style={{ marginTop: spacing.md }}
            />
            <View style={{ gap: 10, marginTop: spacing.sm }}>
              {RECENT_NOTES.map((note, i) => (
                <Card key={i} style={styles.noteCard}>
                  <View style={styles.noteModuleBadge}>
                    <Text style={styles.noteModuleText}>{note.module}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <View style={styles.noteMeta}>
                      <Text style={styles.noteMetaText}>{note.university}</Text>
                      <Text style={styles.noteMetaText}>·</Text>
                      <Text style={styles.noteMetaText}>{note.views} views</Text>
                      <Text style={styles.noteMetaText}>·</Text>
                      <Text style={styles.noteMetaText}>{note.saved} saves</Text>
                    </View>
                  </View>
                  <ChevronRight size={14} color={colors.light} style={{ alignSelf: 'center' }} />
                </Card>
              ))}
            </View>

            <Text style={[styles.academicSubLabel, { marginTop: spacing.xl }]}>GRADUATE MENTORS</Text>
            <Text style={styles.academicSubSub}>{path.mentorsSub}</Text>
            <MockContentBanner
              title="Mentorship programme: building now"
              subtitle="Mentors matched to your course and institution. Full programme launching soon."
              style={{ marginTop: spacing.md }}
            />
            <View style={{ gap: 12, marginTop: spacing.sm }}>
              {GRADUATE_MENTORS.map(m => <MentorCard key={m.id} mentor={m} />)}
            </View>
          </View>

          {/* ── Journey Match — the primary grouping mechanism. People are
              filtered by shared journey stage FIRST, explicitly mixing
              Student/Apprentice/Gap Year/Worker within a stage. Course,
              institution, and subject stay available as a secondary,
              opt-in filter/detail via "Browse Full Directory" below,
              never the organizing principle for this section. ── */}
          <SectionHeader eyebrow="Journey Match" title="People at Your Stage" style={{ marginTop: spacing.xl }} />
          <Text style={styles.journeyIntro}>
            Not grouped by course, industry, or path — by where people actually are
            right now. Filter by stage below and you'll see students, apprentices,
            gap-year people, and workers together, whenever they're at the same one.
          </Text>
          <MockContentBanner
            title="Preview shown below"
            subtitle="These cards are illustrative — browse the real Journey Match and User Database in the Directory tab."
          />

          {/* Stage filter chips */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={{ marginTop: spacing.md }}
            contentContainerStyle={{ gap: 8, paddingRight: spacing.md }}
          >
            <TouchableOpacity
              style={[styles.stageChip, stageFilter === 'all' && styles.stageChipActive]}
              activeOpacity={0.8}
              onPress={() => setStageFilter('all')}
            >
              <Text style={[styles.stageChipText, stageFilter === 'all' && styles.stageChipTextActive]}>All stages</Text>
            </TouchableOpacity>
            {JOURNEY_STAGES.map(st => {
              const active = stageFilter === st.key
              return (
                <TouchableOpacity
                  key={st.key}
                  style={[styles.stageChip, active && styles.stageChipActive]}
                  activeOpacity={0.8}
                  onPress={() => setStageFilter(st.key)}
                >
                  <Text style={[styles.stageChipText, active && styles.stageChipTextActive]}>{st.label}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={[styles.rowScroll, { marginTop: spacing.md }]}
            contentContainerStyle={{ paddingRight: spacing.md }}
          >
            {filteredProfiles.map((p, i) => (
              <TouchableOpacity key={i} activeOpacity={0.8} onPress={goToDirectory}>
                <View style={[styles.studentCard, { backgroundColor: p.color }]}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentInitials}>{p.initials}</Text>
                  </View>
                  <Text style={styles.studentName} numberOfLines={1}>{p.name}</Text>
                  <View style={styles.pathTag}>
                    <Text style={styles.pathTagText}>{labelForUserType(p.userType)}</Text>
                  </View>
                  <Text style={styles.studentCourse} numberOfLines={2}>{p.what}</Text>
                  <View style={styles.studentSkills}>
                    {p.skills.slice(0, 2).map(sk => (
                      <View key={sk} style={styles.skillPill}>
                        <Text style={styles.skillPillText}>{sk}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {filteredProfiles.length === 0 && (
              <View style={styles.stageEmpty}>
                <Text style={styles.stageEmptyText}>No preview profiles at this stage yet — try a different stage, or check All stages.</Text>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={[styles.secondaryBtn, { marginTop: spacing.md }]} activeOpacity={0.8} onPress={goToDirectory}>
            <Text style={styles.secondaryBtnText}>Browse Full Directory</Text>
          </TouchableOpacity>

          {/* ── Course Discussions ── */}
          <SectionHeader eyebrow="Community" title="Recent Discussions" style={{ marginTop: spacing.xl }} />
          <MockContentBanner
            title="Examples shown below — Module Q&A is live"
            subtitle="These preview threads are illustrative. Tap through to ask a real question or browse live answers."
          />
          <View style={{ gap: 10 }}>
            {DISCUSSIONS.map((d, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ModuleQA')}
              >
                <Card style={styles.discussionCard}>
                  <View style={styles.discussionTop}>
                    <View style={styles.noteModuleBadge}>
                      <Text style={styles.noteModuleText}>{d.module}</Text>
                    </View>
                    <Text style={styles.discussionTime}>{d.time}</Text>
                  </View>
                  <Text style={styles.discussionQuestion} numberOfLines={2}>{d.question}</Text>
                  <View style={styles.discussionMeta}>
                    <MessageSquare size={12} color={colors.muted} />
                    <Text style={styles.discussionReplies}>{d.replies} replies</Text>
                    <Text style={styles.discussionUni}>{d.university}</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.secondaryBtn, { marginTop: spacing.md }]} activeOpacity={0.8} onPress={() => navigation.navigate('ModuleQA')}>
            <Text style={styles.secondaryBtnText}>Browse All Module Q&A</Text>
          </TouchableOpacity>

          {/* ── Cross-Ireland (navy breakout section) ── */}
          <View style={styles.crossIrelandSection}>
            <Text style={styles.crossIrelandEyebrow}>ACROSS IRELAND</Text>
            <Text style={styles.crossIrelandTitle}>Built for every young person in Ireland</Text>
            <Text style={styles.crossIrelandSub}>
              Not just current university students. Whether you're a recent graduate, a prospective student, on an apprenticeship, or taking a gap year, this section is for you.
            </Text>
            <View style={{ gap: 14, marginTop: spacing.lg }}>
              {CROSS_IRELAND_FEATURES.map(f => (
                <FeatureCard
                  key={f.key}
                  feature={f}
                  dark
                  onPress={f.key === 'all_reviews' ? () => openCourseFeature(navigation, 'college_reviews') : undefined}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => setPickerOpen(true)}
          >
            <Plus size={16} color={colors.cream} />
            <Text style={styles.primaryBtnText}>Post to a Course Connect Board</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      <CourseBoardPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={board => {
          setPickerOpen(false)
          if (board.key === 'module-qa') navigation.navigate('ModuleQA', { openAsk: true })
          else navigation.navigate('BoardDetail', { boardKey: board.key, registry: 'course', openPostForm: true })
        }}
      />

      <JourneyStageModal
        visible={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  // Hero (includes stats)
  heroBlock: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.lg,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingRight: 10,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2, marginBottom: 6,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 30, color: colors.cream, lineHeight: 38, marginBottom: 10 },
  heroTagline: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.gold, lineHeight: 20, marginBottom: 10 },
  heroSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', lineHeight: 22, marginBottom: spacing.lg },

  // Stats inside hero
  heroStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,240,232,0.08)',
    borderRadius: radius.card, padding: spacing.md,
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.12)',
  },
  heroStatItem:   { flex: 1, alignItems: 'center' },
  heroStatNumber: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },
  heroStatLabel:  { fontFamily: fonts.sans, fontSize: 10, color: 'rgba(245,240,232,0.65)', marginTop: 3, textAlign: 'center', lineHeight: 14 },
  heroStatDivider:{ width: 1, height: 36, backgroundColor: 'rgba(245,240,232,0.15)' },

  // THE fix for the header floating/overlapping content on native — see
  // HomeScreen.jsx's mainScroll comment for the full explanation. A
  // ScrollView needs an explicit flex (not just contentContainerStyle) on
  // its own `style` or native has nothing to size its clipped viewport
  // against; react-native-web silently tolerates the omission, which is
  // why this only broke on a physical phone.
  scrollView: { flex: 1 },
  scroll:  {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  // Journey Stage banner — primary framing, so it's the bolder (navy) card
  stageBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: colors.navy, borderRadius: radius.card,
    padding: 14, marginTop: spacing.lg,
    ...shadows.card,
  },
  stageBannerIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(245,240,232,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  stageBannerLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.goldLight, letterSpacing: 0.8 },
  stageBannerText:  { fontFamily: fonts.sans, fontSize: 13, color: colors.cream, lineHeight: 19, marginTop: 4 },
  stageBannerChange:{ fontFamily: fonts.sansMedium, fontSize: 11.5, color: 'rgba(245,240,232,0.65)', marginTop: 6 },

  // Adaptive path banner
  pathBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: colors.white, borderRadius: radius.card,
    padding: 14, marginTop: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    ...shadows.card,
  },
  pathBannerIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(201,162,75,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  pathBannerLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.goldDeep, letterSpacing: 0.8 },
  pathBannerText:  { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 19, marginTop: 4 },
  pathBannerChange:{ fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.muted, marginTop: 6 },

  // Academic Support section (white breakout)
  academicSection: {
    backgroundColor: colors.white,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    marginTop: spacing.xl,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)',
  },
  academicEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    letterSpacing: 1.2, marginBottom: 6,
  },
  academicTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy, lineHeight: 33 },
  academicSub:   { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 8, lineHeight: 21 },
  academicSubLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.navy,
    opacity: 0.55, letterSpacing: 0.8,
  },
  academicSubSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },

  // Cross-Ireland section (navy breakout)
  crossIrelandSection: {
    backgroundColor: colors.navy,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  crossIrelandEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2, marginBottom: 6,
  },
  crossIrelandTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, lineHeight: 33 },
  crossIrelandSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.65)', marginTop: 8, lineHeight: 21 },

  // Mentor Card
  mentorCard: {
    backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden',
    ...shadows.card,
  },
  mentorRow:     { flexDirection: 'row', alignItems: 'center', padding: 14 },
  mentorCircle:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  mentorInitials:{ fontFamily: fonts.serif, fontSize: 16, color: colors.navy },
  mentorName:    { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  mentorRole:    { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy, opacity: 0.75, marginTop: 1 },
  mentorCourse:  { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },
  mentorShell:   { fontFamily: fonts.sans, fontSize: 12, color: colors.light, fontStyle: 'italic', marginTop: 2 },
  mentorAreaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 14 },
  mentorAreaPill:     { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 4 },
  mentorAreaPillText: { fontFamily: fonts.sans, fontSize: 11, color: colors.navy },
  mentorExpanded:     { paddingHorizontal: 14, paddingBottom: 16 },
  mentorDivider:      { height: 1, backgroundColor: 'rgba(30,58,95,0.08)', marginBottom: 14 },
  mentorBioLabel:     { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, letterSpacing: 0.8, marginBottom: 6 },
  mentorBio:          { fontFamily: fonts.sans, fontSize: 13, color: colors.navy, lineHeight: 20 },
  mentorConnectBtn:   { backgroundColor: colors.navy, borderRadius: 8, height: 42, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  mentorConnectBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  // Notes
  rowScroll:       { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  noteCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  noteModuleBadge: { backgroundColor: colors.navy, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 5, flexShrink: 0 },
  noteModuleText:  { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.cream },
  noteTitle:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 18 },
  noteMeta:        { flexDirection: 'row', gap: 5, marginTop: 3 },
  noteMetaText:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  // Journey Match intro + stage filter chips
  journeyIntro: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 8 },
  stageChip: {
    borderRadius: radius.badge, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.12)',
  },
  stageChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  stageChipText:   { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.navy },
  stageChipTextActive: { color: colors.cream },
  stageEmpty:  { width: 260, padding: spacing.md, justifyContent: 'center' },
  stageEmptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },

  // Journey Match cards (mix of Student/Apprentice/Gap Year/Worker per stage)
  studentCard:     { width: 158, borderRadius: radius.card, padding: 14, marginRight: 12, alignItems: 'center' },
  studentAvatar:   { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(30,58,95,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  studentInitials: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy },
  studentName:     { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, textAlign: 'center' },
  pathTag: {
    backgroundColor: 'rgba(30,58,95,0.10)', borderRadius: radius.badge,
    paddingHorizontal: 7, paddingVertical: 2, marginTop: 5,
  },
  pathTagText:     { fontFamily: fonts.sansSemiBold, fontSize: 9.5, color: colors.navy, opacity: 0.7, letterSpacing: 0.4 },
  studentCourse:   { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 15 },
  studentSkills:   { flexDirection: 'row', gap: 4, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  skillPill:       { backgroundColor: 'rgba(30,58,95,0.1)', borderRadius: radius.badge, paddingHorizontal: 7, paddingVertical: 3 },
  skillPillText:   { fontFamily: fonts.sans, fontSize: 10, color: colors.navy },

  // Discussions
  discussionCard:     { padding: 14 },
  discussionTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  discussionTime:     { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  discussionQuestion: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, lineHeight: 19 },
  discussionMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  discussionReplies:  { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, flex: 1 },
  discussionUni:      { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.navy, opacity: 0.6 },

  // CTAs
  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.navy, borderRadius: 8, height: 54, marginTop: spacing.lg },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
  secondaryBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 8, height: 46, borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.15)' },
  secondaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
})
