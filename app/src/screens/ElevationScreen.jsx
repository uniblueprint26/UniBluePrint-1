import { useMemo, useState } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Send, X,
  LayoutGrid, Dumbbell, GraduationCap, Wallet, Megaphone,
} from 'lucide-react-native'

import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { PILLARS } from '../constants/pillars'
import Button from '../components/ui/Button'
import FeaturedCoaches from '../components/elevation/FeaturedCoaches'
import { orderCoaches } from '../lib/coachDisplay'
import { pillarTint } from '../constants/pillarTints'
import ProUpgradeGate from '../components/ui/ProUpgradeGate'
import SlowLoad from '../components/ui/SlowLoad'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { goToHome } from '../navigation/helpers'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProAccess } from '../hooks/useProAccess'
import { useComingSoonEnabled } from '../constants/comingSoon'

// ─── Filter pills ─────────────────────────────────────────────────────────────
// Round 2: Fitness + Sports + Yoga merged into one "Fitness" category, and
// Creative folded entirely into "Marketing" — real coach roster review left
// only 4 real categories (Fitness, Academic Grinds, Finance, Marketing). The
// previous 2-column tile grid (built for 7 categories) reads oddly with that
// few — an awkward lone tile on its own row, lots of empty card padding for
// not much information. A single horizontal row of filter pills is the
// standard, compact pattern for a handful of categories and reads far less
// awkward at this count, so the grid is retired in favour of it here.
const FILTERS = [
  { label: 'All Coaches',      filter: 'All',             Icon: LayoutGrid    },
  { label: 'Fitness',          filter: 'Fitness',         Icon: Dumbbell      },
  { label: 'Academic Grinds',  filter: 'Academic Grinds', Icon: GraduationCap },
  { label: 'Finance',          filter: 'Finance',         Icon: Wallet        },
  { label: 'Marketing',        filter: 'Marketing',       Icon: Megaphone     },
]

// ─── Coaches ──────────────────────────────────────────────────────────────────
// Removed: Shauna Rogers, Ethan Henry, Fayed, Stephen McKeown
// Updated: Milan Piroska, Emanuel Tolic, Jayden Reynolds
// Added: Tadgh Darcy, Eitne Jarrett, Kevin (TrainWitKev), Aoife Keogh
//
// Round 2 — Removed: Ali, Eitne Jarrett, Nikola Jurek
// Round 2 — Renamed: Emmanuel Fasanmi -> 500+ with Eman
// Round 2 — Updated: Aoife Keogh (shell -> full)
// Release batch — Removed: all trading coaches and trading content.
// Round 2 — Added: Camila (also a Lifestyle partner), Luana (shell)

// Stable key linking a coach's static listing here to their live
// coach_profiles row in Supabase (coach_profiles.coach_slug), so a coach's
// self-edited bio/photo, and a coach's booking enquiries, can be looked up
// without every coach needing a fully structured database record.
export function coachSlug(id) {
  return `coach-${id}`
}

// GDPR fix: coaches' personal contact details (email, phone, Instagram/
// TikTok handles, Linktree links) used to be hardcoded in this static array,
// which meant a coach's deletion/correction request could only be actioned
// by shipping a new app-store release. Those fields now live in
// coach_contact_details (see migration 20261012120000_coach_contact_details),
// scoped so only the coach themself and Operations/Founder can read or write
// them — a public app user never had a real need to see raw contact details
// directly, since every "get in touch with a coach" path already goes
// through coach_enquiries ("Send a Quick Message" on the profile page, and
// "Find me a coach" below). Direct contact-detail display was removed
// rather than rebuilt against the new table for that reason.

