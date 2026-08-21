/*
 * Sunbot School OS - Web App services v0.3
 * Email, tracked links, activity feed, auth, record-level core data.
 */

const SCHOOL_OS = {
  VERSION: '0.3',
  SHEETS: {
    ACTIVITIES:'SO_ACTIVITIES',TRACKED_LINKS:'SO_TRACKED_LINKS',EMAIL_LOG:'SO_EMAIL_LOG',
    SCHOOLS:'SO_SCHOOLS',CONTACTS:'SO_CONTACTS',TASKS:'SO_TASKS',OPPORTUNITIES:'SO_OPPORTUNITIES',META:'SO_META'
  },
  EVENT: {
    EMAIL_SENT:'EMAIL_SENT',LINK_CREATED:'LINK_CREATED',LINK_OPENED:'LINK_OPENED',MANUAL_ACTIVITY:'MANUAL_ACTIVITY',CORE_STATE_SAVED:'CORE_STATE_SAVED'
  }
};

function schoolOsSetup() {
  const props=PropertiesService.getScriptProperties();
  let id=props.getProperty('SCHOOL_OS_SPREADSHEET_ID'), ss=id?SpreadsheetApp.openById(id):SpreadsheetApp.create('SUNBOT_SCHOOL_OS_DATA');
  if(!id)props.setProperty('SCHOOL_OS_SPREADSHEET_ID',ss.getId());
  ensureSheet_(ss,SCHOOL_OS.SHEETS.ACTIVITIES,['event_id','timestamp','school_id','school_name','contact_id','contact_name','event_type','actor','channel','summary','detail_json','source_id','hot_signal']);
  ensureSheet_(ss,SCHOOL_OS.SHEETS.TRACKED_LINKS,['track_id','created_at','school_id','school_name','contact_id','contact_name','document_id','document_name','destination_url','created_by','status','open_count','first_open_at','last_open_at']);
  ensureSheet_(ss,SCHOOL_OS.SHEETS.EMAIL_LOG,['email_id','sent_at','school_id','school_name','contact_id','contact_name','to_email','subject','template_key','document_ids','sent_by','status','message']);
  ensureSheet_(ss,SCHOOL_OS.SHEETS.SCHOOLS,['school_id','school_name','region','school_type','status','owner','next_action','next_action_date','risk','source','children','steam_status','policy_status','renewal_date','updated_at']);
  ensureSheet_(ss,SCHOOL_OS.SHEETS.CONTACTS,['contact_id','school_id','name','role','decision_role','email','phone','sentiment','status','updated_at']);
  ensureSheet_(ss,SCHOOL_OS.SHEETS.TASKS,['task_id','title','school_id','school_name','owner','due','risk','done','updated_at']);
  ensureSheet_(ss,SCHOOL_OS.SHEETS.OPPORTUNITIES,['opportunity_id','school_id','school_name','stage','title','owner','value','fit','need','authority','funding','timing','regulation','capacity','updated_at']);
  ensureSheet_(ss,SCHOOL_OS.SHEETS.META,['key','value','updated_at']);
  if(typeof ensureAuthSheets_==='function')ensureAuthSheets_(ss);
  if(typeof ensureRecordSchemas_==='function')ensureRecordSchemas_(ss);
  if(!props.getProperty('SCHOOL_OS_API_KEY'))props.setProperty('SCHOOL_OS_API_KEY',Utilities.getUuid().replace(/-/g,''));
  if(typeof ensureCoreMeta_==='function')ensureCoreMeta_();
  return {success:true,version:SCHOOL_OS.VERSION,spreadsheetId:ss.getId(),spreadsheetUrl:ss.getUrl(),apiKey:props.getProperty('SCHOOL_OS_API_KEY'),note:'API key chỉ dùng cho bootstrap/quản trị.'};
}

function doGet(e){
  try{const p=(e&&e.parameter)||{};if(p.t)return handleTrackedOpen_(p.t);return jsonOutput_({success:true,service:'Sunbot School OS',version:SCHOOL_OS.VERSION,status:'ready'});}catch(err){return jsonOutput_({success:false,error:errorText_(err)});}
}

