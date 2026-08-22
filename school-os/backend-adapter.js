/* Sunbot School OS frontend backend adapter v0.5 */
(function(){
  const URL_KEY='sunbot-school-os-backend-url';
  const API_KEY='sunbot-school-os-api-key';
  const SESSION_KEY='sunbot-school-os-session';
  const USER_KEY='sunbot-school-os-user';

  function config(){
    const deployed=(window.SCHOOL_OS_CONFIG&&window.SCHOOL_OS_CONFIG.backendUrl)||'';
    return{url:(localStorage.getItem(URL_KEY)||deployed||'').trim(),apiKey:(localStorage.getItem(API_KEY)||'').trim()};
  }
  function sessionToken(){return(localStorage.getItem(SESSION_KEY)||'').trim();}
  function currentUser(){try{return JSON.parse(localStorage.getItem(USER_KEY)||'null')}catch(e){return null}}
  function isConfigured(){return /^https:\/\//i.test(config().url);}
  function isAuthenticated(){return !!sessionToken()&&!!currentUser();}

  async function call(action,payload,opts){
    const c=config();
    if(!isConfigured())throw new Error('Hệ thống dữ liệu chưa được cấu hình.');
    const envelope=Object.assign({action},payload||{}), token=sessionToken();
    if(token)envelope.session_token=token;
    if(c.apiKey&&(opts&&opts.useApiKey))envelope.api_key=c.apiKey;
    const res=await fetch(c.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(envelope),redirect:'follow'});
    if(!res.ok)throw new Error('Máy chủ phản hồi HTTP '+res.status);
    const data=await res.json();
    if(!data.success){
      const m=String(data.error||'Máy chủ trả về lỗi.');
      if(/SESSION_(EXPIRED|INVALID|REVOKED)|AUTH_REQUIRED|ACCOUNT_DISABLED/.test(m))clearSession();
      const err=new Error(m);err.code=m.split(':')[0];throw err;
    }
    return data;
  }

  const health=()=>call('health',{});
  async function login(email,password){const r=await call('login',{email,password});localStorage.setItem(SESSION_KEY,r.session_token);localStorage.setItem(USER_KEY,JSON.stringify(r.user||null));return r;}
  async function logout(){try{if(sessionToken())await call('logout',{});}finally{clearSession();}}
  async function me(){const r=await call('me',{});localStorage.setItem(USER_KEY,JSON.stringify(r.user||null));return r;}
  async function changePassword(currentPassword,newPassword){return call('change_password',{current_password:currentPassword,new_password:newPassword});}
  const sendEmail=payload=>call('send_email',payload);
  const createTrackedLink=payload=>call('create_tracked_link',payload);
  const logActivity=payload=>call('log_activity',payload);
  const getActivity=(schoolId,limit)=>call('get_activity',{school_id:schoolId,limit:limit||100});
  const listCoreRecords=()=>call('list_core_records',{});
  const upsertSchool=(record,expectedVersion)=>call('upsert_school',{record,expected_version:expectedVersion==null?null:expectedVersion});
  const upsertContact=(record,expectedVersion)=>call('upsert_contact',{record,expected_version:expectedVersion==null?null:expectedVersion});
  const upsertTask=(record,expectedVersion)=>call('upsert_task',{record,expected_version:expectedVersion==null?null:expectedVersion});
  const upsertOpportunity=(record,expectedVersion)=>call('upsert_opportunity',{record,expected_version:expectedVersion==null?null:expectedVersion});
  const deleteRecord=(type,id,expectedVersion)=>call('delete_record',{record_type:type,record_id:id,expected_version:expectedVersion==null?null:expectedVersion});
  const getCoreState=()=>call('get_core_state',{});
  const saveCoreState=(state,baseVersion,actor)=>call('save_core_state',{state,base_version:baseVersion,actor:actor||''},{useApiKey:true});

  function saveConfig(url,apiKey){if(url!=null)localStorage.setItem(URL_KEY,String(url).trim());if(apiKey!=null)localStorage.setItem(API_KEY,String(apiKey).trim());}
  function clearConfig(){localStorage.removeItem(URL_KEY);localStorage.removeItem(API_KEY);clearSession();}
  function clearSession(){localStorage.removeItem(SESSION_KEY);localStorage.removeItem(USER_KEY);}

  window.SchoolOsBackend={
    config,isConfigured,isAuthenticated,sessionToken,currentUser,health,login,logout,me,changePassword,
    sendEmail,createTrackedLink,logActivity,getActivity,listCoreRecords,
    upsertSchool,upsertContact,upsertTask,upsertOpportunity,deleteRecord,
    getCoreState,saveCoreState,saveConfig,clearConfig,clearSession
  };
})();
