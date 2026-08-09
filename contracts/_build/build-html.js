/**
 * Renders the whole contract suite to one reviewable HTML page.
 *
 * Swaps lib-html into the require cache under ./lib's resolved path, so the
 * c-*.js content modules produce HTML from the exact same source text that
 * generates the .docx files.
 */

const fs = require('fs')
const path = require('path')

const libPath  = require.resolve('./lib')
const htmlLib  = require('./lib-html')

require.cache[libPath] = {
  id: libPath, filename: libPath, loaded: true, exports: htmlLib, children: [], paths: [],
}

const { guide } = require('./c-guide')
const { partner, coach } = require('./c-external')
const { handler, ambassador } = require('./c-delivery')
const { founder, marketing, outreach, legal, finance, teamMember } = require('./c-internal')
const { nda, ipDeed, dpa, safeguarding } = require('./c-cross')

const DOCS = [
  guide, founder, partner, coach, handler, ambassador,
  marketing, outreach, legal, finance, teamMember,
  nda, ipDeed, dpa, safeguarding,
]

// Who signs each document, shown in the rail.
const SIGNERS = {
  '00': 'Internal only',
  '01': 'Founder',
  '02': 'Partner businesses',
  '03': 'Uni Coaches',
  '04': 'Campus Handlers',
  '05': 'Ambassadors',
  '06': 'Marketing contributors',
  '07': 'Outreach reps',
  '08': 'Legal lead',
  '09': 'Finance lead',
  '10': 'Other internal roles',
  '11': 'Any counterparty',
  '12': 'Past contributors',
  '13': 'Attach to each role',
  '14': 'Everyone',
}

const GROUPS = [
  { label: 'Start here',   nums: ['00'] },
  { label: 'Company',      nums: ['01'] },
  { label: 'Commercial',   nums: ['02', '03'] },
  { label: 'Delivery',     nums: ['04', '05'] },
  { label: 'Internal team',nums: ['06', '07', '08', '09', '10'] },
  { label: 'Cross-cutting',nums: ['11', '12', '13', '14'] },
]

