// ═══════════════════════════════════════════════════════════════
//  CANSCREEN — Formula Engine
// ═══════════════════════════════════════════════════════════════

// ── UV index lookup by city ───────────────────────────────────────
const UV_CITY = {
  'san francisco': 8, 'sf': 8, 'los angeles': 9, 'la': 9, 'miami': 11,
  'new york': 7, 'nyc': 7, 'chicago': 6, 'seattle': 5, 'portland': 5,
  'phoenix': 11, 'denver': 9, 'austin': 9, 'houston': 9, 'atlanta': 8,
  'boston': 6, 'honolulu': 11, 'hawaii': 11, 'dallas': 9,
  'london': 4, 'paris': 5, 'berlin': 4, 'amsterdam': 4, 'rome': 8,
  'barcelona': 9, 'madrid': 9, 'lisbon': 9, 'athens': 10,
  'dubai': 12, 'abu dhabi': 12, 'riyadh': 11,
  'tokyo': 8, 'osaka': 8, 'seoul': 7, 'beijing': 8, 'shanghai': 8,
  'hong kong': 10, 'singapore': 11, 'bangkok': 12, 'jakarta': 12,
  'sydney': 11, 'melbourne': 9, 'auckland': 10,
  'toronto': 6, 'vancouver': 5, 'montreal': 5,
  'mumbai': 11, 'delhi': 10, 'bangalore': 10, 'chennai': 11,
  'cape town': 10, 'nairobi': 11, 'lagos': 11,
  'mexico city': 10, 'cancun': 11, 'bogota': 11, 'lima': 10, 'sao paulo': 10,
};

function getUVForLocation(loc) {
  const key = loc.toLowerCase().replace(/,.*/, '').trim();
  for (const [city, uv] of Object.entries(UV_CITY)) {
    if (key.includes(city) || city.includes(key)) return uv;
  }
  return 7; // default moderate
}

function uvLabel(uv) {
  if (uv <= 2)  return 'Low';
  if (uv <= 5)  return 'Moderate';
  if (uv <= 7)  return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

// ── Season detection ──────────────────────────────────────────────
const MONTHS_TO_SEASON = [
  'winter','winter','spring','spring','spring','summer',
  'summer','summer','autumn','autumn','autumn','winter'
];
const SEASON_SHIPS = { winter: 'Ships Dec', spring: 'Ships Mar', summer: 'Ships Jun · Current', autumn: 'Ships Sep' };
const SEASON_ICONS = { winter: '❄️', spring: '🌸', summer: '☀️', autumn: '🍂' };

function getCurrentSeason() {
  return MONTHS_TO_SEASON[new Date().getMonth()];
}

// ── Profile reader ────────────────────────────────────────────────
function getProfile() {
  const fitzEl  = document.querySelector('.fitz-swatch.active');
  const fitzType = fitzEl ? fitzEl.dataset.type : 'II';
  const fitzNum  = { I:1, II:2, III:3, IV:4, V:5, VI:6 }[fitzType] || 2;

  const skinTypeEl = document.querySelector('[data-group="skin-type"] .chip.active');
  const skinType   = skinTypeEl ? skinTypeEl.dataset.val : 'normal';

  const sensitivity = parseInt(document.getElementById('sensitivitySlider').value, 10);

  const concerns = [...document.querySelectorAll('[data-group="concerns"] .chip.active')]
    .map(c => c.dataset.val);

  const location = document.getElementById('locationInput').value || 'San Francisco, CA';
  const uvIndex  = getUVForLocation(location);

  const optMineral = document.getElementById('optMineral').checked;
  const optSweat   = document.getElementById('optSweat').checked;
  const optMatte   = document.getElementById('optMatte').checked;
  const optTinted  = document.getElementById('optTinted').checked;

  return { fitzType, fitzNum, skinType, sensitivity, concerns, location, uvIndex,
           options: { mineral: optMineral, sweat: optSweat, matte: optMatte, tinted: optTinted } };
}

// ── SPF calculation ───────────────────────────────────────────────
function calcSPF(fitzNum, uvIndex, sensitivity) {
  // High UV or very fair/sensitive → 50+
  if (uvIndex >= 9 || fitzNum <= 1 || sensitivity >= 4) return '50+';
  // Moderate UV and medium skin → 50
  if (uvIndex >= 6 || fitzNum <= 3) return '50';
  // Lower UV and darker skin → 30
  return '30';
}

// ── Ingredient explain generator ──────────────────────────────────
function explain(id, p, extra = {}) {
  const { fitzType, skinType, sensitivity, concerns, location, uvIndex } = p;
  const city = location.replace(/,.*/, '');
  const sensLabel = ['', 'minimal', 'low', 'moderate', 'high', 'very high'][sensitivity] || 'moderate';

  const texts = {
    zinc: `Your skin is <strong>Fitzpatrick ${fitzType}</strong> with <strong>${sensLabel} sensitivity</strong>.
      Zinc Oxide is a physical blocker that sits on the skin surface rather than absorbing into it —
      ${sensitivity >= 4 ? 'essential for reactive and sensitive skin that can\'t tolerate chemical UV filters' : 'delivering clean, reef-safe broad-spectrum coverage'}.
      At <strong>${extra.pct || 20}%</strong> it covers both UVA and UVB without penetration.`,

    tio2: `<strong>Extra mineral option selected</strong> with a lighter skin tone (Fitzpatrick ${fitzType}).
      Titanium Dioxide provides strong UVB coverage at smaller particle sizes than zinc alone,
      meaning less white cast while keeping the formula 100% free of chemical UV filters.`,

    ha: `Your profile shows <strong>${skinType} skin type</strong>.
      Mineral formulas can feel dry or chalky without a humectant.
      Hyaluronic Acid draws moisture from the air into the skin, giving the formula a
      lightweight, dewy finish that won't highlight ${skinType === 'dry' ? 'dry patches or flaking' : 'tightness or rough texture'}.`,

    ceramides: `<strong>Dry skin type</strong> has a compromised lipid barrier, causing transepidermal water loss.
      Ceramides are the skin's own structural lipids — replenishing them seals the barrier,
      locking moisture in and keeping UV-sensitising environmental irritants out all day.`,

    squalane: `<strong>Combination skin</strong> needs targeted hydration without triggering oiliness.
      Squalane is identical to the skin's own sebum component — it hydrates dry zones
      without feeding the oily T-zone, making it the ideal emollient for this skin type.`,

    vitc: `<strong>${city}</strong>'s UV index of <strong>${uvIndex} (${uvLabel(uvIndex)})</strong> triggers
      significant free-radical damage even through SPF.
      Vitamin C at ${extra.pct || 10}% neutralises those radicals and inhibits tyrosinase enzyme activity —
      a two-pronged attack on ${concerns.includes('aging') ? 'photoaging and collagen breakdown' : 'pigmentation and uneven tone'}.`,

    nia_pigment: `You flagged <strong>pigmentation</strong> as a concern.
      Niacinamide suppresses melanosome transfer between melanocytes and keratinocytes,
      reducing the appearance of dark spots and uneven tone over 4–8 weeks.
      At 5% it is clinically proven effective and sits below the irritation threshold for all skin types.`,

    nia_redness: `<strong>Redness-prone skin</strong> benefits from Niacinamide's dual action:
      it reduces the inflammatory prostaglandins that cause persistent redness,
      and strengthens the compromised skin barrier that makes skin reactive in the first place.`,

    nia_acne: `<strong>Acne-prone skin</strong> needs sebum regulation without stripping.
      Niacinamide at 4% is shown to reduce sebum excretion by up to 52% in clinical studies,
      shrink the appearance of pores, and provide anti-inflammatory action without the irritation of retinoids.`,

    nia_default: `Niacinamide is included as a general barrier-support and skin-evening active.
      At 4% it improves overall clarity, reduces mild redness, and works synergistically
      with both the mineral filters and any actives in this formula.`,

    centella: `<strong>Redness-prone skin</strong> is in a cycle of barrier damage and inflammation.
      Centella Asiatica's triterpenoids — asiaticoside and madecassoside — interrupt that cycle
      by calming the inflammatory cascade and accelerating epidermal barrier repair.
      Clinically shown to measurably reduce visible redness in 4–6 weeks.`,

    peptides: `UV exposure activates matrix metalloproteinases (MMPs) that break down collagen.
      Matrixyl peptides signal fibroblasts to produce new collagen in response,
      directly counteracting <strong>photoaging</strong> at the cellular level —
      turning your daily SPF into an active anti-aging treatment.`,

    arbutin: `For <strong>pigmentation</strong> alongside other concerns, Alpha-Arbutin is a gentler
      brightening alternative to Vitamin C. It inhibits tyrosinase with lower irritation risk,
      making it compatible with acne-prone or sensitive skin types that can't tolerate ascorbic acid.`,

    sal: `<strong>Acne-prone skin</strong> is at risk of congestion beneath occlusive sunscreen.
      Salicylic Acid at 0.5% is a BHA that exfoliates inside the pore lining,
      preventing the trapped sebum and dead cells that sunscreen can accelerate —
      without the irritation of higher concentrations.`,

    silica: `<strong>${p.options.matte ? 'Matte finish selected' : 'Oily skin type'}</strong> requires
      active oil control throughout the day. Silica microspheres physically absorb sebum and scatter light,
      creating an instant soft-focus blur effect and keeping the formula from turning shiny by midday.`,

    film: `<strong>Sweat resistant option selected.</strong> Standard mineral sunscreens wash off within
      40 minutes of activity. Film-forming polymers create a flexible, breathable network over the skin
      that maintains SPF integrity through 80 minutes of water or sweat exposure — lab-verified to
      standard ISO 24444.`,
  };

  return texts[id] || 'This ingredient was selected based on your skin profile and concerns.';
}

// ── Core formula builder ──────────────────────────────────────────
function buildFormula(p) {
  const { fitzNum, fitzType, skinType, sensitivity, concerns, uvIndex, options } = p;
  const spf = calcSPF(fitzNum, uvIndex, sensitivity);

  // Finish
  let finish;
  if (options.matte)              finish = 'Mattifying gel-cream';
  else if (skinType === 'oily')   finish = 'Lightweight oil-free fluid';
  else if (skinType === 'dry')    finish = 'Rich hydrating lotion';
  else if (skinType === 'combo')  finish = 'Balancing fluid';
  else                            finish = 'Lightweight fluid';
  if (options.sweat) finish += ' · sport';
  if (options.tinted) finish += ' · tinted';

  const ings = [];

  // ── Zinc Oxide (always) ──
  const zincPct = spf === '50+' ? (sensitivity >= 4 ? 22 : 20)
                : spf === '50'  ? 18 : 15;
  const zincBar = spf === '50+' ? 88 : spf === '50' ? 72 : 58;
  ings.push({
    id: 'zinc', name: `Zinc Oxide ${zincPct}%`,
    reason: `Broad-spectrum mineral filter · ${sensitivity >= 4 ? 'non-reactive, skin-safe' : 'reef-safe coverage'}`,
    bar: zincBar, explainId: 'zinc', explainExtra: { pct: zincPct },
  });

  // ── Titanium Dioxide (extra mineral + lighter skin) ──
  if (options.mineral && fitzNum <= 3) {
    ings.push({
      id: 'tio2', name: 'Titanium Dioxide 8%',
      reason: 'Secondary mineral filter · enhanced UVB · no white cast',
      bar: 38, explainId: 'tio2',
    });
  }

  // ── Skin type base ingredients ──
  if (skinType === 'dry' || concerns.includes('dryness')) {
    ings.push({
      id: 'ha', name: 'Hyaluronic Acid 1.5%',
      reason: 'Humectant · moisture retention · prevents mineral dryness',
      bar: 28, explainId: 'ha',
    });
  }
  if (skinType === 'dry') {
    ings.push({
      id: 'ceramides', name: 'Ceramide Complex 2%',
      reason: 'Barrier lipid repair · seals moisture · reduces reactivity',
      bar: 22, explainId: 'ceramides',
    });
  }
  if (skinType === 'combo') {
    ings.push({
      id: 'squalane', name: 'Squalane 1%',
      reason: 'Targeted emollient · hydrates dry zones · non-comedogenic',
      bar: 16, explainId: 'squalane',
    });
  }

  // ── Concern-based ingredients ──
  const hasPigment   = concerns.includes('pigmentation');
  const hasAging     = concerns.includes('aging');
  const hasRedness   = concerns.includes('redness');
  const hasAcne      = concerns.includes('acne');
  const hasDryness   = concerns.includes('dryness');

  // Vitamin C — pigmentation or aging, but not acne-prone
  if ((hasPigment || hasAging) && !hasAcne) {
    const vitcPct = hasAging && hasPigment ? 12 : hasAging ? 15 : 10;
    ings.push({
      id: 'vitc', name: `Vitamin C (L-AA) ${vitcPct}%`,
      reason: `Antioxidant · ${hasAging ? 'collagen defence' : 'pigmentation correction'} · UV radical quencher`,
      bar: Math.round(vitcPct * 3.5), explainId: 'vitc', explainExtra: { pct: vitcPct },
    });
  }

  // Alpha-Arbutin — pigmentation with acne (gentler brightener)
  if (hasPigment && hasAcne) {
    ings.push({
      id: 'arbutin', name: 'Alpha-Arbutin 2%',
      reason: 'Tyrosinase inhibitor · brightening · acne-safe alternative to Vitamin C',
      bar: 24, explainId: 'arbutin',
    });
  }

  // Niacinamide — present in most formulas, purpose shifts by concern
  if (hasPigment && !hasAcne) {
    ings.push({
      id: 'nia', name: 'Niacinamide 5%',
      reason: 'Melanosome transfer inhibitor · evens skin tone · barrier support',
      bar: 52, explainId: 'nia_pigment',
    });
  } else if (hasRedness) {
    ings.push({
      id: 'nia', name: 'Niacinamide 4%',
      reason: 'Anti-inflammatory · reduces redness · barrier strengthening',
      bar: 44, explainId: 'nia_redness',
    });
  } else if (hasAcne) {
    ings.push({
      id: 'nia', name: 'Niacinamide 4%',
      reason: 'Sebum regulation · pore minimising · anti-inflammatory',
      bar: 44, explainId: 'nia_acne',
    });
  } else {
    ings.push({
      id: 'nia', name: 'Niacinamide 4%',
      reason: 'Barrier support · skin tone evenness · general skin health',
      bar: 38, explainId: 'nia_default',
    });
  }

  // Centella — redness
  if (hasRedness) {
    ings.push({
      id: 'centella', name: 'Centella Asiatica 3%',
      reason: 'Triterpenoid complex · calms reactivity · accelerates barrier repair',
      bar: 32, explainId: 'centella',
    });
  }

  // Peptides — aging
  if (hasAging) {
    ings.push({
      id: 'peptides', name: 'Matrixyl 3000™ 5%',
      reason: 'Collagen stimulation · photoaging defence · firming',
      bar: 30, explainId: 'peptides',
    });
  }

  // Salicylic Acid — acne
  if (hasAcne) {
    ings.push({
      id: 'sal', name: 'Salicylic Acid 0.5%',
      reason: 'BHA · pore exfoliation · prevents SPF-related congestion',
      bar: 14, explainId: 'sal',
    });
  }

  // Silica — matte or oily
  if (options.matte || skinType === 'oily') {
    ings.push({
      id: 'silica', name: 'Silica Microspheres 3%',
      reason: 'Oil absorption · mattifying · soft-focus blur',
      bar: 24, explainId: 'silica',
    });
  }

  // Film former — sweat resistant
  if (options.sweat) {
    ings.push({
      id: 'film', name: 'Film-Forming Polymer 2%',
      reason: '80-min water & sweat resistance · sport-grade adhesion',
      bar: 18, explainId: 'film',
    });
  }

  // Limit to 6 most impactful ingredients for readability
  const sorted = ings.sort((a, b) => b.bar - a.bar).slice(0, 6);

  return { spf, finish, ingredients: sorted };
}

// ── Seasonal formula builder ──────────────────────────────────────
function buildSeasonalFormulas(profile, baseSpf) {
  const { fitzNum, uvIndex } = profile;
  const seasonUV = {
    winter: Math.max(2, uvIndex - 5),
    spring: Math.max(3, uvIndex - 2),
    summer: uvIndex,
    autumn: Math.max(3, uvIndex - 3),
  };
  const finishes = { winter: 'Rich cream', spring: 'Fluid lotion', autumn: 'Balancing gel' };

  return Object.fromEntries(
    ['winter','spring','summer','autumn'].map(s => [s, {
      spf:    calcSPF(fitzNum, seasonUV[s], profile.sensitivity),
      uv:     seasonUV[s],
      finish: finishes[s] || profile.options.matte ? 'Mattifying gel' : 'Lightweight fluid',
    }])
  );
}

// ── DOM renderer ──────────────────────────────────────────────────
function renderFormula(p, formula, seasonals) {
  const { fitzType, skinType, sensitivity, concerns, location, uvIndex, options } = p;
  const { spf, finish, ingredients } = formula;
  const city = location.replace(/,.*/, '');
  const sensLabel = ['','Minimal','Low','Moderate','High','Very high'][sensitivity];
  const currentSeason = getCurrentSeason();

  // Formula ID
  const fid = '#CS-' + (Math.floor(1000 + Math.random() * 9000));
  document.querySelector('.formula-id').textContent = fid;

  // Tube & meta
  document.querySelector('.tube-spf').textContent = `SPF ${spf}`;
  document.querySelector('.spf-value').textContent = `SPF ${spf}`;
  document.querySelectorAll('.meta-value')[1].textContent = finish.split(' · ')[0];
  document.querySelectorAll('.meta-value')[2].textContent =
    currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1) + ' 2026';

  // Ingredient list
  const list = document.querySelector('.ingredient-list');
  list.innerHTML = ingredients.map(ing => `
    <div class="ingredient-row">
      <div class="ing-header">
        <div class="ing-info">
          <span class="ing-name">${ing.name}</span>
          <span class="ing-reason">${ing.reason}</span>
        </div>
        <button class="ing-why-btn" data-ing="${ing.id}">Why?</button>
      </div>
      <div class="ing-bar"><div class="ing-fill" style="width:${ing.bar}%"></div></div>
      <div class="ing-explain" id="explain-${ing.id}">
        ${explain(ing.explainId, p, ing.explainExtra || {})}
      </div>
    </div>
  `).join('');

  // Re-attach ingredient why button listeners
  list.querySelectorAll('.ing-why-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(`explain-${btn.dataset.ing}`);
      const isOpen = panel.classList.contains('open');
      list.querySelectorAll('.ing-explain').forEach(ep => ep.classList.remove('open'));
      list.querySelectorAll('.ing-why-btn').forEach(b => { b.classList.remove('active'); b.textContent = 'Why?'; });
      if (!isOpen) { panel.classList.add('open'); btn.classList.add('active'); btn.textContent = 'Got it'; }
    });
  });

  // UV breakdown card
  const uvCard = document.querySelector('.uv-card');
  uvCard.querySelector('.breakdown-label').textContent = `UV Index · ${city}`;
  uvCard.querySelector('.breakdown-value').textContent = `${uvIndex} — ${uvLabel(uvIndex)}`;
  uvCard.querySelector('.breakdown-note').textContent =
    `Peak hours 10am – 3pm · SPF ${spf} recommended`;

  // Skin breakdown card
  const skinCard = document.querySelector('.skin-card');
  const riskLabel = fitzType <= 'II' ? 'Elevated sun damage risk' : fitzType <= 'IV' ? 'Moderate sun damage risk' : 'Lower burn risk';
  const filterPref = (sensitivity >= 4 || options.mineral) ? 'mineral filter required' : 'mineral filter preferred';
  skinCard.querySelector('.breakdown-value').textContent =
    `Fitzpatrick ${fitzType} · ${skinType.charAt(0).toUpperCase()+skinType.slice(1)} · ${sensLabel} sensitivity`;
  skinCard.querySelector('.breakdown-note').textContent =
    `${riskLabel} · ${filterPref}`;

  // Season adjustment card
  const seasonCard = document.querySelector('.season-card');
  const nextSeasonMap = { winter:'spring', spring:'summer', summer:'autumn', autumn:'winter' };
  const nextSeason = nextSeasonMap[currentSeason];
  const nextSpf = seasonals[nextSeason].spf;
  const nextShipMap = { spring:'March 2027', summer:'June 2026', autumn:'September 2026', winter:'December 2026' };
  seasonCard.querySelector('.breakdown-value').textContent =
    `${currentSeason.charAt(0).toUpperCase()+currentSeason.slice(1)} → ${nextSeason.charAt(0).toUpperCase()+nextSeason.slice(1)} reformulation`;
  seasonCard.querySelector('.breakdown-note').textContent =
    `Next shipment ${nextShipMap[nextSeason]} · SPF ${spf} → SPF ${nextSpf}`;

  // Season timeline
  const blocks = document.querySelectorAll('.season-block');
  const ORDER = ['winter','spring','summer','autumn'];
  blocks.forEach((block, i) => {
    const s = ORDER[i];
    const sd = seasonals[s];
    const uvPct = Math.round((sd.uv / 13) * 100);

    block.querySelector('.season-spf').textContent = `SPF ${sd.spf}`;
    block.querySelector('.season-spf').className =
      'season-spf ' + (sd.spf === '30' ? 'spf-low' : sd.spf === '50' ? 'spf-mid' : 'spf-high');
    block.querySelector('.season-uv-fill').style.height = uvPct + '%';
    block.querySelector('.season-uv-val').textContent = sd.uv;
    block.querySelector('.season-ship').textContent = SEASON_SHIPS[s];

    block.classList.toggle('season-active', s === currentSeason);
  });

  // Sync SPF timer, DNA helix, seasonal flip cards, and UV widget with formula result
  syncTimerSPF(spf, p);
  updateHelix(ingredients);
  updateFlipCards(seasonals);
  uvWidgetSpf = spf; // refresh UV widget protection status
  { const uvBig = document.getElementById('uvLiveIndexBig'); if (uvBig) { const uv = parseInt(uvBig.textContent,10)||0; const city = document.getElementById('uvLiveCity'); updateUVWidget(uv, city&&city.textContent, spf); } }

  // Scroll to result
  document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
}

