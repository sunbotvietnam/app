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
    const rs=await Promise.all(labels.map(x=>makeBeacon(s,c,x[0],x[1])));
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
function score(s){
  const a=s?._backendActivities||[], summaries=a.filter(x=>x.event_type==='LINK_OPENED').map(x=>String(x.summary||'').toLowerCase());
  let n=0, opens=summaries.filter(x=>x.includes('hồ sơ điện tử sunbot')).length;n+=Math.min(opens,3)*10;
  if(summaries.some(x=>x.includes('30 giây')))n+=15;
  if(summaries.some(x=>x.includes('50%')))n+=10;
  if(summaries.some(x=>x.includes('gần hết')))n+=15;
  if(summaries.some(x=>x.includes('chương trình')))n+=15;
  if(summaries.some(x=>x.includes('mô hình hợp tác')))n+=20;
  if(summaries.some(x=>x.includes('bấm nút')))n+=25;
  return Math.min(n,100);
}
function label(n){return n>=70?'Quan tâm cao':n>=40?'Quan tâm':n>=10?'Đã xem hồ sơ':'Chưa mở hồ sơ';}
function inject(){
  const s=school(),body=$('dBody');if(!s||!body)return;const old=body.querySelector('#schoolInterestBox');if(old)old.remove();
  const n=score(s), box=document.createElement('div');box.id='schoolInterestBox';box.className='recommend';box.style.marginBottom='12px';
  const opens=(s._backendActivities||[]).filter(a=>a.event_type==='LINK_OPENED'&&String(a.summary||'').toLowerCase().includes('hồ sơ điện tử sunbot')).length;
  box.innerHTML='<b>Mức quan tâm qua hồ sơ điện tử</b><p><strong>'+esc(label(n))+(n?' · '+n+'/100':'')+'</strong>'+(opens?' · mở hồ sơ '+opens+' lần':'')+'</p>';
  body.prepend(box);
}
function patch(){
  const form=$('emailForm'),btn=form?.querySelector('.modalactions .primary');if(btn){btn.onclick=createDeepDraft;btn.textContent='Mở email nháp';}
  window.sendEmail=createDeepDraft;
  const r=window.renderDrawer;if(r)window.renderDrawer=function(){const out=r.apply(this,arguments);inject();return out;};
  const info=$('emailTrackingInfo');if(info)info.textContent='Hệ thống gắn hồ sơ riêng và ghi nhận: mở hồ sơ, thời gian xem, mức cuộn, phần nội dung quan tâm và nút được bấm.';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch);else patch();
window.SchoolOsDeepEngagement={createDeepDraft,score};
})();
