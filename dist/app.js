/* Daily Tracker — dist/app.js (generated; npm run build) */
const APP_VERSION='2026.05.20.2';
/* Daily Tracker — journal (dual-writer) */
(function (global) {
'use strict';
/**
 * Dual-writer daily journal (.md): Tracker-head + verbatim Oura-tail.
 * @see docs/DAILY_LOG_DUAL_WRITER.md
 */

/**
 * @param {unknown} obj
 * @returns {boolean}
 */
function isWearableOnlyRoot(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  return keys.length === 1 && keys[0] === 'wearable_biometrics';
}

/**
 * @typedef {{ start: number, end: number, raw: string, parsed: unknown }} JsonFence
 */

/**
 * @param {string} content
 * @returns {JsonFence[]}
 */
function findJsonFences(content) {
  const fences = [];
  if (!content) return fences;
  const re = /(^|\n)```(?:json|JSON)?\s*\r?\n([\s\S]*?)\r?\n```/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const openerLen = m[1] ? m[1].length : 0;
    const start = m.index + openerLen;
    const end = m.index + m[0].length;
    const raw = m[2];
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    fences.push({ start, end, raw, parsed });
  }
  return fences;
}

/**
 * @param {string} content
 * @returns {boolean}
 */
function rawFenceLooksWearable(raw) {
  return typeof raw === 'string' && raw.includes('"wearable_biometrics"');
}

/**
 * @param {string} content
 * @returns {JsonFence[]}
 */
function findWearableFences(content) {
  const text = String(content || '');
  const parsed = findJsonFences(text).filter(
    (f) =>
      (f.parsed &&
        typeof f.parsed === 'object' &&
        !Array.isArray(f.parsed) &&
        f.parsed.wearable_biometrics != null &&
        typeof f.parsed.wearable_biometrics === 'object') ||
      rawFenceLooksWearable(f.raw)
  );
  if (parsed.length) return parsed;
  const span = wearableFenceSpanByMarker(text);
  return span ? [span] : [];
}

/**
 * Locate wearable ``` fence by marker when JSON.parse fails.
 * @param {string} content
 * @returns {JsonFence|null}
 */
function wearableFenceSpanByMarker(content) {
  const marker = '"wearable_biometrics"';
  const midx = content.lastIndexOf(marker);
  if (midx < 0) return null;
  const before = content.slice(0, midx);
  let openIdx = -1;
  for (const tag of ['```json', '```JSON', '```']) {
    const i = before.lastIndexOf(tag);
    if (i > openIdx) openIdx = i;
  }
  if (openIdx < 0) return null;
  const lineStart = openIdx > 0 && content[openIdx - 1] === '\n' ? openIdx : openIdx;
  const start = content[openIdx - 1] === '\n' ? openIdx : openIdx;
  let closeIdx = content.indexOf('\n```', midx);
  if (closeIdx < 0) {
    closeIdx = content.lastIndexOf('```', midx);
    if (closeIdx < 0) return null;
  }
  const end = closeIdx + 4;
  return {
    start,
    end: Math.min(end, content.length),
    raw: content.slice(start, end),
    parsed: null,
  };
}

/**
 * @param {string} content
 * @param {number} charIndex
 * @returns {number}
 */
function lineIndexAtChar(content, charIndex) {
  const lines = content.split('\n');
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineStart = offset;
    const lineEnd = offset + lines[i].length;
    if (charIndex >= lineStart && charIndex <= lineEnd) return i;
    offset = lineEnd + 1;
  }
  return lines.length - 1;
}

/**
 * @param {string} content
 * @param {number} fenceStart
 * @returns {number|null}
 */
function findOuraTailOpenerIndex(content, fenceStart) {
  const lines = content.split('\n');
  const fenceLineIdx = lineIndexAtChar(content, fenceStart);
  if (fenceLineIdx < 0) return null;

  for (let i = fenceLineIdx - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (t === '') continue;
    if (t === '---') {
      let opener = 0;
      for (let j = 0; j < i; j++) opener += lines[j].length + 1;
      return opener;
    }
    break;
  }
  return fenceStart;
}

/**
 * Slice from last --- or opening ``` before wearable_biometrics through EOF.
 * @param {string} content
 * @returns {string|null}
 */
function extractOuraTailByMarker(content) {
  const text = String(content || '');
  const marker = '"wearable_biometrics"';
  const idx = text.lastIndexOf(marker);
  if (idx < 0) return null;
  const before = text.slice(0, idx);
  const sep = before.lastIndexOf('\n---');
  const fence = Math.max(
    before.lastIndexOf('\n```json'),
    before.lastIndexOf('\n```JSON'),
    before.lastIndexOf('\n```')
  );
  let start = -1;
  if (sep >= 0 && (fence < 0 || sep > fence)) start = sep + 1;
  else if (fence >= 0) start = fence + 1;
  else return null;
  return text.slice(start);
}

/**
 * @typedef {{ ok: true, hasTail: boolean, head: string, tail: string|null, wearableFenceCount: number } | { ok: false, error: string, wearableFenceCount: number }} JournalSplit
 */

/**
 * @param {string|null|undefined} content
 * @returns {JournalSplit}
 */
function splitJournalFile(content) {
  const text = content == null ? '' : String(content);
  if (!text) {
    return { ok: true, hasTail: false, head: '', tail: null, wearableFenceCount: 0 };
  }
  const wearable = findWearableFences(text);
  if (wearable.length === 0) {
    return { ok: true, hasTail: false, head: text, tail: null, wearableFenceCount: 0 };
  }
  const fence = wearable[wearable.length - 1];
  let opener = findOuraTailOpenerIndex(text, fence.start);
  if (opener == null) {
    const tail = extractOuraTailByMarker(text);
    if (!tail) {
      return {
        ok: false,
        error: 'Daily log has wearable_biometrics but tail boundary could not be determined.',
        wearableFenceCount: wearable.length,
      };
    }
    return {
      ok: true,
      hasTail: true,
      head: text.slice(0, text.length - tail.length),
      tail,
      wearableFenceCount: wearable.length,
    };
  }
  return {
    ok: true,
    hasTail: true,
    head: text.slice(0, opener),
    tail: text.slice(opener),
    wearableFenceCount: wearable.length,
  };
}

/**
 * @typedef {{ ok: true, file: string } | { ok: false, error: string }} ComposeResult
 */

/**
 * @param {string|null|undefined} existingFile
 * @param {string} trackerHeadNew
 * @returns {ComposeResult}
 */
function composeJournalFile(existingFile, trackerHeadNew) {
  let headNew = trackerHeadNew == null ? '' : String(trackerHeadNew);
  const existing = existingFile == null ? '' : String(existingFile);
  const split = splitJournalFile(existing);
  if (!split.ok) return { ok: false, error: split.error };
  if (!split.hasTail) {
    if (existing.includes('"wearable_biometrics"')) {
      const tail = extractOuraTailByMarker(existing);
      if (tail) {
        if (headNew.length && !headNew.endsWith('\n') && !tail.startsWith('\n')) headNew += '\n';
        return { ok: true, file: headNew + tail };
      }
      return {
        ok: false,
        error:
          'Daily log contains Oura data but the tail could not be preserved. Drive sync skipped to avoid data loss.',
      };
    }
    return { ok: true, file: headNew };
  }
  if (headNew.length && !headNew.endsWith('\n') && split.tail && !split.tail.startsWith('\n')) {
    headNew += '\n';
  }
  return { ok: true, file: headNew + split.tail };
}

/**
 * @param {string} content
 * @returns {object|null}
 */
function parseWearableBiometricsReadOnly(content) {
  const wearable = findWearableFences(String(content || ''));
  if (wearable.length !== 1) return null;
  if (wearable[0].parsed && typeof wearable[0].parsed === 'object') {
    return wearable[0].parsed.wearable_biometrics;
  }
  return wearable[0].raw ? {} : null;
}

global.DT = {
  composeJournalFile,
  splitJournalFile,
  parseWearableBiometricsReadOnly,
  isWearableOnlyRoot,
  findJsonFences,
};
})(typeof globalThis !== 'undefined' ? globalThis : window);


/**
 * Daily Tracker application (Phase 1).
 * Source of truth for UI behavior. Built to dist/app.js via npm run build.
 * Shared pure logic also lives in src/core/ and src/domain/ (used by tests).
 */
const DSM=[{id:'sm1',mfr:'Himalayan Gold',name:'Water',units:'oz',rat:'Hydration foundation; primes GI tract'},{id:'sm2',mfr:'Himalayan Gold',name:'Himalayan Salt',units:'tsp',rat:'Sodium for morning cortisol peak; electrolyte priming'},{id:'sm3',mfr:'Vital Reaction',name:'Hydrogen Tab',units:'tab',rat:'Oxidative stress reduction; under review'},{id:'sm4',mfr:'Slow Mag',name:'Slow Mag',units:'tablet',rat:'Systemic Mg repletion; TRPM6 variants'},{id:'sm5',mfr:"Doctor's Best",name:'Mg Glycinate',units:'tablet',rat:'Glycinate form; TRPM6 variants; glucose signaling; sleep'},{id:'sm6',mfr:'PureGenomics',name:'B-Complex',units:'capsule',rat:'B1/B2/B5/B6-P5P/B12; COMT-safe methylated B12'},{id:'sm7',mfr:'Thorne',name:'D3/K2 Liquid',units:'drops',rat:'3000 IU D3 + MK-4; VDR/CYP2R1 variants; target 70-80 ng/mL'},{id:'sm8',mfr:'Coromega',name:'DHA Xtra',units:'softgels',rat:'FADS1/FADS2 variants; APOE4 neuroprotection'},{id:'sm9',mfr:'Bulk Supplements',name:'Creatine',units:'g',rat:'Athletic performance; neuroprotection; APOE4 support'},{id:'sm10',mfr:'Rx',name:'Ezetimibe',units:'tablet',rat:'ApoB target <60; APOE4 cardiovascular management'},{id:'sm11',mfr:'Jarrow',name:'Pterostilbene',units:'mg',rat:'APOE4 neuroinflammation; NF-kB suppression; COMT-safe'},{id:'sm12',mfr:'Jarrow',name:'Magtein',units:'g',rat:'CNS-targeted Mg; APOE4 neuroprotection; sleep architecture'},{id:'sm13',mfr:'Quicksilver',name:'Liposomal C',units:'mg',rat:'SLC23A variants; APOE4 oxidative stress'},{id:'sm14',mfr:'Swanson',name:'Apigenin',units:'mg',rat:'NAD+ CD38 inhibition; sleep; mild COMT inhibition'},{id:'sm15',mfr:'Bulk Supplements',name:'Glycine',units:'g',rat:'Sleep quality; methylation buffer; COMT Met/Met; collagen'},{id:'sm16',mfr:'Rx',name:'Rosuvastatin',units:'mg',rat:'ApoB target <60; night dosing for hepatic synthesis peak'}];
const DSCH=[{id:'sc1',mid:'sm1',grp:'morning-water',qty:14,tag:'',on:true},{id:'sc2',mid:'sm2',grp:'morning-water',qty:0.125,tag:'',on:true},{id:'sc3',mid:'sm3',grp:'morning-water',qty:1,tag:'optional',on:true},{id:'sc4',mid:'sm4',grp:'breakfast',qty:1,tag:'',on:true},{id:'sc5',mid:'sm5',grp:'breakfast',qty:1,tag:'',on:true},{id:'sc6',mid:'sm6',grp:'breakfast',qty:1,tag:'interim',on:true},{id:'sc7',mid:'sm7',grp:'breakfast',qty:6,tag:'',on:true},{id:'sc8',mid:'sm8',grp:'breakfast',qty:2,tag:'',on:true},{id:'sc9',mid:'sm9',grp:'breakfast',qty:5,tag:'',on:true},{id:'sc10',mid:'sm10',grp:'breakfast',qty:1,tag:'',on:true},{id:'sc11',mid:'sm11',grp:'breakfast',qty:50,tag:'',on:true},{id:'sc12',mid:'sm5',grp:'lunch',qty:3,tag:'',on:true},{id:'sc13',mid:'sm4',grp:'bedtime',qty:3,tag:'',on:true},{id:'sc14',mid:'sm12',grp:'bedtime',qty:1,tag:'',on:true},{id:'sc15',mid:'sm13',grp:'bedtime',qty:500,tag:'',on:true},{id:'sc16',mid:'sm14',grp:'bedtime',qty:50,tag:'',on:true},{id:'sc17',mid:'sm15',grp:'bedtime',qty:4,tag:'',on:true},{id:'sc18',mid:'sm16',grp:'bedtime',qty:2.5,tag:'',on:true}];
const DFD=[{id:'f1',nm:'Betaine Greens',sec:'Vegetables',dg:1,wg:0,on:true,srv:'85g cooked spinach, beet greens, or Swiss chard',ceil:'200g daily',col:'auto',why:'BHMT+PEMT variants reduce homocysteine clearance. Dietary betaine targets homocysteine <7.2 since TMG is excluded.'},{id:'f2',nm:'Dark Greens / Cruciferous',sec:'Vegetables',dg:1,wg:0,on:true,srv:'85g cooked kale, arugula, collards, broccoli, Brussels sprouts, cauliflower',ceil:'No limit',col:'auto',why:'Activates NRF2 pathway for APOE4 cellular defense. Nitrates support vascular function via NOS3 variant.'},{id:'f3',nm:'Colorful Veg',sec:'Vegetables',dg:1.5,wg:0,on:true,srv:'85g red bell pepper, carrots, beets, tomatoes, red cabbage',ceil:'No limit',col:'auto',why:'BCO1 variants reduce beta-carotene conversion. SLC23A2 variant demands food-form vitamin C.'},{id:'f4',nm:'Other Veg',sec:'Vegetables',dg:0,wg:0,on:true,srv:'85g any vegetable including onions, mushrooms, zucchini, asparagus. Half avocado = 1 serving.',ceil:'No limit',col:'auto',why:'Counts toward daily vegetable total. Avocado moved here: healthy monounsaturated fats, potassium, enhances fat-soluble vitamin absorption.'},{id:'f5',nm:'Berries',sec:'Fruit',dg:1,wg:0,on:true,srv:'85g blueberries, blackberries, strawberries, or raspberries',ceil:'200g combined daily fruit',col:'auto',why:'SIRT1 rs932658 AA genotype responds well to berry polyphenols. Strongest food-based evidence for APOE4 neuroinflammation reduction.'},{id:'f6',nm:'Other Fruit',sec:'Fruit',dg:1,wg:0,on:true,srv:'1 piece citrus, kiwi, pomegranate, or green-tipped banana',ceil:'200g combined daily fruit',col:'auto',why:'SLC23A2 variant demands higher vitamin C. Pomegranate has specific APOE4 neuroprotective evidence.'},{id:'f7',nm:'Eggs',sec:'Protein',dg:1,wg:0,on:true,srv:'2 whole eggs',ceil:'3 daily',col:'auto',why:'Primary choline delivery for APOE4/PEMT variants (~294mg). Ceiling reflects APOE4 dietary cholesterol sensitivity.'},{id:'f8',nm:'Fish',sec:'Protein',dg:0,wg:5,on:true,srv:'140g cooked salmon, sardines, mackerel, trout, cod, or halibut. Tuna max 2x/week.',ceil:'200g per sitting',col:'auto',why:'FADS1/FADS2 variants impair ALA to EPA/DHA conversion. Maintains omega index 9.8%.'},{id:'f9',nm:'Fowl',sec:'Protein',dg:0,wg:5,on:true,srv:'140g cooked chicken or turkey breast, skinless preferred',ceil:'No limit',col:'auto',why:'Primary weekly protein anchor for leucine threshold. AMPD1 variant increases post-exercise protein requirement.'},{id:'f10',nm:'Red Meat / Pork',sec:'Protein',dg:0,wg:1,on:true,srv:'140g cooked grass-fed beef, bison, or pork tenderloin',ceil:'0=amber 1-2=green 3=yellow 4+=red weekly',col:'auto',why:'Heme iron for iron saturation at 24%. Always pair with vitamin C. ApoB 57 well controlled.'},{id:'f11',nm:'Smart Carbs',sec:'Grains',dg:1,wg:0,on:true,srv:'40g dry steel cut oats OR 100g cooked quinoa, basmati, sweet potato, sourdough, farro, or barley',ceil:'150g cooked at any sitting',col:'auto',why:'PPARD and AMPD1 variants require adequate carbohydrate for performance.'},{id:'f12',nm:'Refined Grains',sec:'Grains',dg:0,wg:0,on:true,srv:'150g cooked white pasta, white rice, white bread, risotto, or white potato',ceil:'Minimize',col:'amber',why:'Refined carbs spike glucose - track for awareness.'},{id:'f13',nm:'Extra Virgin Olive Oil',sec:'Fats',dg:1,wg:0,on:true,srv:'14g (1 tbsp) first cold press with vegetables - never high heat',ceil:'28g (2 tbsp) daily',col:'auto',why:'Oleocanthal provides NF-kB suppression relevant to APOE4 inflammation.'},{id:'f14',nm:'Legumes',sec:'Legumes',dg:1,wg:0,on:true,srv:'85g cooked lentils, black beans, edamame, chickpeas, navy or kidney beans',ceil:'170g daily',col:'auto',why:'Magnesium delivery supporting TRPM6 variant. Plant sterols address elevated lathosterol.'},{id:'f15',nm:'Nuts and Seeds',sec:'Nuts and Seeds',dg:1,wg:0,on:true,srv:'30g walnuts, pecans, pumpkin seeds, or sesame seeds. No peanuts.',ceil:'60g daily',col:'auto',why:'Primary food source for gamma tocopherol (currently 0.6 mg/L, below optimal).'},{id:'f16',nm:'Fermented Foods',sec:'Fermented Foods',dg:0,wg:3,on:true,srv:'180ml kefir, 150g Greek yogurt, 85g kimchi or sauerkraut, or 17g miso',ceil:'No ceiling',col:'auto',why:'WBC consistently low (3.5-3.8). APOE4 gut-brain axis research links microbiome to neuroinflammation.'},{id:'f17',nm:'Sunflower Lecithin',sec:'Choline',dg:1,wg:0,on:true,srv:'2 tsp (5g) Now Foods Sunflower Lecithin Powder with a meal',ceil:'1 tbsp (7.5g) daily',col:'auto',why:'Phosphatidylcholine for APOE4/PEMT variants. Total daily target 700-800mg choline.'}];
const FSGS={'Vegetables':4,'Fruit':2,'Protein':2};
const DAT=[{id:'a1',nm:'Cold Plunge',on:true,flds:[{nm:'Duration',t:'number',u:'minutes'},{nm:'Temperature',t:'number',u:'F'}]},{id:'a2',nm:'Sauna',on:true,flds:[{nm:'Duration',t:'number',u:'minutes'},{nm:'Temperature',t:'number',u:'F'}]},{id:'a3',nm:'Meditation',on:true,flds:[{nm:'Duration',t:'number',u:'minutes'}]}];
const BWL_OPTS=[{v:'Normal',d:''},{v:'Loose',d:''},{v:'Watery',d:''},{v:'Hard',d:''}];
const DAT_BH={id:'a0bh',nm:'Bowel Health',on:true,flds:[{nm:'Bowel Health',t:'opts',opts:[{v:'Normal',d:''},{v:'Loose',d:''},{v:'Watery',d:''},{v:'Hard',d:''}]}]};
const DWB=[8,16,20,24,32],WT=90;
const SGP=[{id:'morning-water',lb:'Wake-up'},{id:'breakfast',lb:'Breakfast'},{id:'lunch',lb:'Lunch'},{id:'dinner',lb:'Dinner'},{id:'bedtime',lb:'Bed'},{id:'other',lb:'Other'}];
const DRIVE_IDS={dailyLogs:'',backups:''};
const GOOGLE_CLIENT_ID='506786550667-avuia963fvu1o32hjvgdq142u6f6jhn6.apps.googleusercontent.com';
/** Parent you grant: DailyTracker/daily-logs/, DailyTracker/config/ */
const LOCAL_EXPORT_ROOT='DailyTracker';
const LOCAL_EXPORT_DAILY_LOGS_DIR='daily-logs';
const LOCAL_EXPORT_CONFIG_DIR='config';
const FOOD_CATEGORY_KEYS={'Betaine Greens':'betaine_greens','Dark Greens / Cruciferous':'dark_greens_cruciferous','Colorful Veg':'colorful_veg','Other Veg':'other_veg','Berries':'berries','Other Fruit':'other_fruit','Eggs':'eggs','Fish':'fish','Fowl':'fowl','Red Meat / Pork':'red_meat_pork','Smart Carbs':'smart_carbs','Refined Grains':'refined_grains','Extra Virgin Olive Oil':'extra_virgin_olive_oil','Legumes':'legumes','Nuts and Seeds':'nuts_and_seeds','Fermented Foods':'fermented_foods','Sunflower Lecithin':'sunflower_lecithin'};
const LOCAL_CONFIG_SNAPSHOT_KEEP=5;
const IDB_FS_NAME='dt6fs';
const IDB_FS_STORE='kv';
const IDB_KEY_LOCAL_EXPORT_DIR='localExportDir';