function doPost(e){
  try{
    const body=parseBody_(e), action=String(body.action||'').trim();
    if(action==='health')return jsonOutput_({success:true,status:'ok',version:SCHOOL_OS.VERSION});
    if(action==='login')return jsonOutput_(loginApi_(body));
    if(action==='logout')return jsonOutput_(logoutApi_(body));
    if(action==='me')return jsonOutput_(meApi_(body));

    let auth;
    if(['save_core_state'].indexOf(action)>=0) auth=requireAuthorized_(body,['SUPER_ADMIN','ADMIN']);
    else auth=requireAuthorized_(body,['SUPER_ADMIN','ADMIN','LEADER','STAFF']);

    let result;
    switch(action){
      case 'send_email': assertSchoolScope_(body,auth); result=sendSchoolEmail_(body,auth); break;
      case 'create_tracked_link': assertSchoolScope_(body,auth); result=createTrackedLink_(body,auth); break;
      case 'log_activity': assertSchoolScope_(body,auth); result=logActivityApi_(body,auth); break;
      case 'get_activity': assertSchoolScope_(body,auth); result=getActivityApi_(body,auth); break;
      case 'list_core_records': result=listCoreRecordsApi_(body,auth); break;
      case 'upsert_school': result=upsertSchoolApi_(body,auth); break;
      case 'upsert_contact': result=upsertContactApi_(body,auth); break;
      case 'upsert_task': result=upsertTaskApi_(body,auth); break;
      case 'upsert_opportunity': result=upsertOpportunityApi_(body,auth); break;
      case 'delete_record': result=deleteRecordApi_(body,auth); break;
      case 'get_core_state': if(!auth.via_api_key&&['SUPER_ADMIN','ADMIN','LEADER'].indexOf(auth.user.role)<0)throw new Error('Không có quyền đọc snapshot toàn hệ thống.');result=getCoreStateApi_(body);break;
      case 'save_core_state': result=saveCoreStateApi_(Object.assign({},body,{actor:auth.user.email}));break;
      default: throw new Error('Action không hợp lệ: '+action);
    }
    return jsonOutput_(result);
  }catch(err){return jsonOutput_({success:false,error:errorText_(err)});}
}

function assertSchoolScope_(body,auth){if(auth.via_api_key)return;const id=clean_(body.school_id);if(id)requireSchoolAccess_(id,auth.user);}

function sendSchoolEmail_(body,auth){
  const to=clean_(body.to_email||body.to),subject=clean_(body.subject),html=String(body.html_body||body.html||''),text=String(body.text_body||body.text||stripHtml_(html));
  if(!to||!subject)throw new Error('Thiếu email người nhận hoặc tiêu đề.');
  const actor=(auth&&auth.user&&auth.user.email)||body.sent_by||body.actor||'';
  const links=Array.isArray(body.documents)?body.documents:[];
  const tracked=links.map(doc=>{const r=createTrackedLink_({school_id:body.school_id,school_name:body.school_name,contact_id:body.contact_id,contact_name:body.contact_name,document_id:doc.document_id||doc.id,document_name:doc.document_name||doc.name,destination_url:doc.destination_url||doc.url,created_by:actor},auth);return{name:doc.document_name||doc.name||'Tài liệu',url:r.tracked_url,track_id:r.track_id};});
  const linksHtml=tracked.length?'<div style="margin-top:18px"><b>Tài liệu:</b><ul>'+tracked.map(x=>'<li><a href="'+escapeHtml_(x.url)+'">'+escapeHtml_(x.name)+'</a></li>').join('')+'</ul></div>':'';
  GmailApp.sendEmail(to,subject,text,{htmlBody:html+linksHtml,name:clean_(body.sender_name)||'Sunbot'});
  const emailId='EM_'+Utilities.getUuid();
  appendRow_(SCHOOL_OS.SHEETS.EMAIL_LOG,[emailId,new Date(),body.school_id||'',body.school_name||'',body.contact_id||'',body.contact_name||'',to,subject,body.template_key||'',tracked.map(x=>x.track_id).join(','),actor,'SENT','']);
  logEvent_({school_id:body.school_id,school_name:body.school_name,contact_id:body.contact_id,contact_name:body.contact_name,event_type:SCHOOL_OS.EVENT.EMAIL_SENT,actor:actor,channel:'Email',summary:'Đã gửi email: '+subject,detail:{to_email:to,email_id:emailId,template_key:body.template_key||'',tracked_links:tracked},source_id:emailId,hot_signal:false});
  return{success:true,email_id:emailId,tracked_documents:tracked};
}

