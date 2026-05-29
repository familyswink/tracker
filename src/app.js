
/**
 * Daily Tracker application (Phase 1).
 * Source of truth for UI behavior. Built to dist/app.js via npm run build.
 * Shared pure logic also lives in src/core/ and src/domain/ (used by tests).
 */
const DSM=[{id:'sm1',mfr:'Himalayan Gold',name:'Water',units:'oz',rat:'Hydration foundation; primes GI tract'},{id:'sm2',mfr:'Himalayan Gold',name:'Himalayan Salt',units:'tsp',rat:'Sodium for morning cortisol peak; electrolyte priming'},{id:'sm3',mfr:'Vital Reaction',name:'Hydrogen Tab',units:'tab',rat:'Oxidative stress reduction; under review'},{id:'sm4',mfr:'Slow Mag',name:'Slow Mag',units:'tablet',rat:'Systemic Mg repletion; TRPM6 variants'},{id:'sm5',mfr:"Doctor's Best",name:'Mg Glycinate',units:'tablet',rat:'Glycinate form; TRPM6 variants; glucose signaling; sleep'},{id:'sm6',mfr:'PureGenomics',name:'B-Complex',units:'capsule',rat:'B1/B2/B5/B6-P5P/B12; COMT-safe methylated B12'},{id:'sm7',mfr:'Thorne',name:'D3/K2 Liquid',units:'drops',rat:'3000 IU D3 + MK-4; VDR/CYP2R1 variants; target 70-80 ng/mL'},{id:'sm8',mfr:'Coromega',name:'DHA Xtra',units:'softgels',rat:'FADS1/FADS2 variants; APOE4 neuroprotection'},{id:'sm9',mfr:'Bulk Supplements',name:'Creatine',units:'g',rat:'Athletic performance; neuroprotection; APOE4 support'},{id:'sm10',mfr:'Rx',name:'Ezetimibe',units:'tablet',rat:'ApoB target <60; APOE4 cardiovascular management'},{id:'sm11',mfr:'Jarrow',name:'Pterostilbene',units:'mg',rat:'APOE4 neuroinflammation; NF-kB suppression; COMT-safe'},{id:'sm12',mfr:'Jarrow',name:'Magtein',units:'g',rat:'CNS-targeted Mg; APOE4 neuroprotection; sleep architecture'},{id:'sm13',mfr:'Quicksilver',name:'Liposomal C',units:'mg',rat:'SLC23A variants; APOE4 oxidative stress'},{id:'sm14',mfr:'Swanson',name:'Apigenin',units:'mg',rat:'NAD+ CD38 inhibition; sleep; mild COMT inhibition'},{id:'sm15',mfr:'Bulk Supplements',name:'Glycine',units:'g',rat:'Sleep quality; methylation buffer; COMT Met/Met; collagen'},{id:'sm16',mfr:'Rx',name:'Rosuvastatin',units:'mg',rat:'ApoB target <60; night dosing for hepatic synthesis peak'}];
const DSCH=[{id:'sc1',mid:'sm1',grp:'morning-water',qty:14,tag:'',on:true},{id:'sc2',mid:'sm2',grp:'morning-water',qty:0.125,tag:'',on:true},{id:'sc3',mid:'sm3',grp:'morning-water',qty:1,tag:'optional',on:true},{id:'sc4',mid:'sm4',grp:'breakfast',qty:1,tag:'',on:true},{id:'sc5',mid:'sm5',grp:'breakfast',qty:1,tag:'',on:true},{id:'sc6',mid:'sm6',grp:'breakfast',qty:1,tag:'interim',on:true},{id:'sc7',mid:'sm7',grp:'breakfast',qty:6,tag:'',on:true},{id:'sc8',mid:'sm8',grp:'breakfast',qty:2,tag:'',on:true},{id:'sc9',mid:'sm9',grp:'breakfast',qty:5,tag:'',on:true},{id:'sc10',mid:'sm10',grp:'breakfast',qty:1,tag:'',on:true},{id:'sc11',mid:'sm11',grp:'breakfast',qty:50,tag:'',on:true},{id:'sc12',mid:'sm5',grp:'lunch',qty:3,tag:'',on:true},{id:'sc13',mid:'sm4',grp:'bedtime',qty:3,tag:'',on:true},{id:'sc14',mid:'sm12',grp:'bedtime',qty:1,tag:'',on:true},{id:'sc15',mid:'sm13',grp:'bedtime',qty:500,tag:'',on:true},{id:'sc16',mid:'sm14',grp:'bedtime',qty:50,tag:'',on:true},{id:'sc17',mid:'sm15',grp:'bedtime',qty:4,tag:'',on:true},{id:'sc18',mid:'sm16',grp:'bedtime',qty:2.5,tag:'',on:true}];
const DFD=[{id:'f1',nm:'Betaine Greens',sec:'Vegetables',dg:1,wg:0,on:true,srv:'85g cooked spinach, beet greens, or Swiss chard',ceil:'200g daily',col:'auto',why:'BHMT+PEMT variants reduce homocysteine clearance. Dietary betaine targets homocysteine <7.2 since TMG is excluded.'},{id:'f2',nm:'Dark Greens / Cruciferous',sec:'Vegetables',dg:1,wg:0,on:true,srv:'85g cooked kale, arugula, collards, broccoli, Brussels sprouts, cauliflower',ceil:'No limit',col:'auto',why:'Activates NRF2 pathway for APOE4 cellular defense. Nitrates support vascular function via NOS3 variant.'},{id:'f3',nm:'Colorful Veg',sec:'Vegetables',dg:1.5,wg:0,on:true,srv:'85g red bell pepper, carrots, beets, tomatoes, red cabbage',ceil:'No limit',col:'auto',why:'BCO1 variants reduce beta-carotene conversion. SLC23A2 variant demands food-form vitamin C.'},{id:'f4',nm:'Other Veg',sec:'Vegetables',dg:0,wg:0,on:true,srv:'85g any vegetable including onions, mushrooms, zucchini, asparagus. Half avocado = 1 serving.',ceil:'No limit',col:'auto',why:'Counts toward daily vegetable total. Avocado moved here: healthy monounsaturated fats, potassium, enhances fat-soluble vitamin absorption.'},{id:'f5',nm:'Berries',sec:'Fruit',dg:1,wg:0,on:true,srv:'85g blueberries, blackberries, strawberries, or raspberries',ceil:'200g combined daily fruit',col:'auto',why:'SIRT1 rs932658 AA genotype responds well to berry polyphenols. Strongest food-based evidence for APOE4 neuroinflammation reduction.'},{id:'f6',nm:'Other Fruit',sec:'Fruit',dg:1,wg:0,on:true,srv:'1 piece citrus, kiwi, pomegranate, or green-tipped banana',ceil:'200g combined daily fruit',col:'auto',why:'SLC23A2 variant demands higher vitamin C. Pomegranate has specific APOE4 neuroprotective evidence.'},{id:'f7',nm:'Eggs',sec:'Protein',dg:1,wg:0,on:true,srv:'2 whole eggs',ceil:'3 daily',col:'auto',why:'Primary choline delivery for APOE4/PEMT variants (~294mg). Ceiling reflects APOE4 dietary cholesterol sensitivity.'},{id:'f8',nm:'Fish',sec:'Protein',dg:0,wg:5,on:true,srv:'140g cooked salmon, sardines, mackerel, trout, cod, or halibut. Tuna max 2x/week.',ceil:'200g per sitting',col:'auto',why:'FADS1/FADS2 variants impair ALA to EPA/DHA conversion. Maintains omega index 9.8%.'},{id:'f9',nm:'Fowl',sec:'Protein',dg:0,wg:5,on:true,srv:'140g cooked chicken or turkey breast, skinless preferred',ceil:'No limit',col:'auto',why:'Primary weekly protein anchor for leucine threshold. AMPD1 variant increases post-exercise protein requirement.'},{id:'f10',nm:'Red Meat / Pork',sec:'Protein',dg:0,wg:1,on:true,srv:'140g cooked grass-fed beef, bison, or pork tenderloin',ceil:'0=amber 1-2=green 3=yellow 4+=red weekly',col:'auto',why:'Heme iron for iron saturation at 24%. Always pair with vitamin C. ApoB 57 well controlled.'},{id:'f11',nm:'Smart Carbs',sec:'Grains',dg:1,wg:0,on:true,srv:'40g dry steel cut oats OR 100g cooked quinoa, basmati, sweet potato, sourdough, farro, or barley',ceil:'150g cooked at any sitting',col:'auto',why:'PPARD and AMPD1 variants require adequate carbohydrate for performance.'},{id:'f12',nm:'Refined Grains',sec:'Grains',dg:0,wg:0,on:true,srv:'150g cooked white pasta, white rice, white bread, risotto, or white potato',ceil:'Minimize',col:'amber',why:'Refined carbs spike glucose - track for awareness.'},{id:'f13',nm:'Extra Virgin Olive Oil',sec:'Fats',dg:1,wg:0,on:true,srv:'14g (1 tbsp) first cold press with vegetables - never high heat',ceil:'28g (2 tbsp) daily',col:'auto',why:'Oleocanthal provides NF-kB suppression relevant to APOE4 inflammation.'},{id:'f14',nm:'Legumes',sec:'Legumes',dg:1,wg:0,on:true,srv:'85g cooked lentils, black beans, edamame, chickpeas, navy or kidney beans',ceil:'170g daily',col:'auto',why:'Magnesium delivery supporting TRPM6 variant. Plant sterols address elevated lathosterol.'},{id:'f15',nm:'Nuts and Seeds',sec:'Nuts and Seeds',dg:1,wg:0,on:true,srv:'30g walnuts, pecans, pumpkin seeds, or sesame seeds. No peanuts.',ceil:'60g daily',col:'auto',why:'Primary food source for gamma tocopherol (currently 0.6 mg/L, below optimal).'},{id:'f16',nm:'Fermented Foods',sec:'Fermented Foods',dg:0,wg:3,on:true,srv:'180ml kefir, 150g Greek yogurt, 85g kimchi or sauerkraut, or 17g miso',ceil:'No ceiling',col:'auto',why:'WBC consistently low (3.5-3.8). APOE4 gut-brain axis research links microbiome to neuroinflammation.'},{id:'f17',nm:'Sunflower Lecithin',sec:'Choline',dg:1,wg:0,on:true,srv:'2 tsp (5g) Now Foods Sunflower Lecithin Powder with a meal',ceil:'1 tbsp (7.5g) daily',col:'auto',why:'Phosphatidylcholine for APOE4/PEMT variants. Total daily target 700-800mg choline.'}];
const FSGS={'Vegetables':4,'Fruit':2,'Protein':2};
const DAT=[{id:'a1',nm:'Cold Plunge',on:true,flds:[{nm:'Duration',t:'number',u:'minutes',min:0,max:60,step:1,def:5},{nm:'Temperature',t:'number',u:'F',min:32,max:120,step:1,def:45}]},{id:'a2',nm:'Sauna',on:true,flds:[{nm:'Duration',t:'number',u:'minutes',min:0,max:120,step:1,def:15},{nm:'Temperature',t:'number',u:'F',min:80,max:220,step:1,def:170}]},{id:'a3',nm:'Meditation',on:true,flds:[{nm:'Duration',t:'number',u:'minutes',min:0,max:180,step:1,def:10}]}];
const BWL_OPTS=[{v:'Normal',d:''},{v:'Loose',d:''},{v:'Watery',d:''},{v:'Hard',d:''}];
const DAT_BH={id:'a0bh',nm:'Bowel Health',on:true,flds:[{nm:'Bowel Health',t:'opts',opts:[{v:'Normal',d:''},{v:'Loose',d:''},{v:'Watery',d:''},{v:'Hard',d:''}]}]};
const DWB=[8,16,20,24,32],WT=90;
const DEFAULT_SUPP_UNITS=['capsule','softgel','tablet','drops','g','mg','mcg','ml','oz','tsp','tbsp','cup','serving','qty'];
const LEGACY_SUPP_UNIT_MAP=new Map([
  ['tab','tablet'],['tabs','tablet'],['caps','capsule'],['capsules','capsule'],
  ['softgels','softgel'],['gelcap','capsule'],['pill','tablet'],['pills','tablet'],
  ['drop','drops'],['tb','tablet']
]);
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
let S={gdt:null,flSave:null,sm:[],sch:[],sl:[],wb:[...DWB],wl:[],fd:[],meals:[],fl:[],ind:[],acts:[],al:[],bwl:[],fnotes:[],snotes:[],notes:[],exportModDates:[],foodGroups:[],suppGroups:[],suppUnits:[],cfg:{autoSync:true,shareOnSave:true,tabs:null,driveIds:{...DRIVE_IDS}}};
let _ovStack=[],_esmId=null,_escId=null,_efiId=null,_emId=null,_eatId=null;
let _cSLId=null,_cSSId=null,_cWLId=null,_cFId=null,_cALId=null,_cATId=null,_cNId=null,_cFNId=null,_cSNId=null,_cIId=null,_cMId=null;
let _hType=null,_hData=[],_hDataAll=[],_hFilterDay='',_hSel=new Set(),_hSelMode=true;
let _modDates=new Set(),_pendingWater=null,_supSt={},_supAdhoc={},_otherSt={};
let _listPickCtx=null;
let _bwlMigrated=false;
let _localExportDirPromise=null,_migratedDriveOff=false;
let _gToken=null,_gTokenExpiry=0;
let _autoSyncTimer=null;
const _autoSyncPendingDays=new Set();
let _expMode='multi',_expDest='drive';