const STORAGE_KEY='dt6';
let S={gdt:null,flSave:null,sm:[],sch:[],sl:[],wb:[...DWB],wl:[],fd:[],meals:[],fl:[],ind:[],acts:[],al:[],bwl:[],fnotes:[],snotes:[],notes:[],exportModDates:[],foodGroups:[],suppGroups:[],cfg:{autoSync:false,shareOnSave:true,driveIds:{...DRIVE_IDS}}};
let _ovStack=[],_esmId=null,_escId=null,_efiId=null,_emId=null,_eatId=null;
let _cSLId=null,_cSSId=null,_cWLId=null,_cFId=null,_cALId=null,_cATId=null,_cNId=null,_cFNId=null,_cSNId=null,_cIId=null,_cMId=null;
let _hType=null,_hData=[],_hDataAll=[],_hFilterDay='',_hSel=new Set(),_hSelMode=true;
let _modDates=new Set(),_pendingWater=null,_supSt={},_supAdhoc={},_otherSt={};
let _listPickCtx=null;
let _bwlMigrated=false;
let _localExportDirPromise=null,_migratedDriveOff=false;
let _gToken=null,_gTokenExpiry=0;

function normalizeS(){
  const needArr=k=>{if(!Array.isArray(S[k]))S[k]=[];};
  needArr('sm');needArr('sch');needArr('sl');needArr('wl');needArr('fd');needArr('meals');needArr('fl');needArr('ind');needArr('acts');needArr('al');needArr('bwl');needArr('fnotes');needArr('snotes');needArr('notes');
  // Ensure Bowel Health activity exists
  if(!S.acts.find(a=>a.nm==='Bowel Health'))S.acts.unshift(JSON.parse(JSON.stringify(DAT_BH)));
  // Migrate legacy S.bwl entries → S.al under the Bowel Health activity
  if(S.bwl&&S.bwl.length){
    const bh=S.acts.find(a=>a.nm==='Bowel Health');
    const fldNm=bh&&bh.flds&&bh.flds[0]?bh.flds[0].nm:'Bowel Health';
    const alIds=new Set(S.al.map(e=>e.id));
    S.bwl.forEach(b=>{if(!alIds.has(b.id)){const flds={};flds[fldNm]=b.val;S.al.push({id:b.id,aid:bh.id,dt:b.dt,la:b.la||b.dt,flds,nt:b.nt||''});}});
    S.bwl=[];
    _bwlMigrated=true;
  }
  if(S.flSave!=null&&typeof S.flSave!=='string')S.flSave=null;
  if(S.gdt!=null&&typeof S.gdt!=='string')S.gdt=null;
  if(!S.cfg||typeof S.cfg!=='object')S.cfg={autoSync:false,driveIds:{...DRIVE_IDS}};
  if(!S.cfg.driveIds||typeof S.cfg.driveIds!=='object')S.cfg.driveIds={...DRIVE_IDS};
  Object.keys(DRIVE_IDS).forEach(k=>{if(!(k in S.cfg.driveIds)||S.cfg.driveIds[k]==null)S.cfg.driveIds[k]=DRIVE_IDS[k];});
  if(S.cfg.driveIds.md&&!S.cfg.driveIds.dailyLogs)S.cfg.driveIds.dailyLogs=S.cfg.driveIds.md;
  delete S.cfg.driveIds.md;
  delete S.cfg.driveIds.json;
  if(typeof S.cfg.autoSync!=='boolean')S.cfg.autoSync=false;
  if(S.cfg.autoSync&&S.cfg._driveAutoSyncMigrated2026!==true){S.cfg.autoSync=false;S.cfg._driveAutoSyncMigrated2026=true;_migratedDriveOff=true;}
  if(typeof S.cfg.shareOnSave!=='boolean')S.cfg.shareOnSave=true;
  if(!Array.isArray(S.exportModDates))S.exportModDates=[];
  S.exportModDates=[...new Set(S.exportModDates.filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
  _modDates=new Set(S.exportModDates);
  if(!Array.isArray(S.foodGroups)||!S.foodGroups.length){S.foodGroups=[...new Set((S.fd||[]).map(f=>f.sec).filter(Boolean))];}
  if(!Array.isArray(S.suppGroups)||!S.suppGroups.length){S.suppGroups=JSON.parse(JSON.stringify(SGP));}
}
function syncExportModDatesIntoS(){
  S.exportModDates=[..._modDates].filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
}
function sv(){
  try{
    syncExportModDatesIntoS();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(S));
    return true;
  }catch(e){
    console.error('sv',e);
    shT(e&&e.name==='QuotaExceededError'?'Storage full — clear space or use Backup Now':'Save failed');
    return false;
  }
}
function flushLocalQuiet(){
  try{syncExportModDatesIntoS();localStorage.setItem(STORAGE_KEY,JSON.stringify(S));}catch(e){console.error('flushLocalQuiet',e);}
}
function clearExportDirty(){
  _modDates.clear();
  S.exportModDates=[];
  flushLocalQuiet();
}
function ld(){
  try{
    const r=localStorage.getItem(STORAGE_KEY);
    if(r)S={...S,...JSON.parse(r)};
    else dfs();
  }catch(e){console.error('ld',e);dfs();}
  normalizeS();
  if(_migratedDriveOff){_migratedDriveOff=false;flushLocalQuiet();}
  if(_bwlMigrated){_bwlMigrated=false;flushLocalQuiet();}
}
function dfs(){S.sm=JSON.parse(JSON.stringify(DSM));S.sch=JSON.parse(JSON.stringify(DSCH));S.fd=JSON.parse(JSON.stringify(DFD));S.acts=[JSON.parse(JSON.stringify(DAT_BH)),...JSON.parse(JSON.stringify(DAT))];S.wb=[...DWB];S.meals=[];S.cfg={autoSync:false,shareOnSave:true,driveIds:{...DRIVE_IDS}};S.gdt=null;S.flSave=null;S.sl=[];S.wl=[];S.fl=[];S.ind=[];S.al=[];S.bwl=[];S.fnotes=[];S.snotes=[];S.notes=[];S.exportModDates=[];S.foodGroups=[...new Set(DFD.map(f=>f.sec).filter(Boolean))];S.suppGroups=JSON.parse(JSON.stringify(SGP));_modDates=new Set();}

function gFoodGroups(){return(S.foodGroups&&S.foodGroups.length)?S.foodGroups:[...new Set(S.fd.filter(f=>f.on).map(f=>f.sec).filter(Boolean))];}
function gSuppGroups(){return(S.suppGroups&&S.suppGroups.length)?S.suppGroups:SGP;}
function suppSortKey(m){return ((m&&m.name)||'').toLowerCase()+'\t'+((m&&m.mfr)||'').toLowerCase();}
function smLabel(m){if(!m)return'?';return (m.mfr?m.mfr+' \u2014 ':'')+m.name;}
function sortedSm(){return [...S.sm].sort((a,b)=>suppSortKey(a).localeCompare(suppSortKey(b)));}
function sortedSch(){return [...S.sch].sort((a,b)=>{const ma=S.sm.find(x=>x.id===a.mid),mb=S.sm.find(x=>x.id===b.mid);return suppSortKey(ma||{}).localeCompare(suppSortKey(mb||{}));});}
function setHiddenPick(hid,lblId,val,items,emptyLbl){
  const el=document.getElementById(hid);if(el)el.value=val||'';
  const lb=document.getElementById(lblId);if(!lb)return;
  if(!val){lb.textContent=emptyLbl||'\u2014 select \u2014';return;}
  const it=(items||[]).find(x=>String(x.v)===String(val));
  lb.textContent=it?it.label:(val||emptyLbl||'\u2014 select \u2014');
}
function openListPick(ctx){
  _listPickCtx=ctx;
  document.getElementById('lpT').textContent=ctx.title||'Choose';
  const si=document.getElementById('lpSrch');si.value='';si.oninput=()=>rListPick();
  rListPick();
  openOvPush('ovListPick');
}
function rListPick(){
  const ctx=_listPickCtx;if(!ctx)return;
  const q=(document.getElementById('lpSrch').value||'').trim().toLowerCase();
  const items=(ctx.items||[]).filter(it=>{if(!q)return true;const s=(it.label+' '+(it.sub||'')).toLowerCase();return s.includes(q);});
  const c=document.getElementById('lpL');let h='';
  if(ctx.emptyLabel){h+='<div class="pick-li" data-v=""><div class="pl-nm">'+escHTML(ctx.emptyLabel)+'</div></div>';}
  items.forEach(it=>{h+='<div class="pick-li" data-v="'+escHTML(String(it.v))+'"><div class="pl-nm">'+escHTML(it.label)+'</div>'+(it.sub?'<div class="pl-mm">'+escHTML(it.sub)+'</div>':'')+'</div>';});
  c.innerHTML=h||'<div style="padding:12px;font-family:Courier New,monospace;font-size:10px;color:var(--mt)">No matches</div>';
  c.onclick=e=>{const li=e.target.closest('.pick-li');if(!li||!c.contains(li))return;cfListPick(li.getAttribute('data-v')??'');};
}
function cfListPick(v){
  const ctx=_listPickCtx;_listPickCtx=null;popOv();if(ctx&&ctx.onSelect)ctx.onSelect(v);
}
function pickEscSupp(){
  const items=sortedSm().map(m=>({v:m.id,label:m.name,sub:(m.mfr||'')+' \u00b7 '+(m.units||'')}));
  openListPick({title:'Supplement',items,emptyLabel:_escId?null:'\u2014 select supplement \u2014',onSelect(v){document.getElementById('escSI').value=v;setHiddenPick('escSI','escSILbl',v,items,_escId?'':'— select supplement —');rEscUnitsHint();}});
}
function pickEscGrp(){
  const items=gSuppGroups().map(g=>({v:g.id,label:g.lb}));
  openListPick({title:'Timing group',items,emptyLabel:_escId?null:'\u2014 select group \u2014',onSelect(v){document.getElementById('escGr').value=v;setHiddenPick('escGr','escGrLbl',v,items);}});
}
function pickEfiGrp(){
  const grps=gFoodGroups();
  const items=grps.map(g=>({v:g,label:g}));
  openListPick({title:'Food group',items,emptyLabel:_efiId?null:'\u2014 select group \u2014',onSelect(v){document.getElementById('efiSc').value=v;setHiddenPick('efiSc','efiScLbl',v,items);}});
}
function isWaterMid(mid){const m=S.sm.find(x=>x.id===mid);return m&&m.name==='Water';}
function isWaterSuppLog(e){const sc=S.sch.find(x=>x.id===e.sid);const m=sc?S.sm.find(x=>x.id===sc.mid):null;return !!(m&&m.name==='Water');}
function resolveAdhocSid(mid){
  let sc=S.sch.find(x=>x.mid===mid&&!x.on);
  if(!sc)sc=S.sch.find(x=>x.mid===mid&&x.grp==='other');
  if(!sc){sc={id:uid(),mid,grp:'other',qty:1,tag:'catalog',on:false};S.sch.push(sc);}
  return sc.id;
}

const LOG_DATA_CUTOFF='2026-05-18';
const LOG_DATA_BAD_DAY='2026-05-19';
function logEntryDay(e){return isoToLocalYMD(e&&(e.dt||e.la||''));}
function migrateStoredLogsOnce(){
  if(S.cfg&&S.cfg._logMigrate20260520)return;
  const fixDt=iso=>{
    if(isoToLocalYMD(iso)===LOG_DATA_BAD_DAY)return dateAndTimeToISO(LOG_DATA_CUTOFF,isoToTimeLocal(iso));
    return iso;
  };
  const patchArr=arr=>{if(!Array.isArray(arr))return;arr.forEach(e=>{if(e.dt)e.dt=fixDt(e.dt);if(e.la&&isoToLocalYMD(e.la)===LOG_DATA_BAD_DAY)e.la=fixDt(e.la);});};
  patchArr(S.sl);patchArr(S.wl);patchArr(S.fl);patchArr(S.al);patchArr(S.ind);patchArr(S.notes);patchArr(S.fnotes);patchArr(S.snotes);patchArr(S.bwl);
  const keep=e=>isoToLocalYMD(e.dt||(e.la||''))>=LOG_DATA_CUTOFF;
  S.sl=S.sl.filter(keep);S.wl=S.wl.filter(keep);S.fl=S.fl.filter(keep);S.al=S.al.filter(keep);S.ind=S.ind.filter(keep);
  S.notes=S.notes.filter(keep);S.fnotes=S.fnotes.filter(keep);S.snotes=S.snotes.filter(keep);S.bwl=[];
  S.exportModDates=(S.exportModDates||[]).filter(d=>d>=LOG_DATA_CUTOFF);
  _modDates=new Set(S.exportModDates);
  S.flSave=null;
  if(!S.cfg)S.cfg={autoSync:false,shareOnSave:true,driveIds:{...DRIVE_IDS}};
  S.cfg._logMigrate20260520=true;
  sv();
}

function purgeLogsBeforeToday(){
  const today=td();
  const n=S.sl.length+S.wl.length+S.fl.length+S.al.length+S.ind.length+S.notes.length+S.fnotes.length+S.snotes.length;
  if(!n){shT('No log entries to clear');return;}
  if(!confirm('Delete ALL log entries before '+today+'?\n\nKeeps supplement catalog, schedule, food protocol, meals, and settings.'))return;
  const keep=e=>isoToLocalYMD(e.dt||(e.la||''))>=today;
  S.sl=S.sl.filter(keep);S.wl=S.wl.filter(keep);S.fl=S.fl.filter(keep);S.al=S.al.filter(keep);S.ind=S.ind.filter(keep);
  S.notes=S.notes.filter(keep);S.fnotes=S.fnotes.filter(keep);S.snotes=S.snotes.filter(keep);S.bwl=[];
  S.exportModDates=S.exportModDates.filter(d=>d>=today);_modDates=new Set(S.exportModDates);S.flSave=null;
  _supSt={};_supAdhoc={};_otherSt={};_pendingWater=null;sv();
  rH();rW();rS();rF();rA();rN();rLog();shT('Cleared logs before '+today);
}


const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
function escHTML(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
const now=()=>new Date().toISOString();
function localDateYMD(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const td=()=>localDateYMD(new Date());
function wks(){const d=new Date();d.setDate(d.getDate()-d.getDay());return localDateYMD(d);}
function f12(iso){if(!iso)return'--';const d=new Date(iso);let h=d.getHours(),m=d.getMinutes(),ap=h>=12?'PM':'AM';h=h%12||12;return h+':'+String(m).padStart(2,'0')+' '+ap;}
function fDT(iso){if(!iso)return'Now';const d=new Date(iso);const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return mo[d.getMonth()]+' '+d.getDate()+'\n'+f12(iso);}
function fL(v){return v?new Date(v).toISOString():now();}
function gEDt(){return S.gdt||now();}
function isoToLocalYMD(iso){
  if(!iso)return localDateYMD(new Date());
  const s=String(iso).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  const d=new Date(iso);
  if(isNaN(d.getTime()))return td();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function logDateKey(){return isoToLocalYMD(gEDt());}
function matchesLogDay(eDt,logIso){return!!(eDt&&logIso)&&isoToLocalYMD(eDt)===isoToLocalYMD(logIso);}
function onLogDay(iso,dt){return iso&&isoToLocalYMD(iso)===dt;}
function laStamp(iso){const d=new Date(iso);return isNaN(d.getTime())?'':d.toISOString().slice(0,16).replace('T',' ');}
function cleanMfr(mfr){if(!mfr||mfr==='--'||!String(mfr).trim())return null;return String(mfr).trim();}
function suppWikiLink(mfr,name){
  const p=String(name||'').trim();
  const m=cleanMfr(mfr);
  if(m&&p)return '[['+m+' '+p+']]';
  if(p)return '[['+p+']]';
  return '[[Unknown]]';
}
function foodCategoryKey(nm){
  if(FOOD_CATEGORY_KEYS[nm])return FOOD_CATEGORY_KEYS[nm];
  return String(nm||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'other';
}
function dayOfWeekName(dt){
  const d=new Date(dt+'T12:00:00');
  return['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
}
function emptyFoodCategories(){
  const o={};
  Object.values(FOOD_CATEGORY_KEYS).forEach(k=>{o[k]=0;});
  return o;
}
function ck(c){return '<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="'+(c||'#000')+'" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function xk(){return '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';}
function markMod(dt){_modDates.add(isoToLocalYMD(dt||now()));}
function resetAfterSave(){
  ['noteQuick','foodNoteQuick','suppNoteQuick'].forEach(id=>{const el=document.getElementById(id);if(el){el.value='';el.classList.remove('note-dirty');}});
  _cMId=null;
}

function touchAppOpenDay(){
  const t=td();
  const prev=S._lastAppOpenDay;
  if(S._lastAppOpenDay!==t)S._lastAppOpenDay=t;
  if(prev!==t||prev==null)flushLocalQuiet();
}

function rAppVersion(){
  const v=typeof APP_VERSION!=='undefined'?APP_VERSION:'(unknown)';
  const el=document.getElementById('appVersionLbl');
  const mm=document.getElementById('appVersionMm');
  if(el)el.textContent=v;
  if(mm)mm.textContent='Deployed build — bump src/version.js on every release';
}
function init(){
  rAppVersion();
  ld();migrateStoredLogsOnce();touchAppOpenDay();rH();rW();rS();rF();rA();rN();document.getElementById('tgAutoSync').classList.toggle('on',!!S.cfg.autoSync);document.getElementById('tgShareOnSave').classList.toggle('on',S.cfg.shareOnSave!==false);setInterval(rH,60000);initSwipe();gDriveCheckHash();
  const en=document.getElementById('eatNm');if(en)en.addEventListener('input',function(){this.classList.remove('eat-miss-err');});
  ['noteQuick','foodNoteQuick','suppNoteQuick'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('input',()=>el.classList.add('note-dirty'));});
  window.addEventListener('pagehide',flushLocalQuiet);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushLocalQuiet();});
  rLocalExportLbl();
}

function initSwipe(){
  document.addEventListener('touchstart',e=>{
    const sht=e.target.closest('.sht');if(!sht)return;
    const body=sht.querySelector('.sht-body');
    const startX=e.touches[0].clientX;const startY=e.touches[0].clientY;let curY=startY;
    let _swipeLocked=null; // 'dismiss' | 'scroll' | null
    function onMove(e2){
      curY=e2.touches[0].clientY;
      if(!_swipeLocked){
        const dx=Math.abs(e2.touches[0].clientX-startX);
        const dy=curY-startY;
        if(Math.abs(dy)>6||dx>6){
          // Only allow dismiss when sheet body is scrolled to top AND gesture is clearly downward
          const atTop=!body||body.scrollTop<=2;
          _swipeLocked=(atTop&&dy>0&&dy>dx)?'dismiss':'scroll';
        }
      }
      if(_swipeLocked!=='dismiss')return;
      const dy=Math.max(0,curY-startY);
      sht.style.transition='none';sht.style.transform='translateY('+dy+'px)';
    }
    function onEnd(){
      sht.style.transition='transform .3s cubic-bezier(.32,.72,0,1)';
      if(_swipeLocked==='dismiss'&&curY-startY>120){
        const ov=sht.closest('.ov');
        if(ov&&_ovStack[_ovStack.length-1]===ov.id)popOv();else if(ov)closeAllOv();
      }else sht.style.transform='translateY(0)';
      document.removeEventListener('touchmove',onMove);document.removeEventListener('touchend',onEnd);
    }
    document.addEventListener('touchmove',onMove,{passive:true});
    document.addEventListener('touchend',onEnd);
  },{passive:true});
}

function isoToTimeLocal(iso){if(!iso)return'12:00';const d=new Date(iso);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
function dateAndTimeToISO(dateStr,timeStr){
  if(!dateStr)return new Date().toISOString();
  const p=String(dateStr).split('-').map(x=>parseInt(x,10));
  const tm=(timeStr||'12:00').split(':');
  const hh=parseInt(tm[0],10)||0,mm=parseInt(tm[1],10)||0;
  const d=new Date(p[0],(p[1]||1)-1,p[2]||1,hh,mm,0,0);
  if(isNaN(d.getTime()))return new Date().toISOString();
  return d.toISOString();
}
function syncOvZ(){_ovStack.forEach((id,i)=>{const el=document.getElementById(id);if(el)el.style.zIndex=String(200+i);});}
function refreshParentOv(pid){
  if(pid==='ovMS')rMSL();
  if(pid==='ovMSC')rMSCL();
  if(pid==='ovMM')rMML();
  if(pid==='ovMF')rMFL();
  if(pid==='ovMA')rMAL();
  if(pid==='ovMP')rMPList();
  if(pid==='ovH'){applyHDataFilter();}
}
function rMPList(){
  const act=S.meals.filter(m=>m.on!==false);
  document.getElementById('mpL').innerHTML=act.length?act.map(m=>'<div class="mi" onclick="ldM(\''+m.id+'\')"><div class="mii"><div class="mn">'+m.nm+'</div><div class="mm">'+(m.items||[]).filter(i=>i.qty>0).length+' items</div></div><div style="color:var(--mt);font-size:16px;flex-shrink:0">&#8250;</div></div>').join(''):'<div style="color:var(--mt);padding:12px;font-size:12px">No meals</div>';
}
function openOvRoot(id){
  _ovStack.forEach(oid=>{const e=document.getElementById(oid);if(e){e.classList.remove('open');const sh=e.querySelector('.sht');if(sh)sh.style.transform='';}});
  _ovStack=[id];
  const el=document.getElementById(id);if(el){el.classList.add('open');const body=el.querySelector('.sht-body');if(body)setTimeout(()=>body.scrollTop=0,0);}
  syncOvZ();
}
function openOvPush(id){
  const prev=_ovStack.length?_ovStack[_ovStack.length-1]:null;
  if(prev){const pe=document.getElementById(prev);if(pe)pe.classList.remove('open');}
  _ovStack.push(id);
  const el=document.getElementById(id);if(el){el.classList.add('open');const body=el.querySelector('.sht-body');if(body)setTimeout(()=>body.scrollTop=0,0);}
  syncOvZ();
}
function popOv(){
  const top=_ovStack.pop();
  if(top){const te=document.getElementById(top);if(te){te.classList.remove('open');const sh=te.querySelector('.sht');if(sh)sh.style.transform='';}}
  const par=_ovStack[_ovStack.length-1];
  if(par){const pe=document.getElementById(par);if(pe)pe.classList.add('open');refreshParentOv(par);}
  syncOvZ();
}
function closeAllOv(){
  _ovStack.forEach(oid=>{const e=document.getElementById(oid);if(e){e.classList.remove('open');const sh=e.querySelector('.sht');if(sh)sh.style.transform='';}});
  _ovStack=[];
}
function oOv(id){openOvRoot(id);}
function cOv(id){if(_ovStack[_ovStack.length-1]===id)popOv();else closeAllOv();}

function rH(){
  const btn=document.getElementById('gdtB'),txt=document.getElementById('gdtT');
  if(S.gdt){btn.classList.add('mod');txt.textContent=fDT(S.gdt);}
  else{btn.classList.remove('mod');const d=new Date();const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];txt.textContent=days[d.getDay()]+' '+mo[d.getMonth()]+' '+d.getDate()+'\n'+f12(d.toISOString());}
}
function oGDT(){const b=S.gdt||now();document.getElementById('gdtDate').value=isoToLocalYMD(b);document.getElementById('gdtTime').value=isoToTimeLocal(b);openOvRoot('ovGDT');}
function cfGDT(){S.gdt=dateAndTimeToISO(document.getElementById('gdtDate').value,document.getElementById('gdtTime').value);sv();rH();closeAllOv();}
function rGDT(){S.gdt=null;sv();rH();closeAllOv();}
function sw(n,el){document.querySelectorAll('.pg').forEach(p=>p.classList.remove('act'));document.querySelectorAll('.tab').forEach(t=>t.classList.remove('act'));document.getElementById('pg-'+n).classList.add('act');el.classList.add('act');if(n==='log')rLog();if(n==='settings'){rLocalExportLbl();document.getElementById('tgShareOnSave').classList.toggle('on',S.cfg.shareOnSave!==false);}}

// WATER
function rW(){
  const logIso=gEDt();const es=S.wl.filter(e=>matchesLogDay(e.dt,logIso));const tot=es.reduce((s,e)=>s+e.qty,0);
  document.getElementById('wT').textContent=tot;const pct=Math.min(100,Math.round(tot/WT*100));
  document.getElementById('wB').style.width=pct+'%';document.getElementById('wP').textContent=pct+'%';
  const g=document.getElementById('wQB');g.innerHTML='';
  S.wb.forEach(oz=>{if(!oz||oz<=0)return;const b=document.createElement('div');b.className='qb';b.textContent='+'+oz;b.onclick=()=>{S.wl.push({id:uid(),dt:gEDt(),la:now(),qty:oz,nt:''});markMod();sv();rW();};g.appendChild(b);});
  const l=document.getElementById('wL');
  if(!es.length){l.innerHTML='<div style="padding:13px;font-family:Courier New,monospace;font-size:10px;color:var(--mt)">No entries yet</div>';return;}
  l.innerHTML=es.map(e=>'<div class="row" onclick="oWE(\''+e.id+'\')"><div class="ri"><div class="rn">+'+e.qty+' oz</div>'+(e.nt?'<div class="rm">'+escHTML(e.nt)+'</div>':'')+'</div><div class="wlt">'+f12(e.dt)+'</div></div>').join('')+'<div style="display:flex;justify-content:space-between;padding:10px 13px;font-family:Courier New,monospace;font-size:11px;border-top:1px solid var(--bd)"><span>Total</span><span style="color:var(--bl);font-weight:700">'+tot+' oz</span></div>';
}
function oWE(id){_cWLId=id;const e=id?S.wl.find(x=>x.id===id):null;document.getElementById('weT').textContent=id?'Edit Water':'Log Water';document.getElementById('weQ').value=e?e.qty:16;document.getElementById('weNt').value=e?(e.nt||''):'';document.getElementById('weDl').style.display=id?'block':'none';openOvRoot('ovWE');}
function aWQ(d){const el=document.getElementById('weQ');el.value=Math.max(0,parseFloat(el.value||0)+d);}
function cfWE(){const qty=parseFloat(document.getElementById('weQ').value)||0;const nt=document.getElementById('weNt').value;if(_cWLId){const e=S.wl.find(x=>x.id===_cWLId);if(e){e.qty=qty;e.nt=nt;markMod(e.dt);}}else{const dt=gEDt();S.wl.push({id:uid(),dt,la:now(),qty,nt});markMod(dt);}sv();closeAllOv();rW();document.getElementById('weQ').value=16;document.getElementById('weNt').value='';}
function dWE(){markMod(S.wl.find(x=>x.id===_cWLId)?.dt);S.wl=S.wl.filter(x=>x.id!==_cWLId);sv();closeAllOv();rW();}
function oMWB(){document.getElementById('wBF').innerHTML=S.wb.map((v,i)=>'<div class="fld"><div class="fl">Button '+(i+1)+' oz</div><input type="number" id="wb'+i+'" value="'+v+'" step="1" min="0"></div>').join('');openOvRoot('ovMWB');}
function svWB(){S.wb=[0,1,2,3,4].map(i=>parseFloat(document.getElementById('wb'+i).value)||0);sv();closeAllOv();rW();}

// SUPPLEMENTS (staged until Save)
function rS(){
  const c=document.getElementById('sGrps');c.innerHTML='';
  gSuppGroups().forEach(grp=>{
    const items=S.sch.filter(sc=>sc.on&&sc.grp===grp.id);if(!items.length)return;
    const sd=document.createElement('div');sd.innerHTML='<div class="sh"><div class="sl">'+grp.lb+'</div></div>';
    const card=document.createElement('div');card.className='card';
    const stagedN=items.filter(sc=>_supSt[sc.id]).length;const allL=stagedN===items.length;
    const sar=document.createElement('div');sar.className='sar';
    sar.innerHTML='<div class="sal">'+(allL?'UNSELECT ALL':'SELECT ALL')+'</div><div style="font-family:Courier New,monospace;font-size:9px;color:var(--mt)">'+stagedN+'/'+items.length+'</div>';
    sar.onclick=()=>togSA(grp.id,allL);card.appendChild(sar);
    items.forEach(sc=>{
      const m=S.sm.find(x=>x.id===sc.mid);if(!m)return;
      const st=_supSt[sc.id];const sk=st&&st.sk;
      const on=st&&!sk;
      const div=document.createElement('div');div.className='row'+(on?' lg':'')+(sk?' sk':'');
      const cbDiv=document.createElement('div');cbDiv.className='cb';cbDiv.innerHTML=on?ck():sk?xk():'';
      cbDiv.onclick=e=>{e.stopPropagation();togSuppCB(sc.id);};
      const riDiv=document.createElement('div');riDiv.className='ri';
      riDiv.innerHTML='<div class="rn">'+m.name+(sc.tag==='interim'?'<span class="tg2 ti">interim</span>':sc.tag==='optional'?'<span class="tg2 to">optional</span>':'')+'</div><div class="rm">'+m.mfr+' - '+sc.qty+' '+m.units+'</div>';
      riDiv.onclick=()=>oSE(sc.id,null);
      div.appendChild(cbDiv);div.appendChild(riDiv);card.appendChild(div);
    });
    sd.appendChild(card);c.appendChild(sd);
  });
  rSAdhoc();
}
function rSAdhoc(){
  const el=document.getElementById('sAdhoc');if(!el)return;
  const mids=Object.keys(_supAdhoc);
  if(!mids.length){el.innerHTML='';return;}
  let h='<div class="sh"><div class="sl">Catalog (save to log)</div></div><div class="card">';
  mids.forEach(mid=>{
    const m=S.sm.find(x=>x.id===mid);if(!m)return;
    const st=_supAdhoc[mid];const on=st&&!st.sk;const sk=st&&st.sk;
    h+='<div class="row'+(on?' lg':'')+(sk?' sk':'')+'"><div class="cb" onclick="event.stopPropagation();togAdhocCB(\''+mid+'\')">'+(on?ck():sk?xk():'')+'</div><div class="ri" onclick="oSEAdhoc(\''+mid+'\')"><div class="rn">'+escHTML(m.name)+'</div><div class="rm">'+escHTML(m.mfr)+' - '+(st?st.qty:1)+' '+escHTML(m.units)+'</div></div></div>';
  });
  el.innerHTML=h+'</div>';
}
function togAdhocCB(mid){
  if(_supAdhoc[mid]){delete _supAdhoc[mid];}else{_supAdhoc[mid]={qty:1,nt:'',sk:false};}
  rS();
}
function oSuppCatalog(){
  const items=sortedSm().map(m=>({v:m.id,label:m.name,sub:(m.mfr||'')+' \u00b7 '+(m.units||'')}));
  openListPick({title:'Search catalog',items,onSelect(mid){
    if(!mid)return;
    const onSched=S.sch.find(x=>x.mid===mid&&x.on);
    if(onSched){togSuppCB(onSched.id);return;}
    if(_supAdhoc[mid])delete _supAdhoc[mid];else _supAdhoc[mid]={qty:1,nt:'',sk:false};
    rS();
  }});
}
function oSEAdhoc(mid){
  const m=S.sm.find(x=>x.id===mid);if(!m)return;
  _cSSId=null;_cSLId=null;
  const ex=_supAdhoc[mid]||{qty:1,nt:'',sk:false};
  document.getElementById('seN').textContent=m.name;
  document.getElementById('seM').textContent=m.mfr+' - '+(ex.qty||1)+' '+m.units;
  const rat=document.getElementById('seR');if(m.rat){rat.textContent=m.rat;rat.style.display='block';}else rat.style.display='none';
  document.getElementById('seQ').value=ex.qty||1;document.getElementById('seNt').value=ex.nt||'';
  document.getElementById('seQ').dataset.inc=0.5;
  document.getElementById('seDl').style.display='none';
  document.getElementById('ovSE').dataset.sid='';
  document.getElementById('ovSE').dataset.mid=mid;
  document.getElementById('ovSE').dataset.logId='';
  openOvRoot('ovSE');
}

function isWaterSup(sid){const sc=S.sch.find(x=>x.id===sid);const m=sc?S.sm.find(x=>x.id===sc.mid):null;return m&&m.name==='Water';}
function togSuppCB(sid){
  const sc=S.sch.find(x=>x.id===sid);if(!sc)return;
  if(_supSt[sid]){delete _supSt[sid];if(isWaterSup(sid))_pendingWater=null;}
  else{
    _supSt[sid]={qty:sc.qty,nt:'',sk:false};
    if(isWaterSup(sid))_pendingWater={sid,qty:sc.qty};
  }
  rS();
}
function togSA(gid,allL){
  const items=S.sch.filter(sc=>sc.on&&sc.grp===gid);
  if(allL){items.forEach(sc=>{delete _supSt[sc.id];if(isWaterSup(sc.id))_pendingWater=null;});}
  else{items.forEach(sc=>{if(!_supSt[sc.id]){_supSt[sc.id]={qty:sc.qty,nt:'',sk:false};if(isWaterSup(sc.id))_pendingWater={sid:sc.id,qty:sc.qty};}});}
  rS();
}
function oSE(sid,logId){
  const sc=S.sch.find(x=>x.id===sid);if(!sc)return;const m=S.sm.find(x=>x.id===sc.mid);if(!m)return;
  _cSSId=sid;_cSLId=logId||null;
  const ex=logId?S.sl.find(x=>x.id===logId):(_supSt[sid]?{qty:_supSt[sid].qty,nt:_supSt[sid].nt||'',sk:_supSt[sid].sk}:null);
  document.getElementById('seN').textContent=m.name;document.getElementById('seM').textContent=m.mfr+' - '+sc.qty+' '+m.units;
  const rat=document.getElementById('seR');if(m.rat){rat.textContent=m.rat;rat.style.display='block';}else rat.style.display='none';
  document.getElementById('seQ').value=ex?ex.qty:sc.qty;document.getElementById('seNt').value=ex?(ex.nt||''):'';
  document.getElementById('seQ').dataset.inc=sc.qty<1?sc.qty:0.5;
  document.getElementById('seDl').style.display=logId?'block':'none';
  document.getElementById('ovSE').dataset.sid=sid;document.getElementById('ovSE').dataset.mid='';document.getElementById('ovSE').dataset.logId=logId||'';
  openOvRoot('ovSE');
}
function aSQ(d){const el=document.getElementById('seQ');const inc=parseFloat(el.dataset.inc||.5);el.value=Math.max(0,Math.round((parseFloat(el.value||0)+d*inc)*1000)/1000);}
function cfSE(){
  const mid=document.getElementById('ovSE').dataset.mid;
  if(mid){
    const qty=parseFloat(document.getElementById('seQ').value)||0;const nt=document.getElementById('seNt').value;const sk=qty===0;
    _supAdhoc[mid]={qty,nt,sk};document.getElementById('ovSE').dataset.mid='';
    closeAllOv();rS();document.getElementById('seNt').value='';return;
  }
  const sid=document.getElementById('ovSE').dataset.sid;const logId=document.getElementById('ovSE').dataset.logId;
  const qty=parseFloat(document.getElementById('seQ').value)||0;const nt=document.getElementById('seNt').value;const sk=qty===0;
  if(logId){const e=S.sl.find(x=>x.id===logId);if(e){e.qty=qty;e.nt=nt;e.sk=sk;markMod(e.dt);}sv();}
  else{_supSt[sid]={qty,nt,sk};}
  closeAllOv();rS();document.getElementById('seNt').value='';
}
function dSE(){
  const mid=document.getElementById('ovSE').dataset.mid;
  if(mid){delete _supAdhoc[mid];document.getElementById('ovSE').dataset.mid='';closeAllOv();rS();return;}
  const sid=document.getElementById('ovSE').dataset.sid;const logId=document.getElementById('ovSE').dataset.logId;
  if(logId){markMod(S.sl.find(x=>x.id===logId)?.dt);S.sl=S.sl.filter(x=>x.id!==logId);sv();}
  else{delete _supSt[sid];if(isWaterSup(sid))_pendingWater=null;}
  closeAllOv();rS();
}
function oMS(){rMSL();openOvRoot('ovMS');}
function rMSL(){
  const c=document.getElementById('msL');c.innerHTML='';
  const q=(document.getElementById('msSearch')?.value||'').trim().toLowerCase();
  const list=sortedSm().filter(m=>{if(!q)return true;const s=(m.name+' '+(m.mfr||'')+' '+(m.units||'')).toLowerCase();return s.includes(q);});
  list.forEach(m=>{const i=S.sm.indexOf(m);
    const div=document.createElement('div');div.className='mi';div.draggable=true;div.dataset.i=i;
    div.innerHTML='<div class="mii" onclick="oESM(\''+m.id+'\')"><div class="mn">'+escHTML(m.mfr)+' \u2014 '+escHTML(m.name)+'</div><div class="mm">'+escHTML(m.units)+'</div></div><div class="mia"><div style="color:var(--mt);padding:4px 8px;cursor:grab;font-size:18px;flex-shrink:0">&#8801;</div></div>';
    div.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(i));div.classList.add('dragging');});
    div.addEventListener('dragend',()=>div.classList.remove('dragging'));
    div.addEventListener('dragover',e=>{e.preventDefault();div.classList.add('drag-over');});
    div.addEventListener('dragleave',()=>div.classList.remove('drag-over'));
    div.addEventListener('drop',e=>{e.preventDefault();div.classList.remove('drag-over');const from=parseInt(e.dataTransfer.getData('text/plain'));if(from===i)return;const moved=S.sm.splice(from,1)[0];S.sm.splice(i,0,moved);sv();rMSL();});
    c.appendChild(div);
  });
}
function oESM(id){_esmId=id;const m=id?S.sm.find(x=>x.id===id):null;document.getElementById('esmT').textContent=id?'Edit Supplement':'Add Supplement';document.getElementById('esmMfr').value=m?.mfr||'';document.getElementById('esmNm').value=m?.name||'';document.getElementById('esmU').value=m?.units||'';document.getElementById('esmRt').value=m?.rat||'';document.getElementById('esmDl').style.display=id?'block':'none';openOvPush('ovESM');}
function cfESM(){const d={mfr:document.getElementById('esmMfr').value,name:document.getElementById('esmNm').value,units:document.getElementById('esmU').value,rat:document.getElementById('esmRt').value};if(_esmId){const m=S.sm.find(x=>x.id===_esmId);if(m)Object.assign(m,d);}else S.sm.push({id:uid(),...d});sv();popOv();rMSL();rS();shT('Saved');}
function dSM(){S.sm=S.sm.filter(x=>x.id!==_esmId);S.sch=S.sch.filter(x=>x.mid!==_esmId);sv();popOv();rMSL();rS();}
function oMSC(){rMSCL();openOvRoot('ovMSC');}
function rMSCL(){
  const c=document.getElementById('mscL');c.innerHTML='';
  sortedSch().forEach(sc=>{const i=S.sch.indexOf(sc);
    const m=S.sm.find(x=>x.id===sc.mid);
    const nm=(m?.mfr?escHTML(m.mfr)+' \u2014 ':'')+escHTML(m?.name||'?');
    const div=document.createElement('div');div.className='mi'+(sc.on?'':' di');div.draggable=true;div.dataset.i=i;
    const grpObj=gSuppGroups().find(g=>g.id===sc.grp);const grpLb=grpObj?.lb||sc.grp;
    div.innerHTML='<div class="mii" onclick="oESC(\''+sc.id+'\')"><div class="mn">'+nm+'</div><div class="mm">'+escHTML(grpLb)+' \u00b7 '+sc.qty+' '+escHTML(m?.units||'')+'</div></div><div class="mia"><div class="tg'+(sc.on?' on':'')+'" onclick="tgSC(event,\''+sc.id+'\')"></div><div style="color:var(--mt);padding:4px 8px;cursor:grab;font-size:18px;flex-shrink:0">&#8801;</div></div>';
    div.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(i));div.classList.add('dragging');});
    div.addEventListener('dragend',()=>div.classList.remove('dragging'));
    div.addEventListener('dragover',e=>{e.preventDefault();div.classList.add('drag-over');});
    div.addEventListener('dragleave',()=>div.classList.remove('drag-over'));
    div.addEventListener('drop',e=>{e.preventDefault();div.classList.remove('drag-over');const from=parseInt(e.dataTransfer.getData('text/plain'));if(from===i)return;const moved=S.sch.splice(from,1)[0];S.sch.splice(i,0,moved);sv();rMSCL();});
    c.appendChild(div);
  });
}
function tgSC(ev,id){if(ev)ev.stopPropagation();const sc=S.sch.find(x=>x.id===id);if(sc)sc.on=!sc.on;sv();rMSCL();rS();}
function oESC(id){_escId=id;const sc=id?S.sch.find(x=>x.id===id):null;document.getElementById('escT').textContent=id?'Edit Schedule Entry':'Add Schedule Entry';const mid=sc?.mid||'';const grp=sc?.grp||'';document.getElementById('escSI').value=mid;document.getElementById('escGr').value=grp;const supItems=sortedSm().map(m=>({v:m.id,label:m.name,sub:(m.mfr||'')+' \u00b7 '+(m.units||'')}));const grpItems=gSuppGroups().map(g=>({v:g.id,label:g.lb}));setHiddenPick('escSI','escSILbl',mid,supItems,id?'':'— select supplement —');setHiddenPick('escGr','escGrLbl',grp,grpItems,id?'':'— select group —');document.getElementById('escQ').value=sc?.qty||1;document.getElementById('escTg').value=sc?.tag||'';document.getElementById('escDl').style.display=id?'block':'none';rEscUnitsHint();openOvPush('ovESC');}
function rEscUnitsHint(){const mid=document.getElementById('escSI')?.value;const hint=document.getElementById('escUnitsHint');if(!hint)return;const m=mid?S.sm.find(x=>x.id===mid):null;hint.textContent=m?'Units: '+m.units:'';}
function cfESC(){const d={mid:document.getElementById('escSI').value,grp:document.getElementById('escGr').value,qty:parseFloat(document.getElementById('escQ').value)||1,tag:document.getElementById('escTg').value};if(_escId){const sc=S.sch.find(x=>x.id===_escId);if(sc)Object.assign(sc,d);}else S.sch.push({id:uid(),on:true,...d});sv();popOv();rMSCL();rS();}
function dSC(){S.sch=S.sch.filter(x=>x.id!==_escId);sv();popOv();rMSCL();rS();}