// ─────────────────────────────────────────────────────────────────
//  ANALYSIS OVERLAY ANIMATION
// ─────────────────────────────────────────────────────────────────
const overlay   = document.getElementById('analysisOverlay');
const atubeFill = document.getElementById('atubeFill');
const atubeSPF  = document.getElementById('atubeSPF');
const tagline   = document.getElementById('analysisTagline');
const STEP_IDS  = ['astep1','astep2','astep3','astep4'];

const TAGLINES = [
  'Reading your skin tone & texture…',
  'Checking UV data for your location…',
  'Matching actives to your concerns…',
  'Your formula is ready.',
];

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function runStep(index) {
  return new Promise(resolve => {
    const el    = document.getElementById(STEP_IDS[index]);
    const fill  = el.querySelector('.astep-fill');
    const check = el.querySelector('.astep-check');
    tagline.textContent = TAGLINES[index];
    el.classList.add('running');
    fill.style.transition = 'width .72s ease';
    fill.style.width = '100%';
    const pct = ((index + 1) / STEP_IDS.length) * 100;
    atubeFill.style.transition = 'height .72s ease';
    atubeFill.style.height = pct + '%';
    setTimeout(() => {
      el.classList.remove('running');
      el.classList.add('done');
      check.style.opacity = '1';
      setTimeout(resolve, 180);
    }, 820);
  });
}

async function runAnalysis() {
  const profile  = getProfile();
  const formula  = buildFormula(profile);
  const seasonals = buildSeasonalFormulas(profile, formula.spf);

  // update step 2 label with location
  const city = profile.location.replace(/,.*/, '');
  document.getElementById('astepLocLabel').textContent = `Checking UV index · ${city}`;

  // reset overlay state
  STEP_IDS.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('running','done');
    el.querySelector('.astep-fill').style.cssText = 'width:0%;transition:none';
    el.querySelector('.astep-check').style.opacity = '0';
  });
  atubeFill.style.cssText = 'height:0%;transition:none';
  atubeSPF.textContent = '—';
  tagline.textContent = 'Analysing your skin…';

  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
  await delay(320);

  for (let i = 0; i < STEP_IDS.length; i++) {
    await runStep(i);
    if (i === STEP_IDS.length - 1) atubeSPF.textContent = `SPF ${formula.spf}`;
    if (i < STEP_IDS.length - 1) await delay(220);
  }

  await delay(900);
  overlay.classList.add('done');
  await delay(600);
  overlay.classList.remove('visible','done');
  document.body.style.overflow = '';

  renderFormula(profile, formula, seasonals);
}

document.getElementById('analyseBtn').addEventListener('click', runAnalysis);
overlay.addEventListener('click', e => {
  if (e.target === overlay) { overlay.classList.remove('visible','done'); document.body.style.overflow = ''; }
});

// ─────────────────────────────────────────────────────────────────
//  FORM CONTROLS
// ─────────────────────────────────────────────────────────────────

// ── Image upload / preview ────────────────────────────────────────
const dropZone  = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview   = document.getElementById('preview');

function loadImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => { preview.src = e.target.result; dropZone.classList.add('has-image'); };
  reader.readAsDataURL(file);
}
dropZone.addEventListener('click', e => {
  if (e.target === fileInput || e.target.tagName === 'LABEL') return;
  fileInput.click();
});
fileInput.addEventListener('change', () => loadImage(fileInput.files[0]));
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--gold)'; });
dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; });
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.style.borderColor = '';
  loadImage(e.dataTransfer.files[0]);
});

// ── Chip toggles ──────────────────────────────────────────────────
const TINT_GROUPS = ['undertone','coverage'];
document.querySelectorAll('.chip-group').forEach(group => {
  if (TINT_GROUPS.includes(group.dataset.group)) return;
  const multi = group.dataset.group === 'concerns';
  group.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (multi) { chip.classList.toggle('active'); }
      else { group.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); chip.classList.add('active'); }
    });
  });
});

// ── Sensitivity slider ────────────────────────────────────────────
const slider    = document.getElementById('sensitivitySlider');
const sliderVal = document.getElementById('sensitivityVal');
const SENS_LABELS = ['','Minimal','Low','Moderate','High','Very high'];
slider.addEventListener('input', () => { sliderVal.textContent = SENS_LABELS[slider.value]; });

// ── Skin tone color picker + Fitzpatrick sync ─────────────────────
const toneSlider      = document.getElementById('toneSlider');
const tonePreview     = document.getElementById('tonePreview');
const toneTypeLbl     = document.getElementById('toneTypeLabel');
const fitzDescEl      = document.getElementById('fitzDesc');

const TONE_STOPS = [
  { pct:   0, r:253, g:232, b:216 },
  { pct:  18, r:245, g:197, b:163 },
  { pct:  36, r:232, g:168, b:124 },
  { pct:  56, r:198, g:134, b: 66 },
  { pct:  76, r:141, g: 85, b: 36 },
  { pct: 100, r: 61, g: 28, b:  8 },
];

function lerpColor(pct, stops) {
  let lo = stops[0], hi = stops[stops.length-1];
  for (let i = 0; i < stops.length-1; i++) {
    if (pct >= stops[i].pct && pct <= stops[i+1].pct) { lo = stops[i]; hi = stops[i+1]; break; }
  }
  const t = lo.pct === hi.pct ? 0 : (pct - lo.pct) / (hi.pct - lo.pct);
  return `rgb(${Math.round(lo.r+t*(hi.r-lo.r))},${Math.round(lo.g+t*(hi.g-lo.g))},${Math.round(lo.b+t*(hi.b-lo.b))})`;
}

function nearestSwatch(pct) {
  return [...document.querySelectorAll('.fitz-swatch')]
    .reduce((best, s) => Math.abs(+s.dataset.val - pct) < Math.abs(+best.dataset.val - pct) ? s : best);
}

function applyTone(pct, source) {
  tonePreview.style.background = lerpColor(pct, TONE_STOPS);
  const active = nearestSwatch(pct);
  toneTypeLbl.textContent = active.dataset.type;
  document.querySelectorAll('.fitz-swatch').forEach(s => s.classList.remove('active'));
  active.classList.add('active');
  if (source !== 'init') {
    fitzDescEl.textContent = active.dataset.desc;
    fitzDescEl.classList.add('fitz-flash');
    setTimeout(() => fitzDescEl.classList.remove('fitz-flash'), 400);
  }
}

toneSlider.addEventListener('input', () => applyTone(+toneSlider.value, 'slider'));
applyTone(+toneSlider.value, 'init');

document.querySelectorAll('.fitz-swatch').forEach(s => {
  s.addEventListener('click', () => { toneSlider.value = s.dataset.val; applyTone(+s.dataset.val, 'swatch'); });
});

