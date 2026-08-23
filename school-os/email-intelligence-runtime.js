/* Sunbot School OS - context-aware email intelligence engine */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const B=()=>window.SchoolOsBackend;
const ARCHIVE_CC='sunbotvietnam@gmail.com';
const PROFILE_TOKEN='[Hệ thống sẽ tự chèn hồ sơ theo dõi khi mở email]';

function st(){return window.state||{schools:[]};}
function school(){const title=$('dTitle')?.textContent?.trim();return st().schools.find(s=>s.name===title)||null;}
function activeTab(){return document.querySelector('.tabs button.active')?.dataset?.tab||'overview';}
function txt(v){return String(v==null?'':v).trim();}
function low(v){return txt(v).toLowerCase();}
function has(v,re){return re.test(txt(v));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));}
function formatDate(v){try{const d=new Date(v);return isNaN(d)?String(v||''):d.toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return String(v||'');}}
function cleanContactName(c){const n=txt(c?.name);if(!n||/BGH|đầu mối|chưa xác định/i.test(n))return'';return n.replace(/^(cô|thầy|chị|anh)\s+/i,'').trim();}
function salutation(c){const n=cleanContactName(c);const role=low(c?.role||c?.decision_role);if(!n)return'Kính gửi Ban Giám hiệu Nhà trường,';if(/thầy|hiệu trưởng nam|phó hiệu trưởng nam/.test(role))return'Kính gửi Thầy '+n+',';return'Kính gửi Cô '+n+',';}

function normActivity(a){const type=txt(a.event_type),title=type==='LINK_OPENED'?'Nhà trường đã mở hồ sơ':type==='EMAIL_SENT'?'Đã gửi email':type==='LINK_CREATED'?'Đã tạo liên kết theo dõi':type==='EMAIL_DRAFT_CREATED'?'Đã mở email để gửi':type==='SCHOOL_REPLIED'?'Nhà trường đã phản hồi':type==='MEETING_SCHEDULED'?'Đã hẹn trao đổi':(a.summary||'Cập nhật');return{type:type.toLowerCase(),title,detail:a.summary||'',at:formatDate(a.timestamp),hot:String(a.hot_signal).toUpperCase()==='TRUE'||a.hot_signal===true,raw:a};}
async function loadActivity(s,rerender){if(!s||!B()?.isAuthenticated?.())return[];try{const r=await B().getActivity(s.id,200),acts=r.activities||[];s._backendActivities=acts;s.events=acts.map(normActivity);if(rerender){window.renderDrawer?.();window.renderToday?.();}return acts;}catch(e){return s._backendActivities||[];}}

function relationshipState(s){
  const status=low(s.status),source=low(s.source),steam=low(s.steam_status),acts=s._backendActivities||[];
  const hasReply=acts.some(a=>['SCHOOL_REPLIED','MEETING_SCHEDULED'].includes(txt(a.event_type)));
  const opens=acts.filter(a=>txt(a.event_type)==='LINK_OPENED').length;
  if(/đã chuyển đầu mối|theo dõi sau sáp nhập|cần kênh tiếp cận khác|theo dõi\s*–?\s*không ưu tiên|cần xác minh dữ liệu/.test(status))return'HOLD';
  if(/đang triển khai/.test(status)||/sunbot đang triển khai/.test(steam))return'ACTIVE';
  if(/tái kích hoạt|đã dừng|từng triển khai|quan hệ cũ/.test(status+' '+source+' '+steam))return'REACTIVATION';
  if(hasReply||/đã phản hồi|đã hẹn|có cơ hội|đang đề xuất|đã chốt/.test(status))return'ENGAGED';
  if(opens>0||/có tín hiệu quan tâm/.test(status))return'ENGAGED';
  if(/đang chờ phản hồi|đang tiếp cận|chờ phản hồi|tiếp cận/.test(status))return'CONTACTED';
  return'NEW';
}

