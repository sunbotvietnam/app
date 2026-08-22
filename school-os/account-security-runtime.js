/* Sunbot School OS - account security and role UI hardening */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const B=()=>window.SchoolOsBackend;
function user(){return B()?.currentUser?.()||null;}
function roleLabel(r){return r==='ADMIN'||r==='SUPER_ADMIN'?'Quản trị viên':r==='LEADER'?'Quản lý':'Nhân viên';}
function ensureUi(){
  const top=document.querySelector('.top'),avatar=top?.querySelector('.avatar');
  if(top&&avatar&&!$('accountBtn')){
    const b=document.createElement('button');b.id='accountBtn';b.className='btn';b.textContent='Tài khoản';b.onclick=openAccount;top.insertBefore(b,$('logoutBtn')||avatar);
  }
  if(!$('accountModal')){
    const m=document.createElement('div');m.id='accountModal';m.className='modal';m.innerHTML=`<div class="modalbox" style="width:min(520px,96vw)">
      <h2>Tài khoản của tôi</h2><p class="muted" id="accountInfo"></p>
      <div class="form" style="grid-template-columns:1fr">
        <div class="field"><label>Mật khẩu hiện tại</label><input id="pwCurrent" type="password" autocomplete="current-password"></div>
        <div class="field"><label>Mật khẩu mới</label><input id="pwNew" type="password" autocomplete="new-password"><small class="muted">Mật khẩu mới cần ít nhất 8 ký tự.</small></div>
        <div class="field"><label>Nhập lại mật khẩu mới</label><input id="pwConfirm" type="password" autocomplete="new-password"></div>
      </div>
      <div id="pwError" style="min-height:20px;color:#b83b3b;font-size:12px;margin-top:8px"></div>
      <div class="modalactions"><button class="btn" id="accountClose">Đóng</button><button class="btn primary" id="pwSave">Đổi mật khẩu</button></div>
    </div>`;
    document.body.appendChild(m);$('accountClose').onclick=()=>m.classList.remove('open');$('pwSave').onclick=changePassword;
  }
}
function openAccount(){
  const u=user();if(!u)return;
  $('accountInfo').textContent=(u.name||u.email)+' · '+u.email+' · '+roleLabel(u.role);
  $('pwCurrent').value='';$('pwNew').value='';$('pwConfirm').value='';$('pwError').textContent='';$('accountModal').classList.add('open');
}
async function changePassword(){
  const cur=$('pwCurrent').value,nw=$('pwNew').value,cf=$('pwConfirm').value,btn=$('pwSave');$('pwError').textContent='';
  if(!cur)return $('pwError').textContent='Nhập mật khẩu hiện tại.';
  if(nw.length<8)return $('pwError').textContent='Mật khẩu mới cần ít nhất 8 ký tự.';
  if(nw!==cf)return $('pwError').textContent='Hai lần nhập mật khẩu mới chưa giống nhau.';
  btn.disabled=true;btn.textContent='Đang đổi...';
  try{await B().changePassword(cur,nw);B().clearSession();$('accountModal').classList.remove('open');window.toast?.('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');setTimeout(()=>window.SchoolOsMultiUser?.showLogin?.(),150);}
  catch(e){$('pwError').textContent=String(e?.message||e).replace(/^Error:\s*/,'');}
  finally{btn.disabled=false;btn.textContent='Đổi mật khẩu';}
}
function hardenRoleUi(){
  const u=user();if(!u)return;
  const isAdmin=['ADMIN','SUPER_ADMIN'].includes(u.role),isStaff=u.role==='STAFF';
  document.body.classList.toggle('manager',!isStaff);
  document.querySelectorAll('.manager-only').forEach(el=>el.style.display=isStaff?'none':'');
  const mode=$('roleMode');if(mode){mode.value=isStaff?'staff':'manager';mode.style.display=isAdmin?'':'none';}
  const addSchool=[...document.querySelectorAll('button')].find(b=>/thêm trường/i.test(b.textContent||''));if(addSchool&&isStaff)addSchool.style.display='none';
}
function patchAfterAuth(){
  const mu=window.SchoolOsMultiUser;if(!mu?.afterAuth)return;
  const orig=mu.afterAuth;mu.afterAuth=async function(){const r=await orig.apply(this,arguments);ensureUi();hardenRoleUi();return r;};
}
function init(){ensureUi();hardenRoleUi();patchAfterAuth();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.SchoolOsAccountSecurity={openAccount,changePassword,hardenRoleUi};
})();