// MANAGE FOOD GROUPS
function oMFGrp(){if(!S.foodGroups||!S.foodGroups.length)S.foodGroups=gFoodGroups().slice();rMFGrp();openOvRoot('ovMFGrp');}
function rMFGrp(){
  const c=document.getElementById('mfgrpL');c.innerHTML='';
  gFoodGroups().forEach((g,i)=>{
    const div=document.createElement('div');div.className='mi';div.draggable=true;div.dataset.i=i;
    div.innerHTML='<div class="mii" onclick="renameFoodGroup('+i+')"><div class="mn">'+escHTML(g)+'</div></div><div class="mia"><div class="bdl" style="padding:6px 10px;border-radius:8px;cursor:pointer;font-size:11px;flex-shrink:0;line-height:1" onclick="event.stopPropagation();delFoodGroup('+i+')">\u00d7</div><div style="color:var(--mt);padding:4px 8px;cursor:grab;font-size:18px;flex-shrink:0">&#8801;</div></div>';
    div.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(i));div.classList.add('dragging');});
    div.addEventListener('dragend',()=>div.classList.remove('dragging'));
    div.addEventListener('dragover',e=>{e.preventDefault();div.classList.add('drag-over');});
    div.addEventListener('dragleave',()=>div.classList.remove('drag-over'));
    div.addEventListener('drop',e=>{e.preventDefault();div.classList.remove('drag-over');const from=parseInt(e.dataTransfer.getData('text/plain'));if(from===i)return;const moved=S.foodGroups.splice(from,1)[0];S.foodGroups.splice(i,0,moved);sv();rMFGrp();rF();});
    c.appendChild(div);
  });
}
function renameFoodGroup(i){const old=S.foodGroups[i];const nm=prompt('Rename "'+old+'" to:',old);if(!nm||!nm.trim()||nm.trim()===old)return;const n=nm.trim();S.foodGroups[i]=n;S.fd.forEach(f=>{if(f.sec===old)f.sec=n;});sv();rMFGrp();rF();}
function delFoodGroup(i){const nm=S.foodGroups[i];const inUse=S.fd.some(f=>f.sec===nm);if(inUse&&!confirm('Foods in "'+nm+'" will move to Other. Continue?'))return;if(inUse)S.fd.forEach(f=>{if(f.sec===nm)f.sec='Other';});S.foodGroups.splice(i,1);sv();rMFGrp();rF();}
function addFoodGroup(){const nm=prompt('New group name:');if(!nm||!nm.trim())return;if(!S.foodGroups)S.foodGroups=[];if(S.foodGroups.includes(nm.trim())){shT('Group already exists');return;}S.foodGroups.push(nm.trim());sv();rMFGrp();}