function schoolModel(s){
  const type=low(s.school_type||s.type),steam=low(s.steam_status),source=low(s.source),status=low(s.status);
  const isPrivate=/tư thục|độc lập|hệ thống/.test(type);
  const isPublic=/công lập/.test(type)||!isPrivate;
  const hasSteamRoom=/phòng steam|phòng học thông minh|phòng tin học/.test(steam);
  const noSteamRoom=/chưa có phòng steam|không có phòng steam/.test(steam);
  const selfRun=/tự triển khai|tự tổ chức|lồng ghép|gv tự triển khai|giáo viên tự/.test(steam);
  const competitor=/kidsedu|kidsonline|gigo|nextgen|steame|bts|steam kids|m-tiny|montessori|unis/.test(steam);
  const pilot=/thí điểm|gdmn mới|chương trình mới/.test(steam+' '+source+' '+status);
  const multiSite=/đa cơ sở|hệ thống/.test(type);
  return{isPrivate,isPublic,hasSteamRoom,noSteamRoom,selfRun,competitor,pilot,multiSite,steamRaw:txt(s.steam_status),typeRaw:txt(s.school_type||s.type)};
}

function fitAngle(s){
  const m=schoolModel(s),bits=[];
  if(m.hasSteamRoom)bits.push('khai thác tốt hơn cơ sở vật chất Nhà trường đã có, tập trung vào chương trình, Robotics, học liệu, đào tạo và kiểm soát chất lượng thay vì phải đầu tư thêm một không gian mới');
  else if(m.noSteamRoom)bits.push('có thể bắt đầu ở quy mô gọn trong lớp học hoặc không gian hiện có, không đặt điều kiện phải đầu tư phòng STEAM riêng ngay từ đầu');
  if(m.selfRun)bits.push('bổ sung trục Robotics, lộ trình theo độ tuổi, học liệu và công cụ vận hành cho phần STEAM Nhà trường đang chủ động tổ chức');
  if(m.competitor)bits.push('được xem như một phương án bổ sung hoặc cấu hình khác cho giai đoạn tiếp theo, không mặc định thay thế chương trình Nhà trường đang sử dụng');
  if(m.pilot)bits.push('có thể cấu hình theo hướng linh hoạt, có chương trình, dữ liệu, báo cáo và cơ chế kiểm soát chất lượng phù hợp với yêu cầu đổi mới của Nhà trường');
  if(m.multiSite)bits.push('có thể chuẩn hóa chương trình và chất lượng giữa nhiều cơ sở nhưng vẫn linh hoạt theo quy mô từng điểm trường');
  if(!bits.length&&m.isPublic)bits.push('có thể lựa chọn quy mô, cách bố trí giáo viên và mức đầu tư phù hợp với điều kiện thực tế của trường, thay vì áp một mô hình duy nhất');
  if(!bits.length&&m.isPrivate)bits.push('có thể cấu hình thành một trải nghiệm công nghệ có bản sắc riêng cho trường, đồng thời kiểm soát được chương trình, giáo viên, học liệu và chất lượng triển khai');
  return bits.slice(0,2);
}

function holdReason(s){const status=low(s.status);if(/cần kênh tiếp cận khác/.test(status))return'Dữ liệu hiện tại cho thấy email không phải kênh ưu tiên. Nên gọi điện hoặc tìm đầu mối địa phương trước.';if(/theo dõi sau sáp nhập/.test(status))return'Trường đang ở trạng thái theo dõi sau sáp nhập. Không nên gửi lặp cho pháp nhân cũ.';if(/đã chuyển đầu mối/.test(status))return'Đầu mối đã chuyển sang đơn vị/trường khác. Cần tiếp cận đúng pháp nhân mới.';if(/không ưu tiên/.test(status))return'Trường đang ở nhóm theo dõi, chưa ưu tiên chào bán ở thời điểm này.';if(/cần xác minh dữ liệu/.test(status))return'Cần xác minh đầu mối và điều kiện trường trước khi gửi email.';return'Chưa khuyến nghị gửi email ở trạng thái hiện tại.';}