// availability (per coach): 'taking' shows "Taking clients" with a green dot, 'nearly_full'
// shows "Nearly full" with an amber dot, leave it out to show nothing. Every coach is
// seeded 'taking' as a placeholder until the founder sets the real one.
export const COACHES = [
  // ── Academic ──
  {
    id: 1, name: '500+ with Eman', category: 'Academic Grinds', filter: 'Academic Grinds',
    availability: 'taking',
    slug: 'eman', verified: true,
    heroImage: require('../../assets/coaches/eman/hero.jpg'),
    // New profile photo: the round photo on the profile and the featured card picture.
    // The existing 500+ with Eman logo stays as the banner.
    avatar: require('../../assets/coaches/eman/pfp.jpg'),
    cardImage: require('../../assets/coaches/eman/pfp.jpg'),
    bannerFit: 'contain', bannerBg: '#0E0E10',
    location: 'Dublin', from: 'Available on request',
    tagline: 'From under 400 points to 500+, proven study strategy.',
    services: ['Leaving Cert Maths', 'Leaving Cert Biology', 'Leaving Cert Physics'],
    bio: "Hi, I'm Emmanuel, a UCD student who transformed my own Leaving Cert performance, taking my points from under 400 to 500+ in just a few months. Now I help students do the same, specialising in Leaving Cert Maths, Biology, and Physics, combining proven study strategies, smarter revision techniques, and exam-focused approaches to help students understand the material, maximise their marks, and make significant grade improvements. I'm not here to just teach you what's in the textbook, I'm here to show you how to study smarter, approach questions strategically, and perform when it matters most. If you're aiming for 500+, I'll help you build the structure, confidence, and exam technique to give yourself the best possible shot at getting there.",
  },

  // ── Sports ──
  {
    id: 2, name: 'JMC Fitness', category: 'Sports Coaching', filter: 'Fitness',
    availability: 'taking',
    slug: 'jmc-fitness', verified: true,
    heroImage: require('../../assets/coaches/jmc-fitness/hero.jpg'),
    // The hero is the JMC Fitness logo on its own blue, so the featured card
    // shows it whole (contain) on that blue instead of cropping the lettering.
    cardFit: 'contain', cardBg: '#394875',
    // Round photo: the arm mark cropped square from logo.jpg (the full logo is too wide for a circle).
    avatar: require('../../assets/coaches/jmc-fitness/avatar.jpg'),
    bannerFit: 'contain', bannerBg: '#3F4E80',
    tagline: 'Transform your body without wasting time. Custom training and nutrition plans.',
    gallery: [
      require('../../assets/coaches/jmc-fitness/gallery-1.jpg'),
      require('../../assets/coaches/jmc-fitness/gallery-2.jpg'),
      require('../../assets/coaches/jmc-fitness/gallery-3.jpg'),
      require('../../assets/coaches/jmc-fitness/gallery-4.jpg'),
      require('../../assets/coaches/jmc-fitness/gallery-5.jpg'),
    ],
    location: 'Dublin', from: '€50/hr',
    services: ['12-Week Online Plan', 'In-Person Training', 'Football Coaching', 'Analytics Breakdown', 'Dietary Guidance', 'Agent Connections'],
    bio: "I offer elite sports coaching with fully personalised programmes for students serious about performance. In-person sessions run on North Dublin 4G Astro, plus football coaching and professional agent connections.",
    pricelist: [
      { label: '12-Week Online Plan', price: '€300' },
      { label: 'In-Person Session (1hr)', price: '€50' },
      { label: 'Analytics Breakdown', price: '€100' },
    ],
  },

  // ── Creative ──
  {
    id: 3, name: 'Nathan Yanzo (Nyz3ditz)', category: 'Photography & Video', filter: 'Marketing',
    availability: 'taking',
    slug: 'nathan-yanzo', verified: true,
    heroImage: require('../../assets/coaches/nathan-yanzo/hero.jpg'),
    // Founder uploaded photos. The hero is the Nyz3ditz Studio logo, so the featured
    // card uses the portrait (second photo) and the logo stays as the banner.
    cardImage: require('../../assets/coaches/nathan-yanzo/gallery-2.jpg'),
    bannerFit: 'contain', bannerBg: '#000000',
    avatar: require('../../assets/coaches/nathan-yanzo/gallery-2.jpg'),
    gallery: [
      require('../../assets/coaches/nathan-yanzo/gallery-1.jpg'),
      require('../../assets/coaches/nathan-yanzo/gallery-2.jpg'),
      require('../../assets/coaches/nathan-yanzo/gallery-3.jpg'),
      require('../../assets/coaches/nathan-yanzo/gallery-4.jpg'),
      require('../../assets/coaches/nathan-yanzo/gallery-5.jpg'),
      require('../../assets/coaches/nathan-yanzo/gallery-6.jpg'),
    ],
    location: 'Dublin', from: 'Upon request',
    services: ['Monthly Mentorship', '1-1 Shoot Session', 'Editing Guidance', 'Creative Direction'],
    bio: "I'm a professional photographer and videographer offering mentorship and shoot sessions. My monthly subscription includes Zoom calls and editing guidance.",
    pricelist: [
      { label: 'Monthly Subscription', price: '€55/month' },
      { label: '1-1 Shoot Session', price: '€90' },
    ],
  },

  // ── Finance ──
  {
    id: 16, name: 'Zainab Adeyemi (Soft Life Investing)', category: 'Investing and Finance Coach', filter: 'Finance',
    availability: 'taking',
    slug: 'zainab-adeyemi', verified: true,
    heroImage: require('../../assets/coaches/zainab-adeyemi/hero.jpg'),
    location: 'Ireland', from: 'Available on request',
    title: 'Chartered Accountant · Founder, Soft Life Investing',
    tagline: 'Personal finance without the finance bro jargon.',
    services: ['1:1 Personal Finance Coaching', 'Budgeting & Saving', 'Getting Started with Investing', 'Irish Investing Tax Rules (Deemed Disposal, Exit Tax, DIRT)'],
    bio: "I'm a chartered accountant and founder of Soft Life Investing, helping thousands of first-generation wealth builders make sense of personal finance without the finance bro jargon, covering everything from budgeting basics to Irish-specific investing rules like deemed disposal, exit tax, and DIRT.",
    sections: [
      {
        title: 'How Sessions Work',
        body: '1:1 personal finance coaching sessions for students, covering budgeting, saving, and getting started with investing, including the Irish-specific tax rules most guides skip over. Delivered over video call.',
      },
      {
        title: 'Free Investing Guide',
        body: 'A free beginner-friendly investing guide is available, ask about it when you book.',
      },
    ],
    bookingNote: 'Reach out via Instagram to book, availability is flexible week to week rather than a fixed recurring slot.',
  },

  // ── Fitness ──
  {
    id: 17, name: 'Camila Aruk', category: 'Personal Training · Muay Thai · Yoga',
    availability: 'taking',
    slug: 'camila-aruk', verified: true,
    heroImage: require('../../assets/coaches/camila-aruk/hero.jpg'),
    // Card-only single specialty tag — the full compound category above still
    // shows on her profile page, but the grid card shows one clear tag per
    // coach (see CoachCard). Personal Training is the most representative of
    // her three: it's her core discipline and the lead item in her services
    // list, with Muay Thai/Yoga as complementary offerings rather than
    // co-equal specialties.
    cardTag: 'Personal Training', filter: 'Fitness',
    location: 'Dublin', from: '€60/session',
    title: 'Certified Personal Trainer / Sport Nutritionist Coach / Muay Thai / Yoga / Functional Training',
    tagline: 'HEALTHY · WELLNESS · FITNESS',
    services: ['Physical Development', 'Muscle Gain', 'Fat Loss', 'Nutrition Coaching', 'Muay Thai Fitness', 'Yoga', 'Functional Training', 'Rehabilitation', 'Pre & Post Birth', 'Body Scan'],
    bio: "With over 10 years of experience in fitness, martial arts, and lifestyle coaching, I help people transform their bodies, mindset, and daily habits through personalised training, nutrition guidance, and realistic routines. My focus areas include physique development, weight loss, muscle building, self-defence, confidence, lifestyle improvement, and pre-contest preparation, for both athletes and everyday people.",
    quote: 'My goal is not just to motivate you for a few weeks, but to give you the knowledge, structure, and real reason to keep going, even when motivation is not there. When you know your WHY, you don\'t need motivation, you need DIRECTION, that\'s where I come in to help you.',
    pricelist: [
      { label: 'PT, 1x/week', price: '€220/month' },
      { label: 'PT, 2x/week', price: '€370/month' },
      { label: 'PT, Pay as you go', price: '€60/session' },
      { label: 'Body Scan', price: '€70/session' },
      { label: 'Food Plan + e-book', price: '€120' },
      { label: 'Online Coach', price: '€320/month' },
    ],
    package: ['Video call for PARQ', 'WhatsApp support', 'Food plan', 'Workout plan (app)', 'Schedule routine (app)', 'Supplement suggestions'],
    crossLink: {
      label: "Also a Lifestyle Blueprint partner, see Camila's Lifestyle listing",
      screen: 'Lifestyle',
      params: { highlightId: 'camila' },
    },
  },


  {
    id: 7, name: 'Tadgh Darcy', category: 'Physique Development', filter: 'Fitness',
    availability: 'taking',
    slug: 'tadgh-darcy', verified: true,
    location: 'Dublin', from: 'Available on request',
    services: ['Tailored Nutrition Plan', 'Custom Training Programme', 'Weekly Check-in Videos', 'All-in-One Coaching App', 'Direct Coach Access'],
    quote: "Online physique development coach, main goal is to help people regain confidence and build healthy sustainable habits whilst also enjoying the process. Based in Dublin.",
    bio: "I'm a qualified personal trainer with 4 to 5 years of gym experience and several male and female client results to show for it. I teach efficient training and nutrition that fits into real life. I personally lost over 30kg and completed photoshoot prep myself, so I know exactly what the process takes. I'm a strong believer in building a healthy relationship with food alongside the physical side. My main goal is to help people regain confidence and build healthy, sustainable habits while enjoying the process, online physique development coaching built around you.",
    // Studio photoshoot set (Sept 2026 asset round). heroImage is the
    // designated Spotlight/card image; gallery is the full supplied set for
    // the profile's sliding photo gallery — see CoachProfileScreen.
    heroImage: require('../../assets/coaches/tadgh-darcy/hero.jpg'),
    gallery: [
      require('../../assets/coaches/tadgh-darcy/gallery-1.jpg'),
      require('../../assets/coaches/tadgh-darcy/gallery-2.jpg'),
      require('../../assets/coaches/tadgh-darcy/gallery-3.jpg'),
      require('../../assets/coaches/tadgh-darcy/gallery-4.jpg'),
    ],
  },

  {
    id: 8, name: 'Milan Piroska (MPFitness)', category: 'Personal Training', filter: 'Fitness',
    availability: 'taking',
    slug: 'milan-piroska', verified: true,
    location: 'Kildare', from: '€40/session',
    title: 'Certified Personal Trainer / Advanced Nutrition Coach / International Men\'s Physique Athlete',
    tagline: 'MPFitness. More Than Fitness.',
    services: ['Physique Development', 'Muscle Gain', 'Fat Loss', 'Nutrition Coaching', 'Lifestyle Transformation', 'Holiday & Contest Prep'],
    bio: "I specialise in Physique and Lifestyle Transformations via Fat Loss and Lean Muscle Gain, with 20+ client transformations behind me. I work with clients on physique development, muscle gain, fat loss, nutrition, lifestyle change, and holiday, photoshoot, and contest prep.",
    quote: 'Guarantee of achieving your true potential through proven systems and methodologies with personalised training solutions to fit your lifestyle, goals and preferences. Crafted with precision and backed by results.',
    // Studio/gym photoshoot set (Sept 2026 asset round), trimmed from the
    // 14 supplied non-hero shots down to 7 of the strongest, most varied —
    // 2 action/training shots plus front/back, relaxed/flexed physique
    // poses — rather than padding the slider with near-duplicate mirror
    // selfies. heroImage is the designated Spotlight/card image.
    heroImage: require('../../assets/coaches/milan-piroska/hero.jpg'),
    // The hero is a very dark black and white shot. The featured card and round photo use a brighter gallery shot.
    cardImage: require('../../assets/coaches/milan-piroska/gallery-1.jpg'),
    avatar: require('../../assets/coaches/milan-piroska/gallery-1.jpg'),
    gallery: [
      require('../../assets/coaches/milan-piroska/gallery-1.jpg'),
      require('../../assets/coaches/milan-piroska/gallery-2.jpg'),
      require('../../assets/coaches/milan-piroska/gallery-3.jpg'),
      require('../../assets/coaches/milan-piroska/gallery-4.jpg'),
      require('../../assets/coaches/milan-piroska/gallery-5.jpg'),
      require('../../assets/coaches/milan-piroska/gallery-6.jpg'),
      require('../../assets/coaches/milan-piroska/gallery-7.jpg'),
    ],
    pricelist: [
      { label: '1x per week', price: '€50/session' },
      { label: '2x per week', price: '€45/session' },
      { label: '3x per week', price: '€40/session' },
      { label: 'One-time session', price: '€60' },
    ],
    package: [
      'Online training and nutrition programmes',
      'Online tracking tools',
      '24/7 WhatsApp support',
      'Frequent check-ins',
    ],
    pricingNote: 'Available in 8, 10, or 12-week blocks. Payable in 2 instalments or in full.',
  },

  {
    id: 9, name: 'Kevin (TrainWitKev)', category: 'Personal Training', filter: 'Fitness',
    availability: 'taking',
    slug: 'kevin-trainwitkev', verified: true,
    heroImage: require('../../assets/coaches/kevin-trainwitkev/hero.jpg'),
    location: 'Dublin', from: '€25/session',
    tagline: 'Strength. Physique. Confidence. Mindset.',
    services: ['1-to-1 Personal Training', 'Beginner Gym Coaching', 'Personalised Training Programmes', 'Accountability & Progress Coaching'],
    bio: "I'm the coach behind TrainWitKev and the mindset behind WORKSYY. I help people get stronger, build a physique they're proud of, and gain real confidence in and out of the gym. I work with complete beginners through to people who've plateaued on consistency or progress, with a focus on structure, technique, understanding, and sustainable progress.",
    quote: 'A mad yoke with something to prove. WORKSYY.',
    pricelist: [
      { label: '1-to-1 PT: Single session', price: '€25' },
      { label: '1-to-1 PT: 4 sessions', price: '€90' },
      { label: '1-to-1 PT: 8 sessions', price: '€170' },
      { label: 'Personalised Training Programme', price: '€25' },
      { label: 'Initial consultation', price: 'Free' },
    ],
    bookingNote: 'Direct booking coming soon. Get in touch to enquire.',
    pricingNote: 'Currently coaching clients as part of building experience and client base. Testimonials available on request.',
  },

  // ── Marketing / Branding ──
  {
    id: 10, name: 'Alex Leva', category: 'Digital Marketing', filter: 'Marketing',
    availability: 'taking',
    slug: 'alex-leva', verified: true,
    heroImage: require('../../assets/coaches/alex-leva/hero.jpg'),
    location: 'Mayo',
    // No set price and no pricelist to clarify a number against — a bare
    // "€40" reads as a real fixed rate when it isn't one. Standardized
    // fallback phrase for coaches without fixed pricing.
    from: "Let's chat pricing",
    badge: 'Student Mentor Listing',
    services: ['Social Media Content Plans', 'Captions & Graphics', 'Creator Coordination', 'Client Reporting', 'Student Mentorship'],
    bio: "I'm a digital marketing specialist running my own freelance business, LEVA Impact, working across social media strategy, content creation, graphic design, and AI-powered video production. I bring students onto real, live client projects rather than mock briefs.",
    sections: [
      {
        title: 'How I Work With Companies',
        body: 'I usually start with a chat to understand the business and what they\'re missing, then build out a content plan across their social platforms, Instagram, Facebook, and TikTok. From there I handle everything from captions and graphics to coordinating creators for video content, and I report back regularly so the business can see what\'s working.',
      },
      {
        title: 'Helping Students Get Real Experience',
        body: 'I bring students onto real client projects, not mock briefs. They get hands-on experience creating content, working with actual brands, and building a portfolio of real, published work they can show future employers or clients.',
      },
      {
        title: 'Results & Outcomes',
        body: 'Students who\'ve worked with me have gained real hands-on experience, grown their portfolios with published brand content, and become more confident creating content, all while being coached and guided by me along the way.',
      },
      {
        title: 'What Students Can Expect',
        body: 'Real, practical experience working directly with a live brand, not just theory. You\'ll get guidance along the way, exposure to how a small business actually runs its marketing, and content you can add straight to your portfolio.',
      },
    ],
    crossLink: {
      label: 'Also runs LEVA Impact, see the Lifestyle Blueprint listing',
      screen: 'Lifestyle',
      params: { highlightId: 'leva' },
    },
  },

  // ── Health & Fitness ──
  {
    id: 12, name: 'Jayden Reynolds', category: 'Health & Fitness Coaching', filter: 'Fitness',
    availability: 'taking',
    slug: 'jayden-reynolds', verified: true,
    heroImage: require('../../assets/coaches/jayden-reynolds/hero.jpg'),
    location: 'Sligo', from: 'Available on request',
    services: ['1-1 Online Coaching', 'Tailored Fitness Plans', 'Nutritional Guidance', 'Regular Check-ins', 'Nutrition Journal', 'Local In-Person Coaching'],
    bio: "I'm a qualified Personal Trainer with over a decade of experience, passionate about helping people balance school, work, fitness, sport, and social life. I'm also a League of Ireland player, and I'm available for both online and local in-person coaching in County Sligo.",
  },

  // ── Yoga ──
  {
    id: 13, name: 'Aoife Keogh', category: 'Yoga', filter: 'Fitness',
    availability: 'taking',
    slug: 'aoife-keogh', verified: true,
    heroImage: require('../../assets/coaches/aoife-keogh/hero.jpg'),
    location: 'Dublin',
    from: 'Available on request',
    title: '200 Hour Certified Yoga Teacher | Psychology | Life Coaching',
    tagline: 'The Brave Flow Yoga',
    services: ['Beginner Friendly Yoga', 'Relaxation & Stress Relief', 'Yoga for Focus & Concentration', 'Evening & Bedtime Yoga', '1-to-1 Yoga Sessions', 'Small Group Sessions', 'Meditation Classes', 'Journaling Sessions'],
    bio: "I'm a 200-hour certified yoga teacher with a Diploma in Psychology and a passion for creating welcoming spaces where people can slow down, reconnect with themselves, and feel more grounded. I'm currently training in Life Coaching and continuing my yoga education through further training in Yin and Restorative Yoga. Through The Brave Flow Yoga, I aim to make yoga and mindfulness accessible to everyone, especially students who may be navigating busy schedules, academic pressure, stress, and the challenges of everyday life. My teaching style is calm, supportive, and beginner friendly. I have experience teaching multiple classes and holding a calm, supportive space for people to relax and feel comfortable. My sessions are designed to meet you where you are, whether you're looking to unwind after a long day, improve your focus, move your body, or create a little more balance in your routine. I offer both online and in-person sessions.",
    quote: "You don't need to be flexible, experienced, or \"good at yoga\" to benefit from the practice. Yoga can be a chance to pause, breathe, move, reflect, and simply give yourself some time and space.",
    sections: [
      {
        title: 'My Approach',
        body: "My classes are non-judgemental, welcoming, and accessible. I want you to feel comfortable exactly as you are. Whether you're looking for a break from studying, feeling overwhelmed, struggling to switch off, wanting to improve your focus, or simply looking for a moment of calm, my sessions offer a space to pause and reset.",
      },
      {
        title: 'Qualifications & Training',
        body: '200-Hour Yoga Teacher Training · Diploma in Psychology · Currently training in Life Coaching · Further training in Yin Yoga · Further training in Restorative Yoga.',
      },
    ],
    bookingNote: 'Book online at bookwhen.com/thebraveflowyoga.',
  },

  {
    id: 18, name: 'Luana Ciweck', category: 'Online Fitness Coaching', filter: 'Fitness',
    availability: 'taking',
    slug: 'luana-ciweck', verified: true,
    heroImage: require('../../assets/coaches/luana-ciweck/hero.jpg'),
    location: 'Mayo', from: 'Available on request',
    tagline: 'Confidence. Strength. Sustainable change.',
    services: ['Online Fitness Coaching'],
    bio: "I'm Luana, 21, a qualified fitness professional with a huge passion for training, health, and helping others become the best version of themselves. I completed my training with Image Fitness and have gained hands-on experience working with clients on the gym floor. Everyone is different, which is why I build an approach tailored to each individual's goals, lifestyle, and experience level. Training is a huge part of my own life too, I've personally gone through both bulking and cutting phases, and having experienced those stages myself helps me understand the highs, lows, challenges, and rewards that come with pursuing your own fitness goals.",
    sections: [
      {
        title: 'My Coaching Goal',
        body: "My goal with online coaching is to help you build confidence, become stronger, make sustainable changes, and achieve results you can be proud of. Whether you're looking to build muscle, lose body fat, improve your strength, or simply feel more confident in yourself, I'm here to support, guide, and motivate you every step of the way.",
      },
    ],
    bookingNote: 'Enquire directly via Instagram DM to book.',
  },
]