function canonSuppUnitLabel(u){
  const t=String(u||'').trim();
  if(!t)return'';
  const m=LEGACY_SUPP_UNIT_MAP.get(t.toLowerCase());
  return m||t;
}
/** Map saved catalog unit string to a dropdown value present in `units` (exact, legacy canon, or case-insensitive). */
function resolveSuppUnitForSelect(saved,units){
  const raw=String(saved||'').trim();
  if(!raw)return'';
  if(units.includes(raw))return raw;
  const canon=canonSuppUnitLabel(raw);
  if(units.includes(canon))return canon;
  const low=raw.toLowerCase();
  const hit=units.find(x=>x.toLowerCase()===low);
  if(hit)return hit;
  const lowC=canon.toLowerCase();
  const hit2=units.find(x=>x.toLowerCase()===lowC);
  if(hit2)return hit2;
  return raw;
}
function normalizeSuppUnitsInState(){
  if(!Array.isArray(S.suppUnits)||!S.suppUnits.length)S.suppUnits=[...DEFAULT_SUPP_UNITS];
  const seen=new Set();
  S.suppUnits=S.suppUnits.map(x=>String(x).trim()).filter(x=>{
    if(!x||seen.has(x))return false;
    seen.add(x);return true;
  });
  S.sm.forEach(m=>{const c=canonSuppUnitLabel(m.units);if(c)m.units=c;});
  S.sm.forEach(m=>{
    const u=String(m.units||'').trim();
    if(u&&!seen.has(u)){S.suppUnits.push(u);seen.add(u);}
  });
}

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
  if(typeof S.cfg.autoSync!=='boolean')S.cfg.autoSync=true;
  if(S.cfg._autoSyncAllSaves2026!==true){S.cfg.autoSync=true;S.cfg._autoSyncAllSaves2026=true;}
  if(S.cfg.autoSync&&S.cfg._driveAutoSyncMigrated2026!==true){S.cfg._driveAutoSyncMigrated2026=true;}
  if(typeof S.cfg.shareOnSave!=='boolean')S.cfg.shareOnSave=true;
  if(typeof DT!=='undefined'&&DT.normalizeTabVisibility)S.cfg.tabs=DT.normalizeTabVisibility(S.cfg.tabs);
  else if(!S.cfg.tabs||typeof S.cfg.tabs!=='object')S.cfg.tabs={water:true,supps:true,food:true,other:true,notes:true,log:true,settings:true};
  else S.cfg.tabs.settings=true;
  if(!Array.isArray(S.exportModDates))S.exportModDates=[];
  S.exportModDates=[...new Set(S.exportModDates.filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
  _modDates=new Set(S.exportModDates);
  if(!Array.isArray(S.foodGroups)||!S.foodGroups.length){S.foodGroups=[...new Set((S.fd||[]).map(f=>f.sec).filter(Boolean))];}
  if(!Array.isArray(S.suppGroups)||!S.suppGroups.length){S.suppGroups=JSON.parse(JSON.stringify(SGP));}
  if(!Array.isArray(S.noteWikiHidden))S.noteWikiHidden=[];
  if(!Array.isArray(S.noteWikiCustom))S.noteWikiCustom=[];
  if(S.cfg.backupSavedYmd!=null&&typeof S.cfg.backupSavedYmd!=='string')delete S.cfg.backupSavedYmd;
  normalizeSuppUnitsInState();
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
let _loadFailed=false;
function showBootFatal(msg){
  const el=document.getElementById('bootErr');
  if(el){el.hidden=false;el.textContent=String(msg||'App failed to start');}
}
function ld(){
  try{
    const r=localStorage.getItem(STORAGE_KEY);
    if(r)S={...S,...JSON.parse(r)};
    else dfs();
  }catch(e){
    console.error('ld',e);
    _loadFailed=true;
    showBootFatal('Saved data could not be read. Do not use Save — open in Safari and restore from Drive backup, or paste backup JSON via Settings → Restore.');
  }
  normalizeS();
  if(_migratedDriveOff){_migratedDriveOff=false;flushLocalQuiet();}
  if(_bwlMigrated){_bwlMigrated=false;flushLocalQuiet();}
}
function dfs(){S.sm=JSON.parse(JSON.stringify(DSM));S.sch=JSON.parse(JSON.stringify(DSCH));S.fd=JSON.parse(JSON.stringify(DFD));S.acts=[JSON.parse(JSON.stringify(DAT_BH)),...JSON.parse(JSON.stringify(DAT))];S.wb=[...DWB];S.meals=[];S.cfg={autoSync:true,shareOnSave:true,tabs:{water:true,supps:true,food:true,other:true,notes:true,log:true,settings:true},driveIds:{...DRIVE_IDS}};S.gdt=null;S.flSave=null;S.sl=[];S.wl=[];S.fl=[];S.ind=[];S.al=[];S.bwl=[];S.fnotes=[];S.snotes=[];S.notes=[];S.noteWikiHidden=[];S.noteWikiCustom=[];S.exportModDates=[];S.foodGroups=[...new Set(DFD.map(f=>f.sec).filter(Boolean))];S.suppGroups=JSON.parse(JSON.stringify(SGP));S.suppUnits=[...DEFAULT_SUPP_UNITS];_modDates=new Set();}

function gFoodGroups(){return(S.foodGroups&&S.foodGroups.length)?S.foodGroups:[...new Set(S.fd.filter(f=>f.on).map(f=>f.sec).filter(Boolean))];}
function gSuppGroups(){return(S.suppGroups&&S.suppGroups.length)?S.suppGroups:SGP;}
function gSuppUnits(){return(S.suppUnits&&S.suppUnits.length)?S.suppUnits.slice():[...DEFAULT_SUPP_UNITS];}
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
function logEntryDay(e){return DT.logEntryDay(e);}
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
const now=()=>DT.now();
function localDateYMD(d){return DT.localDateYMD(d);}
const td=()=>DT.td();
function wks(){return DT.wks();}
function f12(iso){if(!iso)return'--';const d=new Date(iso);let h=d.getHours(),m=d.getMinutes(),ap=h>=12?'PM':'AM';h=h%12||12;return h+':'+String(m).padStart(2,'0')+' '+ap;}
function fDT(iso){if(!iso)return'Now';const d=new Date(iso);const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return mo[d.getMonth()]+' '+d.getDate()+'\n'+f12(iso);}
function fL(v){return v?new Date(v).toISOString():now();}
function gEDt(){return DT.getEffectiveLogDt(S);}
function isoToLocalYMD(iso){return DT.isoToLocalYMD(iso);}
function logDateKey(){return DT.logDateKey(S);}
function matchesLogDay(eDt,logIso){return DT.matchesLogDay(eDt,logIso);}
function onLogDay(iso,dt){return DT.onLogDay(iso,dt);}
/** UTC ISO instant with trailing `Z` (daily-log-requirements-v2 §5). */
function laStamp(iso){
  if(iso==null||iso==='')return '';
  const s=String(iso).trim();
  if(!s)return '';
  const d=new Date(s);
  if(isNaN(d.getTime()))return '';
  return d.toISOString().replace(/\.\d{3}Z$/,'Z');
}
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
function queueAutoSync(days){
  const arr=Array.isArray(days)?days:(days?[days]:[]);
  arr.forEach(d=>{
    const y=typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)?d:isoToLocalYMD(d);
    if(y)_autoSyncPendingDays.add(y);
  });
  clearTimeout(_autoSyncTimer);
  _autoSyncTimer=setTimeout(runQueuedAutoSync,1200);
}
async function runQueuedAutoSync(){
  if(S.cfg.autoSync===false)return;
  const dates=[..._autoSyncPendingDays];
  _autoSyncPendingDays.clear();
  if(!dates.length)return;
  if(!S.cfg.driveIds?.dailyLogs)return;
  if(!gDriveTokenValid())return;
  try{await syncDrive(dates);}catch(e){console.warn('auto-sync',e);}
}
function commitLogChange(dt){
  markMod(dt);
  const ok=sv();
  if(ok)queueAutoSync([isoToLocalYMD(dt||now())]);
  return ok;
}
function tabVisible(id){return typeof DT!=='undefined'&&DT.isTabVisible?DT.isTabVisible(S.cfg.tabs,id):S.cfg.tabs?.[id]!==false;}
function rTabVisibility(){
  document.querySelectorAll('.tabs .tab[data-tab]').forEach(el=>{
    const id=el.dataset.tab;
    el.style.display=tabVisible(id)?'':'none';
  });
  const actPg=document.querySelector('.pg.act');
  if(actPg){
    const cur=actPg.id.replace('pg-','');
    if(!tabVisible(cur)){
      const first=(typeof DT!=='undefined'&&DT.visibleTabIds?DT.visibleTabIds(S.cfg.tabs):['water','supps','food','other','notes','log','settings']).find(tabVisible);
      if(first){
        const tabEl=document.querySelector('.tab[data-tab="'+first+'"]');
        if(tabEl)sw(first,tabEl);
      }
    }
  }
}
function rTabToggles(){
  const c=document.getElementById('tabTogglesCard');if(!c)return;
  const labels={water:'Water',supps:'Supplements',food:'Food',other:'Other',notes:'Notes',log:'Log'};
  let h='';
  Object.keys(labels).forEach(id=>{
    const on=tabVisible(id);
    h+='<div class="set-row" onclick="togTabVis(\''+id+'\')" style="cursor:pointer"><div class="mii"><div class="mn">'+labels[id]+' tab</div><div class="mm">'+(on?'Visible — you can log here':'Hidden — no new logging; past data stays on phone and in Sync/Export')+'</div></div><div class="tg'+(on?' on':'')+'" id="tgTab-'+id+'"></div></div>';
  });
  c.innerHTML=h;
}
function togTabVis(id){
  if(!S.cfg.tabs)S.cfg.tabs={};
  S.cfg.tabs[id]=!tabVisible(id);
  if(typeof DT!=='undefined'&&DT.normalizeTabVisibility)S.cfg.tabs=DT.normalizeTabVisibility(S.cfg.tabs);
  sv();rTabVisibility();rTabToggles();
}
function numSpec(f){return typeof DT!=='undefined'&&DT.numberFieldSpec?DT.numberFieldSpec(f):{min:null,max:null,step:null,def:null,colon:false};}
function fieldUsesColon(f){return typeof DT!=='undefined'&&DT.isColonStepField?DT.isColonStepField(f):false;}
function appendNumberFieldDom(div,fd,f,val){
  const spec=numSpec(f);
  const idN='num-'+f.nm.replace(/\s/g,'_');
  const ttl='<div class="fl">'+escHTML(f.nm)+(f.u?' ('+escHTML(f.u)+')':'')+'</div>';
  if(fieldUsesColon(f)){
    let opts=typeof DT!=='undefined'&&DT.colonSelectOptions?DT.colonSelectOptions(f):[];
    if(typeof DT!=='undefined'&&DT.withEmptyNumberOption)opts=DT.withEmptyNumberOption(opts);
    let sel='';
    if(val!==undefined&&val!==null&&String(val)!=='')sel=String(val);
    if(opts.length){
      div.innerHTML=ttl+'<select id="'+idN+'">'+opts.map(o=>'<option value="'+escHTML(o.value)+'"'+(String(o.value)===String(sel)?' selected':'')+'>'+escHTML(o.label)+'</option>').join('')+'</select>';
    }else{
      div.innerHTML=ttl+'<input type="text" id="'+idN+'" inputmode="numeric" placeholder="M:SS or H:MM" value="'+escHTML(sel!==undefined&&sel!==null?String(sel):'')+'">';
    }
    fd.appendChild(div);
    return;
  }
  const useSel=typeof DT!=='undefined'&&DT.shouldUseNumberSelect&&DT.shouldUseNumberSelect(spec,f);
  if(useSel){
    const min=spec.min,max=spec.max,step=spec.step||1;
    let selVal=null;
    if(val!==undefined&&val!==null&&val!==''){
      const n=Number(val);
      if(Number.isFinite(n))selVal=Math.min(max,Math.max(min,n));
    }
    const optHtml=['<option value=""'+(selVal===null?' selected':'')+'>\u2014</option>'];
    for(let v=min;v<=max+1e-9;v+=step){
      const t=Math.round(v*1000)/1000;
      optHtml.push('<option value="'+t+'"'+(selVal!==null&&Math.abs(t-selVal)<1e-6?' selected':'')+'>'+t+(f.u?' '+escHTML(f.u):'')+'</option>');
    }
    div.innerHTML=ttl+'<select id="'+idN+'">'+optHtml.join('')+'</select>';
  }else{
    let attrs='type="number" id="'+idN+'"';
    if(spec.step!=null&&typeof spec.step==='number')attrs+=' step="'+spec.step+'"';
    if(spec.min!=null)attrs+=' min="'+spec.min+'"';
    if(spec.max!=null)attrs+=' max="'+spec.max+'"';
    if(val!==undefined&&val!==null&&val!==''&&Number.isFinite(Number(val)))attrs+=' value="'+escHTML(String(val))+'"';
    div.innerHTML=ttl+'<input '+attrs+'>';
  }
  fd.appendChild(div);
}
function readNumberFieldValue(f){
  const idN='num-'+f.nm.replace(/\s/g,'_');
  const el=document.getElementById(idN);
  if(!el)return undefined;
  const raw=el.value;
  if(raw===''||raw===undefined||raw===null)return undefined;
  if(fieldUsesColon(f))return String(raw).trim();
  const n=el.tagName==='SELECT'?parseFloat(raw):parseFloat(raw);
  return Number.isFinite(n)?n:undefined;
}
function resetAfterSave(){
  DT.resetAfterSave(id=>document.getElementById(id));
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
  try{
    closeAllOv();
    rAppVersion();
    ld();
    if(_loadFailed)return;
    migrateStoredLogsOnce();touchAppOpenDay();rH();rW();rS();rF();rA();rN();
    const tgA=document.getElementById('tgAutoSync');if(tgA)tgA.classList.toggle('on',S.cfg.autoSync!==false);
    const tgS=document.getElementById('tgShareOnSave');if(tgS)tgS.classList.toggle('on',S.cfg.shareOnSave!==false);
    rTabVisibility();rTabToggles();setInterval(rH,60000);initSwipe();gDriveCheckHash();
    const en=document.getElementById('eatNm');if(en)en.addEventListener('input',function(){this.classList.remove('eat-miss-err');});
    initNoteWikiListeners();
    window.addEventListener('pagehide',flushLocalQuiet);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushLocalQuiet();});
    rLocalExportLbl();
    const tabsEl=document.querySelector('.tabs');
    if(tabsEl)tabsEl.addEventListener('click',e=>{
      const tab=e.target.closest('.tab[data-tab]');
      if(tab)sw(tab.dataset.tab,tab);
    });
  }catch(e){
    console.error('init',e);
    showBootFatal('Startup error: '+(e&&e.message?e.message:e)+'. Force-refresh in Safari, then reopen the app.');
  }
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