// ── Tint panel ────────────────────────────────────────────────────
const optTinted      = document.getElementById('optTinted');
const tintPanel      = document.getElementById('tintPanel');
const tintSlider     = document.getElementById('tintSlider');
const tintPreview    = document.getElementById('tintPreview');
const tintShadeLabel = document.getElementById('tintShadeLabel');
const tintTubeBody   = document.getElementById('tintTubeBody');
const tintMatchName  = document.getElementById('tintMatchName');

const UNDERTONE_STOPS = {
  warm:    [{pct:0,r:254,g:235,b:213},{pct:20,r:247,g:197,b:138},{pct:40,r:224,g:154,b:80},{pct:60,r:184,g:112,b:42},{pct:80,r:122,g:64,b:21},{pct:100,r:61,g:24,b:8}],
  neutral: [{pct:0,r:253,g:232,b:216},{pct:18,r:245,g:197,b:163},{pct:40,r:212,g:149,b:106},{pct:60,r:160,g:101,b:53},{pct:80,r:107,g:61,b:30},{pct:100,r:61,g:28,b:8}],
  cool:    [{pct:0,r:253,g:232,b:236},{pct:20,r:245,g:181,b:188},{pct:40,r:212,g:138,b:149},{pct:60,r:160,g:80,b:96},{pct:80,r:107,g:48,b:60},{pct:100,r:61,g:24,b:32}],
};
const COV_LABELS = { sheer:'Sheer', light:'Light', medium:'Medium', buildable:'Buildable' };
const UNDERTONE_PREFIX = { warm:'W', neutral:'N', cool:'C' };
let currentUndertone = 'neutral', currentCoverage = 'light';

function shadeNum(pct) { return String(Math.min(6, Math.floor(pct/17)+1)).padStart(2,'0'); }

function applyTintColor(pct) {
  const stops = UNDERTONE_STOPS[currentUndertone];
  const { r, g, b } = (() => {
    const c = lerpColor(pct, stops).match(/\d+/g).map(Number);
    return { r:c[0], g:c[1], b:c[2] };
  })();
  const css = `rgb(${r},${g},${b})`;
  tintPreview.style.background = css;
  tintTubeBody.style.background =
    `linear-gradient(160deg,rgb(${Math.min(255,r+22)},${Math.min(255,g+18)},${Math.min(255,b+14)}),${css} 60%,rgb(${Math.max(0,r-22)},${Math.max(0,g-18)},${Math.max(0,b-14)}))`;
  const shade = `${currentUndertone.charAt(0).toUpperCase()}${currentUndertone.slice(1)} ${shadeNum(pct)}`;
  tintShadeLabel.textContent = `${UNDERTONE_PREFIX[currentUndertone]}${shadeNum(pct)}`;
  tintMatchName.textContent  = `${shade} — ${COV_LABELS[currentCoverage]} coverage`;
}

tintSlider.addEventListener('input', () => applyTintColor(+tintSlider.value));

document.querySelector('[data-group="undertone"]').querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelector('[data-group="undertone"]').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentUndertone = chip.dataset.val;
    tintSlider.dataset.undertone = currentUndertone;
    applyTintColor(+tintSlider.value);
  });
});

document.querySelector('[data-group="coverage"]').querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelector('[data-group="coverage"]').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentCoverage = chip.dataset.val;
    applyTintColor(+tintSlider.value);
  });
});

optTinted.addEventListener('change', () => {
  if (optTinted.checked) {
    tintPanel.classList.add('open');
    tintSlider.value = toneSlider.value;
    tintSlider.dataset.undertone = currentUndertone;
    applyTintColor(+tintSlider.value);
  } else {
    tintPanel.classList.remove('open');
  }
});

toneSlider.addEventListener('input', () => {
  if (optTinted.checked) { tintSlider.value = toneSlider.value; applyTintColor(+tintSlider.value); }
});

tintSlider.dataset.undertone = 'neutral';
applyTintColor(+tintSlider.value);

// ═══════════════════════════════════════════════════════════════
//  SPF EXPIRY TIMER
// ═══════════════════════════════════════════════════════════════

const RING_CIRC      = 2 * Math.PI * 90; // 565.5
const timerRingArc   = document.getElementById('timerRingArc');
const timerCountdown = document.getElementById('timerCountdown');
const timerStatusEl  = document.getElementById('timerStatus');
const timerSpfBadge  = document.getElementById('timerSpfBadge');
const timerDurLabel  = document.getElementById('timerDurLabel');
const timerExpiresAt = document.getElementById('timerExpiresAt');
const timerReapplyCountEl = document.getElementById('timerReapplyCount');
const timerAdviceEl  = document.getElementById('timerAdvice');
const timerApplyBtn  = document.getElementById('timerApplyBtn');
const timerReapplyBtn = document.getElementById('timerReapplyBtn');

let spfInterval    = null;
let spfTotal       = 0;
let spfRemaining   = 0;
let spfReapplies   = 0;
let spfRunning     = false;
let spfLastProfile = null;
let spfLastSpf     = '50+';

function calcProtectionMins(spf, profile) {
  let mins = spf === '30' ? 120 : 150;
  if (profile) {
    if (profile.skinType === 'oily') mins -= 15;
    if (profile.skinType === 'dry')  mins += 10;
    if (profile.options && profile.options.sweat) mins += 45;
    if (profile.uvIndex >= 10) mins -= 15;
    else if (profile.uvIndex >= 8) mins -= 8;
  }
  return Math.max(80, Math.min(215, mins));
}

