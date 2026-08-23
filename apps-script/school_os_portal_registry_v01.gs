/* Sunbot School OS - server-side Portal telemetry registry v0.1 */
const SCHOOL_OS_PORTAL_REGISTRY={
  ENDPOINT:'https://script.google.com/macros/s/AKfycbw32BGSXwFVOpRCknx5hn8-k2m5ZXox26_y2mnZKVWL0JKHCv_Qtly5JiY0FS9e87kU/exec',
  CAMPAIGN:'2026-school-development'
};

function portalLinkIdFromUrl_(url){
  const s=String(url||'');
  let m=s.match(/[?&](?:lid|link_id)=([^&#]+)/i);
  if(m)return decodeURIComponent(m[1]);
  m=s.match(/\/portal\/p\/?\?[^#]*[?&]l=([^&#]+)/i);
  if(m)return decodeURIComponent(m[1]);
  return '';
}

function portalAudienceFromUrl_(url){
  const s=String(url||'');
  const m=s.match(/[?&]audience=([^&#]+)/i);
  if(m)return decodeURIComponent(m[1]);
  const lid=portalLinkIdFromUrl_(s);
  if(/^R/i.test(lid))return 'private';
  if(/^S/i.test(lid))return 'system';
  return 'public';
}

function isPortalEprofile_(body,destination){
  return String((body||{}).document_id||'').toUpperCase()==='EPROFILE' && /sunbotvietnam\.github\.io\/portal\//i.test(String(destination||''));
}

function registerPortalAssetLinkServer_(body,destination,actor){
  if(!isPortalEprofile_(body,destination))return {required:false,registered:false};
  const lid=portalLinkIdFromUrl_(destination);
  if(!lid)throw new Error('PORTAL_LINK_ID_MISSING');
  const payload={
    link_id:lid,
    created_at:new Date().toISOString(),
    active:true,
    school_id:String(body.school_id||''),
    school:String(body.school_name||''),
    owner:String(actor||body.created_by||''),
    audience:portalAudienceFromUrl_(destination),
    asset_type:'profile',
    asset_version:'v2',
    campaign:SCHOOL_OS_PORTAL_REGISTRY.CAMPAIGN,
    primary_channel:'email',
    landing_path:'/portal/profile-v2/',
    short_label:'E-profile '+String(body.school_name||''),
    full_url:String(destination),
    qr_target_url:String(destination),
    attribution_mode:'LINK_ATTRIBUTED',
    status:'ACTIVE',
    notes:'Registered server-to-server by Sunbot School OS'
  };
  const requestBody=JSON.stringify({action:'publicAssetEvent',type:'link',payload:payload});
  let lastError='';
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const res=UrlFetchApp.fetch(SCHOOL_OS_PORTAL_REGISTRY.ENDPOINT,{
        method:'post',
        contentType:'text/plain;charset=utf-8',
        payload:requestBody,
        muteHttpExceptions:true,
        followRedirects:true
      });
      const code=res.getResponseCode();
      const text=res.getContentText()||'';
      if(code>=200&&code<300){
        let parsed={};try{parsed=JSON.parse(text);}catch(e){}
        if(parsed.ok===true||parsed.success===true)return {required:true,registered:true,link_id:lid,http_status:code};
        lastError='HTTP '+code+' response '+text.slice(0,300);
      }else lastError='HTTP '+code+' '+text.slice(0,300);
    }catch(err){lastError=String(err&&err.message||err);}
    if(attempt<3)Utilities.sleep(250*attempt);
  }
  throw new Error('PORTAL_REGISTRATION_FAILED: '+lastError);
}