function subjectFor(ctx,s){const name=txt(s.name||s.school_name);switch(ctx.relationship){case'ACTIVE':return'Trao đổi kế hoạch Sunbot năm học 2026–2027 – '+name;case'REACTIVATION':return'Cập nhật Sunbot và trao đổi kế hoạch năm học mới – '+name;case'ENGAGED':return'Trao đổi bước tiếp theo về Sunbot – '+name;case'CONTACTED':return'Trao đổi thêm về hồ sơ Sunbot – '+name;default:return'Giới thiệu giải pháp Sunbot dành cho mầm non – '+name;}}

function bodyFor(ctx,s,c){
  const hello=salutation(c),fit=ctx.fit,fitText=fit.length?' Với điều kiện hiện tại của Nhà trường, Sunbot có thể '+fit.join('; ')+'.':'';
  if(ctx.relationship==='ACTIVE')return `${hello}\n\nTrước khi bước vào kế hoạch năm học 2026–2027, bên em muốn cùng Cô rà soát lại việc triển khai Sunbot tại trường trong thời gian vừa qua: phần nào đang vận hành tốt, nội dung nào cần điều chỉnh và nhu cầu của Nhà trường trong năm học mới.\n\nSunbot hiện đã cập nhật thêm cách tổ chức chương trình, học liệu, báo cáo học tập và các phương án vận hành để có thể linh hoạt hơn theo điều kiện từng trường.${fitText}\n\nEm gửi Cô hồ sơ cập nhật để Cô tiện xem trước:\n{{PROFILE_URL}}\n\nKhi Cô thuận tiện, bên em mong được bố trí một buổi trao đổi ngắn để thống nhất kế hoạch phù hợp cho năm học tới.\n\nTrân trọng,\nSunbot Việt Nam`;
  if(ctx.relationship==='REACTIVATION')return `${hello}\n\nVì Nhà trường đã từng có thời gian triển khai/trao đổi với Sunbot, bên em xin phép gửi Cô phiên bản hiện tại để Cô có thể nhìn thấy những thay đổi so với giai đoạn trước. Trong thời gian vừa qua, Sunbot đã hoàn thiện lại chương trình, cách tổ chức giáo viên, học liệu, báo cáo học tập và cơ chế phối hợp với Nhà trường.\n\nỞ lần trao đổi này, bên em trước hết muốn nghe lại điều kiện và nhu cầu hiện tại của trường, thay vì mặc định đề nghị Nhà trường triển khai lại theo mô hình cũ.${fitText}\n\nHồ sơ Sunbot cập nhật:\n{{PROFILE_URL}}\n\nNếu Cô thấy có điểm phù hợp với kế hoạch năm học mới, bên em mong được trao đổi ngắn để cùng xây một phương án phù hợp với tình hình hiện tại của Nhà trường.\n\nTrân trọng,\nSunbot Việt Nam`;
  if(ctx.relationship==='ENGAGED')return `${hello}\n\nCảm ơn Cô đã dành thời gian xem/trao đổi về hồ sơ Sunbot. Ở bước này, bên em không muốn gửi thêm thông tin chung mà muốn hiểu rõ hơn nhu cầu, nguồn lực và cách Nhà trường đang tổ chức STEAM/công nghệ để xác định phương án nào thực sự phù hợp.${fitText}\n\nEm gửi lại hồ sơ để Cô tiện tham khảo khi cần:\n{{PROFILE_URL}}\n\nNếu thuận tiện, Cô cho bên em xin một khoảng thời gian ngắn để trao đổi về quy mô, cách tổ chức giáo viên, cơ sở vật chất hiện có và mục tiêu của Nhà trường trong năm học 2026–2027.\n\nTrân trọng,\nSunbot Việt Nam`;
  if(ctx.relationship==='CONTACTED')return `${hello}\n\nEm xin phép gửi lại Cô hồ sơ Sunbot để Cô tiện mở khi có thời gian. Bên em hiểu mỗi trường đang có điều kiện tổ chức STEAM và công nghệ rất khác nhau, vì vậy Sunbot không muốn áp một cấu hình chung cho tất cả các trường.${fitText}\n\nHồ sơ Sunbot:\n{{PROFILE_URL}}\n\nKhi Cô xem được hồ sơ, bên em mong được trao đổi thêm về nhu cầu và điều kiện cụ thể của Nhà trường để xác định bước tiếp theo phù hợp, nếu có.\n\nTrân trọng,\nSunbot Việt Nam`;
  return `${hello}\n\nEm xin phép gửi Cô thông tin về Sunbot – giải pháp Lập trình tư duy, Robotics và STEAM sáng tạo dành cho trẻ mầm non. Điểm Sunbot tập trung không chỉ là thiết bị hay một số tiết học riêng lẻ, mà là một hệ thống gồm chương trình theo độ tuổi, robot và học liệu, phương án giáo viên/đào tạo, vận hành, quan sát – đánh giá và báo cáo học tập.\n\nĐiều bên em muốn trao đổi với Nhà trường là cách cấu hình giải pháp theo đúng điều kiện hiện có, thay vì đề nghị trường đầu tư theo một mô hình cố định.${fitText}\n\nCô có thể xem hồ sơ giới thiệu Sunbot tại đây:\n{{PROFILE_URL}}\n\nNếu nội dung phù hợp với định hướng của Nhà trường, bên em rất mong có dịp trao đổi ngắn để tìm hiểu nhu cầu cụ thể trước khi đề xuất bất kỳ phương án triển khai nào.\n\nTrân trọng,\nSunbot Việt Nam`;
}

