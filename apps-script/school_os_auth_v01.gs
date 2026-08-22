/* Sunbot School OS - session authentication and hierarchical role model v0.3 */

const SCHOOL_OS_AUTH = {
  USERS: 'SO_USERS',
  SESSIONS: 'SO_SESSIONS',
  SESSION_HOURS: 12,
  ROLES: ['SUPER_ADMIN','ADMIN','LEADER','STAFF']
};

function ensureAuthSheets_(ss) {
  ensureSheet_(ss, SCHOOL_OS_AUTH.USERS, [
    'user_id','email','name','role','region','password_hash','password_salt','status','last_login_at','updated_at','manager_id','team_id'
  ]);
  ensureSheet_(ss, SCHOOL_OS_AUTH.SESSIONS, [
    'session_id','token_hash','user_id','email','role','region','created_at','expires_at','revoked_at','last_seen_at'
  ]);
}

function schoolOsCreateOrResetUser(email, name, role, region, password, managerId, teamId) {
  const cleanEmail = normalizeEmail_(email);
  const cleanRole = String(role || 'STAFF').toUpperCase();
  if (!cleanEmail) throw new Error('Email không hợp lệ.');
  if (SCHOOL_OS_AUTH.ROLES.indexOf(cleanRole) < 0) throw new Error('Role không hợp lệ.');
  if (String(password || '').length < 6) throw new Error('Mật khẩu cần ít nhất 6 ký tự.');
  const ss = getDataSpreadsheet_();
  ensureAuthSheets_(ss);
  const sh = ss.getSheetByName(SCHOOL_OS_AUTH.USERS);
  const data = sh.getDataRange().getValues();
  const idx = headerIndex_(data[0]);
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
    if (idx.manager_id != null) row[idx.manager_id] = managerId || '';
    if (idx.team_id != null) row[idx.team_id] = teamId || '';
    sh.getRange(r+1,1,1,row.length).setValues([row]);
    revokeUserSessions_(String(row[idx.user_id]));
    return {success:true,user_id:String(row[idx.user_id]),email:cleanEmail,role:cleanRole,reset:true};
  }
  const userId = 'USR_' + Utilities.getUuid().replace(/-/g,'');
  sh.appendRow([userId,cleanEmail,name||cleanEmail,cleanRole,region||'',hash,salt,'ACTIVE','',now,managerId||'',teamId||'']);
  return {success:true,user_id:userId,email:cleanEmail,role:cleanRole,reset:false};
}

function loginApi_(body) {
  const email = normalizeEmail_(body.email), password = String(body.password || '');
  if (!email || !password) throw new Error('Cần nhập email và mật khẩu.');
  const user = findUserByEmail_(email);
  if (!user || String(user.status).toUpperCase() !== 'ACTIVE') throw new Error('Tài khoản không tồn tại hoặc đã bị khóa.');
  const got = hashPassword_(password, String(user.password_salt || ''));
  if (!constantTimeEq_(got, String(user.password_hash || ''))) throw new Error('Email hoặc mật khẩu không đúng.');
  const rawToken = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  const now = new Date(), expires = new Date(now.getTime() + SCHOOL_OS_AUTH.SESSION_HOURS * 3600 * 1000);
  const sessionId = 'SES_' + Utilities.getUuid().replace(/-/g,'');
  getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.SESSIONS).appendRow([
    sessionId,hashToken_(rawToken),user.user_id,user.email,user.role,user.region,now,expires,'',now
  ]);
  updateUserLastLogin_(user.user_id, now);
  return {success:true,session_token:rawToken,expires_at:expires.toISOString(),user:publicUser_(user)};
}

function logoutApi_(body) { const t=String(body.session_token||body.sessionToken||''); if(t) revokeSessionByToken_(t); return {success:true}; }
function meApi_(body) { const a=requireSession_(body); return {success:true,user:publicUser_(a.user),expires_at:a.expires_at}; }

function changePasswordApi_(body, auth) {
  const oldPassword=String(body.current_password||body.currentPassword||''), newPassword=String(body.new_password||body.newPassword||'');
  if(!oldPassword) throw new Error('Cần nhập mật khẩu hiện tại.');
  if(newPassword.length<6) throw new Error('Mật khẩu mới cần ít nhất 6 ký tự.');
  if(oldPassword===newPassword) throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
  const user=findUserById_(String(auth.user.user_id)); if(!user) throw new Error('Không tìm thấy tài khoản.');
  if(!constantTimeEq_(hashPassword_(oldPassword,String(user.password_salt||'')),String(user.password_hash||''))) throw new Error('Mật khẩu hiện tại không đúng.');
  const sh=getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.USERS),data=sh.getDataRange().getValues(),idx=headerIndex_(data[0]);
  const salt=Utilities.getUuid().replace(/-/g,''),hash=hashPassword_(newPassword,salt),now=new Date();
  for(let r=1;r<data.length;r++) if(String(data[r][idx.user_id])===String(user.user_id)){
    sh.getRange(r+1,idx.password_hash+1).setValue(hash); sh.getRange(r+1,idx.password_salt+1).setValue(salt); sh.getRange(r+1,idx.updated_at+1).setValue(now);
    revokeUserSessions_(String(user.user_id)); return {success:true,reauthenticate:true};
  }
  throw new Error('Không cập nhật được mật khẩu.');
}