function fmtTime(s) {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function tickTimer() {
  if (spfRemaining > 0) spfRemaining--;
  const frac = spfTotal > 0 ? spfRemaining / spfTotal : 0;

  // Ring
  timerRingArc.style.strokeDashoffset = RING_CIRC * (1 - frac);
  if (frac > 0.5)       timerRingArc.style.stroke = '#2d8a50';
  else if (frac > 0.25) timerRingArc.style.stroke = '#b8963e';
  else if (frac > 0.08) timerRingArc.style.stroke = '#d4832e';
  else                  timerRingArc.style.stroke = '#c0392b';

  // Countdown & status
  if (spfRemaining <= 0) {
    timerCountdown.textContent = '00:00:00';
    timerCountdown.style.color = '#c0392b';
    timerStatusEl.textContent  = 'Reapply now!';
    timerStatusEl.style.color  = '#c0392b';
    clearInterval(spfInterval);
    spfRunning = false;
  } else {
    timerCountdown.textContent = fmtTime(spfRemaining);
    if (frac > 0.25) {
      timerCountdown.style.color = 'var(--gold)';
      timerStatusEl.style.color  = 'var(--gold)';
      timerStatusEl.textContent  = 'Protected ◆';
    } else if (frac > 0.08) {
      timerCountdown.style.color = '#d4832e';
      timerStatusEl.style.color  = '#d4832e';
      timerStatusEl.textContent  = 'Reapply soon';
    } else {
      timerCountdown.style.color = '#c0392b';
      timerStatusEl.style.color  = '#c0392b';
      timerStatusEl.textContent  = 'Expiring!';
    }
  }
}

function startTimer() {
  if (spfInterval) clearInterval(spfInterval);
  const mins = calcProtectionMins(spfLastSpf, spfLastProfile);
  spfTotal     = mins * 60;
  spfRemaining = spfTotal;
  spfRunning   = true;

  timerDurLabel.textContent = `${mins} min`;
  const exp = new Date(Date.now() + spfTotal * 1000);
  timerExpiresAt.textContent = exp.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  timerReapplyCountEl.textContent = spfReapplies;
  timerApplyBtn.style.display  = 'none';
  timerReapplyBtn.style.display = '';

  const sweatNote = spfLastProfile?.options?.sweat ? ' Sweat-resistant formula active.' : '';
  timerAdviceEl.textContent = `SPF ${spfLastSpf} lasts ~${mins} min on your skin type.${sweatNote} The ring depletes in real time.`;

  tickTimer();
  spfInterval = setInterval(tickTimer, 1000);
}

function syncTimerSPF(spf, profile) {
  spfLastSpf     = spf;
  spfLastProfile = profile;
  timerSpfBadge.textContent = `SPF ${spf}`;
  const mins = calcProtectionMins(spf, profile);
  timerDurLabel.textContent = `${mins} min`;
  timerAdviceEl.textContent = `Your SPF ${spf} formula lasts ~${mins} min. Hit "I've applied" to start tracking.`;
  if (spfRunning) startTimer();
}

timerApplyBtn.addEventListener('click', startTimer);
timerReapplyBtn.addEventListener('click', () => { spfReapplies++; startTimer(); });

// ═══════════════════════════════════════════════════════════════
//  FACE PREVIEW
// ═══════════════════════════════════════════════════════════════

const FACE_PALETTE = [
  null,
  { hair:'#ecd49e', hairDark:'#c4a870', eye:'#6b9ed4', eyeDark:'#3a6aa0', brow:'#907840', lip:'#d48888', lipDark:'#b86070' }, // I
  { hair:'#c8a060', hairDark:'#a07840', eye:'#5a9068', eyeDark:'#2a6040', brow:'#6a5028', lip:'#c87070', lipDark:'#a85058' }, // II
  { hair:'#8b5c2e', hairDark:'#5a3818', eye:'#6b4a30', eyeDark:'#3a2810', brow:'#3c2010', lip:'#b06060', lipDark:'#8a4048' }, // III
  { hair:'#4a2e14', hairDark:'#2c1808', eye:'#3a2010', eyeDark:'#1e1008', brow:'#221008', lip:'#9a5050', lipDark:'#784040' }, // IV
  { hair:'#281408', hairDark:'#140c04', eye:'#1e1008', eyeDark:'#0e0804', brow:'#100806', lip:'#8a4040', lipDark:'#6a3030' }, // V
  { hair:'#0e0804', hairDark:'#080402', eye:'#0e0806', eyeDark:'#060402', brow:'#080404', lip:'#7a3830', lipDark:'#5a2820' }, // VI
];

function parseRgb(s) {
  const m = (s || '').match(/\d+/g);
  return m ? { r:+m[0], g:+m[1], b:+m[2] } : { r:245, g:197, b:163 };
}

function buildFaceSVG(sk, fitzNum, overlayHtml, uid) {
  const pal = FACE_PALETTE[Math.max(1, Math.min(6, fitzNum))] || FACE_PALETTE[2];
  const s   = `rgb(${sk.r},${sk.g},${sk.b})`;
  const sd  = `rgb(${Math.max(0,sk.r-22)},${Math.max(0,sk.g-18)},${Math.max(0,sk.b-14)})`;
  const sl  = `rgb(${Math.min(255,sk.r+30)},${Math.min(255,sk.g+24)},${Math.min(255,sk.b+18)})`;
  const ba  = Math.max(0.04, 0.20 - fitzNum * 0.024).toFixed(3);
  const { hair, hairDark, eye, eyeDark, brow, lip, lipDark } = pal;

  return `<svg viewBox="0 0 220 280" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="sg_${uid}" cx="48%" cy="34%" r="68%">
    <stop offset="0%" stop-color="${sl}"/>
    <stop offset="65%" stop-color="${s}"/>
    <stop offset="100%" stop-color="${sd}"/>
  </radialGradient>
  <radialGradient id="blushrg_${uid}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="rgba(215,90,72,${ba})"/>
    <stop offset="100%" stop-color="rgba(215,90,72,0)"/>
  </radialGradient>
  <clipPath id="fc_${uid}">
    <path d="M110,54C154,54 181,80 181,120C181,153 175,174 164,192C151,212 129,227 110,228C91,227 69,212 56,192C45,174 39,153 39,120C39,80 66,54 110,54Z"/>
  </clipPath>
</defs>
<path d="M91,224C91,244 94,264 97,280L123,280C126,264 129,244 129,224C120,230 115,232 105,231Z" fill="${s}"/>
<path d="M110,43C159,43 203,74 208,134C213,194 197,263 178,280L42,280C23,263 7,194 12,134C17,74 61,43 110,43Z" fill="${hair}"/>
<ellipse cx="37" cy="154" rx="9" ry="14" fill="${s}"/>
<ellipse cx="39" cy="154" rx="5" ry="9" fill="${sd}"/>
<ellipse cx="183" cy="154" rx="9" ry="14" fill="${s}"/>
<ellipse cx="181" cy="154" rx="5" ry="9" fill="${sd}"/>
<path d="M110,54C154,54 181,80 181,120C181,153 175,174 164,192C151,212 129,227 110,228C91,227 69,212 56,192C45,174 39,153 39,120C39,80 66,54 110,54Z" fill="url(#sg_${uid})"/>
<ellipse cx="72" cy="169" rx="26" ry="18" fill="url(#blushrg_${uid})"/>
<ellipse cx="148" cy="169" rx="26" ry="18" fill="url(#blushrg_${uid})"/>
<path d="M57,112Q72,104 90,109" stroke="${brow}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
<path d="M130,109Q148,104 163,112" stroke="${brow}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
<path d="M60,131C64,121 94,121 98,131C94,141 64,141 60,131Z" fill="white"/>
<path d="M122,131C126,121 156,121 160,131C156,141 126,141 122,131Z" fill="white"/>
<circle cx="79" cy="131" r="9" fill="${eye}"/><circle cx="79" cy="131" r="6" fill="${eyeDark}"/>
<circle cx="79" cy="131" r="3.5" fill="#060402"/><circle cx="81" cy="129" r="2.4" fill="rgba(255,255,255,0.85)"/>
<circle cx="141" cy="131" r="9" fill="${eye}"/><circle cx="141" cy="131" r="6" fill="${eyeDark}"/>
<circle cx="141" cy="131" r="3.5" fill="#060402"/><circle cx="143" cy="129" r="2.4" fill="rgba(255,255,255,0.85)"/>
<path d="M60,131C66,121 94,121 98,131" stroke="${brow}" stroke-width="1.6" fill="none" opacity="0.9"/>
<path d="M122,131C126,121 156,121 160,131" stroke="${brow}" stroke-width="1.6" fill="none" opacity="0.9"/>
<path d="M62,134C70,140 90,140 96,134" stroke="${sd}" stroke-width="0.8" fill="none" opacity="0.5"/>
<path d="M124,134C130,140 150,140 158,134" stroke="${sd}" stroke-width="0.8" fill="none" opacity="0.5"/>
<path d="M108,150C107,160 104,168 99,174C106,178 114,178 121,174C116,168 113,160 112,150Z" fill="${sd}" opacity="0.22"/>
<ellipse cx="100" cy="174" rx="5.5" ry="3.5" fill="${sd}" opacity="0.44"/>
<ellipse cx="120" cy="174" rx="5.5" ry="3.5" fill="${sd}" opacity="0.44"/>
<path d="M83,193Q91,186 100,190Q110,183 120,190Q129,186 137,193Q128,201 110,198Q92,201 83,193Z" fill="${lip}"/>
<path d="M83,193Q91,210 110,213Q129,210 137,193Q126,205 110,203Q94,205 83,193Z" fill="${lipDark}"/>
<path d="M93,189Q110,185 127,189" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M39,120C41,84 66,50 110,46C154,50 179,84 181,120C168,108 152,97 138,93C126,76 118,70 110,68C102,70 94,76 82,93C68,97 52,108 39,120Z" fill="${hair}"/>
<line x1="110" y1="46" x2="110" y2="68" stroke="${hairDark}" stroke-width="1.2" opacity="0.55"/>
<ellipse cx="110" cy="92" rx="32" ry="22" fill="rgba(255,255,255,0.05)"/>
<g clip-path="url(#fc_${uid})">${overlayHtml}</g>
</svg>`;
}

function buildSpfOverlay(profile) {
  if (profile.options.tinted) {
    const rgb = parseRgb(tintPreview.style.background);
    const { r, g, b } = rgb;
    return `<rect x="0" y="0" width="220" height="280" fill="rgba(${r},${g},${b},0.36)"/>
<ellipse cx="72" cy="155" rx="23" ry="15" fill="rgba(255,255,255,0.09)"/>
<ellipse cx="148" cy="155" rx="23" ry="15" fill="rgba(255,255,255,0.09)"/>
<ellipse cx="110" cy="88" rx="22" ry="15" fill="rgba(255,255,255,0.07)"/>
<ellipse cx="110" cy="158" rx="7" ry="4" fill="rgba(255,255,255,0.12)"/>`;
  }
  if (profile.options.mineral) {
    return `<rect x="0" y="0" width="220" height="280" fill="rgba(242,239,232,0.22)"/>
<ellipse cx="110" cy="86" rx="30" ry="21" fill="rgba(255,255,255,0.15)"/>
<ellipse cx="72" cy="152" rx="25" ry="16" fill="rgba(255,255,255,0.11)"/>
<ellipse cx="148" cy="152" rx="25" ry="16" fill="rgba(255,255,255,0.11)"/>
<ellipse cx="110" cy="159" rx="9" ry="6" fill="rgba(255,255,255,0.18)"/>
<ellipse cx="110" cy="93" rx="13" ry="9" fill="rgba(255,255,255,0.20)"/>`;
  }
  return `<rect x="0" y="0" width="220" height="280" fill="rgba(248,245,238,0.10)"/>
<ellipse cx="110" cy="90" rx="22" ry="15" fill="rgba(255,255,255,0.06)"/>`;
}

function updateFacePreviews() {
  try {
    const fitzEl  = document.querySelector('.fitz-swatch.active');
    const fitzNum = fitzEl ? ({ I:1,II:2,III:3,IV:4,V:5,VI:6 }[fitzEl.dataset.type] || 2) : 2;
    const sk      = parseRgb(lerpColor(+toneSlider.value, TONE_STOPS));
    const profile = getProfile();
    const bare = document.getElementById('faceBareWrap');
    const spf  = document.getElementById('faceSpfWrap');
    if (bare) bare.innerHTML = buildFaceSVG(sk, fitzNum, '', 'bare');
    if (spf)  spf.innerHTML  = buildFaceSVG(sk, fitzNum, buildSpfOverlay(profile), 'spf');
  } catch (e) { /* face preview errors must not block cursor */ }
}

toneSlider.addEventListener('input', updateFacePreviews);
document.querySelectorAll('.fitz-swatch').forEach(s => s.addEventListener('click', updateFacePreviews));
document.getElementById('optTinted').addEventListener('change', updateFacePreviews);
document.getElementById('optMineral').addEventListener('change', updateFacePreviews);
tintSlider.addEventListener('input', updateFacePreviews);
document.querySelector('[data-group="undertone"]').querySelectorAll('.chip')
  .forEach(c => c.addEventListener('click', () => setTimeout(updateFacePreviews, 60)));
updateFacePreviews();

// ═══════════════════════════════════════════════════════════════
//  CUSTOM SUN CURSOR
// ═══════════════════════════════════════════════════════════════

const cursorDot  = document.getElementById('cursorDot');
const cursorGlow = document.getElementById('cursorGlow');
// dot tracks mouse exactly; glow lerps behind
let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
let gx = tx, gy = ty;
let cursorReady = false;

document.addEventListener('mousemove', e => {
  tx = e.clientX; ty = e.clientY;
  if (!cursorReady) {
    gx = tx; gy = ty;
    cursorReady = true;
    if (cursorDot)  { cursorDot.style.opacity  = '1'; }
    if (cursorGlow) { cursorGlow.style.opacity  = '1'; }
  }
  if (cursorDot) { cursorDot.style.left = tx + 'px'; cursorDot.style.top = ty + 'px'; }
}, { passive: true });

(function animateGlow() {
  gx += (tx - gx) * 0.1;
  gy += (ty - gy) * 0.1;
  if (cursorGlow) {
    cursorGlow.style.left = gx + 'px';
    cursorGlow.style.top  = gy + 'px';
  }
  requestAnimationFrame(animateGlow);
})();

document.addEventListener('mouseover', e => {
  const interactive = e.target.closest('button,a,input,label,.chip,.fitz-swatch,.option-toggle,.drop-zone');
  cursorDot  && cursorDot.classList.toggle('hovering',  !!interactive);
  cursorGlow && cursorGlow.classList.toggle('hovering', !!interactive);
});

// ═══════════════════════════════════════════════════════════════
//  FEATURE 2 — UV DANGER MAP
// ═══════════════════════════════════════════════════════════════

const UV_MAP_CITIES = [
  { name:'San Francisco', uv:8,  lat:37.7,  lon:-122.4 },
  { name:'Los Angeles',   uv:9,  lat:34.0,  lon:-118.2 },
  { name:'Miami',         uv:11, lat:25.8,  lon:-80.2  },
  { name:'New York',      uv:7,  lat:40.7,  lon:-74.0  },
  { name:'Chicago',       uv:6,  lat:41.9,  lon:-87.6  },
  { name:'Denver',        uv:8,  lat:39.7,  lon:-104.9 },
  { name:'Phoenix',       uv:11, lat:33.4,  lon:-112.1 },
  { name:'Seattle',       uv:5,  lat:47.6,  lon:-122.3 },
  { name:'Honolulu',      uv:11, lat:21.3,  lon:-157.8 },
  { name:'Toronto',       uv:6,  lat:43.7,  lon:-79.4  },
  { name:'Mexico City',   uv:10, lat:19.4,  lon:-99.1  },
  { name:'London',        uv:4,  lat:51.5,  lon:-0.1   },
  { name:'Paris',         uv:5,  lat:48.9,  lon:2.3    },
  { name:'Amsterdam',     uv:4,  lat:52.4,  lon:4.9    },
  { name:'Berlin',        uv:4,  lat:52.5,  lon:13.4   },
  { name:'Stockholm',     uv:3,  lat:59.3,  lon:18.1   },
  { name:'Moscow',        uv:4,  lat:55.8,  lon:37.6   },
  { name:'Barcelona',     uv:8,  lat:41.4,  lon:2.2    },
  { name:'Rome',          uv:8,  lat:41.9,  lon:12.5   },
  { name:'Athens',        uv:9,  lat:38.0,  lon:23.7   },
  { name:'Istanbul',      uv:8,  lat:41.0,  lon:29.0   },
  { name:'Cairo',         uv:10, lat:30.1,  lon:31.2   },
  { name:'Nairobi',       uv:12, lat:-1.3,  lon:36.8   },
  { name:'Lagos',         uv:11, lat:6.5,   lon:3.4    },
  { name:'Cape Town',     uv:9,  lat:-33.9, lon:18.4   },
  { name:'Dubai',         uv:12, lat:25.2,  lon:55.3   },
  { name:'Riyadh',        uv:12, lat:24.7,  lon:46.7   },
  { name:'Mumbai',        uv:11, lat:19.1,  lon:72.9   },
  { name:'Delhi',         uv:9,  lat:28.6,  lon:77.2   },
  { name:'Karachi',       uv:10, lat:24.9,  lon:67.0   },
  { name:'Bangkok',       uv:11, lat:13.8,  lon:100.5  },
  { name:'Singapore',     uv:11, lat:1.3,   lon:103.8  },
  { name:'Beijing',       uv:7,  lat:39.9,  lon:116.4  },
  { name:'Shanghai',      uv:8,  lat:31.2,  lon:121.5  },
  { name:'Seoul',         uv:7,  lat:37.6,  lon:126.9  },
  { name:'Tokyo',         uv:8,  lat:35.7,  lon:139.7  },
  { name:'Sydney',        uv:11, lat:-33.9, lon:151.2  },
  { name:'Melbourne',     uv:9,  lat:-37.8, lon:145.0  },
  { name:'Auckland',      uv:10, lat:-36.8, lon:174.8  },
  { name:'São Paulo',     uv:10, lat:-23.5, lon:-46.6  },
  { name:'Rio de Janeiro',uv:11, lat:-22.9, lon:-43.2  },
  { name:'Buenos Aires',  uv:8,  lat:-34.6, lon:-58.4  },
];

const LAND_POLYS = [
  // North America
  [[-168,71],[-55,47],[-67,44],[-82,41],[-82,24],[-90,15],[-85,9],[-78,8],[-90,11],[-104,19],[-117,32],[-124,37],[-125,49],[-135,60],[-168,60]],
  // Greenland
  [[-44,83],[-17,71],[-42,59],[-55,59],[-73,77]],
  // South America
  [[-82,11],[-62,10],[-50,0],[-36,-5],[-40,-22],[-50,-28],[-65,-55],[-75,-52],[-80,-35]],
  // Europe
  [[-10,36],[28,36],[42,38],[30,72],[10,72],[-10,72]],
  // Africa
  [[-17,15],[-5,35],[12,37],[37,37],[52,12],[42,0],[18,-35],[8,-35],[-18,17]],
  // Asia
  [[26,72],[55,72],[95,72],[145,43],[145,10],[105,-10],[75,10],[60,25],[37,12],[26,38]],
  // Indian peninsula
  [[60,25],[75,8],[80,12],[92,22],[88,27],[77,35],[68,23]],
  // SE Asia peninsula
  [[98,20],[104,10],[100,2],[108,0],[110,5],[105,15]],
  // Australia
  [[115,-22],[138,-12],[148,-20],[154,-26],[148,-38],[136,-35],[127,-34]],
  // Japan
  [[130,31],[141,40],[145,44],[141,45],[132,33]],
  // UK
  [[-8,52],[-5,58],[-1,58],[2,53],[-1,51],[-5,50]],
];

function uvHex(uv) {
  if (uv <= 2) return '#40d060';
  if (uv <= 5) return '#c8c030';
  if (uv <= 7) return '#f0a020';
  if (uv <= 10) return '#e04020';
  return '#9060c0';
}
function uvRgba(uv, a) {
  const h = uvHex(uv), r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function toXY(lon, lat, W, H) {
  return { x: (lon + 180) / 360 * W, y: (90 - lat) / 180 * H };
}

const uvCanvasEl  = document.getElementById('uvCanvas');
const uvTipEl     = document.getElementById('uvTooltip');
let uvTime = 0, uvHovered = null;

function drawUVMap() {
  if (!uvCanvasEl) return;
  const ctx = uvCanvasEl.getContext('2d');
  const W = uvCanvasEl.width, H = uvCanvasEl.height;
  ctx.clearRect(0, 0, W, H);

  // Ocean
  ctx.fillStyle = '#0c1a12'; ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(197,185,154,0.05)'; ctx.lineWidth = 0.5;
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = (lon + 180) / 360 * W;
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
  }
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = (90-lat)/180*H;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
  }

  // Tropics
  ctx.lineWidth = 0.8;
  [{ lat:23.5, label:'Tropic of Cancer' },{ lat:0, label:'Equator' },{ lat:-23.5, label:'Tropic of Capricorn' }].forEach(({ lat, label }) => {
    const y = (90-lat)/180*H;
    ctx.strokeStyle = lat === 0 ? 'rgba(184,150,62,0.25)' : 'rgba(184,150,62,0.12)';
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    ctx.fillStyle = 'rgba(184,150,62,0.35)'; ctx.font = '8px Jost,sans-serif';
    ctx.fillText(label, 4, y - 3);
  });

  // Land
  ctx.fillStyle = 'rgba(28,56,36,0.92)';
  LAND_POLYS.forEach(poly => {
    ctx.beginPath();
    poly.forEach(([lon,lat],i) => {
      const {x,y} = toXY(lon,lat,W,H);
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.closePath(); ctx.fill();
  });

  // City dots
  UV_MAP_CITIES.forEach(city => {
    const {x,y} = toXY(city.lon, city.lat, W, H);
    const baseR = 3 + city.uv * 0.28;
    const pulse = (Math.sin(uvTime * 1.8 + city.lon * 0.08) + 1) / 2;
    const glowR = baseR + 3 + pulse * 5;
    const grd = ctx.createRadialGradient(x,y,baseR*0.3,x,y,glowR);
    grd.addColorStop(0, uvRgba(city.uv, 0.45));
    grd.addColorStop(1, uvRgba(city.uv, 0));
    ctx.beginPath(); ctx.arc(x,y,glowR,0,Math.PI*2); ctx.fillStyle = grd; ctx.fill();
    ctx.beginPath(); ctx.arc(x,y,baseR,0,Math.PI*2);
    ctx.fillStyle = city === uvHovered ? '#ffffff' : uvHex(city.uv);
    ctx.fill();
  });

  uvTime += 0.016;
  requestAnimationFrame(drawUVMap);
}

uvCanvasEl && uvCanvasEl.addEventListener('mousemove', e => {
  const rect = uvCanvasEl.getBoundingClientRect();
  const sx = uvCanvasEl.width / rect.width, sy = uvCanvasEl.height / rect.height;
  const mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sy;
  let best = null, bestD = 18;
  UV_MAP_CITIES.forEach(city => {
    const {x,y} = toXY(city.lon, city.lat, uvCanvasEl.width, uvCanvasEl.height);
    const d = Math.hypot(mx-x, my-y);
    if (d < bestD) { best = city; bestD = d; }
  });
  uvHovered = best;
  if (best) {
    uvTipEl.style.display = 'block';
    uvTipEl.style.left = (e.clientX - rect.left + 14) + 'px';
    uvTipEl.style.top  = (e.clientY - rect.top - 14) + 'px';
    uvTipEl.textContent = `${best.name} · UV ${best.uv}`;
  } else { uvTipEl.style.display = 'none'; }
});

uvCanvasEl && uvCanvasEl.addEventListener('click', () => {
  if (!uvHovered) return;
  document.getElementById('locationInput').value = uvHovered.name;
  const btn = document.getElementById('analyseBtn');
  btn.style.boxShadow = '0 0 0 3px var(--gold)';
  setTimeout(() => btn.style.boxShadow = '', 1800);
  document.getElementById('upload').scrollIntoView({ behavior:'smooth' });
});

uvCanvasEl && uvCanvasEl.addEventListener('mouseleave', () => {
  uvHovered = null;
  if (uvTipEl) uvTipEl.style.display = 'none';
});

drawUVMap();

// ═══════════════════════════════════════════════════════════════
//  FEATURE 3 — AGING SIMULATOR
// ═══════════════════════════════════════════════════════════════

const yearSliderEl    = document.getElementById('yearSlider');
const yearDisplayEl   = document.getElementById('yearDisplay');
const agingNoSpfEl    = document.getElementById('agingNoSpfInner');
const agingWithSpfEl  = document.getElementById('agingWithSpfInner');

function buildWrinkles(years, heavy) {
  if (years === 0) return '';
  const t = years / 30;
  const s = heavy ? 1 : 0.15;
  const op = b => (b * t * s).toFixed(3);
  const lw = b => Math.max(0.3, b * t * s).toFixed(2);
  return `
<path d="M72,88Q110,83 148,88" stroke="rgba(0,0,0,${op(0.28)})" stroke-width="${lw(2.5)}" fill="none" stroke-linecap="round"/>
<path d="M78,97Q110,93 142,97" stroke="rgba(0,0,0,${op(0.2)})" stroke-width="${lw(2)}" fill="none" stroke-linecap="round"/>
<path d="M84,105Q110,102 136,105" stroke="rgba(0,0,0,${op(0.13)})" stroke-width="${lw(1.5)}" fill="none" stroke-linecap="round"/>
<path d="M59,133Q66,140 62,149" stroke="rgba(0,0,0,${op(0.22)})" stroke-width="${lw(1.5)}" fill="none" stroke-linecap="round"/>
<path d="M61,131Q70,137 68,146" stroke="rgba(0,0,0,${op(0.15)})" stroke-width="${lw(1.2)}" fill="none" stroke-linecap="round"/>
<path d="M161,133Q154,140 158,149" stroke="rgba(0,0,0,${op(0.22)})" stroke-width="${lw(1.5)}" fill="none" stroke-linecap="round"/>
<path d="M159,131Q150,137 152,146" stroke="rgba(0,0,0,${op(0.15)})" stroke-width="${lw(1.2)}" fill="none" stroke-linecap="round"/>
<path d="M85,174Q81,185 83,196" stroke="rgba(0,0,0,${op(0.2)})" stroke-width="${lw(2)}" fill="none" stroke-linecap="round"/>
<path d="M135,174Q139,185 137,196" stroke="rgba(0,0,0,${op(0.2)})" stroke-width="${lw(2)}" fill="none" stroke-linecap="round"/>
${heavy && t > 0.45 ? `
<ellipse cx="76" cy="152" rx="4.5" ry="3" fill="rgba(100,55,18,${(t*0.28).toFixed(3)})"/>
<ellipse cx="144" cy="149" rx="3.5" ry="2.5" fill="rgba(100,55,18,${(t*0.22).toFixed(3)})"/>
<ellipse cx="103" cy="86" rx="3.5" ry="2.5" fill="rgba(100,55,18,${(t*0.22).toFixed(3)})"/>
<ellipse cx="128" cy="90" rx="4" ry="2.5" fill="rgba(100,55,18,${(t*0.25).toFixed(3)})"/>
<ellipse cx="116" cy="158" rx="3" ry="2" fill="rgba(100,55,18,${(t*0.18).toFixed(3)})"/>` : ''}`;
}

function agingFilter(years, heavy) {
  const t = years / 30, s = heavy ? 1 : 0.1;
  return `contrast(${(1+t*s*0.18).toFixed(3)}) saturate(${(1-t*s*0.35).toFixed(3)}) sepia(${(t*s*0.48).toFixed(3)}) brightness(${(1-t*s*0.1).toFixed(3)})`;
}

function updateAgingFaces() {
  const years = +(yearSliderEl?.value || 0);
  if (yearDisplayEl) yearDisplayEl.textContent = years;

  const fitzEl  = document.querySelector('.fitz-swatch.active');
  const fitzNum = fitzEl ? ({ I:1,II:2,III:3,IV:4,V:5,VI:6 }[fitzEl.dataset.type] || 2) : 2;
  const sk      = parseRgb(lerpColor(+toneSlider.value, TONE_STOPS));

  if (agingNoSpfEl) {
    agingNoSpfEl.innerHTML = buildFaceSVG(sk, fitzNum, buildWrinkles(years, true), 'age_no');
    agingNoSpfEl.style.filter = agingFilter(years, true);
  }
  if (agingWithSpfEl) {
    const spfGlow = `<rect x="0" y="0" width="220" height="280" fill="rgba(242,239,232,0.10)"/>` + buildWrinkles(years, false);
    agingWithSpfEl.innerHTML = buildFaceSVG(sk, fitzNum, spfGlow, 'age_spf');
    agingWithSpfEl.style.filter = agingFilter(years, false);
  }
}

yearSliderEl && yearSliderEl.addEventListener('input', updateAgingFaces);
toneSlider.addEventListener('input', updateAgingFaces);
document.querySelectorAll('.fitz-swatch').forEach(s => s.addEventListener('click', updateAgingFaces));
updateAgingFaces();

// ═══════════════════════════════════════════════════════════════
//  FEATURE 4 — FORMULA DNA HELIX
// ═══════════════════════════════════════════════════════════════

let helixIngredients = [];
let helixAngle = 0;
const helixCanvasEl = document.getElementById('helixCanvas');

function updateHelix(ingredients) {
  helixIngredients = ingredients || [];
  const sec = document.getElementById('dnaSection');
  if (sec) sec.style.display = helixIngredients.length ? 'block' : 'none';
}

function drawDNA() {
  if (!helixCanvasEl) { requestAnimationFrame(drawDNA); return; }
  const ctx = helixCanvasEl.getContext('2d');
  const W = helixCanvasEl.width, H = helixCanvasEl.height;
  const N = helixIngredients.length;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f8f5f0'; ctx.fillRect(0, 0, W, H);

  if (!N) { requestAnimationFrame(drawDNA); return; }

  const cx = W / 2, amp = W * 0.27;
  const topY = 38, botY = H - 38;
  const spacing = (botY - topY) / (N + 1);

  // Backbone helper
  const backbone = (sign, color) => {
    ctx.beginPath();
    for (let i = 0; i <= N + 1; i++) {
      const y = topY + i * spacing;
      const phase = ((i - 1) / Math.max(N,1)) * Math.PI * 3.5;
      const x = cx + sign * Math.sin(helixAngle + phase) * amp;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
  };
  backbone(1, 'rgba(26,74,46,0.55)');
  backbone(-1, 'rgba(184,150,62,0.55)');

  // Rungs
  const rungs = helixIngredients.map((ing, i) => {
    const y = topY + (i + 1) * spacing;
    const phase = (i / Math.max(N,1)) * Math.PI * 3.5;
    const angle = helixAngle + phase;
    return { x1: cx + Math.sin(angle)*amp, x2: cx - Math.sin(angle)*amp, y, depth: Math.cos(angle), ing };
  });

  [...rungs].sort((a,b) => a.depth - b.depth).forEach(({ x1, x2, y, depth, ing }) => {
    const a = 0.22 + 0.78 * ((depth + 1) / 2);
    const front = depth > 0;

    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y);
    ctx.strokeStyle = `rgba(184,150,62,${a.toFixed(2)})`; ctx.lineWidth = front ? 2.5 : 1.5; ctx.stroke();

    [[x1,'26,74,46'],[x2,'184,150,62']].forEach(([x, rgb]) => {
      ctx.beginPath(); ctx.arc(x, y, front ? 5.5 : 3.5, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${rgb},${a.toFixed(2)})`; ctx.fill();
    });

    if (front && a > 0.55) {
      ctx.font = `500 ${Math.round(10 + a * 2)}px Jost,sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = `rgba(12,26,18,${Math.min(1,a*1.4).toFixed(2)})`;
      ctx.fillText(ing.name, (x1+x2)/2, y - 8);
    }
  });

  helixAngle += 0.007;
  requestAnimationFrame(drawDNA);
}

drawDNA();

// ─────────────────────────────────────────────────────────────────
//  FEATURE 5 · LIVE UV WIDGET
// ─────────────────────────────────────────────────────────────────

const UV_LABELS = ['Low','Moderate','High','Very High','Extreme'];
function uvIndexLabel(uv) {
  if (uv <= 2) return UV_LABELS[0];
  if (uv <= 5) return UV_LABELS[1];
  if (uv <= 7) return UV_LABELS[2];
  if (uv <= 10) return UV_LABELS[3];
  return UV_LABELS[4];
}
function uvIndexColor(uv) {
  if (uv <= 2) return '#4caf50';
  if (uv <= 5) return '#ffeb3b';
  if (uv <= 7) return '#ff9800';
  if (uv <= 10) return '#f44336';
  return '#9c27b0';
}

async function fetchUVForCoords(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  return data.current ? Math.round(data.current.uv_index) : null;
}

function updateUVWidget(uv, cityName, spf) {
  const uvCity = document.getElementById('uvLiveCity');
  const uvBig = document.getElementById('uvLiveIndexBig');
  const uvLabel = document.getElementById('uvLiveLabel');
  const uvFill = document.getElementById('uvLiveFill');
  const uvStatus = document.getElementById('uvLiveStatus');
  if (!uvBig) return;

  const capped = Math.min(uv, 12);
  const pct = (capped / 12) * 100;
  const color = uvIndexColor(uv);

  if (uvCity) uvCity.textContent = cityName || 'Your location';
  uvBig.textContent = uv;
  uvBig.style.color = color;
  if (uvLabel) uvLabel.textContent = uvIndexLabel(uv);
  if (uvFill) { uvFill.style.width = pct + '%'; uvFill.style.background = color; }

  if (uvStatus) {
    if (!spf) {
      uvStatus.textContent = 'Build formula to check protection';
    } else {
      const spfNum = parseInt(spf, 10);
      if (uv <= 2) uvStatus.textContent = `SPF ${spfNum} is more than enough today`;
      else if (uv <= 5) uvStatus.textContent = `SPF ${spfNum} provides solid coverage`;
      else if (uv <= 7) uvStatus.textContent = `SPF ${spfNum} — reapply every 2 hrs`;
      else if (uv <= 10) uvStatus.textContent = `SPF ${spfNum} essential — stay covered`;
      else uvStatus.textContent = `Extreme UV — max protection, limit exposure`;
    }
  }
}

let uvWidgetSpf = null;
async function loadUVForCity(cityName) {
  const city = UV_MAP_CITIES.find(c => c.name === cityName);
  if (!city) return;
  updateUVWidget(city.uv, city.name, uvWidgetSpf);
}

async function initUVWidget() {
  const refreshBtn = document.getElementById('uvLiveRefreshBtn');
  if (!refreshBtn) return;

  const tryGeo = () => {
    if (!navigator.geolocation) { loadUVForCity('New York'); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        const uv = await fetchUVForCoords(lat, lon);
        if (uv === null) { loadUVForCity('New York'); return; }
        // find nearest named city
        let nearest = UV_MAP_CITIES[0], minD = 9999;
        UV_MAP_CITIES.forEach(c => {
          const d = Math.hypot(c.lat - lat, c.lon - lon);
          if (d < minD) { minD = d; nearest = c; }
        });
        updateUVWidget(uv, nearest.name, uvWidgetSpf);
      } catch { loadUVForCity('New York'); }
    }, () => loadUVForCity('New York'));
  };

  refreshBtn.addEventListener('click', tryGeo);

  // Also update when location input changes
  const locInput = document.getElementById('locationInput');
  if (locInput) {
    locInput.addEventListener('change', () => {
      const val = locInput.value.trim();
      if (!val) return;
      const match = UV_MAP_CITIES.find(c => c.name.toLowerCase() === val.toLowerCase());
      if (match) updateUVWidget(match.uv, match.name, uvWidgetSpf);
    });
  }

  tryGeo();
}

initUVWidget();

// ─────────────────────────────────────────────────────────────────
//  FEATURE 6 · BOX UNBOXING ANIMATION
// ─────────────────────────────────────────────────────────────────

function spawnConfetti() {
  const wrap = document.getElementById('confettiWrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  const colors = ['#b8963e','#f8f5f0','#1a4a2e','#e8d5a3','#4a9a6a'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + '%';
    el.style.top = '-20px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDelay = Math.random() * 1.2 + 's';
    el.style.animationDuration = 1.8 + Math.random() * 1.2 + 's';
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    wrap.appendChild(el);
  }
}

function runUnboxAnimation(spf, formulaId) {
  const overlay = document.getElementById('unboxOverlay');
  const lid = document.getElementById('unboxLid');
  const tube = document.getElementById('unboxTube');
  const msg = document.getElementById('unboxMsg');
  const fid = document.getElementById('unboxFid');
  const msgSpf = document.getElementById('unboxMsgSpf');
  if (!overlay) return;

  // Reset state
  if (lid) lid.classList.remove('open');
  if (tube) tube.classList.remove('risen');
  if (msg) msg.classList.remove('visible');
  if (fid) fid.textContent = formulaId || 'CS-' + Math.floor(Math.random()*9000+1000);
  if (msgSpf) msgSpf.textContent = spf || '50';

  overlay.classList.add('visible');

  // Sequence: lid opens → tube rises → confetti → message
  setTimeout(() => { if (lid) lid.classList.add('open'); }, 300);
  setTimeout(() => { if (tube) tube.classList.add('risen'); }, 800);
  setTimeout(spawnConfetti, 1200);
  setTimeout(() => { if (msg) msg.classList.add('visible'); }, 1300);
}

// Pricing card 3D tilt
document.querySelectorAll('.plan-tilt').forEach(card => {
  const shine = card.querySelector('.plan-shine');
  const MAX = 10; // max tilt degrees

  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5; // -0.5 → 0.5
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transition = 'box-shadow .1s';
    card.style.transform = `perspective(800px) rotateY(${x * MAX}deg) rotateX(${-y * MAX}deg) scale3d(1.02,1.02,1.02)`;
    card.style.boxShadow = `${-x * 18}px ${-y * 18}px 40px rgba(12,26,18,.13)`;
    if (shine) shine.style.backgroundImage = `radial-gradient(circle at ${(x+.5)*100}% ${(y+.5)*100}%, rgba(255,255,255,.09) 0%, transparent 65%)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform .6s cubic-bezier(.03,.98,.52,.99), box-shadow .6s ease';
    card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
    card.style.boxShadow = '';
  });
});

// Subscribe buttons
document.querySelectorAll('.plan-subscribe').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const spf = btn.dataset.spf || '50';
    const fid = 'CS-' + Math.floor(Math.random()*9000+1000);
    runUnboxAnimation(spf, fid);
  });
});

// Also trigger from any "Subscribe" CTA in hero/result sections
document.querySelectorAll('[data-unbox]').forEach(el => {
  el.addEventListener('click', () => runUnboxAnimation('50', 'CS-' + Math.floor(Math.random()*9000+1000)));
});

const unboxClose = document.getElementById('unboxClose');
if (unboxClose) {
  unboxClose.addEventListener('click', () => {
    const overlay = document.getElementById('unboxOverlay');
    if (overlay) overlay.classList.remove('visible');
  });
}

// ─────────────────────────────────────────────────────────────────
//  FEATURE 7 · SHADE-MATCH CAMERA
// ─────────────────────────────────────────────────────────────────

// Tone stop colors matching the slider gradient (from lightest to darkest)
const CAMERA_TONE_STOPS = [
  { v: 1,  r: 255, g: 220, b: 185, name: 'Porcelain' },
  { v: 2,  r: 245, g: 205, b: 165, name: 'Ivory' },
  { v: 3,  r: 225, g: 185, b: 140, name: 'Sand' },
  { v: 4,  r: 200, g: 160, b: 115, name: 'Beige' },
  { v: 5,  r: 175, g: 135, b: 90,  name: 'Honey' },
  { v: 6,  r: 145, g: 105, b: 65,  name: 'Caramel' },
  { v: 7,  r: 115, g: 78,  b: 48,  name: 'Toffee' },
  { v: 8,  r: 85,  g: 55,  b: 35,  name: 'Mahogany' },
  { v: 9,  r: 60,  g: 38,  b: 24,  name: 'Espresso' },
  { v: 10, r: 40,  g: 24,  b: 14,  name: 'Ebony' },
];

function matchCameraColor(r, g, b) {
  let best = CAMERA_TONE_STOPS[0], bestDist = Infinity;
  CAMERA_TONE_STOPS.forEach(stop => {
    const d = Math.hypot(r - stop.r, g - stop.g, b - stop.b);
    if (d < bestDist) { bestDist = d; best = stop; }
  });
  return best;
}

function sampleCameraFrame(video, canvas) {
  const ctx = canvas.getContext('2d');
  const size = 320;
  ctx.drawImage(video, 0, 0, size, size);
  // Sample a 40×40 centre patch
  const cx = size / 2, cy = size / 2, patch = 20;
  const data = ctx.getImageData(cx - patch, cy - patch, patch * 2, patch * 2).data;
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i]; gSum += data[i+1]; bSum += data[i+2]; count++;
  }
  return { r: Math.round(rSum/count), g: Math.round(gSum/count), b: Math.round(bSum/count) };
}

let cameraStream = null;

function openCameraModal() {
  const overlay = document.getElementById('cameraOverlay');
  if (overlay) overlay.classList.add('visible');
}

function closeCameraModal() {
  const overlay = document.getElementById('cameraOverlay');
  if (overlay) overlay.classList.remove('visible');
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
  const startBtn = document.getElementById('cameraStartBtn');
  const captureBtn = document.getElementById('cameraCaptureBtn');
  const result = document.getElementById('cameraResult');
  const errEl = document.getElementById('cameraError');
  if (startBtn) { startBtn.style.display = ''; }
  if (captureBtn) { captureBtn.style.display = 'none'; }
  if (result) result.classList.remove('visible');
  if (errEl) errEl.textContent = '';
}

const shadeMatchBtn = document.getElementById('shadeMatchBtn');
if (shadeMatchBtn) shadeMatchBtn.addEventListener('click', openCameraModal);

const cameraCloseBtn = document.getElementById('cameraClose');
if (cameraCloseBtn) cameraCloseBtn.addEventListener('click', closeCameraModal);

const cameraStartBtn = document.getElementById('cameraStartBtn');
if (cameraStartBtn) {
  cameraStartBtn.addEventListener('click', async () => {
    const errEl = document.getElementById('cameraError');
    const video = document.getElementById('cameraVideo');
    const captureBtn = document.getElementById('cameraCaptureBtn');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (errEl) errEl.textContent = 'Camera not supported in this browser.';
      return;
    }
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 320 } });
      video.srcObject = cameraStream;
      cameraStartBtn.style.display = 'none';
      if (captureBtn) captureBtn.style.display = '';
      if (errEl) errEl.textContent = '';
    } catch (e) {
      if (errEl) errEl.textContent = 'Could not access camera. Please allow camera permission.';
    }
  });
}

const cameraCaptureBtn = document.getElementById('cameraCaptureBtn');
if (cameraCaptureBtn) {
  cameraCaptureBtn.addEventListener('click', () => {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const swatch = document.getElementById('cameraMatchSwatch');
    const label = document.getElementById('cameraMatchLabel');
    const result = document.getElementById('cameraResult');
    const toneSlider = document.getElementById('toneSlider');

    if (!video || !canvas) return;
    const { r, g, b } = sampleCameraFrame(video, canvas);
    const match = matchCameraColor(r, g, b);

    if (swatch) swatch.style.background = `rgb(${match.r},${match.g},${match.b})`;
    if (label) label.textContent = `${match.name} — shade ${match.v}`;
    if (result) result.classList.add('visible');

    // Apply matched tone to slider
    if (toneSlider) {
      toneSlider.value = match.v;
      toneSlider.dispatchEvent(new Event('input'));
    }

    // Close camera after 1.5s
    setTimeout(closeCameraModal, 1500);
  });
}

// ─────────────────────────────────────────────────────────────────
//  FEATURE 8 · SEASONAL FLIP CARDS
// ─────────────────────────────────────────────────────────────────

const SEASON_META = {
  spring: { icon: '🌸', name: 'Spring', defaultUv: 5, defaultSpf: '30', defaultIngr: 'Zinc Oxide, Vitamin C, Hyaluronic Acid', defaultNote: 'Light texture, antioxidant-rich' },
  summer: { icon: '☀️', name: 'Summer', defaultUv: 9, defaultSpf: '50', defaultIngr: 'Titanium Dioxide, Niacinamide, Aloe Vera', defaultNote: 'Water-resistant, cooling formula' },
  autumn: { icon: '🍂', name: 'Autumn', defaultUv: 4, defaultSpf: '30', defaultIngr: 'Zinc Oxide, Vitamin E, Rosehip Oil', defaultNote: 'Nourishing, barrier-repair focus' },
  winter: { icon: '❄️', name: 'Winter', defaultUv: 2, defaultSpf: '30', defaultIngr: 'Titanium Dioxide, Ceramides, Squalane', defaultNote: 'Rich, deeply moisturising blend' },
};

function updateFlipCards(seasonals) {
  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  seasons.forEach(s => {
    const meta = SEASON_META[s];
    const data = (seasonals && seasonals[s]) || {};
    const uv = data.uv !== undefined ? data.uv : meta.defaultUv;
    const spf = data.spf || meta.defaultSpf;
    const ingr = data.ingredients || meta.defaultIngr;
    const note = data.note || meta.defaultNote;

    const uvEl = document.getElementById('flipUv' + s.charAt(0).toUpperCase() + s.slice(1));
    const spfEl = document.getElementById('flipSpf' + s.charAt(0).toUpperCase() + s.slice(1));
    const ingrEl = document.getElementById('flipIngr' + s.charAt(0).toUpperCase() + s.slice(1));
    const noteEl = document.getElementById('flipNote' + s.charAt(0).toUpperCase() + s.slice(1));

    if (uvEl)   uvEl.textContent   = uv;
    if (spfEl)  spfEl.textContent  = 'SPF ' + spf;
    if (ingrEl) ingrEl.textContent = ingr;
    if (noteEl) noteEl.textContent = note;
  });
}

// Click-to-flip
document.querySelectorAll('.flip-card').forEach(card => {
  card.addEventListener('click', () => card.classList.toggle('flipped'));
});

// Auto-flip current season card on load (brief delay for visual delight)
setTimeout(() => {
  const season = getCurrentSeason();
  const card = document.querySelector(`.flip-card[data-season="${season}"]`);
  if (card) {
    card.classList.add('flipped');
    setTimeout(() => card.classList.remove('flipped'), 1800);
  }
}, 1000);

// Initialize flip card defaults
updateFlipCards(null);

// ─────────────────────────────────────────────────────────────────
//  SCROLL REVEAL
// ─────────────────────────────────────────────────────────────────

(function initReveal() {
  // Individual elements — labels and headings
  document.querySelectorAll([
    '.section-label',
    'section h2',
    'section > p',
    '.hero-badge',
    '.hero-sub',
    '.flip-intro',
    '.pricing-offer',
  ].join(',')).forEach(el => el.classList.add('reveal'));

  // Grid children — stagger siblings
  [
    '.steps-grid',
    '.reviews-grid',
    '.flip-cards-grid',
    '.pricing-grid',
    '.science-grid',
  ].forEach(sel => {
    const grid = document.querySelector(sel);
    if (!grid) return;
    [...grid.children].forEach((child, i) => {
      child.classList.add('reveal');
      child.style.transitionDelay = `${i * 0.11}s`;
    });
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

// ═══════════════════════════════════════════════════════════════
//  FEATURE 9 · LIVE SKIN SCANNER WITH UV HEATMAP OVERLAY
// ═══════════════════════════════════════════════════════════════

let lsStream   = null;
let lsRaf      = null;
let lsSamples  = [];       // rolling 90-frame window of {type,num,val,r,g,b}
let lsUvIdx    = 7;
let lsLastRead = null;
let lsViewMode = 'scan';   // 'scan' | 'uv' | 'tint'
let lsTintTone = 'neutral';
let lsCovLevel = 2;        // 1=sheer 2=light 3=medium 4=buildable

const LS_TINT_COLORS = {
  warm:    { r: 226, g: 162, b: 112 },
  neutral: { r: 208, g: 150, b: 110 },
  cool:    { r: 194, g: 146, b: 140 },
};
const LS_COV_ALPHA = { 1: 0.13, 2: 0.24, 3: 0.35, 4: 0.46 };
const LS_COV_NAMES = { 1: 'Sheer', 2: 'Light', 3: 'Medium', 4: 'Buildable' };

// Face UV-exposure risk zones — cx/cy/rx/ry as fractions of canvas W/H
const LS_ZONES = [
  { cx: .50, cy: .19, rx: .27, ry: .09, risk: .88 }, // forehead
  { cx: .50, cy: .47, rx: .09, ry: .15, risk: 1.0  }, // nose
  { cx: .30, cy: .53, rx: .16, ry: .13, risk: .72  }, // left cheek (mirrored → real right)
  { cx: .70, cy: .53, rx: .16, ry: .13, risk: .72  }, // right cheek
  { cx: .50, cy: .80, rx: .14, ry: .08, risk: .60  }, // chin
];

// Relative luminance → Fitzpatrick + tone-slider value
function lsPixelToFitz(r, g, b) {
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (L > .80) return { type: 'I',   num: 1, val:   0 };
  if (L > .66) return { type: 'II',  num: 2, val:  18 };
  if (L > .50) return { type: 'III', num: 3, val:  36 };
  if (L > .36) return { type: 'IV',  num: 4, val:  56 };
  if (L > .20) return { type: 'V',   num: 5, val:  76 };
  return             { type: 'VI',  num: 6, val: 100 };
}

// Modal (most-common) fitzpatrick type across sample window
function lsMode(samples) {
  const c = {};
  samples.forEach(s => { c[s.type] = (c[s.type] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || 'II';
}

// Average RGB across sample window
function lsAvgRgb(samples) {
  const n = samples.length;
  return {
    r: Math.round(samples.reduce((s, x) => s + x.r, 0) / n),
    g: Math.round(samples.reduce((s, x) => s + x.g, 0) / n),
    b: Math.round(samples.reduce((s, x) => s + x.b, 0) / n),
  };
}

function lsUpdateReadout() {
  const n = lsSamples.length;
  if (!n) return;

  const fitzType = lsMode(lsSamples);
  const fitzNum  = { I:1, II:2, III:3, IV:4, V:5, VI:6 }[fitzType] || 2;
  const avg      = lsAvgRgb(lsSamples);
  const spf      = calcSPF(fitzNum, lsUvIdx, 3); // moderate sensitivity for live scan
  const conf     = Math.min(100, Math.round((n / 90) * 100));

  lsLastRead = {
    fitzType, fitzNum, spf,
    val: lsSamples[lsSamples.length - 1].val,
    r: avg.r, g: avg.g, b: avg.b,
  };

  const $ = id => document.getElementById(id);

  const spfEl = $('lsSpfBig');
  if (spfEl) {
    const label = `SPF ${spf}`;
    if (spfEl.textContent !== label) {
      spfEl.textContent = label;
      spfEl.style.transform = 'scale(1.08)';
      setTimeout(() => { if (spfEl) spfEl.style.transform = ''; }, 220);
    }
  }

  const subEl = $('lsSpfSub');
  if (subEl) {
    if (lsViewMode === 'uv') {
      subEl.textContent = 'Dark patches = melanin · Violet = healthy skin';
    } else if (lsViewMode === 'tint') {
      subEl.textContent = `${LS_COV_NAMES[lsCovLevel]} coverage · ${lsTintTone} tone`;
    } else {
      subEl.textContent = conf >= 90 ? '◆ Profile ready to lock'
        : conf >= 50 ? 'Hold steady for best accuracy'
        : 'Reading your skin…';
    }
  }

  const fEl = $('lsFitzVal');
  if (fEl) fEl.textContent = `Type ${fitzType}`;

  const sw = $('lsToneSwatch');
  if (sw) sw.style.background = `rgb(${avg.r},${avg.g},${avg.b})`;

  const uvEl = $('lsUvVal');
  if (uvEl) uvEl.textContent = `${lsUvIdx} — ${uvLabel(lsUvIdx)}`;

  const fill = $('lsConfFill');
  if (fill) { fill.style.width = conf + '%'; fill.classList.toggle('ready', conf >= 90); }
  const pct = $('lsConfPct');
  if (pct) pct.textContent = conf + '%';

  const btn = $('lsLockBtn');
  if (btn) btn.disabled = conf < 70;
}

function lsDrawFrame() {
  const video  = document.getElementById('lsVideo');
  const canvas = document.getElementById('lsCanvas');
  if (!video || !canvas || video.readyState < 2) {
    lsRaf = requestAnimationFrame(lsDrawFrame);
    return;
  }

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const t = Date.now();
  const pulse = (Math.sin(t * 0.0024) + 1) * 0.5;

  // Shared guide ellipse coords
  const GX = W / 2, GY = H * .466, GRX = W * .275, GRY = H * .368;

  // ── 1. Draw mirrored video with mode-specific filter ──────────────
  ctx.filter = lsViewMode === 'uv'
    ? 'grayscale(1) contrast(2.3) sepia(0.9) hue-rotate(212deg) saturate(2.6) brightness(0.76)'
    : 'none';
  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, W, H);
  ctx.restore();
  ctx.filter = 'none';

  // ── 2. Mode-specific overlays ─────────────────────────────────────
  if (lsViewMode === 'scan') {
    // Amber heatmap zones pulsing with UV intensity
    const uvFactor = Math.min(1, lsUvIdx / 12);
    LS_ZONES.forEach(z => {
      const cx = z.cx * W, cy = z.cy * H, rx = z.rx * W, ry = z.ry * H;
      const alpha = z.risk * uvFactor * (0.30 + pulse * 0.22);
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0,    `rgba(228,88,18,${Math.min(.72, alpha*1.5).toFixed(3)})`);
      g.addColorStop(0.55, `rgba(205,62,8,${(alpha*.6).toFixed(3)})`);
      g.addColorStop(1,    'rgba(185,45,0,0)');
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI*2);
      ctx.fillStyle = g; ctx.fill(); ctx.restore();
    });
    // Gold scan line
    const scanY = ((t * 0.095) % (H * 1.55)) - H * 0.28;
    if (scanY > -20 && scanY < H + 20) {
      const sg = ctx.createLinearGradient(0, scanY-14, 0, scanY+14);
      sg.addColorStop(0, 'rgba(184,150,62,0)');
      sg.addColorStop(.5, 'rgba(184,150,62,.32)');
      sg.addColorStop(1, 'rgba(184,150,62,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, scanY-14, W, 28);
    }

  } else if (lsViewMode === 'uv') {
    // Scanlines — medical-device texture
    ctx.fillStyle = 'rgba(0,0,80,0.038)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1.5);
    // Vignette
    const vig = ctx.createRadialGradient(GX, GY, H*.18, GX, GY, H*.74);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,50,0.52)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
    // Badge
    ctx.fillStyle = 'rgba(8,0,36,0.78)';
    ctx.fillRect(8, 8, 152, 30);
    ctx.fillStyle = '#c0b0ff';
    ctx.font = '600 9px Jost,sans-serif';
    ctx.fillText('⚡ UV DAMAGE ANALYSIS', 14, 27);

  } else if (lsViewMode === 'tint') {
    // Tinted SPF overlay on face zone — radial gradient ellipse
    const tc = LS_TINT_COLORS[lsTintTone];
    const al = LS_COV_ALPHA[lsCovLevel];
    ctx.save();
    ctx.translate(GX, GY); ctx.scale(1, GRY / GRX);
    const tg = ctx.createRadialGradient(0, 0, 0, 0, 0, GRX * 1.06);
    tg.addColorStop(0,    `rgba(${tc.r},${tc.g},${tc.b},${(al*1.12).toFixed(3)})`);
    tg.addColorStop(0.62, `rgba(${tc.r},${tc.g},${tc.b},${(al*.88).toFixed(3)})`);
    tg.addColorStop(0.88, `rgba(${tc.r},${tc.g},${tc.b},${(al*.22).toFixed(3)})`);
    tg.addColorStop(1,    `rgba(${tc.r},${tc.g},${tc.b},0)`);
    ctx.beginPath(); ctx.arc(0, 0, GRX*1.06, 0, Math.PI*2);
    ctx.fillStyle = tg; ctx.fill(); ctx.restore();
    // Subtle highlight shimmer along top of ellipse (finish effect)
    ctx.save();
    ctx.translate(GX, GY - GRY * 0.28); ctx.scale(GRX * 0.55, GRY * 0.18);
    const shine = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    shine.addColorStop(0, `rgba(255,255,255,${(al*.32).toFixed(3)})`);
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI*2);
    ctx.fillStyle = shine; ctx.fill(); ctx.restore();
    // Badge
    ctx.fillStyle = 'rgba(8,5,2,0.74)';
    ctx.fillRect(8, 8, 178, 30);
    ctx.fillStyle = `rgb(${tc.r},${tc.g},${tc.b})`;
    ctx.font = '600 9px Jost,sans-serif';
    ctx.fillText(`◈ TINT · ${lsTintTone.toUpperCase()} · ${LS_COV_NAMES[lsCovLevel].toUpperCase()}`, 14, 27);
  }

  // ── 3. Face guide ellipse (always — color shifts by mode) ─────────
  const guideCol = lsViewMode === 'uv'
    ? `rgba(160,128,255,${(.38+pulse*.3).toFixed(2)})`
    : lsViewMode === 'tint'
      ? `rgba(210,168,138,${(.38+pulse*.3).toFixed(2)})`
      : `rgba(184,150,62,${(.42+pulse*.32).toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(GX, GY, GRX, GRY, 0, 0, Math.PI*2);
  ctx.strokeStyle = guideCol; ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 6]); ctx.stroke(); ctx.setLineDash([]);
  [[GX, GY-GRY],[GX, GY+GRY],[GX-GRX, GY],[GX+GRX, GY]].forEach(([dx,dy]) => {
    ctx.beginPath(); ctx.arc(dx, dy, 2.8, 0, Math.PI*2);
    ctx.fillStyle = guideCol; ctx.fill();
  });

  // ── 4. Pixel sampling — scan mode only (UV/tint filters corrupt readings) ──
  if (lsViewMode === 'scan') {
    const SP = 14;
    const sampleAt = (fx, fy) => {
      const ox = Math.max(SP, Math.min(W-SP, Math.round(fx*W)));
      const oy = Math.max(SP, Math.min(H-SP, Math.round(fy*H)));
      try { return ctx.getImageData(ox-SP, oy-SP, SP*2, SP*2).data; } catch { return null; }
    };
    let rT=0, gT=0, bT=0, cnt=0;
    [sampleAt(.5,.22), sampleAt(.35,.53), sampleAt(.65,.53)].forEach(data => {
      if (!data) return;
      for (let i=0; i<data.length; i+=4) { rT+=data[i]; gT+=data[i+1]; bT+=data[i+2]; cnt++; }
    });
    if (cnt > 0) {
      const r=Math.round(rT/cnt), g=Math.round(gT/cnt), b=Math.round(bT/cnt);
      const fitz = lsPixelToFitz(r, g, b);
      lsSamples.push({...fitz, r, g, b});
      if (lsSamples.length > 90) lsSamples.shift();
    }
  }
  // Always refresh readout (mode-specific sub-text handled inside)
  if (lsSamples.length) lsUpdateReadout();

  lsRaf = requestAnimationFrame(lsDrawFrame);
}

async function openLiveScan() {
  const overlay = document.getElementById('lsOverlay');
  if (!overlay) return;

  lsSamples  = [];
  lsLastRead = null;
  lsViewMode = 'scan';

  // Reset mode bar UI
  document.querySelectorAll('.ls-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'scan'));
  const tp = document.getElementById('lsTintPanel');
  if (tp) tp.classList.remove('visible');

  // Seed UV from location input
  const locVal = document.getElementById('locationInput')?.value || 'San Francisco, CA';
  lsUvIdx = getUVForLocation(locVal);
  const cityEl = document.getElementById('lsUvCity');
  if (cityEl) cityEl.textContent = locVal.replace(/,.*/, '').trim();

  // Reset readout UI
  const reset = { lsSpfBig: '—', lsFitzVal: 'Reading…', lsUvVal: '—', lsConfPct: '0%' };
  Object.entries(reset).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
  const fill = document.getElementById('lsConfFill');
  if (fill) { fill.style.width = '0%'; fill.classList.remove('ready'); }
  const lock = document.getElementById('lsLockBtn');
  if (lock) lock.disabled = true;
  const sub = document.getElementById('lsSpfSub');
  if (sub) sub.textContent = 'Hold steady…';
  const err = document.getElementById('lsError');
  if (err) err.textContent = '';

  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';

  // Try real UV via geolocation (non-blocking)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const uv = await fetchUVForCoords(pos.coords.latitude, pos.coords.longitude);
        if (uv !== null) lsUvIdx = uv;
      } catch (_) {}
    });
  }

  // Start camera
  const video  = document.getElementById('lsVideo');
  const canvas = document.getElementById('lsCanvas');
  if (!navigator.mediaDevices?.getUserMedia) {
    if (err) err.textContent = 'Camera not supported in this browser.';
    return;
  }
  try {
    lsStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 800 } },
    });
    video.srcObject = lsStream;
    video.play();
    // Sync canvas resolution to actual video track
    video.addEventListener('loadedmetadata', () => {
      const vw = video.videoWidth || 400;
      const vh = video.videoHeight || 530;
      // keep portrait aspect, cap at 530 tall
      const scale = Math.min(1, 530 / vh);
      canvas.width  = Math.round(vw * scale);
      canvas.height = Math.round(vh * scale);
    }, { once: true });
    lsRaf = requestAnimationFrame(lsDrawFrame);
  } catch (_) {
    if (err) err.textContent = 'Camera access required. Please allow camera permission and try again.';
  }
}

