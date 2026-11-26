-- Launch day helper for Ireland 2026 (issue 1): adds the UBP Awards page to the wrapped pages.
-- Run it once, in the Supabase SQL editor, BEFORE you publish issue 1 (see launch-day-switch.md).
-- Safe to run more than once: any existing awards page is removed first, so you never get two.
-- The awards page goes straight after the last page of the "awards" section (the two creators
-- lists); if the section has no pages it goes first.
--
-- The page below is a snapshot of the awards page in parts/assembled-so-far.json. The awards
-- pages are still marked "needs your fix" in the planner, so check the nominees, then replace
-- the JSON between the two $aw$ markers if anything changed.

update public.weekly_issue_content c
set content = jsonb_set(
  c.content,
  '{pages}',
  (
    select coalesce(jsonb_agg(x.elem order by x.ord), '[]'::jsonb)
    from (
      select e.elem, e.ord::numeric as ord
      from jsonb_array_elements(c.content -> 'pages') with ordinality as e(elem, ord)
      where e.elem ->> 'kind' is distinct from 'awards'
      union all
      select $aw${
 "section": "awards",
 "kind": "awards",
 "kicker": "From UBP",
 "heading": "UBP Awards",
 "body": "Nominees are listed in no particular order. Voting opens on 26 December 2026 and closes on 3 January 2027.",
 "stat": "",
 "statLabel": "",
 "bullets": [],
 "items": [],
 "categories": [
  {
   "key": "creator-female",
   "title": "Creator (female)",
   "nominees": [
    {
     "key": "alice-kelly",
     "name": "Alice Kelly",
     "why": "Horsebox baker with 2.1 million followers and a 2026 cookbook.",
     "source": "RTÉ, Dubray Books",
     "sourceUrl": "https://www.dubraybooks.ie/product/from-scratch-9781068405051"
    },
    {
     "key": "fiona-bergin",
     "name": "Fiona Bergin",
     "why": "Kilkenny farm creator who fronted a farm safety campaign.",
     "source": "Irish Examiner, influencer.ie",
     "sourceUrl": "https://www.irishexaminer.com/farming/arid-41707214.html"
    },
    {
     "key": "jane-ni-luasa",
     "name": "Jane Ní Luasa (Gaeilge le Jane)",
     "why": "Teaches Irish on TikTok, bringing the language out of the textbook.",
     "source": "TheJournal.ie",
     "sourceUrl": "https://www.thejournal.ie/teaching-irish-by-tiktok-6782902-Aug2025/"
    },
    {
     "key": "justine-stafford",
     "name": "Justine Stafford",
     "why": "Meath comedian known for character sketches, with 332,200 followers.",
     "source": "Wikipedia, influencer.ie",
     "sourceUrl": "https://en.wikipedia.org/wiki/Justine_Stafford"
    },
    {
     "key": "kayleigh-trappe",
     "name": "Kayleigh Trappe",
     "why": "Monaghan comedian famous for lip syncs and skits.",
     "source": "Wikipedia",
     "sourceUrl": "https://en.wikipedia.org/wiki/Kayleigh_Trappe"
    },
    {
     "key": "lauren-whelan",
     "name": "Lauren Whelan",
     "why": "Carlow makeup, hair and style creator with 1.7 million followers.",
     "source": "Irish Times, influencer.ie",
     "sourceUrl": "https://www.irishtimes.com/health/your-wellness/2022/06/28/influencer-lauren-whelan-says-begrudgery-in-ireland-is-stopping-young-people-from-starting-tiktok-careers"
    },
    {
     "key": "mary-claire-fitzpatrick",
     "name": "Mary-Claire Fitzpatrick",
     "why": "Laois comedian behind the 2026 podcast Herself and Herself.",
     "source": "Irish Farmers Journal",
     "sourceUrl": "https://www.farmersjournal.ie/life/features/herself-herself-common-sense-craic-and-no-filter-908404"
    },
    {
     "key": "maura-higgins",
     "name": "Maura Higgins",
     "why": "Longford star named to TIME100 Creators 2026.",
     "source": "Hot Press",
     "sourceUrl": "https://www.hotpress.com/film-tv/maura-higgins-makes-prestigious-time100-creators-list-23151502"
    },
    {
     "key": "miriam-mullins",
     "name": "Miriam Mullins",
     "why": "Cork comedy creator with 2.2 million TikTok followers.",
     "source": "Irish Examiner, influencer.ie",
     "sourceUrl": "https://www.irishexaminer.com/lifestyle/people/arid-41725938.html"
    },
    {
     "key": "roz-purcell",
     "name": "Roz Purcell",
     "why": "Tipperary broadcaster and Hike Life author who championed her home county.",
     "source": "RTÉ",
     "sourceUrl": "https://www.rte.ie/lifestyle/travel/2026/0508/1572374-roz-purcells-guide-to-a-great-weekend-in-tipperary/"
    }
   ]
  },
  {
   "key": "creator-male",
   "title": "Creator (male)",
   "nominees": [
    {
     "key": "cairde",
     "name": "Cairde",
     "why": "Seven Irish dancers with 3.2 million TikTok followers.",
     "source": "Wikipedia, influencer.ie",
     "sourceUrl": "https://en.wikipedia.org/wiki/Cairde"
    },
    {
     "key": "cian-twomey",
     "name": "Cian Twomey",
     "why": "Cork sketch comedian behind the Emily character videos.",
     "source": "influencer.ie, Irish Examiner",
     "sourceUrl": "https://influencer.ie/influencers/cian-twomey/"
    },
    {
     "key": "ciaran-mcdonnell",
     "name": "Ciaran McDonnell",
     "why": "Comedy creator with 967,000 followers and 47 million likes.",
     "source": "Favikon",
     "sourceUrl": "https://www.favikon.com/blog/top-tiktokers-ireland"
    },
    {
     "key": "eric-roberts",
     "name": "Eric Roberts",
     "why": "Donegal comedy creator and children's author with 796,000 followers.",
     "source": "HerFamily, influencer.ie",
     "sourceUrl": "https://www.herfamily.ie/news/irish-influencer-eric-roberts-publishes-his-first-childrens-book-458202"
    },
    {
     "key": "gardiner-brothers",
     "name": "Gardiner Brothers",
     "why": "Irish dancing brothers with 4.1 million TikTok followers.",
     "source": "Irish Times, RTÉ",
     "sourceUrl": "https://www.irishtimes.com/life-and-style/people/we-consider-it-a-sport-the-irish-dancing-brothers-taking-over-tiktok-1.4499145"
    },
    {
     "key": "james-doyle",
     "name": "James Doyle (Protein Bor Papi)",
     "why": "Mullingar creator behind the Protein Bor catchphrase.",
     "source": "RTÉ, influencer.ie",
     "sourceUrl": "https://www.rte.ie/lifestyle/living/2022/0802/1313559-protein-bor-meet-the-mullingar-man-behind-tiktoks-viral-trend"
    },
    {
     "key": "john-nellis",
     "name": "John Nellis",
     "why": "Football creator and 2026 Strictly Come Dancing contestant.",
     "source": "The Independent, Hello!",
     "sourceUrl": "https://newswav.com/article/john-nellis-from-youtube-sensation-to-strictly-come-dancing-A2609_za4FgA"
    },
    {
     "key": "matthew-weldon",
     "name": "Matthew Weldon",
     "why": "Dublin antique jeweller nominated at the 2025 TikTok Awards.",
     "source": "RTÉ",
     "sourceUrl": "https://www.rte.ie/culture/2025/1219/1545046-10-irish-tiktokers-you-should-follow"
    },
    {
     "key": "seaghan-o-suilleabhain",
     "name": "Séaghan Ó Súilleabháin (The Kerry Cowboy)",
     "why": "Kerry farmer sharing farm life, Irish language and culture.",
     "source": "Irish Farmers Journal, TikTok",
     "sourceUrl": "https://farmersjournal.ie/the-kerry-cowboy-i-answer-questions-from-all-over-the-world-780555"
    },
    {
     "key": "tadhg-fleming",
     "name": "Tadhg Fleming",
     "why": "Kerry comedy creator known for skits with his dad.",
     "source": "Irish Examiner, influencer.ie",
     "sourceUrl": "https://www.irishexaminer.com/lifestyle/people/arid-41665034.html"
    }
   ]
  },
  {
   "key": "actor-female",
   "title": "Actor (female)",
   "nominees": [
    {
     "key": "alison-oliver",
     "name": "Alison Oliver",
     "why": "Won IFTA Supporting Actress in a Drama for Task.",
     "source": "RTÉ Entertainment",
     "sourceUrl": "https://rte.ie/entertainment/2026/0220/1559625-christy-and-hamnet-lead-winners-at-ifta-awards/"
    },
    {
     "key": "carolyn-bracken",
     "name": "Carolyn Bracken",
     "why": "Nominated for IFTA Lead Actress in a Film for Horseshoe.",
     "source": "Irish Times",
     "sourceUrl": "https://www.irishtimes.com/culture/film/2026/01/20/iftas-2026-top-two-films-scoop-26-nominations-as-steve-coogan-goes-up-against-daniel-day-lewis/"
    },
    {
     "key": "jessie-buckley",
     "name": "Jessie Buckley",
     "why": "Won the Best Actress Oscar and the IFTA for Hamnet.",
     "source": "Irish Times",
     "sourceUrl": "https://www.irishtimes.com/culture/film/2026/03/15/oscars-2026-live-updates-jessie-buckley-academy-awards/"
    },
    {
     "key": "kerry-condon",
     "name": "Kerry Condon",
     "why": "Won IFTA Supporting Actress in a Film for F1.",
     "source": "RTÉ Entertainment",
     "sourceUrl": "https://rte.ie/entertainment/2026/0220/1559625-christy-and-hamnet-lead-winners-at-ifta-awards/"
    },
    {
     "key": "louisa-harland",
     "name": "Louisa Harland",
     "why": "Won the 2026 IFTA Rising Star award.",
     "source": "RTÉ Entertainment",
     "sourceUrl": "https://rte.ie/entertainment/2026/0220/1559625-christy-and-hamnet-lead-winners-at-ifta-awards/"
    }
   ]
  },
  {
   "key": "actor-male",
   "title": "Actor (male)",
   "nominees": [
    {
     "key": "anthony-boyle",
     "name": "Anthony Boyle",
     "why": "Won IFTA Lead Actor in a Drama for House of Guinness.",
     "source": "RTÉ Entertainment",
     "sourceUrl": "https://rte.ie/entertainment/2026/0220/1559625-christy-and-hamnet-lead-winners-at-ifta-awards/"
    },
    {
     "key": "chris-walley",
     "name": "Chris Walley",
     "why": "Won IFTA Supporting Actor in a Drama for The Young Offenders.",
     "source": "RTÉ Entertainment",
     "sourceUrl": "https://rte.ie/entertainment/2026/0220/1559625-christy-and-hamnet-lead-winners-at-ifta-awards/"
    },
    {
     "key": "ciaran-hinds",
     "name": "Ciarán Hinds",
     "why": "Received the IFTA Lifetime Achievement Award in 2026.",
     "source": "RTÉ Entertainment",
     "sourceUrl": "https://rte.ie/entertainment/2026/0220/1559625-christy-and-hamnet-lead-winners-at-ifta-awards/"
    },
    {
     "key": "eanna-hardwicke",
     "name": "Éanna Hardwicke",
     "why": "Won IFTA Lead Actor for playing Roy Keane in Saipan.",
     "source": "RTÉ Entertainment",
     "sourceUrl": "https://rte.ie/entertainment/2026/0220/1559625-christy-and-hamnet-lead-winners-at-ifta-awards/"
    },
    {
     "key": "paul-mescal",
     "name": "Paul Mescal",
     "why": "Won IFTA Supporting Actor for Hamnet.",
     "source": "RTÉ Entertainment",
     "sourceUrl": "https://rte.ie/entertainment/2026/0220/1559625-christy-and-hamnet-lead-winners-at-ifta-awards/"
    }
   ]
  },
  {
   "key": "sports-female",
   "title": "Sports person (female)",
   "nominees": [
    {
     "key": "ellen-walshe",
     "name": "Ellen Walshe",
     "why": "Won two golds at the European Aquatics Championships in Paris.",
     "source": "Irish News",
     "sourceUrl": "https://www.irishnews.com/sport/ellen-walshe-wins-gold-in-the-200m-individual-medley-at-the-european-aquatics-championships-U3KUPKXO6FBWRKXC73MVDPJEDI/"
    },
    {
     "key": "kate-oconnor",
     "name": "Kate O'Connor",
     "why": "Won European heptathlon gold in Birmingham with 6,751 points.",
     "source": "Irish Times",
     "sourceUrl": "https://www.irishtimes.com/sport/athletics/2026/08/15/kate-oconnor-in-heptathlon-gold-medal-position-with-one-event-left-at-european-championships/"
    },
    {
     "key": "katie-taylor",
     "name": "Katie Taylor",
     "why": "Won her final fight at a sellout Croke Park, then retired.",
     "source": "Irish Examiner",
     "sourceUrl": "https://www.irishexaminer.com/sport/othersport/arid-41907256.html"
    },
    {
     "key": "rhasidat-adeleke",
     "name": "Rhasidat Adeleke",
     "why": "Won European 200m silver in Birmingham.",
     "source": "Athletics Ireland",
     "sourceUrl": "https://www.athleticsireland.ie/birmingham-day-4-historic-gold-for-english-as-adeleke-claims-european-silver/"
    },
    {
     "key": "roisin-ni-riain",
     "name": "Róisín Ní Riain",
     "why": "Defended her European para swimming 100m backstroke title in September.",
     "source": "Irish Times",
     "sourceUrl": "https://www.irishtimes.com/sport/2026/09/10/roisin-ni-riain-wins-gold-in-100m-backstroke-at-european-championships/"
    }
   ]
  },
  {
   "key": "sports-male",
   "title": "Sports person (male)",
   "nominees": [
    {
     "key": "ben-lynch",
     "name": "Ben Lynch",
     "why": "First Irish skier in an Olympic final, finishing eighth.",
     "source": "Olympic Federation of Ireland",
     "sourceUrl": "https://olympics.ie/eighth-in-olympic-final-for-freestyle-skier-ben-lynch-at-the-winter-olympics/"
    },
    {
     "key": "mark-english",
     "name": "Mark English",
     "why": "Won European 800m gold in Birmingham.",
     "source": "Athletics Ireland",
     "sourceUrl": "https://www.athleticsireland.ie/birmingham-day-4-historic-gold-for-english-as-adeleke-claims-european-silver/"
    },
    {
     "key": "rhys-mcclenaghan",
     "name": "Rhys McClenaghan",
     "why": "Won pommel horse gold at the Antalya World Cup in March.",
     "source": "Irish Examiner",
     "sourceUrl": "https://www.irishexaminer.com/sport/othersport/arid-41810378.html"
    },
    {
     "key": "rory-mcilroy",
     "name": "Rory McIlroy",
     "why": "Retained the Masters at Augusta, one shot clear.",
     "source": "The National",
     "sourceUrl": "https://www.thenationalnews.com/sport/2026/04/13/how-2026-masters-champion-rory-mcilroy-won-his-six-majors"
    },
    {
     "key": "troy-parrott",
     "name": "Troy Parrott",
     "why": "Scored in the Dutch Cup final, his first senior trophy.",
     "source": "RTÉ Sport",
     "sourceUrl": "https://www.rte.ie/sport/soccer/2026/0419/1569074-parrott-helps-az-alkmaar-to-dutch-cup-glory/"
    }
   ]
  },
  {
   "key": "rock-indie",
   "title": "Rock and indie band",
   "nominees": [
    {
     "key": "basht",
     "name": "BASHT.",
     "why": "Debut album Poor Advice tops the Independent Albums Chart.",
     "source": "IRMA",
     "sourceUrl": "https://www.irma.ie/news/basht-top-the-independent-chart-with-debut-album-poor-advice/"
    },
    {
     "key": "fontaines-dc",
     "name": "Fontaines D.C.",
     "why": "Dopamine Chamber goes to number one on the Irish albums chart.",
     "source": "IRMA",
     "sourceUrl": "https://www.irma.ie/news/fontaines-d-c-top-albums-chart-with-dopamine-chamber-as-tate-mcrae-lands-her-first-1-single/"
    },
    {
     "key": "just-mustard",
     "name": "Just Mustard",
     "why": "WE WERE JUST HERE shortlisted for Irish Album of the Year.",
     "source": "RTÉ Culture",
     "sourceUrl": "https://www.rte.ie/culture/2026/0305/1561810-cmat-and-amble-win-big-at-rte-choice-music-awards"
    },
    {
     "key": "sprints",
     "name": "SPRINTS",
     "why": "All That Is Over shortlisted for Irish Album of the Year.",
     "source": "RTÉ Culture",
     "sourceUrl": "https://www.rte.ie/culture/2026/0305/1561810-cmat-and-amble-win-big-at-rte-choice-music-awards"
    },
    {
     "key": "u2",
     "name": "U2",
     "why": "Carnaval De Luz is their eleventh Irish number one album.",
     "source": "IRMA",
     "sourceUrl": "https://www.irma.ie/news/carnaval-de-luz-gives-u2-their-eleventh-1-album/"
    }
   ]
  },
  {
   "key": "pop-singer-songwriter",
   "title": "Pop and singer songwriter",
   "nominees": [
    {
     "key": "cmat",
     "name": "CMAT",
     "why": "Won the Ivor Novello for Best Album and Choice Music Prize.",
     "source": "RTÉ Entertainment",
     "sourceUrl": "https://www.rte.ie/entertainment/2026/0521/1574622-cmat-wins-ivor-novello-award-for-best-album/"
    },
    {
     "key": "declan-orourke",
     "name": "Declan O'Rourke",
     "why": "Oceanic reached number seven on the Irish albums chart.",
     "source": "Official Charts",
     "sourceUrl": "https://www.officialcharts.com/albums/declan-orourke-oceanic/"
    },
    {
     "key": "dermot-kennedy",
     "name": "Dermot Kennedy",
     "why": "The Weight of the Woods debuts at number one in Ireland.",
     "source": "IRMA",
     "sourceUrl": "https://www.irma.ie/news/dermot-kennedy-achieves-his-third-consecutive-irish-1-album/"
    },
    {
     "key": "keywest",
     "name": "Keywest",
     "why": "Reached number one with a CD only album, no streaming.",
     "source": "IRMA",
     "sourceUrl": "https://www.irma.ie/news/keywest-top-the-albums-chart-with-one-more-for-the-road/"
    },
    {
     "key": "niall-horan",
     "name": "Niall Horan",
     "why": "Dinner Party debuts at number one, his fourth in a row.",
     "source": "IRMA",
     "sourceUrl": "https://www.irma.ie/news/niall-horan-lands-his-fourth-irish-1-albu-with-dinner-party/"
    }
   ]
  },
  {
   "key": "rap-hiphop-rnb",
   "title": "Rap, hip hop and R&B",
   "nominees": [
    {
     "key": "bricknasty",
     "name": "Bricknasty",
     "why": "Shortlisted for Breakthrough Artist and nominated at the 2026 Independent Music Awards.",
     "source": "RTÉ Culture",
     "sourceUrl": "https://www.rte.ie/culture/2026/0120/1554171-rte-choice-music-prize-breakthrough-artist-of-the-year-shortlist/"
    },
    {
     "key": "denise-chaila",
     "name": "Denise Chaila",
     "why": "Toured An Seo in September with Cork and Limerick dates.",
     "source": "Irish Examiner",
     "sourceUrl": "https://www.irishexaminer.com/lifestyle/artsandculture/arid-41911261.html"
    },
    {
     "key": "f3miii",
     "name": "F3MIII",
     "why": "Featured on Take a Trip, number 16 on the Homegrown Chart.",
     "source": "Official Charts",
     "sourceUrl": "https://www.officialcharts.com/charts/irish-homegrown-chart/20261023/irishart/"
    },
    {
     "key": "khakikid",
     "name": "KhakiKid",
     "why": "Dublin rapper shortlisted for Choice Music Prize Breakthrough Artist of the Year.",
     "source": "RTÉ Culture",
     "sourceUrl": "https://www.rte.ie/culture/2026/0120/1554171-rte-choice-music-prize-breakthrough-artist-of-the-year-shortlist/"
    }
   ]
  },
  {
   "key": "trad-folk-dance",
   "title": "Trad, folk and dance or electronic",
   "nominees": [
    {
     "key": "amble",
     "name": "Amble",
     "why": "Won Choice Music Prize Song of the Year and Breakthrough Artist.",
     "source": "RTÉ Culture",
     "sourceUrl": "https://www.rte.ie/culture/2026/0305/1561810-cmat-and-amble-win-big-at-rte-choice-music-awards"
    },
    {
     "key": "jazzy",
     "name": "Jazzy",
     "why": "Satisfy with Calvin Harris reached number nine on the UK Trending Chart.",
     "source": "Hot Press",
     "sourceUrl": "https://www.hotpress.com/music/jazzy-and-kettama-break-into-uks-official-trending-chart-23149759"
    },
    {
     "key": "kettama",
     "name": "Kettama",
     "why": "Played Coachella in 2026 and charted on the UK Trending Chart.",
     "source": "Hot Press",
     "sourceUrl": "https://www.hotpress.com/music/jazzy-and-kettama-break-into-uks-official-trending-chart-23149759"
    },
    {
     "key": "kingfishr",
     "name": "Kingfishr",
     "why": "Second Irish number one single with The Sun Will Never Settle.",
     "source": "IRMA",
     "sourceUrl": "https://www.irma.ie/news/kingfishr-earn-their-second-1-single-with-the-sun-will-never-settle🌞/"
    },
    {
     "key": "rois",
     "name": "RÓIS",
     "why": "Shortlisted for Choice Music Prize Irish Artist of the Year.",
     "source": "RTÉ Culture",
     "sourceUrl": "https://www.rte.ie/culture/2026/0120/1554165-rte-choice-music-prize-reveals-irish-artist-of-the-year-shortlist/"
    }
   ]
  },
  {
   "key": "song-of-the-year",
   "title": "Song of the year",
   "nominees": [
    {
     "key": "comes-and-goes",
     "name": "Comes and Goes (Kettama)",
     "why": "Reached number three on the Irish Homegrown Chart.",
     "source": "Hot Press",
     "sourceUrl": "https://www.hotpress.com/music/jazzy-and-kettama-break-into-uks-official-trending-chart-23149759"
    },
    {
     "key": "marianne",
     "name": "Marianne (Fontaines D.C.)",
     "why": "Number four on the Irish Singles Chart and number one on Homegrown.",
     "source": "IRMA",
     "sourceUrl": "https://www.irma.ie/news/fontaines-d-c-top-albums-chart-with-dopamine-chamber-as-tate-mcrae-lands-her-first-1-single/"
    },
    {
     "key": "satisfy",
     "name": "Satisfy (Jazzy and Calvin Harris)",
     "why": "Reached number nine on the UK Official Trending Chart.",
     "source": "Hot Press",
     "sourceUrl": "https://www.hotpress.com/music/jazzy-and-kettama-break-into-uks-official-trending-chart-23149759"
    },
    {
     "key": "the-sun-will-never-settle",
     "name": "The Sun Will Never Settle (Kingfishr)",
     "why": "Went to number one on the Irish singles chart.",
     "source": "IRMA",
     "sourceUrl": "https://www.irma.ie/news/kingfishr-earn-their-second-1-single-with-the-sun-will-never-settle🌞/"
    },
    {
     "key": "the-swell",
     "name": "The Swell (Amble)",
     "why": "Amble's first Irish number one single, now platinum.",
     "source": "IRMA",
     "sourceUrl": "https://www.irma.ie/news/amble-score-their-first-irish-1-single-as-the-swell-ends-rein-me-ins-11-week-run/"
    }
   ]
  },
  {
   "key": "moment-of-the-year",
   "title": "Moment of the year",
   "nominees": [
    {
     "key": "buckley-oscar",
     "name": "Jessie Buckley wins the Best Actress Oscar",
     "why": "First Irish winner in that category, for Hamnet.",
     "source": "Irish Times",
     "sourceUrl": "https://www.irishtimes.com/culture/film/2026/03/15/oscars-2026-live-updates-jessie-buckley-academy-awards/"
    },
    {
     "key": "mayo-all-ireland",
     "name": "Mayo win the All-Ireland",
     "why": "Their fourth title, 75 years after their third.",
     "source": "Irish Echo",
     "sourceUrl": "https://www.irishecho.com/2026/7/mayo-beat-kerry-to-win-4th-title-75-years-after-3rd-all-ireland"
    },
    {
     "key": "mcilroy-masters",
     "name": "Rory McIlroy retains the Masters",
     "why": "Won the Masters again, finishing one shot clear.",
     "source": "The National",
     "sourceUrl": "https://www.thenationalnews.com/sport/2026/04/13/how-2026-masters-champion-rory-mcilroy-won-his-six-majors"
    },
    {
     "key": "oconnor-heptathlon",
     "name": "Kate O'Connor wins European heptathlon gold",
     "why": "Won in Birmingham in front of a loud Irish crowd.",
     "source": "Irish Times",
     "sourceUrl": "https://www.irishtimes.com/sport/athletics/2026/08/15/kate-oconnor-in-heptathlon-gold-medal-position-with-one-event-left-at-european-championships/"
    },
    {
     "key": "taylor-farewell",
     "name": "Katie Taylor says goodbye at Croke Park",
     "why": "Final fight won before more than 80,000 fans.",
     "source": "Irish Examiner",
     "sourceUrl": "https://www.irishexaminer.com/sport/othersport/arid-41907256.html"
    }
   ]
  }
 ],
 "source": "Various, see each nominee",
 "sourceUrl": "",
 "image": null
}$aw$::jsonb,
             coalesce((
               select max(e2.ord)::numeric
               from jsonb_array_elements(c.content -> 'pages') with ordinality as e2(elem, ord)
               where e2.elem ->> 'section' = 'awards' and e2.elem ->> 'kind' is distinct from 'awards'
             ), 0) + 0.5
    ) x
  )
)
from public.weekly_issues wi
where wi.id = c.issue_id and wi.issue_number = 1 and c.page_key = 'wrapped';

-- Check: should list the awards page with 12 categories, straight after the creators lists.
select e.ord as page_in_file, e.elem ->> 'section' as section, e.elem ->> 'kind' as kind,
       coalesce(e.elem ->> 'heading', '') as heading
from public.weekly_issues wi
join public.weekly_issue_content c on c.issue_id = wi.id and c.page_key = 'wrapped'
cross join lateral jsonb_array_elements(c.content -> 'pages') with ordinality as e(elem, ord)
where wi.issue_number = 1 and e.elem ->> 'section' = 'awards'
order by e.ord;
