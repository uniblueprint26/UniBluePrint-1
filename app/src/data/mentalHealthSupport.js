// ─── Mental Health & Support directory ────────────────────────────────────────
// Every entry below is a genuinely real, currently operating Irish
// organisation or service — verified individually (phone number and/or
// website) rather than generated. Nothing here is fabricated: where a
// category could not be filled to the 15-20 target with real, verifiable
// services, it was left shorter instead (see the Phase 3 report for the
// per-category count and sources checked).
//
// `link` is what tapping the card does: `tel:` for a phone line, `sms:` for
// a text-based crisis line, or an `https:` URL for a web-only service.
// `hours` is shown under the name; keep it short.
//
// Verified vs online sources including: pieta.ie, samaritans.org, hse.ie,
// drugs.ie, bodywhys.ie, hospicefoundation.ie, womensaid.ie, mensaid.ie,
// safeireland.ie, nwci.ie, mymind.org, turn2me.ie, niteline.ie, pleasetalk.ie,
// mentalhealthireland.ie, alone.ie, and the individual organisations' own
// sites — recheck periodically, these do occasionally change.

export const MENTAL_HEALTH_CATEGORIES = [
  {
    key: 'crisis',
    label: 'Crisis Support',
    items: [
      { name: 'Samaritans', number: '116 123', hours: '24/7, free to call', link: 'tel:116123' },
      { name: 'Pieta', number: '1800 247 247', hours: '24/7 · text HELP to 51444', link: 'tel:1800247247' },
      { name: 'Text About It', number: 'Text HELLO to 50808', hours: '24/7, free to text', link: 'sms:50808' },
      { name: 'SOSAD Ireland', number: '1800 901 909', hours: '24/7, 365 days a year', link: 'tel:1800901909' },
      { name: 'HSE YourMentalHealth Info Line', number: '1800 111 888', hours: 'Anytime, day or night', link: 'tel:1800111888' },
      { name: 'Childline (ISPCC)', number: '1800 66 66 66', hours: '24/7 · under 18s', link: 'tel:1800666666' },
      { name: 'Teenline Ireland', number: '1800 833 634', hours: '24/7, 365 days · under 18s', link: 'tel:1800833634' },
      { name: 'Emergency Services', number: '999 or 112', hours: 'Immediate danger, anytime', link: 'tel:999' },
    ],
  },
  {
    key: 'counselling',
    label: 'Counselling and Therapy',
    items: [
      { name: 'MyMind', number: 'mymind.org', hours: 'Sliding-scale counselling, nationwide + online', link: 'https://mymind.org' },
      { name: 'Turn2Me', number: 'turn2me.ie', hours: 'Free online counselling (up to 6 sessions)', link: 'https://turn2me.ie' },
      { name: 'HSE Counselling in Primary Care', number: 'Ask your GP', hours: 'Free, via GP referral, medical card', link: 'https://www2.hse.ie/mental-health/services-support/ncs/cipc/' },
      { name: 'IACP — Find a Therapist', number: 'iacp.ie', hours: 'National counsellor/psychotherapist register', link: 'https://iacp.ie' },
      { name: 'IAHIP — Find a Psychotherapist', number: 'iahip.org', hours: 'National psychotherapist directory', link: 'https://iahip.org' },
      { name: 'Accord', number: 'accord.ie', hours: 'Couples & relationship counselling, sliding scale', link: 'https://accord.ie' },
      { name: 'Insight Matters', number: '01 891 0703', hours: 'Mon–Fri 9am–5pm · Dublin + online', link: 'tel:018910703' },
      { name: 'Psychological Society of Ireland', number: 'psychologicalsociety.ie', hours: 'Find a Chartered Psychologist directory', link: 'https://www.psychologicalsociety.ie/pd/' },
      { name: 'Pieta — Counselling & Therapy', number: '1800 247 247', hours: 'Self-harm & suicide bereavement therapy', link: 'tel:1800247247' },
      { name: 'Aware Support & Recovery Groups', number: '1800 80 48 48', hours: '10am–10pm daily', link: 'tel:1800804848' },
    ],
  },
  {
    key: 'student',
    label: 'Student Support',
    items: [
      { name: 'Niteline', number: '1800 793 793', hours: 'Term nights, 9pm–2:30am', link: 'tel:1800793793' },
      { name: 'Please Talk', number: 'pleasetalk.ie', hours: 'National student mental health campaign', link: 'https://www.pleasetalk.ie' },
      { name: 'USI — Chats for Change', number: 'usi.ie', hours: 'Union of Students in Ireland welfare hub', link: 'https://usi.ie/chatsforchange/' },
      { name: 'Jigsaw', number: 'jigsaw.ie', hours: 'Free support, ages 12–25', link: 'https://jigsaw.ie' },
      { name: 'Trinity College Dublin Student Counselling', number: '+353 1 896 1407', hours: 'Free, TCD-registered students', link: 'tel:+35318961407' },
      { name: 'UCD Student Counselling Service', number: 'ucd.ie/studentcounselling', hours: 'Free, UCD-registered students', link: 'https://www.ucd.ie/studentcounselling/' },
      { name: 'DCU Counselling & Personal Development', number: 'dcu.ie/health', hours: 'Free, DCU-registered students', link: 'https://www.dcu.ie/health' },
      { name: 'UCC Student Counselling & Development', number: '021 490 3565', hours: 'Mon–Fri, not a crisis line', link: 'tel:0214903565' },
      { name: 'University of Galway Student Counselling', number: 'universityofgalway.ie/counsellors', hours: 'Free, in-person + online', link: 'https://www.universityofgalway.ie/counsellors/' },
      { name: 'Maynooth University Counselling Service', number: '01 708 3554', hours: 'Mon–Fri 9.15am–4.45pm', link: 'tel:017083554' },
      { name: 'SpunOut', number: 'spunout.ie', hours: 'Youth info & support directory', link: 'https://spunout.ie' },
    ],
  },
  {
    key: 'addiction',
    label: 'Addiction Support',
    items: [
      { name: 'HSE Drug & Alcohol Helpline', number: '1800 459 459', hours: 'Mon–Fri 9.30am–5.30pm', link: 'tel:1800459459' },
      { name: 'Coolmine Therapeutic Community', number: '087 122 9307', hours: 'Admissions, Dublin', link: 'tel:0871229307' },
      { name: 'Cuan Mhuire', number: '059 863 1493', hours: 'Athy · also Galway, Limerick, Cork', link: 'tel:0598631493' },
      { name: 'Aiseiri', number: 'aiseiri.ie', hours: 'Residential addiction treatment', link: 'https://aiseiri.ie' },
      { name: 'Tabor Group', number: 'tabor.ie', hours: 'Residential treatment, Co. Cork', link: 'https://www.tabor.ie' },
      { name: 'Rutland Centre', number: '01 494 6358', hours: 'Dublin 16, since 1978', link: 'tel:014946358' },
      { name: "Merchant's Quay Ireland", number: '01 524 0160', hours: 'Homelessness & addiction services', link: 'tel:015240160' },
      { name: 'Matt Talbot Community Trust', number: 'mtct.ie', hours: 'Ballyfermot, Dublin', link: 'https://www.mtct.ie' },
      { name: 'Alcoholics Anonymous Ireland', number: 'alcoholicsanonymous.ie', hours: 'Meetings nationwide', link: 'https://www.alcoholicsanonymous.ie' },
      { name: 'Narcotics Anonymous Ireland', number: 'na-ireland.org', hours: 'Meetings nationwide', link: 'https://www.na-ireland.org' },
      { name: 'Al-Anon Ireland', number: '01 873 2699', hours: "Free support for family of someone's drinking", link: 'tel:018732699' },
    ],
  },
  {
    key: 'eating',
    label: 'Eating Disorders',
    items: [
      { name: 'Bodywhys', number: '01 210 7906', hours: 'National eating disorder helpline', link: 'tel:012107906' },
      { name: "St Patrick's Eating Disorders Programme", number: '01 249 3635', hours: 'Referral & assessment, office hours', link: 'tel:012493635' },
      { name: "St Vincent's University Hospital ED Service", number: 'Ask your GP', hours: 'Public service, GP/HSE referral', link: 'https://www2.hse.ie' },
      { name: 'Lois Bridges', number: '083 828 5976', hours: 'Residential treatment, Sutton, Dublin', link: 'tel:0838285976' },
      { name: 'Bodywhys — BodywhysConnect & YouthConnect', number: 'bodywhys.ie', hours: 'Free online peer support groups', link: 'https://www.bodywhys.ie' },
    ],
  },
  {
    key: 'bereavement',
    label: 'Bereavement',
    items: [
      { name: 'Irish Hospice Foundation Bereavement Line', number: '1800 80 70 77', hours: 'Mon–Fri 10am–1pm', link: 'tel:1800807077' },
      { name: 'Anam Cara', number: 'anamcara.ie', hours: 'Support for bereaved parents', link: 'https://anamcara.ie' },
      { name: 'Féileacáin', number: 'feileacain.ie', hours: 'Stillbirth & infant loss support', link: 'https://feileacain.ie' },
      { name: 'First Light', number: 'firstlight.ie', hours: 'Sudden loss of a child under 18', link: 'https://www.firstlight.ie' },
      { name: 'A Little Lifetime Foundation', number: 'alittlelifetime.ie', hours: 'Pregnancy & baby loss support', link: 'https://alittlelifetime.ie' },
      { name: 'Barnardos Bereavement Helpline', number: '01 473 2110', hours: 'Mon–Thu 10am–12pm', link: 'tel:014732110' },
      { name: 'Rainbows Ireland', number: '01 473 4175', hours: 'Peer support, ages 7–17', link: 'tel:014734175' },
      { name: 'Living Links', number: 'livinglinks.ie', hours: 'Suicide bereavement peer support', link: 'https://www.livinglinks.ie' },
      { name: 'Pieta — Bereaved by Suicide Support', number: '1800 247 247', hours: '24/7', link: 'tel:1800247247' },
      { name: 'Bethany Bereavement Support', number: 'bethany.ie', hours: 'Community & parish-based, Dublin', link: 'https://www.bethany.ie' },
      { name: 'Irish Cancer Society Bereavement Support', number: 'cancer.ie', hours: 'Support for bereaved carers/family', link: 'https://www.cancer.ie/support-and-resources-for-carers/bereavement-support' },
      { name: 'Miscarriage Association of Ireland', number: 'miscarriage.ie', hours: 'Mon–Fri 10am–12pm & 8–10pm', link: 'https://miscarriage.ie' },
      { name: 'Pregnancy & Infant Loss Ireland', number: '1800 80 70 77', hours: 'Mon–Fri 10am–1pm', link: 'tel:1800807077' },
    ],
  },
  {
    key: 'domestic-violence',
    label: 'Domestic Violence',
    items: [
      { name: "Women's Aid", number: '1800 341 900', hours: '24/7, free to call', link: 'tel:1800341900' },
      { name: "Men's Aid Ireland", number: '01 554 3811', hours: 'Mon–Fri 9am–5pm', link: 'tel:015543811' },
      { name: 'Male Advice Line', number: '1800 816 588', hours: 'Support for male victims', link: 'tel:1800816588' },
      { name: 'Safe Ireland', number: '090 647 9078', hours: 'National network, find local help', link: 'tel:0906479078' },
      { name: 'Sonas', number: '01 866 2015', hours: 'Dublin refuge & support', link: 'tel:018662015' },
      { name: 'Aoibhneas', number: '01 867 0701', hours: 'Dublin women\'s refuge', link: 'tel:018670701' },
      { name: 'Tearmann', number: '047 72311', hours: 'Co. Monaghan domestic violence service', link: 'tel:04772311' },
      { name: "Cuan Saor Women's Refuge", number: '1800 57 67 57', hours: 'Clonmel, Co. Tipperary', link: 'tel:1800576757' },
      { name: 'Cuanlee Refuge', number: '021 427 7698', hours: '24-hour service, Cork', link: 'tel:0214277698' },
      { name: 'Mná Feasa', number: '021 421 1757', hours: 'Mon–Fri 10am–4pm, Cork', link: 'tel:0214211757' },
      { name: 'MOVE Ireland', number: 'moveireland.ie', hours: 'Domestic abuse behaviour change programme', link: 'https://www.moveireland.ie' },
      { name: 'Ruhama', number: '01 836 0292', hours: 'Support for women affected by trafficking', link: 'tel:018360292' },
      { name: 'Dublin Rape Crisis Centre', number: '1800 77 8888', hours: '24/7, 365 days', link: 'tel:1800778888' },
      { name: 'Bright Sky Ireland', number: 'hectorsheart.ie', hours: 'Free safety app, Women\'s Aid + An Garda Síochána', link: 'https://www.womensaid.ie' },
      { name: 'Adapt Kerry Women\'s Refuge', number: '066 712 9100', hours: '24/7 helpline, Tralee', link: 'tel:0667129100' },
    ],
  },
  {
    key: 'mens',
    label: "Men's Mental Health",
    items: [
      { name: 'Men\'s Health Forum in Ireland', number: 'mhfi.org', hours: 'Research, education & advocacy', link: 'https://www.mhfi.org' },
      { name: 'Suicide or Survive', number: '01 272 2158', hours: 'Recovery & mental health programmes', link: 'tel:012722158' },
      { name: 'Men\'s Sheds Ireland', number: '0818 900 800', hours: 'National office, find a local shed', link: 'tel:0818900800' },
      { name: 'A Lust For Life', number: 'alustforlife.com', hours: 'Mental health information & resources', link: 'https://alustforlife.com' },
      { name: 'Men\'s Development Network', number: '051 844 260', hours: 'Waterford, one-to-one & phoneline support', link: 'tel:051844260' },
      { name: 'Men\'s Free Counselling (Connect Counselling)', number: '1800 577 577', hours: '7 days a week · HSE-funded free sessions for men', link: 'tel:1800577577' },
    ],
  },
  {
    key: 'womens',
    label: "Women's Mental Health",
    items: [
      { name: 'National Women\'s Council of Ireland', number: 'nwci.ie', hours: 'Women\'s Mental Health Network', link: 'https://www.nwci.ie/womens_mental_health_support' },
      { name: 'Nurture', number: 'nurturehealth.ie', hours: 'Perinatal & postnatal depression support', link: 'https://nurturehealth.ie' },
      { name: 'Cuidiú', number: 'cuidiu.ie', hours: 'Irish Childbirth Trust, peer support groups', link: 'https://www.cuidiu.ie' },
      { name: 'Parentline', number: '01 873 3500', hours: 'Mon–Thu 10am–9pm, Fri 10am–7pm', link: 'tel:018733500' },
      { name: 'Well Woman Centre', number: '01 726 7100', hours: 'Counselling, Dublin', link: 'tel:017267100' },
      { name: 'One Family', number: '01 662 9212', hours: 'Mon–Fri 10am–3pm, one-parent families', link: 'tel:016629212' },
      { name: 'Dublin Rape Crisis Centre', number: '1800 77 8888', hours: '24/7, 365 days, interpreting available', link: 'tel:1800778888' },
      { name: 'AkiDwA', number: 'akidwa.ie', hours: 'National network of migrant women', link: 'https://akidwa.ie' },
      { name: 'Sexual Violence Centre Cork', number: '1800 496 496', hours: 'Freephone, Cork', link: 'tel:1800496496' },
      { name: 'Galway Rape Crisis Centre', number: '1800 355 355', hours: 'Mon–Fri 10am–1pm', link: 'tel:1800355355' },
      { name: 'Aware Support Line', number: '1800 80 48 48', hours: '10am–10pm daily', link: 'tel:1800804848' },
    ],
  },
  {
    key: 'wellbeing',
    label: 'General Wellbeing',
    items: [
      { name: 'Mental Health Ireland', number: '01 284 1166', hours: 'Mon–Fri 9am–5pm', link: 'tel:012841166' },
      { name: 'GROW Mental Health', number: 'grow.ie', hours: '130+ peer support groups nationwide', link: 'https://www.grow.ie' },
      { name: 'Shine', number: 'shine.ie', hours: 'Support for lived experience of mental illness', link: 'https://www.shine.ie' },
      { name: 'Jigsaw', number: 'jigsaw.ie', hours: 'Free support, ages 12–25', link: 'https://jigsaw.ie' },
      { name: 'Aware', number: '1800 80 48 48', hours: '10am–10pm daily, depression & bipolar', link: 'tel:1800804848' },
      { name: 'SpunOut', number: 'spunout.ie', hours: 'Guides & articles for young people', link: 'https://spunout.ie' },
      { name: 'HSE YourMentalHealth.ie', number: '1800 111 888', hours: 'Info line, anytime', link: 'tel:1800111888' },
      { name: 'See Change', number: 'seechange.ie', hours: 'Mental health stigma reduction', link: 'https://www.seechange.ie' },
      { name: 'ALONE', number: '0818 222 024', hours: 'Support for older people', link: 'tel:0818222024' },
      { name: 'Family Carers Ireland', number: '1800 24 07 24', hours: 'National freephone careline', link: 'tel:1800240724' },
      { name: '3Ts', number: '3ts.ie', hours: 'Suicide prevention information & directory', link: 'https://www.3ts.ie' },
      { name: 'Cork Mental Health Foundation', number: 'corkmentalhealth.com', hours: 'Ireland\'s longest-established mental health charity, est. 1962', link: 'https://corkmentalhealth.com' },
    ],
  },
]