function isoToTimeLocal(iso){return DT.isoToTimeLocal(iso);}
function dateAndTimeToISO(dateStr,timeStr){return DT.dateAndTimeToISO(dateStr,timeStr);}
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
function sw(n,el){if(!tabVisible(n))return;document.querySelectorAll('.pg').forEach(p=>p.classList.remove('act'));document.querySelectorAll('.tab').forEach(t=>t.classList.remove('act'));document.getElementById('pg-'+n).classList.add('act');el.classList.add('act');if(n==='log')rLog();if(n==='settings'){rLocalExportLbl();rTabToggles();document.getElementById('tgShareOnSave').classList.toggle('on',S.cfg.shareOnSave!==false);document.getElementById('tgAutoSync').classList.toggle('on',S.cfg.autoSync!==false);}}

// WATER
function rW(){
  const logIso=gEDt();const es=S.wl.filter(e=>matchesLogDay(e.dt,logIso));const tot=es.reduce((s,e)=>s+e.qty,0);
  document.getElementById('wT').textContent=tot;const pct=Math.min(100,Math.round(tot/WT*100));
  document.getElementById('wB').style.width=pct+'%';document.getElementById('wP').textContent=pct+'%';
  const g=document.getElementById('wQB');g.innerHTML='';
  S.wb.forEach(oz=>{if(!oz||oz<=0)return;const b=document.createElement('div');b.className='qb';b.textContent='+'+oz;b.onclick=()=>{S.wl.push({id:uid(),dt:gEDt(),la:now(),qty:oz,nt:''});commitLogChange(gEDt());rW();};g.appendChild(b);});
  const l=document.getElementById('wL');
  if(!es.length){l.innerHTML='<div style="padding:13px;font-family:Courier New,monospace;font-size:10px;color:var(--mt)">No entries yet</div>';return;}
  l.innerHTML=es.map(e=>'<div class="row" onclick="oWE(\''+e.id+'\')"><div class="ri"><div class="rn">+'+e.qty+' oz</div>'+(e.nt?'<div class="rm">'+escHTML(e.nt)+'</div>':'')+'</div><div class="wlt">'+f12(e.dt)+'</div></div>').join('')+'<div style="display:flex;justify-content:space-between;padding:10px 13px;font-family:Courier New,monospace;font-size:11px;border-top:1px solid var(--bd)"><span>Total</span><span style="color:var(--bl);font-weight:700">'+tot+' oz</span></div>';
}
function oWE(id){_cWLId=id;const e=id?S.wl.find(x=>x.id===id):null;document.getElementById('weT').textContent=id?'Edit Water':'Log Water';document.getElementById('weQ').value=e?e.qty:16;document.getElementById('weNt').value=e?(e.nt||''):'';document.getElementById('weDl').style.display=id?'block':'none';openOvRoot('ovWE');}
function aWQ(d){const el=document.getElementById('weQ');el.value=Math.max(0,parseFloat(el.value||0)+d);}
function cfWE(){const qty=parseFloat(document.getElementById('weQ').value)||0;const nt=document.getElementById('weNt').value;if(_cWLId){const e=S.wl.find(x=>x.id===_cWLId);if(e){e.qty=qty;e.nt=nt;commitLogChange(e.dt);}}else{const dt=gEDt();S.wl.push({id:uid(),dt,la:now(),qty,nt});commitLogChange(dt);}closeAllOv();rW();document.getElementById('weQ').value=16;document.getElementById('weNt').value='';}
function dWE(){const e=S.wl.find(x=>x.id===_cWLId);S.wl=S.wl.filter(x=>x.id!==_cWLId);if(e)commitLogChange(e.dt);else sv();closeAllOv();rW();}
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
  if(logId){const e=S.sl.find(x=>x.id===logId);if(e){e.qty=qty;e.nt=nt;e.sk=sk;commitLogChange(e.dt);}}
  else{_supSt[sid]={qty,nt,sk};}
  closeAllOv();rS();document.getElementById('seNt').value='';
}
function dSE(){
  const mid=document.getElementById('ovSE').dataset.mid;
  if(mid){delete _supAdhoc[mid];document.getElementById('ovSE').dataset.mid='';closeAllOv();rS();return;}
  const sid=document.getElementById('ovSE').dataset.sid;const logId=document.getElementById('ovSE').dataset.logId;
  if(logId){const e=S.sl.find(x=>x.id===logId);S.sl=S.sl.filter(x=>x.id!==logId);if(e)commitLogChange(e.dt);else sv();}
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
function oESM(id){_esmId=id;const m=id?S.sm.find(x=>x.id===id):null;document.getElementById('esmT').textContent=id?'Edit Supplement':'Add Supplement';document.getElementById('esmMfr').value=m?.mfr||'';document.getElementById('esmNm').value=m?.name||'';fillSuppUnitsSelect(document.getElementById('esmU'),m?.units||'');document.getElementById('esmRt').value=m?.rat||'';document.getElementById('esmDl').style.display=id?'block':'none';openOvPush('ovESM');}
function cfESM(){const d={mfr:document.getElementById('esmMfr').value,name:document.getElementById('esmNm').value,units:document.getElementById('esmU').value,rat:document.getElementById('esmRt').value};if(_esmId){const m=S.sm.find(x=>x.id===_esmId);if(m)Object.assign(m,d);}else S.sm.push({id:uid(),...d});normalizeSuppUnitsInState();sv();popOv();rMSL();rS();shT('Saved');}
function dSM(){S.sm=S.sm.filter(x=>x.id!==_esmId);S.sch=S.sch.filter(x=>x.mid!==_esmId);sv();popOv();rMSL();rS();}
function fillSuppUnitsSelect(sel,valRaw){
  if(!sel)return;
  const units=gSuppUnits();
  const pick=resolveSuppUnitForSelect(valRaw,units);
  sel.innerHTML='';
  const z=document.createElement('option');z.value='';z.textContent='\u2014 select unit \u2014';sel.appendChild(z);
  units.forEach(u=>{const o=document.createElement('option');o.value=u;o.textContent=u;sel.appendChild(o);});
  if(pick&&!units.includes(pick)){const o=document.createElement('option');o.value=pick;o.textContent=pick+' (custom)';sel.appendChild(o);}
  sel.value=pick||'';
  if(pick&&sel.value!==pick){
    const o=document.createElement('option');o.value=pick;o.textContent=pick+' (custom)';sel.appendChild(o);
    sel.value=pick;
  }
}
function refreshEsmUnitSelect(){const sel=document.getElementById('esmU');if(!sel)return;fillSuppUnitsSelect(sel,sel.value);}
function oMSUp(){rMSUp();openOvPush('ovMSUp');}
function oMSUpTab(){rMSUp();openOvRoot('ovMSUp');}
function rMSUp(){
  const c=document.getElementById('msuL');if(!c)return;
  c.innerHTML='';
  gSuppUnits().forEach((u,i)=>{
    const div=document.createElement('div');div.className='mi';
    const left=document.createElement('div');left.className='mii';
    left.innerHTML='<div class="mn">'+escHTML(u)+'</div>';
    const right=document.createElement('div');right.className='mia';
    const del=document.createElement('button');del.type='button';del.className='bdl';del.style.padding='6px 12px';del.style.fontSize='11px';del.textContent='Delete';
    del.onclick=e=>{e.stopPropagation();delSuppUnit(i);};
    right.appendChild(del);
    div.appendChild(left);div.appendChild(right);
    c.appendChild(div);
  });
}
function cfMSUpDone(){popOv();refreshEsmUnitSelect();}
function addSuppUnit(){
  const nm=prompt('New unit label:');if(!nm||!nm.trim())return;
  const u=nm.trim();
  if(!S.suppUnits)S.suppUnits=[];
  if(S.suppUnits.includes(u)){shT('Unit already exists');return;}
  S.suppUnits.push(u);sv();rMSUp();refreshEsmUnitSelect();shT('Unit added');
}
function delSuppUnit(i){
  const units=gSuppUnits();
  const u=units[i];if(u===undefined)return;
  const inUse=S.sm.some(m=>String(m.units||'')===u);
  if(inUse&&!confirm('"'+u+'" is used by at least one supplement. Remove this label from the list anyway?'))return;
  S.suppUnits.splice(i,1);sv();rMSUp();refreshEsmUnitSelect();shT('Unit removed');
}
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
function gDFQ(fid){return DT.gDFQ(S,fid);}
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
function gTFQ(fid){return DT.gTFQ(S,fid);}
function bumpFlSave(ts){DT.bumpFlSave(S,ts);}
function gWFQ(fid){return DT.gWFQ(S,fid);}
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
  commitLogChange(gEDt());rF();
}
function oFD(fid){const f=S.fd.find(x=>x.id===fid);if(!f)return;_cFId=fid;document.getElementById('fdN').textContent=f.nm;let gs='';if(f.dg>0)gs+='Daily: '+f.dg+' servings';if(f.wg>0)gs+=(gs?' - ':'')+('Weekly: '+f.wg+'x');document.getElementById('fdG').textContent=gs||'Tracking only';document.getElementById('fdW').textContent=f.why||'';document.getElementById('fdS').textContent=f.srv||'--';document.getElementById('fdC').textContent=f.ceil||'--';document.getElementById('fdQ').value=gTFQ(fid);document.getElementById('fdNt').value='';openOvRoot('ovFD');}
function aFQ(d){const el=document.getElementById('fdQ');el.value=Math.max(0,Math.round((parseFloat(el.value||0)+d)*10)/10);}
function cfFD(){const qty=parseFloat(document.getElementById('fdQ').value)||0;const nt=document.getElementById('fdNt').value;const dt=gEDt();const logDay=isoToLocalYMD(dt);const fs=S.flSave;S.fl=S.fl.filter(e=>!(String(e.fid)===String(_cFId)&&isoToLocalYMD(e.dt)===logDay&&(!fs||new Date(e.la)>=new Date(fs))));if(qty>0)S.fl.push({id:uid(),fid:_cFId,dt,la:now(),qty,nt});commitLogChange(dt);closeAllOv();rF();document.getElementById('fdQ').value=0;document.getElementById('fdNt').value='';}
function oFDInfo(fid){
  const f=S.fd.find(x=>x.id===fid);if(!f)return;
  document.getElementById('fdiN').textContent=f.nm;let gs='';if(f.dg>0)gs+='Daily: '+f.dg+' servings';if(f.wg>0)gs+=(gs?' - ':'')+('Weekly: '+f.wg+'x');document.getElementById('fdiG').textContent=gs||'Tracking only';document.getElementById('fdiW').textContent=f.why||'';document.getElementById('fdiS').textContent=f.srv||'--';document.getElementById('fdiC').textContent=f.ceil||'--';
  const top=_ovStack.length?_ovStack[_ovStack.length-1]:'';
  if(top==='ovML'||top==='ovEM')openOvPush('ovFDInfo');else openOvRoot('ovFDInfo');
}
function oInd(id){_cIId=id;const i=id?S.ind.find(x=>x.id===id):null;document.getElementById('indT').textContent=id?'Edit Indulgence':'Log Indulgence';document.getElementById('indTx').value=i?i.txt:'';document.getElementById('indNt').value=i?(i.nt||''):'';document.getElementById('indDl').style.display=id?'block':'none';openOvRoot('ovIND');}
function cfInd(){const txt=document.getElementById('indTx').value.trim();const nt=document.getElementById('indNt').value;if(!txt){closeAllOv();return;}const dt=gEDt();if(_cIId){const i=S.ind.find(x=>x.id===_cIId);if(i){i.txt=txt;i.nt=nt;commitLogChange(i.dt);}}else{S.ind.push({id:uid(),dt,la:now(),txt,nt});commitLogChange(dt);}closeAllOv();rF();document.getElementById('indTx').value='';document.getElementById('indNt').value='';}
function dInd(){const i=S.ind.find(x=>x.id===_cIId);S.ind=S.ind.filter(x=>x.id!==_cIId);if(i)commitLogChange(i.dt);else sv();closeAllOv();rF();}

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
  commitLogChange(dt);closeAllOv();_cMId=null;
  if(mlRoot)mlRoot.innerHTML='';
  document.getElementById('mlNt').value='';
  S.gdt=null;rH();
  // Navigate to food tab and reset
  const ft=document.querySelector('.tab[data-tab="food"]');if(ft)sw('food',ft);else rF();
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

