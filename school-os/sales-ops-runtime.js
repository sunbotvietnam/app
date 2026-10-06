/* Sunbot School OS - sales operating layer v1.0 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const st=()=>window.state||{schools:[],tasks:[],opps:[]};
const me=()=>window.SchoolOsBackend?.currentUser?.()||null;
const isManager=()=>['SUPER_ADMIN','ADMIN','LEADER'].includes(String(me()?.role||'').toUpperCase());
function isoToday(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function parseDate(v){
  const s=String(v||'').trim();let m;
  if((m=s.match(/^(\d{4})-(\d{2})-(\d{2})/)))return new Date(+m[1],+m[2]-1,+m[3]);
  if((m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)))return new Date(+m[3],+m[2]-1,+m[1]);
  if((m=s.match(/^(\d{1,2})\/(\d{1,2})$/))){let d=new Date(new Date().getFullYear(),+m[2]-1,+m[1]);return d;}
  const d=new Date(s);return isNaN(d)?null:d;
}
function dayKey(v){const d=parseDate(v);if(!d)return'';return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function funnelNum(v){const m=String(v||'').match(/^\s*([0-3])/);return m?+m[1]:0;}
function funnelLabel(v){
  const n=funnelNum(v);return n===3?'3 – Đang xúc tiến triển khai':n===2?'2 – Đã trao đổi':n===1?'1 – Đã tiếp cận':'0 – Data tiềm năng';
}
function contactFromFunnel(s,n){
  const special=['Không quan tâm hiện tại','Tạm hoãn','Đã đóng / sáp nhập'];
  if(special.includes(String(s.contact_status||'')))return s.contact_status;
  return n===3?'Đang theo dõi / chờ bước tiếp theo':n===2?'Đã trao đổi':n===1?'Đã tiếp cận / đang theo dõi':'Chưa liên hệ / chưa rõ';
}
function taskSchool(t){return st().schools.find(s=>s.id===t.school_id||s.name===t.school)||null;}
function dueState(v){const k=dayKey(v),today=isoToday();if(!k)return'none';return k<today?'overdue':k===today?'today':'future';}
function ensureInteractionFields(){
  const form=$('interactionForm')?.querySelector('.form');if(!form||$('ifunnel'))return;
  const action=$('ia')?.closest('.field');if(!action)return;
  const funnel=document.createElement('div');funnel.className='field';funnel.innerHTML='<label>Mức xúc tiến</label><select id="ifunnel"><option value="0 – Data tiềm năng">0 – Data tiềm năng</option><option value="1 – Đã tiếp cận">1 – Đã tiếp cận</option><option value="2 – Đã trao đổi">2 – Đã trao đổi</option><option value="3 – Đang xúc tiến triển khai">3 – Đang xúc tiến triển khai</option></select>';
  const follow=document.createElement('div');follow.className='field';follow.innerHTML='<label>Ngày cần làm lại</label><input id="ifollow" type="date">';
  action.classList.remove('full');action.after(follow);action.after(funnel);
  const h=$('interactionForm').querySelector('h2');if(h)h.textContent='Cập nhật sau trao đổi';
  const note=document.createElement('div');note.className='form-note';note.style.gridColumn='1/-1';note.textContent='Bắt buộc 4 thông tin: kết quả, mức xúc tiến, bước tiếp theo và ngày cần làm lại.';form.prepend(note);
}
function renderOpsToday(){
  const schools=st().schools,tasks=st().tasks.filter(t=>!t.done),opps=st().opps;
  const overdue=tasks.filter(t=>dueState(t.due)==='overdue'),today=tasks.filter(t=>dueState(t.due)==='today');
  const waiting=schools.filter(s=>/chưa phản hồi|chờ bước tiếp theo/i.test(String(s.contact_status||'')));
  const high=schools.filter(s=>funnelNum(s.funnel)>=2);
  const cards=$('today')?.querySelectorAll('.kpi');
  if(cards?.length>=4){
    const data=[['Việc quá hạn',overdue.length,'Cần xử lý trước'],['Đến hạn hôm nay',today.length,'Việc phải chốt trong ngày'],['Chờ phản hồi',waiting.length,'Cần nhắc lại đúng lúc'],['Mức 2–3',high.length,'Cơ hội đang phát triển']];
    cards.forEach((c,i)=>{const d=data[i];c.querySelector('label').textContent=d[0];c.querySelector('b').textContent=d[1];c.querySelector('small').textContent=d[2];});
  }
  const list=[];
  overdue.forEach(t=>{const s=taskSchool(t);if(s)list.push({p:0,s,title:t.title,detail:'Quá hạn · '+(t.due||'chưa đặt hạn')});});
  today.forEach(t=>{const s=taskSchool(t);if(s)list.push({p:1,s,title:t.title,detail:'Hôm nay · '+(t.owner||'')});});
  schools.filter(s=>s.risk==='Rủi ro').forEach(s=>list.push({p:2,s,title:s.action||'Cần xử lý rủi ro',detail:'Rủi ro · '+(s.owner||'')}));
  schools.filter(s=>/chưa phản hồi/i.test(String(s.contact_status||''))).forEach(s=>list.push({p:3,s,title:s.action||'Theo dõi phản hồi',detail:s.contact_status}));
  const seen=new Set(),top=list.sort((a,b)=>a.p-b.p).filter(x=>{const k=x.s.id+'|'+x.title;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,8);
  if($('nextBest'))$('nextBest').innerHTML=top.map(x=>'<div class="recommend" onclick="openSchool(\''+esc(x.s.id)+'\')"><b>'+esc(x.s.name)+'</b><p>'+esc(x.title)+' · '+esc(x.detail)+'</p></div>').join('')||'<div class="empty">Không có việc quá hạn hoặc việc cần xử lý ngay.</div>';
  const ranked=[...schools].sort((a,b)=>funnelNum(b.funnel)-funnelNum(a.funnel)||String(a.date||'9999').localeCompare(String(b.date||'9999'))).slice(0,7);
  if($('priority'))$('priority').innerHTML=ranked.map(s=>'<div class="item" onclick="openSchool(\''+esc(s.id)+'\')"><div class="dot '+(s.risk==='Rủi ro'?'risk':s.risk==='Cần chú ý'?'warn':'good')+'"></div><div class="grow"><b>'+esc(s.name)+'</b><small>'+esc(funnelLabel(s.funnel))+' · '+esc(s.action||'Chưa có bước tiếp theo')+'</small></div><span class="tag '+(funnelNum(s.funnel)>=2?'brand':'')+'">'+funnelNum(s.funnel)+'</span></div>').join('');
  renderManagerSummary();
}
function renderManagerSummary(){
  const today=$('today');if(!today)return;
  let box=$('opsManagerSummary');
  if(!isManager()){box?.remove();return;}
  if(!box){box=document.createElement('div');box.id='opsManagerSummary';box.className='card section';box.style.marginTop='17px';today.appendChild(box);}
  const schools=st().schools,tasks=st().tasks.filter(t=>!t.done);
  const fs=[0,1,2,3].map(n=>schools.filter(s=>funnelNum(s.funnel)===n).length);
  const owners=[...new Set(schools.map(s=>s.owner).filter(Boolean))];
  const ownerRows=owners.map(o=>{const ss=schools.filter(s=>s.owner===o),od=tasks.filter(t=>t.owner===o&&dueState(t.due)==='overdue').length,h=ss.filter(s=>funnelNum(s.funnel)>=2).length;return '<div class="item"><div class="grow"><b>'+esc(o)+'</b><small>'+ss.length+' trường · '+h+' ở mức 2–3</small></div><span class="tag '+(od?'risk':'good')+'">'+od+' quá hạn</span></div>';}).join('');
  box.innerHTML='<div class="sectionhead"><h3>Nhịp phát triển trường</h3><small>CEO / quản lý</small></div><div class="pipeline"><div class="stage"><b>M0 · Data</b><strong>'+fs[0]+'</strong></div><div class="stage"><b>M1 · Đã tiếp cận</b><strong>'+fs[1]+'</strong></div><div class="stage"><b>M2 · Đã trao đổi</b><strong>'+fs[2]+'</strong></div><div class="stage"><b>M3 · Xúc tiến</b><strong>'+fs[3]+'</strong></div></div><div style="margin-top:12px">'+ownerRows+'</div>';
}
function decorateSchoolDrawer(){
  const s=st().schools.find(x=>x.id===window.current),meta=$('dMeta');if(!s||!meta)return;
  meta.querySelector('[data-funnel-chip]')?.remove();
  const chip=document.createElement('span');chip.className='tag brand';chip.dataset.funnelChip='1';chip.textContent=funnelLabel(s.funnel);meta.appendChild(chip);
}
function patch(){
  ensureInteractionFields();
  const open0=window.openInteraction;
  if(open0)window.openInteraction=function(){
    const r=open0.apply(this,arguments),s=st().schools.find(x=>x.id===window.current);
    if(s){$('ifunnel').value=funnelLabel(s.funnel);$('ifollow').value=dayKey(s.date)||isoToday();}
    return r;
  };
  const save0=window.saveInteraction;
  if(save0)window.saveInteraction=async function(){
    const s=st().schools.find(x=>x.id===window.current);if(!s)return;
    const result=$('ir')?.value.trim(),action=$('ia')?.value.trim(),follow=$('ifollow')?.value,funnel=$('ifunnel')?.value;
    if(!result)return window.toast?.('Cần ghi kết quả trao đổi');
    if(!funnel)return window.toast?.('Cần chọn mức xúc tiến');
    if(!action)return window.toast?.('Cần ghi bước tiếp theo');
    if(!follow)return window.toast?.('Cần chọn ngày cần làm lại');
    s.funnel=funnel;s.contact_status=contactFromFunnel(s,funnelNum(funnel));s.date=follow;s.last_interaction_at=new Date().toISOString();
    const channel=$('ic')?.value||'Khác',actor=$('io')?.value||s.owner;
    const out=await save0.apply(this,arguments);
    try{if(window.SchoolOsBackend?.isAuthenticated?.())await SchoolOsBackend.logActivity({school_id:s.id,school_name:s.name,event_type:'SALES_INTERACTION',actor,channel,summary:result,detail:{funnel_stage:funnel,next_action:action,followup_date:follow,contact_status:s.contact_status},source_id:'',hot_signal:false});}catch(e){window.toast?.('Đã lưu hồ sơ; nhật ký trao đổi chưa đồng bộ.');}
    renderOpsToday();return out;
  };
  const refresh0=window.refresh;
  if(refresh0)window.refresh=function(){const r=refresh0.apply(this,arguments);renderOpsToday();return r;};
  const drawer0=window.renderDrawer;
  if(drawer0)window.renderDrawer=function(){const r=drawer0.apply(this,arguments);decorateSchoolDrawer();return r;};
}
function init(){patch();renderOpsToday();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.SchoolOsSalesOps={render:renderOpsToday,funnelNum};
})();