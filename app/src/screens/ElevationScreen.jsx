import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, ChevronRight, MapPin, User,
  LayoutGrid, Dumbbell, GraduationCap, TrendingUp, Megaphone,
} from 'lucide-react-native'

import Card from '../components/ui/Card'
import UBPLogo from '../components/ui/UBPLogo'
import VerifiedBadge from '../components/ui/VerifiedBadge'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { goToHome } from '../navigation/helpers'

// ─── Filter pills ─────────────────────────────────────────────────────────────
// Round 2: Fitness + Sports + Yoga merged into one "Fitness" category, and
// Creative folded entirely into "Marketing" — real coach roster review left
// only 4 real categories (Fitness, Academic Grinds, Trading, Marketing). The
// previous 2-column tile grid (built for 7 categories) reads oddly with that
// few — an awkward lone tile on its own row, lots of empty card padding for
// not much information. A single horizontal row of filter pills is the
// standard, compact pattern for a handful of categories and reads far less
// awkward at this count, so the grid is retired in favour of it here.
const FILTERS = [
  { label: 'All Coaches',      filter: 'All',             Icon: LayoutGrid    },
  { label: 'Fitness',          filter: 'Fitness',         Icon: Dumbbell      },
  { label: 'Academic Grinds',  filter: 'Academic Grinds', Icon: GraduationCap },
  { label: 'Trading',          filter: 'Trading',         Icon: TrendingUp    },
  { label: 'Marketing',        filter: 'Marketing',       Icon: Megaphone     },
]

// ─── Coaches ──────────────────────────────────────────────────────────────────
// Removed: Shauna Rogers, Ethan Henry, Fayed, Stephen McKeown
// Updated: Milan Piroska, Emanuel Tolic, Jayden Reynolds
// Added: Tadgh Darcy, Eitne Jarrett, Kevin (TrainWitKev), Aoife Keogh
//
// Round 2 — Removed: Ali, Eitne Jarrett, Nikola Jurek
// Round 2 — Renamed: Emmanuel Fasanmi -> 500+ with Eman, Daniel Gough -> DG Trading
// Round 2 — Updated: Dinero Trading Group (shell -> full), Aoife Keogh (shell -> full)
// Round 2 — Added: Camila (also a Lifestyle partner), Luana (shell)

// Stable key linking a coach's static listing here to their live
// coach_profiles row in Supabase (coach_profiles.coach_slug), so a coach's
// self-edited bio/photo, and a coach's booking enquiries, can be looked up
// without every coach needing a fully structured database record.
export function coachSlug(id) {
  return `coach-${id}`
}

