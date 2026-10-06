/* Sunbot School OS - simple sales operating layer v1.1 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const st=()=>window.state||{schools:[],tasks:[],opps:[]};
const me=()=>window.SchoolOsBackend?.currentUser?.()||null;
const isManager=()=>['SUPER_ADMIN','ADMIN','LEADER'].includes(String(me()?.role||'').toUpperCase());

function isoToday(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function parseDate(v){
  const x=String(v||'').trim();let m;
  if((m=x.match(/^(\d{4})-(\d{2})-(\d{2})/)))return new Date(+m[1],+m[2]-1,+m[3]);
  if((m=x.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)))return new Date(+m[3],+m[2]-1,+m[1]);
  if((m=x.match(/^(\d{1,2})\/(\d{1,2})$/)))return new Date(new Date().getFullYear(),+m[2]-1,+m[1]);
  const d=new Date(x);return isNaN(d)?null:d;
}
function dayKey(v){const d=parseDate(v);if(!d)return'';return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function dueState(v){const k=dayKey(v),today=isoToday();if(!k)return'none';return k<today?'overdue':k===today?'today':'future';}
function taskSchool(t){return st().schools.find(s=>s.id===t.school_id||s.name===t.school)||null;}

function ensureInteractionFields(){
  const form=$('interactionForm')?.querySelector('.form');if(!form||$('ifollow'))return;
  const action=$('ia')?.closest('.field');if(!action)return;
  action.classList.remove('full');
  const follow=document.createElement('div');
  follow.className='field';
  follow.innerHTML='<label>Ngày cần làm lại</label><input id="ifollow" type="date">';
  action.after(follow);
  const h=$('interactionForm')?.querySelector('h2');if(h)h.textContent='Cập nhật sau trao đổi';
  const note=document.createElement('div');
  note.className='form-note';note.style.gridColumn='1/-1';
  note.textContent='Chỉ cần ghi 3 thứ: kết quả – bước tiếp theo – ngày cần làm lại.';
  form.prepend(note);
}

function renderTodaySimple(){
  const schools=st().schools||[],tasks=(st().tasks||[]).filter(t=>!t.done),opps=st().opps||[];
  const overdue=tasks.filter(t=>dueState(t.due)==='overdue');
  const today=tasks.filter(t=>dueState(t.due)==='today');
  const risky=schools.filter(s=>String(s.risk||'')==='Rủi ro');
  const follow=schools.filter(s=>s.date&&['overdue','today'].includes(dueState(s.date)));

  const cards=$('today')?.querySelectorAll('.kpi');
  if(cards?.length>=4){
    const data=[
      ['Trường đang theo dõi',schools.length,'Theo quyền tài khoản'],
      ['Việc đang mở',tasks.length,overdue.length+' việc quá hạn'],
      ['Cần xử lý hôm nay',today.length+overdue.length,'Hôm nay + quá hạn'],
      ['Cơ hội',opps.length,'Đang được theo dõi']
    ];
    cards.forEach((c,i)=>{const d=data[i];c.querySelector('label').textContent=d[0];c.querySelector('b').textContent=d[1];c.querySelector('small').textContent=d[2];});
  }

  const items=[];
  overdue.forEach(t=>{const s=taskSchool(t);if(s)items.push({p:0,s,title:t.title,detail:'Quá hạn · '+(t.due||'chưa đặt hạn')});});
  today.forEach(t=>{const s=taskSchool(t);if(s)items.push({p:1,s,title:t.title,detail:'Đến hạn hôm nay'});});
  follow.forEach(s=>items.push({p:2,s,title:s.action||'Theo dõi trường',detail:'Ngày làm lại · '+(s.date||'')}));
  risky.forEach(s=>items.push({p:3,s,title:s.action||'Cần xử lý rủi ro',detail:'Rủi ro · '+(s.owner||'')}));

  const seen=new Set();
  const top=items.sort((a,b)=>a.p-b.p).filter(x=>{const k=x.s.id+'|'+x.title;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,10);
  if($('nextBest'))$('nextBest').innerHTML=top.map(x=>'<div class="recommend" onclick="openSchool(\''+esc(x.s.id)+'\')"><b>'+esc(x.s.name)+'</b><p>'+esc(x.title)+' · '+esc(x.detail)+'</p></div>').join('')||'<div class="empty">Không có việc đến hạn hoặc quá hạn.</div>';

  const ranked=[...schools].sort((a,b)=>{
    const da=dayKey(a.date)||'9999-99-99',db=dayKey(b.date)||'9999-99-99';
    const ra=a.risk==='Rủi ro'?0:a.risk==='Cần chú ý'?1:2;
    const rb=b.risk==='Rủi ro'?0:b.risk==='Cần chú ý'?1:2;
    return da.localeCompare(db)||ra-rb;
  }).slice(0,8);
  if($('priority'))$('priority').innerHTML=ranked.map(s=>'<div class="item" onclick="openSchool(\''+esc(s.id)+'\')"><div class="dot '+(s.risk==='Rủi ro'?'risk':s.risk==='Cần chú ý'?'warn':'good')+'"></div><div class="grow"><b>'+esc(s.name)+'</b><small>'+esc(s.action||'Chưa có bước tiếp theo')+'</small></div><span class="tag">'+esc(s.date||'Chưa đặt ngày')+'</span></div>').join('');

  renderManagerSummary();
}

function renderManagerSummary(){
  const today=$('today');if(!today)return;
  let box=$('opsManagerSummary');
  if(!isManager()){box?.remove();return;}
  if(!box){box=document.createElement('div');box.id='opsManagerSummary';box.className='card section';box.style.marginTop='17px';today.appendChild(box);}
  const schools=st().schools||[],tasks=(st().tasks||[]).filter(t=>!t.done);
  const owners=[...new Set(schools.map(s=>s.owner).filter(Boolean))];
  const rows=owners.map(o=>{
    const ss=schools.filter(s=>s.owner===o);
    const open=tasks.filter(t=>t.owner===o);
    const overdue=open.filter(t=>dueState(t.due)==='overdue').length;
    const follow=ss.filter(s=>s.date&&['overdue','today'].includes(dueState(s.date))).length;
    return '<div class="item"><div class="grow"><b>'+esc(o)+'</b><small>'+ss.length+' trường · '+open.length+' việc mở · '+follow+' trường cần theo dõi</small></div><span class="tag '+(overdue?'risk':'good')+'">'+overdue+' quá hạn</span></div>';
  }).join('');
  box.innerHTML='<div class="sectionhead"><h3>Nhịp làm việc theo phụ trách</h3><small>Quản lý</small></div>'+rows;
}


function simplifySchoolList(){
  const table=$('schools')?.querySelector('table');if(!table)return;
  const head=table.querySelector('thead tr');if(head)head.innerHTML='<th>Trường</th><th>Địa bàn</th><th>Giai đoạn</th><th>Phụ trách</th><th>Bước tiếp theo</th><th>Ngày làm lại</th><th></th>';
}
function renderSchoolsSimple(){
  const q=($('q')?.value||'').toLowerCase(),r=$('fr')?.value||'',stage=$('fs')?.value||'';
  let list=(st().schools||[]).filter(s=>(!q||JSON.stringify(s).toLowerCase().includes(q))&&(!r||s.region===r)&&(!stage||s.status===stage));
  const body=$('schoolRows');if(!body)return;
  body.innerHTML=list.map(s=>'<tr><td><div class="name">'+esc(s.name)+'</div></td><td>'+esc(s.region)+'</td><td><span class="tag brand">'+esc(s.status||'Chưa xác định')+'</span></td><td><div class="owner"><div class="mini">'+esc((s.owner||'?')[0])+'</div>'+esc(s.owner||'')+'</div></td><td><b>'+esc(s.action||'Chưa có bước tiếp theo')+'</b></td><td>'+esc(s.date||'Chưa đặt')+'</td><td><button class="rowbtn" onclick="openSchool(\\''+esc(s.id)+'\\')">Mở</button></td></tr>').join('')||'<tr><td colspan="7" class="empty">Không có trường phù hợp.</td></tr>';
}
function simplifySchoolFilters(){
  const fs=$('fs');if(fs){const vals=['','0 – Data tiềm năng','1 – Đã tiếp cận','2 – Đã trao đổi','3 – Đang xúc tiến triển khai'];fs.innerHTML=vals.map(v=>'<option value="'+esc(v)+'">'+(v||'Tất cả giai đoạn')+'</option>').join('');}
  const fk=$('fk');if(fk)fk.style.display='none';
}


function simplifyDrawer(){
  if(window.currentTab!=='overview')return;
  const body=$('dBody');if(!body)return;
  const grid=body.querySelector('.infogrid');if(grid)grid.remove();
  const next=body.querySelector('.next');if(next){
    const s=st().schools.find(x=>x.id===window.current);
    if(s){const label=next.querySelector('label');if(label)label.textContent='Bước tiếp theo';const muted=next.querySelector('.muted');if(muted)muted.textContent='Giai đoạn: '+(s.status||'Chưa xác định')+' · Phụ trách: '+(s.owner||'')+(s.date?' · Làm lại: '+s.date:'');}
  }
}

function patch(){
  ensureInteractionFields();

  const open0=window.openInteraction;
  if(open0)window.openInteraction=function(){
    const r=open0.apply(this,arguments),s=st().schools.find(x=>x.id===window.current);
    ensureInteractionFields();
    if(s&&$('ifollow'))$('ifollow').value=dayKey(s.date)||isoToday();
    return r;
  };

  const save0=window.saveInteraction;
  if(save0)window.saveInteraction=async function(){
    const s=st().schools.find(x=>x.id===window.current);if(!s)return;
    ensureInteractionFields();
    const result=$('ir')?.value.trim(),action=$('ia')?.value.trim(),follow=$('ifollow')?.value;
    if(!result)return window.toast?.('Cần ghi kết quả trao đổi');
    if(!action)return window.toast?.('Cần ghi bước tiếp theo');
    if(!follow)return window.toast?.('Cần chọn ngày cần làm lại');

    const channel=$('ic')?.value||'Khác';
    const actor=$('io')?.value||s.owner;
    s.date=follow;

    const out=await save0.apply(this,arguments);

    try{
      if(window.SchoolOsBackend?.isAuthenticated?.()){
        await SchoolOsBackend.logActivity({
          school_id:s.id,
          school_name:s.name,
          event_type:'MANUAL_ACTIVITY',
          actor,
          channel,
          summary:result,
          detail:{next_action:action,followup_date:follow,risk:s.risk||''},
          source_id:'',
          hot_signal:false
        });
        if(window.SchoolOsEmailIntelligence?.loadActivity)await SchoolOsEmailIntelligence.loadActivity(s,true);
      }
    }catch(e){
      window.toast?.('Đã cập nhật trường; nhật ký trao đổi chưa đồng bộ.');
    }
    renderTodaySimple();
    return out;
  };

  simplifySchoolList();simplifySchoolFilters();
  window.renderSchools=renderSchoolsSimple;
  if($('fr'))$('fr').onchange=renderSchoolsSimple;if($('fs'))$('fs').onchange=renderSchoolsSimple;if($('q'))$('q').oninput=renderSchoolsSimple;
  const drawer0=window.renderDrawer;if(drawer0)window.renderDrawer=function(){const r=drawer0.apply(this,arguments);simplifyDrawer();return r;};
  const refresh0=window.refresh;
  if(refresh0)window.refresh=function(){const r=refresh0.apply(this,arguments);simplifySchoolList();renderSchoolsSimple();renderTodaySimple();return r;};
}

function init(){patch();simplifySchoolList();simplifySchoolFilters();renderSchoolsSimple();renderTodaySimple();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.SchoolOsSalesOps={render:renderTodaySimple};
})();