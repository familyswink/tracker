#!/usr/bin/env python3
from pathlib import Path

p = Path(__file__).resolve().parent.parent / "index.html"
t = p.read_text()
D = "div"


def sub(old, new, name):
    global t
    if old not in t:
        raise SystemExit(f"MISSING [{name}]: {repr(old[:120])}")
    t = t.replace(old, new, 1)
    print("ok", name)


sub(
    "let _modDates=new Set(),_pendingWater=null,_supSt={},_otherSt={};",
    "let _modDates=new Set(),_pendingWater=null,_supSt={},_supAdhoc={},_otherSt={};\nlet _listPickCtx=null;",
    "js-vars",
)

def tag(cls, inner="", close=True):
    if close:
        return f"<{D} class=\"{cls}\">{inner}</{D}>"
    return f"<{D} class=\"{cls}\">{inner}"

HELPERS = r'''
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
  if(ctx.emptyLabel){h+='<PICK_LI_EMPTY/>';}
  items.forEach(it=>{h+='<PICK_LI_ITEM/>';});
  c.innerHTML=h||'<PICK_NONE/>';
}
'''.replace("<PICK_LI_EMPTY/>", f'<{D} class="pick-li" onclick="cfListPick(\'\')"><{D} class="pl-nm">\'+escHTML(ctx.emptyLabel)+\'</{D}></{D}>')
# Too messy - build HELPERS as plain string in Python

HELPERS = """
function suppSortKey(m){return ((m&&m.name)||'').toLowerCase()+'\\t'+((m&&m.mfr)||'').toLowerCase();}
function smLabel(m){if(!m)return'?';return (m.mfr?m.mfr+' \\u2014 ':'')+m.name;}
function sortedSm(){return [...S.sm].sort((a,b)=>suppSortKey(a).localeCompare(suppSortKey(b)));}
function sortedSch(){return [...S.sch].sort((a,b)=>{const ma=S.sm.find(x=>x.id===a.mid),mb=S.sm.find(x=>x.id===b.mid);return suppSortKey(ma||{}).localeCompare(suppSortKey(mb||{}));});}
function setHiddenPick(hid,lblId,val,items,emptyLbl){
  const el=document.getElementById(hid);if(el)el.value=val||'';
  const lb=document.getElementById(lblId);if(!lb)return;
  if(!val){lb.textContent=emptyLbl||'\\u2014 select \\u2014';return;}
  const it=(items||[]).find(x=>String(x.v)===String(val));
  lb.textContent=it?it.label:(val||emptyLbl||'\\u2014 select \\u2014');
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
  if(ctx.emptyLabel){h+='<div class="pick-li" onclick="cfListPick(\\'\\')"><motion class="pl-nm">'+escHTML(ctx.emptyLabel)+'</motion></motion>';}
  items.forEach(it=>{h+='<motion class="pick-li" onclick="cfListPick('+JSON.stringify(String(it.v))+')"><motion class="pl-nm">'+escHTML(it.label)+'</motion>'+(it.sub?'<motion class="pl-mm">'+escHTML(it.sub)+'</motion>':'')+'</motion>';});
  c.innerHTML=h||'<motion style="padding:12px;font-family:Courier New,monospace;font-size:10px;color:var(--mt)">No matches</motion>';
}
function cfListPick(v){
  const ctx=_listPickCtx;_listPickCtx=null;popOv();if(ctx&&ctx.onSelect)ctx.onSelect(v);
}
function pickEscSupp(){
  const items=sortedSm().map(m=>({v:m.id,label:m.name,sub:(m.mfr||'')+' \\u00b7 '+(m.units||'')}));
  openListPick({title:'Supplement',items,emptyLabel:_escId?null:'\\u2014 select supplement \\u2014',onSelect(v){document.getElementById('escSI').value=v;setHiddenPick('escSI','escSILbl',v,items,_escId?'':'\u2014 select supplement \u2014');rEscUnitsHint();}});
}
function pickEscGrp(){
  const items=gSuppGroups().map(g=>({v:g.id,label:g.lb}));
  openListPick({title:'Timing group',items,emptyLabel:_escId?null:'\\u2014 select group \\u2014',onSelect(v){document.getElementById('escGr').value=v;setHiddenPick('escGr','escGrLbl',v,items);}});
}
function pickEfiGrp(){
  const grps=gFoodGroups();
  const items=grps.map(g=>({v:g,label:g}));
  openListPick({title:'Food group',items,emptyLabel:_efiId?null:'\\u2014 select group \\u2014',onSelect(v){document.getElementById('efiSc').value=v;setHiddenPick('efiSc','efiScLbl',v,items);}});
}
function isWaterMid(mid){const m=S.sm.find(x=>x.id===mid);return m&&m.name==='Water';}
function resolveAdhocSid(mid){
  let sc=S.sch.find(x=>x.mid===mid&&!x.on);
  if(!sc)sc=S.sch.find(x=>x.mid===mid&&x.grp==='other');
  if(!sc){sc={id:uid(),mid,grp:'other',qty:1,tag:'catalog',on:false};S.sch.push(sc);}
  return sc.id;
}
function purgeLogsBeforeToday(){
  const today=td();
  const n=S.sl.length+S.wl.length+S.fl.length+S.al.length+S.ind.length+S.notes.length+S.fnotes.length+S.snotes.length;
  if(!n){shT('No log entries to clear');return;}
  if(!confirm('Delete ALL log entries before '+today+'?\\n\\nKeeps supplement catalog, schedule, food protocol, meals, and settings.'))return;
  const keep=e=>isoToLocalYMD(e.dt||(e.la||''))>=today;
  S.sl=S.sl.filter(keep);S.wl=S.wl.filter(keep);S.fl=S.fl.filter(keep);S.al=S.al.filter(keep);S.ind=S.ind.filter(keep);
  S.notes=S.notes.filter(keep);S.fnotes=S.fnotes.filter(keep);S.snotes=S.snotes.filter(keep);S.bwl=[];
  S.exportModDates=S.exportModDates.filter(d=>d>=today);_modDates=new Set(S.exportModDates);S.flSave=null;
  _supSt={};_supAdhoc={};_otherSt={};_pendingWater=null;sv();
  rH();rW();rS();rF();rA();rN();rLog();shT('Cleared logs before '+today);
}
""".replace("<motion ", "<" + D + " ").replace("</motion>", "</" + D + ">")