function buildContext(s){const relationship=relationshipState(s),model=schoolModel(s),fit=fitAngle(s);return{relationship,model,fit,hold:relationship==='HOLD',holdReason:relationship==='HOLD'?holdReason(s):'',label:{NEW:'Trường mới',CONTACTED:'Đã tiếp cận',ENGAGED:'Đã có tín hiệu/trao đổi',ACTIVE:'Đang triển khai',REACTIVATION:'Tái kích hoạt',HOLD:'Chưa nên email'}[relationship]||relationship};}
function compose(s,c){const ctx=buildContext(s);return{ctx,subject:subjectFor(ctx,s),body:bodyFor(ctx,s,c)};}

function fallbackProfile(s){return /tư thục/i.test(txt(s.school_type||s.type))?'https://sunbotvietnam.github.io/sunbot-ops/profile/tu-thuc.html':'https://sunbotvietnam.github.io/sunbot-ops/profile/cong-lap.html';}
function profileFromActivities(acts,s){for(const a of acts||[]){const d=a.detail||a.raw?.detail||{};for(const u of[d.bang_chung_url,d.destination_url,d.profile_url,d.url]){if(/^https?:\/\//i.test(String(u||''))&&(/\/portal\/p\//i.test(u)||/\/profile\//i.test(u)))return u;}}return fallbackProfile(s);}
function cachedProfile(s){return profileFromActivities(s?._backendActivities||[],s);}

function ensureEmailUi(){const m=$('emailForm');if(!m)return;const h=m.querySelector('h2');if(h)h.textContent='Soạn email theo bối cảnh trường';const submit=m.querySelector('.modalactions .primary');if(submit){submit.textContent='Mở email để gửi';submit.onclick=createDraft;}const doc=$('emailDoc')?.closest('.field');if(doc)doc.style.display='none';const tpl=$('emailTpl')?.closest('.field');if(tpl)tpl.style.display='none';let info=$('emailTrackingInfo');if(!info){info=document.createElement('div');info.id='emailTrackingInfo';info.className='muted';info.style.cssText='margin-top:10px;padding:10px 12px;background:#f7f8fa;border-radius:10px;line-height:1.5';m.querySelector('.form')?.after(info);}let ctxBox=$('emailContextInfo');if(!ctxBox){ctxBox=document.createElement('div');ctxBox.id='emailContextInfo';ctxBox.style.cssText='margin-top:10px;padding:11px 12px;border:1px solid #e5e8ed;border-radius:10px;background:#fff';info.after(ctxBox);} }
function contactForSelect(s){const select=$('emailContact');if(!select)return null;const email=select.value;return(s.contacts||[]).find(c=>c.email===email||c.name===email)||(s.contacts||[]).find(c=>c.email)||null;}
function fillContacts(s){const sel=$('emailContact');if(!sel)return;const cs=(s.contacts||[]).filter(c=>c.email);sel.innerHTML=cs.length?cs.map(c=>`<option value="${esc(c.email)}">${esc((c.name||'Đầu mối')+' · '+c.email)}</option>`).join(''):'<option value="">Chưa có email</option>';sel.onchange=()=>renderCompose(s);}
function renderContext(ctx,s){const box=$('emailContextInfo'),info=$('emailTrackingInfo'),btn=$('emailForm')?.querySelector('.modalactions .primary');if(info)info.innerHTML='Hồ sơ điện tử riêng của trường sẽ được chèn trực tiếp vào email. <b>CC mặc định: '+esc(ARCHIVE_CC)+'</b>. Khi bấm mở email, School OS sẽ ghi nhận hành động.';if(!box)return;if(ctx.hold){box.innerHTML='<b style="color:#b83b3b">Không khuyến nghị gửi email lúc này</b><div class="muted" style="margin-top:5px">'+esc(ctx.holdReason)+'</div>';if(btn){btn.disabled=true;btn.title=ctx.holdReason;}return;}if(btn){btn.disabled=false;btn.title='';}const fit=ctx.fit.length?'<div style="margin-top:5px"><b>Góc giải pháp:</b> '+esc(ctx.fit.join(' · '))+'</div>':'';box.innerHTML='<b>Bối cảnh tự nhận diện: '+esc(ctx.label)+'</b><div class="muted" style="margin-top:5px">'+esc(txt(s.school_type||s.type)||'Chưa khóa loại hình')+(txt(s.steam_status)?' · '+esc(txt(s.steam_status)):'')+'</div>'+fit;}
function renderCompose(s){const c=contactForSelect(s),draft=compose(s,c);if($('emailSubject'))$('emailSubject').value=draft.subject;if($('emailBody'))$('emailBody').value=draft.body.replace('{{PROFILE_URL}}',PROFILE_TOKEN);renderContext(draft.ctx,s);return draft;}
function openEmail(){const s=school();if(!s)return window.toast?.('Không xác định được trường.');ensureEmailUi();fillContacts(s);if($('emailSchool'))$('emailSchool').textContent=s.name;renderCompose(s);$('emailForm').classList.add('open');loadActivity(s,false).then(()=>renderCompose(s)).catch(()=>{});}
function applyTpl(){const s=school();if(s)renderCompose(s);}

function optimisticActivity(s,c,subject,ctx){const a={event_type:'EMAIL_DRAFT_CREATED',timestamp:new Date().toISOString(),summary:'Đã mở email để gửi: '+subject,hot_signal:false,detail:{to_email:c.email,cc_email:ARCHIVE_CC,relationship_state:ctx.relationship}};s._backendActivities=[a].concat(s._backendActivities||[]);s.events=[normActivity(a)].concat(s.events||[]);window.renderDrawer?.();window.renderToday?.();}
async function createDraft(){const s=school();if(!s)return;const c=contactForSelect(s);if(!c?.email)return window.toast?.('Chưa có email người nhận.');const draft=compose(s,c);if(draft.ctx.hold)return window.toast?.(draft.ctx.holdReason);const btn=$('emailForm')?.querySelector('.modalactions .primary');if(btn){btn.disabled=true;btn.textContent='Đang chuẩn bị...';}const subject=($('emailSubject')?.value||draft.subject).trim();try{const destination=cachedProfile(s);const tracked=await B().createTrackedLink({school_id:s.id,school_name:s.name,contact_id:c.id||'',contact_name:c.name||'',document_id:'EPROFILE',document_name:'Hồ sơ điện tử Sunbot',destination_url:destination});let body=($('emailBody')?.value||draft.body).replace(PROFILE_TOKEN,tracked.tracked_url).replace('{{PROFILE_URL}}',tracked.tracked_url);optimisticActivity(s,c,subject,draft.ctx);const logPromise=B().logActivity({school_id:s.id,school_name:s.name,contact_id:c.id||'',contact_name:c.name||'',event_type:'EMAIL_DRAFT_CREATED',channel:'Email',summary:'Đã mở email để gửi cho '+(cleanContactName(c)||c.email)+': '+subject,detail:{to_email:c.email,cc_email:ARCHIVE_CC,contact_name:c.name||'',relationship_state:draft.ctx.relationship,solution_fit:draft.ctx.fit,school_type:s.school_type||s.type||'',steam_status:s.steam_status||'',track_id:tracked.track_id,public_code:tracked.public_code||'',profile_url:destination,tracked_url:tracked.tracked_url},source_id:tracked.track_id,hot_signal:false});const gmail='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(c.email)+'&cc='+encodeURIComponent(ARCHIVE_CC)+'&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);window.open(gmail,'_blank','noopener');$('emailForm').classList.remove('open');window.toast?.('Đã mở email theo đúng bối cảnh trường, gắn hồ sơ và CC Sunbot.');await logPromise;loadActivity(s,true).catch(()=>{});}catch(e){window.toast?.('Chưa tạo được email: '+String(e?.message||e).replace(/^Error:\s*/,''));}finally{if(btn){btn.disabled=false;btn.textContent='Mở email để gửi';}}}

function interestText(s){const acts=s?._backendActivities||[],opens=acts.filter(a=>a.event_type==='LINK_OPENED');if(!opens.length)return'Chưa mở hồ sơ';if(opens.length>=3)return'Quan tâm cao · đã mở '+opens.length+' lần';if(opens.length>=2)return'Quan tâm · đã mở '+opens.length+' lần';return'Đã mở hồ sơ';}
function injectInterest(s){const body=$('dBody'),tab=activeTab();if(!body||!s||!['overview','engagement'].includes(tab))return;if(body.querySelector('#schoolInterestBox'))return;const box=document.createElement('div');box.id='schoolInterestBox';box.className='recommend';box.style.marginBottom='12px';box.innerHTML='<b>Mức quan tâm qua hồ sơ điện tử</b><p>'+esc(interestText(s))+'</p>';body.prepend(box);}
function patchDrawer(){const orig=window.renderDrawer;if(!orig)return;window.renderDrawer=function(){const r=orig.apply(this,arguments),s=school(),tab=activeTab();injectInterest(s);if(s&&tab==='engagement'&&!s._activityLoading){s._activityLoading=true;loadActivity(s,true).finally(()=>s._activityLoading=false);}return r;};}
function patchOpenSchool(){const orig=window.openSchool;if(!orig)return;window.openSchool=function(){const r=orig.apply(this,arguments),s=school();if(s)loadActivity(s,false).catch(()=>{});return r;};}
function init(){ensureEmailUi();window.openEmail=openEmail;window.applyTpl=applyTpl;window.sendEmail=createDraft;patchDrawer();patchOpenSchool();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.SchoolOsEmailIntelligence={openEmail,createDraft,loadActivity,profileFromActivities,interestText,buildContext,compose};
})();
