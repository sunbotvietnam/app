/* Sunbot School OS - session authentication and role model v0.1 */

const SCHOOL_OS_AUTH = {
  USERS: 'SO_USERS',
  SESSIONS: 'SO_SESSIONS',
  SESSION_HOURS: 12,
  ROLES: ['SUPER_ADMIN','ADMIN','LEADER','STAFF']
};

function ensureAuthSheets_(ss) {
  ensureSheet_(ss, SCHOOL_OS_AUTH.USERS, [
    'user_id','email','name','role','region','password_hash','password_salt','status','last_login_at','updated_at'
  ]);
  ensureSheet_(ss, SCHOOL_OS_AUTH.SESSIONS, [
    'session_id','token_hash','user_id','email','role','region','created_at','expires_at','revoked_at','last_seen_at'
  ]);
}

/**
 * Bootstrap/reset user from Apps Script editor only.
 * Never expose this as a public web action.
 */
function schoolOsCreateOrResetUser(email, name, role, region, password) {
  const cleanEmail = normalizeEmail_(email);
  const cleanRole = String(role || 'STAFF').toUpperCase();
  if (!cleanEmail) throw new Error('Email không hợp lệ.');
  if (SCHOOL_OS_AUTH.ROLES.indexOf(cleanRole) < 0) throw new Error('Role không hợp lệ.');
  if (String(password || '').length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
  const ss = getDataSpreadsheet_();
  ensureAuthSheets_(ss);
  const sh = ss.getSheetByName(SCHOOL_OS_AUTH.USERS);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const idx = headerIndex_(headers);
  const salt = Utilities.getUuid().replace(/-/g,'');
  const hash = hashPassword_(password, salt);
  const now = new Date();
  for (let r = 1; r < data.length; r++) {
    if (normalizeEmail_(data[r][idx.email]) !== cleanEmail) continue;
    const row = data[r].slice();
    row[idx.name] = name || row[idx.name] || cleanEmail;
    row[idx.role] = cleanRole;
    row[idx.region] = region || '';
    row[idx.password_hash] = hash;
    row[idx.password_salt] = salt;
    row[idx.status] = 'ACTIVE';
    row[idx.updated_at] = now;
    sh.getRange(r+1,1,1,row.length).setValues([row]);
    revokeUserSessions_(String(row[idx.user_id]));
    return {success:true,user_id:String(row[idx.user_id]),email:cleanEmail,role:cleanRole,reset:true};
  }
  const userId = 'USR_' + Utilities.getUuid().replace(/-/g,'');
  sh.appendRow([userId,cleanEmail,name||cleanEmail,cleanRole,region||'',hash,salt,'ACTIVE','',now]);
  return {success:true,user_id:userId,email:cleanEmail,role:cleanRole,reset:false};
}

function loginApi_(body) {
  const email = normalizeEmail_(body.email);
  const password = String(body.password || '');
  if (!email || !password) throw new Error('Cần nhập email và mật khẩu.');
  const user = findUserByEmail_(email);
  if (!user || String(user.status).toUpperCase() !== 'ACTIVE') throw new Error('Tài khoản không tồn tại hoặc đã bị khóa.');
  const got = hashPassword_(password, String(user.password_salt || ''));
  if (!constantTimeEq_(got, String(user.password_hash || ''))) throw new Error('Email hoặc mật khẩu không đúng.');
  const rawToken = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  const tokenHash = hashToken_(rawToken);
  const now = new Date();
  const expires = new Date(now.getTime() + SCHOOL_OS_AUTH.SESSION_HOURS * 3600 * 1000);
  const sessionId = 'SES_' + Utilities.getUuid().replace(/-/g,'');
  getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.SESSIONS).appendRow([
    sessionId,tokenHash,user.user_id,user.email,user.role,user.region,now,expires,'',now
  ]);
  updateUserLastLogin_(user.user_id, now);
  return {success:true,session_token:rawToken,expires_at:expires.toISOString(),user:publicUser_(user)};
}

function logoutApi_(body) {
  const token = String(body.session_token || body.sessionToken || '');
  if (!token) return {success:true};
  revokeSessionByToken_(token);
  return {success:true};
}

function meApi_(body) {
  const auth = requireSession_(body);
  return {success:true,user:publicUser_(auth.user),expires_at:auth.expires_at};
}

