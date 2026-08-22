/* Sunbot School OS - minimal contextual record editors */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let originals={};

  function st(){return window.state||{schools:[],tasks:[],opps:[]};}
  function currentSchool(){return st().schools.find(s=>s.id===window.current)||null;}
  function backend(){return window.SchoolOsBackend;}
  function live(){return !!backend()?.isConfigured?.()&&!!backend()?.isAuthenticated?.();}
  function owners(){
    const a=[...st().schools.map(x=>x.owner),...st().tasks.map(x=>x.owner),...st().opps.map(x=>x.owner),backend()?.currentUser?.()?.name].filter(Boolean);
    return [...new Set(a)];
  }
  function opts(values,current){return [...new Set([current,...values].filter(Boolean))].map(x=>`<option ${x===current?'selected':''}>${esc(x)}</option>`).join('');}
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function dateForInput(v){
    const s=String(v||'').trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
    const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(m)return`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    return'';
  }
  function displayDate(v){const s=String(v||'').trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:s;}
  function parseDate(v){
    const s=String(v||'').trim();let m;if((m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/)))return new Date(+m[1],+m[2]-1,+m[3]);
    if((m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)))return new Date(+m[3],+m[2]-1,+m[1]);
    if((m=s.match(/^(\d{1,2})\/(\d{1,2})$/))){let y=new Date().getFullYear(),d=new Date(y,+m[2]-1,+m[1]);if(d<new Date(new Date().setMonth(new Date().getMonth()-3)))d.setFullYear(y+1);return d;}
    return null;
  }

  function installStyle(){if($('recordEditorStyle'))return;const s=document.createElement('style');s.id='recordEditorStyle';s.textContent=`
    .edit-inline{border:0;background:transparent;color:#67717c;font-size:10px;font-weight:800;padding:5px 6px;border-radius:7px}.edit-inline:hover{background:#f1f3f5;color:#252b33}.task.with-edit{grid-template-columns:26px 1fr auto auto}.stake.with-edit{grid-template-columns:1fr auto auto}.deal-edit{float:right;margin:-3px -3px 4px 8px}.form-note{font-size:10px;color:var(--muted);line-height:1.45;margin-top:3px}
  `;document.head.appendChild(s);}

  function ensureModal(id,title,body){
    let m=$(id);if(m)return m;
    m=document.createElement('div');m.className='modal';m.id=id;m.innerHTML=`<div class="modalbox"><h2>${title}</h2>${body}<div class="modalactions"><button class="btn" data-cancel>Hủy</button><button class="btn primary" data-save>Lưu</button></div></div>`;document.body.appendChild(m);m.querySelector('[data-cancel]').onclick=()=>m.classList.remove('open');m.onclick=e=>{if(e.target===m)m.classList.remove('open');};return m;
  }

  function schoolModal(){return ensureModal('schoolEditForm','Cập nhật hồ sơ trường',`<div class="form">
    <div class="field full"><label>Tên trường</label><input id="esName" disabled></div>
    <div class="field"><label>Khu vực</label><input id="esRegion"></div><div class="field"><label>Loại trường</label><select id="esType"><option>Công lập</option><option>Tư thục</option></select></div>
    <div class="field"><label>Trạng thái</label><select id="esStatus"><option>Tiềm năng</option><option>Đang tiếp cận</option><option>Đang triển khai</option><option>Tạm dừng</option></select></div><div class="field"><label>Phụ trách</label><select id="esOwner"></select></div>
    <div class="field full"><label>Bước tiếp theo</label><input id="esAction"><div class="form-note">Hồ sơ đang theo dõi nên luôn có một bước tiếp theo cụ thể.</div></div>
    <div class="field"><label>Hạn xử lý</label><input id="esDate" placeholder="DD/MM hoặc YYYY-MM-DD"></div><div class="field"><label>Mức độ</label><select id="esRisk"><option>Bình thường</option><option>Cần chú ý</option><option>Rủi ro</option></select></div>
    <div class="field"><label>Quy mô trẻ</label><input id="esChildren" type="number" min="0"></div><div class="field"><label>Nguồn cơ hội</label><input id="esSource"></div>
    <div class="field"><label>STEAM hiện tại</label><input id="esSteam"></div><div class="field"><label>Cơ chế / chính sách</label><input id="esPolicy"></div>
    <div class="field"><label>Ngày gia hạn</label><input id="esRenewal" type="date"></div>
  </div>`);}
  function contactModal(){return ensureModal('contactEditForm','Người liên hệ',`<div class="form">
    <div class="field full"><label>Họ tên / đầu mối</label><input id="ecName"></div><div class="field"><label>Chức vụ</label><input id="ecRole"></div>
    <div class="field"><label>Vai trò quyết định</label><select id="ecDecision"><option>Chưa xác định</option><option>Người quyết định</option><option>Người ảnh hưởng</option><option>Người kiểm soát ngân sách</option><option>Người sử dụng</option><option>Người kết nối</option></select></div>
    <div class="field"><label>Email</label><input id="ecEmail" type="email"></div><div class="field"><label>Điện thoại</label><input id="ecPhone" type="tel"></div>
    <div class="field"><label>Thái độ</label><select id="ecSentiment"><option>Ủng hộ</option><option>Quan tâm</option><option>Trung lập</option><option>Lo ngại</option></select></div>
  </div>`);}
  function taskModal(){return ensureModal('taskEditForm','Cập nhật công việc',`<div class="form">
    <div class="field full"><label>Nội dung</label><input id="etTitle"></div><div class="field"><label>Phụ trách</label><select id="etOwner"></select></div>
    <div class="field"><label>Hạn</label><input id="etDue" placeholder="DD/MM hoặc YYYY-MM-DD"></div><div class="field"><label>Mức độ</label><select id="etRisk"><option value="">Bình thường</option><option value="warn">Cần chú ý</option><option value="risk">Khẩn</option></select></div>
  </div>`);}
  function oppModal(){return ensureModal('oppEditForm','Cập nhật cơ hội',`<div class="form">
    <div class="field full"><label>Tên cơ hội</label><input id="eoTitle"></div><div class="field"><label>Giai đoạn</label><select id="eoStage"><option>Khám phá</option><option>Tiếp cận</option><option>Đánh giá</option><option>Đề xuất</option><option>Quyết định</option></select></div>
    <div class="field"><label>Phụ trách</label><select id="eoOwner"></select></div><div class="field"><label>Giá trị dự kiến</label><input id="eoValue" type="number" min="0" step="1000000"></div>
  </div>`);}

  let editingContactId=null,editingTaskId=null,editingOppId=null;
  function openSchoolEditor(){const s=currentSchool();if(!s)return;const m=schoolModal();$('esName').value=s.name;$('esRegion').value=s.region||'';$('esType').value=s.type||'Công lập';$('esStatus').value=s.status||'Tiềm năng';$('esOwner').innerHTML=opts(owners(),s.owner);$('esAction').value=s.action||'';$('esDate').value=s.date||'';$('esRisk').value=s.risk||'Bình thường';$('esChildren').value=s.children||'';$('esSource').value=s.source||'';$('esSteam').value=s.steam||'';$('esPolicy').value=s.policy||'';$('esRenewal').value=dateForInput(s.renewal);m.querySelector('[data-save]').onclick=saveSchoolEditor;m.classList.add('open');}
  async function saveSchoolEditor(){const s=currentSchool();if(!s)return;const ver=s._version;s.region=$('esRegion').value.trim();s.type=$('esType').value;s.status=$('esStatus').value;s.owner=$('esOwner').value;s.action=$('esAction').value.trim();s.date=$('esDate').value.trim();s.risk=$('esRisk').value;s.children=+$('esChildren').value||'';s.source=$('esSource').value.trim();s.steam=$('esSteam').value.trim();s.policy=$('esPolicy').value.trim();s.renewal=$('esRenewal').value||'';window.save?.();window.refresh?.();window.renderDrawer?.();$('schoolEditForm').classList.remove('open');await persist('school',s,ver,'Cập nhật trường');}

  function openContactEditor(id){const s=currentSchool();if(!s)return;editingContactId=id||null;const c=id?(s.contacts||[]).find(x=>x.id===id):null,m=contactModal();$('ecName').value=c?.name||'';$('ecRole').value=c?.role||'';$('ecDecision').value=c?.decision||'Chưa xác định';$('ecEmail').value=c?.email||'';$('ecPhone').value=c?.phone||'';$('ecSentiment').value=c?.sentiment||'Trung lập';m.querySelector('h2').textContent=c?'Cập nhật người liên hệ':'Thêm người liên hệ';m.querySelector('[data-save]').onclick=saveContactEditor;m.classList.add('open');setTimeout(()=>$('ecName').focus(),20);}
  async function saveContactEditor(){const s=currentSchool();if(!s)return;const old=editingContactId?(s.contacts||[]).find(x=>x.id===editingContactId):null;if(!$('ecName').value.trim())return window.toast?.('Cần nhập tên người liên hệ');const c=old||{id:'CON_'+Date.now(),school_id:s.id};const ver=old?old._version:0;c.school_id=s.id;c.name=$('ecName').value.trim();c.role=$('ecRole').value.trim();c.decision=$('ecDecision').value;c.email=$('ecEmail').value.trim();c.phone=$('ecPhone').value.trim();c.sentiment=$('ecSentiment').value;if(!old){s.contacts=s.contacts||[];s.contacts.push(c);}window.save?.();window.renderDrawer?.();$('contactEditForm').classList.remove('open');await persist('contact',c,ver,'Lưu người liên hệ');}

  function openTaskEditor(id){const t=st().tasks.find(x=>x.id===id);if(!t)return;editingTaskId=id;const m=taskModal();$('etTitle').value=t.title||'';$('etOwner').innerHTML=opts(owners(),t.owner);$('etDue').value=t.due||'';$('etRisk').value=t.risk||'';m.querySelector('[data-save]').onclick=saveTaskEditor;m.classList.add('open');}
  async function saveTaskEditor(){const t=st().tasks.find(x=>x.id===editingTaskId);if(!t)return;if(!$('etTitle').value.trim())return window.toast?.('Cần nhập nội dung công việc');const ver=t._version;t.title=$('etTitle').value.trim();t.owner=$('etOwner').value;t.due=$('etDue').value.trim();t.risk=$('etRisk').value;window.save?.();window.refresh?.();if(window.currentTab==='tasks')window.renderDrawer?.();$('taskEditForm').classList.remove('open');await persist('task',t,ver,'Cập nhật công việc');}

  function openOppEditor(id){const o=st().opps.find(x=>x.id===id);if(!o)return;editingOppId=id;const m=oppModal();$('eoTitle').value=o.title||'';$('eoStage').value=o.stage||'Khám phá';$('eoOwner').innerHTML=opts(owners(),o.owner);$('eoValue').value=o.value||0;m.querySelector('[data-save]').onclick=saveOppEditor;m.classList.add('open');}
  async function saveOppEditor(){const o=st().opps.find(x=>x.id===editingOppId);if(!o)return;if(!$('eoTitle').value.trim())return window.toast?.('Cần nhập tên cơ hội');const ver=o._version;o.title=$('eoTitle').value.trim();o.stage=$('eoStage').value;o.owner=$('eoOwner').value;o.value=+$('eoValue').value||0;window.save?.();window.refresh?.();if(window.currentTab==='opps')window.renderDrawer?.();$('oppEditForm').classList.remove('open');await persist('opportunity',o,ver,'Cập nhật cơ hội');}

  async function persist(kind,rec,ver,label){
    if(!live())return;
    try{
      let r;if(kind==='school')r=await backend().upsertSchool(rec,ver);else if(kind==='contact')r=await backend().upsertContact(rec,ver);else if(kind==='task')r=await backend().upsertTask(rec,ver);else r=await backend().upsertOpportunity(rec,ver);
      if(r?.record)Object.assign(rec,r.record);window.save?.();window.toast?.('Đã lưu');
    }catch(e){
      if(String(e?.message||'').includes('RECORD_VERSION_CONFLICT')){window.toast?.('Dữ liệu vừa được cập nhật ở thiết bị khác. Đang tải bản mới...');await window.SchoolOsMultiUser?.loadRecords?.();}
      else window.toast?.((label||'Lưu')+' chưa thành công: '+String(e?.message||e).replace(/^Error:\s*/,''));
    }
  }

  function enhanceDrawer(){
    const s=currentSchool(),body=$('dBody');if(!s||!body)return;
    if(window.currentTab==='overview'){
      const q=body.querySelector('.quick');if(q&&!q.querySelector('[data-edit-school]')){const b=document.createElement('button');b.className='btn small';b.dataset.editSchool='1';b.textContent='Cập nhật hồ sơ';b.onclick=openSchoolEditor;q.appendChild(b);}
    }
    if(window.currentTab==='people'){
      const add=body.querySelector('.sectionhead button');if(add){add.onclick=()=>openContactEditor();add.textContent='Thêm người';}
      const cards=[...body.querySelectorAll('.stake')],contacts=s.contacts||[];cards.forEach((card,i)=>{card.classList.add('with-edit');if(!card.querySelector('[data-edit-contact]')){const b=document.createElement('button');b.className='edit-inline';b.dataset.editContact='1';b.textContent='Sửa';b.onclick=()=>openContactEditor(contacts[i]?.id);card.appendChild(b);}});
    }
    if(window.currentTab==='tasks'){
      const rel=st().tasks.filter(x=>x.school_id===s.id||x.school===s.name);[...body.querySelectorAll('.task')].forEach((card,i)=>{card.classList.add('with-edit');if(!card.querySelector('[data-edit-task]')){const b=document.createElement('button');b.className='edit-inline';b.dataset.editTask='1';b.textContent='Sửa';b.onclick=()=>openTaskEditor(rel[i]?.id);card.appendChild(b);}});
    }
    if(window.currentTab==='opps'){
      const rel=st().opps.filter(x=>x.school_id===s.id||x.school===s.name);[...body.querySelectorAll('.deal')].forEach((card,i)=>{if(!card.querySelector('[data-edit-opp]')){const b=document.createElement('button');b.className='edit-inline deal-edit';b.dataset.editOpp='1';b.textContent='Cập nhật';b.onclick=()=>openOppEditor(rel[i]?.id);card.prepend(b);}});const h=body.querySelector('.sectionhead h3');if(h)h.textContent='Cơ hội & đánh giá chất lượng';
    }
  }

  function enhanceTaskPage(){const cards=[...document.querySelectorAll('#taskList .task')];cards.forEach((card,i)=>{card.classList.add('with-edit');if(!card.querySelector('[data-edit-task]')){const b=document.createElement('button');b.className='edit-inline';b.dataset.editTask='1';b.textContent='Sửa';b.onclick=()=>openTaskEditor(st().tasks[i]?.id);card.appendChild(b);}});}

  function daysUntil(v){const d=parseDate(v);if(!d)return null;const today=new Date();today.setHours(0,0,0,0);d.setHours(0,0,0,0);return Math.round((d-today)/86400000);}
  function renderRenewalWindow(){
    const box=$('renewList');if(!box)return;const list=st().schools.map(s=>({s,days:daysUntil(s.renewal)})).filter(x=>x.days!==null&&x.days<=90).sort((a,b)=>a.days-b.days);
    box.innerHTML=list.map(x=>`<div class="item"><div class="dot ${x.days<0?'risk':x.days<=30?'warn':'good'}"></div><div class="grow"><b>${esc(x.s.name)}</b><small>${x.days<0?'Đã tới hạn '+Math.abs(x.days)+' ngày':x.days===0?'Đến hạn hôm nay':`Còn ${x.days} ngày`} · ${esc(x.s.owner)}</small></div><button class="btn small" onclick="openSchool('${esc(x.s.id)}')">Mở</button></div>`).join('')||'<div class="empty">Không có trường cần gia hạn trong 90 ngày.</div>';
    const small=document.querySelector('#forecast .sectionhead small');if(small)small.textContent='Trong 90 ngày';
  }

  function patch(){
    originals.renderDrawer=window.renderDrawer;if(originals.renderDrawer)window.renderDrawer=function(){const r=originals.renderDrawer.apply(this,arguments);enhanceDrawer();return r;};
    originals.renderTasks=window.renderTasks;if(originals.renderTasks)window.renderTasks=function(){const r=originals.renderTasks.apply(this,arguments);enhanceTaskPage();return r;};
    originals.renderForecast=window.renderForecast;if(originals.renderForecast)window.renderForecast=function(){const r=originals.renderForecast.apply(this,arguments);renderRenewalWindow();return r;};
  }
  function init(){installStyle();schoolModal();contactModal();taskModal();oppModal();patch();window.refresh?.();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.SchoolOsEditors={openSchool:openSchoolEditor,openContact:openContactEditor,openTask:openTaskEditor,openOpportunity:openOppEditor};
})();