// ─── Groups (used when filter = All) ─────────────────────────────────────────

const GROUPS = [
  { label: 'Fitness & Physique',   filters: ['Fitness']                    },
  { label: 'Academic Grinds',       filters: ['Academic Grinds']            },
  { label: 'Finance',               filters: ['Finance']                    },
  { label: 'Marketing & Branding',  filters: ['Marketing']                  },
]

// ─── "Find me a coach" enquiry modal ───────────────────────────────────────────
// Replaces the old mailto: to a personal-style Gmail address — that bypassed
// coach_enquiries (the real queue Operations/Founder already work from for
// every per-coach "Send a Quick Message" on the profile page) and had no
// record a student ever sent it. Writes the same real row instead, under a
// fixed general-enquiry coach_slug since no specific coach is picked yet.
const GENERAL_ENQUIRY_SLUG = 'general-enquiry'
const GENERAL_ENQUIRY_NAME = 'Find Me A Coach (general enquiry)'

function FindCoachModal({ visible, onClose, userId }) {
  const { colors } = useTheme()
  const fm = __gs_fm(colors)
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  async function submit() {
    if (!userId) {
      setErrorMsg('Please sign in to send a booking enquiry.')
      return
    }
    setSending(true)
    setErrorMsg(null)
    try {
      const { error } = await supabase.from('coach_enquiries').insert({
        user_id: userId,
        coach_slug: GENERAL_ENQUIRY_SLUG,
        coach_name: GENERAL_ENQUIRY_NAME,
        message: message.trim() || null,
      })
      if (error) throw error
      setSent(true)
    } catch {
      setErrorMsg('Could not send your enquiry. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleClose() {
    setMessage('')
    setSent(false)
    setErrorMsg(null)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={fm.backdrop}>
        <View style={fm.sheet}>
          <View style={fm.headerRow}>
            <Text style={fm.title}>{sent ? 'Request sent' : 'Find Me A Coach'}</Text>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={{ paddingVertical: 20 }}>
              <Text style={fm.sentText}>
                Your request has gone straight to the UniBlueprint team. They'll match you with a coach and follow up directly.
              </Text>
              <TouchableOpacity style={fm.doneBtn} activeOpacity={0.85} onPress={handleClose}>
                <Text style={fm.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={fm.sub}>
                Tell us what you're looking for, subject, sport, finance, or marketing coaching, and we'll match you with the right coach.
              </Text>
              <TextInput
                style={fm.input}
                placeholder="e.g. Looking for a Maths grind, twice a week..."
                placeholderTextColor={colors.light}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {!!errorMsg && <Text style={fm.error}>{errorMsg}</Text>}
              <Button
                label="Send Request"
                icon={Send}
                onPress={submit}
                variant="primary"
                loading={sending}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function __gs_fm(colors) {
  return StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, flex: 1, marginRight: 12 },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 14 },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    padding: 14, minHeight: 100,
    fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
    marginBottom: 12,
  },
  error: { fontFamily: fonts.sans, fontSize: 12, color: '#DC2626', marginBottom: 10 },
  sentText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary, lineHeight: 21, marginBottom: 20 },
  doneBtn: { backgroundColor: colors.accentBg, borderRadius: radius.button, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.accentFg },
  })
}