function closeLiveScan() {
  const overlay = document.getElementById('lsOverlay');
  if (overlay) overlay.classList.remove('visible');
  document.body.style.overflow = '';
  if (lsStream) { lsStream.getTracks().forEach(t => t.stop()); lsStream = null; }
  if (lsRaf)   { cancelAnimationFrame(lsRaf); lsRaf = null; }
  lsSamples  = [];
  lsLastRead = null;
}

function lsLockProfile() {
  if (!lsLastRead) return;
  const { fitzType, val } = lsLastRead;

  // Gold flash on canvas before closing
  const canvas = document.getElementById('lsCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(184,150,62,.26)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (lsRaf) { cancelAnimationFrame(lsRaf); lsRaf = null; }

  setTimeout(() => {
    closeLiveScan();

    // Apply to tone slider — triggers fitzpatrick swatch sync
    const ts = document.getElementById('toneSlider');
    if (ts) { ts.value = val; ts.dispatchEvent(new Event('input')); }

    // Explicitly click the matching swatch for certainty
    const sw = [...document.querySelectorAll('.fitz-swatch')]
      .find(s => s.dataset.type === fitzType);
    if (sw) sw.click();

    // Scroll to upload form
    document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });

    // Flash analyse button to signal "ready to go"
    setTimeout(() => {
      const btn = document.getElementById('analyseBtn');
      if (!btn) return;
      const origText = btn.innerHTML;
      btn.innerHTML = '◆ Profile locked — Build your formula →';
      btn.style.boxShadow = '0 0 0 3px var(--gold), 0 0 28px rgba(184,150,62,.38)';
      setTimeout(() => {
        btn.innerHTML = origText;
        btn.style.boxShadow = '';
      }, 3500);
    }, 900);
  }, 480);
}