const CSS = `
*,*::before,*::after{box-sizing:border-box}

/* Light palette is the complete set. Dark blocks below redefine only tokens. */
:root{
  --ground:#F7F4EE; --sheet:#FFFFFF; --ink:#1E3A5F; --body:#3D4A5C;
  --muted:#6E7A8A; --rule:#DDD8CE; --hair:rgba(30,58,95,.10);
  --flag-bg:#FFF7ED; --flag-bd:#F59E0B; --flag-tx:#8A4B08;
  --chip-bg:rgba(30,58,95,.07); --chip-tx:#33506F;
  --rail:#F1ECE3; --sel:rgba(30,58,95,.10);
  --shadow:0 1px 2px rgba(30,58,95,.05),0 8px 24px rgba(30,58,95,.07);
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --ground:#12171E; --sheet:#181F28; --ink:#CBD9EA; --body:#B3BECC;
    --muted:#8593A5; --rule:#2B3542; --hair:rgba(203,217,234,.13);
    --flag-bg:#2A1F10; --flag-bd:#B4791F; --flag-tx:#E8B978;
    --chip-bg:rgba(203,217,234,.11); --chip-tx:#9DB6D4; --rail:#151B23;
    --sel:rgba(203,217,234,.13);
    --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.32);
  }
}
:root[data-theme="dark"]{
  --ground:#12171E; --sheet:#181F28; --ink:#CBD9EA; --body:#B3BECC;
  --muted:#8593A5; --rule:#2B3542; --hair:rgba(203,217,234,.13);
  --flag-bg:#2A1F10; --flag-bd:#B4791F; --flag-tx:#E8B978;
  --chip-bg:rgba(203,217,234,.11); --chip-tx:#9DB6D4; --rail:#151B23;
  --sel:rgba(203,217,234,.13);
  --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.32);
}

body{
  margin:0; background:var(--ground); color:var(--body);
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-size:15px; line-height:1.62;
  -webkit-font-smoothing:antialiased;
}
::selection{background:var(--sel)}

.wrap{display:grid; grid-template-columns:250px minmax(0,1fr); gap:32px;
  max-width:1220px; margin:0 auto; padding:28px 24px 96px}
/* Grid items default to min-width:auto, so a wide table inside would size the
   track by its min-content and push the whole page sideways. Pin both to 0. */
.rail,#docs{min-width:0}

/* ── Rail ─────────────────────────────────────────────────────────── */
.rail{position:sticky; top:28px; align-self:start; max-height:calc(100vh - 56px);
  overflow-y:auto; background:var(--rail); border:1px solid var(--hair);
  border-radius:12px; padding:18px 16px}
.rail h1{font-family:Georgia,"Times New Roman",serif; font-size:19px; line-height:1.2;
  color:var(--ink); margin:0 0 3px; font-weight:400}
.rail .tag{font-size:11px; color:var(--muted); margin:0 0 16px; letter-spacing:.02em}
.grp{font-size:10px; text-transform:uppercase; letter-spacing:.11em; color:var(--muted);
  font-weight:700; margin:16px 0 6px}
.grp:first-of-type{margin-top:0}
.rail a{display:grid; grid-template-columns:22px 1fr; gap:7px; align-items:baseline;
  text-decoration:none; padding:5px 7px; border-radius:7px; margin:0 -7px}
.rail a:hover{background:var(--sel)}
.rail a.on{background:var(--sel)}
.rail .n{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px;
  color:var(--muted); font-variant-numeric:tabular-nums}
.rail .nm{font-size:12.5px; color:var(--ink); line-height:1.35}
.rail .who{display:block; font-size:10.5px; color:var(--muted); margin-top:1px}
.rail .fc{display:inline-block; font-family:ui-monospace,monospace; font-size:9.5px;
  color:var(--flag-tx); background:var(--flag-bg); border:1px solid var(--flag-bd);
  border-radius:20px; padding:0 5px; margin-top:3px; line-height:1.5}
.rail a:focus-visible,.sk:focus-visible{outline:2px solid var(--ink); outline-offset:2px}

/* ── Intro ────────────────────────────────────────────────────────── */
.intro{background:var(--sheet); border:1px solid var(--hair); border-radius:12px;
  padding:26px 30px; margin-bottom:26px; box-shadow:var(--shadow)}
.intro h2{font-family:Georgia,serif; font-weight:400; color:var(--ink);
  font-size:25px; margin:0 0 8px; line-height:1.2; text-wrap:balance}
.intro p{margin:0 0 10px; max-width:66ch}
.intro p:last-child{margin-bottom:0}
.key{display:flex; flex-wrap:wrap; gap:8px; margin-top:16px}
.key span{font-size:11.5px; color:var(--muted); display:inline-flex; align-items:center; gap:6px}
.kchip{font-family:ui-monospace,monospace; font-size:10.5px; color:var(--chip-tx);
  background:var(--chip-bg); border-radius:4px; padding:1px 5px}

/* ── Sheet ────────────────────────────────────────────────────────── */
.sheet{background:var(--sheet); border:1px solid var(--hair); border-radius:12px;
  padding:44px 52px 40px; margin-bottom:26px; box-shadow:var(--shadow);
  scroll-margin-top:20px}
.sheet-hd{display:flex; justify-content:space-between; align-items:baseline;
  gap:16px; flex-wrap:wrap; padding-bottom:6px; margin-bottom:18px;
  border-bottom:1px solid var(--rule)}
.sheet-no{font-family:ui-monospace,monospace; font-size:11px; color:var(--muted);
  letter-spacing:.06em}
.ref{font-family:ui-monospace,monospace; font-size:10.5px; color:var(--muted)}

.doc-title{font-family:Georgia,serif; font-weight:400; color:var(--ink);
  font-size:29px; line-height:1.15; margin:0 0 5px; text-wrap:balance}
.doc-sub{font-size:14px; color:var(--muted); margin:0 0 22px}

h3.cl{display:grid; grid-template-columns:34px 1fr; gap:8px; align-items:baseline;
  font-family:Georgia,serif; font-weight:400; color:var(--ink); font-size:18px;
  line-height:1.3; margin:30px 0 11px; scroll-margin-top:20px}
.cl-n{font-family:ui-monospace,monospace; font-size:13px; color:var(--muted);
  font-variant-numeric:tabular-nums}
h4.h{font-family:Georgia,serif; font-weight:400; color:var(--ink); font-size:17px;
  margin:30px 0 11px; line-height:1.3}

.s{display:grid; grid-template-columns:44px 1fr; gap:8px; margin:0 0 10px}
.s-n{font-family:ui-monospace,monospace; font-size:12px; color:var(--muted);
  font-variant-numeric:tabular-nums; padding-top:1px}
.s-t{max-width:74ch}

.li{display:grid; grid-template-columns:30px 1fr; gap:7px; margin:0 0 7px;
  padding-left:calc(52px + var(--lvl,0)*16px)}
.li-m{font-family:ui-monospace,monospace; font-size:12px; color:var(--muted)}
.li>span:last-child{max-width:70ch}

p.p{margin:0 0 10px; max-width:74ch}
p.p.b{font-weight:600; color:var(--ink)}
p.p.i{font-style:italic; color:var(--muted); font-size:13.5px}
p.p.g{color:var(--muted); font-size:13.5px}
.gap{height:10px}

/* Placeholder chip: the review affordance. Must wrap; some placeholders carry a
   full sentence of guidance and nowrap would push the page sideways. */
.fill{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.86em;
  color:var(--chip-tx); background:var(--chip-bg); border-radius:4px;
  padding:1px 4px; overflow-wrap:anywhere}
.s-t,.li>span:last-child,p.p,td,.note-b{overflow-wrap:break-word}

/* ── Note ─────────────────────────────────────────────────────────── */
.note{background:var(--flag-bg); border-left:3px solid var(--flag-bd);
  border-radius:0 8px 8px 0; padding:14px 18px; margin:18px 0}
.note-t{margin:0 0 5px; font-weight:700; font-size:13px; color:var(--flag-tx)}
.note-b{margin:0; font-size:13.5px; color:var(--flag-tx); max-width:76ch}

/* ── Table ────────────────────────────────────────────────────────── */
.tw{overflow-x:auto; max-width:100%; margin:16px 0 18px;
  border:1px solid var(--hair); border-radius:9px}
table{border-collapse:collapse; width:100%; min-width:460px; font-size:13px}
th{background:var(--ink); color:var(--sheet); text-align:left; font-weight:600;
  font-size:10.5px; text-transform:uppercase; letter-spacing:.06em; padding:9px 12px}
/* th needs no dark override: --ink and --sheet swap together, so the header
   flips from white-on-navy to dark-on-pale and stays legible either way. */
td{padding:9px 12px; border-top:1px solid var(--hair); vertical-align:top; line-height:1.5}
td.num{text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap}
tbody tr:nth-child(even){background:var(--chip-bg)}

/* ── Signature ────────────────────────────────────────────────────── */
.exec{margin:32px 0 6px; padding-top:16px; border-top:1px solid var(--rule);
  font-style:italic; font-size:13.5px; color:var(--muted); max-width:76ch}
.sig-p{margin:20px 0 10px; font-weight:600; color:var(--ink); font-size:14px}
.sig-p.sig-w{margin-top:16px}
.sig-grid{display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
  gap:16px 26px; margin-bottom:6px}
.sig-l{border-bottom:1px solid var(--ink); height:26px; opacity:.45}
.sig-c{font-size:10.5px; color:var(--muted); margin-top:4px}

/* ── Utility ──────────────────────────────────────────────────────── */
.sk{position:absolute; left:-9999px; background:var(--ink); color:var(--sheet);
  padding:9px 15px; border-radius:7px; z-index:20; text-decoration:none}
.sk:focus{left:12px; top:12px}
.top{display:inline-block; margin-top:22px; font-size:12px; color:var(--muted);
  text-decoration:none; border-bottom:1px solid var(--rule)}
.top:hover{color:var(--ink)}

@media (max-width:900px){
  .wrap{grid-template-columns:minmax(0,1fr); gap:18px; padding:16px 14px 64px}
  .rail{position:static; max-height:none}
  .sheet{padding:28px 22px 26px; border-radius:10px}
  .doc-title{font-size:24px}
  .s,h3.cl{grid-template-columns:34px 1fr}
  .li{padding-left:calc(30px + var(--lvl,0)*12px)}
  .sig-grid{grid-template-columns:1fr}
}
@media print{
  .rail,.sk,.top,.intro{display:none}
  .wrap{display:block; max-width:none; padding:0}
  .sheet{box-shadow:none; border:none; padding:0; margin:0 0 28px;
    page-break-after:always; break-after:page}
  body{background:#fff; font-size:10.5pt}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important; transition:none!important}}
`

