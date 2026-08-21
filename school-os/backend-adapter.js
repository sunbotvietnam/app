/* Sunbot School OS frontend backend adapter v0.2 */
(function(){
  const URL_KEY='sunbot-school-os-backend-url';
  const API_KEY='sunbot-school-os-api-key';

  function config(){
    return {
      url:(localStorage.getItem(URL_KEY)||'').trim(),
      apiKey:(localStorage.getItem(API_KEY)||'').trim()
    };
  }

  function isConfigured(){
    const c=config();
    return /^https:\/\//i.test(c.url)&&!!c.apiKey;
  }

  async function call(action,payload){
    const c=config();
    if(!isConfigured()) throw new Error('Backend School OS chưa được cấu hình.');
    const res=await fetch(c.url,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(Object.assign({action,api_key:c.apiKey},payload||{})),
      redirect:'follow'
    });
    if(!res.ok) throw new Error('Backend phản hồi HTTP '+res.status);
    const data=await res.json();
    if(!data.success) throw new Error(data.error||'Backend trả về lỗi.');
    return data;
  }

  const health=()=>call('health',{});
  const sendEmail=payload=>call('send_email',payload);
  const createTrackedLink=payload=>call('create_tracked_link',payload);
  const logActivity=payload=>call('log_activity',payload);
  const getActivity=(schoolId,limit)=>call('get_activity',{school_id:schoolId,limit:limit||100});
  const getCoreState=()=>call('get_core_state',{});
  const saveCoreState=(state,baseVersion,actor)=>call('save_core_state',{state,base_version:baseVersion,actor:actor||''});

  function saveConfig(url,apiKey){
    if(url!=null)localStorage.setItem(URL_KEY,String(url).trim());
    if(apiKey!=null)localStorage.setItem(API_KEY,String(apiKey).trim());
  }
  function clearConfig(){localStorage.removeItem(URL_KEY);localStorage.removeItem(API_KEY);}

  window.SchoolOsBackend={
    config,isConfigured,health,sendEmail,createTrackedLink,logActivity,getActivity,
    getCoreState,saveCoreState,saveConfig,clearConfig
  };
})();
