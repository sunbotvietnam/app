/* Sunbot School OS -> Portal journey telemetry bridge */
(function(){
'use strict';
const TELEMETRY='https://script.google.com/macros/s/AKfycbw32BGSXwFVOpRCknx5hn8-k2m5ZXox26_y2mnZKVWL0JKHCv_Qtly5JiY0FS9e87kU/exec';
const CAMPAIGN='2026-school-development';
function B(){return window.SchoolOsBackend}
function user(){return B()?.currentUser?.()||{}}
function schoolById(id){return (window.state?.schools||[]).find(s=>String(s.id)===String(id))||{}}
function audience(s){const t=String(s.type||'').toLowerCase();if(/hệ thống|đa cơ sở/.test(t))return'system';if(/tư thục|độc lập/.test(t))return'private';return'public'}
function lidFor(a){const p=a==='private'?'R':a==='system'?'S':'P';let r='';try{r=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now()).replace(/-/g,'').slice(0,11).toUpperCase()}catch(e){r=(Math.random().toString(36).slice(2)+Date.now().toString(36)).slice(0,11).toUpperCase()}return p+r}
function profileUrl(s,lid,a,u){const q=new URLSearchParams({audience:a,guided:'1',lid:lid,school_id:String(s.id||''),school:String(s.name||''),sender:String(u.name||''),sender_email:String(u.email||''),asset:'profile',ver:'v2',campaign:CAMPAIGN,from:'sunbot_ops'});return'https://sunbotvietnam.github.io/portal/profile-v2/?'+q.toString()+'#evidence'}
function post(type,payload){try{return fetch(TELEMETRY,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'publicAssetEvent',type,payload}),keepalive:true})}catch(e){return Promise.resolve()}}
function install(){const api=B();if(!api||api.__portalJourneyBridge)return false;const orig=api.createTrackedLink;if(typeof orig!=='function')return false;api.createTrackedLink=async function(payload){const p=Object.assign({},payload||{});if(String(p.document_id||'').toUpperCase()==='EPROFILE'){
    const s=schoolById(p.school_id);const u=user(),a=audience(s),lid=lidFor(a),url=profileUrl(s,lid,a,u);p.destination_url=url;
    post('link',{link_id:lid,created_at:new Date().toISOString(),active:true,school_id:s.id||p.school_id||'',school:s.name||p.school_name||'',owner:u.name||u.email||'',audience:a,asset_type:'profile',asset_version:'v2',campaign:CAMPAIGN,primary_channel:'email',landing_path:'/profile-v2/',short_label:'E-profile '+(s.name||''),full_url:url,qr_target_url:url,attribution_mode:'LINK_ATTRIBUTED',status:'ACTIVE',notes:'Created by Sunbot School OS'});
    p._portal_lid=lid;
  }
  const r=await orig.call(api,p);if(p._portal_lid&&r){r.portal_lid=p._portal_lid;r.portal_url=p.destination_url;}return r;
};api.__portalJourneyBridge=true;return true}
if(!install()){let n=0;const t=setInterval(()=>{if(install()||++n>30)clearInterval(t)},100)}
})();