sub(
    "function gSuppGroups(){return(S.suppGroups&&S.suppGroups.length)?S.suppGroups:SGP;}",
    "function gSuppGroups(){return(S.suppGroups&&S.suppGroups.length)?S.suppGroups:SGP;}" + HELPERS,
    "helpers",
)

RS_ADHOC = """
  rSAdhoc();
}
function rSAdhoc(){
  const el=document.getElementById('sAdhoc');if(!el)return;
  const mids=Object.keys(_supAdhoc);
  if(!mids.length){el.innerHTML='';return;}
  let h='<div class="sh"><motion class="sl">Catalog (save to log)</motion></motion><motion class="card">';
  mids.forEach(mid=>{
    const m=S.sm.find(x=>x.id===mid);if(!m)return;
    const st=_supAdhoc[mid];const on=st&&!st.sk;const sk=st&&st.sk;
    h+='<motion class="row'+(on?' lg':'')+(sk?' sk':'')+'"><motion class="cb" onclick="event.stopPropagation();togAdhocCB(\\''+mid+'\\')">'+(on?ck():sk?xk():'')+'</motion><motion class="ri" onclick="oSEAdhoc(\\''+mid+'\\')"><motion class="rn">'+escHTML(m.name)+'</motion><motion class="rm">'+escHTML(m.mfr)+' - '+(st?st.qty:1)+' '+escHTML(m.units)+'</motion></motion></motion>';
  });
  el.innerHTML=h+'</motion>';
}
function togAdhocCB(mid){
  if(_supAdhoc[mid]){delete _supAdhoc[mid];}else{_supAdhoc[mid]={qty:1,nt:'',sk:false};}
  rS();
}
function oSuppCatalog(){
  const items=sortedSm().map(m=>({v:m.id,label:m.name,sub:(m.mfr||'')+' \\u00b7 '+(m.units||'')}));
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
""".replace("<motion ", "<" + D + " ").replace("</motion>", "</" + D + ">")

sub(
    "    sd.appendChild(card);c.appendChild(sd);\n  });\n}\nfunction isWaterSup(sid){",
    "    sd.appendChild(card);c.appendChild(sd);\n  });\n}" + RS_ADHOC + "\nfunction isWaterSup(sid){",
    "rS-adhoc",
)

# cfSE - handle mid
sub(
    "function cfSE(){\n  const sid=document.getElementById('ovSE').dataset.sid;const logId=document.getElementById('ovSE').dataset.logId;",
    "function cfSE(){\n  const mid=document.getElementById('ovSE').dataset.mid;\n  if(mid){\n    const qty=parseFloat(document.getElementById('seQ').value)||0;const nt=document.getElementById('seNt').value;const sk=qty===0;\n    _supAdhoc[mid]={qty,nt,sk};document.getElementById('ovSE').dataset.mid='';\n    closeAllOv();rS();document.getElementById('seNt').value='';return;\n  }\n  const sid=document.getElementById('ovSE').dataset.sid;const logId=document.getElementById('ovSE').dataset.logId;",
    "cfSE",
)

