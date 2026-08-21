/*
 * Sunbot School OS - Sales Services v0.2
 * Google Apps Script backend for:
 * 1) Email sending
 * 2) Tracked document links
 * 3) Unified activity/event log
 * 4) Normalized core-data sync (schools, contacts, tasks, opportunities)
 *
 * SAFETY: No email is sent until this script is deployed and called with a valid API key.
 */

const SCHOOL_OS = {
  VERSION: '0.2',
  SHEETS: {
    ACTIVITIES: 'SO_ACTIVITIES',
    TRACKED_LINKS: 'SO_TRACKED_LINKS',
    EMAIL_LOG: 'SO_EMAIL_LOG',
    SCHOOLS: 'SO_SCHOOLS',
    CONTACTS: 'SO_CONTACTS',
    TASKS: 'SO_TASKS',
    OPPORTUNITIES: 'SO_OPPORTUNITIES',
    META: 'SO_META'
  },
  EVENT: {
    EMAIL_SENT: 'EMAIL_SENT',
    LINK_CREATED: 'LINK_CREATED',
    LINK_OPENED: 'LINK_OPENED',
    MANUAL_ACTIVITY: 'MANUAL_ACTIVITY',
    CORE_STATE_SAVED: 'CORE_STATE_SAVED'
  }
};

function schoolOsSetup() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty('SCHOOL_OS_SPREADSHEET_ID');
  let ss;
  if (spreadsheetId) {
    ss = SpreadsheetApp.openById(spreadsheetId);
  } else {
    ss = SpreadsheetApp.create('SUNBOT_SCHOOL_OS_DATA');
    props.setProperty('SCHOOL_OS_SPREADSHEET_ID', ss.getId());
  }

  ensureSheet_(ss, SCHOOL_OS.SHEETS.ACTIVITIES, [
    'event_id','timestamp','school_id','school_name','contact_id','contact_name',
    'event_type','actor','channel','summary','detail_json','source_id','hot_signal'
  ]);
  ensureSheet_(ss, SCHOOL_OS.SHEETS.TRACKED_LINKS, [
    'track_id','created_at','school_id','school_name','contact_id','contact_name',
    'document_id','document_name','destination_url','created_by','status','open_count',
    'first_open_at','last_open_at'
  ]);
  ensureSheet_(ss, SCHOOL_OS.SHEETS.EMAIL_LOG, [
    'email_id','sent_at','school_id','school_name','contact_id','contact_name','to_email',
    'subject','template_key','document_ids','sent_by','status','message'
  ]);
  ensureSheet_(ss, SCHOOL_OS.SHEETS.SCHOOLS, [
    'school_id','school_name','region','school_type','status','owner','next_action','next_action_date',
    'risk','source','children','steam_status','policy_status','renewal_date','updated_at'
  ]);
  ensureSheet_(ss, SCHOOL_OS.SHEETS.CONTACTS, [
    'contact_id','school_id','name','role','decision_role','email','phone','sentiment','status','updated_at'
  ]);
  ensureSheet_(ss, SCHOOL_OS.SHEETS.TASKS, [
    'task_id','title','school_id','school_name','owner','due','risk','done','updated_at'
  ]);
  ensureSheet_(ss, SCHOOL_OS.SHEETS.OPPORTUNITIES, [
    'opportunity_id','school_id','school_name','stage','title','owner','value',
    'fit','need','authority','funding','timing','regulation','capacity','updated_at'
  ]);
  ensureSheet_(ss, SCHOOL_OS.SHEETS.META, ['key','value','updated_at']);

  if (!props.getProperty('SCHOOL_OS_API_KEY')) {
    props.setProperty('SCHOOL_OS_API_KEY', Utilities.getUuid().replace(/-/g, ''));
  }
  if (typeof ensureCoreMeta_ === 'function') ensureCoreMeta_();

  return {
    success: true,
    version: SCHOOL_OS.VERSION,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    apiKey: props.getProperty('SCHOOL_OS_API_KEY'),
    note: 'Lưu API key ở nơi an toàn. Không đưa API key vào repo công khai.'
  };
}

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.t) return handleTrackedOpen_(p.t);
    return jsonOutput_({
      success: true,
      service: 'Sunbot School OS Sales Services',
      version: SCHOOL_OS.VERSION,
      status: 'ready'
    });
  } catch (err) {
    return jsonOutput_({success:false,error:String(err && err.message || err)});
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    requireApiKey_(body.api_key || body.apiKey);
    const action = String(body.action || '').trim();
    let result;

    switch (action) {
      case 'send_email':
        result = sendSchoolEmail_(body);
        break;
      case 'create_tracked_link':
        result = createTrackedLink_(body);
        break;
      case 'log_activity':
        result = logActivityApi_(body);
        break;
      case 'get_activity':
        result = getActivityApi_(body);
        break;
      case 'get_core_state':
        if (typeof getCoreStateApi_ !== 'function') throw new Error('Core data module chưa được cài.');
        result = getCoreStateApi_(body);
        break;
      case 'save_core_state':
        if (typeof saveCoreStateApi_ !== 'function') throw new Error('Core data module chưa được cài.');
        result = saveCoreStateApi_(body);
        break;
      case 'health':
        result = {success:true,status:'ok',version:SCHOOL_OS.VERSION};
        break;
      default:
        throw new Error('Action không hợp lệ: ' + action);
    }
    return jsonOutput_(result);
  } catch (err) {
    return jsonOutput_({success:false,error:String(err && err.message || err)});
  }
}