/** Choices currently selected on a logged List field (`multi` ⇒ string[] stored in `S.al`, else string). */
function optsChosenArray(f,val){
  if(val===undefined||val===null||val==='')return[];
  if(f.multi){
    if(Array.isArray(val))return val.map(String).filter(Boolean);
    if(typeof val==='string'){
      try{const p=JSON.parse(val);if(Array.isArray(p))return p.map(String).filter(Boolean);}catch{}
      return val.trim()?[val.trim()]:[];
    }
    return[];
  }
  if(typeof val==='string')return val.trim()? [val.trim()]:[];
  if(Array.isArray(val)&&val.length)return[String(val[0])];
  return[];
}
/** Human-readable for cards / history rows. */
function formatOptsFldDisplay(f,v){
  if(!f.multi)return(v!==undefined&&v!==null&&String(v)!=='')?String(v):'';
  return optsChosenArray(f,v).join(', ');
}

// OTHER
function actQuickField(a){
  if(a.inline===false)return null;
  if(!a.flds||a.flds.length!==1)return null;
  const f=a.flds[0];
  if(f.t==='yesno')return{field:f,type:'yesno'};
  if(f.t==='opts'&&f.opts&&f.opts.length>=1&&f.opts.length<=5)return{field:f,type:'opts'};
  return null;
}
function sortPendingOptsVals(vals,optsOrder){
  if(!optsOrder||!optsOrder.length)return vals;
  const idx=v=>{const i=optsOrder.indexOf(v);return i<0?optsOrder.length:i};
  return [...vals].sort((a,b)=>idx(a)-idx(b));
}
function pendOtherAct(aid,fieldNm,val,isMulti,optsOrder){
  if(isMulti){
    const cur=_otherSt[aid];
    let vals=[];
    if(cur&&cur.fieldNm===fieldNm){
      if(Array.isArray(cur.vals))vals=cur.vals.slice();
      else if(cur.val!==undefined&&cur.val!==null&&String(cur.val)!=='')vals=[String(cur.val)];
    }
    const sv=String(val);
    const ix=vals.indexOf(sv);
    if(ix>=0)vals.splice(ix,1);else vals.push(sv);
    vals=sortPendingOptsVals(vals,optsOrder);
    if(vals.length===0)delete _otherSt[aid];
    else _otherSt[aid]={fieldNm,vals,multi:true};
    rA();return;
  }
  if(_otherSt[aid]&&_otherSt[aid].val===val)delete _otherSt[aid];
  else _otherSt[aid]={fieldNm,val};
  rA();
}
function actListCardProfile(a){return typeof DT!=='undefined'&&DT.actListCardProfile?DT.actListCardProfile(a):null;}
function otherCardSub(todayCount){
  return todayCount?todayCount+' logged today':'';
}
function otherCardDefaultsHtml(profile,selArr){
  if(!profile)return'';
  const optLines=typeof DT!=='undefined'&&DT.formatOptDefaultsLines?DT.formatOptDefaultsLines(profile.listField,profile.valueFields||[]):[];
  const fieldLines=(!optLines.length&&typeof DT!=='undefined'&&DT.formatFieldDefLines)?DT.formatFieldDefLines(profile.valueFields||[]):[];
  if(!optLines.length&&!fieldLines.length)return'';
  let h='<div class="a-defs">';
  optLines.forEach(line=>{
    h+='<div class="ach ach-ro"><span class="ach-l">'+escHTML(line.label)+'</span> '+escHTML(line.text)+'</div>';
  });
  fieldLines.forEach(line=>{h+='<div class="ach ach-ro">'+escHTML(line.text)+'</div>';});
  return h+'</div>';
}
function rA(){
  const c=document.getElementById('aList');c.innerHTML='';
  const day=logDateKey();
  S.acts.filter(a=>a.on).forEach(a=>{
    const todayAL=S.al.filter(e=>e.aid===a.id&&isoToLocalYMD(e.dt)===day);
    const card=document.createElement('div');
    const qf=actQuickField(a);
    const profile=actListCardProfile(a);
    if(profile){
      const listField=profile.listField;
      card.className='ac ac-ql';
      const pend=_otherSt[a.id];
      const pendVals=new Set(
        pend&&pend.fieldNm===listField.nm
          ? (pend.multi&&Array.isArray(pend.vals)?pend.vals:(pend.val!==undefined&&pend.val!==null&&String(pend.val)!==''?[String(pend.val)]:[]))
          : []
      );
      const selArr=[...pendVals];
      const head=document.createElement('div');head.className='acl';head.onclick=()=>oAE(a.id,null);
      const sub=otherCardSub(todayAL.length);
      head.innerHTML='<div class="an">'+escHTML(a.nm)+'</div>'+(sub?'<div class="as2">'+escHTML(sub)+'</div>':'');
      const btnsDiv=document.createElement('div');btnsDiv.className='aq';
      (listField.opts||[]).forEach(o=>{
        const v=o.v;
        const isPend=pendVals.has(v);
        const b=document.createElement('div');
        b.className='aqb'+(isPend?' aqbp':'');
        b.textContent=v;
        b.addEventListener('click',ev=>{ev.stopPropagation();pendOtherAct(a.id,listField.nm,v,!!listField.multi,(listField.opts||[]).map(x=>x.v));});
        btnsDiv.appendChild(b);
      });
      card.appendChild(head);card.appendChild(btnsDiv);
      const defHtml=otherCardDefaultsHtml(profile,selArr);
      if(defHtml){const wrap=document.createElement('div');wrap.innerHTML=defHtml;card.appendChild(wrap.firstChild);}
    }else if(qf){
      card.className='ac ac-ql';
      const pend=_otherSt[a.id];
      const pendVals=new Set(
        pend&&pend.fieldNm===qf.field.nm
          ? (pend.multi&&Array.isArray(pend.vals)?pend.vals:(pend.val!==undefined&&pend.val!==null&&String(pend.val)!==''?[String(pend.val)]:[]))
          : []
      );
      const head=document.createElement('div');head.className='acl';head.onclick=()=>oAE(a.id,null);
      const sub=otherCardSub(todayAL.length);
      head.innerHTML='<div class="an">'+escHTML(a.nm)+'</div>'+(sub?'<div class="as2">'+escHTML(sub)+'</div>':'');
      const btnsDiv=document.createElement('div');btnsDiv.className='aq';
      const opts=qf.type==='yesno'?['Yes','No']:qf.field.opts.map(o=>o.v);
      opts.forEach(v=>{
        const isPend=pendVals.has(v);
        const b=document.createElement('div');
        b.className='aqb'+(isPend?' aqbp':'');
        b.textContent=v;
        b.addEventListener('click',ev=>{ev.stopPropagation();pendOtherAct(a.id,qf.field.nm,v,qf.field.multi,qf.field.opts.map(o=>o.v));});
        btnsDiv.appendChild(b);
      });
      card.appendChild(head);card.appendChild(btnsDiv);
    }else{
      const le=todayAL.length?todayAL[todayAL.length-1]:null;
      card.className='ac';card.onclick=()=>oAE(a.id,null);
      let fh=le?a.flds.map(f=>{const v=le.flds[f.nm];const disp=f.t==='opts'?formatOptsFldDisplay(f,v):null;if(f.t==='opts')return disp?'<div class="ach">'+escHTML(f.nm)+': '+escHTML(disp)+'</div>':'';return(v!==undefined&&v!=='')? '<div class="ach">'+escHTML(f.nm)+': '+escHTML(String(v))+(f.u&&f.t==='number'?' '+escHTML(f.u):'')+'</div>':''}).join(''):a.flds.filter(f=>f.t!=='text').map(f=>f.t==='opts'?'<div class="ach">'+escHTML(f.nm)+(f.multi?' · multi ':' ')+'('+(f.opts||[]).length+' choices)</div>':'<div class="ach">'+escHTML(f.nm)+(f.u?' ('+escHTML(f.u)+')':'')+'</div>').join('');
      card.innerHTML='<div><div class="an">'+escHTML(a.nm)+'</div>'+(todayAL.length?'<div class="as2">'+todayAL.length+' logged today'+(le?' \xb7 last '+f12(le.dt):'')+'</div>':'')+'</div><div class="af">'+fh+'</div>';
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
      const ttl=document.createElement('div');ttl.className='fl';ttl.textContent=f.nm+(f.multi?' · tap all that apply':'');
      const outer=document.createElement('div');outer.className='bwg';outer.id='pickBox-'+slug;
      const hid=document.createElement('input');hid.type='hidden';hid.id='pickVal-'+slug;
      const picked=optsChosenArray(f,val);
      hid.value=f.multi?JSON.stringify(picked):(picked[0]||'');
      div.appendChild(ttl);div.appendChild(outer);div.appendChild(hid);fd.appendChild(div);
      if(!opts.length)outer.innerHTML='<div style="font-size:11px;color:var(--mt);padding:8px">No choices defined for this field.</div>';
      else opts.forEach(o=>{
        const isSel=f.multi ? picked.includes(o.v) : picked[0]===o.v;
        const pickRow=document.createElement('div');pickRow.className='bwo'+(isSel?' sel':'');
        pickRow.dataset.v=o.v;
        pickRow.innerHTML='<div class="bwon">'+escHTML(o.v)+'</div><div class="bwod">'+escHTML(o.d||'')+'</div>';
        pickRow.onclick=()=>{
          if(!f.multi){
            outer.querySelectorAll('.bwo').forEach(x=>x.classList.remove('sel'));
            pickRow.classList.add('sel');
            hid.value=o.v;
          }else{
            pickRow.classList.toggle('sel');
            const vs=[...outer.querySelectorAll('.bwo.sel')].map(x=>/** @type {HTMLElement}*/(x).dataset.v||'').filter(Boolean);
            hid.value=JSON.stringify(vs);
          }
        };
        outer.appendChild(pickRow);
      });
      return;
    }
    if(f.t==='number'){
      appendNumberFieldDom(div,fd,f,val);
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
  for(const f of a.flds){
    if(f.t!=='opts')continue;
    const slug=f.nm.replace(/\s/g,'_');const h=document.getElementById('pickVal-'+slug);
    if(!f.multi){
      if(!h||!String(h.value||'').trim()){shT('Select: '+f.nm);return;}
    }else{
      let arr=[];try{arr=JSON.parse(String(h?.value||'[]'));}catch{arr=[];}
      if(!Array.isArray(arr)||!arr.map(String).filter(Boolean).length){shT('Select at least one: '+f.nm);return;}
    }
  }
  const dt=gEDt();const nt=document.getElementById('aeNt').value;const flds={};
a.flds.forEach(f=>{
  if(f.t==='number'){
    const n=readNumberFieldValue(f);
    if(n!==undefined)flds[f.nm]=n;
  }else if(f.t==='opts'){const slug=f.nm.replace(/\s/g,'_');const h=document.getElementById('pickVal-'+slug);if(h){if(f.multi){let arr=[];try{arr=JSON.parse(String(h.value||'[]'));}catch{arr=[];} flds[f.nm]=Array.isArray(arr)?arr.map(String).filter(Boolean):[];}else flds[f.nm]=String(h.value||'');}}else if(f.t==='yesno'){const ys=f.nm.replace(/\s/g,'_');const yy=document.getElementById('yn-y-'+ys);flds[f.nm]=yy&&yy.classList.contains('blg')?'Yes':'No';}else{const el=document.getElementById('af-'+f.nm.replace(/\s/g,'_'));if(el&&String(el.value||'').trim())flds[f.nm]=el.value;}
});
if(_cALId){const e=S.al.find(x=>x.id===_cALId);if(e){e.dt=dt;e.flds=flds;e.nt=nt;commitLogChange(dt);}}else{S.al.push({id:uid(),aid:_cATId,dt,la:now(),flds,nt});commitLogChange(dt);}closeAllOv();S.gdt=null;rH();rA();document.getElementById('aeNt').value='';}
function dAE(){const e=S.al.find(x=>x.id===_cALId);S.al=S.al.filter(x=>x.id!==_cALId);if(e)commitLogChange(e.dt);else sv();closeAllOv();S.gdt=null;rH();rA();}
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
  const defs=document.createElement('div');defs.className='eat-opt-defs';defs.style.marginTop='6px';
  div.appendChild(fr);div.appendChild(f2);div.appendChild(defs);
  wrap.insertBefore(div,addBtn);
  refreshEatOptDefaultInputs(o?.defaults||null,div);
}
function eatNumberFieldNames(){
  return [...document.querySelectorAll('#eatFldList .fld-type-row')].flatMap(row=>{
    if(eatRowType(row)!=='number')return[];
    const nm=(row.querySelector('input.eat-fld-nm')?.value||'').trim();
    return nm?[nm]:[];
  });
}
function eatFldRowMeta(row){
  if(eatRowType(row)!=='number')return null;
  const nm=(row.querySelector('input.eat-fld-nm')?.value||'').trim();
  const u=row.querySelector('input.fld-u')?.value||'';
  const step=row.querySelector('input.fld-step')?.value||'';
  return nm?{nm,u,step,t:'number'}:null;
}
function rowUsesColon(row){
  const m=eatFldRowMeta(row);if(!m)return false;
  return typeof DT!=='undefined'&&DT.isColonStepField?DT.isColonStepField(m):String(m.step||'').trim().startsWith(':');
}
function syncEatDefInput(row){
  const di=row.querySelector('input.fld-def');if(!di)return;
  const colon=rowUsesColon(row);
  const val=di.value;
  if(colon&&di.type!=='text'){
    const nd=document.createElement('input');nd.type='text';nd.className='fld-def';nd.placeholder='Default M:SS or H:MM';nd.style.marginTop='6px';nd.value=val;di.replaceWith(nd);
  }else if(!colon&&di.type!=='number'){
    const nd=document.createElement('input');nd.type='number';nd.className='fld-def';nd.placeholder='Default # (optional; blank = omit on save)';nd.style.marginTop='6px';nd.value=val;di.replaceWith(nd);
  }
}
function refreshEatOptDefaultInputs(seedDefaults,onlyRow){
  const metas=[...document.querySelectorAll('#eatFldList .fld-type-row')].map(eatFldRowMeta).filter(Boolean);
  const rows=onlyRow?[onlyRow]:[...document.querySelectorAll('#eatFldList .eat-opt-row')];
  rows.forEach(row=>{
    const wrap=row.querySelector('.eat-opt-defs');if(!wrap)return;
    const existing={...(seedDefaults||{})};
    wrap.querySelectorAll('.eat-opt-def').forEach(inp=>{if(inp.dataset.defNm&&inp.value!=='')existing[inp.dataset.defNm]=inp.value;});
    wrap.innerHTML='';
    metas.forEach(meta=>{
      const fdiv=document.createElement('div');fdiv.className='fld';fdiv.style.marginBottom='4px';
      const lab=document.createElement('div');lab.className='fl';lab.style.fontSize='8px';lab.textContent='Default '+meta.nm;
      const colon=typeof DT!=='undefined'&&DT.isColonStepField?DT.isColonStepField(meta):String(meta.step||'').trim().startsWith(':');
      const inp=document.createElement('input');inp.type=colon?'text':'number';inp.className='eat-opt-def';inp.dataset.defNm=meta.nm;
      if(colon)inp.placeholder='M:SS or H:MM';
      if(existing[meta.nm]!==undefined&&existing[meta.nm]!==null&&existing[meta.nm]!=='')inp.value=existing[meta.nm];
      fdiv.appendChild(lab);fdiv.appendChild(inp);wrap.appendChild(fdiv);
    });
  });
}
function appendEatNumberExtras(row,f){
  const fr=document.createElement('div');fr.className='fr2';fr.style.marginTop='6px';
  const mkNum=(cls,ph,val)=>{const inp=document.createElement('input');inp.type='number';inp.className=cls;inp.placeholder=ph;if(val!==undefined&&val!==null&&val!=='')inp.value=val;inp.style.marginTop='0';return inp;};
  const fMin=document.createElement('div');fMin.className='fld';fMin.innerHTML='<div class="fl" style="font-size:8px">Min</div>';fMin.appendChild(mkNum('fld-min','optional',f?.min));
  const fMax=document.createElement('div');fMax.className='fld';fMax.innerHTML='<div class="fl" style="font-size:8px">Max</div>';fMax.appendChild(mkNum('fld-max','optional',f?.max));
  const fSt=document.createElement('div');fSt.className='fld';fSt.innerHTML='<div class="fl" style="font-size:8px">Step</div>';
  const stInp=document.createElement('input');stInp.type='text';stInp.className='fld-step';stInp.placeholder='1 or :30';stInp.style.marginTop='0';
  if(f?.step!==undefined&&f?.step!==null&&f?.step!=='')stInp.value=String(f.step);
  fSt.appendChild(stInp);
  fr.appendChild(fMin);fr.appendChild(fMax);fr.appendChild(fSt);row.appendChild(fr);
  const hint=document.createElement('div');hint.className='ssb';hint.style.marginTop='4px';hint.style.fontSize='9px';
  hint.textContent=typeof DT!=='undefined'&&DT.stepFieldHelpText?DT.stepFieldHelpText(f?.u||''):'Step: number, or :N for colon steps';
  row.appendChild(hint);
  const uInp=row.querySelector('input.fld-u');
  const sync=()=>{syncEatDefInput(row);refreshEatOptDefaultInputs();hint.textContent=typeof DT!=='undefined'&&DT.stepFieldHelpText?DT.stepFieldHelpText(uInp?.value||''):hint.textContent;};
  if(uInp)uInp.addEventListener('input',sync);
  stInp.addEventListener('input',sync);
  syncEatDefInput(row);
}
function mkEatOptsWrap(f){
  const wrap=document.createElement('div');wrap.className='eat-opts-wrap';
  const addBtn=document.createElement('button');addBtn.type='button';addBtn.className='bcn';addBtn.style.width='100%';addBtn.style.marginTop='8px';addBtn.textContent='+ Add choice';addBtn.onclick=()=>appendEatOptRow(wrap,addBtn,null);
  wrap.appendChild(addBtn);
  (f?.opts||[]).forEach(o=>appendEatOptRow(wrap,addBtn,o));
  if(!(f?.opts||[]).length)appendEatOptRow(wrap,addBtn,null);
  return wrap;
}
/** Checkbox in setup: List fields may allow multiple selections when logging (quick-log chips support multi too). */
function appendEatOptsMultiCheckbox(row,f){
  const lab=document.createElement('label');lab.className='eat-multi-row';
  const cid='eat-multi-'+uid();
  const cb=document.createElement('input');cb.type='checkbox';cb.className='eat-opt-multi';cb.id=cid;cb.checked=!!f?.multi;
  cb.addEventListener('click',e=>e.stopPropagation());
  lab.htmlFor=cid;
  lab.appendChild(cb);lab.appendChild(document.createTextNode('Allow multiple selections'));
  row.appendChild(lab);
}
function addFldRow(f){
  const list=document.getElementById('eatFldList');if(list.children.length>=5){shT('Max 5 fields');return;}
  const t=f?.t||'number';
  const row=document.createElement('div');row.className='fld-type-row';
  if(t==='opts'&&f?.nm)row.dataset.listKey=f.nm;
  if(t!=='opts'){
    const wrap=document.createElement('div');wrap.className='eat-fld-nm-wrap';
    const nmInp=document.createElement('input');nmInp.type='text';nmInp.className='eat-fld-nm';nmInp.placeholder='Field name (e.g. Duration)';nmInp.value=f?.nm||'';
    nmInp.addEventListener('input',()=>{nmInp.classList.remove('eat-miss-err');refreshEatOptDefaultInputs();});
    wrap.appendChild(nmInp);row.appendChild(wrap);
  }
  function mkFT(lbl,typ,on){const b=document.createElement('div');b.className='ftb'+(on?' sel':'');b.textContent=lbl;b.onclick=()=>setFT(b,typ);return b;}
  row.appendChild(mkFT('Num','number',t==='number'));row.appendChild(mkFT('Text','text',t==='text'));row.appendChild(mkFT('Y/N','yesno',t==='yesno'));row.appendChild(mkFT('List','opts',t==='opts'));
  const rm=document.createElement('div');rm.style.cssText='cursor:pointer;color:var(--rd);font-size:16px;flex-shrink:0;padding:6px';rm.textContent='\u00d7';rm.onclick=()=>rmFldRow(rm);row.appendChild(rm);
  if(t==='number'){
    const ui=document.createElement('input');ui.type='text';ui.className='fld-u';ui.placeholder='Unit (e.g. minutes, F)';ui.value=f?.u||'';ui.style.marginTop='6px';row.appendChild(ui);
    const colon=f&&typeof DT!=='undefined'&&DT.isColonStepField&&DT.isColonStepField(f);
    const di=document.createElement('input');di.type=colon?'text':'number';di.className='fld-def';di.placeholder=colon?'Default M:SS or H:MM':'Default # (optional; blank = omit on save)';di.style.marginTop='6px';
    if(f?.def!==undefined&&f.def!==null&&String(f.def)!=='')di.value=f.def;
    row.appendChild(di);
    appendEatNumberExtras(row,f);
  }else if(t==='opts'){
    row.appendChild(mkEatOptsWrap(f));appendEatOptsMultiCheckbox(row,f);
  }
  list.appendChild(row);document.getElementById('eatAddFld').style.display=list.children.length>=5?'none':'block';
}
function setFT(btn,t){
  const row=btn.closest('.fld-type-row');
  row.querySelectorAll('.ftb').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');
  row.querySelector('.fld-u')?.remove();row.querySelector('.fld-def')?.remove();row.querySelector('.fr2')?.remove();row.querySelector('.eat-opts-wrap')?.remove();row.querySelector('.eat-multi-row')?.remove();
  if(t==='opts'){
    row.querySelector('.eat-fld-nm-wrap')?.remove();
    delete row.dataset.listKey;
    row.appendChild(mkEatOptsWrap(null));appendEatOptsMultiCheckbox(row,null);
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
    const di=document.createElement('input');di.type='number';di.className='fld-def';di.placeholder='Default # (optional; blank = omit on save)';di.style.marginTop='6px';row.appendChild(di);
    appendEatNumberExtras(row,null);
  }
}
function rmFldRow(el){const list=document.getElementById('eatFldList');el.closest('.fld-type-row').remove();document.getElementById('eatAddFld').style.display=list.children.length>=5?'none':'block';refreshEatOptDefaultInputs();}
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
        const defaults={};
        sub.querySelectorAll('.eat-opt-def').forEach(inp=>{
          const nm=inp.dataset.defNm;if(!nm||inp.value==='')return;
          const raw=inp.value.trim();
          const numRow=[...document.querySelectorAll('#eatFldList .fld-type-row')].find(r=>eatFldRowMeta(r)?.nm===nm);
          if(numRow&&rowUsesColon(numRow))defaults[nm]=raw;
          else{const dv=parseFloat(raw);if(Number.isFinite(dv))defaults[nm]=dv;}
        });
        const opt={v,d};if(Object.keys(defaults).length)opt.defaults=defaults;
        opts.push(opt);
      });
      if(!opts.length){
        if(firstEmptyInp){firstEmptyInp.classList.add('eat-miss-err');firstEmptyInp.scrollIntoView({behavior:'smooth',block:'nearest'});}
        const fieldLabel=(row.dataset.listKey&&row.dataset.listKey.trim())||nm;
        shT('List field "'+fieldLabel+'" needs at least one choice with a label');return;
      }
      const persisted=(row.dataset.listKey&&row.dataset.listKey.trim())||'';
      const fieldKey=persisted||(listRowsCount===1?nm:(listOrdinal===1?nm:nm+' ('+listOrdinal+')'));
      const multiOn=!!row.querySelector('.eat-opt-multi')?.checked;
      const listDef={nm:fieldKey,t:'opts',opts};
      if(multiOn)listDef.multi=true;
      flds.push(listDef);
      continue;
    }
    const nameInp=row.querySelector('input.eat-fld-nm');
    const n=(nameInp?.value||'').trim();
    if(!n){nameInp?.classList.add('eat-miss-err');nameInp?.scrollIntoView({behavior:'smooth',block:'nearest'});shT('Enter a field name (or remove the row with \u00d7)');return;}
    const uIn=row.querySelector('input.fld-u');const dIn=row.querySelector('input.fld-def');
    const minIn=row.querySelector('input.fld-min');const maxIn=row.querySelector('input.fld-max');const stepIn=row.querySelector('input.fld-step');
    const u=t==='number'?(uIn?.value||''):'';
    let def=undefined;
    if(t==='number'){
      if(dIn&&dIn.value!==''){
        const dv=dIn.value.trim();
        if(rowUsesColon(row))def=dv;
        else{const n=parseFloat(dv);if(Number.isFinite(n))def=n;}
      }
      else def=null;
    }
    const o={nm:n,t,u};
    if(def!==undefined)o.def=def;
    if(t==='number'){
      if(minIn&&minIn.value!==''){const v=parseFloat(minIn.value);if(Number.isFinite(v))o.min=v;}
      if(maxIn&&maxIn.value!==''){const v=parseFloat(maxIn.value);if(Number.isFinite(v))o.max=v;}
      if(stepIn&&stepIn.value!==''){
        const sv=stepIn.value.trim();
        if(sv.startsWith(':'))o.step=sv;
        else{const v=parseFloat(sv);if(Number.isFinite(v))o.step=v;}
      }
    }
    flds.push(o);
  }
  const inlineOn=document.getElementById('eatInline').classList.contains('on');
  const d={nm,flds};if(!inlineOn)d.inline=false;
  if(_eatId){const a=S.acts.find(x=>x.id===_eatId);if(a){a.nm=d.nm;a.flds=d.flds;if(!inlineOn)a.inline=false;else delete a.inline;}}else S.acts.push({id:uid(),on:true,...d});sv();popOv();rMAL();rA();
}
function dAT(){S.acts=S.acts.filter(x=>x.id!==_eatId);sv();popOv();rMAL();rA();}