function requireAuthorized_(body, allowedRoles) {
  const token = String(body.session_token || body.sessionToken || '');
  if (token) {
    const auth = requireSession_(body);
    if (allowedRoles && allowedRoles.length && allowedRoles.indexOf(String(auth.user.role)) < 0) {
      throw new Error('Bạn không có quyền thực hiện thao tác này.');
    }
    return auth;
  }
  requireApiKey_(body.api_key || body.apiKey);
  return {user:{user_id:'SYSTEM',email:'system',name:'System',role:'SUPER_ADMIN',region:''},via_api_key:true};
}

function requireSession_(body) {
  const token = String(body.session_token || body.sessionToken || '');
  if (!token) throw new Error('AUTH_REQUIRED');
  const tokenHash = hashToken_(token);
  const sh = getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.SESSIONS);
  const data = sh.getDataRange().getValues();
  const idx = headerIndex_(data[0]);
  const now = new Date();
  for (let r = 1; r < data.length; r++) {
    if (!constantTimeEq_(String(data[r][idx.token_hash] || ''), tokenHash)) continue;
    if (data[r][idx.revoked_at]) throw new Error('SESSION_REVOKED');
    const expires = new Date(data[r][idx.expires_at]);
    if (!expires.getTime() || expires <= now) throw new Error('SESSION_EXPIRED');
    const user = findUserById_(String(data[r][idx.user_id]));
    if (!user || String(user.status).toUpperCase() !== 'ACTIVE') throw new Error('ACCOUNT_DISABLED');
    sh.getRange(r+1, idx.last_seen_at+1).setValue(now);
    return {user:user,expires_at:expires.toISOString(),session_id:String(data[r][idx.session_id])};
  }
  throw new Error('SESSION_INVALID');
}

function canAccessSchool_(user, school) {
  const role = String(user.role || '');
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'LEADER') return true;
  const userEmail = normalizeEmail_(user.email);
  const owner = String(school.owner || '').toLowerCase();
  const ownerEmail = normalizeEmail_(school.owner_email || '');
  if (ownerEmail && ownerEmail === userEmail) return true;
  if (user.region && school.region && String(user.region) === String(school.region)) return true;
  if (owner && user.name && owner === String(user.name).toLowerCase()) return true;
  return false;
}

function findUserByEmail_(email) {
  const rows = sheetObjects_(SCHOOL_OS_AUTH.USERS);
  return rows.find(x => normalizeEmail_(x.email) === normalizeEmail_(email)) || null;
}
function findUserById_(id) {
  const rows = sheetObjects_(SCHOOL_OS_AUTH.USERS);
  return rows.find(x => String(x.user_id) === String(id)) || null;
}
function publicUser_(u) {
  return {user_id:String(u.user_id),email:String(u.email),name:String(u.name),role:String(u.role),region:String(u.region||'')};
}
function updateUserLastLogin_(userId, when) {
  const sh = getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.USERS);
  const data = sh.getDataRange().getValues();
  const idx = headerIndex_(data[0]);
  for (let r=1;r<data.length;r++) if (String(data[r][idx.user_id])===String(userId)) {
    sh.getRange(r+1,idx.last_login_at+1).setValue(when); return;
  }
}
function revokeSessionByToken_(token) {
  const hash = hashToken_(token), sh=getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.SESSIONS), data=sh.getDataRange().getValues(), idx=headerIndex_(data[0]);
  for(let r=1;r<data.length;r++) if(constantTimeEq_(String(data[r][idx.token_hash]||''),hash)){sh.getRange(r+1,idx.revoked_at+1).setValue(new Date());return;}
}
function revokeUserSessions_(userId) {
  const sh=getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.SESSIONS),data=sh.getDataRange().getValues(),idx=headerIndex_(data[0]);
  for(let r=1;r<data.length;r++) if(String(data[r][idx.user_id])===String(userId)&&!data[r][idx.revoked_at]) sh.getRange(r+1,idx.revoked_at+1).setValue(new Date());
}
function normalizeEmail_(v){return String(v||'').trim().toLowerCase();}
function hashPassword_(password,salt){return digestHex_(String(salt)+'|'+String(password));}
function hashToken_(token){return digestHex_('SESSION|'+String(token));}
function digestHex_(text){const b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8);return b.map(x=>('0'+((x<0?x+256:x).toString(16))).slice(-2)).join('');}
function constantTimeEq_(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