sub(
    "function dSE(){\n  const sid=document.getElementById('ovSE').dataset.sid;const logId=document.getElementById('ovSE').dataset.logId;",
    "function dSE(){\n  const mid=document.getElementById('ovSE').dataset.mid;\n  if(mid){delete _supAdhoc[mid];document.getElementById('ovSE').dataset.mid='';closeAllOv();rS();return;}\n  const sid=document.getElementById('ovSE').dataset.sid;const logId=document.getElementById('ovSE').dataset.logId;",
    "dSE",
)

# oSE clear mid
sub(
    "  document.getElementById('ovSE').dataset.sid=sid;document.getElementById('ovSE').dataset.logId=logId||'';\n  openOvRoot('ovSE');",
    "  document.getElementById('ovSE').dataset.sid=sid;document.getElementById('ovSE').dataset.mid='';document.getElementById('ovSE').dataset.logId=logId||'';\n  openOvRoot('ovSE');",
    "oSE-mid",
)

# rMSL sort + filter
sub(
    "function rMSL(){\n  const c=document.getElementById('msL');c.innerHTML='';\n  S.sm.forEach((m,i)=>{",
    "function rMSL(){\n  const c=document.getElementById('msL');c.innerHTML='';\n  const q=(document.getElementById('msSearch')?.value||'').trim().toLowerCase();\n  const list=sortedSm().filter(m=>{if(!q)return true;const s=(m.name+' '+(m.mfr||'')+' '+(m.units||'')).toLowerCase();return s.includes(q);});\n  list.forEach(m=>{const i=S.sm.indexOf(m);",
    "rMSL",
)

# rMSCL sorted
sub(
    "function rMSCL(){\n  const c=document.getElementById('mscL');c.innerHTML='';\n  S.sch.forEach((sc,i)=>{",
    "function rMSCL(){\n  const c=document.getElementById('mscL');c.innerHTML='';\n  sortedSch().forEach(sc=>{const i=S.sch.indexOf(sc);",
    "rMSCL",
)

# oESC pick labels
sub(
    "function oESC(id){_escId=id;const sc=id?S.sch.find(x=>x.id===id):null;document.getElementById('escT').textContent=id?'Edit Schedule Entry':'Add Schedule Entry';const sel=document.getElementById('escSI');const emptyOpt=id?'':'<option value=\"\">\\u2014 select supplement \\u2014</option>';sel.innerHTML=emptyOpt+S.sm.map(m=>'<option value=\"'+m.id+'\"'+(sc?.mid===m.id?' selected':'')+'>'+escHTML(m.mfr)+' \\u2014 '+escHTML(m.name)+'</option>').join('');const grpSel=document.getElementById('escGr');const emptyGrp=id?'':'<option value=\"\">\\u2014 select group \\u2014</option>';grpSel.innerHTML=emptyGrp+gSuppGroups().map(g=>'<option value=\"'+g.id+'\"'+(sc?.grp===g.id?' selected':'')+'>'+escHTML(g.lb)+'</option>').join('');document.getElementById('escQ').value=sc?.qty||1;document.getElementById('escTg').value=sc?.tag||'';document.getElementById('escDl').style.display=id?'block':'none';rEscUnitsHint();openOvPush('ovESC');}",
    "function oESC(id){_escId=id;const sc=id?S.sch.find(x=>x.id===id):null;document.getElementById('escT').textContent=id?'Edit Schedule Entry':'Add Schedule Entry';const mid=sc?.mid||'';const grp=sc?.grp||'';document.getElementById('escSI').value=mid;document.getElementById('escGr').value=grp;const supItems=sortedSm().map(m=>({v:m.id,label:m.name,sub:(m.mfr||'')+' \\u00b7 '+(m.units||'')}));const grpItems=gSuppGroups().map(g=>({v:g.id,label:g.lb}));setHiddenPick('escSI','escSILbl',mid,supItems,id?'':'\u2014 select supplement \u2014');setHiddenPick('escGr','escGrLbl',grp,grpItems,id?'':'\u2014 select group \u2014');document.getElementById('escQ').value=sc?.qty||1;document.getElementById('escTg').value=sc?.tag||'';document.getElementById('escDl').style.display=id?'block':'none';rEscUnitsHint();openOvPush('ovESC');}",
    "oESC",
)