// MANAGE SUPPLEMENT GROUPS
function oMSGrp(){if(!S.suppGroups||!S.suppGroups.length)S.suppGroups=JSON.parse(JSON.stringify(SGP));rMSGrp();openOvRoot('ovMSGrp');}
function rMSGrp(){
  const c=document.getElementById('msgrpL');c.innerHTML='';
  gSuppGroups().forEach((g,i)=>{
    const div=document.createElement('div');div.className='mi';div.draggable=true;div.dataset.i=i;
    div.innerHTML='<div class="mii" onclick="renameSuppGroup('+i+')"><div class="mn">'+escHTML(g.lb)+'</div></div><div class="mia"><div class="bdl" style="padding:6px 10px;border-radius:8px;cursor:pointer;font-size:11px;flex-shrink:0;line-height:1" onclick="event.stopPropagation();delSuppGroup('+i+')">\u00d7</div><div style="color:var(--mt);padding:4px 8px;cursor:grab;font-size:18px;flex-shrink:0">&#8801;</div></div>';
    div.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(i));div.classList.add('dragging');});
    div.addEventListener('dragend',()=>div.classList.remove('dragging'));
    div.addEventListener('dragover',e=>{e.preventDefault();div.classList.add('drag-over');});
    div.addEventListener('dragleave',()=>div.classList.remove('drag-over'));
    div.addEventListener('drop',e=>{e.preventDefault();div.classList.remove('drag-over');const from=parseInt(e.dataTransfer.getData('text/plain'));if(from===i)return;const moved=S.suppGroups.splice(from,1)[0];S.suppGroups.splice(i,0,moved);sv();rMSGrp();rS();rMSCL();});
    c.appendChild(div);
  });
}
function renameSuppGroup(i){const g=gSuppGroups()[i];if(!g)return;const nm=prompt('Rename "'+g.lb+'" to:',g.lb);if(!nm||!nm.trim()||nm.trim()===g.lb)return;g.lb=nm.trim();sv();rMSGrp();rS();rMSCL();}
function addSuppGroup(){const nm=prompt('New group name:');if(!nm||!nm.trim())return;if(!S.suppGroups)S.suppGroups=JSON.parse(JSON.stringify(SGP));const id='sg'+Date.now().toString(36);S.suppGroups.push({id,lb:nm.trim()});sv();rMSGrp();}
function delSuppGroup(i){const g=gSuppGroups()[i];if(!g)return;const inUse=S.sch.some(sc=>sc.grp===g.id);if(inUse&&!confirm('Schedule entries use this group. Delete those entries too?'))return;if(inUse)S.sch=S.sch.filter(sc=>sc.grp!==g.id);S.suppGroups.splice(i,1);sv();rMSGrp();rMSCL();rS();}

// FOOD
function gDFQ(fid){const logDay=isoToLocalYMD(gEDt());return S.fl.filter(e=>String(e.fid)===String(fid)&&isoToLocalYMD(e.dt)===logDay).reduce((s,e)=>s+e.qty,0);}
function gFC(f){if(f.col&&f.col!=='auto')return f.col;if(f.id==='f10'){const w=gWFQ(f.id);if(w===0)return'amber';if(w<=2)return'green';if(w===3)return'yellow';return'red';}const dq=gDFQ(f.id);const wq=gWFQ(f.id);if(f.dg>0)return dq>=f.dg?'green':'neutral';if(f.wg>0)return wq>=f.wg?'green':'neutral';return'neutral';}
function rF(){
  const c=document.getElementById('fSecs');c.innerHTML='';
  const usedSecs=[...new Set(S.fd.filter(f=>f.on).map(f=>f.sec).filter(Boolean))];
  const orderedGrps=gFoodGroups();
  const secs=[...orderedGrps.filter(g=>usedSecs.includes(g)),...usedSecs.filter(g=>!orderedGrps.includes(g))];
  secs.forEach(sec=>{
    const items=S.fd.filter(f=>f.on&&f.sec===sec);const sg=FSGS[sec];let st=0;items.forEach(f=>{st+=gDFQ(f.id);});const met=sg&&st>=sg;
    const sd=document.createElement('div');sd.innerHTML='<div class="fsb"><div class="fsn">'+sec+'</div><div class="fsp'+(met?' g':'')+'">'+( sg?st+'/'+sg+(met?' &#10003;':''):'')+'</div></div>';
    const card=document.createElement('div');card.className='card';items.forEach(f=>card.appendChild(mFR(f)));sd.appendChild(card);c.appendChild(sd);
  });
  const logIso=gEDt();const ti=S.ind.filter(i=>matchesLogDay(i.dt,logIso));
  const id=document.createElement('div');
  id.innerHTML='<div class="fsb" style="border-color:var(--yw);cursor:pointer" onclick="oInd(null)"><div class="fsn" style="color:var(--yw)">Log Indulgence</div><div class="fsp" style="color:var(--yw)">'+( ti.length?ti.length+' today':'')+'</div></div>';
  const ic=document.createElement('div');ic.className='card';
  ti.forEach(i=>{const r=document.createElement('div');r.className='inr';r.onclick=()=>oInd(i.id);r.innerHTML='<div class="int">'+escHTML(i.txt)+'</div><div class="inti">'+f12(i.dt)+'</div>';ic.appendChild(r);});
  id.appendChild(ic);c.appendChild(id);
}
function gTFQ(fid){const logDay=isoToLocalYMD(gEDt());const fs=S.flSave;return S.fl.filter(e=>String(e.fid)===String(fid)&&isoToLocalYMD(e.dt)===logDay&&(!fs||new Date(e.la)>=new Date(fs))).reduce((s,e)=>s+e.qty,0);}
function bumpFlSave(ts){const t=ts||now();S.flSave=new Date(new Date(t).getTime()+1).toISOString();}
function gWFQ(fid){const ws=wks();return S.fl.filter(e=>e.fid===fid&&isoToLocalYMD(e.dt)>=ws).reduce((s,e)=>s+e.qty,0);}
function srvHint(srv){
  if(!srv)return'';
  const s=String(srv).trim();
  const m=s.match(/^(\d+\.?\d*\s*(?:g|ml|mg|oz|tsp|tbsp|tablets?|drops?|capsules?|softgels?|cups?|pieces?|tab|lbs?|kg)\b)/i);
  if(m)return m[1].trim();
  const w=s.split(/\s+/)[0];
  return /\d/.test(w)?w:'';
}
function mFR(f){
  const dq=gTFQ(f.id);const dayTot=gDFQ(f.id);const col=gFC(f);const wq=gWFQ(f.id);
  let ms='';if(f.dg>0)ms+='Today: '+dayTot+'/'+f.dg;if(f.wg>0)ms+=(ms?' - ':'')+('Week: '+wq+'/'+f.wg);
  const cc=col==='neutral'?'':col;
  const fh=srvHint(f.srv);
  const hintSpan=fh?'<span style="font-weight:400;font-size:10px;color:var(--mt);margin-left:4px">('+escHTML(fh)+')</span>':'';
  const div=document.createElement('div');div.className='fr';
  div.innerHTML='<div class="fi" onclick="oFD(\''+f.id+'\')"><div class="fn '+cc+'">'+f.nm+(col==='green'?' &#10003;':'')+hintSpan+'</div><div class="fm '+cc+'">'+( ms||'Tap for details')+'</div></div><div class="fc"><div class="qb2" onclick="qF(\''+f.id+'\',-0.5,event)">&#8722;</div><div class="qv '+(dq===0?'z':cc)+'" id="fq-'+f.id+'">'+dq+'</div><div class="qb2" onclick="qF(\''+f.id+'\',0.5,event)">+</div></div>';
  return div;
}
function qF(fid,d,e){
  e.stopPropagation();
  const logDay=isoToLocalYMD(gEDt());
  const fs=S.flSave;
  const cur=gTFQ(fid);const next=Math.max(0,Math.round((cur+d)*10)/10);
  S.fl=S.fl.filter(x=>!(String(x.fid)===String(fid)&&isoToLocalYMD(x.dt)===logDay&&(!fs||new Date(x.la)>=new Date(fs))));
  if(next>0)S.fl.push({id:uid(),fid,dt:gEDt(),la:now(),qty:next,nt:''});
  markMod();sv();rF();
}
function oFD(fid){const f=S.fd.find(x=>x.id===fid);if(!f)return;_cFId=fid;document.getElementById('fdN').textContent=f.nm;let gs='';if(f.dg>0)gs+='Daily: '+f.dg+' servings';if(f.wg>0)gs+=(gs?' - ':'')+('Weekly: '+f.wg+'x');document.getElementById('fdG').textContent=gs||'Tracking only';document.getElementById('fdW').textContent=f.why||'';document.getElementById('fdS').textContent=f.srv||'--';document.getElementById('fdC').textContent=f.ceil||'--';document.getElementById('fdQ').value=gTFQ(fid);document.getElementById('fdNt').value='';openOvRoot('ovFD');}
function aFQ(d){const el=document.getElementById('fdQ');el.value=Math.max(0,Math.round((parseFloat(el.value||0)+d)*10)/10);}
function cfFD(){const qty=parseFloat(document.getElementById('fdQ').value)||0;const nt=document.getElementById('fdNt').value;const dt=gEDt();const logDay=isoToLocalYMD(dt);const fs=S.flSave;S.fl=S.fl.filter(e=>!(String(e.fid)===String(_cFId)&&isoToLocalYMD(e.dt)===logDay&&(!fs||new Date(e.la)>=new Date(fs))));if(qty>0)S.fl.push({id:uid(),fid:_cFId,dt,la:now(),qty,nt});markMod(dt);sv();closeAllOv();rF();document.getElementById('fdQ').value=0;document.getElementById('fdNt').value='';}
function oFDInfo(fid){
  const f=S.fd.find(x=>x.id===fid);if(!f)return;
  document.getElementById('fdiN').textContent=f.nm;let gs='';if(f.dg>0)gs+='Daily: '+f.dg+' servings';if(f.wg>0)gs+=(gs?' - ':'')+('Weekly: '+f.wg+'x');document.getElementById('fdiG').textContent=gs||'Tracking only';document.getElementById('fdiW').textContent=f.why||'';document.getElementById('fdiS').textContent=f.srv||'--';document.getElementById('fdiC').textContent=f.ceil||'--';
  const top=_ovStack.length?_ovStack[_ovStack.length-1]:'';
  if(top==='ovML'||top==='ovEM')openOvPush('ovFDInfo');else openOvRoot('ovFDInfo');
}
function oInd(id){_cIId=id;const i=id?S.ind.find(x=>x.id===id):null;document.getElementById('indT').textContent=id?'Edit Indulgence':'Log Indulgence';document.getElementById('indTx').value=i?i.txt:'';document.getElementById('indNt').value=i?(i.nt||''):'';document.getElementById('indDl').style.display=id?'block':'none';openOvRoot('ovIND');}
function cfInd(){const txt=document.getElementById('indTx').value.trim();const nt=document.getElementById('indNt').value;if(!txt){closeAllOv();return;}const dt=gEDt();if(_cIId){const i=S.ind.find(x=>x.id===_cIId);if(i){i.txt=txt;i.nt=nt;markMod(i.dt);}}else{S.ind.push({id:uid(),dt,la:now(),txt,nt});markMod(dt);}sv();closeAllOv();rF();document.getElementById('indTx').value='';document.getElementById('indNt').value='';}
function dInd(){markMod(S.ind.find(x=>x.id===_cIId)?.dt);S.ind=S.ind.filter(x=>x.id!==_cIId);sv();closeAllOv();rF();}