// NOTES + [[ name picker
const NOTE_WIKI_IDS=['noteQuick','foodNoteQuick','suppNoteQuick','otherNoteQuick','aeNt','neBd'];
let _noteWikiTarget=null;
function wikiTokenFromInput(raw){
  let s=String(raw||'').trim();
  if(s.startsWith('[[')&&s.endsWith(']]'))s=s.slice(2,-2).trim();
  return typeof DT!=='undefined'&&DT.suppWikiToken?DT.suppWikiToken('',s):'[['+s+']]';
}
function noteWikiOnInput(el){
  if(!el)return;
  el.classList.add('note-dirty');
  const pos=el.selectionStart!=null?el.selectionStart:el.value.length;
  const trig=typeof DT!=='undefined'&&DT.noteWikiTriggerAt?DT.noteWikiTriggerAt(el.value,pos):null;
  if(!trig){if(_noteWikiTarget&&_noteWikiTarget.el===el)closeNoteWikiPick();return;}
  _noteWikiTarget={el,start:trig.start,end:pos};
  const si=document.getElementById('nwSrch');
  if(si){si.value=trig.query;si.oninput=()=>rNoteWikiPick();}
  rNoteWikiPick();
  if(!document.getElementById('ovNoteWiki')?.classList.contains('open'))openOvPush('ovNoteWiki');
}
function rNoteWikiPick(){
  const q=(document.getElementById('nwSrch')?.value||'').trim();
  const items=typeof DT!=='undefined'&&DT.listWikiTokens?DT.listWikiTokens(S,q):[];
  const c=document.getElementById('nwL');
  if(!c)return;
  const disp=t=>String(t).replace(/^\[\[|\]\]$/g,'');
  c.innerHTML=items.length?items.map(t=>'<div class="pick-li" data-v="'+escHTML(t)+'"><div class="pl-nm">'+escHTML(disp(t))+'</div><div class="pl-mm">'+escHTML(t)+'</div></div>').join(''):'<div style="padding:12px;font-family:Courier New,monospace;font-size:10px;color:var(--mt)">No matches</div>';
  c.onclick=e=>{const li=e.target.closest('.pick-li');if(!li||!c.contains(li))return;insertNoteWikiToken(li.getAttribute('data-v')||'');};
}
function insertNoteWikiToken(token){
  const ctx=_noteWikiTarget;if(!ctx||!ctx.el||!token)return;
  const el=ctx.el;
  const before=el.value.slice(0,ctx.start);
  const after=el.value.slice(ctx.end);
  el.value=before+token+after;
  const pos=before.length+token.length;
  el.setSelectionRange(pos,pos);
  el.focus();
  closeNoteWikiPick();
}
function closeNoteWikiPick(){_noteWikiTarget=null;const ov=document.getElementById('ovNoteWiki');if(ov&&ov.classList.contains('open'))popOv();}
function cfNoteWikiNew(){
  const inp=document.getElementById('nwNew');const raw=inp?.value.trim();if(!raw){shT('Enter a name');return;}
  const token=wikiTokenFromInput(raw);
  if(!S.noteWikiCustom.includes(token))S.noteWikiCustom.push(token);
  sv();
  if(inp)inp.value='';
  if(_noteWikiTarget)insertNoteWikiToken(token);
  else{rNoteWikiPick();shT('Added');}
}
let _noteWikiManageRows=[];
function oNoteWikiManage(){rNoteWikiManage();openOvRoot('ovNoteWikiMgr');}
function rNoteWikiManage(){
  const c=document.getElementById('nwmL');if(!c)return;
  _noteWikiManageRows=typeof DT!=='undefined'&&DT.listWikiTokensForManage?DT.listWikiTokensForManage(S):[];
  c.innerHTML=_noteWikiManageRows.map((row,i)=>{
    const disp=String(row.token).replace(/^\[\[|\]\]$/g,'');
    return '<div class="mi"><div class="mii" style="cursor:default"><div class="mn">'+escHTML(disp)+'</div><div class="mm">'+escHTML(row.token)+(row.fromCatalog?' \u00b7 catalog':' \u00b7 custom')+'</div></div><div class="mia"><div class="tg'+(row.hidden?' on':'')+'" onclick="togNoteWikiHideI('+i+')"></div></div></div>';
  }).join('')||'<div style="color:var(--mt);font-size:10px;padding:12px">No names yet</div>';
}
function togNoteWikiHideI(i){
  const row=_noteWikiManageRows[i];if(!row)return;togNoteWikiHide(row.token);
}
function togNoteWikiHide(token){
  const i=S.noteWikiHidden.indexOf(token);
  if(i>=0)S.noteWikiHidden.splice(i,1);
  else S.noteWikiHidden.push(token);
  sv();rNoteWikiManage();
}
function addNoteWikiCustomPrompt(){
  const raw=prompt('Name (e.g. Thorne Magnesium):');if(!raw||!raw.trim())return;
  const token=wikiTokenFromInput(raw);
  if(!S.noteWikiCustom.includes(token))S.noteWikiCustom.push(token);
  sv();rNoteWikiManage();shT('Added');
}
function initNoteWikiListeners(){
  NOTE_WIKI_IDS.forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.addEventListener('input',()=>noteWikiOnInput(el));
    el.addEventListener('click',()=>noteWikiOnInput(el));
  });
}

