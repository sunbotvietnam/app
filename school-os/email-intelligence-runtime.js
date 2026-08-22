/* Sunbot - email draft + tracked E-profile workflow */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const B=()=>window.SchoolOsBackend;
function st(){return window.state||{schools:[]};}
function school(){
  const title=$('dTitle')?.textContent?.trim();
  return st().schools.find(s=>s.name===title)||null;
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function normActivity(a){
  const type=String(a.event_type||'');
  const detail=a.detail||{};
  const title=type==='LINK_OPENED'?'Nhà trường đã mở hồ sơ':type==='EMAIL_SENT'?'Đã gửi email':type==='LINK_CREATED'?'Đã tạo liên kết theo dõi':(a.summary||'Cập nhật');
  return {type:type.toLowerCase(),title,detail:a.summary||'',at:formatDate(a.timestamp),hot:String(a.hot_signal).toUpperCase()==='TRUE'||a.hot_signal===true,raw:a};
}
function formatDate(v){try{const d=new Date(v);return isNaN(d)?String(v||''):d.toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return String(v||'');}}
async function loadActivity(s,rerender){
  if(!s||!B()?.isAuthenticated?.())return [];
  try{
    const r=await B().getActivity(s.id,200), acts=(r.activities||[]);
    s._backendActivities=acts;
    s.events=acts.map(normActivity);
    if(rerender){window.renderDrawer?.();window.renderToday?.();}
    return acts;
  }catch(e){return s._backendActivities||[];}
}
function relationKey(s){
  const status=String(s.status||'').toLowerCase(), source=String(s.source||'').toLowerCase();
  if(status.includes('đang triển khai'))return 'active';
  if(status.includes('tái kích hoạt')||source.includes('quan hệ cũ'))return 'returning';
  if(status.includes('chờ phản hồi')||status.includes('tiếp cận'))return 'contacted';
  return 'new';
}
const TEMPLATES={
  active:{label:'Trao đổi năm học mới',subject:'Trao đổi kế hoạch Sunbot năm học 2026–2027',body:'Kính gửi Nhà trường,\n\nSunbot xin gửi Nhà trường hồ sơ cập nhật để thuận tiện trao đổi kế hoạch năm học 2026–2027. Chúng tôi mong muốn cùng Nhà trường rà soát tình hình triển khai, nhu cầu của năm học mới và các nội dung có thể tiếp tục cải thiện hoặc mở rộng.\n\nHồ sơ Sunbot dành cho Nhà trường:\n{{PROFILE_URL}}\n\nRất mong nhận được phản hồi của Nhà trường để chúng tôi sắp xếp buổi trao đổi phù hợp.\n\nTrân trọng,\nSunbot'},
  returning:{label:'Kết nối lại',subject:'Sunbot xin kết nối lại cùng Nhà trường',body:'Kính gửi Nhà trường,\n\nSunbot xin phép kết nối lại và gửi Nhà trường thông tin chương trình cập nhật cho năm học 2026–2027. Chúng tôi mong muốn tìm hiểu tình hình hiện tại của Nhà trường và xem xét khả năng hợp tác phù hợp trong giai đoạn mới.\n\nHồ sơ Sunbot:\n{{PROFILE_URL}}\n\nNếu thuận tiện, Sunbot mong được trao đổi ngắn với Nhà trường trong thời gian tới.\n\nTrân trọng,\nSunbot'},
  contacted:{label:'Trao đổi sau khi gửi hồ sơ',subject:'Trao đổi thêm về hồ sơ Sunbot',body:'Kính gửi Nhà trường,\n\nSunbot xin gửi lại đường dẫn hồ sơ để Nhà trường thuận tiện tham khảo và mong được trao đổi thêm về nhu cầu, điều kiện triển khai và bước tiếp theo phù hợp.\n\nHồ sơ Sunbot:\n{{PROFILE_URL}}\n\nRất mong nhận được phản hồi của Nhà trường.\n\nTrân trọng,\nSunbot'},
  new:{label:'Giới thiệu Sunbot',subject:'Giới thiệu chương trình Sunbot dành cho mầm non',body:'Kính gửi Nhà trường,\n\nSunbot xin gửi Nhà trường thông tin chương trình Lập trình tư duy và STEAM sáng tạo dành cho trẻ mầm non để Nhà trường tham khảo.\n\nHồ sơ giới thiệu Sunbot:\n{{PROFILE_URL}}\n\nNếu nội dung phù hợp với định hướng của Nhà trường, Sunbot rất mong có dịp trao đổi ngắn để tìm hiểu nhu cầu cụ thể.\n\nTrân trọng,\nSunbot'}
};
function fallbackProfile(s){
  return /tư thục/i.test(String(s.type||''))
    ?'https://sunbotvietnam.github.io/sunbot-ops/profile/tu-thuc.html'
    :'https://sunbotvietnam.github.io/sunbot-ops/profile/cong-lap.html';
}
function profileFromActivities(acts,s){
  for(const a of acts||[]){
    const d=a.detail||{};
    const candidates=[d.bang_chung_url,d.destination_url,d.url];
    for(const u of candidates){if(/^https?:\/\//i.test(String(u||''))&&(/\/portal\/p\//i.test(u)||/\/profile\//i.test(u)))return u;}
  }
  return fallbackProfile(s);
}
function ensureEmailUi(){
  const m=$('emailForm');if(!m)return;
  const h=m.querySelector('h2');if(h)h.textContent='Tạo email nháp';
  const submit=m.querySelector('.modalactions .primary');if(submit){submit.textContent='Mở email nháp';submit.onclick=createDraft;}
  const doc=$('emailDoc')?.closest('.field');if(doc)doc.style.display='none';
  let info=$('emailTrackingInfo');if(!info){
    info=document.createElement('div');info.id='emailTrackingInfo';info.className='muted';info.style.cssText='margin-top:10px;padding:10px 12px;background:#f7f8fa;border-radius:10px;line-height:1.5';
    info.textContent='Hệ thống sẽ gắn hồ sơ điện tử riêng cho trường và ghi nhận khi Nhà trường mở hồ sơ.';
    m.querySelector('.form')?.after(info);
  }
}
function contactForSelect(s){
  const select=$('emailContact');if(!select)return null;
  const email=select.value;
  return (s.contacts||[]).find(c=>c.email===email||c.name===email)||(s.contacts||[]).find(c=>c.email)||null;
}
function fillTemplate(s){
  const t=TEMPLATES[relationKey(s)]||TEMPLATES.new;
  if($('emailTpl')){
    $('emailTpl').innerHTML=Object.entries(TEMPLATES).map(([k,v])=>`<option value="${k}" ${k===relationKey(s)?'selected':''}>${esc(v.label)}</option>`).join('');
  }
  if($('emailSubject'))$('emailSubject').value=t.subject+' – '+s.name;
  if($('emailBody'))$('emailBody').value=t.body.replace('{{PROFILE_URL}}','[Hệ thống sẽ tự chèn hồ sơ theo dõi khi tạo nháp]');
}
function fillContacts(s){
  const sel=$('emailContact');if(!sel)return;
  const cs=(s.contacts||[]).filter(c=>c.email);
  sel.innerHTML=cs.length?cs.map(c=>`<option value="${esc(c.email)}">${esc((c.name||'Đầu mối')+' · '+c.email)}</option>`).join(''):'<option value="">Chưa có email</option>';
}
async function openEmail(){
  const s=school();if(!s)return window.toast?.('Không xác định được trường.');
  ensureEmailUi();fillContacts(s);fillTemplate(s);
  $('emailSchool').textContent=s.name;
  $('emailForm').classList.add('open');
  await loadActivity(s,false);
}
function applyTpl(){
  const s=school();if(!s)return;const key=$('emailTpl')?.value||relationKey(s),t=TEMPLATES[key]||TEMPLATES.new;
  $('emailSubject').value=t.subject+' – '+s.name;
  $('emailBody').value=t.body.replace('{{PROFILE_URL}}','[Hệ thống sẽ tự chèn hồ sơ theo dõi khi tạo nháp]');
}
async function createDraft(){
  const s=school();if(!s)return;
  const c=contactForSelect(s);if(!c?.email)return window.toast?.('Chưa có email người nhận.');
  const key=$('emailTpl')?.value||relationKey(s),t=TEMPLATES[key]||TEMPLATES.new;
  const btn=$('emailForm')?.querySelector('.modalactions .primary');if(btn){btn.disabled=true;btn.textContent='Đang tạo...';}
  try{
    const acts=await loadActivity(s,false),destination=profileFromActivities(acts,s);
    const tracked=await B().createTrackedLink({school_id:s.id,school_name:s.name,contact_id:c.id||'',contact_name:c.name||'',document_id:'EPROFILE',document_name:'Hồ sơ điện tử Sunbot',destination_url:destination});
    const subject=($('emailSubject')?.value||t.subject+' – '+s.name).trim();
    let body=($('emailBody')?.value||t.body).replace('[Hệ thống sẽ tự chèn hồ sơ theo dõi khi tạo nháp]',tracked.tracked_url).replace('{{PROFILE_URL}}',tracked.tracked_url);
    await B().logActivity({school_id:s.id,school_name:s.name,contact_id:c.id||'',contact_name:c.name||'',event_type:'EMAIL_DRAFT_CREATED',channel:'Email',summary:'Đã tạo email nháp: '+subject,detail:{to_email:c.email,template_key:key,track_id:tracked.track_id,profile_url:destination,tracked_url:tracked.tracked_url},source_id:tracked.track_id,hot_signal:false});
    const gmail='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(c.email)+'&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    window.open(gmail,'_blank','noopener');
    $('emailForm').classList.remove('open');
    await loadActivity(s,true);
    window.toast?.('Đã mở email nháp có hồ sơ theo dõi.');
  }catch(e){window.toast?.('Chưa tạo được email nháp: '+String(e?.message||e).replace(/^Error:\s*/,''));}
  finally{if(btn){btn.disabled=false;btn.textContent='Mở email nháp';}}
}
function interestText(s){
  const acts=s?._backendActivities||[];
  const opens=acts.filter(a=>a.event_type==='LINK_OPENED');
  if(!opens.length)return 'Chưa mở hồ sơ';
  if(opens.length>=3)return 'Quan tâm cao · đã mở '+opens.length+' lần';
  if(opens.length>=2)return 'Quan tâm · đã mở '+opens.length+' lần';
  return 'Đã mở hồ sơ';
}
function injectInterest(s){
  const body=$('dBody');if(!body||!s||!['overview','engagement'].includes(window.currentTab||''))return;
  if(body.querySelector('#schoolInterestBox'))return;
  const box=document.createElement('div');box.id='schoolInterestBox';box.className='recommend';box.style.marginBottom='12px';box.innerHTML='<b>Mức quan tâm qua hồ sơ điện tử</b><p>'+esc(interestText(s))+'</p>';
  body.prepend(box);
}
function patchDrawer(){
  const orig=window.renderDrawer;if(!orig)return;
  window.renderDrawer=function(){const r=orig.apply(this,arguments);const s=school();injectInterest(s);if(s&&window.currentTab==='engagement'&&!s._activityLoading){s._activityLoading=true;loadActivity(s,true).finally(()=>s._activityLoading=false);}return r;};
}
function patchOpenSchool(){
  const orig=window.openSchool;if(!orig)return;
  window.openSchool=function(){const r=orig.apply(this,arguments);const s=school();if(s)loadActivity(s,true);return r;};
}
function init(){ensureEmailUi();window.openEmail=openEmail;window.applyTpl=applyTpl;window.sendEmail=createDraft;patchDrawer();patchOpenSchool();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.SchoolOsEmailIntelligence={openEmail,createDraft,loadActivity,profileFromActivities,interestText};
})();