// MEALS
function mkFP(mItems,pfx){
  const ordSecs=gFoodGroups();const usedSecs=[...new Set(S.fd.filter(f=>f.on).map(f=>f.sec).filter(Boolean))];
  const secs=[...ordSecs.filter(s=>usedSecs.includes(s)),...usedSecs.filter(s=>!ordSecs.includes(s))];
  return secs.map(sec=>{
    const items=S.fd.filter(f=>f.on&&f.sec===sec);
    const rows=items.map(f=>{
      const mi=mItems.find(x=>x.nm===f.nm);const qty=mi?mi.qty:0;
      const fh=srvHint(f.srv);
      const hintSpan=fh?'<span style="font-weight:400;font-size:10px;color:var(--mt);margin-left:4px">('+escHTML(fh)+')</span>':'';
      const col=qty===0?'color:var(--mt)':'color:var(--gr)';
      return'<div class="mfp-row">'
        +'<div class="mfp-name" onclick="oFDInfo(\''+f.id+'\')">'+escHTML(f.nm)+hintSpan+'</div>'
        +'<div class="fc">'
          +'<div class="qb2" onclick="adjQ(\''+pfx+'-'+f.id+'\',-0.5)">&#8722;</div>'
          +'<div class="qv" id="'+pfx+'-'+f.id+'-disp" style="'+col+'">'+qty+'</div>'
          +'<input type="hidden" id="'+pfx+'-'+f.id+'" value="'+qty+'">'
          +'<div class="qb2" onclick="adjQ(\''+pfx+'-'+f.id+'\',0.5)">+</div>'
        +'</div>'
      +'</div>';
    }).join('');
    return'<div class="mfp-sec"><div class="mfp-st">'+sec+'</div>'+rows+'</div>';
  }).join('');
}
function adjQ(id,d){
  const el=document.getElementById(id);if(!el)return;
  const v=Math.max(0,Math.round((parseFloat(el.value||0)+d)*10)/10);
  el.value=v;
  const disp=document.getElementById(id+'-disp');
  if(disp){disp.textContent=v;disp.style.color=v===0?'var(--mt)':'var(--gr)';}
}
function oMP(){const act=S.meals.filter(m=>m.on!==false);if(!act.length){shT('No meals yet');return;}rMPList();openOvRoot('ovMP');}
function ldM(mid){const m=S.meals.find(x=>x.id===mid);if(!m)return;_cMId=mid;document.getElementById('mlN').textContent=m.nm;document.getElementById('mlNt').value=m.nt||'';document.getElementById('mlIt').innerHTML=mkFP(m.items||[],'ml');openOvPush('ovML');}
function cfML(upd){
  const m=S.meals.find(x=>x.id===_cMId);
  if(!m){shT('Open a meal first');return;}
  const mlRoot=document.getElementById('mlIt');
  if(mlRoot){const ae=document.activeElement;if(ae&&mlRoot.contains(ae)&&typeof ae.blur==='function')ae.blur();}
  const nt=document.getElementById('mlNt').value;
  const dt=gEDt();
  const logDay=isoToLocalYMD(dt);
  const saveTs=now();
  const activeFoods=S.fd.filter(f=>f.on);
  const activeFoodIds=new Set(activeFoods.map(f=>String(f.id)));
  const prevFs=S.flSave;
  // Remove only current-session entries for today's active foods; preserve history (pre-flSave)
  S.fl=S.fl.filter(e=>e.fid==='__meal__'||!activeFoodIds.has(String(e.fid))||isoToLocalYMD(e.dt)!==logDay||(prevFs&&new Date(e.la)<new Date(prevFs)));
  const newItems=[];
  activeFoods.forEach(f=>{
    const inp=mlRoot?mlRoot.querySelector('input[id="ml-'+f.id+'"]'):null;
    let qty=0;
    if(inp){
      const vn=inp.valueAsNumber;
      if(Number.isFinite(vn)&&vn>0)qty=vn;
      else{const pv=parseFloat(String(inp.value||'').replace(/,/g,'.'));if(pv>0)qty=pv;}
    }
    if(qty>0){S.fl.push({id:uid(),fid:f.id,dt,la:saveTs,qty,nt:''});newItems.push({nm:f.nm,qty});}
  });
  bumpFlSave(saveTs);
  if(upd===true){m.items=newItems;if(nt)m.nt=nt;}
  S.fl.push({id:uid(),fid:'__meal__',mnm:m.nm,dt,la:saveTs,qty:1,nt});
  markMod(dt);sv();closeAllOv();_cMId=null;
  if(mlRoot)mlRoot.innerHTML='';
  document.getElementById('mlNt').value='';
  S.gdt=null;rH();
  // Navigate to food tab and reset
  const ft=document.querySelector('.tab[onclick*="\'food\'"]');if(ft)sw('food',ft);else rF();
  shT(upd===true?'Saved + Updated':'Saved');
}
function oMM(){rMML();openOvRoot('ovMM');}
function rMML(){
  const c=document.getElementById('mmL');c.innerHTML='';
  S.meals.forEach((m,i)=>{
    const div=document.createElement('div');div.className='mi'+(m.on!==false?'':' di');div.draggable=true;div.dataset.i=i;
    div.innerHTML='<div class="mii" onclick="oEM(\''+m.id+'\')"><div class="mn">'+m.nm+'</div><div class="mm">'+( m.items||[]).filter(x=>x.qty>0).length+' items</div></div><div class="mia"><div class="tg'+(m.on!==false?' on':'')+'" onclick="tgML(\''+m.id+'\')"></div><div style="color:var(--mt);padding:4px 8px;cursor:grab;font-size:18px;flex-shrink:0">&#8801;</div></div>';
    div.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(i));div.classList.add('dragging');});
    div.addEventListener('dragend',()=>div.classList.remove('dragging'));
    div.addEventListener('dragover',e=>{e.preventDefault();div.classList.add('drag-over');});
    div.addEventListener('dragleave',()=>div.classList.remove('drag-over'));
    div.addEventListener('drop',e=>{e.preventDefault();div.classList.remove('drag-over');const from=parseInt(e.dataTransfer.getData('text/plain'));if(from===i)return;const moved=S.meals.splice(from,1)[0];S.meals.splice(i,0,moved);sv();rMML();});
    c.appendChild(div);
  });
}
function tgML(id){const m=S.meals.find(x=>x.id===id);if(m)m.on=m.on===false?true:false;sv();rMML();}
function oEM(id){_emId=id;const m=id?S.meals.find(x=>x.id===id):null;document.getElementById('emT').textContent=id?'Edit Meal':'Add Meal';document.getElementById('emNm').value=m?.nm||'';document.getElementById('emNt').value=m?.nt||'';document.getElementById('emFoodPicker').innerHTML=mkFP(m?.items||[],'em');document.getElementById('emDl').style.display=id?'block':'none';openOvPush('ovEM');}
function cfEM(){const nm=document.getElementById('emNm').value.trim();if(!nm)return;const nt=document.getElementById('emNt').value;const items=[];S.fd.filter(f=>f.on).forEach(f=>{const el=document.getElementById('em-'+f.id);const qty=parseFloat(el?.value||0)||0;if(qty>0)items.push({nm:f.nm,qty});});if(_emId){const m=S.meals.find(x=>x.id===_emId);if(m)Object.assign(m,{nm,items,nt});}else S.meals.push({id:uid(),nm,items,nt,on:true});sv();popOv();rMML();}
function dMl(){S.meals=S.meals.filter(x=>x.id!==_emId);sv();popOv();rMML();}
function oMF(){rMFL();openOvRoot('ovMF');}
function rMFL(){
  const c=document.getElementById('mfL');c.innerHTML='';
  S.fd.forEach((f,i)=>{
    const div=document.createElement('div');div.className='mi'+(f.on?'':' di');div.draggable=true;div.dataset.i=i;
    div.innerHTML='<div class="mii" onclick="oEFI(\''+f.id+'\')"><div class="mn">'+escHTML(f.nm)+'</div><div class="mm">'+escHTML(f.sec)+' - '+(f.dg>0?f.dg+'/day':f.wg>0?f.wg+'/wk':'no goal')+'</div></div><div class="mia"><div class="tg'+(f.on?' on':'')+'" onclick="tgFI(\''+f.id+'\')"></div><div style="color:var(--mt);padding:4px 8px;cursor:grab;font-size:18px;flex-shrink:0">&#8801;</div></div>';
    div.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(i));div.classList.add('dragging');});
    div.addEventListener('dragend',()=>div.classList.remove('dragging'));
    div.addEventListener('dragover',e=>{e.preventDefault();div.classList.add('drag-over');});
    div.addEventListener('dragleave',()=>div.classList.remove('drag-over'));
    div.addEventListener('drop',e=>{e.preventDefault();div.classList.remove('drag-over');const from=parseInt(e.dataTransfer.getData('text/plain'));if(from===i)return;const moved=S.fd.splice(from,1)[0];S.fd.splice(i,0,moved);sv();rMFL();});
    c.appendChild(div);
  });
}
function tgFI(id){const f=S.fd.find(x=>x.id===id);if(f)f.on=!f.on;sv();rMFL();rF();}
function oEFI(id){_efiId=id;const f=id?S.fd.find(x=>x.id===id):null;document.getElementById('efiT').textContent=id?'Edit Food':'Add Food';document.getElementById('efiNm').value=f?.nm||'';const sec=f?.sec||'';const grps=gFoodGroups();const items=grps.map(g=>({v:g,label:g}));if(sec&&!grps.includes(sec))items.push({v:sec,label:sec});document.getElementById('efiSc').value=sec;setHiddenPick('efiSc','efiScLbl',sec,items,id&&sec?'':'— select group —');document.getElementById('efiDG').value=f?.dg||0;document.getElementById('efiWG').value=f?.wg||0;document.getElementById('efiSv').value=f?.srv||'';document.getElementById('efiCl').value=f?.ceil||'';document.getElementById('efiCo').value=f?.col||'auto';document.getElementById('efiWy').value=f?.why||'';document.getElementById('efiDl').style.display=id?'block':'none';openOvPush('ovEFI');}
function cfEFI(){const d={nm:document.getElementById('efiNm').value,sec:document.getElementById('efiSc').value,dg:parseFloat(document.getElementById('efiDG').value)||0,wg:parseInt(document.getElementById('efiWG').value)||0,srv:document.getElementById('efiSv').value,ceil:document.getElementById('efiCl').value,col:document.getElementById('efiCo').value||'auto',why:document.getElementById('efiWy').value};if(_efiId){const f=S.fd.find(x=>x.id===_efiId);if(f)Object.assign(f,d);}else S.fd.push({id:uid(),on:true,...d});sv();popOv();rMFL();rF();}
function dFI(){S.fd=S.fd.filter(x=>x.id!==_efiId);sv();popOv();rMFL();rF();}

// OTHER
function actQuickField(a){
  if(a.inline===false)return null;
  if(!a.flds||a.flds.length!==1)return null;
  const f=a.flds[0];
  if(f.t==='yesno')return{field:f,type:'yesno'};
  if(f.t==='opts'&&f.opts&&f.opts.length>=1&&f.opts.length<=5)return{field:f,type:'opts'};
  return null;
}
function pendOtherAct(aid,fieldNm,val){
  if(_otherSt[aid]&&_otherSt[aid].val===val){delete _otherSt[aid];}
  else{_otherSt[aid]={fieldNm,val};}
  rA();
}
function rA(){
  const c=document.getElementById('aList');c.innerHTML='';
  const day=logDateKey();
  S.acts.filter(a=>a.on).forEach(a=>{
    const todayAL=S.al.filter(e=>e.aid===a.id&&isoToLocalYMD(e.dt)===day);
    const card=document.createElement('div');
    const qf=actQuickField(a);
    if(qf){
      const stacked=qf.type==='opts'&&qf.field.opts.length>=3;
      card.className='ac ac-ql'+(stacked?' ac-ql-st':'');
      const pend=_otherSt[a.id];
      const left=document.createElement('div');left.className='acl';left.onclick=()=>oAE(a.id,null);
      const sub=todayAL.length?(todayAL.length+' logged \u2014 tap for new entry'+(pend?' · pending: '+pend.val:'')):(pend?'Pending: '+pend.val:'Tap for new entry · name for notes');
      left.innerHTML='<div class="an">'+escHTML(a.nm)+'</div><div class="as2" style="color:'+(pend?'var(--or)':'var(--mt)')+'">'+escHTML(sub)+'</div>';
      const btnsDiv=document.createElement('div');btnsDiv.className='aq';
      const opts=qf.type==='yesno'?['Yes','No']:qf.field.opts.map(o=>o.v);
      opts.forEach(v=>{
        const isPend=pend&&pend.val===v;
        const b=document.createElement('div');
        b.className='aqb'+(isPend?' aqbp':'');
        b.textContent=v;
        b.addEventListener('click',ev=>{ev.stopPropagation();pendOtherAct(a.id,qf.field.nm,v);});
        btnsDiv.appendChild(b);
      });
      card.appendChild(left);card.appendChild(btnsDiv);
    }else{
      const le=todayAL.length?todayAL[todayAL.length-1]:null;
      card.className='ac';card.onclick=()=>oAE(a.id,null);
      let fh=le?a.flds.map(f=>{const v=le.flds[f.nm];if(f.t==='opts')return(v!==undefined&&v!=='')?'<div class="ach">'+escHTML(f.nm)+': '+escHTML(String(v))+'</div>':'';return(v!==undefined&&v!=='')? '<div class="ach">'+escHTML(f.nm)+': '+escHTML(String(v))+(f.u&&f.t==='number'?' '+escHTML(f.u):'')+'</div>':''}).join(''):a.flds.filter(f=>f.t!=='text').map(f=>f.t==='opts'?'<div class="ach">'+escHTML(f.nm)+' ('+(f.opts||[]).length+' choices)</div>':'<div class="ach">'+escHTML(f.nm)+(f.u?' ('+escHTML(f.u)+')':'')+'</div>').join('');
      card.innerHTML='<div><div class="an">'+escHTML(a.nm)+'</div><div class="as2">'+(todayAL.length?todayAL.length+' logged \u2014 tap for new':'Tap to log')+(le?' \xb7 last '+f12(le.dt):'')+'</div></div><div class="af">'+fh+'</div>';
    }
    c.appendChild(card);
  });
}
function oAE(aid,logId){
  const a=S.acts.find(x=>x.id===aid);if(!a)return;_cATId=aid;_cALId=logId||null;
  const ex=_cALId?S.al.find(x=>x.id===_cALId):null;
  document.getElementById('aeN').textContent=a.nm;document.getElementById('aeNt').value=ex?(ex.nt||''):'';
  const fd=document.getElementById('aeFlds');fd.innerHTML='';
  a.flds.forEach(f=>{
    const val=ex&&ex.flds?ex.flds[f.nm]:'';const div=document.createElement('div');div.className='fld';
    if(f.t==='opts'){
      const slug=f.nm.replace(/\s/g,'_');const opts=f.opts||[];
      const hidVal=(val!==undefined&&val!==null&&val!=='')?String(val):'';
      div.innerHTML='<div class="fl">'+escHTML(f.nm)+'</div><div class="bwg" id="pickBox-'+slug+'"></div><input type="hidden" id="pickVal-'+slug+'" value="'+escHTML(hidVal)+'">';
      fd.appendChild(div);
      const inner=document.getElementById('pickBox-'+slug);
      if(!opts.length)inner.innerHTML='<div style="font-size:11px;color:var(--mt);padding:8px">No choices defined for this field.</div>';
      else opts.forEach(o=>{
        const row=document.createElement('div');row.className='bwo'+(hidVal===o.v?' sel':'');
        row.onclick=()=>{document.querySelectorAll('#pickBox-'+slug+' .bwo').forEach(x=>x.classList.remove('sel'));row.classList.add('sel');document.getElementById('pickVal-'+slug).value=o.v;};
        row.innerHTML='<div class="bwon">'+escHTML(o.v)+'</div><div class="bwod">'+escHTML(o.d||'')+'</div>';
        inner.appendChild(row);
      });
      return;
    }
    if(f.t==='number'){
      const idN='num-'+f.nm.replace(/\s/g,'_');
      const ulow=(f.u||'').toLowerCase();
      const isMin=ulow==='minutes'||ulow==='minute'||ulow==='min';
      const isFahr=f.u==='F'||ulow==='f'||ulow==='fahrenheit'||ulow==='\u00b0f';
      let numVal='';
      if(val!==undefined&&val!=='')numVal=String(val);
      else if(f.def!==undefined&&f.def!==null&&isFinite(Number(f.def)))numVal=String(f.def);
      else if(!isMin&&!isFahr)numVal='0';
      if(isMin){
        const maxM=300;const selVal=Math.min(maxM,Math.max(0,parseInt(numVal,10)||0));
        const opts=Array.from({length:maxM+1},(_,m)=>'<option value="'+m+'"'+(m===selVal?' selected':'')+'>'+m+'</option>').join('');
        div.innerHTML='<div class="fl">'+escHTML(f.nm)+(f.u?' ('+escHTML(f.u)+')':'')+'</div><select id="'+idN+'">'+opts+'</select>';
        fd.appendChild(div);
        return;
      }
      if(isFahr){
        const minT=32,maxT=120;
        let selVal=parseInt(numVal,10);if(!isFinite(selVal))selVal=55;
        selVal=Math.min(maxT,Math.max(minT,selVal));
        const opts=Array.from({length:maxT-minT+1},(_,i)=>{const tt=minT+i;return'<option value="'+tt+'"'+(tt===selVal?' selected':'')+'>'+tt+' \u00b0F</option>';}).join('');
        div.innerHTML='<div class="fl">'+escHTML(f.nm)+(f.u?' ('+escHTML(f.u)+')':'')+'</div><select id="'+idN+'">'+opts+'</select>';
        fd.appendChild(div);
        return;
      }
      const max=f.u==='seconds'?599:2000;
      div.innerHTML='<div class="fl">'+escHTML(f.nm)+(f.u?' ('+escHTML(f.u)+')':'')+'</div><input type="number" id="'+idN+'" step="1" min="0" max="'+max+'" value="'+escHTML(numVal)+'">';
      fd.appendChild(div);
      return;
    }else if(f.t==='yesno'){const ys=f.nm.replace(/\s/g,'_');div.innerHTML='<div class="fl">'+escHTML(f.nm)+'</div><div style="display:flex;gap:9px"><button class="'+(val==='Yes'?'blg':'bcn')+'" id="yn-y-'+ys+'" onclick="togYN(\''+ys+'\',\'Yes\')">Yes</button><button class="'+(val==='No'?'blg':'bcn')+'" id="yn-n-'+ys+'" onclick="togYN(\''+ys+'\',\'No\')">No</button></div>';}
    else{const as=f.nm.replace(/\s/g,'_');div.innerHTML='<div class="fl">'+escHTML(f.nm)+'</div><textarea id="af-'+as+'"></textarea>';const tael=div.querySelector('textarea');if(tael)tael.value=val||'';}
    fd.appendChild(div);
  });
  if(ex)document.getElementById('aeDl').style.display='block';else document.getElementById('aeDl').style.display='none';
  document.getElementById('ovAE').dataset.aid=aid;openOvRoot('ovAE');
}
function togYN(slug,val){const y=document.getElementById('yn-y-'+slug),n=document.getElementById('yn-n-'+slug);if(y)y.className=val==='Yes'?'blg':'bcn';if(n)n.className=val==='No'?'blg':'bcn';}
function cfAE(){const a=S.acts.find(x=>x.id===_cATId);if(!a)return;
  for(const f of a.flds){if(f.t==='opts'){const slug=f.nm.replace(/\s/g,'_');const h=document.getElementById('pickVal-'+slug);if(!h||!String(h.value||'').trim()){shT('Select: '+f.nm);return;}}}
  const dt=gEDt();const nt=document.getElementById('aeNt').value;const flds={};
a.flds.forEach(f=>{if(f.t==='number'){const idN='num-'+f.nm.replace(/\s/g,'_');const el=document.getElementById(idN);if(el)flds[f.nm]=el.tagName==='SELECT'?parseInt(el.value,10)||0:(parseFloat(el.value)||0);}else if(f.t==='opts'){const slug=f.nm.replace(/\s/g,'_');const h=document.getElementById('pickVal-'+slug);if(h)flds[f.nm]=h.value||'';}else if(f.t==='yesno'){const ys=f.nm.replace(/\s/g,'_');const yy=document.getElementById('yn-y-'+ys);flds[f.nm]=yy&&yy.classList.contains('blg')?'Yes':'No';}else{const el=document.getElementById('af-'+f.nm.replace(/\s/g,'_'));if(el)flds[f.nm]=el.value;}});
if(_cALId){const e=S.al.find(x=>x.id===_cALId);if(e){e.dt=dt;e.flds=flds;e.nt=nt;markMod(dt);}}else{S.al.push({id:uid(),aid:_cATId,dt,la:now(),flds,nt});markMod(dt);}sv();closeAllOv();S.gdt=null;rH();rA();document.getElementById('aeNt').value='';}
function dAE(){markMod(S.al.find(x=>x.id===_cALId)?.dt);S.al=S.al.filter(x=>x.id!==_cALId);sv();closeAllOv();S.gdt=null;rH();rA();}
function oMA(){rMAL();openOvRoot('ovMA');}
function rMAL(){
  const c=document.getElementById('maL');c.innerHTML='';
  S.acts.forEach((a,i)=>{
    const div=document.createElement('div');div.className='mi'+(a.on?'':' di');div.draggable=true;div.dataset.i=i;
    div.innerHTML='<div class="mii" onclick="oEAT(\''+a.id+'\')"><div class="mn">'+escHTML(a.nm)+'</div><div class="mm">'+a.flds.length+' fields</div></div><div class="mia"><div class="tg'+(a.on?' on':'')+'" onclick="tgA(\''+a.id+'\')"></div><div style="color:var(--mt);padding:4px 8px;cursor:grab;font-size:18px;flex-shrink:0">&#8801;</div></div>';
    div.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(i));div.classList.add('dragging');});
    div.addEventListener('dragend',()=>div.classList.remove('dragging'));
    div.addEventListener('dragover',e=>{e.preventDefault();div.classList.add('drag-over');});
    div.addEventListener('dragleave',()=>div.classList.remove('drag-over'));
    div.addEventListener('drop',e=>{e.preventDefault();div.classList.remove('drag-over');const from=parseInt(e.dataTransfer.getData('text/plain'));if(from===i)return;const moved=S.acts.splice(from,1)[0];S.acts.splice(i,0,moved);sv();rMAL();});
    c.appendChild(div);
  });
}
function tgA(id){const a=S.acts.find(x=>x.id===id);if(a)a.on=!a.on;sv();rMAL();rA();}
function oEAT(id){_eatId=id;const a=id?S.acts.find(x=>x.id===id):null;document.getElementById('eatT').textContent=id?'Edit Type':'New Entry Type';document.getElementById('eatNm').value=a?.nm||'';clrEatFldErr();const list=document.getElementById('eatFldList');list.innerHTML='';(a?.flds||[]).forEach(f=>addFldRow(f));document.getElementById('eatDl').style.display=id?'block':'none';document.getElementById('eatAddFld').style.display=(a?.flds||[]).length>=5?'none':'block';document.getElementById('eatInline').classList.toggle('on',a?.inline!==false);openOvPush('ovEAT');}
function eatRowType(row){
  const tb=row.querySelector('.ftb.sel');
  if(!tb)return'number';
  const x=tb.textContent;
  if(x==='Num')return'number';
  if(x==='Y/N')return'yesno';
  if(x==='List')return'opts';
  return'text';
}
function appendEatOptRow(wrap,addBtn,o){
  const div=document.createElement('div');div.className='fld eat-opt-row';
  const fr=document.createElement('div');fr.className='fr2';
  const f1=document.createElement('div');f1.className='fld';
  const l1=document.createElement('div');l1.className='fl';l1.style.fontSize='8px';l1.textContent='Choice label';
  const vi=document.createElement('input');vi.type='text';vi.className='eat-opt-v';vi.placeholder='e.g. Happy';vi.value=o?.v||'';
  vi.addEventListener('input',()=>vi.classList.remove('eat-miss-err'));
  f1.appendChild(l1);f1.appendChild(vi);
  const fx=document.createElement('div');fx.className='fld';fx.style.flex='0 0 auto';
  const lx=document.createElement('div');lx.className='fl';lx.innerHTML='&nbsp;';
  const rm=document.createElement('div');rm.textContent='\u00d7';rm.style.cssText='color:var(--rd);cursor:pointer;padding:10px 8px;font-size:18px;line-height:1';
  rm.onclick=()=>div.remove();
  fx.appendChild(lx);fx.appendChild(rm);
  fr.appendChild(f1);fr.appendChild(fx);
  const f2=document.createElement('div');f2.className='fld';
  const l2=document.createElement('div');l2.className='fl';l2.style.fontSize='8px';l2.textContent='Explanation';
  const ta=document.createElement('textarea');ta.className='eat-opt-d';ta.placeholder='When to pick this...';ta.value=o?.d||'';ta.style.height='44px';
  f2.appendChild(l2);f2.appendChild(ta);
  div.appendChild(fr);div.appendChild(f2);
  wrap.insertBefore(div,addBtn);
}
function mkEatOptsWrap(f){
  const wrap=document.createElement('div');wrap.className='eat-opts-wrap';
  const addBtn=document.createElement('button');addBtn.type='button';addBtn.className='bcn';addBtn.style.width='100%';addBtn.style.marginTop='8px';addBtn.textContent='+ Add choice';addBtn.onclick=()=>appendEatOptRow(wrap,addBtn,null);
  wrap.appendChild(addBtn);
  (f?.opts||[]).forEach(o=>appendEatOptRow(wrap,addBtn,o));
  if(!(f?.opts||[]).length)appendEatOptRow(wrap,addBtn,null);
  return wrap;
}
function addFldRow(f){
  const list=document.getElementById('eatFldList');if(list.children.length>=5){shT('Max 5 fields');return;}
  const t=f?.t||'number';
  const row=document.createElement('div');row.className='fld-type-row';
  if(t==='opts'&&f?.nm)row.dataset.listKey=f.nm;
  if(t!=='opts'){
    const wrap=document.createElement('div');wrap.className='eat-fld-nm-wrap';
    const nmInp=document.createElement('input');nmInp.type='text';nmInp.className='eat-fld-nm';nmInp.placeholder='Field name (e.g. Duration)';nmInp.value=f?.nm||'';
    nmInp.addEventListener('input',()=>nmInp.classList.remove('eat-miss-err'));
    wrap.appendChild(nmInp);row.appendChild(wrap);
  }
  function mkFT(lbl,typ,on){const b=document.createElement('div');b.className='ftb'+(on?' sel':'');b.textContent=lbl;b.onclick=()=>setFT(b,typ);return b;}
  row.appendChild(mkFT('Num','number',t==='number'));row.appendChild(mkFT('Text','text',t==='text'));row.appendChild(mkFT('Y/N','yesno',t==='yesno'));row.appendChild(mkFT('List','opts',t==='opts'));
  const rm=document.createElement('div');rm.style.cssText='cursor:pointer;color:var(--rd);font-size:16px;flex-shrink:0;padding:6px';rm.textContent='\u00d7';rm.onclick=()=>rmFldRow(rm);row.appendChild(rm);
  if(t==='number'){
    const ui=document.createElement('input');ui.type='text';ui.className='fld-u';ui.placeholder='Unit (e.g. minutes, F)';ui.value=f?.u||'';ui.style.marginTop='6px';row.appendChild(ui);
    const di=document.createElement('input');di.type='number';di.className='fld-def';di.placeholder='Default # (optional)';di.style.marginTop='6px';if(f?.def!==undefined&&f.def!==null&&String(f.def)!=='')di.value=f.def;row.appendChild(di);
  }else if(t==='opts')row.appendChild(mkEatOptsWrap(f));
  list.appendChild(row);document.getElementById('eatAddFld').style.display=list.children.length>=5?'none':'block';
}
function setFT(btn,t){
  const row=btn.closest('.fld-type-row');
  row.querySelectorAll('.ftb').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');
  row.querySelector('.fld-u')?.remove();row.querySelector('.fld-def')?.remove();row.querySelector('.eat-opts-wrap')?.remove();
  if(t==='opts'){
    row.querySelector('.eat-fld-nm-wrap')?.remove();
    delete row.dataset.listKey;
    row.appendChild(mkEatOptsWrap(null));
    return;
  }
  if(!row.querySelector('input.eat-fld-nm')){
    const wrap=document.createElement('div');wrap.className='eat-fld-nm-wrap';
    const nmInp=document.createElement('input');nmInp.type='text';nmInp.className='eat-fld-nm';nmInp.placeholder='Field name (e.g. Duration)';
    nmInp.addEventListener('input',()=>nmInp.classList.remove('eat-miss-err'));
    wrap.appendChild(nmInp);row.insertBefore(wrap,row.firstChild);
  }
  delete row.dataset.listKey;
  if(t==='number'){
    const ui=document.createElement('input');ui.type='text';ui.className='fld-u';ui.placeholder='Unit (e.g. minutes, F)';ui.style.marginTop='6px';row.appendChild(ui);
    const di=document.createElement('input');di.type='number';di.className='fld-def';di.placeholder='Default # (optional)';di.style.marginTop='6px';row.appendChild(di);
  }
}
function rmFldRow(el){const list=document.getElementById('eatFldList');el.closest('.fld-type-row').remove();document.getElementById('eatAddFld').style.display=list.children.length>=5?'none':'block';}
function clrEatFldErr(){
  const en=document.getElementById('eatNm');if(en)en.classList.remove('eat-miss-err');
  document.querySelectorAll('#eatFldList .eat-miss-err').forEach(el=>el.classList.remove('eat-miss-err'));
}
function cfEAT(){
  clrEatFldErr();
  const nm=document.getElementById('eatNm').value.trim();
  if(!nm){document.getElementById('eatNm').classList.add('eat-miss-err');document.getElementById('eatNm').scrollIntoView({behavior:'smooth',block:'nearest'});shT('Enter a type name');return;}
  const rows=[...document.querySelectorAll('#eatFldList .fld-type-row')];
  const listRowsCount=rows.filter(r=>eatRowType(r)==='opts').length;
  let listOrdinal=0;
  const flds=[];
  for(const row of rows){
    const t=eatRowType(row);
    if(t==='opts'){
      listOrdinal++;
      const opts=[];let firstEmptyInp=null;
      row.querySelectorAll('.eat-opt-row').forEach(sub=>{
        const vi=sub.querySelector('.eat-opt-v');
        const v=vi?.value.trim()||'';
        const d=sub.querySelector('.eat-opt-d')?.value.trim()||'';
        if(!v){if(vi&&!firstEmptyInp)firstEmptyInp=vi;return;}
        opts.push({v,d});
      });
      if(!opts.length){
        if(firstEmptyInp){firstEmptyInp.classList.add('eat-miss-err');firstEmptyInp.scrollIntoView({behavior:'smooth',block:'nearest'});}
        const fieldLabel=(row.dataset.listKey&&row.dataset.listKey.trim())||nm;
        shT('List field "'+fieldLabel+'" needs at least one choice with a label');return;
      }
      const persisted=(row.dataset.listKey&&row.dataset.listKey.trim())||'';
      const fieldKey=persisted||(listRowsCount===1?nm:(listOrdinal===1?nm:nm+' ('+listOrdinal+')'));
      flds.push({nm:fieldKey,t:'opts',opts});
      continue;
    }
    const nameInp=row.querySelector('input.eat-fld-nm');
    const n=(nameInp?.value||'').trim();
    if(!n){nameInp?.classList.add('eat-miss-err');nameInp?.scrollIntoView({behavior:'smooth',block:'nearest'});shT('Enter a field name (or remove the row with \u00d7)');return;}
    const uIn=row.querySelector('input.fld-u');const dIn=row.querySelector('input.fld-def');
    const u=t==='number'?(uIn?.value||''):'';
    let def=undefined;if(t==='number'&&dIn&&dIn.value!==''){const dv=parseFloat(dIn.value);if(isFinite(dv))def=dv;}
    const o={nm:n,t,u};if(def!==undefined)o.def=def;
    flds.push(o);
  }
  const inlineOn=document.getElementById('eatInline').classList.contains('on');
  const d={nm,flds};if(!inlineOn)d.inline=false;
  if(_eatId){const a=S.acts.find(x=>x.id===_eatId);if(a){a.nm=d.nm;a.flds=d.flds;if(!inlineOn)a.inline=false;else delete a.inline;}}else S.acts.push({id:uid(),on:true,...d});sv();popOv();rMAL();rA();
}
function dAT(){S.acts=S.acts.filter(x=>x.id!==_eatId);sv();popOv();rMAL();rA();}