function svQuickNote(){const el=document.getElementById('noteQuick');const bd=el?el.value.trim():'';if(!bd)return;const dt=gEDt();S.notes.push({id:uid(),dt,la:now(),bd});commitLogChange(dt);el.value='';el.classList.remove('note-dirty');rN();shT('Note saved');}
function svFoodNote(){const el=document.getElementById('foodNoteQuick');const bd=el?el.value.trim():'';if(!bd)return;const dt=gEDt();S.fnotes.push({id:uid(),dt,la:now(),bd});commitLogChange(dt);el.value='';el.classList.remove('note-dirty');rF();}
function svSuppNote(){const el=document.getElementById('suppNoteQuick');const bd=el?el.value.trim():'';if(!bd)return;const dt=gEDt();S.snotes.push({id:uid(),dt,la:now(),bd});commitLogChange(dt);el.value='';el.classList.remove('note-dirty');rS();}
function rN(){
  const day=logDateKey();
  const tn=S.notes.filter(n=>isoToLocalYMD(n.dt)===day).sort((a,b)=>b.dt.localeCompare(a.dt));
  const c=document.getElementById('nList');
  if(!tn.length){c.innerHTML='<div style="color:var(--mt);font-family:Courier New,monospace;font-size:10px;padding:10px 0;text-align:center">No notes today</div>';return;}
  c.innerHTML=tn.map(n=>'<div class="nc" onclick="oNoteEdit(\''+n.id+'\')"><div class="nh"><div class="nti">'+f12(n.dt)+'</div></div><div class="nb">'+escHTML(n.bd)+'</div></div>').join('');
}
function oNoteEdit(id){_cNId=id;_cFNId=null;_cSNId=null;const n=id?S.notes.find(x=>x.id===id):null;document.getElementById('neBd').value=n?.bd||'';document.getElementById('neDl').style.display=id?'block':'none';openOvRoot('ovNoteEdit');}
function oFNEdit(id){_cFNId=id;_cNId=null;_cSNId=null;const n=id?S.fnotes.find(x=>x.id===id):null;document.getElementById('neBd').value=n?.bd||'';document.getElementById('neDl').style.display=id?'block':'none';openOvRoot('ovNoteEdit');}
function oSNEdit(id){_cSNId=id;_cNId=null;_cFNId=null;const n=id?S.snotes.find(x=>x.id===id):null;document.getElementById('neBd').value=n?.bd||'';document.getElementById('neDl').style.display=id?'block':'none';openOvRoot('ovNoteEdit');}
function cfNE(){const bd=document.getElementById('neBd').value;const dt=gEDt();if(_cSNId){const n=S.snotes.find(x=>x.id===_cSNId);if(n){n.bd=bd;commitLogChange(n.dt);}closeAllOv();rS();return;}if(_cFNId){const n=S.fnotes.find(x=>x.id===_cFNId);if(n){n.bd=bd;commitLogChange(n.dt);}closeAllOv();rF();return;}if(_cNId){const n=S.notes.find(x=>x.id===_cNId);if(n){n.bd=bd;commitLogChange(n.dt);}}else{S.notes.push({id:uid(),dt,la:now(),bd});commitLogChange(dt);}closeAllOv();rN();}
function dNE(){if(_cSNId){const n=S.snotes.find(x=>x.id===_cSNId);S.snotes=S.snotes.filter(x=>x.id!==_cSNId);if(n)commitLogChange(n.dt);else sv();closeAllOv();rS();return;}if(_cFNId){const n=S.fnotes.find(x=>x.id===_cFNId);S.fnotes=S.fnotes.filter(x=>x.id!==_cFNId);if(n)commitLogChange(n.dt);else sv();closeAllOv();rF();return;}const n=S.notes.find(x=>x.id===_cNId);S.notes=S.notes.filter(x=>x.id!==_cNId);if(n)commitLogChange(n.dt);else sv();closeAllOv();rN();}

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
  commitLogChange(e.dt);closeAllOv();
  oH(_hType||'food');
}
function dFLE(){
  const e=S.fl.find(x=>x.id===_cFLId);
  S.fl=S.fl.filter(x=>x.id!==_cFLId);
  if(e)commitLogChange(e.dt);else sv();
  closeAllOv();
  oH(_hType||'food');
  rF();
}

