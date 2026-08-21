/* Sunbot School OS - record-level multi-user API v0.1 */

const SCHOOL_OS_RECORD = {
  SCHOOL: 'school', CONTACT: 'contact', TASK: 'task', OPPORTUNITY: 'opportunity'
};

function ensureRecordSchemas_(ss) {
  ensureColumns_(ss.getSheetByName(SCHOOL_OS.SHEETS.SCHOOLS), ['record_version','updated_by','deleted_at']);
  ensureColumns_(ss.getSheetByName(SCHOOL_OS.SHEETS.CONTACTS), ['record_version','updated_by','deleted_at']);
  ensureColumns_(ss.getSheetByName(SCHOOL_OS.SHEETS.TASKS), ['record_version','updated_by','deleted_at']);
  ensureColumns_(ss.getSheetByName(SCHOOL_OS.SHEETS.OPPORTUNITIES), ['record_version','updated_by','deleted_at']);
}

function listCoreRecordsApi_(body, auth) {
  const user = auth.user;
  const schoolsRaw = activeObjects_(SCHOOL_OS.SHEETS.SCHOOLS);
  const allowedSchools = schoolsRaw.filter(s => canAccessSchool_(user, s));
  const schoolIds = {};
  allowedSchools.forEach(s => schoolIds[String(s.school_id)] = true);
  const schools = allowedSchools.map(mapSchoolOut_);
  const contacts = activeObjects_(SCHOOL_OS.SHEETS.CONTACTS).filter(x => schoolIds[String(x.school_id)]).map(mapContactOut_);
  const tasks = activeObjects_(SCHOOL_OS.SHEETS.TASKS).filter(x => schoolIds[String(x.school_id)]).map(mapTaskOut_);
  const opportunities = activeObjects_(SCHOOL_OS.SHEETS.OPPORTUNITIES).filter(x => schoolIds[String(x.school_id)]).map(mapOpportunityOut_);
  return {success:true,schools:schools,contacts:contacts,tasks:tasks,opportunities:opportunities,user:publicUser_(user)};
}

function upsertSchoolApi_(body, auth) {
  const data = body.record || body.school || {};
  const id = clean_(data.id || data.school_id) || ('SCH_' + Utilities.getUuid().replace(/-/g,''));
  const existing = findRecord_(SCHOOL_OS.SHEETS.SCHOOLS,'school_id',id);
  if (existing && !canAccessSchool_(auth.user, existing.obj)) throw new Error('Bạn không có quyền sửa trường này.');
  if (!existing && String(auth.user.role)==='STAFF' && auth.user.region && data.region && String(auth.user.region)!==String(data.region)) throw new Error('Bạn không có quyền tạo trường ngoài khu vực phụ trách.');
  const values = {
    school_id:id,school_name:data.name||data.school_name||'',region:data.region||'',school_type:data.type||data.school_type||'',
    status:data.status||'Tiềm năng',owner:data.owner||auth.user.name||'',next_action:data.action||data.next_action||'',
    next_action_date:data.date||data.next_action_date||'',risk:data.risk||'Bình thường',source:data.source||'',children:data.children||'',
    steam_status:data.steam||data.steam_status||'',policy_status:data.policy||data.policy_status||'',renewal_date:data.renewal||data.renewal_date||'',
    updated_at:new Date()
  };
  return mutateRecord_(SCHOOL_OS.SHEETS.SCHOOLS,'school_id',id,values,body.expected_version,auth.user,'SCHOOL_UPSERTED');
}

function upsertContactApi_(body, auth) {
  const d=body.record||body.contact||{}, schoolId=clean_(d.school_id||body.school_id);
  const school=requireSchoolAccess_(schoolId,auth.user);
  const id=clean_(d.id||d.contact_id)||('CON_'+Utilities.getUuid().replace(/-/g,''));
  const values={contact_id:id,school_id:schoolId,name:d.name||'',role:d.role||'',decision_role:d.decision||d.decision_role||'',email:d.email||'',phone:d.phone||'',sentiment:d.sentiment||'',status:d.status||'ACTIVE',updated_at:new Date()};
  return mutateRecord_(SCHOOL_OS.SHEETS.CONTACTS,'contact_id',id,values,body.expected_version,auth.user,'CONTACT_UPSERTED',school);
}

