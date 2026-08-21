/* Sunbot School OS V3 runtime backend integration v0.1 */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const DOC_KEY='sunbot-school-os-docs';
  let originals={};

  function docs(){try{return JSON.parse(localStorage.getItem(DOC_KEY)||'{}')}catch(e){return{}}}
  function nowVi(){return new Date().toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}
  function safe(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

  function installUi(){
    const top=document.querySelector('.top');
    const avatar=top&&top.querySelector('.avatar');
    if(top&&avatar&&!$('backendBtn')){
      const b=document.createElement('button');
      b.id='backendBtn';b.className='btn manager-only';b.type='button';b.onclick=openBackendForm;
      top.insertBefore(b,avatar);
    }
    if(!$('backendForm')){
      const wrap=document.createElement('div');
      wrap.innerHTML=`<div class="modal" id="backendForm"><div class="modalbox"><h2>Kết nối School OS Backend</h2><div class="muted">Chỉ quản lý cần cấu hình một lần trên thiết bị. Staff không phải thao tác phần này.</div><div class="form"><div class="field full"><label>Web App URL (Apps Script)</label><input id="beUrl" placeholder="https://script.google.com/macros/s/.../exec"></div><div class="field full"><label>API key</label><input id="beKey" type="password" placeholder="API key từ schoolOsSetup()"></div><div class="field full"><label>Link gốc Sunbot Profile 2026</label><input id="docProfile" placeholder="https://drive.google.com/... hoặc link public"></div><div class="field full"><label>Link gốc Proposal chương trình</label><input id="docProposal" placeholder="https://drive.google.com/... hoặc link public"></div><div class="field full"><label>Link gốc Báo giá</label><input id="docQuote" placeholder="https://drive.google.com/... hoặc link public"></div></div><div class="modalactions"><button class="btn" id="beTest">Kiểm tra kết nối</button><button class="btn" id="beCancel">Hủy</button><button class="btn primary" id="beSave">Lưu cấu hình</button></div></div></div>`;
      document.body.appendChild(wrap.firstElementChild);
      $('beTest').onclick=testBackend;$('beCancel').onclick=()=>closeBackend();$('beSave').onclick=saveBackendConfig;
    }
    updateBackendStatus();
  }

  function openBackendForm(){
    const c=window.SchoolOsBackend?.config?.()||{},d=docs();
    $('beUrl').value=c.url||'';$('beKey').value=c.apiKey||'';
    $('docProfile').value=d['Sunbot Profile 2026']||'';
    $('docProposal').value=d['Proposal chương trình']||'';
    $('docQuote').value=d['Báo giá']||'';
    $('backendForm').classList.add('open');
  }
  function closeBackend(){$('backendForm')?.classList.remove('open');}
  function saveBackendConfig(){
    if(!window.SchoolOsBackend)return window.toast?.('Không tải được backend adapter');
    SchoolOsBackend.saveConfig($('beUrl').value,$('beKey').value);
    localStorage.setItem(DOC_KEY,JSON.stringify({
      'Sunbot Profile 2026':$('docProfile').value.trim(),
      'Proposal chương trình':$('docProposal').value.trim(),
      'Báo giá':$('docQuote').value.trim()
    }));
    closeBackend();updateBackendStatus();window.toast?.('Đã lưu cấu hình backend');
  }
  async function testBackend(){
    if(!window.SchoolOsBackend)return window.toast?.('Không tải được backend adapter');
    SchoolOsBackend.saveConfig($('beUrl').value,$('beKey').value);
    try{await SchoolOsBackend.health();window.toast?.('Kết nối backend thành công');updateBackendStatus();}
    catch(e){window.toast?.('Kết nối thất bại: '+e.message);}
  }
  function updateBackendStatus(){
    const b=$('backendBtn');if(!b)return;
    const live=!!window.SchoolOsBackend?.isConfigured?.();
    b.textContent=live?'Backend: Đã kết nối':'Backend: Demo';
    b.classList.toggle('soft',live);
  }

  async function sendEmailLive(){
    const s=window.state?.schools?.find(x=>x.id===window.current);
    if(!s)return window.toast?.('Chưa chọn trường');
    const doc=$('emailDoc')?.value||'',to=$('emailContact')?.value||'',subject=$('emailSubject')?.value.trim()||'',body=$('emailBody')?.value.trim()||'';
    if(!to.includes('@'))return window.toast?.('Người liên hệ chưa có email hợp lệ');
    if(!subject||!body)return window.toast?.('Cần có tiêu đề và nội dung email');
    if(!window.SchoolOsBackend?.isConfigured?.()){
      s.events=s.events||[];
      s.events.unshift({type:'email',title:'Email demo: '+subject,detail:`Tới ${to}${doc?' · Link demo: '+doc:''}`,at:nowVi(),local:true});
      window.closeModal?.('emailForm');window.refresh?.();window.openSchool?.(s.id);window.currentTab='engagement';window.renderDrawer?.();
      return window.toast?.('Đang ở chế độ demo; chưa gửi email thật');
    }
    const d=docs(),docUrl=doc?d[doc]||'':'';
    if(doc&&!docUrl)return window.toast?.('Chưa cấu hình link gốc cho tài liệu này');
    const contact=(s.contacts||[]).find(c=>c.email===to)||{};
    try{
      window.toast?.('Đang gửi email...');
      const result=await SchoolOsBackend.sendEmail({
        school_id:s.id,school_name:s.name,contact_name:contact.name||'',to_email:to,
        subject,html_body:safe(body).replace(/\n/g,'<br>'),text_body:body,
        template_key:$('emailTpl')?.value||'',sent_by:s.owner,sender_name:'Sunbot',
        documents:doc?[{document_id:doc,document_name:doc,destination_url:docUrl}]:[]
      });
      s.events=s.events||[];
      s.events.unshift({id:result.email_id,type:'email',title:'Đã gửi email: '+subject,detail:`Tới ${to}${doc?' · Có link theo dõi: '+doc:''}`,at:nowVi(),local:true});
      window.closeModal?.('emailForm');window.refresh?.();window.openSchool?.(s.id);window.currentTab='engagement';window.renderDrawer?.();
      window.toast?.('Email đã gửi và được ghi dấu vết');
    }catch(e){window.toast?.('Gửi email lỗi: '+e.message);}
  }

  async function syncSchoolActivity(schoolId,silent){
    if(!window.SchoolOsBackend?.isConfigured?.())return !silent&&window.toast?.('Backend chưa được kết nối');
    const s=window.state?.schools?.find(x=>x.id===schoolId);if(!s)return;
    try{
      const r=await SchoolOsBackend.getActivity(schoolId,100);s.events=s.events||[];
      const seen=new Set(s.events.map(e=>e.id).filter(Boolean));
      for(const a of (r.activities||[])){
        if(seen.has(a.event_id))continue;
        s.events.push({
          id:a.event_id,
          type:a.event_type==='LINK_OPENED'?'open':a.event_type==='EMAIL_SENT'?'email':'manual',
          title:a.summary||a.event_type,
          detail:[a.channel,a.actor].filter(Boolean).join(' · '),
          at:new Date(a.timestamp).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),
          hot:String(a.hot_signal).toUpperCase()==='TRUE'||a.hot_signal===true
        });
      }
      window.refresh?.();if(window.current===schoolId)window.renderDrawer?.();
      if(!silent)window.toast?.('Đã đồng bộ dấu vết mới');
    }catch(e){if(!silent)window.toast?.('Đồng bộ lỗi: '+e.message);}
  }

  function enhanceEngagement(){
    if(window.currentTab!=='engagement')return;
    const body=$('dBody'),head=body&&body.querySelector('.sectionhead div:last-child');
    if(head&&!body.querySelector('[data-sync-tracking]')){
      const b=document.createElement('button');b.className='btn small';b.textContent='Đồng bộ dấu vết';b.dataset.syncTracking='1';
      b.onclick=()=>syncSchoolActivity(window.current,false);head.appendChild(document.createTextNode(' '));head.appendChild(b);
    }
  }

  function patchGlobals(){
    originals.sendEmail=window.sendEmail;
    window.sendEmail=sendEmailLive;

    originals.openSchool=window.openSchool;
    if(originals.openSchool)window.openSchool=function(id){const r=originals.openSchool.apply(this,arguments);syncSchoolActivity(id,true);return r;};

    originals.renderDrawer=window.renderDrawer;
    if(originals.renderDrawer)window.renderDrawer=function(){const r=originals.renderDrawer.apply(this,arguments);enhanceEngagement();return r;};

    originals.saveInteraction=window.saveInteraction;
    if(originals.saveInteraction)window.saveInteraction=async function(){
      const s=window.state?.schools?.find(x=>x.id===window.current);
      const summary=$('ir')?.value.trim()||'',actor=$('io')?.value||'',channel=$('ic')?.value||'';
      const r=originals.saveInteraction.apply(this,arguments);
      if(s&&summary&&window.SchoolOsBackend?.isConfigured?.()){
        try{await SchoolOsBackend.logActivity({school_id:s.id,school_name:s.name,event_type:'MANUAL_ACTIVITY',actor,channel,summary,detail:{next_action:s.action,risk:s.risk}});}catch(e){console.warn(e);}
      }
      return r;
    };

    originals.setMode=window.setMode;
    if(originals.setMode)window.setMode=function(){const r=originals.setMode.apply(this,arguments);updateBackendStatus();return r;};
  }

  function init(){installUi();patchGlobals();updateBackendStatus();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.SchoolOsRuntime={syncSchoolActivity,openBackendForm,updateBackendStatus};
})();