// NOTES
function svQuickNote(){const el=document.getElementById('noteQuick');const bd=el?el.value.trim():'';if(!bd)return;const dt=gEDt();S.notes.push({id:uid(),dt,la:now(),bd});markMod(dt);sv();el.value='';el.classList.remove('note-dirty');rN();shT('Note saved');}
function svFoodNote(){const el=document.getElementById('foodNoteQuick');const bd=el?el.value.trim():'';if(!bd)return;const dt=gEDt();S.fnotes.push({id:uid(),dt,la:now(),bd});markMod(dt);sv();el.value='';el.classList.remove('note-dirty');rF();}
function svSuppNote(){const el=document.getElementById('suppNoteQuick');const bd=el?el.value.trim():'';if(!bd)return;const dt=gEDt();S.snotes.push({id:uid(),dt,la:now(),bd});markMod(dt);sv();el.value='';el.classList.remove('note-dirty');rS();}
function rN(){
  const day=logDateKey();
  const tn=S.notes.filter(n=>isoToLocalYMD(n.dt)===day).sort((a,b)=>b.dt.localeCompare(a.dt));
  const c=document.getElementById('nList');
  if(!tn.length){c.innerHTML='<div style="color:var(--mt);font-family:Courier New,monospace;font-size:10px;padding:10px 0;text-align:center">No notes today</div>';return;}
  c.innerHTML=tn.map(n=>'<div class="nc" onclick="oNoteEdit(\''+n.id+'\')"><div class="nh"><div class="nti">'+f12(n.dt)+'</div></div><div class="nb">'+n.bd+'</div></div>').join('');
}
function oNoteEdit(id){_cNId=id;_cFNId=null;_cSNId=null;const n=id?S.notes.find(x=>x.id===id):null;document.getElementById('neBd').value=n?.bd||'';document.getElementById('neDl').style.display=id?'block':'none';openOvRoot('ovNoteEdit');}
function oFNEdit(id){_cFNId=id;_cNId=null;_cSNId=null;const n=id?S.fnotes.find(x=>x.id===id):null;document.getElementById('neBd').value=n?.bd||'';document.getElementById('neDl').style.display=id?'block':'none';openOvRoot('ovNoteEdit');}
function oSNEdit(id){_cSNId=id;_cNId=null;_cFNId=null;const n=id?S.snotes.find(x=>x.id===id):null;document.getElementById('neBd').value=n?.bd||'';document.getElementById('neDl').style.display=id?'block':'none';openOvRoot('ovNoteEdit');}
function cfNE(){const bd=document.getElementById('neBd').value;const dt=gEDt();if(_cSNId){const n=S.snotes.find(x=>x.id===_cSNId);if(n){n.bd=bd;markMod(n.dt);}sv();closeAllOv();rS();return;}if(_cFNId){const n=S.fnotes.find(x=>x.id===_cFNId);if(n){n.bd=bd;markMod(n.dt);}sv();closeAllOv();rF();return;}if(_cNId){const n=S.notes.find(x=>x.id===_cNId);if(n){n.bd=bd;markMod(n.dt);}}else{S.notes.push({id:uid(),dt,la:now(),bd});markMod(dt);}sv();closeAllOv();rN();}
function dNE(){if(_cSNId){markMod(S.snotes.find(x=>x.id===_cSNId)?.dt);S.snotes=S.snotes.filter(x=>x.id!==_cSNId);sv();closeAllOv();rS();return;}if(_cFNId){markMod(S.fnotes.find(x=>x.id===_cFNId)?.dt);S.fnotes=S.fnotes.filter(x=>x.id!==_cFNId);sv();closeAllOv();rF();return;}markMod(S.notes.find(x=>x.id===_cNId)?.dt);S.notes=S.notes.filter(x=>x.id!==_cNId);sv();closeAllOv();rN();}

// FOOD HISTORY EDIT
let _cFLId=null;
function oFLEdit(id){
  const e=S.fl.find(x=>x.id===id);if(!e)return;
  _cFLId=id;
  const f=S.fd.find(x=>x.id===e.fid);
  document.getElementById('flEditN').textContent=f?.nm||'Food Entry';
  document.getElementById('flEditSub').textContent=f?.srv?srvHint(f.srv):'';
  document.getElementById('flEditQ').value=e.qty;
  document.getElementById('flEditNt').value=e.nt||'';
  openOvRoot('ovFLEdit');
}
function aFLE(d){const el=document.getElementById('flEditQ');el.value=Math.max(0,Math.round((parseFloat(el.value||0)+d)*10)/10);}
function cfFLE(){
  const e=S.fl.find(x=>x.id===_cFLId);if(!e)return;
  e.qty=parseFloat(document.getElementById('flEditQ').value)||0;
  e.nt=document.getElementById('flEditNt').value;
  markMod(e.dt);sv();closeAllOv();
  oH(_hType||'food');
}
function dFLE(){
  const e=S.fl.find(x=>x.id===_cFLId);if(e)markMod(e.dt);
  S.fl=S.fl.filter(x=>x.id!==_cFLId);sv();closeAllOv();
  oH(_hType||'food');
  rF();
}