function upsertTaskApi_(body, auth) {
  const d=body.record||body.task||{}, schoolId=clean_(d.school_id||body.school_id)||schoolIdByName_(d.school);
  const school=requireSchoolAccess_(schoolId,auth.user);
  const id=clean_(d.id||d.task_id)||('T_'+Utilities.getUuid().replace(/-/g,''));
  const values={task_id:id,title:d.title||'',school_id:schoolId,school_name:d.school||d.school_name||school.school_name||'',owner:d.owner||auth.user.name||'',due:d.due||'',risk:d.risk||'',done:!!d.done,updated_at:new Date()};
  return mutateRecord_(SCHOOL_OS.SHEETS.TASKS,'task_id',id,values,body.expected_version,auth.user,'TASK_UPSERTED',school);
}

function upsertOpportunityApi_(body, auth) {
  const d=body.record||body.opportunity||{}, schoolId=clean_(d.school_id||body.school_id)||schoolIdByName_(d.school);
  const school=requireSchoolAccess_(schoolId,auth.user);
  const id=clean_(d.id||d.opportunity_id)||('O_'+Utilities.getUuid().replace(/-/g,''));
  const values={opportunity_id:id,school_id:schoolId,school_name:d.school||d.school_name||school.school_name||'',stage:d.stage||'Khám phá',title:d.title||'',owner:d.owner||auth.user.name||'',value:Number(d.value||0),fit:Number(d.fit||0),need:Number(d.need||0),authority:Number(d.authority||0),funding:Number(d.funding||0),timing:Number(d.timing||0),regulation:Number(d.regulation||0),capacity:Number(d.capacity||0),updated_at:new Date()};
  return mutateRecord_(SCHOOL_OS.SHEETS.OPPORTUNITIES,'opportunity_id',id,values,body.expected_version,auth.user,'OPPORTUNITY_UPSERTED',school);
}

function deleteRecordApi_(body, auth) {
  const type=String(body.record_type||'').toLowerCase(), id=clean_(body.record_id||body.id);
  const cfg=recordConfig_(type); if(!cfg||!id) throw new Error('Thiếu loại bản ghi hoặc ID.');
  const rec=findRecord_(cfg.sheet,cfg.idKey,id); if(!rec) throw new Error('Không tìm thấy bản ghi.');
  let school= type==='school'?rec.obj:requireSchoolAccess_(String(rec.obj.school_id),auth.user);
  if(type==='school'&&!canAccessSchool_(auth.user,rec.obj)) throw new Error('Bạn không có quyền xóa trường này.');
  const expected=body.expected_version==null?null:Number(body.expected_version), current=Number(rec.obj.record_version||0);
  if(expected!==null&&expected!==current) throw new Error('RECORD_VERSION_CONFLICT:'+current);
  setObjectFields_(rec.sheet,rec.row,{deleted_at:new Date(),updated_at:new Date(),updated_by:auth.user.email,record_version:current+1});
  logEvent_({school_id:type==='school'?id:String(school.school_id||''),school_name:type==='school'?String(rec.obj.school_name||''):String(school.school_name||''),event_type:'RECORD_DELETED',actor:auth.user.email,channel:'System',summary:'Đã lưu trữ '+type+' '+id,detail:{record_type:type,record_id:id},source_id:id,hot_signal:false});
  return {success:true,id:id,version:current+1};
}

function mutateRecord_(sheetName,idKey,id,values,expectedVersion,user,eventType,schoolObj) {
  const lock=LockService.getScriptLock(); lock.waitLock(15000);
  try{
    const rec=findRecord_(sheetName,idKey,id); const current=rec?Number(rec.obj.record_version||0):0;
    const expected=expectedVersion==null||expectedVersion===''?null:Number(expectedVersion);
    if(rec&&expected!==null&&expected!==current) throw new Error('RECORD_VERSION_CONFLICT:'+current);
    if(!rec&&expected!==null&&expected!==0) throw new Error('RECORD_VERSION_CONFLICT:0');
    const next=current+1;
    values.record_version=next;values.updated_by=user.email;values.deleted_at='';
    let out;
    if(rec){setObjectFields_(rec.sheet,rec.row,values);out=findRecord_(sheetName,idKey,id).obj;}
    else{const sh=getDataSpreadsheet_().getSheetByName(sheetName), headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);sh.appendRow(headers.map(h=>Object.prototype.hasOwnProperty.call(values,h)?values[h]:''));out=findRecord_(sheetName,idKey,id).obj;}
    const school=schoolObj||(sheetName===SCHOOL_OS.SHEETS.SCHOOLS?out:null);
    logEvent_({school_id:sheetName===SCHOOL_OS.SHEETS.SCHOOLS?id:String((school||{}).school_id||values.school_id||''),school_name:sheetName===SCHOOL_OS.SHEETS.SCHOOLS?String(values.school_name||''):String((school||{}).school_name||values.school_name||''),event_type:eventType,actor:user.email,channel:'System',summary:eventType,detail:{record_id:id,version:next},source_id:id,hot_signal:false});
    return {success:true,record:mapRecordOut_(sheetName,out),version:next};
  } finally {lock.releaseLock();}
}

