/* Sunbot School OS - business rules and responsive polish */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);let originals={};
  function st(){return window.state||{schools:[],tasks:[],opps:[]};}
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function viDate(iso){const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(iso||'');}
  function defaultIso(days){const d=new Date();d.setDate(d.getDate()+(days||0));return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  function live(){return !!window.SchoolOsBackend?.isConfigured?.()&&!!window.SchoolOsBackend?.isAuthenticated?.();}
  function manager(){const u=window.SchoolOsBackend?.currentUser?.();return u?['SUPER_ADMIN','ADMIN','LEADER'].includes(u.role):$('roleMode')?.value==='manager';}

  async function persist(kind,rec){
    if(!live())return;
    try{let r=kind==='school'?await SchoolOsBackend.upsertSchool(rec,0):await SchoolOsBackend.upsertTask(rec,0);if(r?.record)Object.assign(rec,r.record);window.save?.();}
    catch(e){window.toast?.('Chưa đồng bộ được: '+String(e?.message||e).replace(/^Error:\s*/,''));}
  }

  function enhanceCreateSchool(){
    const form=$('schoolForm')?.querySelector('.form');if(!form||$('snextdate'))return;
    const action=$('sa')?.closest('.field');if(!action)return;
    const f=document.createElement('div');f.className='field';f.innerHTML='<label>Hạn bước tiếp theo</label><input id="snextdate" type="date">';action.classList.remove('full');action.after(f);$('snextdate').value=defaultIso(2);
  }
  function replaceAddSchool(){
    originals.addSchool=window.addSchool;
    window.addSchool=async function(){
      const name=$('sn').value.trim(),region=$('sr').value;if(!name)return window.toast?.('Cần nhập tên trường');
      if(st().schools.some(s=>String(s.name).trim().toLowerCase()===name.toLowerCase()&&String(s.region)===String(region)))return window.toast?.('Trường này đã có trong hệ thống');
      const rec={id:'SCH_'+Date.now(),name,region,type:$('stype').value,status:'Tiềm năng',owner:$('so').value,action:$('sa').value.trim()||'Xác định đầu mối ra quyết định',date:viDate($('snextdate')?.value||defaultIso(2)),risk:'Bình thường',source:$('ssource').value,children:'',steam:'Chưa xác minh',policy:'Chưa xác minh',renewal:'',contacts:[],events:[]};
      st().schools.unshift(rec);$('sn').value='';$('sa').value='';if($('snextdate'))$('snextdate').value=defaultIso(2);window.closeModal?.('schoolForm');window.refresh?.();window.toast?.('Đã thêm trường');await persist('school',rec);
    };
  }
  function replaceAddTask(){
    originals.addTask=window.addTask;
    window.addTask=async function(){
      const title=$('tt').value.trim();if(!title)return window.toast?.('Cần nhập nội dung');const school=st().schools.find(s=>s.name===$('ts').value);
      const rec={id:'T_'+Date.now(),title,school:school?.name||$('ts').value,school_id:school?.id||'',owner:$('to').value,due:$('td').value?viDate($('td').value):'Chưa đặt',risk:$('tr').value,done:false};
      st().tasks.unshift(rec);$('tt').value='';window.closeModal?.('taskForm');window.refresh?.();window.toast?.('Đã tạo công việc');await persist('task',rec);
    };
  }

  function dynamicPerformance(){
    const box=$('peoplePerf');if(!box||typeof window.perfFor!=='function')return;
    const names=[...new Set([...st().schools.map(x=>x.owner),...st().tasks.map(x=>x.owner),...st().opps.map(x=>x.owner)].filter(Boolean))];
    box.innerHTML=names.map(n=>{const p=window.perfFor(n);return `<div class="card person"><h3>${esc(n)}</h3><p>${p.schools} trường · ${p.opps} cơ hội</p><div class="metricline"><span>Nỗ lực ghi nhận</span><b>${p.effort}</b></div><div class="metricline"><span>Kỷ luật hoàn thành</span><b>${p.discipline}%</b></div><div class="metricline"><span>Chất lượng cơ hội</span><b>${p.quality}%</b></div><div class="metricline"><span>Giá trị cơ hội quy đổi</span><b>${p.outcome}tr</b></div><p>${p.discipline<60?'Cần tập trung follow-up đúng hạn.':p.quality<55?'Nên làm rõ chất lượng cơ hội.':'Nhịp làm việc đang tương đối tốt.'}</p></div>`}).join('')||'<div class="empty">Chưa có dữ liệu phụ trách.</div>';
  }

  function installMobileManager(){
    const nav=document.querySelector('.mobile');if(!nav||$('mobileManager'))return;
    const b=document.createElement('button');b.id='mobileManager';b.textContent='Quản lý';b.onclick=openMobileManager;nav.appendChild(b);
    if(!$('mobileManagerMenu')){const m=document.createElement('div');m.className='modal';m.id='mobileManagerMenu';m.innerHTML='<div class="modalbox" style="width:min(390px,94vw)"><h2>Quản lý</h2><div style="display:grid;gap:8px;margin-top:14px"><button class="btn" data-page="performance">Hiệu suất bán hàng</button><button class="btn" data-page="forecast">Dự báo & gia hạn</button></div><div class="modalactions"><button class="btn" data-close>Đóng</button></div></div>';document.body.appendChild(m);m.querySelector('[data-close]').onclick=()=>m.classList.remove('open');m.querySelectorAll('[data-page]').forEach(x=>x.onclick=()=>{m.classList.remove('open');window.go?.(x.dataset.page);});m.onclick=e=>{if(e.target===m)m.classList.remove('open');};}
    updateMobileManager();
  }
  function openMobileManager(){if(manager())$('mobileManagerMenu').classList.add('open');}
  function updateMobileManager(){const nav=document.querySelector('.mobile'),b=$('mobileManager');if(!nav||!b)return;const show=manager();b.style.display=show?'':'none';nav.style.gridTemplateColumns=show?'repeat(5,1fr)':'repeat(4,1fr)';}

  function cleanLabels(){
    const source=$('ssource');if(source){[...source.options].forEach(o=>{if(o.textContent==='Cold outreach'){o.value='Cold outreach';o.textContent='Tiếp cận chủ động';}});}
    const tpl=$('emailTpl');if(tpl){[...tpl.options].forEach(o=>{if(o.textContent==='Follow-up sau khi gửi hồ sơ'){o.value='Follow-up sau khi gửi hồ sơ';o.textContent='Theo dõi sau khi gửi hồ sơ';}});}
  }

  function patch(){
    replaceAddSchool();replaceAddTask();
    originals.renderPerformance=window.renderPerformance;if(originals.renderPerformance)window.renderPerformance=function(){const r=originals.renderPerformance.apply(this,arguments);dynamicPerformance();return r;};
    originals.refresh=window.refresh;if(originals.refresh)window.refresh=function(){const r=originals.refresh.apply(this,arguments);dynamicPerformance();updateMobileManager();cleanLabels();return r;};
    originals.setMode=window.setMode;if(originals.setMode)window.setMode=function(){const r=originals.setMode.apply(this,arguments);updateMobileManager();return r;};
  }
  function init(){enhanceCreateSchool();installMobileManager();patch();cleanLabels();window.refresh?.();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
