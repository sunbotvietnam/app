/* Sunbot School OS - normalized core data module v0.1 */

function ensureCoreMeta_() {
  const sh = getDataSpreadsheet_().getSheetByName(SCHOOL_OS.SHEETS.META);
  const rows = sheetObjects_(SCHOOL_OS.SHEETS.META);
  if (!rows.some(x => String(x.key) === 'CORE_STATE_VERSION')) {
    sh.appendRow(['CORE_STATE_VERSION','0',new Date()]);
  }
}

function getCoreStateApi_() {
  ensureCoreMeta_();
  const version = Number(getMetaValue_('CORE_STATE_VERSION') || 0);
  const schools = sheetObjects_(SCHOOL_OS.SHEETS.SCHOOLS).map(r => ({
    id:String(r.school_id),name:String(r.school_name),region:String(r.region),type:String(r.school_type),
    status:String(r.status),owner:String(r.owner),action:String(r.next_action),date:String(r.next_action_date),
    risk:String(r.risk),source:String(r.source),children:r.children,steam:String(r.steam_status),
    policy:String(r.policy_status),renewal:String(r.renewal_date),contacts:[],events:[]
  }));
  const byId = schools.reduce((o,s)=>(o[s.id]=s,o),{});
  sheetObjects_(SCHOOL_OS.SHEETS.CONTACTS).forEach(r => {
    const s=byId[String(r.school_id)]; if(!s) return;
    s.contacts.push({id:String(r.contact_id),name:String(r.name),role:String(r.role),decision:String(r.decision_role),
      email:String(r.email),phone:String(r.phone),sentiment:String(r.sentiment)});
  });
  const tasks = sheetObjects_(SCHOOL_OS.SHEETS.TASKS).map(r => ({
    id:String(r.task_id),title:String(r.title),school:String(r.school_name),school_id:String(r.school_id),
    owner:String(r.owner),due:String(r.due),risk:String(r.risk),done:String(r.done).toUpperCase()==='TRUE'||r.done===true
  }));
  const opps = sheetObjects_(SCHOOL_OS.SHEETS.OPPORTUNITIES).map(r => ({
    id:String(r.opportunity_id),school:String(r.school_name),school_id:String(r.school_id),stage:String(r.stage),
    title:String(r.title),owner:String(r.owner),value:Number(r.value||0),fit:Number(r.fit||0),need:Number(r.need||0),
    authority:Number(r.authority||0),funding:Number(r.funding||0),timing:Number(r.timing||0),
    regulation:Number(r.regulation||0),capacity:Number(r.capacity||0)
  }));
  return {success:true,version,state:{schools,tasks,opps}};
}

function saveCoreStateApi_(body) {
  const lock=LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    ensureCoreMeta_();
    const currentVersion=Number(getMetaValue_('CORE_STATE_VERSION')||0);
    const baseVersion=body.base_version==null||body.base_version===''?null:Number(body.base_version);
    if(baseVersion!==null&&baseVersion!==currentVersion){
      throw new Error('DATA_VERSION_CONFLICT: backend=' + currentVersion + ', client=' + baseVersion);
    }
    const st=body.state||{};
    const schools=Array.isArray(st.schools)?st.schools:[];
    const tasks=Array.isArray(st.tasks)?st.tasks:[];
    const opps=Array.isArray(st.opps)?st.opps:[];
    const now=new Date();
    const schoolIdByName={};

    const schoolRows=schools.map(s=>{
      const id=clean_(s.id)||('SCH_'+stableHash_(s.name+'|'+s.region));
      schoolIdByName[String(s.name||'')]=id;
      return [id,s.name||'',s.region||'',s.type||'',s.status||'',s.owner||'',s.action||'',s.date||'',s.risk||'',s.source||'',s.children||'',s.steam||'',s.policy||'',s.renewal||'',now];
    });
    replaceSheetData_(SCHOOL_OS.SHEETS.SCHOOLS,schoolRows);

    const contactRows=[];
    schools.forEach(s=>{
      const schoolId=clean_(s.id)||schoolIdByName[String(s.name||'')];
      (Array.isArray(s.contacts)?s.contacts:[]).forEach(c=>{
        const cid=clean_(c.id)||('CON_'+stableHash_(schoolId+'|'+(c.email||c.name||'contact')));
        contactRows.push([cid,schoolId,c.name||'',c.role||'',c.decision||'',c.email||'',c.phone||'',c.sentiment||'','ACTIVE',now]);
      });
    });
    replaceSheetData_(SCHOOL_OS.SHEETS.CONTACTS,contactRows);

    const taskRows=tasks.map(t=>{
      const sid=clean_(t.school_id)||schoolIdByName[String(t.school||'')]||'';
      return [clean_(t.id)||('T_'+stableHash_((t.title||'')+'|'+(t.school||''))),t.title||'',sid,t.school||'',t.owner||'',t.due||'',t.risk||'',!!t.done,now];
    });
    replaceSheetData_(SCHOOL_OS.SHEETS.TASKS,taskRows);

    const oppRows=opps.map(o=>{
      const sid=clean_(o.school_id)||schoolIdByName[String(o.school||'')]||'';
      return [clean_(o.id)||('O_'+stableHash_((o.title||'')+'|'+(o.school||''))),sid,o.school||'',o.stage||'',o.title||'',o.owner||'',Number(o.value||0),Number(o.fit||0),Number(o.need||0),Number(o.authority||0),Number(o.funding||0),Number(o.timing||0),Number(o.regulation||0),Number(o.capacity||0),now];
    });
    replaceSheetData_(SCHOOL_OS.SHEETS.OPPORTUNITIES,oppRows);

    const nextVersion=currentVersion+1;
    setMetaValue_('CORE_STATE_VERSION',String(nextVersion));
    logEvent_({event_type:SCHOOL_OS.EVENT.CORE_STATE_SAVED,actor:body.actor||'',channel:'System',summary:'Đồng bộ dữ liệu lõi School OS',detail:{version:nextVersion,schools:schools.length,tasks:tasks.length,opportunities:opps.length},hot_signal:false});
    return {success:true,version:nextVersion,counts:{schools:schools.length,contacts:contactRows.length,tasks:tasks.length,opportunities:opps.length}};
  } finally {
    lock.releaseLock();
  }
}

function replaceSheetData_(sheetName,rows) {
  const sh=getDataSpreadsheet_().getSheetByName(sheetName);
  if(!sh) throw new Error('Thiếu sheet '+sheetName);
  const cols=sh.getLastColumn();
  if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,cols).clearContent();
  if(rows.length) sh.getRange(2,1,rows.length,cols).setValues(rows);
}

function getMetaValue_(key) {
  const rows=sheetObjects_(SCHOOL_OS.SHEETS.META);
  const row=rows.find(x=>String(x.key)===String(key));
  return row?row.value:'';
}

function setMetaValue_(key,value) {
  const sh=getDataSpreadsheet_().getSheetByName(SCHOOL_OS.SHEETS.META);
  const data=sh.getDataRange().getValues();
  for(let r=1;r<data.length;r++){
    if(String(data[r][0])===String(key)){
      sh.getRange(r+1,2,1,2).setValues([[value,new Date()]]);return;
    }
  }
  sh.appendRow([key,value,new Date()]);
}

function stableHash_(text) {
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,String(text),Utilities.Charset.UTF_8);
  return bytes.map(b=>('0'+((b<0?b+256:b).toString(16))).slice(-2)).join('').slice(0,16).toUpperCase();
}