function sendSchoolEmail_(body) {
  const to = clean_(body.to_email || body.to);
  const subject = clean_(body.subject);
  const html = String(body.html_body || body.html || '');
  const text = String(body.text_body || body.text || stripHtml_(html));
  if (!to || !subject) throw new Error('Thiếu email người nhận hoặc tiêu đề.');

  const links = Array.isArray(body.documents) ? body.documents : [];
  const tracked = links.map(doc => {
    const r = createTrackedLink_({
      school_id: body.school_id,
      school_name: body.school_name,
      contact_id: body.contact_id,
      contact_name: body.contact_name,
      document_id: doc.document_id || doc.id,
      document_name: doc.document_name || doc.name,
      destination_url: doc.destination_url || doc.url,
      created_by: body.sent_by || body.actor
    });
    return {name: doc.document_name || doc.name || 'Tài liệu', url: r.tracked_url, track_id: r.track_id};
  });

  const linksHtml = tracked.length
    ? '<div style="margin-top:18px"><b>Tài liệu:</b><ul>' + tracked.map(x => '<li><a href="' + escapeHtml_(x.url) + '">' + escapeHtml_(x.name) + '</a></li>').join('') + '</ul></div>'
    : '';

  GmailApp.sendEmail(to, subject, text, {
    htmlBody: html + linksHtml,
    name: clean_(body.sender_name) || 'Sunbot'
  });

  const emailId = 'EM_' + Utilities.getUuid();
  appendRow_(SCHOOL_OS.SHEETS.EMAIL_LOG, [
    emailId,new Date(),body.school_id || '',body.school_name || '',body.contact_id || '',
    body.contact_name || '',to,subject,body.template_key || '',
    tracked.map(x=>x.track_id).join(','),body.sent_by || body.actor || '', 'SENT',''
  ]);

  logEvent_({
    school_id: body.school_id,
    school_name: body.school_name,
    contact_id: body.contact_id,
    contact_name: body.contact_name,
    event_type: SCHOOL_OS.EVENT.EMAIL_SENT,
    actor: body.sent_by || body.actor,
    channel: 'Email',
    summary: 'Đã gửi email: ' + subject,
    detail: {to_email:to,email_id:emailId,template_key:body.template_key || '',tracked_links:tracked},
    source_id: emailId,
    hot_signal: false
  });

  return {success:true,email_id:emailId,tracked_documents:tracked};
}

function createTrackedLink_(body) {
  const destination = clean_(body.destination_url || body.url);
  if (!destination) throw new Error('Thiếu URL tài liệu.');
  if (!/^https?:\/\//i.test(destination)) throw new Error('URL tài liệu không hợp lệ.');

  const trackId = 'TRK_' + Utilities.getUuid().replace(/-/g,'');
  appendRow_(SCHOOL_OS.SHEETS.TRACKED_LINKS, [
    trackId,new Date(),body.school_id || '',body.school_name || '',body.contact_id || '',
    body.contact_name || '',body.document_id || '',body.document_name || '',destination,
    body.created_by || body.actor || '', 'ACTIVE',0,'',''
  ]);

  logEvent_({
    school_id: body.school_id,
    school_name: body.school_name,
    contact_id: body.contact_id,
    contact_name: body.contact_name,
    event_type: SCHOOL_OS.EVENT.LINK_CREATED,
    actor: body.created_by || body.actor,
    channel: 'Tài liệu',
    summary: 'Tạo link theo dõi: ' + (body.document_name || 'Tài liệu'),
    detail: {track_id:trackId,document_id:body.document_id || '',destination_url:destination},
    source_id: trackId,
    hot_signal: false
  });

  const serviceUrl = ScriptApp.getService().getUrl();
  if (!serviceUrl) throw new Error('Apps Script chưa được deploy thành Web App.');
  return {success:true,track_id:trackId,tracked_url:serviceUrl + '?t=' + encodeURIComponent(trackId)};
}

function handleTrackedOpen_(trackId) {
  const ss = getDataSpreadsheet_();
  const sh = ss.getSheetByName(SCHOOL_OS.SHEETS.TRACKED_LINKS);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const idx = headerIndex_(headers);
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idx.track_id]) !== String(trackId)) continue;
    if (String(values[r][idx.status]) !== 'ACTIVE') throw new Error('Link không còn hoạt động.');

    const now = new Date();
    const count = Number(values[r][idx.open_count] || 0) + 1;
    sh.getRange(r+1, idx.open_count+1).setValue(count);
    if (!values[r][idx.first_open_at]) sh.getRange(r+1, idx.first_open_at+1).setValue(now);
    sh.getRange(r+1, idx.last_open_at+1).setValue(now);

    logEvent_({
      school_id: values[r][idx.school_id],
      school_name: values[r][idx.school_name],
      contact_id: values[r][idx.contact_id],
      contact_name: values[r][idx.contact_name],
      event_type: SCHOOL_OS.EVENT.LINK_OPENED,
      actor: 'external_contact',
      channel: 'Tài liệu',
      summary: 'Đã mở ' + (values[r][idx.document_name] || 'tài liệu') + (count > 1 ? ' lần ' + count : ''),
      detail: {track_id:trackId,open_count:count,document_id:values[r][idx.document_id]},
      source_id: trackId,
      hot_signal: true
    });

    return HtmlService.createHtmlOutput(
      '<!doctype html><html><head><meta charset="utf-8">' +
      '<meta http-equiv="refresh" content="0;url=' + escapeHtml_(values[r][idx.destination_url]) + '">' +
      '<title>Đang mở tài liệu</title></head><body style="font-family:system-ui;padding:32px">' +
      'Đang mở tài liệu Sunbot...</body></html>'
    ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  throw new Error('Không tìm thấy link theo dõi.');
}