// HISTORY
function buildHistoryData(type){
  let data=[];
  if(type==='water')data=S.wl.map(e=>({...e,_lb:'+'+e.qty+' oz'+(e.nt?' - '+e.nt:''),_fn:"oWE('"+e.id+"')"}));
  if(type==='supps'){
    const fromSl=S.sl.map(e=>{const sc=S.sch.find(x=>x.id===e.sid);const m=S.sm.find(x=>x.id===sc?.mid);return{...e,_lb:(m?.mfr?m.mfr+' \u2014 ':'')+( m?.name||'?')+' '+e.qty+' '+(m?.units||'')+(e.sk?' (skipped)':''),_fn:"oSEbyLId('"+e.id+"')"};});
    const fromSn=(S.snotes||[]).map(n=>({...n,_lb:'Note: '+(n.bd||'').slice(0,60),_fn:"oSNEdit('"+n.id+"')"}));
    data=[...fromSl,...fromSn];
  }
  if(type==='food'){
    const mealMkrs=S.fl.filter(e=>e.fid==='__meal__');
    data=[...S.fl.filter(e=>e.fid!=='__meal__').map(e=>{const f=S.fd.find(x=>x.id===e.fid);const meal=mealMkrs.find(m=>m.dt===e.dt);return{...e,_lb:(f?.nm||'?')+' \xd7'+e.qty,_mealMkrId:meal?.id||null,_fn:"oFLEdit('"+e.id+"')"};}),...(S.fnotes||[]).map(n=>({...n,_lb:'Note: '+n.bd.slice(0,60),_fn:"oFNEdit('"+n.id+"')"}))];
  }
  if(type==='other'){
    data=S.al.map(e=>{const a=S.acts.find(x=>x.id===e.aid);const fs=Object.entries(e.flds||{}).filter(([k,v])=>v!==''&&v!==undefined).map(([k,v])=>k+':'+v).join(' ');return{...e,_lb:(a?.nm||'?')+(fs?' - '+fs:''),_fn:"oAEbyLId('"+e.id+"')"};});
    data.sort((a,b)=>b.dt.localeCompare(a.dt));
    return data;
  }
  if(type==='notes')data=S.notes.map(e=>({...e,_lb:e.bd?e.bd.slice(0,60):'(empty)',_fn:"oNoteEdit('"+e.id+"')"}));
  data.sort((a,b)=>b.dt.localeCompare(a.dt));
  return data;
}
function applyHDataFilter(){
  _hData=_hFilterDay?_hDataAll.filter(e=>logEntryDay(e)===_hFilterDay):_hDataAll.slice();
  rHList();
}
function applyHDayFilter(){
  const el=document.getElementById('hDayFilter');
  _hFilterDay=(el&&el.value)||'';
  applyHDataFilter();
}
function clearHDayFilter(){
  const el=document.getElementById('hDayFilter');
  if(el)el.value='';
  _hFilterDay='';
  applyHDataFilter();
}
function oH(type){
  _hType=type;_hSel=new Set();_hSelMode=true;
  const titles={water:'Water History',supps:'Supplement History',food:'Food History',other:'Other History',notes:'Notes History'};
  document.getElementById('hT').textContent=titles[type]||'History';
  const hf=document.getElementById('hDayFilter');if(hf)hf.value='';
  _hFilterDay='';
  _hDataAll=buildHistoryData(type);
  applyHDataFilter();
  openOvRoot('ovH');
}
function rHList(){
  const grp={};_hData.forEach(e=>{const d=logEntryDay(e);if(!grp[d])grp[d]=[];grp[d].push(e);});
  const days=Object.entries(grp).sort((a,b)=>b[0].localeCompare(a[0]));
  if(!days.length){document.getElementById('hC').innerHTML='<div style="color:var(--mt);font-family:Courier New,monospace;font-size:10px;padding:18px 0;text-align:center">No history for this filter</div>';return;}
  let html='';
  days.forEach(([day,items])=>{
    html+='<div class="hd"><div class="hdl2">'+day+'</div>';
    if(_hType==='food'){
      const mealMkrMap={};S.fl.filter(e=>e.fid==='__meal__').forEach(m=>mealMkrMap[m.id]=m);
      const sorted=[...items].sort((a,b)=>b.dt.localeCompare(a.dt));
      const rendered=new Set();
      sorted.forEach(e=>{
        if(rendered.has(e.id))return;rendered.add(e.id);
        if(e._mealMkrId&&mealMkrMap[e._mealMkrId]){
          const mkr=mealMkrMap[e._mealMkrId];
          html+='<div style="font-family:Courier New,monospace;font-size:9px;color:var(--yw);padding:6px 2px 3px;letter-spacing:.5px;display:flex;align-items:baseline;gap:8px"><span>'+escHTML(mkr.mnm)+'</span>'+(mkr.nt?'<span style="color:var(--mt)">'+escHTML(mkr.nt)+'</span>':'')+'<span style="margin-left:auto;color:var(--mt)">'+f12(mkr.dt)+'</span></div>';
          sorted.filter(x=>x._mealMkrId===e._mealMkrId).forEach(item=>{rendered.add(item.id);html+=heRow(item,true);});
        }else{html+=heRow(e,false);}
      });
    }else{items.forEach(e=>{html+=heRow(e,false);});}
    html+='</div>';
  });
  document.getElementById('hC').innerHTML=html;
}
function heRow(e,indent){
  const sel=_hSel.has(e.id);
  const pay=e._fn?btoa(unescape(encodeURIComponent(e._fn))):'';
  return'<div class="he'+(sel?' sel':'')+'"'+(indent?' style="margin-left:10px"':'')+' id="he-'+e.id+'">'+
  '<div class="hcb" onclick="event.stopPropagation();heToggleSel(\''+e.id+'\')">'+(sel?'<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#4d9fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>':'')+'</div>'+
  '<div class="hei" onclick="heRowBodyClick(\''+e.id+'\',\''+pay+'\')"><div class="hen">'+escHTML(e._lb)+'</div></div>'+
  '<div class="heti" onclick="heRowBodyClick(\''+e.id+'\',\''+pay+'\')">'+f12(e.dt)+'</div></div>';
}
function heToggleSel(id){if(_hSel.has(id))_hSel.delete(id);else _hSel.add(id);rHList();}
function heRowBodyClick(id,pay){if(pay){try{eval(decodeURIComponent(escape(atob(pay))));}catch(x){}}else heToggleSel(id);}
function exitHSel(){_hSel=new Set();}
function bulkDel(){if(!_hSel.size){shT('Select entries first');return;}if(!confirm('Delete '+_hSel.size+' selected entr'+(_hSel.size>1?'ies':'y')+'?'))return;const ids=new Set(_hSel);_hData.filter(e=>ids.has(e.id)).forEach(e=>markMod(e.dt));if(_hType==='water')S.wl=S.wl.filter(x=>!ids.has(x.id));if(_hType==='supps'){S.sl=S.sl.filter(x=>!ids.has(x.id));S.snotes=S.snotes.filter(x=>!ids.has(x.id));}if(_hType==='food'){S.fl=S.fl.filter(x=>!ids.has(x.id));S.fnotes=S.fnotes.filter(x=>!ids.has(x.id));}if(_hType==='other'){S.al=S.al.filter(x=>!ids.has(x.id));}if(_hType==='notes')S.notes=S.notes.filter(x=>!ids.has(x.id));sv();_hDataAll=_hDataAll.filter(x=>!ids.has(x.id));_hSel=new Set();applyHDataFilter();rW();rS();rF();rA();rN();shT('Deleted');}
function bulkDT(){
  if(!_hSel.size){shT('Select entries first');return;}
  const n=_hSel.size;
  document.getElementById('bulkApplyBtn').textContent=n===1?'Apply':'Apply to All';
  document.getElementById('bulkSub').textContent=n===1?'Applies to the selected entry.':'Applies to all '+n+' selected entries.';
  const firstId=[..._hSel][0];
  const first=_hData.find(e=>e.id===firstId);
  const iso=first&&(first.dt||'')||gEDt();
  document.getElementById('bulkDate').value=isoToLocalYMD(iso);
  document.getElementById('bulkTime').value=isoToTimeLocal(iso);
  openOvPush('ovBulkDT');
}
function cfBulkDT(){
  const dateStr=document.getElementById('bulkDate').value;
  const timeStr=document.getElementById('bulkTime').value;
  if(!dateStr){shT('Pick a date');return;}
  const newDt=dateAndTimeToISO(dateStr,timeStr||'12:00');
  if(isNaN(new Date(newDt).getTime())){shT('Invalid date or time');return;}
  const ids=new Set(_hSel);
  let updated=0;
  const patch=arr=>{if(!Array.isArray(arr))return;arr.forEach(e=>{if(ids.has(e.id)){markMod(e.dt);e.dt=newDt;markMod(newDt);updated++;}});};
  patch(S.wl);patch(S.sl);patch(S.fl);patch(S.al);patch(S.ind);patch(S.fnotes);patch(S.snotes);patch(S.notes);
  if(!updated){shT('No entries updated');return;}
  _hDataAll=buildHistoryData(_hType);
  if(!sv())return;
  const newDay=isoToLocalYMD(newDt);
  if(_hFilterDay&&_hFilterDay!==newDay)clearHDayFilter();
  popOv();
  _hSel=new Set();
  applyHDataFilter();
  rW();rS();rF();rA();rN();
  shT('Updated '+updated+' entr'+(updated>1?'ies':'y')+' to '+newDay);
}
function oSEbyLId(lid){const le=S.sl.find(x=>x.id===lid);if(le)oSE(le.sid,lid);}
function oAEbyLId(lid){const le=S.al.find(x=>x.id===lid);if(le)oAE(le.aid,lid);}

// Local disk export (File System Access API; paths under chosen folder)
function idbOpenFs(){
  return new Promise((res,rej)=>{
    const r=indexedDB.open(IDB_FS_NAME,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(IDB_FS_STORE))r.result.createObjectStore(IDB_FS_STORE);};
    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);
  });
}
async function idbPutFsHandle(handle){
  const db=await idbOpenFs();
  return new Promise((res,rej)=>{
    const t=db.transaction(IDB_FS_STORE,'readwrite');
    t.objectStore(IDB_FS_STORE).put(handle,IDB_KEY_LOCAL_EXPORT_DIR);
    t.oncomplete=()=>res();
    t.onerror=()=>rej(t.error);
  });
}
async function idbGetFsHandle(){
  const db=await idbOpenFs();
  return new Promise((res,rej)=>{
    const t=db.transaction(IDB_FS_STORE,'readonly');
    const q=t.objectStore(IDB_FS_STORE).get(IDB_KEY_LOCAL_EXPORT_DIR);
    q.onsuccess=()=>res(q.result||null);
    q.onerror=()=>rej(q.error);
  });
}
async function idbDelFsHandle(){
  const db=await idbOpenFs();
  return new Promise((res,rej)=>{
    const t=db.transaction(IDB_FS_STORE,'readwrite');
    t.objectStore(IDB_FS_STORE).delete(IDB_KEY_LOCAL_EXPORT_DIR);
    t.oncomplete=()=>res();
    t.onerror=()=>rej(t.error);
  });
}
async function restoreLocalExportDirHandle(){
  try{
    const h=await idbGetFsHandle();
    if(!h||typeof h.queryPermission!=='function')return null;
    let p=await h.queryPermission({mode:'readwrite'});
    if(p!=='granted')p=await h.requestPermission({mode:'readwrite'});
    return p==='granted'?h:null;
  }catch(e){console.warn('restoreLocalExportDirHandle',e);return null;}
}
function getLocalExportDirHandle(){
  if(!_localExportDirPromise)_localExportDirPromise=restoreLocalExportDirHandle();
  return _localExportDirPromise;
}
async function fsGetSubdir(root,segments){
  let h=root;
  for(const seg of segments)h=await h.getDirectoryHandle(seg,{create:true});
  return h;
}
async function fsReadTextFile(dirHandle,fileName){
  try{
    const fh=await dirHandle.getFileHandle(fileName);
    const f=await fh.getFile();
    return await f.text();
  }catch(e){return null;}
}
async function fsWriteTextFile(dirHandle,fileName,text){
  const fh=await dirHandle.getFileHandle(fileName,{create:true});
  const w=await fh.createWritable();
  await w.write(text);
  await w.close();
}
async function pruneConfigSnapshots(configDir){
  const byDate=new Map();
  for await (const [name,handle] of configDir.entries()){
    const m=/^config-(\d{4}-\d{2}-\d{2})\.json$/.exec(name);
    if(!m||handle.kind!=='file')continue;
    byDate.set(m[1],name);
  }
  const dates=[...byDate.keys()].sort((a,b)=>b.localeCompare(a));
  if(dates.length<=LOCAL_CONFIG_SNAPSHOT_KEEP)return;
  for(const d of dates.slice(LOCAL_CONFIG_SNAPSHOT_KEEP)){
    try{await configDir.removeEntry(byDate.get(d));}catch(e){console.warn('pruneConfigSnapshots',e);}
  }
}
function gConfigSnapshot(){
  return{
    saved_at:now(),
    snapshot_local_date:isoToLocalYMD(now()),
    sm:S.sm,sch:S.sch,fd:S.fd,meals:S.meals,acts:S.acts,wb:S.wb,cfg:S.cfg
  };
}
function gConfigSnapshotJSON(){return JSON.stringify(gConfigSnapshot(),null,2);}
function ymdFromLogKey(d){const s=String(d).slice(0,10);return/^\d{4}-\d{2}-\d{2}$/.test(s)?s:null;}
async function buildExportFileBlobs(logDateKeys){
  const uniq=[...new Set(logDateKeys.map(d=>ymdFromLogKey(d)).filter(Boolean))];
  const files=[];
  for(const d of uniq){
    const text=await dailyLogContentForSave(d);
    if(text===null)continue;
    files.push(new File([text],d+'.md',{type:'text/plain;charset=utf-8'}));
  }
  const cfgDay=isoToLocalYMD(now());
  files.push(new File([gConfigSnapshotJSON()],'config-'+cfgDay+'.json',{type:'application/json;charset=utf-8'}));
  return files;
}
async function tryLocalDiskExport(logDateKeys,wantDailyLog=true,wantCfg=true){
  const root=await getLocalExportDirHandle();
  if(!root)return false;
  try{
    const base=await fsGetSubdir(root,[LOCAL_EXPORT_ROOT]);
    const uniq=[...new Set(logDateKeys.map(d=>ymdFromLogKey(d)).filter(Boolean))];
    if(wantDailyLog){
      const logDir=await fsGetSubdir(base,[LOCAL_EXPORT_DAILY_LOGS_DIR]);
      for(const d of uniq){
        const existing=await fsReadTextFile(logDir,d+'.md');
        const text=composeDailyLogContent(existing,d);
        if(text===null)return false;
        await fsWriteTextFile(logDir,d+'.md',text);
      }
    }
        if(wantCfg){const cfgDay=isoToLocalYMD(now());const configDir=await fsGetSubdir(base,[LOCAL_EXPORT_CONFIG_DIR]);await fsWriteTextFile(configDir,'config-'+cfgDay+'.json',gConfigSnapshotJSON());await pruneConfigSnapshots(configDir);}
    return true;
  }catch(e){
    console.warn('tryLocalDiskExport',e);
    shT('Local files not saved');
    return false;
  }
}
function folderPickerBlockReason(){
  const ua=navigator.userAgent||'';
  if(/iPad|iPhone|iPod/i.test(ua))return'ios';
  if(window.isSecureContext===false)return'insecure';
  if(typeof window.showDirectoryPicker!=='function')return'nobrowser';
  return null;
}
function folderPickerToast(code){
  if(code==='ios')return'On iPhone/iPad, folders can’t be linked. Tap Export, then Share → Save to Files.';
  if(code==='insecure')return'Open this page via https or http://localhost — not by opening the HTML file directly.';
  return'Link a folder using Chrome or Edge on a Mac or Windows PC.';
}
function rLocalExportLbl(){
  const el=document.getElementById('localExportMm');
  if(!el)return;
  const block=folderPickerBlockReason();
  if(block){
    if(block==='ios')el.textContent=typeof navigator.share==='function'?'iPhone/iPad: tap Export, then Save to Files / iCloud (folder link needs a computer)':'This device can’t link a folder or share files';
    else if(block==='insecure')el.textContent='Use https or http://localhost — file:// blocks folder access';
    else el.textContent='Folder link needs Chrome or Edge on a computer — or tap Export on iPhone';
    return;
  }
  getLocalExportDirHandle().then(h=>{el.textContent=h?'DailyTracker/daily-logs + config · inside '+h.name:'Pick iCloud Drive, Google Drive (synced), or any folder · not linked';});
}
async function pickLocalExportFolder(){
  const block=folderPickerBlockReason();
  if(block){shT(folderPickerToast(block));return;}
  try{
    const dir=await window.showDirectoryPicker({mode:'readwrite'});
    const p=await dir.requestPermission({mode:'readwrite'});
    if(p!=='granted'){shT('Permission denied');return;}
    await idbPutFsHandle(dir);
    _localExportDirPromise=Promise.resolve(dir);
    rLocalExportLbl();
    shT('Export folder saved');
  }catch(e){if(e&&e.name!=='AbortError'){console.warn(e);shT('Could not use folder');}}
}
async function clearLocalExportFolder(){
  try{await idbDelFsHandle();}catch(_){}
  _localExportDirPromise=Promise.resolve(null);
  rLocalExportLbl();
  shT('Local export off');
}

// SETTINGS & DRIVE
function oSetDrive(){document.getElementById('driveDailyLogsId').value=S.cfg.driveIds.dailyLogs||'';document.getElementById('driveBackupId').value=S.cfg.driveIds.backups||'';openOvRoot('ovSetDrive');}
function svDriveSet(){S.cfg.driveIds={dailyLogs:document.getElementById('driveDailyLogsId').value,backups:document.getElementById('driveBackupId').value};sv();closeAllOv();shT('Drive settings saved');}
function togAutoSync(){S.cfg.autoSync=!S.cfg.autoSync;document.getElementById('tgAutoSync').classList.toggle('on',S.cfg.autoSync);sv();}
function togShareOnSave(){S.cfg.shareOnSave=!S.cfg.shareOnSave;document.getElementById('tgShareOnSave').classList.toggle('on',S.cfg.shareOnSave);sv();}
function setDS(msg,type){const el=document.getElementById('driveStatus');if(!el)return;el.className='drs '+(type||'ok');el.textContent=msg;el.style.display='block';}
function gDriveTokenValid(){return!!(_gToken&&Date.now()<_gTokenExpiry-60000);}
function gDriveAuth(reason){
  reason=reason||'sync';
  localStorage.setItem('_gAuthPending',reason);
  const redirectUri=window.location.origin+window.location.pathname;
  localStorage.setItem('_gAuthRedirectUri',redirectUri);
  const p=new URLSearchParams({client_id:GOOGLE_CLIENT_ID,redirect_uri:redirectUri,response_type:'token',scope:'https://www.googleapis.com/auth/drive'});
  window.location.href='https://accounts.google.com/o/oauth2/v2/auth?'+p;
}
function gDriveCheckHash(){
  const hash=window.location.hash;
  if(!hash||!hash.includes('access_token'))return;
  const p=new URLSearchParams(hash.slice(1));
  const tok=p.get('access_token');
  if(!tok)return;
  _gToken=tok;
  _gTokenExpiry=Date.now()+parseInt(p.get('expires_in')||'3600')*1000;
  history.replaceState(null,'',window.location.pathname);
  const pending=localStorage.getItem('_gAuthPending');
  localStorage.removeItem('_gAuthPending');
  localStorage.removeItem('_gAuthRedirectUri');
  if(pending==='sync'){
    shT('Google connected — syncing…');
    setTimeout(()=>{
      const dates=_modDates.size?[..._modDates]:[td()];
      syncDrive(dates).then(ok=>{if(ok)clearExportDirty();}).catch(e=>{console.warn('sync',e);setDS('Sync error: '+e.message,'err');});
    },400);
  }else if(pending==='backup'){
    shT('Google connected — backing up…');
    setTimeout(()=>doBackup(),400);
  }
}
async function driveRead(filename,folderId){
  if(!gDriveTokenValid()||!folderId)return null;
  try{
    const tok=_gToken;
    const q=encodeURIComponent("name='"+filename.replace(/'/g,"\\'")+"' and '"+folderId+"' in parents and trashed=false");
    const sr=await fetch('https://www.googleapis.com/drive/v3/files?q='+q+'&fields=files(id)',{headers:{Authorization:'Bearer '+tok}});
    if(!sr.ok)return null;
    const sj=await sr.json();
    if(sj.error&&sj.error.code===401){_gToken=null;return null;}
    if(!sj.files||!sj.files.length)return null;
    const fid=sj.files[0].id;
    const cr=await fetch('https://www.googleapis.com/drive/v3/files/'+fid+'?alt=media',{headers:{Authorization:'Bearer '+tok}});
    if(!cr.ok)return null;
    return await cr.text();
  }catch(e){console.warn('driveRead',e);return null;}
}
async function driveWrite(filename,content,folderId){
  if(!gDriveTokenValid())return false;
  if(!folderId){setDS('Missing folder ID — check Settings → Drive Folder IDs','err');return false;}
  try{
    const tok=_gToken;
    const q=encodeURIComponent("name='"+filename+"' and '"+folderId+"' in parents and trashed=false");
    const sr=await fetch('https://www.googleapis.com/drive/v3/files?q='+q+'&fields=files(id)',{headers:{Authorization:'Bearer '+tok}});
    if(!sr.ok){const t=await sr.text();throw new Error('Search '+sr.status+': '+t.slice(0,120));}
    const sj=await sr.json();
    if(sj.error&&sj.error.code===401){_gToken=null;return false;}
    let cr;
    if(sj.files&&sj.files.length){
      const fid=sj.files[0].id;
      cr=await fetch('https://www.googleapis.com/upload/drive/v3/files/'+fid+'?uploadType=media',{method:'PATCH',headers:{Authorization:'Bearer '+tok,'Content-Type':'text/plain'},body:content});
    }else{
      const meta=JSON.stringify({name:filename,parents:[folderId]});
      const form=new FormData();
      form.append('metadata',new Blob([meta],{type:'application/json'}));
      form.append('file',new Blob([content],{type:'text/plain'}));
      cr=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{Authorization:'Bearer '+tok},body:form});
    }
    if(!cr.ok){const t=await cr.text();throw new Error('Upload failed: '+cr.status+' '+t);}
    return true;
  }catch(e){console.error('driveWrite',e);setDS('Drive error: '+e.message,'err');return false;}
}
async function syncDrive(datesList){
  const ids=S.cfg.driveIds||{};
  if(!ids.dailyLogs){setDS('No Daily Logs folder ID — go to Settings → Drive Folder IDs','err');return false;}
  const dates=(Array.isArray(datesList)&&datesList.length)?datesList:(_modDates.size?[..._modDates]:[td()]);
  setDS('Syncing '+dates.length+' day(s) to Drive…','syn');
  let ok=true;
  for(const dt of dates){
    if(ids.dailyLogs){
      const content=await dailyLogContentForSave(dt);
      if(content===null){ok=false;continue;}
      const r1=await driveWrite(dt+'.md',content,ids.dailyLogs);
      if(!r1)ok=false;
    }
  }
  if(ok){setDS('Synced '+new Date().toLocaleTimeString(),'ok');shT('Drive synced');}
  return ok;
}
async function onSyncDriveClick(){
  if(!gDriveTokenValid()){gDriveAuth();return;}
  if(await syncDrive())clearExportDirty();
}
async function doBackup(){
  if(!gDriveTokenValid()){gDriveAuth('backup');return;}
  if(!S.cfg.driveIds.backups){setDS('No backup folder ID — check Settings → Drive Folder IDs','err');return;}
  setDS('Backing up...','syn');
  const ok=await driveWrite('DT_Backup_'+td()+'.json',JSON.stringify(S,null,2),S.cfg.driveIds.backups);
  if(ok){setDS('Backup saved '+td(),'ok');shT('Backup saved');}else setDS('Backup failed','err');
}
async function doRestore(){if(!confirm('Restore from latest Drive backup? This overwrites current data.'))return;shT('Open Claude and ask it to read your latest backup file from Drive and paste the JSON');}