const JS = `
// Highlight the rail entry for whichever sheet is currently in view.
(function(){
  var links={}, obs;
  document.querySelectorAll('.rail a[href^="#doc-"]').forEach(function(a){
    links[a.getAttribute('href').slice(1)]=a;
  });
  if(!('IntersectionObserver' in window)) return;
  obs=new IntersectionObserver(function(es){
    es.forEach(function(e){
      var a=links[e.target.id];
      if(!a) return;
      if(e.isIntersecting){
        Object.keys(links).forEach(function(k){links[k].classList.remove('on')});
        a.classList.add('on');
      }
    });
  },{rootMargin:'-15% 0px -75% 0px'});
  document.querySelectorAll('.sheet').forEach(function(s){obs.observe(s)});
})();
`

;(async () => {
  for (const make of DOCS) await make()

  const reg = htmlLib.__registry
  const byNum = Object.fromEntries(reg.map(d => [d.num, d]))
  const totalFills = reg.reduce((a, d) => a + d.fills, 0)

  const rail = GROUPS.map(g => {
    const items = g.nums.map(n => {
      const d = byNum[n]
      if (!d) return ''
      const fc = d.fills ? `<span class="fc">${d.fills} to fill</span>` : ''
      return `<a href="#${d.slug}"><span class="n">${d.num}</span>` +
             `<span class="nm">${d.title.replace(/^UniBlueprint /, '')}` +
             `<span class="who">${SIGNERS[n] || ''}</span>${fc}</span></a>`
    }).join('')
    return `<p class="grp">${g.label}</p>${items}`
  }).join('')

  const sheets = reg.map(d =>
    `<article class="sheet" id="${d.slug}">` +
    `<div class="sheet-hd"><span class="sheet-no">Document ${d.num}</span>` +
    `<span class="ref">${d.ref}</span></div>${d.html}` +
    `<a class="top" href="#top">Back to index</a></article>`
  ).join('\n')

  const page = `<title>UniBlueprint Contract Suite</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style>
<a class="sk" href="#docs">Skip to documents</a>
<div class="wrap" id="top">
  <nav class="rail" aria-label="Documents">
    <h1>Contract Suite</h1>
    <p class="tag">15 documents &middot; draft for review</p>
    ${rail}
  </nav>
  <main id="docs">
    <div class="intro">
      <h2>Read through, then tell me what to change.</h2>
      <p>Every document is below in full, in the order you should work through them. Quote anything back by document and clause number, for example <span class="kchip">03 cl.6.1</span> or <span class="kchip">02 Schedule 2</span>, and I will change it and rebuild the Word files.</p>
      <p>Nothing here is final. The <code class="kchip">.docx</code> files already committed match this text exactly, and I will regenerate them after your edits.</p>
      <p><strong>These are drafted templates, not legal advice, and no solicitor has reviewed them.</strong> Document 00 is internal and should never be sent to a counterparty.</p>
      <div class="key">
        <span><span class="kchip">[LIKE THIS]</span> a value you must fill in before signing. ${totalFills} across the suite.</span>
        <span><span class="kchip" style="background:var(--flag-bg);color:var(--flag-tx)">Amber box</span> a decision or risk to check</span>
      </div>
    </div>
    ${sheets}
  </main>
</div>
<script>${JS}</script>`

  const out = path.join(__dirname, '..', 'contract-suite-preview.html')
  fs.writeFileSync(out, page)
  console.log(`Wrote ${out}`)
  console.log(`${reg.length} documents, ${totalFills} placeholder fields, ${(page.length / 1024).toFixed(0)} KB`)
})()
