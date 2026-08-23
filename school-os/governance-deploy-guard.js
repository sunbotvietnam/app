/* Guard governance features until deployed backend reports v0.4+ */
(function(){
'use strict';
let ready=false;
function versionOk(v){const n=parseFloat(String(v||'0').replace(/[^0-9.]/g,''));return n>=0.4;}
function setLoginMode(on){const le=document.getElementById('loginEmail');if(!le)return;const lab=le.closest('.field')?.querySelector('label');if(on){le.type='text';le.placeholder='van, nhung, dung, thu... hoặc email';if(lab)lab.textContent='Tài khoản hoặc email';}else{le.type='email';le.placeholder='ten@sunbot.vn';if(lab)lab.textContent='Email';}}
function blockDirectSchool(){const f=function(){window.toast?.('Thêm trường trực tiếp đã bị khóa. Trường mới phải qua luồng Đề xuất → Admin duyệt; backend quản trị đang chờ cập nhật.')};f.__governed=true;window.addSchool=f;}
function hideGovernance(){['proposalBtn','approvalBtn','userAdminBtn'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none'});setLoginMode(false);blockDirectSchool();}
function showGovernance(){['proposalBtn','approvalBtn','userAdminBtn'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display=''});setLoginMode(true);}
async function check(){try{const h=await window.SchoolOsBackend?.health?.();ready=versionOk(h?.version);}catch(e){ready=false;}if(ready)showGovernance();else hideGovernance();}
function init(){setTimeout(check,300);setTimeout(check,1400);setTimeout(check,3000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.SchoolOsGovernanceDeploy={check,isReady:()=>ready};
})();