// LOG — hybrid Daily Log (markdown summary + embedded JSON)
function gDailyLogJSON(dt){
  const sle=S.sl.filter(e=>onLogDay(e.dt,dt)&&!isWaterSuppLog(e)).sort((a,b)=>a.dt.localeCompare(b.dt));
  const supplements_logged=sle.map(e=>{
    const sc=S.sch.find(x=>x.id===e.sid);
    const m=S.sm.find(x=>x.id===sc?.mid);
    return{time:f12(e.dt),manufacturer:cleanMfr(m?.mfr),name:suppWikiLink(m?.mfr,m?.name),qty:e.qty,units:m?.units||null};
  });
  const waterEntries=S.wl.filter(e=>onLogDay(e.dt,dt)).sort((a,b)=>a.dt.localeCompare(b.dt));
  const water_logged=waterEntries.map(e=>({logged_at:laStamp(e.la),time:f12(e.dt),qty_oz:e.qty,notes:e.nt&&String(e.nt).trim()?e.nt:null}));
  const total_water_intake_oz=Math.round(waterEntries.reduce((s,e)=>s+(parseFloat(e.qty)||0),0));
  const foodEntries=S.fl.filter(e=>onLogDay(e.dt,dt)&&e.fid!=='__meal__').sort((a,b)=>a.dt.localeCompare(b.dt));
  const food_logged=foodEntries.map(e=>{
    const f=S.fd.find(x=>x.id===e.fid);
    return{logged_at:laStamp(e.la),time:f12(e.dt),item:f?.nm||'Unknown',servings:e.qty,notes:e.nt&&String(e.nt).trim()?e.nt:null};
  });
  const food_categories_served=emptyFoodCategories();
  foodEntries.forEach(e=>{
    const f=S.fd.find(x=>x.id===e.fid);
    const k=foodCategoryKey(f?.nm||'');
    if(!food_categories_served[k])food_categories_served[k]=0;
    food_categories_served[k]+=parseFloat(e.qty)||0;
  });
  Object.keys(food_categories_served).forEach(k=>{food_categories_served[k]=Math.round(food_categories_served[k]*1000)/1000;});
  const giEvents=[];
  const lifestyle_protocols=[];
  S.al.filter(e=>onLogDay(e.dt,dt)).sort((a,b)=>a.dt.localeCompare(b.dt)).forEach(e=>{
    const a=S.acts.find(x=>x.id===e.aid);
    const type=a?.nm||'Other';
    const ls=laStamp(e.la);
    const tm=f12(e.dt);
    if(type==='Bowel Health'){
      const status=Object.values(e.flds||{}).find(v=>v!==undefined&&v!=='');
      if(status)giEvents.push({time:tm,logged_at:ls,status:String(status)});
      return;
    }
    if(type==='Cold Plunge'){
      const dur=e.flds?.Duration??e.flds?.duration;
      const temp=e.flds?.Temperature??e.flds?.temperature;
      lifestyle_protocols.push({type,time:tm,logged_at:ls,duration_minutes:parseFloat(dur)||null,temperature_f:parseFloat(temp)||null});
      return;
    }
    if(type==='Sauna'){
      const dur=e.flds?.Duration??e.flds?.duration;
      const temp=e.flds?.Temperature??e.flds?.temperature;
      lifestyle_protocols.push({type,time:tm,logged_at:ls,duration_minutes:parseFloat(dur)||null,temperature_f:parseFloat(temp)||null});
      return;
    }
    lifestyle_protocols.push({type,time:tm,logged_at:ls,fields:e.flds||{},notes:e.nt&&String(e.nt).trim()?e.nt:null});
  });
  const supplement_notes=(S.snotes||[]).filter(e=>onLogDay(e.dt,dt)).map(n=>({time:f12(n.dt),logged_at:laStamp(n.la),note:n.bd}));
  const meals_executed=S.fl.filter(e=>onLogDay(e.dt,dt)&&e.fid==='__meal__').map(e=>e.mnm+(e.nt&&String(e.nt).trim()?' -- '+e.nt:''));
  return{
    date:dt,
    day_of_week:dayOfWeekName(dt),
    total_water_intake_oz,
    subjective_scores:{cns_fatigue_present:false,racing_mind_present:false,cognitive_clarity_score_1_to_5:null},
    gastrointestinal_tracking:{
      total_movements:giEvents.length,
      highest_bristol_type:null,
      urgent_or_watery_present:giEvents.some(ev=>/watery|loose/i.test(ev.status)),
      events:giEvents
    },
    lifestyle_protocols,
    supplement_notes,
    meals_executed,
    supplements_logged,
    water_logged,
    food_logged,
    food_categories_served
  };
}
function gDailyLogMarkdownTop(dt,payload){
  const lines=[];
  lines.push('# '+payload.day_of_week+' — '+dt);
  lines.push('');
  lines.push('## 📝 Subjective Notes & Food Logs');
  lines.push('* **Supplement & Food Notes:**');
  const chron=[];
  const byTime={};
  S.sl.filter(e=>onLogDay(e.dt,dt)&&!isWaterSuppLog(e)).sort((a,b)=>a.dt.localeCompare(b.dt)).forEach(e=>{
    const sc=S.sch.find(x=>x.id===e.sid);
    const m=S.sm.find(x=>x.id===sc?.mid);
    const tm=f12(e.dt);
    const part=suppWikiLink(m?.mfr,m?.name)+' '+e.qty+' '+(m?.units||'')+(e.sk?' (skipped)':'');
    if(!byTime[tm])byTime[tm]=[];
    byTime[tm].push(part);
  });
  Object.keys(byTime).sort((a,b)=>timeSortKey(a)-timeSortKey(b)).forEach(tm=>{
    chron.push({sort:timeSortKey(tm),text:'**'+tm+':** '+byTime[tm].join('; ')+'.'});
  });
  payload.water_logged.forEach(w=>{
    const isSuppWater=w.notes&&/supplement/i.test(w.notes);
    if(!isSuppWater)chron.push({sort:timeSortKey(w.time),text:'**'+w.time+':** water '+w.qty_oz+' oz.'});
  });
  const foodByTime={};
  payload.food_logged.forEach(f=>{
    if(!foodByTime[f.time])foodByTime[f.time]=[];
    foodByTime[f.time].push(f.item+' '+f.servings);
  });
  Object.keys(foodByTime).forEach(tm=>chron.push({sort:timeSortKey(tm),text:'**'+tm+':** '+foodByTime[tm].join(', ')+'.'}));
  payload.supplement_notes.forEach(n=>{chron.push({sort:timeSortKey(n.time),text:'**'+n.time+':** '+n.note});});
  (S.ind||[]).filter(e=>onLogDay(e.dt,dt)).forEach(e=>{chron.push({sort:timeSortKey(f12(e.dt)),text:'**'+f12(e.dt)+':** indulgence — '+e.txt+(e.nt?' ('+e.nt+')':'')});});
  (S.fnotes||[]).filter(e=>onLogDay(e.dt,dt)).forEach(n=>{chron.push({sort:timeSortKey(f12(n.dt)),text:'**'+f12(n.dt)+':** food note — '+n.bd});});
  (S.notes||[]).filter(n=>onLogDay(n.dt,dt)).forEach(n=>{chron.push({sort:timeSortKey(f12(n.dt)),text:'**'+f12(n.dt)+':** '+n.bd});});
  chron.sort((a,b)=>a.sort-b.sort);
  if(chron.length)chron.forEach(c=>lines.push('    * '+c.text));
  else lines.push('    * (none)');
  if(payload.total_water_intake_oz)lines.push('    * **Water today:** '+payload.total_water_intake_oz+' oz total.');
  lines.push('* **Meals executed:**');
  if(payload.meals_executed.length)payload.meals_executed.forEach(m=>lines.push('    * '+m));
  else lines.push('    * (none)');
  lines.push('');
  lines.push('## ⚠️ Internal Triggers & Biometric Realities');
  const bowel=payload.gastrointestinal_tracking.events.map(e=>e.time+' '+e.status).join('; ');
  lines.push('* **Bowel Health:**'+(bowel?' '+bowel+'.':' (none)'));
  const life=payload.lifestyle_protocols.map(p=>{
    if(p.type==='Cold Plunge'||p.type==='Sauna')return p.type+' '+p.time+' — '+(p.duration_minutes!=null?p.duration_minutes+' min':'')+(p.temperature_f!=null?' @ '+p.temperature_f+'°F':'');
    return p.type+' '+p.time+(p.notes?' — '+p.notes:'');
  }).join('; ');
  lines.push('* **Lifestyle Elements:**'+(life?' '+life+'.':' (none)'));
  return lines.join('\n');
}
function timeSortKey(t){
  const m=/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(t||''));
  if(!m)return 0;
  let h=parseInt(m[1],10);const min=parseInt(m[2],10);const ap=m[3].toUpperCase();
  if(ap==='PM'&&h!==12)h+=12;if(ap==='AM'&&h===12)h=0;
  return h*60+min;
}
function gDailyLogForDate(dt){
  const payload=gDailyLogJSON(dt);
  return gDailyLogMarkdownTop(dt,payload)+'\n\n---\n\n```json\n'+JSON.stringify(payload,null,2)+'\n```\n';
}
/** Tracker-head only; Oura-tail preserved on Drive/export save (see docs/DAILY_LOG_DUAL_WRITER.md). */
function composeDailyLogContent(existingContent,dt){
  const head=gDailyLogForDate(dt);
  if(typeof DT==='undefined'||!DT.composeJournalFile)return head;
  const r=DT.composeJournalFile(existingContent,head);
  if(r.ok)return r.file;
  console.warn('composeJournalFile',r.error,existingContent&&existingContent.slice(-400));
  shT('Drive sync: '+r.error);
  setDS(r.error,'err');
  return null;
}
async function resolveExistingDailyLog(dt){
  const ids=S.cfg.driveIds||{};
  if(ids.dailyLogs&&gDriveTokenValid()){
    const fromDrive=await driveRead(dt+'.md',ids.dailyLogs);
    if(fromDrive!==null)return fromDrive;
  }
  const root=await getLocalExportDirHandle();
  if(!root)return null;
  try{
    const base=await fsGetSubdir(root,[LOCAL_EXPORT_ROOT]);
    const logDir=await fsGetSubdir(base,[LOCAL_EXPORT_DAILY_LOGS_DIR]);
    return await fsReadTextFile(logDir,dt+'.md');
  }catch(e){return null;}
}
async function dailyLogContentForSave(dt){
  const existing=await resolveExistingDailyLog(dt);
  return composeDailyLogContent(existing,dt);
}
function rLog(){document.getElementById('mdO').textContent=gDailyLogForDate(td());}
const EXP_CK=()=>'<svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function expCbState(id){return document.getElementById(id).classList.contains('on');}
function setExpCb(id,on){const el=document.getElementById(id);el.classList.toggle('on',on);el.style.background=on?'var(--gr)':'';el.style.borderColor=on?'var(--gr)':'var(--bd2)';el.innerHTML=on?EXP_CK():'';}
function rExpAllCb(){const all=['expDailyLog','expCfg'].every(id=>expCbState(id));setExpCb('expAllCb',all);}
function togExpCb(id){setExpCb(id,!expCbState(id));rExpAllCb();}
function togExpAll(){const all=['expDailyLog','expCfg'].every(id=>expCbState(id));['expDailyLog','expCfg'].forEach(id=>setExpCb(id,!all));setExpCb('expAllCb',!all);}
function datesInRange(start,end){
  const dates=[];let cur=new Date(start+'T00:00:00');const last=new Date(end+'T00:00:00');
  while(cur<=last&&dates.length<=366){dates.push(cur.toISOString().slice(0,10));cur.setDate(cur.getDate()+1);}
  return dates;
}
function rExpSub(){
  const s=document.getElementById('expStart');const e=document.getElementById('expEnd');
  if(!s||!e)return;
  const start=s.value||td();const end=e.value||td();
  const dates=datesInRange(start,end);
  const sub=dates.length===1?dates[0]:dates.length+' days ('+dates[0]+' – '+dates[dates.length-1]+')';
  document.getElementById('expSub').textContent=sub;
}
function oExport(){
  if(Object.keys(_supSt).length||Object.keys(_otherSt).length){shT('Save first — pending items not committed');return;}
  ['expDailyLog','expCfg','expAllCb'].forEach(id=>setExpCb(id,true));
  const modDates=_modDates.size?[..._modDates].sort():[td()];
  document.getElementById('expStart').value=modDates[0];
  document.getElementById('expEnd').value=modDates[modDates.length-1];
  rExpSub();
  openOvRoot('ovExport');
}
async function cfExport(){
  const wantDailyLog=expCbState('expDailyLog');
  const wantCfg=expCbState('expCfg');
  if(!wantDailyLog&&!wantCfg){shT('Select at least one file type');return;}
  const start=document.getElementById('expStart').value||td();
  const end=document.getElementById('expEnd').value||td();
  const dates=datesInRange(start,end);
  closeAllOv();
  await exportExternal(wantDailyLog,wantCfg,dates);
}
function downloadBlob(filename,text){
  const a=document.createElement('a');
  a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(text);
  a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);
}
async function exportExternal(wantDailyLog=true,wantCfg=true,exportDates){
  if(!exportDates||!exportDates.length)exportDates=_modDates.size?[..._modDates]:[td()];
  const uniq=[...new Set(exportDates.map(d=>ymdFromLogKey(d)).filter(Boolean))].sort();
  const day=uniq.length?uniq[uniq.length-1]:td();
  const cfgDay=isoToLocalYMD(now());
  // Build file list based on selections
  async function buildFiles(){
    const files=[];
    if(wantDailyLog){
      for(const d of uniq){
        const text=await dailyLogContentForSave(d);
        if(text===null)return null;
        files.push(new File([text],d+'.md',{type:'text/plain'}));
      }
    }
    if(wantCfg)files.push(new File([gConfigSnapshotJSON()],'config-'+cfgDay+'.json',{type:'text/plain'}));
    return files;
  }
  // 1. Share sheet — Safari (iPhone + Mac)
  if(typeof navigator.share==='function'){
    const files=await buildFiles();
    if(files===null)return;
    try{
      await navigator.share({files,title:'DailyTracker '+day});
      clearExportDirty();shT('Exported');return;
    }catch(e){
      if(e&&e.name==='AbortError')return;
      console.warn('share files failed, trying text',e);
      try{
        await navigator.share({title:'DailyTracker '+day,text:gDailyLogForDate(day)});
        clearExportDirty();shT('Exported');return;
      }catch(e2){if(e2&&e2.name==='AbortError')return;}
    }
  }
  // 2. Linked folder — Chrome/Edge desktop
  if(wantDailyLog||wantCfg){
    const didDisk=await tryLocalDiskExport(exportDates,wantDailyLog,wantCfg);
    if(didDisk){clearExportDirty();shT('Exported');return;}
  }
  // 3. Save-file picker — Chrome/Edge desktop, no folder linked
  if(typeof window.showSaveFilePicker==='function'){
    try{
      if(wantDailyLog){
        const logText=await dailyLogContentForSave(day);
        if(logText===null)return;
        const fh=await window.showSaveFilePicker({suggestedName:day+'.md',types:[{description:'Markdown',accept:{'text/plain':['.md']}}]});
        const w=await fh.createWritable();await w.write(logText);await w.close();
      }
      if(wantCfg){const fh=await window.showSaveFilePicker({suggestedName:'config-'+cfgDay+'.json',types:[{description:'JSON',accept:{'text/plain':['.json']}}]});const w=await fh.createWritable();await w.write(gConfigSnapshotJSON());await w.close();}
      clearExportDirty();shT('Exported');return;
    }catch(e){if(e&&e.name==='AbortError')return;console.warn('showSaveFilePicker',e);}
  }
  // 4. Download fallback
  if(wantDailyLog){
    const logText=await dailyLogContentForSave(day);
    if(logText===null)return;
    downloadBlob(day+'.md',logText);
  }
  if(wantCfg)downloadBlob('config-'+cfgDay+'.json',gConfigSnapshotJSON());
  clearExportDirty();shT('Downloaded to Downloads folder');
  // Phase 2: if(S.cfg.autoGoogleSync) await pushExportToGoogleDrive(exportDates);
}
async function svAll(){
  const nq=document.getElementById('noteQuick');if(nq&&nq.value.trim())svQuickNote();
  const fnq=document.getElementById('foodNoteQuick');if(fnq&&fnq.value.trim())svFoodNote();
  const snq=document.getElementById('suppNoteQuick');if(snq&&snq.value.trim())svSuppNote();
  const batchDt=gEDt();
  const sids=Object.keys(_supSt);
  const adhocMids=Object.keys(_supAdhoc);
  const addedWl=[],addedSl=[],addedAL=[];
  const batchDay=isoToLocalYMD(batchDt);
  if(sids.length){
    sids.forEach(sid=>{
      const st=_supSt[sid];
      if(isWaterSup(sid)){const id=uid();S.wl.push({id,dt:batchDt,la:now(),qty:st.qty,nt:st.nt||'via supplement stack'});addedWl.push(id);}
      else{const id2=uid();S.sl.push({id:id2,sid,dt:batchDt,la:now(),qty:st.qty,nt:st.nt||'',sk:!!st.sk});addedSl.push(id2);}
    });
    markMod(batchDay);
  }
  if(adhocMids.length){
    adhocMids.forEach(mid=>{
      const st=_supAdhoc[mid];
      const sid=resolveAdhocSid(mid);
      if(isWaterSup(sid)||isWaterMid(mid)){const id=uid();S.wl.push({id,dt:batchDt,la:now(),qty:st.qty,nt:st.nt||'via supplement catalog'});addedWl.push(id);}
      else{const id2=uid();S.sl.push({id:id2,sid,dt:batchDt,la:now(),qty:st.qty,nt:st.nt||'',sk:!!st.sk});addedSl.push(id2);}
    });
    markMod(batchDay);
  }
  const oaids=Object.keys(_otherSt);
  if(oaids.length){
    oaids.forEach(aid=>{const st=_otherSt[aid];const flds={};flds[st.fieldNm]=st.val;const id2=uid();S.al.push({id:id2,aid,dt:batchDt,la:now(),flds,nt:''});addedAL.push(id2);});
    markMod(batchDay);
  }
  const prevFl=S.flSave,prevG=S.gdt;
  const saveTs=now();
  bumpFlSave(saveTs);
  S.gdt=null;
  if(!sv()){
    S.flSave=prevFl;S.gdt=prevG;
    if(addedWl.length)S.wl=S.wl.filter(e=>!addedWl.includes(e.id));
    if(addedSl.length)S.sl=S.sl.filter(e=>!addedSl.includes(e.id));
    if(addedAL.length)S.al=S.al.filter(e=>!addedAL.includes(e.id));
    shT('Save failed — nothing was committed');
    rS();rW();
    return;
  }
  _supSt={};_supAdhoc={};_pendingWater=null;_otherSt={};
  resetAfterSave();
  rH();rW();rS();rF();rA();rN();shT('Saved');
  if(S.cfg.autoSync){
    if(!gDriveTokenValid()){gDriveAuth();return;}
    const dates=[..._modDates].filter(Boolean);
    syncDrive(dates.length?dates:[td()]).catch(e=>{console.warn('Drive sync',e);setDS('Sync failed: '+e.message,'err');});
    const isFirstSaveToday=!prevFl||isoToLocalYMD(prevFl)!==td();
    if(isFirstSaveToday&&S.cfg.driveIds.backups){
      driveWrite('DT_Backup_'+td()+'.json',JSON.stringify(S,null,2),S.cfg.driveIds.backups)
        .then(ok=>{if(ok){setDS('Synced + daily backup saved','ok');shT('Daily backup saved');}})
        .catch(e=>console.warn('Daily backup',e));
    }
  }
}
document.addEventListener('click',e=>{if(_ovStack.length&&e.target.classList.contains('ov'))popOv();});
function shT(msg){const t=document.getElementById('tst');t.textContent=msg;t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),2500);}
init();
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/tracker/sw.js',{scope:'/tracker/'}).then(reg=>{
    reg.addEventListener('updatefound',()=>{
      const nw=reg.installing;
      nw.addEventListener('statechange',()=>{
        if(nw.state==='installed'&&navigator.serviceWorker.controller){
          shT('App updated — close & reopen to get latest version');
        }
      });
    });
  }).catch(e=>console.warn('SW reg failed',e));
}