document.getElementById('lsOpenBtn')?.addEventListener('click', openLiveScan);
document.getElementById('uploadScanBtn')?.addEventListener('click', openLiveScan);
document.getElementById('lsCancel')?.addEventListener('click', closeLiveScan);
document.getElementById('lsLockBtn')?.addEventListener('click', lsLockProfile);
document.getElementById('lsOverlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('lsOverlay')) closeLiveScan();
});

// Mode bar toggle
document.querySelectorAll('.ls-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    lsViewMode = btn.dataset.mode;
    document.querySelectorAll('.ls-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
    const tp = document.getElementById('lsTintPanel');
    if (tp) tp.classList.toggle('visible', lsViewMode === 'tint');
    // Refresh sub-text immediately
    if (lsSamples.length) lsUpdateReadout();
  });
});

// Tint tone chips
document.querySelectorAll('.ls-tint-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    lsTintTone = chip.dataset.tone;
    document.querySelectorAll('.ls-tint-chip').forEach(c => c.classList.toggle('active', c === chip));
    if (lsSamples.length) lsUpdateReadout();
  });
});

// Coverage slider
const lsCovSlider = document.getElementById('lsCovSlider');
const lsCovValEl  = document.getElementById('lsCovVal');
if (lsCovSlider) {
  lsCovSlider.addEventListener('input', () => {
    lsCovLevel = +lsCovSlider.value;
    if (lsCovValEl) lsCovValEl.textContent = LS_COV_NAMES[lsCovLevel];
    if (lsSamples.length) lsUpdateReadout();
  });
}