function requireSchoolAccess_(schoolId,user){if(!schoolId)throw new Error('Thiếu school_id.');const r=findRecord_(SCHOOL_OS.SHEETS.SCHOOLS,'school_id',schoolId);if(!r||r.obj.deleted_at)throw new Error('Không tìm thấy trường.');if(!canAccessSchool_(user,r.obj))throw new Error('Bạn không có quyền truy cập trường này.');return r.obj;}
function schoolIdByName_(name){if(!name)return'';const r=activeObjects_(SCHOOL_OS.SHEETS.SCHOOLS).find(x=>String(x.school_name)===String(name));return r?String(r.school_id):'';}
function activeObjects_(sheetName){return sheetObjects_(sheetName).filter(x=>!x.deleted_at);}
function findRecord_(sheetName,idKey,id){const sh=getDataSpreadsheet_().getSheetByName(sheetName);if(!sh||sh.getLastRow()<2)return null;const data=sh.getDataRange().getValues(),headers=data[0].map(String),idx=headerIndex_(headers);for(let r=1;r<data.length;r++)if(String(data[r][idx[idKey]])===String(id))return{sheet:sh,row:r+1,obj:headers.reduce((o,k,i)=>(o[k]=data[r][i],o),{})};return null;}
function setObjectFields_(sh,row,obj){const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String),idx=headerIndex_(headers);Object.keys(obj).forEach(k=>{if(idx[k]!=null)sh.getRange(row,idx[k]+1).setValue(obj[k]);});}
function ensureColumns_(sh,cols){if(!sh)return;const headers=sh.getLastRow()?sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String):[];cols.forEach(c=>{if(headers.indexOf(c)<0){sh.getRange(1,sh.getLastColumn()+1).setValue(c);headers.push(c);}});}
function recordConfig_(type){return type==='school'?{sheet:SCHOOL_OS.SHEETS.SCHOOLS,idKey:'school_id'}:type==='contact'?{sheet:SCHOOL_OS.SHEETS.CONTACTS,idKey:'contact_id'}:type==='task'?{sheet:SCHOOL_OS.SHEETS.TASKS,idKey:'task_id'}:type==='opportunity'?{sheet:SCHOOL_OS.SHEETS.OPPORTUNITIES,idKey:'opportunity_id'}:null;}
function mapRecordOut_(sheet,obj){if(sheet===SCHOOL_OS.SHEETS.SCHOOLS)return mapSchoolOut_(obj);if(sheet===SCHOOL_OS.SHEETS.CONTACTS)return mapContactOut_(obj);if(sheet===SCHOOL_OS.SHEETS.TASKS)return mapTaskOut_(obj);return mapOpportunityOut_(obj);}
function v_(x){return Number(x.record_version||0);}
function mapSchoolOut_(r){return{id:String(r.school_id),name:String(r.school_name),region:String(r.region),type:String(r.school_type),status:String(r.status),owner:String(r.owner),action:String(r.next_action),date:String(r.next_action_date),risk:String(r.risk),source:String(r.source),children:r.children,steam:String(r.steam_status),policy:String(r.policy_status),renewal:String(r.renewal_date),_version:v_(r)};}
function mapContactOut_(r){return{id:String(r.contact_id),school_id:String(r.school_id),name:String(r.name),role:String(r.role),decision:String(r.decision_role),email:String(r.email),phone:String(r.phone),sentiment:String(r.sentiment),status:String(r.status),_version:v_(r)};}
function mapTaskOut_(r){return{id:String(r.task_id),title:String(r.title),school_id:String(r.school_id),school:String(r.school_name),owner:String(r.owner),due:String(r.due),risk:String(r.risk),done:String(r.done).toUpperCase()==='TRUE'||r.done===true,_version:v_(r)};}
function mapOpportunityOut_(r){return{id:String(r.opportunity_id),school_id:String(r.school_id),school:String(r.school_name),stage:String(r.stage),title:String(r.title),owner:String(r.owner),value:Number(r.value||0),fit:Number(r.fit||0),need:Number(r.need||0),authority:Number(r.authority||0),funding:Number(r.funding||0),timing:Number(r.timing||0),regulation:Number(r.regulation||0),capacity:Number(r.capacity||0),_version:v_(r)};}