// HISTORY
function logStoreAPI(){return typeof DT!=='undefined'?DT:null;}
function decorateHistoryRows(type,rows){
  if(type==='water')return rows.map(e=>({...e,_lb:'+'+e.qty+' oz'+(e.nt?' - '+e.nt:''),_fn:"oWE('"+e.id+"')"}));
  if(type==='supps'){
    return rows.map(e=>{
      if(e.sid!==undefined){
        const sc=S.sch.find(x=>x.id===e.sid);const m=S.sm.find(x=>x.id===sc?.mid);
        return{...e,_lb:(m?.mfr?m.mfr+' \u2014 ':'')+(m?.name||'?')+' '+e.qty+' '+(m?.units||'')+(e.sk?' (skipped)':''),_fn:"oSEbyLId('"+e.id+"')"};
      }
      return{...e,_lb:'Note: '+(e.bd||'').slice(0,60),_fn:"oSNEdit('"+e.id+"')"};
    });
  }
  if(type==='food'){
    const mealMkrs=S.fl.filter(e=>e.fid==='__meal__');
    return rows.map(e=>{
      if(e.fid!==undefined){
        const f=S.fd.find(x=>x.id===e.fid);
        const meal=mealMkrs.find(m=>m.dt===e.dt);
        return{...e,_lb:(f?.nm||'?')+' \xd7'+e.qty,_mealMkrId:meal?.id||null,_fn:"oFLEdit('"+e.id+"')"};
      }
      return{...e,_lb:'Note: '+(e.bd||'').slice(0,60),_fn:"oFNEdit('"+e.id+"')"};
    });
  }
  if(type==='other'){
    return rows.map(e=>{
      const a=S.acts.find(x=>x.id===e.aid);
      const fs=Object.entries(e.flds||{})
        .filter(([k,v])=>v!==''&&v!==undefined&&!(Array.isArray(v)&&!v.length))
        .map(([k,v])=>{
          const fld=a?.flds?.find(x=>x.nm===k);
          const vs=fld?.t==='opts'?formatOptsFldDisplay(fld,v):null;
          return k+':'+(vs||(Array.isArray(v)?v.join(', '):v));
        }).join(' ');
      return{...e,_lb:(a?.nm||'?')+(fs?' - '+fs:''),_fn:"oAEbyLId('"+e.id+"')"};
    });
  }
  if(type==='notes')return rows.map(e=>({...e,_lb:e.bd?e.bd.slice(0,60):'(empty)',_fn:"oNoteEdit('"+e.id+"')"}));
  return rows;
}
function buildHistoryData(type){
  const api=logStoreAPI();
  const rows=api&&api.listLogs?api.listLogs(S,type,{}):[];
  return decorateHistoryRows(type,rows);
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
function bulkDel(){if(!_hSel.size){shT('Select entries first');return;}if(!confirm('Delete '+_hSel.size+' selected entr'+(_hSel.size>1?'ies':'y')+'?'))return;const ids=[..._hSel];const affected=new Set();_hData.filter(e=>ids.includes(e.id)).forEach(e=>affected.add(isoToLocalYMD(e.dt)));const api=logStoreAPI();if(api&&api.removeLogIds)api.removeLogIds(S,_hType,ids);sv();queueAutoSync([...affected]);_hDataAll=_hDataAll.filter(x=>!ids.includes(x.id));_hSel=new Set();applyHDataFilter();rW();rS();rF();rA();rN();shT('Deleted');}
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
  const ids=[..._hSel];
  const affected=new Set();
  _hData.filter(e=>ids.includes(e.id)).forEach(e=>{affected.add(isoToLocalYMD(e.dt));markMod(e.dt);});
  const api=logStoreAPI();
  const updated=api&&api.updateLogDt?api.updateLogDt(S,_hType,ids,newDt):0;
  if(!updated){shT('No entries updated');return;}
  affected.add(isoToLocalYMD(newDt));
  markMod(newDt);
  _hDataAll=buildHistoryData(_hType);
  if(!sv())return;
  queueAutoSync([...affected]);
  const newDay=isoToLocalYMD(newDt);
  if(_hFilterDay&&_hFilterDay!==newDay)clearHDayFilter();
  popOv();
  _hSel=new Set();
  applyHDataFilter();
  rW();rS();rF();rA();rN();
  shT('Updated '+updated+' entr'+(updated>1?'ies':'y')+' to '+newDay);
}
function oSEbyLId(lid){
  const api=logStoreAPI();
  const le=api?.getLog?api.getLog(S,'supps',lid):S.sl.find(x=>x.id===lid)||(S.snotes||[]).find(x=>x.id===lid);
  if(!le)return;
  if(le.sid)oSE(le.sid,lid);else oSNEdit(lid);
}
function oAEbyLId(lid){const le=logStoreAPI()?.getLog?logStoreAPI().getLog(S,'other',lid):S.al.find(x=>x.id===lid);if(le)oAE(le.aid,lid);}

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
    sm:S.sm,sch:S.sch,fd:S.fd,meals:S.meals,acts:S.acts,wb:S.wb,cfg:S.cfg,suppUnits:S.suppUnits
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
async function tryLocalDiskExport(logDateKeys,wantDailyLog=true,wantCfg=true,mode='multi'){
  const root=await getLocalExportDirHandle();
  if(!root)return false;
  try{
    const base=await fsGetSubdir(root,[LOCAL_EXPORT_ROOT]);
    const uniq=[...new Set(logDateKeys.map(d=>ymdFromLogKey(d)).filter(Boolean))].sort();
    if(wantDailyLog){
      const logDir=await fsGetSubdir(base,[LOCAL_EXPORT_DAILY_LOGS_DIR]);
      if(mode==='single'){
        const text=gCombinedTrackerLogRange(uniq);
        const fn=uniq[0]+'_'+uniq[uniq.length-1]+'.md';
        await fsWriteTextFile(logDir,fn,text);
      }else{
        for(const d of uniq){
          const existing=await fsReadTextFile(logDir,d+'.md');
          const text=composeDailyLogContent(existing,d);
          if(text===null)return false;
          await fsWriteTextFile(logDir,d+'.md',text);
        }
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
  const day=td();
  const ok=await driveWrite('DT_Backup_'+day+'.json',JSON.stringify(S,null,2),S.cfg.driveIds.backups);
  if(ok){S.cfg.backupSavedYmd=day;sv();setDS('Backup saved '+day,'ok');shT('Backup saved');}else setDS('Backup failed','err');
}
async function doRestore(){if(!confirm('Restore from latest Drive backup? This overwrites current data.'))return;shT('Open Claude and ask it to read your latest backup file from Drive and paste the JSON');}

function openAlert(title,msg){
  const t=document.getElementById('alertT');const m=document.getElementById('alertM');
  if(t)t.textContent=title||'Notice';
  if(m)m.textContent=msg||'';
  openOvRoot('ovAlert');
}
function closeAlert(){closeAllOv();}

async function ensureDailyBackupAfterSave(){
  const day=td();
  if(!S.cfg.driveIds?.backups)return;
  if(S.cfg.backupSavedYmd===day)return;
  if(!gDriveTokenValid()){
    openAlert('Daily backup not saved','Connect Google Drive (Log \u2192 Sync Drive), then press Save again to retry today\'s backup.');
    return;
  }
  const ok=await driveWrite('DT_Backup_'+day+'.json',JSON.stringify(S,null,2),S.cfg.driveIds.backups);
  if(ok){S.cfg.backupSavedYmd=day;sv();}
  else openAlert('Daily backup failed','Could not save DT_Backup_'+day+'.json to your Drive backups folder. Check Settings \u2192 Drive Folder IDs, then Save again.');
}

// LOG — hybrid Daily Log (markdown summary + embedded JSON)
function exportTabOn(id){
  return typeof DT!=='undefined'&&DT.tabVisibleForExport?DT.tabVisibleForExport(S.cfg.tabs,id):tabVisible(id);
}
function gDailyLogJSON(dt){
  const tabs=S.cfg.tabs;
  const payload={date:dt,day_of_week:dayOfWeekName(dt)};
  if(exportTabOn('supps')){
    const sle=S.sl.filter(e=>onLogDay(e.dt,dt)&&!isWaterSuppLog(e)).sort((a,b)=>a.dt.localeCompare(b.dt));
    payload.supplements_logged=sle.map(e=>{
      const sc=S.sch.find(x=>x.id===e.sid);
      const m=S.sm.find(x=>x.id===sc?.mid);
      return{time:f12(e.dt),manufacturer:cleanMfr(m?.mfr),name:suppWikiLink(m?.mfr,m?.name),qty:e.qty,units:m?.units||null};
    });
    payload.supplement_notes=(S.snotes||[]).filter(e=>onLogDay(e.dt,dt)).map(n=>({time:f12(n.dt),logged_at:laStamp(n.la||n.dt),note:n.bd}));
  }
  if(exportTabOn('water')){
    const waterEntries=S.wl.filter(e=>onLogDay(e.dt,dt)).sort((a,b)=>a.dt.localeCompare(b.dt));
    payload.water_logged=waterEntries.map(e=>({logged_at:laStamp(e.la||e.dt),time:f12(e.dt),qty_oz:e.qty,notes:e.nt&&String(e.nt).trim()?e.nt:null}));
    const total=Math.round(waterEntries.reduce((s,e)=>s+(parseFloat(e.qty)||0),0));
    if(total)payload.total_water_intake_oz=total;
  }
  if(exportTabOn('food')){
    const foodEntries=S.fl.filter(e=>onLogDay(e.dt,dt)&&e.fid!=='__meal__').sort((a,b)=>a.dt.localeCompare(b.dt));
    payload.food_logged=foodEntries.map(e=>{
      const f=S.fd.find(x=>x.id===e.fid);
      return{logged_at:laStamp(e.la||e.dt),time:f12(e.dt),item:f?.nm||'Unknown',servings:e.qty,notes:e.nt&&String(e.nt).trim()?e.nt:null};
    });
    const food_categories_served=emptyFoodCategories();
    foodEntries.forEach(e=>{
      const f=S.fd.find(x=>x.id===e.fid);
      const k=foodCategoryKey(f?.nm||'');
      if(!food_categories_served[k])food_categories_served[k]=0;
      food_categories_served[k]+=parseFloat(e.qty)||0;
    });
    Object.keys(food_categories_served).forEach(k=>{food_categories_served[k]=Math.round(food_categories_served[k]*1000)/1000;});
    payload.food_categories_served=food_categories_served;
    payload.meals_executed=S.fl.filter(e=>onLogDay(e.dt,dt)&&e.fid==='__meal__').map(e=>e.mnm+(e.nt&&String(e.nt).trim()?' -- '+e.nt:''));
  }
  if(exportTabOn('other')){
    const giEvents=[];
    const lifestyle_protocols=[];
    S.al.filter(e=>onLogDay(e.dt,dt)).sort((a,b)=>a.dt.localeCompare(b.dt)).forEach(e=>{
      const act=S.acts.find(x=>x.id===e.aid);
      const type=act?.nm||'Other';
      const ls=laStamp(e.la||e.dt);
      const tm=f12(e.dt);
      if(type==='Bowel Health'){
        const status=Object.values(e.flds||{}).find(v=>v!==undefined&&v!==''&&!(Array.isArray(v)&&v.length===0));
        if(status!==undefined)giEvents.push({time:tm,logged_at:ls,status:Array.isArray(status)?status.join(', '):String(status)});
        return;
      }
      const norm=typeof DT!=='undefined'&&DT.normalizeActivityExport?DT.normalizeActivityExport(e.flds||{},act):{};
      const row={type,time:tm,logged_at:ls,...norm};
      const nt=e.nt&&String(e.nt).trim();
      if(nt)row.notes=nt;
      lifestyle_protocols.push(row);
    });
    if(giEvents.length){
      payload.gastrointestinal_tracking={
        total_movements:giEvents.length,
        urgent_or_watery_present:giEvents.some(ev=>/watery|loose/i.test(ev.status)),
        events:giEvents
      };
    }
    payload.lifestyle_protocols=lifestyle_protocols;
  }
  return typeof DT!=='undefined'&&DT.pruneExportPayload?DT.pruneExportPayload(payload):payload;
}
function lifestyleMarkdownLine(p){
  const parts=[p.type,p.time];
  const skip=new Set(['type','time','logged_at','notes']);
  const extras=[];
  Object.keys(p).sort().forEach(k=>{
    if(skip.has(k))return;
    const v=p[k];
    if(v===undefined||v===null||v==='')return;
    extras.push(k.replace(/_/g,' ')+': '+ (Array.isArray(v)?v.join(', '):String(v)));
  });
  if(extras.length)parts.push('— '+extras.join(', '));
  if(p.notes)parts.push('— '+p.notes);
  return parts.join(' ');
}
function gDailyLogMarkdownTop(dt,payload){
  const lines=[];
  lines.push('# '+payload.day_of_week+' — '+dt);
  lines.push('');
  const chron=[];
  if(exportTabOn('supps')){
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
    (payload.supplement_notes||[]).forEach(n=>{chron.push({sort:timeSortKey(n.time),text:'**'+n.time+':** '+n.note});});
  }
  if(exportTabOn('water')&&payload.water_logged){
    payload.water_logged.forEach(w=>{
      const isSuppWater=w.notes&&/supplement/i.test(w.notes);
      if(!isSuppWater)chron.push({sort:timeSortKey(w.time),text:'**'+w.time+':** water '+w.qty_oz+' oz.'});
    });
  }
  if(exportTabOn('food')){
    const foodByTime={};
    (payload.food_logged||[]).forEach(f=>{
      if(!foodByTime[f.time])foodByTime[f.time]=[];
      foodByTime[f.time].push(f.item+' '+f.servings);
    });
    Object.keys(foodByTime).forEach(tm=>chron.push({sort:timeSortKey(tm),text:'**'+tm+':** '+foodByTime[tm].join(', ')+'.'}));
    (S.ind||[]).filter(e=>onLogDay(e.dt,dt)).forEach(e=>{chron.push({sort:timeSortKey(f12(e.dt)),text:'**'+f12(e.dt)+':** indulgence — '+e.txt+(e.nt?' ('+e.nt+')':'')});});
    (S.fnotes||[]).filter(e=>onLogDay(e.dt,dt)).forEach(n=>{chron.push({sort:timeSortKey(f12(n.dt)),text:'**'+f12(n.dt)+':** food note — '+n.bd});});
  }
  if(exportTabOn('notes')){
    (S.notes||[]).filter(n=>onLogDay(n.dt,dt)).forEach(n=>{chron.push({sort:timeSortKey(f12(n.dt)),text:'**'+f12(n.dt)+':** '+n.bd});});
  }
  const hasTop=exportTabOn('supps')||exportTabOn('food')||exportTabOn('notes')||exportTabOn('water');
  if(hasTop){
    lines.push('## 📝 Subjective Notes & Food Logs');
    lines.push('* **Supplement & Food Notes:**');
    chron.sort((a,b)=>a.sort-b.sort);
    if(chron.length)chron.forEach(c=>lines.push('    * '+c.text));
    else lines.push('    * (none)');
    if(exportTabOn('water')&&payload.total_water_intake_oz)lines.push('    * **Water today:** '+payload.total_water_intake_oz+' oz total.');
    if(exportTabOn('food')){
      lines.push('* **Meals executed:**');
      if(payload.meals_executed&&payload.meals_executed.length)payload.meals_executed.forEach(m=>lines.push('    * '+m));
      else lines.push('    * (none)');
    }
    lines.push('');
  }
  if(exportTabOn('other')&&(payload.gastrointestinal_tracking||payload.lifestyle_protocols)){
    lines.push('## ⚠️ Internal Triggers & Biometric Realities');
    if(payload.gastrointestinal_tracking){
      const bowel=(payload.gastrointestinal_tracking.events||[]).map(e=>e.time+' '+e.status).join('; ');
      lines.push('* **Bowel Health:**'+(bowel?' '+bowel+'.':' (none)'));
    }
    if(payload.lifestyle_protocols){
      const life=(payload.lifestyle_protocols||[]).map(lifestyleMarkdownLine).join('; ');
      lines.push('* **Lifestyle Elements:**'+(life?' '+life+'.':' (none)'));
    }
  }
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
  const head=gDailyLogMarkdownTop(dt,payload)+'\n\n';
  if(typeof DT!=='undefined'&&DT.formatYamlJournalFenceFromPayload)
    return head+DT.formatYamlJournalFenceFromPayload(/** @type {Record<string,unknown>} */(payload));
  return head+'```yaml journal\n'+JSON.stringify(payload,null,2)+'\n```\n';
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
  const modeLbl=_expMode==='single'?' · single combined file':' · one file per day';
  const sub=(dates.length===1?dates[0]:dates.length+' days ('+dates[0]+' – '+dates[dates.length-1]+')')+modeLbl;
  document.getElementById('expSub').textContent=sub;
}
function setExpMode(mode){_expMode=mode==='single'?'single':'multi';setExpCb('expModeMulti',_expMode==='multi');setExpCb('expModeSingle',_expMode==='single');rExpSub();}
function setExpDest(dest){_expDest=dest==='other'?'other':'drive';setExpCb('expDestDrive',_expDest==='drive');setExpCb('expDestOther',_expDest==='other');}
function gCombinedTrackerLogRange(dates){
  if(typeof DT!=='undefined'&&DT.combinedTrackerLogText)return DT.combinedTrackerLogText(dates,gDailyLogForDate);
  return dates.map(d=>gDailyLogForDate(d)).join('\n\n');
}
async function exportToDrive(wantDailyLog,wantCfg,dates,mode){
  if(!gDriveTokenValid()){gDriveAuth('sync');return false;}
  const ids=S.cfg.driveIds||{};
  if(wantDailyLog){
    if(!ids.dailyLogs){setDS('No Daily Logs folder ID — go to Settings → Drive Folder IDs','err');return false;}
    if(mode==='single'){
      const fn=dates[0]+'_'+dates[dates.length-1]+'.md';
      const ok=await driveWrite(fn,gCombinedTrackerLogRange(dates),ids.dailyLogs);
      if(!ok)return false;
    }else{
      for(const d of dates){
        const content=await dailyLogContentForSave(d);
        if(content===null)return false;
        const ok=await driveWrite(d+'.md',content,ids.dailyLogs);
        if(!ok)return false;
      }
    }
  }
  if(wantCfg){
    const cfgDay=isoToLocalYMD(now());
    const cfgJson=gConfigSnapshotJSON();
    if(ids.backups)await driveWrite('config-'+cfgDay+'.json',cfgJson,ids.backups);
    else if(ids.dailyLogs)await driveWrite('config-'+cfgDay+'.json',cfgJson,ids.dailyLogs);
  }
  setDS('Exported to Drive '+new Date().toLocaleTimeString(),'ok');
  return true;
}
function oExport(){
  if(Object.keys(_supSt).length||Object.keys(_otherSt).length){shT('Save first — pending items not committed');return;}
  ['expDailyLog','expCfg','expAllCb'].forEach(id=>setExpCb(id,true));
  setExpMode('multi');
  setExpDest('drive');
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
  let dates=datesInRange(start,end);
  if(start>end)dates=datesInRange(end,start);
  closeAllOv();
  await exportExternal(wantDailyLog,wantCfg,dates,{mode:_expMode,dest:_expDest});
}
function downloadBlob(filename,text){
  const a=document.createElement('a');
  a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(text);
  a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);
}
async function exportExternal(wantDailyLog=true,wantCfg=true,exportDates,opts){
  opts=opts||{};
  const mode=opts.mode||_expMode||'multi';
  const dest=opts.dest||_expDest||'drive';
  if(!exportDates||!exportDates.length)exportDates=_modDates.size?[..._modDates]:[td()];
  const uniq=[...new Set(exportDates.map(d=>ymdFromLogKey(d)).filter(Boolean))].sort();
  const dates=uniq.length?uniq:[td()];
  const cfgDay=isoToLocalYMD(now());
  if(dest==='drive'){
    const ok=await exportToDrive(wantDailyLog,wantCfg,dates,mode);
    if(ok)clearExportDirty();
    return;
  }
  async function buildFiles(){
    const files=[];
    if(wantDailyLog){
      if(mode==='single'){
        const fn=dates[0]+'_'+dates[dates.length-1]+'.md';
        files.push(new File([gCombinedTrackerLogRange(dates)],fn,{type:'text/markdown'}));
      }else{
        for(const d of dates){
          const text=await dailyLogContentForSave(d);
          if(text===null)return null;
          files.push(new File([text],d+'.md',{type:'text/markdown'}));
        }
      }
    }
    if(wantCfg)files.push(new File([gConfigSnapshotJSON()],'config-'+cfgDay+'.json',{type:'text/plain'}));
    return files;
  }
  const singleMdOnly=mode==='single'&&wantDailyLog&&!wantCfg;
  if(singleMdOnly&&wantDailyLog){
    const fn=dates[0]+'_'+dates[dates.length-1]+'.md';
    const body=gCombinedTrackerLogRange(dates);
    if(typeof window.showSaveFilePicker==='function'){
      try{
        const fh=await window.showSaveFilePicker({suggestedName:fn,types:[{description:'Markdown',accept:{'text/markdown':['.md'],'text/plain':['.md']}}]});
        const w=await fh.createWritable();await w.write(body);await w.close();
        clearExportDirty();shT('Exported');return;
      }catch(e){if(e&&e.name==='AbortError')return;console.warn('showSaveFilePicker single',e);}
    }
    if(await tryLocalDiskExport(dates,true,false,mode)){clearExportDirty();shT('Exported');return;}
    downloadBlob(fn,body);
    clearExportDirty();shT('Downloaded to Downloads folder');return;
  }
  const shareOk=S.cfg.shareOnSave!==false&&typeof navigator.share==='function';
  if(shareOk){
    const files=await buildFiles();
    if(files===null)return;
    try{
      await navigator.share({files});
      clearExportDirty();shT('Exported');return;
    }catch(e){
      if(e&&e.name==='AbortError')return;
      console.warn('share files failed',e);
    }
  }
  if(wantDailyLog||wantCfg){
    const didDisk=await tryLocalDiskExport(dates,wantDailyLog,wantCfg,mode);
    if(didDisk){clearExportDirty();shT('Exported');return;}
  }
  if(typeof window.showSaveFilePicker==='function'){
    try{
      if(wantDailyLog){
        if(mode==='single'){
          const fn=dates[0]+'_'+dates[dates.length-1]+'.md';
          const fh=await window.showSaveFilePicker({suggestedName:fn,types:[{description:'Markdown',accept:{'text/markdown':['.md'],'text/plain':['.md']}}]});
          const w=await fh.createWritable();await w.write(gCombinedTrackerLogRange(dates));await w.close();
        }else{
          for(const d of dates){
            const logText=await dailyLogContentForSave(d);
            if(logText===null)return;
            const fh=await window.showSaveFilePicker({suggestedName:d+'.md',types:[{description:'Markdown',accept:{'text/plain':['.md']}}]});
            const w=await fh.createWritable();await w.write(logText);await w.close();
          }
        }
      }
      if(wantCfg){const fh=await window.showSaveFilePicker({suggestedName:'config-'+cfgDay+'.json',types:[{description:'JSON',accept:{'text/plain':['.json']}}]});const w=await fh.createWritable();await w.write(gConfigSnapshotJSON());await w.close();}
      clearExportDirty();shT('Exported');return;
    }catch(e){if(e&&e.name==='AbortError')return;console.warn('showSaveFilePicker',e);}
  }
  if(wantDailyLog){
    if(mode==='single'){
      downloadBlob(dates[0]+'_'+dates[dates.length-1]+'.md',gCombinedTrackerLogRange(dates));
    }else{
      for(const d of dates){
        const logText=await dailyLogContentForSave(d);
        if(logText===null)return;
        downloadBlob(d+'.md',logText);
      }
    }
  }
  if(wantCfg)downloadBlob('config-'+cfgDay+'.json',gConfigSnapshotJSON());
  clearExportDirty();shT('Downloaded to Downloads folder');
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
  const otherNote=(document.getElementById('otherNoteQuick')?.value||'').trim();
  if(oaids.length){
    oaids.forEach(aid=>{
      const st=_otherSt[aid];
      const act=S.acts.find(x=>x.id===aid);
      const profile=actListCardProfile(act);
      let flds={};
      if(profile&&typeof DT!=='undefined'&&DT.buildCardActivityFlds)flds=DT.buildCardActivityFlds(profile,st);
      else if(st.multi&&Array.isArray(st.vals))flds[st.fieldNm]=st.vals;
      else flds[st.fieldNm]=st.val;
      const row={id:uid(),aid,dt:batchDt,la:now(),flds};
      if(otherNote)row.nt=otherNote;
      S.al.push(row);addedAL.push(row.id);
    });
    markMod(batchDay);
  }
  const saveTs=now();
  const saveSnap=DT.prepareGlobalSave(S,saveTs);
  if(!sv()){
    DT.rollbackGlobalSave(S,saveSnap);
    if(addedWl.length)S.wl=S.wl.filter(e=>!addedWl.includes(e.id));
    if(addedSl.length)S.sl=S.sl.filter(e=>!addedSl.includes(e.id));
    if(addedAL.length)S.al=S.al.filter(e=>!addedAL.includes(e.id));
    shT('Save failed — nothing was committed');
    rS();rW();
    return;
  }
  DT.clearStagingAfterSave({supSt:_supSt,supAdhoc:_supAdhoc,otherSt:_otherSt,pendingWater:_pendingWater});
  resetAfterSave();
  rH();rW();rS();rF();rA();rN();shT('Saved');
  const hadCommits=sids.length||adhocMids.length||oaids.length;
  if(hadCommits)queueAutoSync([batchDay]);
  if(S.cfg.autoSync!==false&&!gDriveTokenValid()&&S.cfg.driveIds?.dailyLogs)gDriveAuth('sync');
  await ensureDailyBackupAfterSave();
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