function logActivityApi_(body) {
  const eventId = logEvent_({
    school_id: body.school_id,
    school_name: body.school_name,
    contact_id: body.contact_id,
    contact_name: body.contact_name,
    event_type: body.event_type || SCHOOL_OS.EVENT.MANUAL_ACTIVITY,
    actor: body.actor,
    channel: body.channel,
    summary: body.summary,
    detail: body.detail || {},
    source_id: body.source_id || '',
    hot_signal: !!body.hot_signal
  });
  return {success:true,event_id:eventId};
}

function getActivityApi_(body) {
  const schoolId = clean_(body.school_id);
  if (!schoolId) throw new Error('Thiếu school_id.');
  const limit = Math.max(1, Math.min(Number(body.limit || 100), 500));
  const rows = sheetObjects_(SCHOOL_OS.SHEETS.ACTIVITIES)
    .filter(x => String(x.school_id) === schoolId)
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
    .map(x => {
      try { x.detail = x.detail_json ? JSON.parse(x.detail_json) : {}; } catch(e) { x.detail = {}; }
      delete x.detail_json;
      return x;
    });
  return {success:true,activities:rows};
}

function logEvent_(e) {
  const eventId = 'EV_' + Utilities.getUuid();
  appendRow_(SCHOOL_OS.SHEETS.ACTIVITIES, [
    eventId,new Date(),e.school_id || '',e.school_name || '',e.contact_id || '',e.contact_name || '',
    e.event_type || SCHOOL_OS.EVENT.MANUAL_ACTIVITY,e.actor || '',e.channel || '',e.summary || '',
    JSON.stringify(e.detail || {}),e.source_id || '',e.hot_signal ? 'TRUE' : 'FALSE'
  ]);
  return eventId;
}

function requireApiKey_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty('SCHOOL_OS_API_KEY');
  if (!expected) throw new Error('Backend chưa setup. Chạy schoolOsSetup() trước.');
  if (!provided || String(provided) !== String(expected)) throw new Error('API key không hợp lệ.');
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const raw = e.postData.contents;
  try { return JSON.parse(raw); } catch (err) {
    const p = e.parameter || {};
    return p;
  }
}

function getDataSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SCHOOL_OS_SPREADSHEET_ID');
  if (!id) throw new Error('Chưa có SCHOOL_OS_SPREADSHEET_ID. Chạy schoolOsSetup() trước.');
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  return sh;
}

function appendRow_(sheetName, row) {
  const sh = getDataSpreadsheet_().getSheetByName(sheetName);
  if (!sh) throw new Error('Thiếu sheet ' + sheetName + '. Chạy schoolOsSetup().');
  sh.appendRow(row);
}

function sheetObjects_(sheetName) {
  const sh = getDataSpreadsheet_().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const v = sh.getDataRange().getValues();
  const h = v[0].map(String);
  return v.slice(1).map(row => h.reduce((o,k,i)=>(o[k]=row[i],o),{}));
}

function headerIndex_(headers) {
  return headers.reduce((o,k,i)=>(o[String(k)]=i,o),{});
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(v) { return String(v == null ? '' : v).trim(); }
function stripHtml_(s) { return String(s || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function escapeHtml_(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