export const COACHES = [
  // ── Academic ──
  {
    id: 1, name: '500+ with Eman', category: 'Academic Grinds', filter: 'Academic Grinds',
    location: 'Dublin, Ireland, Available Nationwide', from: 'Available on request',
    tagline: 'From under 400 points to 500+ — proven study strategy.',
    services: ['Leaving Cert Maths', 'Leaving Cert Biology', 'Leaving Cert Physics'],
    bio: "Hi, I'm Emmanuel, a UCD student who transformed my own Leaving Cert performance — taking my points from under 400 to 500+ in just a few months. Now I help students do the same, specialising in Leaving Cert Maths, Biology, and Physics, combining proven study strategies, smarter revision techniques, and exam-focused approaches to help students understand the material, maximise their marks, and make significant grade improvements. I'm not here to just teach you what's in the textbook — I'm here to show you how to study smarter, approach questions strategically, and perform when it matters most. If you're aiming for 500+, I'll help you build the structure, confidence, and exam technique to give yourself the best possible shot at getting there.",
  },

  // ── Sports ──
  {
    id: 2, name: 'JMC Fitness', category: 'Sports Coaching', filter: 'Fitness',
    location: 'North Dublin, Available Nationwide', from: '€50/hr',
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
    location: 'Dublin, Available Nationwide', from: '€55/month',
    services: ['Monthly Mentorship', '1-1 Shoot Session', 'Editing Guidance', 'Creative Direction'],
    bio: "I'm a professional photographer and videographer offering mentorship and shoot sessions. My monthly subscription includes Zoom calls and editing guidance.",
    pricelist: [
      { label: 'Monthly Subscription', price: '€55/month' },
      { label: '1-1 Shoot Session', price: '€90' },
    ],
    contact: { instagram: 'Nyz3ditz', phone: '+353857272875' },
  },

  // ── Trading ──
  {
    id: 4, name: 'DG Trading', category: 'Trading & Finance', filter: 'Trading',
    location: 'Ireland, Available Nationwide', from: 'Available on request',
    title: 'Funded Futures Trader | NQ / MNQ | Trading Coach',
    bio: "I'm Daniel, a funded futures trader specialising in NQ and MNQ. Having achieved a Topstep payout, I've developed a structured approach to trading built around confluence, patience, and disciplined execution. My strategy is ICT-based, combining market structure and liquidity concepts with standard deviation extensions and order flow confluence to identify high-probability opportunities during the New York pre-market.",
    quote: "The goal isn't to predict every move in the market. It's to build the ability to recognise when the conditions align, when to act, and when to stay out.",
    services: ['NQ & MNQ Futures Trading', 'ICT-Based Market Concepts', 'Standard Deviation Extensions', 'Order Flow & Confluence', 'Trade Selection', 'New York Pre-Market Analysis', 'Risk Management & Psychology', 'Trade Execution & Management'],
    sections: [
      {
        title: 'My Approach',
        body: "Strategy. Process. Discipline. Execution. Through coaching, I aim to help traders understand why the market is moving, how to identify quality setups, and how to approach trading with a clear, repeatable process, rather than relying on guesswork or chasing trades. Whether you're new to futures or looking to bring more structure to your current trading, my coaching is designed to help you develop a clearer understanding of the market and a more disciplined approach to execution.",
      },
      {
        title: 'Risk Disclosure',
        body: 'Trading involves significant risk. Coaching is educational and does not guarantee trading profits or results.',
      },
    ],
    contact: { phone: '+353838393794' },
    // Also linked from the Investment page in the Budgeting tool.
  },

  {
    id: 15, name: 'Dinero Trading Group', category: 'Trading & Investment Education', filter: 'Trading',
    location: 'Ireland, Available Nationwide', from: 'Available on request',
    tagline: 'DTG — structured trading systems, education, and business opportunities.',
    bio: "I'm a trader and entrepreneur focused on building structured trading systems, educational programmes, and business opportunities around the financial markets — from automated lower-risk copy trading and high-risk trading challenges, to 1-to-1 mentorship and opportunities to build a business around my services. My goal is to provide different routes for people depending on their experience, goals, and risk tolerance, with systems that are simple to understand, scalable, and built with a long-term vision.",
    services: ['Low-Risk Copier', '10X Challenge', '1-to-1 Mentorship / Trading Course', 'IB Partner / White-Label Programme'],
    sections: [
      {
        title: 'Low-Risk Copier',
        body: "A hands-free, automated copy trading service designed around long-term growth and compounding — similar to treating the account like a savings account, letting profits remain and compound rather than constantly withdrawing. Targets approximately 5–15% monthly returns via broker STARTRADER (a target, not a guarantee). Sign up through the designated broker link, open a live account, connect it to the copy system, choose a risk level, then let profits compound or withdraw any time. Remains a trading service — losses are possible.",
      },
      {
        title: '10X Challenge',
        body: 'A separate, high-risk trading challenge that runs once per month, aiming to multiply a starting balance by 10 (for example, €100 → €1,000). Short-term and high-risk, not a compounding strategy — significant drawdowns can occur and starting capital can be lost.',
      },
      {
        title: '1-to-1 Mentorship / Trading Course',
        body: 'For students who want to learn how to trade rather than simply copy trades — structured educational material combined with personalised mentorship covering basics, psychology, trends and candlesticks, concepts, technical analysis, and strategy. Includes 1-to-1 calls, trade reviews, personal feedback, and ongoing support.',
      },
      {
        title: 'IB Partner / White-Label Programme',
        body: "Build a business around Dinero's existing trading services without needing previous trading experience — introduce clients, earn commissions, and access marketing and promotional resources. A white-label option is available for suitable partners to offer the services under their own branding.",
      },
      {
        title: 'Important Risk Disclosure',
        body: 'All forms of trading involve risk. Past performance does not guarantee future results, and no specific return or income is guaranteed. The Low-Risk Copier, despite its lower-risk approach, can still result in losses. The 10X Challenge involves substantially higher risk and can result in the loss of the entire starting capital. Mentorship and educational services provide knowledge and guidance but cannot guarantee trading success. IB and white-label opportunities do not guarantee income or commissions. Only commit capital you can afford to lose.',
      },
    ],
    contact: { instagram: 'rellzdinero8', tiktok: 'rellzdinero' },
    // Also linked from the Investment page in the Budgeting tool (the Low-Risk Copier specifically).
  },

  {
    id: 16, name: 'Zainab Adeyemi (Soft Life Investing)', category: 'Investing & Finance Coach', filter: 'Trading',
    location: 'Ireland, Available Nationwide', from: 'Available on request',
    title: 'Chartered Accountant · Founder, Soft Life Investing',
    tagline: 'Personal finance without the finance bro jargon.',
    services: ['1:1 Personal Finance Coaching', 'Budgeting & Saving', 'Getting Started with Investing', 'Irish Investing Tax Rules (Deemed Disposal, Exit Tax, DIRT)'],
    bio: "I'm a chartered accountant and founder of Soft Life Investing, helping thousands of first-generation wealth builders make sense of personal finance without the finance bro jargon — covering everything from budgeting basics to Irish-specific investing rules like deemed disposal, exit tax, and DIRT.",
    sections: [
      {
        title: 'How Sessions Work',
        body: '1:1 personal finance coaching sessions for students, covering budgeting, saving, and getting started with investing, including the Irish-specific tax rules most guides skip over. Delivered over video call.',
      },
      {
        title: 'Free Investing Guide',
        body: 'A free beginner-friendly investing guide is available — ask about it when you book.',
      },
    ],
    bookingNote: 'Reach out via Instagram to book — availability is flexible week to week rather than a fixed recurring slot.',
    contact: { instagram: 'iamzayade', tiktok: 'iamzayade' },
  },

  // ── Fitness ──
  {
    id: 17, name: 'Camila Aruk', category: 'Personal Training · Muay Thai · Yoga', filter: 'Fitness',
    location: 'Dublin 8, Ireland, Available Nationwide', from: '€60/session',
    title: 'Certified Personal Trainer / Sport Nutritionist Coach / Muay Thai / Yoga / Functional Training',
    tagline: 'HEALTHY · WELLNESS · FITNESS',
    services: ['Physical Development', 'Muscle Gain', 'Fat Loss', 'Nutrition Coaching', 'Muay Thai Fitness', 'Yoga', 'Functional Training', 'Rehabilitation', 'Pre & Post Birth', 'Body Scan'],
    bio: "With over 10 years of experience in fitness, martial arts, and lifestyle coaching, I help people transform their bodies, mindset, and daily habits through personalised training, nutrition guidance, and realistic routines. My focus areas include physique development, weight loss, muscle building, self-defence, confidence, lifestyle improvement, and pre-contest preparation, for both athletes and everyday people.",
    quote: 'My goal is not just to motivate you for a few weeks, but to give you the knowledge, structure, and real reason to keep going, even when motivation is not there. When you know your WHY, you don\'t need motivation, you need DIRECTION — that\'s where I come in to help you.',
    pricelist: [
      { label: 'PT — 1x/week', price: '€220/month' },
      { label: 'PT — 2x/week', price: '€370/month' },
      { label: 'PT — Pay as you go', price: '€60/session' },
      { label: 'Body Scan', price: '€70/session' },
      { label: 'Food Plan + e-book', price: '€120' },
      { label: 'Online Coach', price: '€320/month' },
    ],
    package: ['Video call for PARQ', 'WhatsApp support', 'Food plan', 'Workout plan (app)', 'Schedule routine (app)', 'Supplement suggestions'],
    contact: { instagram: 'camilaaruk.coach', email: 'camila.coachfitness@gmail.com', phone: '0838602227' },
    crossLink: {
      label: "Also a Lifestyle Blueprint partner, see Camila's Lifestyle listing",
      screen: 'Lifestyle',
      params: { highlightId: 'camila' },
    },
  },

  {
    id: 6, name: 'Emanuel Tolic', category: 'Personal Training', filter: 'Fitness',
    location: 'Mayo, Available Nationwide', from: 'Available on request',
    services: ['Online Workout Plans', 'Online Diet Plans', 'Weightlifting Coaching', 'Calisthenics Coaching', 'Free Consultation Call'],
    bio: "I'm a 20-year-old qualified personal trainer with 5+ years of fitness experience. I specialise in weightlifting and calisthenics, and also work with clients in kickboxing and other sports. I provide personalised online workout and diet plans, ensuring every client fully understands why and how to follow their programme, and I'm available in and outside working hours.",
    package: [
      'Full 1-month coaching guide with workout and meal plan',
      'Fully explained and tracked daily',
      '24/7 WhatsApp availability',
      'Weekly progress check-in calls',
    ],
    contact: { instagram: 'emtolic', email: 'etcoaching06@gmail.com', linktree: 'https://linktr.ee/EmanuelPT' },
    pricingNote: 'Pricing discussed during consultation calls and texts.',
  },

  {
    id: 7, name: 'Tadgh Darcy', category: 'Physique Development', filter: 'Fitness',
    location: 'Dublin, Available Nationwide', from: 'Available on request',
    services: ['Tailored Nutrition Plan', 'Custom Training Programme', 'Weekly Check-in Videos', 'All-in-One Coaching App', 'Direct Coach Access'],
    quote: "Online physique development coach, main goal is to help people regain confidence and build healthy sustainable habits whilst also enjoying the process. Based in Dublin.",
    bio: "I'm a qualified personal trainer with 4 to 5 years of gym experience and several male and female client results to show for it. I teach efficient training and nutrition that fits into real life. I personally lost over 30kg and completed photoshoot prep myself, so I know exactly what the process takes. I'm a strong believer in building a healthy relationship with food alongside the physical side. My main goal is to help people regain confidence and build healthy, sustainable habits while enjoying the process — online physique development coaching built around you.",
    contact: { instagram: 'tdarcycoaching', tiktok: 'darcy.lifts', linktree: 'https://linktr.ee/tadghdarcy123' },
  },

  {
    id: 8, name: 'Milan Piroska (MPFitness)', category: 'Personal Training', filter: 'Fitness',
    location: 'Kildare, Available Nationwide', from: '€40/session',
    title: 'Certified Personal Trainer / Advanced Nutrition Coach / International Men\'s Physique Athlete',
    tagline: 'MPFitness. More Than Fitness.',
    services: ['Physique Development', 'Muscle Gain', 'Fat Loss', 'Nutrition Coaching', 'Lifestyle Transformation', 'Holiday & Contest Prep'],
    bio: "I specialise in Physique and Lifestyle Transformations via Fat Loss and Lean Muscle Gain, with 20+ client transformations behind me. I work with clients on physique development, muscle gain, fat loss, nutrition, lifestyle change, and holiday, photoshoot, and contest prep.",
    quote: 'Guarantee of achieving your true potential through proven systems and methodologies with personalised training solutions to fit your lifestyle, goals and preferences. Crafted with precision and backed by results.',
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
    contact: { instagram: 'milanpir_fitness', phone: '0857633757', email: 'milanpirfitness@gmail.com' },
    pricingNote: 'Available in 8, 10, or 12-week blocks. Payable in 2 instalments or in full.',
  },

  {
    id: 9, name: 'Kevin (TrainWitKev)', category: 'Personal Training', filter: 'Fitness',
    location: 'Dublin, Ireland, Available Nationwide', from: '€25',
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
    location: 'Co. Mayo, Ireland, Available Nationwide', from: '€40',
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
    location: 'County Sligo, Available Nationwide', from: 'Available on request',
    services: ['1-1 Online Coaching', 'Tailored Fitness Plans', 'Nutritional Guidance', 'Regular Check-ins', 'Nutrition Journal', 'Local In-Person Coaching'],
    bio: "I'm a qualified Personal Trainer with over a decade of experience, passionate about helping people balance school, work, fitness, sport, and social life. I'm also a League of Ireland player, and I'm available for both online and local in-person coaching in County Sligo.",
    contact: { instagram: 'JayRfitness6', tiktok: 'JayRfitness6' },
  },

  // ── Yoga ──
  {
    id: 13, name: 'Aoife Keogh', category: 'Yoga', filter: 'Fitness',
    location: 'Dublin, Available Nationwide',
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
    contact: { instagram: 'aoife_thebraveflow', linktree: 'https://linktr.ee/thebraveflowaoife' },
  },

  {
    id: 18, name: 'Luana Ciweck', category: 'Online Fitness Coaching', filter: 'Fitness',
    location: 'Co. Mayo, Ireland, Available Nationwide', from: 'Available on request',
    tagline: 'Confidence. Strength. Sustainable change.',
    services: ['Online Fitness Coaching'],
    bio: "I'm Luana, 21, a qualified fitness professional with a huge passion for training, health, and helping others become the best version of themselves. I completed my training with Image Fitness and have gained hands-on experience working with clients on the gym floor. Everyone is different, which is why I build an approach tailored to each individual's goals, lifestyle, and experience level. Training is a huge part of my own life too — I've personally gone through both bulking and cutting phases, and having experienced those stages myself helps me understand the highs, lows, challenges, and rewards that come with pursuing your own fitness goals.",
    sections: [
      {
        title: 'My Coaching Goal',
        body: "My goal with online coaching is to help you build confidence, become stronger, make sustainable changes, and achieve results you can be proud of. Whether you're looking to build muscle, lose body fat, improve your strength, or simply feel more confident in yourself, I'm here to support, guide, and motivate you every step of the way.",
      },
    ],
    bookingNote: 'Enquire directly via Instagram DM to book.',
    contact: { instagram: 'luana.ciweck' },
  },
]