sub(
    "function rEscUnitsHint(){const sel=document.getElementById('escSI');const hint=document.getElementById('escUnitsHint');if(!hint)return;const mid=sel?.value;const m=mid?S.sm.find(x=>x.id===mid):null;hint.textContent=m?'Units: '+m.units:'';}",
    "function rEscUnitsHint(){const mid=document.getElementById('escSI')?.value;const hint=document.getElementById('escUnitsHint');if(!hint)return;const m=mid?S.sm.find(x=>x.id===mid):null;hint.textContent=m?'Units: '+m.units:'';}",
    "rEscUnitsHint",
)

# oEFI
sub(
    "function oEFI(id){_efiId=id;const f=id?S.fd.find(x=>x.id===id):null;document.getElementById('efiT').textContent=id?'Edit Food':'Add Food';document.getElementById('efiNm').value=f?.nm||'';const secEl=document.getElementById('efiSc');const grps=gFoodGroups();const emptyOpt=id&&f?.sec?'':'<option value=\"\">\\u2014 select group \\u2014</option>';secEl.innerHTML=emptyOpt+grps.map(g=>'<option value=\"'+escHTML(g)+'\"'+(f?.sec===g?' selected':'')+'>'+escHTML(g)+'</option>').join('');if(f?.sec&&!grps.includes(f.sec))secEl.innerHTML+='<option value=\"'+escHTML(f.sec)+'\" selected>'+escHTML(f.sec)+'</option>';document.getElementById('efiDG').value=f?.dg||0;document.getElementById('efiWG').value=f?.wg||0;document.getElementById('efiSv').value=f?.srv||'';document.getElementById('efiCl').value=f?.ceil||'';document.getElementById('efiCo').value=f?.col||'auto';document.getElementById('efiWy').value=f?.why||'';document.getElementById('efiDl').style.display=id?'block':'none';openOvPush('ovEFI');}",
    "function oEFI(id){_efiId=id;const f=id?S.fd.find(x=>x.id===id):null;document.getElementById('efiT').textContent=id?'Edit Food':'Add Food';document.getElementById('efiNm').value=f?.nm||'';const sec=f?.sec||'';const grps=gFoodGroups();const items=grps.map(g=>({v:g,label:g}));if(sec&&!grps.includes(sec))items.push({v:sec,label:sec});document.getElementById('efiSc').value=sec;setHiddenPick('efiSc','efiScLbl',sec,items,id&&sec?'':'\u2014 select group \u2014');document.getElementById('efiDG').value=f?.dg||0;document.getElementById('efiWG').value=f?.wg||0;document.getElementById('efiSv').value=f?.srv||'';document.getElementById('efiCl').value=f?.ceil||'';document.getElementById('efiCo').value=f?.col||'auto';document.getElementById('efiWy').value=f?.why||'';document.getElementById('efiDl').style.display=id?'block':'none';openOvPush('ovEFI');}",
    "oEFI",
)

# svAll adhoc
sub(
    "  const sids=Object.keys(_supSt);\n  const addedWl=[],addedSl=[],addedAL=[];\n  if(sids.length){",
    "  const sids=Object.keys(_supSt);\n  const adhocMids=Object.keys(_supAdhoc);\n  const addedWl=[],addedSl=[],addedAL=[];\n  if(sids.length){",
    "svAll-vars",
)

sub(
    "    markMod(batchDt.slice(0,10));\n  }\n  const oaids=Object.keys(_otherSt);",
    """    markMod(batchDt.slice(0,10));
  }
  if(adhocMids.length){
    adhocMids.forEach(mid=>{
      const st=_supAdhoc[mid];
      const sid=resolveAdhocSid(mid);
      if(isWaterSup(sid)||isWaterMid(mid)){const id=uid();S.wl.push({id,dt:batchDt,la:now(),qty:st.qty,nt:st.nt||'via supplement catalog'});addedWl.push(id);}
      const id2=uid();S.sl.push({id:id2,sid,dt:batchDt,la:now(),qty:st.qty,nt:st.nt||'',sk:!!st.sk});addedSl.push(id2);
    });
    markMod(batchDt.slice(0,10));
  }
  const oaids=Object.keys(_otherSt);""",
    "svAll-adhoc",
)

sub(
    "  _supSt={};_pendingWater=null;_otherSt={};",
    "  _supSt={};_supAdhoc={};_pendingWater=null;_otherSt={};",
    "svAll-clear",
)

p.write_text(t)
print("JS patches done", len(t))
