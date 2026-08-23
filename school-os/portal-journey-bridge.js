/* Sunbot School OS -> Portal journey bridge; asset registration is server-side */
(function(){
'use strict';
const CAMPAIGN='2026-school-development';
function B(){return window.SchoolOsBackend}
function user(){return B()?.currentUser?.()||{}}
function schoolById(id){return (window.state?.schools||[]).find(s=>String(s.id)===String(id))||{}}
function audience(s){const t=String(s.type||'').toLowerCase();if(/hệ thống|đa cơ sở/.test(t))return'system';if(/tư thục|độc lập/.test(t))return'private';return'public'}
function lidFor(a){const p=a==='private'?'R':a==='system'?'S':'P';let r='';try{r=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now()).replace(/-/g,'').slice(0,11).toUpperCase()}catch(e){r=(Math.random().toString(36).slice(2)+Date.now().toString(36)).slice(0,11).toUpperCase()}return p+r}
function profileUrl(s,lid,a,u){const q=new URLSearchParams({audience:a,guided:'1',lid:lid,school_id:String(s.id||''),school:String(s.name||''),sender:String(u.name||''),sender_email:String(u.email||''),asset:'profile',ver:'v2',campaign:CAMPAIGN,from:'sunbot_ops'});return'https://sunbotvietnam.github.io/portal/profile-v2/?'+q.toString()+'#evidence'}
function install(){const api=B();if(!api||api.__portalJourneyBridge)return false;const orig=api.createTrackedLink;if(typeof orig!=='function')return false;api.createTrackedLink=async function(payload){const p=Object.assign({},payload||{});if(String(p.document_id||'').toUpperCase()==='EPROFILE'){
    const s=schoolById(p.school_id);const u=user(),a=audience(s),lid=lidFor(a),url=profileUrl(s,lid,a,u);p.destination_url=url;p._portal_lid=lid;
  }
  const r=await orig.call(api,p);if(p._portal_lid&&r){r.portal_lid=p._portal_lid;r.portal_url=p.destination_url;}return r;
};api.__portalJourneyBridge=true;return true}
if(!install()){let n=0;const t=setInterval(()=>{if(install()||++n>30)clearInterval(t)},100)}
})();
