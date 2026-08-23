/* Sunbot School OS multi-user runtime v0.1 */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let originals={};

  function backendReady(){return !!window.SchoolOsBackend?.isConfigured?.();}
  function authed(){return !!window.SchoolOsBackend?.isAuthenticated?.();}
  function user(){return window.SchoolOsBackend?.currentUser?.()||null;}

  function cleanProductionUi(){
    const foot=document.querySelector('.sidefoot');
    if(foot)foot.innerHTML='Năm học 2026–2027';
    const b=$('backendBtn');
    if(b)b.textContent=backendReady()?'Dữ liệu: Đã kết nối':'Kết nối dữ liệu';
  }

  function installAuthUi(){
    if(!$('loginGate')){
      const gate=document.createElement('div');
      gate.id='loginGate';
      gate.style.cssText='position:fixed;inset:0;z-index:9999;background:#f6f7f9;display:none;place-items:center;padding:20px';
      gate.innerHTML=`<div style="width:min(420px,96vw);background:#fff;border:1px solid #e5e8ed;border-radius:18px;padding:26px;box-shadow:0 20px 60px rgba(20,25,31,.12)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px"><div class="logo">S</div><div><b style="font-size:18px">Sunbot School OS</b><div class="muted" style="margin-top:3px">Đăng nhập để tiếp tục</div></div></div>
        <div class="field"><label>Email</label><input id="loginEmail" type="email" autocomplete="username" placeholder="ten@kiro.vn"></div>
        <div class="field" style="margin-top:12px"><label>Mật khẩu</label><input id="loginPassword" type="password" autocomplete="current-password"></div>
        <div id="loginError" style="min-height:20px;color:#b83b3b;font-size:12px;margin:10px 0"></div>
        <button class="btn primary" id="loginSubmit" style="width:100%">Đăng nhập</button>
      </div>`;
      document.body.appendChild(gate);
      $('loginSubmit').onclick=doLogin;
      $('loginPassword').onkeydown=e=>{if(e.key==='Enter')doLogin();};
    }
    const top=document.querySelector('.top');
    const avatar=top?.querySelector('.avatar');
    if(top&&avatar&&!$('logoutBtn')){
      const btn=document.createElement('button');btn.id='logoutBtn';btn.className='btn';btn.textContent='Đăng xuất';btn.style.display='none';btn.onclick=doLogout;top.insertBefore(btn,avatar);
    }
  }

  async function doLogin(){
    const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
    $('loginError').textContent='';$('loginSubmit').disabled=true;$('loginSubmit').textContent='Đang đăng nhập...';
    try{await SchoolOsBackend.login(email,password);await afterAuth();$('loginGate').style.display='none';}
    catch(e){$('loginError').textContent=humanError(e);}
    finally{$('loginSubmit').disabled=false;$('loginSubmit').textContent='Đăng nhập';}
  }
  async function doLogout(){try{await SchoolOsBackend.logout();}catch(e){}showLogin();}
  function showLogin(){if(!backendReady())return;$('loginGate').style.display='grid';$('loginPassword').value='';setTimeout(()=>$('loginEmail').focus(),20);$('logoutBtn').style.display='none';}

  function applyRole(){
    const u=user();if(!u)return;
    const manager=['SUPER_ADMIN','ADMIN','LEADER'].includes(u.role);
    const mode=$('roleMode');
    if(mode){mode.value=manager?'manager':'staff';mode.style.display=manager?'':'none';}
    window.setMode?.(manager?'manager':'staff');
    const avatar=document.querySelector('.avatar');if(avatar){avatar.textContent=(u.name||u.email||'U').split(/\s+/).filter(Boolean).slice(-2).map(x=>x[0]).join('').toUpperCase().slice(0,2);avatar.title=(u.name||u.email)+' · '+u.role;}
    $('logoutBtn').style.display='';
  }

  async function loadRecords(){
    const r=await SchoolOsBackend.listCoreRecords();
    const contactsBySchool={};(r.contacts||[]).forEach(c=>(contactsBySchool[c.school_id]||(contactsBySchool[c.school_id]=[])).push(c));
    const oldEvents={};(window.state?.schools||[]).forEach(s=>oldEvents[s.id]=s.events||[]);
    window.state.schools=(r.schools||[]).map(s=>Object.assign({},s,{contacts:contactsBySchool[s.id]||[],events:oldEvents[s.id]||[]}));
    window.state.tasks=r.tasks||[];window.state.opps=r.opportunities||[];
    window.refresh?.();
  }

  async function afterAuth(){applyRole();await loadRecords();cleanProductionUi();}

  function humanError(e){const m=String(e?.message||e||'');if(m.includes('RECORD_VERSION_CONFLICT'))return'Dữ liệu vừa được người khác cập nhật. Hệ thống sẽ tải bản mới nhất.';if(m.includes('SESSION_'))return'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';return m.replace(/^Error:\s*/,'')||'Có lỗi xảy ra.';}
  async function syncOrReload(promise,localRecord,label){
    try{const r=await promise;if(r?.record&&localRecord)Object.assign(localRecord,r.record);window.save?.();return r;}
    catch(e){if(String(e.message||'').includes('RECORD_VERSION_CONFLICT')){window.toast?.('Dữ liệu đã thay đổi ở thiết bị khác. Đang tải lại...');await loadRecords();}else{if(localRecord)localRecord._syncError=true;window.toast?.((label||'Đồng bộ')+' chưa thành công: '+humanError(e));}throw e;}
  }

  function schoolForTask(t){return window.state.schools.find(s=>s.id===t.school_id||s.name===t.school);}

  function patchMutations(){
    originals.addSchool=window.addSchool;
    if(originals.addSchool)window.addSchool=function(){const before=new Set(window.state.schools.map(x=>x.id));const r=originals.addSchool.apply(this,arguments);const rec=window.state.schools.find(x=>!before.has(x.id));if(rec&&backendReady()&&authed())syncOrReload(SchoolOsBackend.upsertSchool(rec,0),rec,'Lưu trường').catch(()=>{});return r;};

    originals.addTask=window.addTask;
    if(originals.addTask)window.addTask=function(){const before=new Set(window.state.tasks.map(x=>x.id));const r=originals.addTask.apply(this,arguments);const rec=window.state.tasks.find(x=>!before.has(x.id));if(rec){const s=schoolForTask(rec);if(s)rec.school_id=s.id;if(backendReady()&&authed())syncOrReload(SchoolOsBackend.upsertTask(rec,0),rec,'Lưu công việc').catch(()=>{});}return r;};

    originals.addOpp=window.addOpp;
    if(originals.addOpp)window.addOpp=function(){const before=new Set(window.state.opps.map(x=>x.id));const r=originals.addOpp.apply(this,arguments);const rec=window.state.opps.find(x=>!before.has(x.id));if(rec){const s=window.state.schools.find(x=>x.name===rec.school);if(s)rec.school_id=s.id;if(backendReady()&&authed())syncOrReload(SchoolOsBackend.upsertOpportunity(rec,0),rec,'Lưu cơ hội').catch(()=>{});}return r;};

    originals.toggleTask=window.toggleTask;
    if(originals.toggleTask)window.toggleTask=function(i){const rec=window.state.tasks[i],ver=rec?rec._version:null;const r=originals.toggleTask.apply(this,arguments);if(rec&&backendReady()&&authed())syncOrReload(SchoolOsBackend.upsertTask(rec,ver),rec,'Cập nhật công việc').catch(()=>{});return r;};

    originals.updateQual=window.updateQual;
    if(originals.updateQual)window.updateQual=function(id,key,v){const rec=window.state.opps.find(x=>x.id===id),ver=rec?rec._version:null;const r=originals.updateQual.apply(this,arguments);if(rec&&backendReady()&&authed())syncOrReload(SchoolOsBackend.upsertOpportunity(rec,ver),rec,'Cập nhật cơ hội').catch(()=>{});return r;};

    originals.saveInteraction=window.saveInteraction;
    if(originals.saveInteraction)window.saveInteraction=async function(){const s=window.state.schools.find(x=>x.id===window.current),ver=s?s._version:null;const r=await originals.saveInteraction.apply(this,arguments);if(s&&backendReady()&&authed())await syncOrReload(SchoolOsBackend.upsertSchool(s,ver),s,'Cập nhật trường').catch(()=>{});return r;};
  }

  function patchBackendStatus(){
    originals.updateBackendStatus=window.updateBackendStatus;
    window.updateBackendStatus=function(){if(originals.updateBackendStatus)originals.updateBackendStatus.apply(this,arguments);cleanProductionUi();};
  }

  async function init(){
    installAuthUi();patchMutations();patchBackendStatus();cleanProductionUi();
    if(!backendReady())return;
    if(!authed())return showLogin();
    try{await SchoolOsBackend.me();await afterAuth();}catch(e){showLogin();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.SchoolOsMultiUser={loadRecords,afterAuth,showLogin};
})();