// ─── Groups (used when filter = All) ─────────────────────────────────────────

const GROUPS = [
  { label: 'Fitness & Physique',   filters: ['Fitness']                    },
  { label: 'Academic Grinds',       filters: ['Academic Grinds']            },
  { label: 'Trading & Finance',     filters: ['Trading']                    },
  { label: 'Marketing & Branding',  filters: ['Marketing']                  },
]

// ─── Coach Card ───────────────────────────────────────────────────────────────

function CoachCard({ coach, navigation }) {
  function handlePress() {
    navigation.navigate('CoachProfile', { coach })
  }

  if (coach.shell) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={handlePress}>
        <Card style={styles.coachCard}>
          <View style={styles.coachTop}>
            <View style={styles.coachAvatarWrap}>
              <View style={[styles.coachAvatar, { backgroundColor: '#F5F0E8' }]}>
                <User size={26} color={colors.light} />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.coachName}>{coach.name}</Text>
              <Text style={styles.coachCategory}>{coach.category}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <MapPin size={11} color={colors.muted} />
                <Text style={styles.coachLocation}>{coach.location}</Text>
              </View>
            </View>
            <View style={styles.shellBadge}>
              <Text style={styles.shellBadgeText}>Coming Soon</Text>
            </View>
          </View>
          <Text style={styles.shellMessage}>{coach.shellMessage}</Text>
          <View style={styles.coachFooter}>
            <View style={styles.footerPrice}>
              <Text style={styles.fromLabel}>Starting from</Text>
              <Text style={styles.fromPrice}>{coach.from}</Text>
            </View>
            <View style={styles.profileBtnMuted}>
              <Text style={styles.profileBtnMutedText}>View Profile</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={handlePress}>
      <Card style={styles.coachCard}>
        {/* Header */}
        <View style={styles.coachTop}>
          <View style={styles.coachAvatarWrap}>
            <View style={styles.coachAvatar}>
              <User size={26} color={colors.light} />
            </View>
            <View style={styles.coachOnlineDot} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.coachName}>{coach.name}</Text>
              <VerifiedBadge verified={coach.verified} compact />
            </View>
            {coach.title && (
              <Text style={styles.coachTitle} numberOfLines={2}>{coach.title}</Text>
            )}
            <Text style={styles.coachCategory}>{coach.category}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <MapPin size={11} color={colors.muted} />
              <Text style={styles.coachLocation}>{coach.location}</Text>
            </View>
            {coach.badge && (
              <View style={styles.mentorPill}>
                <Text style={styles.mentorPillText}>{coach.badge}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tagline */}
        {coach.tagline && (
          <Text style={styles.coachTagline}>{coach.tagline}</Text>
        )}

        {/* Bio, preview, 3 lines max */}
        <Text style={styles.coachBio} numberOfLines={3}>{coach.bio}</Text>

        {/* Service pills, first 3 + overflow count */}
        <View style={styles.servicePills}>
          {coach.services.slice(0, 3).map(s => (
            <View key={s} style={styles.servicePill}>
              <Text style={styles.servicePillText}>{s}</Text>
            </View>
          ))}
          {coach.services.length > 3 && (
            <View style={[styles.servicePill, { backgroundColor: 'rgba(30,58,95,0.06)' }]}>
              <Text style={styles.servicePillText}>+{coach.services.length - 3} more</Text>
            </View>
          )}
        </View>

        {/* Footer — every coach shows the same "Starting from" label plus
            either a real € price or the single standard fallback phrase
            ("Available on request") for enquiry/booking-link-only coaches;
            see the COACHES data above. The price side is flex:1 + wrapping
            so a longer fallback string (or a future long price string) wraps
            onto a second line instead of running behind the View Profile
            button — the fixed-width overlap bug this replaces. */}
        <View style={styles.coachFooter}>
          <View style={styles.footerPrice}>
            <Text style={styles.fromLabel}>Starting from</Text>
            <Text style={styles.fromPrice}>{coach.from}</Text>
          </View>
          <View style={styles.profileBtn}>
            <Text style={styles.profileBtnText}>View Profile</Text>
            <ChevronRight size={13} color={colors.cream} strokeWidth={2.5} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

// ─── Group header ─────────────────────────────────────────────────────────────

function GroupHeader({ label, count, first }) {
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
  const insets = useSafeAreaInsets()
  const [active, setActive] = useState('All')

  const visible = active === 'All' ? COACHES : COACHES.filter(c => c.filter === active)

  const academicBanner = (
    <View style={styles.academicBanner}>
      <Text style={styles.academicBannerTitle}>Academic Grinds</Text>
      <Text style={styles.academicBannerSub}>
        One-to-one Leaving Cert and university grinds now available through Elevation Blueprint.
      </Text>
    </View>
  )

  return (
    <View style={styles.screen}>

      {/* ── Integrated header + hero (single navy block) ── */}
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
          {/* Spacer to balance the back button */}
          <View style={{ width: 70 }} />
        </View>

        <Text style={styles.heroEyebrow}>ELEVATION BLUEPRINT</Text>
        <Text style={styles.heroTitle}>Our Coaches</Text>
        <Text style={styles.heroSub}>
          Verified coaches across fitness, academic grinds, trading, and marketing.
          Every coach is reviewed before joining the platform.
        </Text>
      </View>

      {/* ── Scrollable content ──
          Wrapped in an extra plain View with flex:1 (not just the ScrollView's
          own style) as a defensive measure against a Fabric/New-Architecture
          initial-layout race: this screen already had the documented
          style={{flex:1}} fix (see `scrollView` below), and it is unchanged —
          but flex:1 on the ScrollView alone was still reported to fail on a
          real device on a fresh cold open (self-correcting after
          backgrounding), which points at the native scroll-view frame
          committing before Yoga finishes measuring the header sibling on the
          very first paint, not a missing style. Forcing Yoga to resolve a
          concrete height for a plain View first, then letting the ScrollView
          simply fill that already-measured box, is the standard hardening
          for this class of timing bug. Needs a real-device retest to confirm. */}
      <View style={styles.scrollView}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>

          {/* Browse by service — a single row of filter pills. With the
              Round 2 category merge (Fitness+Sports+Yoga, Creative into
              Marketing) there are only 4 real categories left; a compact
              pill row reads far cleaner at that count than the old 2-column
              tile grid, which left an awkward lone tile dangling on its own
              row. See the FILTERS comment above for the full reasoning. */}
          <Text style={styles.serviceGridLabel}>Browse by Service</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillRow}
            style={styles.filterPillScroll}
          >
            {FILTERS.map(({ label, filter, Icon }) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, active === filter && styles.filterPillActive]}
                activeOpacity={0.85}
                onPress={() => setActive(filter)}
              >
                <Icon size={15} color={active === filter ? colors.cream : colors.navy} strokeWidth={2} />
                <Text style={[styles.filterPillLabel, active === filter && styles.filterPillLabelActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.resultsCount}>
            {visible.length} coach{visible.length !== 1 ? 'es' : ''} available
          </Text>

          {/* Academic banner for filtered view */}
          {active === 'Academic Grinds' && academicBanner}

          <View style={{ marginTop: spacing.sm }}>
            {active === 'All' ? (
              /* Grouped view */
              GROUPS.map((group, gi) => {
                const groupCoaches = COACHES.filter(c => group.filters.includes(c.filter))
                if (groupCoaches.length === 0) return null
                return (
                  <View key={group.label}>
                    {/* Academic banner inline before its group */}
                    {group.label === 'Academic Grinds' && academicBanner}
                    <GroupHeader label={group.label} count={groupCoaches.length} first={gi === 0} />
                    <View style={{ gap: 12, marginBottom: 4 }}>
                      {groupCoaches.map(coach => (
                        <CoachCard key={coach.id} coach={coach} navigation={navigation} />
                      ))}
                    </View>
                  </View>
                )
              })
            ) : (
              /* Flat filtered view */
              <View style={{ gap: 12 }}>
                {visible.map(coach => (
                  <CoachCard key={coach.id} coach={coach} navigation={navigation} />
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('mailto:uniblueprintoperations@gmail.com?subject=' + encodeURIComponent("I'd like to be matched with a coach"))}
          >
            <Text style={styles.primaryBtnText}>Book a Coach</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  // Integrated header + hero
  heroBlock: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingRight: 10,
  },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },

  heroEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginBottom: 10 },
  heroSub:   { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', lineHeight: 22 },

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
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingVertical: 10, paddingHorizontal: 15,
    borderWidth: 1.5, borderColor: 'transparent', ...shadows.card,
  },
  filterPillActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterPillLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  filterPillLabelActive: { color: colors.cream },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed navy header on every platform — without
  // it, RN can size the ScrollView to its own content instead of the
  // available viewport, which is what let the header float over content.
  scrollView: { flex: 1 },
  scroll:  {},
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },

  resultsCount: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginBottom: 4 },

  academicBanner:     { backgroundColor: 'rgba(30,58,95,0.05)', borderRadius: radius.card, padding: 14, marginTop: 14, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)', borderLeftWidth: 3, borderLeftColor: colors.navy },
  academicBannerTitle:{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, marginBottom: 6 },
  academicBannerSub:  { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },

  // Group headers
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(30,58,95,0.05)',
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    borderLeftWidth: 3, borderLeftColor: colors.navy,
    paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 12, marginTop: spacing.xl,
  },
  groupLabel:      { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  groupCountBadge: { backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  groupCountText:  { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },

  // Coach cards
  coachCard:       { padding: 18, marginBottom: 0 },
  coachTop:        { flexDirection: 'row', alignItems: 'flex-start' },
  coachAvatarWrap: { position: 'relative' },
  coachAvatar:     { width: 52, height: 52, borderRadius: radius.circle, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.08)' },
  coachOnlineDot:  { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#16A34A', borderWidth: 2, borderColor: colors.white },

  coachName:     { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  coachTitle:    { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, lineHeight: 16, marginTop: 2 },
  coachCategory: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy, opacity: 0.65, marginTop: 2 },
  coachLocation: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  coachTagline:  { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy, marginTop: 10, fontStyle: 'italic' },
  coachBio:      { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginTop: 10 },

  mentorPill:     { backgroundColor: '#F0FDF4', borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 2, marginTop: 5, alignSelf: 'flex-start' },
  mentorPillText: { fontFamily: fonts.sansSemiBold, fontSize: 9, color: '#15803D', letterSpacing: 0.3, textTransform: 'uppercase' },

  servicePills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  servicePill:    { backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 },
  servicePillText:{ fontFamily: fonts.sans, fontSize: 11, color: colors.navy },

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
  fromPrice:   { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, marginTop: 1, flexShrink: 1 },
  profileBtn:        { flexShrink: 0, backgroundColor: colors.navy, borderRadius: radius.button, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  profileBtnText:    { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
  profileBtnMuted:   { flexShrink: 0, backgroundColor: colors.cream, borderRadius: radius.button, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)' },
  profileBtnMutedText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.muted },

  // Shell card
  shellBadge:     { backgroundColor: 'rgba(30,58,95,0.07)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  shellBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted },
  shellMessage:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 12, fontStyle: 'italic' },

  primaryBtn:     { backgroundColor: colors.navy, borderRadius: radius.button, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
})