/* ─── FAQ accordion ─────────────────────────────────────────────── */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(el => {
      el.classList.remove('open');
      el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ─── Waitlist form ─────────────────────────────────────────────── */
const waitlistForm = document.getElementById('waitlistForm');
const waitlistSuccess = document.getElementById('waitlistSuccess');
if (waitlistForm && waitlistSuccess) {
  waitlistForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('waitlistEmail').value.trim();
    if (!email || !email.includes('@')) return;
    waitlistForm.style.display = 'none';
    waitlistSuccess.classList.add('visible');
  });
}

// ═══════════════════════════════════════════════════════════════
//  FEATURE 10 · REAL-TIME SUN POSITION CLOCK
// ═══════════════════════════════════════════════════════════════

let scLat = 37.77, scLng = -122.42;
let scTimes = null;
let scRunning = false, scRaf = null, scLastTick = 0;

// ── Solar position (NOAA simplified, ±1° accuracy) ──────────────
function scSunPos(date, lat, lng) {
  const D2R = Math.PI / 180;
  const JD  = date.getTime() / 864e5 + 2440587.5;
  const n   = JD - 2451545.0;
  const L   = (280.46646 + 0.9856474 * n) % 360;
  const M   = ((357.52911 + 0.9856003 * n) % 360) * D2R;
  const C   = 1.914602 * Math.sin(M) + 0.019993 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const sunL = (L + C) * D2R;
  const eps  = (23.439291 - 0.013004 * n / 36525) * D2R;
  const sinDec = Math.sin(eps) * Math.sin(sunL);
  const dec    = Math.asin(sinDec);
  const RA     = Math.atan2(Math.cos(eps) * Math.sin(sunL), Math.cos(sunL));
  const GMST   = (280.46061837 + 360.98564736629 * n) % 360;
  const LST    = ((GMST + lng) % 360 + 360) % 360;
  const HA     = (LST * D2R - RA);
  const latR   = lat * D2R;
  const sinAlt = Math.sin(latR) * sinDec + Math.cos(latR) * Math.cos(dec) * Math.cos(HA);
  const alt    = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const sinAz  = -Math.cos(dec) * Math.sin(HA) / Math.cos(alt);
  const cosAz  = (sinDec - Math.sin(alt) * Math.sin(latR)) / (Math.cos(alt) * Math.cos(latR));
  const az     = ((Math.atan2(sinAz, cosAz) / D2R) + 360) % 360;
  return { altitude: alt / D2R, azimuth: az };
}

