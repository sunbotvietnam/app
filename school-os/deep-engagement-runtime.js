/* Sunbot - deep E-profile engagement without backend redeploy */
(function(){
'use strict';
const $=id=>document.getElementById(id), B=()=>window.SchoolOsBackend;
const VIEWER='https://sunbotvietnam.github.io/app/school-os/profile-viewer.html';
const BEACON='https://sunbotvietnam.github.io/app/school-os/beacon.html';
function school(){const n=$('dTitle')?.textContent?.trim();return (window.state?.schools||[]).find(s=>s.name===n)||null;}
function contact(s){const v=$('emailContact')?.value||'';return (s?.contacts||[]).find(c=>c.email===v||c.name===v)||(s?.contacts||[]).find(c=>c.email)||null;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
async function makeBeacon(s,c,id,name){return B().createTrackedLink({school_id:s.id,school_name:s.name,contact_id:c?.id||'',contact_name:c?.name||'',document_id:id,document_name:name,destination_url:BEACON});}
async function createDeepDraft(){
  const s=school(),c=contact(s);if(!s)return window.toast?.('Không xác định được trường.');if(!c?.email)return window.toast?.('Chưa có email người nhận.');
  const btn=$('emailForm')?.querySelector('.modalactions .primary');if(btn){btn.disabled=true;btn.textContent='Đang tạo hồ sơ theo dõi...';}
  try{
    const acts=await window.SchoolOsEmailIntelligence.loadActivity(s,false);
    const target=window.SchoolOsEmailIntelligence.profileFromActivities(acts,s);
    const labels=[
      ['ENG_D30','Hành vi: xem hồ sơ ít nhất 30 giây','d30'],
      ['ENG_S50','Hành vi: xem ít nhất 50% hồ sơ','s50'],
      ['ENG_S90','Hành vi: xem gần hết hồ sơ','s90'],
      ['ENG_PROGRAM','Hành vi: xem phần Chương trình','program'],
      ['ENG_MODEL','Hành vi: xem phần Mô hình hợp tác','model'],
      ['ENG_CTA','Hành vi: bấm nút hoặc liên kết trong hồ sơ','cta']
    ];
    const rs=[];for(const x of labels)rs.push(await makeBeacon(s,c,x[0],x[1]));
    const qp=new URLSearchParams({target});labels.forEach((x,i)=>qp.set(x[2],rs[i].tracked_url));
    const wrapper=VIEWER+'?'+qp.toString();
    const main=await B().createTrackedLink({school_id:s.id,school_name:s.name,contact_id:c.id||'',contact_name:c.name||'',document_id:'EPROFILE',document_name:'Hồ sơ điện tử Sunbot',destination_url:wrapper});
    const subject=($('emailSubject')?.value||('Thông tin Sunbot – '+s.name)).trim();
    let body=$('emailBody')?.value||'';
    body=body.replace('[Hệ thống sẽ tự chèn hồ sơ theo dõi khi tạo nháp]',main.tracked_url).replace('{{PROFILE_URL}}',main.tracked_url);
    if(!body.includes(main.tracked_url))body+='\n\nHồ sơ Sunbot:\n'+main.tracked_url;
    await B().logActivity({school_id:s.id,school_name:s.name,contact_id:c.id||'',contact_name:c.name||'',event_type:'EMAIL_DRAFT_CREATED',channel:'Email',summary:'Đã tạo email nháp có theo dõi mức độ xem hồ sơ',detail:{to_email:c.email,track_id:main.track_id,profile_url:target,tracked_url:main.tracked_url,deep_tracking:true},source_id:main.track_id,hot_signal:false});
    const gmail='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(c.email)+'&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    window.open(gmail,'_blank','noopener');$('emailForm')?.classList.remove('open');
    await window.SchoolOsEmailIntelligence.loadActivity(s,true);window.toast?.('Đã mở email nháp có theo dõi chi tiết.');
  }catch(e){window.toast?.('Chưa tạo được email nháp: '+String(e?.message||e).replace(/^Error:\s*/,''));}
  finally{if(btn){btn.disabled=false;btn.textContent='Mở email nháp';}}
}
function allActs(s){return s?._backendActivities||[];}
function summaries(s){return allActs(s).filter(x=>x.event_type==='LINK_OPENED').map(x=>String(x.summary||'').toLowerCase());}
function isLegacyOpen(a){const t=String(a.event_type||'').toLowerCase(),q=String(a.summary||'').toLowerCase();return t==='mở hồ sơ điện tử'||t==='eprofile_open'||q==='hồ sơ điện tử sunbot đã được mở.'||q.includes('đã mở hồ sơ điện tử');}
function ageDays(ts){const d=new Date(ts);if(!ts||isNaN(d))return 9999;return Math.max(0,(Date.now()-d.getTime())/86400000);}
function legacyScore(s){const opens=allActs(s).filter(isLegacyOpen);if(!opens.length)return 0;let n=0;opens.forEach(a=>{const d=ageDays(a.timestamp);n+=d<=7?12:d<=30?8:d<=90?4:2;});return Math.min(n,20);}
function score(s){const a=summaries(s);let n=legacyScore(s),opens=a.filter(x=>x.includes('hồ sơ điện tử sunbot')).length;n+=Math.min(opens,3)*10;if(a.some(x=>x.includes('30 giây')))n+=15;if(a.some(x=>x.includes('50%')))n+=10;if(a.some(x=>x.includes('gần hết')))n+=15;if(a.some(x=>x.includes('chương trình')))n+=15;if(a.some(x=>x.includes('mô hình hợp tác')))n+=20;if(a.some(x=>x.includes('bấm nút')))n+=25;return Math.min(n,100);}
function label(n){return n>=70?'Quan tâm cao':n>=40?'Quan tâm':n>=10?'Đã xem hồ sơ':'Chưa mở hồ sơ';}
function normalizeDeepEvents(s){
  (s?.events||[]).forEach(e=>{const q=String(e.raw?.summary||e.detail||'').toLowerCase();if(!q.includes('hành vi:'))return;
    if(q.includes('30 giây'))e.title='Đã xem hồ sơ ít nhất 30 giây';else if(q.includes('50%'))e.title='Đã xem ít nhất nửa hồ sơ';else if(q.includes('gần hết'))e.title='Đã xem gần hết hồ sơ';else if(q.includes('chương trình'))e.title='Đã xem phần Chương trình';else if(q.includes('mô hình hợp tác'))e.title='Đã xem phần Mô hình hợp tác';else if(q.includes('bấm nút'))e.title='Đã bấm nút hoặc liên kết trong hồ sơ';e.detail='';e.hot=q.includes('bấm nút')||q.includes('mô hình hợp tác')||q.includes('chương trình');
  });
}
function inject(){const s=school(),body=$('dBody');if(!s||!body)return;const old=body.querySelector('#schoolInterestBox');if(old)old.remove();const n=score(s),box=document.createElement('div');box.id='schoolInterestBox';box.className='recommend';box.style.marginBottom='12px';const newOpens=summaries(s).filter(x=>x.includes('hồ sơ điện tử sunbot')).length,oldOpens=allActs(s).filter(isLegacyOpen).length;const parts=[];if(oldOpens)parts.push('lịch sử cũ '+oldOpens+' lần');if(newOpens)parts.push('mở mới '+newOpens+' lần');box.innerHTML='<b>Mức quan tâm qua hồ sơ điện tử</b><p><strong>'+esc(label(n))+(n?' · '+n+'/100':'')+'</strong>'+(parts.length?' · '+esc(parts.join(' · ')):'')+'</p>';body.prepend(box);}
function patchHotSignals(){
  window.hotSignals=function(){const out=[];(window.state?.schools||[]).forEach(s=>{normalizeDeepEvents(s);const ev=(s.events||[]).filter(e=>{if(!e.hot)return false;const ts=e.raw?.timestamp||'';return ageDays(ts)<=3;});if(!ev.length)return;const rank=e=>{const q=String(e.raw?.summary||e.detail||'').toLowerCase();return q.includes('bấm nút')?5:q.includes('mô hình hợp tác')?4:q.includes('chương trình')?3:q.includes('hồ sơ điện tử sunbot')?2:1;};ev.sort((a,b)=>rank(b)-rank(a));out.push({school:s,event:ev[0]});});return out;};
}
function patch(){
  const form=$('emailForm'),btn=form?.querySelector('.modalactions .primary');if(btn){btn.onclick=createDeepDraft;btn.textContent='Mở email nháp';}
  window.sendEmail=createDeepDraft;patchHotSignals();
  const r=window.renderDrawer;if(r)window.renderDrawer=function(){const s=school();normalizeDeepEvents(s);const out=r.apply(this,arguments);inject();return out;};
  const info=$('emailTrackingInfo');if(info)info.textContent='Hệ thống gắn hồ sơ riêng và ghi nhận: mở hồ sơ, thời gian xem, mức cuộn, phần nội dung quan tâm và nút được bấm.';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch);else patch();
window.SchoolOsDeepEngagement={createDeepDraft,score,legacyScore};
})();