function requireAuthorized_(body, allowedRoles) {
  const token=String(body.session_token||body.sessionToken||'');
  if(token){const auth=requireSession_(body);if(allowedRoles&&allowedRoles.length&&allowedRoles.indexOf(String(auth.user.role))<0)throw new Error('Bạn không có quyền thực hiện thao tác này.');return auth;}
  requireApiKey_(body.api_key||body.apiKey);
  return {user:{user_id:'SYSTEM',email:'system',name:'System',role:'SUPER_ADMIN',region:'',manager_id:'',team_id:'ALL'},via_api_key:true};
}

function requireSession_(body) {
  const token=String(body.session_token||body.sessionToken||''); if(!token) throw new Error('AUTH_REQUIRED');
  const tokenHash=hashToken_(token),sh=getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.SESSIONS),data=sh.getDataRange().getValues(),idx=headerIndex_(data[0]),now=new Date();
  for(let r=1;r<data.length;r++){
    if(!constantTimeEq_(String(data[r][idx.token_hash]||''),tokenHash))continue;
    if(data[r][idx.revoked_at])throw new Error('SESSION_REVOKED');
    const expires=new Date(data[r][idx.expires_at]); if(!expires.getTime()||expires<=now)throw new Error('SESSION_EXPIRED');
    const user=findUserById_(String(data[r][idx.user_id])); if(!user||String(user.status).toUpperCase()!=='ACTIVE')throw new Error('ACCOUNT_DISABLED');
    sh.getRange(r+1,idx.last_seen_at+1).setValue(now); return {user:user,expires_at:expires.toISOString(),session_id:String(data[r][idx.session_id])};
  }
  throw new Error('SESSION_INVALID');
}

function activeTeamUsers_(leaderId){
  return sheetObjects_(SCHOOL_OS_AUTH.USERS).filter(x=>String(x.manager_id||'')===String(leaderId)&&String(x.status||'').toUpperCase()==='ACTIVE');
}
function userMatchesOwner_(u,school){
  const owner=String(school.owner||'').trim().toLowerCase(), ownerEmail=normalizeEmail_(school.owner_email||'');
  if(ownerEmail&&ownerEmail===normalizeEmail_(u.email))return true;
  return !!owner&&!!u.name&&owner===String(u.name).trim().toLowerCase();
}
function canAccessSchool_(user, school) {
  const role=String(user.role||'').toUpperCase();
  if(role==='SUPER_ADMIN'||role==='ADMIN') return true;
  if(userMatchesOwner_(user,school)) return true;
  if(role==='LEADER') return activeTeamUsers_(user.user_id).some(u=>userMatchesOwner_(u,school));
  return false;
}

function listUsersApi_(body,auth){
  const role=String(auth.user.role||'').toUpperCase();
  let rows=sheetObjects_(SCHOOL_OS_AUTH.USERS).filter(x=>String(x.status||'').toUpperCase()!=='DELETED');
  if(role==='LEADER') rows=rows.filter(x=>String(x.user_id)===String(auth.user.user_id)||String(x.manager_id||'')===String(auth.user.user_id));
  else if(role!=='ADMIN'&&role!=='SUPER_ADMIN') rows=rows.filter(x=>String(x.user_id)===String(auth.user.user_id));
  return {success:true,users:rows.map(publicUser_)};
}

function findUserByEmail_(email){return sheetObjects_(SCHOOL_OS_AUTH.USERS).find(x=>normalizeEmail_(x.email)===normalizeEmail_(email))||null;}
function findUserById_(id){return sheetObjects_(SCHOOL_OS_AUTH.USERS).find(x=>String(x.user_id)===String(id))||null;}
function publicUser_(u){return {user_id:String(u.user_id),email:String(u.email),name:String(u.name),role:String(u.role),region:String(u.region||''),manager_id:String(u.manager_id||''),team_id:String(u.team_id||''),status:String(u.status||'')};}
function updateUserLastLogin_(userId,when){const sh=getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.USERS),data=sh.getDataRange().getValues(),idx=headerIndex_(data[0]);for(let r=1;r<data.length;r++)if(String(data[r][idx.user_id])===String(userId)){sh.getRange(r+1,idx.last_login_at+1).setValue(when);return;}}
function revokeSessionByToken_(token){const hash=hashToken_(token),sh=getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.SESSIONS),data=sh.getDataRange().getValues(),idx=headerIndex_(data[0]);for(let r=1;r<data.length;r++)if(constantTimeEq_(String(data[r][idx.token_hash]||''),hash)){sh.getRange(r+1,idx.revoked_at+1).setValue(new Date());return;}}
function revokeUserSessions_(userId){const sh=getDataSpreadsheet_().getSheetByName(SCHOOL_OS_AUTH.SESSIONS),data=sh.getDataRange().getValues(),idx=headerIndex_(data[0]);for(let r=1;r<data.length;r++)if(String(data[r][idx.user_id])===String(userId)&&!data[r][idx.revoked_at])sh.getRange(r+1,idx.revoked_at+1).setValue(new Date());}
function normalizeEmail_(v){return String(v||'').trim().toLowerCase();}
function hashPassword_(password,salt){return digestHex_(String(salt)+'|'+String(password));}
function hashToken_(token){return digestHex_('SESSION|'+String(token));}
function digestHex_(text){const b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8);return b.map(x=>('0'+((x<0?x+256:x).toString(16))).slice(-2)).join('');}
function constantTimeEq_(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