// ─── Group header ─────────────────────────────────────────────────────────────

function GroupHeader({ label, count, first }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return (
    <View style={[styles.groupHeader, first && { marginTop: 8 }]}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.groupCountBadge}>
        <Text style={styles.groupCountText}>{count}</Text>
      </View>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ElevationScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const elevAccent = pillarTint('elevation', isDark)
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const safeGoBack = useSafeGoBack(navigation)
  // Elevation Blueprint ("full access to all six services") is a Pro-only
  // surface per docs/business/subscription-pricing-model.md §1.1/§1.2 —
  // unlike Lifestyle Blueprint, free tier gets no browse-only allowance
  // here. See hooks/useProAccess.js (task #56/D2: "Gate it behind isPro").
  const { canAccess: hasProAccess, loading: proLoading } = useProAccess()
  const [active, setActive] = useState('All')
  const [findCoachOpen, setFindCoachOpen] = useState(false)

  // Every coach is verified by UBP (verified: true in the data above). The tick shows
  // beside the name on the featured cards and on the profile.
  // Featured order: Milan Piroska first, everyone else shuffled each time the screen opens.
  const ordered = useMemo(() => orderCoaches(COACHES), [])
  const visible = active === 'All' ? ordered : ordered.filter(c => c.filter === active)

  const academicBanner = (
    <View style={styles.academicBanner}>
      <Text style={styles.academicBannerTitle}>Academic Grinds</Text>
      <Text style={styles.academicBannerSub}>
        One-to-one grinds for college and further study, available through Elevation Blueprint.
      </Text>
    </View>
  )

  return (
    <View style={styles.screen}>
      <AppHeader navigation={navigation} showBack />
      <SlowLoad loading={proLoading} />

      {/* ── Scrollable content ──
          The navy hero block below is the FIRST CHILD of the ScrollView, not
          a fixed sibling above it, same pattern as Campus Connect and
          Lifestyle, the two screens in this family that never showed the
          sticky-header bug. Root cause (confirmed by structural comparison
          across every affected/unaffected screen): a fixed sibling View
          above a flex:1 ScrollView, where that sibling's own height depends
          on wrapped multi-line Text (heroSub here), needs a real
          Yoga/Fabric text-measurement pass before its height is known. On a
          genuine cold start under the New Architecture that pass can
          resolve after the ScrollView sibling has already committed its
          frame sized against the header's stale/interim height, so content
          renders under or over the header, self-correcting on any later
          layout pass (background/foreground), matching the previously
          reported symptom exactly. Earlier attempts (`style={{flex:1}}` on
          the ScrollView, then an extra wrapping View around it) only ever
          touched the ScrollView side and left the actual unreliable
          element, the header sibling's height, in place, which is why
          the bug kept coming back. Making the header scroll with the page
          removes the fixed-sibling/flex-sizing relationship entirely, so
          there is nothing left to race. */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageTitle
          title="Elevation"
          right={<View style={[styles.pillarMark, { backgroundColor: elevAccent + '2E' }]}><PILLARS.elevation.Icon size={22} color={elevAccent} strokeWidth={1.8} /></View>}
        />

        <View style={styles.content}>

          {/* Pro gate — fails closed while subscription status is still
              resolving (renders nothing rather than flashing the paywall
              at a real Pro user mid-fetch), then shows the upgrade card
              in place of the coach directory for anyone who isn't Pro. */}
          {proLoading ? null : !hasProAccess ? (
            <ProUpgradeGate
              variant="screen"
              title="Elevation Blueprint is a Pro feature"
              message="Coaching across fitness, academic grinds, finance, and marketing is part of Pro. Upgrade to browse coaches and send booking requests."
            />
          ) : (
          <>
          {/* Featured coaches: tall cards, swipe sideways, one at a time. Placed lower, with
              room under the title (the first version sat too high). */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillRow}
            style={[styles.filterPillScroll, { marginTop: spacing.md, marginBottom: spacing.sm }]}
          >
            {FILTERS.map(({ label, filter, Icon }) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, active === filter && styles.filterPillActive]}
                activeOpacity={0.85}
                onPress={() => setActive(filter)}
                accessibilityRole="button"
                accessibilityLabel={`${label} coaches`}
                accessibilityState={{ selected: active === filter }}
              >
                <Icon size={15} color={active === filter ? colors.accentFg : colors.textPrimary} strokeWidth={2} />
                <Text style={[styles.filterPillLabel, active === filter && styles.filterPillLabelActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {active === 'Academic Grinds' && academicBanner}

          <View style={{ marginHorizontal: -spacing.md, marginTop: spacing.lg }}>
            <FeaturedCoaches key={active} coaches={visible} onOpen={coach => navigation.navigate('CoachProfile', { coach })} />
          </View>

          {/* Find me a coach */}
          <View style={[styles.findCard, { marginTop: spacing.xl + 8 }]}>
            <Text style={styles.findTitle}>Find me a coach</Text>
            <Text style={styles.findSub}>Tell us what you need and we will match you with a coach.</Text>
            <TouchableOpacity style={styles.findBtn} activeOpacity={0.85} onPress={() => setFindCoachOpen(true)} accessibilityRole="button" accessibilityLabel="Send a request">
              <Send size={16} color={colors.accentFg} />
              <Text style={styles.findBtnText}>Send a request</Text>
            </TouchableOpacity>
          </View>
          </>
          )}

        </View>
      </ScrollView>

      {hasProAccess && (
        <FindCoachModal
          visible={findCoachOpen}
          onClose={() => setFindCoachOpen(false)}
          userId={user?.id}
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Integrated header + hero
  heroBlock: {
    backgroundColor: colors.chromeBg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.chromeFg, marginTop: 6, marginBottom: 10 },
  pillarMark: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: PILLARS.elevation.color + '22', marginBottom: 2 },
  findCard: { padding: 18, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  findTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary },
  findSub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 6 },
  findBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.button, backgroundColor: colors.accentBg },
  findBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.accentFg },
  browseTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: 12 },

  // Filter pills — single horizontal row, replacing the old 2-column tile
  // grid now that only 4 real categories remain post-merge (see FILTERS).
  serviceGridLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  filterPillScroll: { marginBottom: spacing.lg, marginHorizontal: -spacing.md },
  filterPillRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingVertical: 10, paddingHorizontal: 15,
    borderWidth: 1.5, borderColor: 'transparent', ...shadows.card,
  },
  filterPillActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  filterPillLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  filterPillLabelActive: { color: colors.accentFg },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed navy header on every platform — without
  // it, RN can size the ScrollView to its own content instead of the
  // available viewport, which is what let the header float over content.
  scrollView: { flex: 1 },
  scroll:  {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },

  resultsCount: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginBottom: 4 },

  academicBanner:     { backgroundColor: 'rgba(30,58,95,0.05)', borderRadius: radius.card, padding: 14, marginTop: 14, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)', borderLeftWidth: 3, borderLeftColor: colors.accentBg },
  academicBannerTitle:{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 6 },
  academicBannerSub:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },

  // Group headers
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(30,58,95,0.05)',
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    borderLeftWidth: 3, borderLeftColor: colors.accentBg,
    paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 12, marginTop: spacing.xl,
  },
  groupLabel:      { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  groupCountBadge: { backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  groupCountText:  { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },

  // Coach cards — stacked-paper "catalogue" treatment: a slightly rotated
  // sheet peeks out behind the real Card, and a small "N°0X" index tab pokes
  // above it, so the list reads as a curated dossier rather than flat rows.
  cardSlot:   { position: 'relative' },
  cardSheet: {
    position: 'absolute', top: 20, left: 10, right: 10, bottom: -6,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.06)',
    transform: [{ rotate: '-1.4deg' }],
  },
  cardSheetShell: { backgroundColor: 'rgba(30,58,95,0.03)', borderStyle: 'dashed' },
  indexTab: {
    position: 'absolute', top: 0, left: 18, zIndex: 1,
    backgroundColor: colors.accentBg, borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 4,
    ...shadows.card,
  },
  indexTabShell: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)' },
  indexTabText: { fontFamily: fonts.sansBold, fontSize: 10.5, color: colors.accentFg, letterSpacing: 0.4 },

  coachGrid:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14, marginTop: spacing.sm },
  gridSlot:   { width: '48%' },
  gridCard:   { padding: 10, marginBottom: 0, flex: 1 },
  gridAvatar: { aspectRatio: 1, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  gridText:   { paddingHorizontal: 4, paddingTop: 10, paddingBottom: 4, gap: 4 },
  gridNameRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  gridName:   { fontFamily: fonts.serif, fontSize: 16, color: colors.textPrimary, lineHeight: 21 },
  gridCategory:{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, lineHeight: 17 },
  gridPrice:  { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted, marginTop: 6 },
  coachCard:       { padding: 18, marginBottom: 0 },
  coachCardShell:  { borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(30,58,95,0.14)' },
  coachTop:        { flexDirection: 'row', alignItems: 'flex-start' },
  coachAvatarWrap: { position: 'relative' },
  coachAvatar:     { width: 52, height: 52, borderRadius: radius.circle, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.08)' },
  // Portrait-ratio (not square/circle) so a real headshot's natural framing
  // — closer to 3:4/4:5 than 1:1 — never gets cropped to fit a round slot.
  coachAvatarPhotoFrame: { width: 52, height: 68, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.08)', overflow: 'hidden' },
  coachAvatarPhoto: { width: '100%', height: '100%' },
  coachOnlineDot:  { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#16A34A', borderWidth: 2, borderColor: colors.white },

  coachName:     { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  coachTitle:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, lineHeight: 16, marginTop: 2 },
  coachCategory: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textPrimary, opacity: 0.65, marginTop: 2 },
  coachLocation: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  // Tagline — a gold-accented pull-quote (real italic serif face) rather
  // than a plain synthetic-italic caption.
  taglineQuote:     { flexDirection: 'row', gap: 10, marginTop: 10 },
  taglineQuoteBar:  { width: 2.5, borderRadius: 2, backgroundColor: PILLARS.elevation.color },
  taglineQuoteText: { flex: 1, fontFamily: fonts.serifItalic, fontSize: 14.5, color: colors.textPrimary, lineHeight: 20 },
  coachBio:      { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginTop: 10 },

  mentorPill:     { backgroundColor: '#F0FDF4', borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 2, marginTop: 5, alignSelf: 'flex-start' },
  mentorPillText: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: '#15803D', letterSpacing: 0.3, textTransform: 'uppercase' },

  photoStrip:     { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  photoFrame:     { aspectRatio: 1, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  photoImage:     { width: '100%', height: '100%' },
  photoDots:      { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  photoDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  photoDotActive: { backgroundColor: colors.textPrimary, width: 16 },
  serviceMenu:    { marginTop: 12, gap: 6 },
  serviceMenuLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  serviceMenuRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceMenuDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.muted },
  serviceMenuText:{ flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  serviceMenuMore:{ fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  servicePills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  servicePill:    { backgroundColor: colors.surfaceAlt, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 },
  servicePillText:{ fontFamily: fonts.sans, fontSize: 11, color: colors.textPrimary },

  // Footer — row with the price on the left and the View Profile button on
  // the right. footerPrice takes flex:1 with a right margin so its text
  // (a real price, or the standard "Available on request" fallback) wraps
  // within its own column instead of running under the button on longer
  // strings; the buttons get flexShrink:0 so they never get squeezed by it.
  // This pairing is the fix for the price/button overlap bug — see the
  // comment above the footer JSX for the full explanation.
  coachFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  footerPrice: { flex: 1, marginRight: 12 },
  fromLabel:   { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  fromPrice:   { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary, marginTop: 1, flexShrink: 1 },
  profileBtn:        { flexShrink: 0, backgroundColor: colors.accentBg, borderRadius: radius.button, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  profileBtnText:    { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accentFg },
  profileBtnMuted:   { flexShrink: 0, backgroundColor: colors.surfaceAlt, borderRadius: radius.button, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)' },
  profileBtnMutedText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.muted },

  // Price-tile footer — coaches with a real multi-entry pricelist preview
  // the first two options side by side instead of the single "Starting
  // from" line, plus a full-width View Profile button beneath.
  priceFooter:    { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },
  priceTileRow:   { flexDirection: 'row', gap: 8, marginBottom: 10 },
  priceTile:      { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.button, padding: 10, borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)' },
  priceTileLabel: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted },
  priceTileValue: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  profileBtnWide: { backgroundColor: colors.accentBg, borderRadius: radius.button, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },

  // Shell card
  shellBadge:     { backgroundColor: 'rgba(30,58,95,0.07)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  shellBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted },
  shellMessage:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 12, fontStyle: 'italic' },

  primaryBtn:     { marginTop: spacing.lg },
  })
}