// ── Sunrise / sunset / noon (UTC hours) ─────────────────────────
function scSunTimes(date, lat, lng) {
  const D2R = Math.PI / 180;
  const d   = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
  const JD  = d.getTime() / 864e5 + 2440587.5;
  const n   = JD - 2451545.0;
  const L   = (280.46646 + 0.9856474 * n) % 360;
  const M   = ((357.52911 + 0.9856003 * n) % 360) * D2R;
  const C   = 1.914602 * Math.sin(M) + 0.019993 * Math.sin(2 * M);
  const sunL = (L + C) * D2R;
  const eps  = 23.439291 * D2R;
  const sinDec = Math.sin(eps) * Math.sin(sunL);
  const dec    = Math.asin(sinDec);
  const latR   = lat * D2R;
  const cosHA  = (Math.sin(-0.8333 * D2R) - Math.sin(latR) * sinDec) / (Math.cos(latR) * Math.cos(dec));
  if (Math.abs(cosHA) > 1) return null;
  const HA     = Math.acos(cosHA) / D2R;
  const noon   = (12 - lng / 15 + 24) % 24;
  return {
    sunrise: ((noon - HA / 15) % 24 + 24) % 24,
    noon:    noon,
    sunset:  ((noon + HA / 15) % 24 + 24) % 24,
  };
}

// ── Helpers ──────────────────────────────────────────────────────
function scFmtHM(utcH) {
  const off   = -new Date().getTimezoneOffset() / 60;
  const local = ((utcH + off) % 24 + 24) % 24;
  const h     = Math.floor(local);
  const m     = Math.floor((local - h) * 60);
  const ap    = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
}
function scFmtCD(secs) {
  if (secs <= 0) return '0:00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function scAltToUV(alt) {
  if (alt < 5)  return 0;
  if (alt < 15) return 1;
  if (alt < 25) return 2 + Math.round((alt - 15) / 5);
  if (alt < 40) return 4 + Math.round((alt - 25) / 5);
  if (alt < 55) return 7 + Math.round((alt - 40) / 8);
  if (alt < 70) return 9 + Math.round((alt - 55) / 8);
  return 11;
}
function scUvLabel(uv) {
  if (uv <= 2)  return 'Low';
  if (uv <= 5)  return 'Moderate';
  if (uv <= 7)  return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}
function scNextCrossing(lat, lng, isDanger) {
  const now = Date.now();
  const step = isDanger ? 60 : 300;
  const limit = isDanger ? 18000 : 86400;
  for (let s = step; s <= limit; s += step) {
    const fp = scSunPos(new Date(now + s * 1000), lat, lng);
    if (isDanger && fp.altitude < 30) return s;
    if (!isDanger && fp.altitude > 0) return s;
  }
  return null;
}

// ── Canvas renderer ──────────────────────────────────────────────
const SC_STARS = [
  [.18,.13],[.82,.11],[.11,.70],[.87,.74],[.44,.07],
  [.66,.20],[.28,.58],[.77,.53],[.54,.87],[.08,.38],
  [.93,.42],[.35,.22],[.62,.68],[.50,.14],[.72,.37],
];

function scDraw(lat, lng, times) {
  const canvas = document.getElementById('sunDial');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const CX = W / 2, CY = H / 2, R = W / 2 - 22;
  const t  = Date.now();

  ctx.clearRect(0, 0, W, H);

  // Background circle
  const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, R + 22);
  bg.addColorStop(0,   '#112018');
  bg.addColorStop(.65, '#0d1a12');
  bg.addColorStop(1,   '#080d09');
  ctx.beginPath(); ctx.arc(CX, CY, R + 18, 0, Math.PI * 2);
  ctx.fillStyle = bg; ctx.fill();

  // Stars (outside inner 35% only)
  SC_STARS.forEach(([fx, fy]) => {
    const sx = fx * W, sy = fy * H;
    if (Math.hypot(sx - CX, sy - CY) < R * .3) return;
    const tw = (Math.sin(t * .0009 + fx * 17 + fy * 11) + 1) * .5;
    ctx.beginPath(); ctx.arc(sx, sy, .85, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(248,245,240,${(.12 + tw * .22).toFixed(2)})`; ctx.fill();
  });

  // Altitude rings — 30° and 60°
  [30, 60].forEach(alt => {
    const r = (1 - alt / 90) * R;
    ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(184,150,62,.07)'; ctx.lineWidth = .8; ctx.stroke();
    ctx.fillStyle   = 'rgba(184,150,62,.25)';
    ctx.font = '500 7.5px Jost,sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`${alt}°`, CX + r + 4, CY);
  });

  // Outer ring
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(184,150,62,.25)'; ctx.lineWidth = 1; ctx.stroke();

  // Cardinal labels
  [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([lbl, az]) => {
    const a  = az * Math.PI / 180;
    const lx = CX + (R + 13) * Math.sin(a);
    const ly = CY - (R + 13) * Math.cos(a);
    ctx.fillStyle = lbl === 'N' ? 'rgba(184,150,62,.8)' : 'rgba(197,185,154,.4)';
    ctx.font = `${lbl === 'N' ? 700 : 500} 8.5px Jost,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, lx, ly);
  });

  // Build today's sun path (every 15 min)
  const now    = new Date();
  const allPts = [], dangerPts = [];
  for (let h = 0; h <= 24; h += .25) {
    const d  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                                 Math.floor(h), Math.round((h % 1) * 60)));
    const sp = scSunPos(d, lat, lng);
    if (sp.altitude >= -3) {
      const r  = Math.min(R, Math.max(0, (1 - sp.altitude / 90)) * R);
      const a  = sp.azimuth * Math.PI / 180;
      const pt = { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a), alt: sp.altitude };
      allPts.push(pt);
      if (sp.altitude >= 30) dangerPts.push(pt);
    }
  }

  // Full day arc (dashed amber)
  if (allPts.length > 1) {
    ctx.beginPath();
    allPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = 'rgba(184,150,62,.2)';
    ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Danger zone arc (red)
  if (dangerPts.length > 1) {
    ctx.beginPath();
    dangerPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = 'rgba(220,60,40,.65)'; ctx.lineWidth = 2.5; ctx.stroke();
  }

  // Key time markers (sunrise, noon, sunset)
  if (times) {
    [{ utc: times.sunrise, col: 'rgba(184,150,62,.75)' },
     { utc: times.noon,    col: 'rgba(220,60,40,.85)' },
     { utc: times.sunset,  col: 'rgba(184,150,62,.75)' }].forEach(({ utc, col }) => {
      const d  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                                   Math.floor(utc), Math.round((utc % 1) * 60)));
      const sp = scSunPos(d, lat, lng);
      const r  = Math.min(R, Math.max(0, (1 - sp.altitude / 90)) * R);
      const a  = sp.azimuth * Math.PI / 180;
      ctx.beginPath(); ctx.arc(CX + r * Math.sin(a), CY - r * Math.cos(a), 3, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
    });
  }

  // Current sun
  const cur = scSunPos(now, lat, lng);
  if (cur.altitude > -8) {
    const r       = Math.min(R, Math.max(0, (1 - cur.altitude / 90)) * R);
    const a       = cur.azimuth * Math.PI / 180;
    const sx      = CX + r * Math.sin(a);
    const sy      = CY - r * Math.cos(a);
    const above   = cur.altitude > 0;
    const danger  = cur.altitude >= 30;
    const sunClr  = above ? (danger ? '#e74c3c' : '#f39c12') : 'rgba(184,150,62,.28)';
    const glowClr = danger ? 'rgba(220,60,40,' : 'rgba(243,156,18,';

    // Pulse ring
    if (above) {
      const pR = 7 + (Math.sin(t * .004) + 1) * 2;
      ctx.beginPath(); ctx.arc(sx, sy, pR, 0, Math.PI * 2);
      ctx.strokeStyle = glowClr + '.4)'; ctx.lineWidth = 1.2; ctx.stroke();
    }

    // Glow
    const glowR = danger ? 18 : 12;
    const grd   = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
    grd.addColorStop(0, glowClr + '.45)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();

    // Dot
    ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fillStyle = sunClr; ctx.fill();
  }

  // Zenith dot
  ctx.beginPath(); ctx.arc(CX, CY, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(197,185,154,.22)'; ctx.fill();
}

// ── Panel text ───────────────────────────────────────────────────
function scUpdatePanel(lat, lng) {
  const now    = new Date();
  const pos    = scSunPos(now, lat, lng);
  const uv     = scAltToUV(pos.altitude);
  const danger = pos.altitude >= 30;
  const isUp   = pos.altitude > 0;
  const $      = id => document.getElementById(id);

  // Altitude overlay
  const altEl = $('sunAltNow');
  if (altEl) {
    altEl.textContent = isUp ? `${Math.round(pos.altitude)}°` : '–';
    altEl.classList.toggle('danger', danger);
  }

  // Status block
  const statusEl = $('sunStatus');
  if (statusEl) statusEl.className = `sun-status ${danger ? 'danger' : isUp ? 'safe' : ''}`;
  const badge = $('sunStatusBadge');
  if (badge) badge.textContent = danger ? 'Peak danger window' : isUp ? 'Low UV' : 'Below horizon';
  const desc = $('sunStatusDesc');
  if (desc) {
    if (!isUp)       desc.textContent = 'No UV risk — sun is below the horizon.';
    else if (danger) desc.textContent = 'SPF required. Reapply every 90 min.';
    else             desc.textContent = 'UV is low — good time to be outside.';
  }

  // Stats
  if ($('sunAlt')) $('sunAlt').textContent = isUp ? `${Math.round(pos.altitude)}°` : 'Below horizon';
  if ($('sunAz'))  $('sunAz').textContent  = `${Math.round(pos.azimuth)}°`;
  if ($('sunUV'))  $('sunUV').textContent  = isUp ? `${uv} — ${scUvLabel(uv)}` : '0 — None';

  if (scTimes) {
    if ($('sunRise')) $('sunRise').textContent = scFmtHM(scTimes.sunrise);
    if ($('sunNoon')) $('sunNoon').textContent = scFmtHM(scTimes.noon);
    if ($('sunSet'))  $('sunSet').textContent  = scFmtHM(scTimes.sunset);
  }

  // Countdown
  const cdLabel = $('sunCdLabel');
  const cdEl    = $('sunCountdown');
  if (cdEl) {
    if (danger) {
      const secs = scNextCrossing(lat, lng, true);
      if (cdLabel) cdLabel.textContent = 'UV drops in';
      cdEl.textContent = secs ? scFmtCD(Math.round(secs)) : '—';
    } else if (isUp) {
      if (cdLabel) cdLabel.textContent = 'UV status';
      cdEl.textContent = '✓ Safe now';
    } else {
      // Count down to sunrise
      let srMs = null;
      if (scTimes) {
        const todayBase = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        srMs = todayBase + scTimes.sunrise * 3600000;
        if (srMs < now.getTime()) srMs += 86400000;
      } else {
        const secs = scNextCrossing(lat, lng, false);
        srMs = secs ? now.getTime() + secs * 1000 : null;
      }
      if (cdLabel) cdLabel.textContent = 'Sunrise in';
      cdEl.textContent = srMs ? scFmtCD(Math.round((srMs - now.getTime()) / 1000)) : '—';
    }
  }
}

// ── Animation loop ───────────────────────────────────────────────
function scTick(ts) {
  if (!scRunning) return;
  scDraw(scLat, scLng, scTimes);
  if (ts - scLastTick > 1000) {
    scLastTick = ts;
    scUpdatePanel(scLat, scLng);
  }
  scRaf = requestAnimationFrame(scTick);
}

// ── Init ─────────────────────────────────────────────────────────
function initSunClock() {
  const section = document.getElementById('sunClock');
  if (!section) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !scRunning) {
        scRunning = true;
        scRaf = requestAnimationFrame(scTick);
      } else if (!e.isIntersecting && scRunning) {
        scRunning = false;
        if (scRaf) cancelAnimationFrame(scRaf);
      }
    });
  }, { threshold: 0.08 });
  obs.observe(section);

  const applyCoords = (lat, lng, label) => {
    scLat = lat; scLng = lng;
    scTimes = scSunTimes(new Date(), lat, lng);
    const locEl = document.getElementById('sunLocLabel');
    if (locEl) locEl.textContent = label;
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => applyCoords(p.coords.latitude, p.coords.longitude,
                       `${p.coords.latitude.toFixed(2)}°N, ${Math.abs(p.coords.longitude).toFixed(2)}°${p.coords.longitude < 0 ? 'W' : 'E'}`),
      () => {
        // Fallback to UV map city from location input
        const val  = (document.getElementById('locationInput') || {}).value || '';
        const key  = val.toLowerCase().replace(/,.*/, '').trim();
        const city = UV_MAP_CITIES.find(c => c.name.toLowerCase().includes(key) || key.includes(c.name.toLowerCase()));
        if (city) applyCoords(city.lat, city.lon, city.name);
        else      applyCoords(scLat, scLng, 'San Francisco, CA (default)');
      }
    );
  } else {
    applyCoords(scLat, scLng, 'San Francisco, CA (default)');
  }
}

initSunClock();