function createTrackedLink_(body,auth){
  const destination=clean_(body.destination_url||body.url);if(!destination)throw new Error('Thiếu URL tài liệu.');if(!/^https?:\/\//i.test(destination))throw new Error('URL tài liệu không hợp lệ.');
  const actor=(auth&&auth.user&&auth.user.email)||body.created_by||body.actor||'',trackId='TRK_'+Utilities.getUuid().replace(/-/g,'');
  appendRow_(SCHOOL_OS.SHEETS.TRACKED_LINKS,[trackId,new Date(),body.school_id||'',body.school_name||'',body.contact_id||'',body.contact_name||'',body.document_id||'',body.document_name||'',destination,actor,'ACTIVE',0,'','']);
  logEvent_({school_id:body.school_id,school_name:body.school_name,contact_id:body.contact_id,contact_name:body.contact_name,event_type:SCHOOL_OS.EVENT.LINK_CREATED,actor:actor,channel:'Tài liệu',summary:'Tạo link theo dõi: '+(body.document_name||'Tài liệu'),detail:{track_id:trackId,document_id:body.document_id||'',destination_url:destination},source_id:trackId,hot_signal:false});
  const url=ScriptApp.getService().getUrl();if(!url)throw new Error('Apps Script chưa deploy Web App.');return{success:true,track_id:trackId,tracked_url:url+'?t='+encodeURIComponent(trackId)};
}

function handleTrackedOpen_(trackId){
  const ss=getDataSpreadsheet_(),sh=ss.getSheetByName(SCHOOL_OS.SHEETS.TRACKED_LINKS),values=sh.getDataRange().getValues(),idx=headerIndex_(values[0]);
  for(let r=1;r<values.length;r++){
    if(String(values[r][idx.track_id])!==String(trackId))continue;if(String(values[r][idx.status])!=='ACTIVE')throw new Error('Link không còn hoạt động.');
    const now=new Date(),count=Number(values[r][idx.open_count]||0)+1;sh.getRange(r+1,idx.open_count+1).setValue(count);if(!values[r][idx.first_open_at])sh.getRange(r+1,idx.first_open_at+1).setValue(now);sh.getRange(r+1,idx.last_open_at+1).setValue(now);
    logEvent_({school_id:values[r][idx.school_id],school_name:values[r][idx.school_name],contact_id:values[r][idx.contact_id],contact_name:values[r][idx.contact_name],event_type:SCHOOL_OS.EVENT.LINK_OPENED,actor:'external_contact',channel:'Tài liệu',summary:'Đã mở '+(values[r][idx.document_name]||'tài liệu')+(count>1?' lần '+count:''),detail:{track_id:trackId,open_count:count,document_id:values[r][idx.document_id]},source_id:trackId,hot_signal:true});
    return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url='+escapeHtml_(values[r][idx.destination_url])+'"><title>Đang mở tài liệu</title></head><body style="font-family:system-ui;padding:32px">Đang mở tài liệu Sunbot...</body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  throw new Error('Không tìm thấy link theo dõi.');
}

function logActivityApi_(body,auth){const actor=(auth&&auth.user&&auth.user.email)||body.actor||'';const id=logEvent_({school_id:body.school_id,school_name:body.school_name,contact_id:body.contact_id,contact_name:body.contact_name,event_type:body.event_type||SCHOOL_OS.EVENT.MANUAL_ACTIVITY,actor:actor,channel:body.channel,summary:body.summary,detail:body.detail||{},source_id:body.source_id||'',hot_signal:!!body.hot_signal});return{success:true,event_id:id};}
function getActivityApi_(body){const id=clean_(body.school_id);if(!id)throw new Error('Thiếu school_id.');const limit=Math.max(1,Math.min(Number(body.limit||100),500));const rows=sheetObjects_(SCHOOL_OS.SHEETS.ACTIVITIES).filter(x=>String(x.school_id)===id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,limit).map(x=>{try{x.detail=x.detail_json?JSON.parse(x.detail_json):{};}catch(e){x.detail={};}delete x.detail_json;return x;});return{success:true,activities:rows};}
function logEvent_(e){const id='EV_'+Utilities.getUuid();appendRow_(SCHOOL_OS.SHEETS.ACTIVITIES,[id,new Date(),e.school_id||'',e.school_name||'',e.contact_id||'',e.contact_name||'',e.event_type||SCHOOL_OS.EVENT.MANUAL_ACTIVITY,e.actor||'',e.channel||'',e.summary||'',JSON.stringify(e.detail||{}),e.source_id||'',e.hot_signal?'TRUE':'FALSE']);return id;}

function requireApiKey_(provided){const expected=PropertiesService.getScriptProperties().getProperty('SCHOOL_OS_API_KEY');if(!expected)throw new Error('Backend chưa setup. Chạy schoolOsSetup() trước.');if(!provided||String(provided)!==String(expected))throw new Error('API key không hợp lệ.');}
function parseBody_(e){if(!e||!e.postData||!e.postData.contents)return{};try{return JSON.parse(e.postData.contents);}catch(err){return e.parameter||{};}}
function getDataSpreadsheet_(){const id=PropertiesService.getScriptProperties().getProperty('SCHOOL_OS_SPREADSHEET_ID');if(!id)throw new Error('Chưa setup backend.');return SpreadsheetApp.openById(id);}
function ensureSheet_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.getRange(1,1,1,headers.length).setValues([headers]);return sh;}
function appendRow_(sheetName,row){const sh=getDataSpreadsheet_().getSheetByName(sheetName);if(!sh)throw new Error('Thiếu sheet '+sheetName);sh.appendRow(row);}
function sheetObjects_(sheetName){const sh=getDataSpreadsheet_().getSheetByName(sheetName);if(!sh||sh.getLastRow()<2)return[];const v=sh.getDataRange().getValues(),h=v[0].map(String);return v.slice(1).map(row=>h.reduce((o,k,i)=>(o[k]=row[i],o),{}));}
function headerIndex_(headers){return headers.reduce((o,k,i)=>(o[String(k)]=i,o),{});}
function jsonOutput_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function clean_(v){return String(v==null?'':v).trim();}
function stripHtml_(s){return String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function escapeHtml_(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function errorText_(err){return String(err&&err.message||err||'Lỗi không xác định');}
