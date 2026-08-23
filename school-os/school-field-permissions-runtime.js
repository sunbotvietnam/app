/* Sunbot School OS - role-aware school field permissions */
(function(){
'use strict';
const ALL_STATUS=['Chưa tiếp cận','Đang tiếp cận','Đang chờ phản hồi','Có tín hiệu quan tâm','Đã phản hồi','Đã hẹn trao đổi','Có cơ hội','Đang đề xuất','Đã chốt','Đang triển khai','Đang triển khai – chờ phản hồi','Tái kích hoạt – chờ phản hồi','Theo dõi','Cần kênh tiếp cận khác','Cần xác minh dữ liệu','Theo dõi sau sáp nhập','Đã chuyển đầu mối','Theo dõi – không ưu tiên','Tạm dừng','Không ưu tiên','Không thành công','Sáp nhập','Gia hạn'];
const LEADER_STATUS=['Chưa tiếp cận','Đang tiếp cận','Đang chờ phản hồi','Có tín hiệu quan tâm','Đã phản hồi','Đã hẹn trao đổi','Có cơ hội','Đang đề xuất','Đang triển khai','Đang triển khai – chờ phản hồi','Tái kích hoạt – chờ phản hồi','Theo dõi','Cần kênh tiếp cận khác','Cần xác minh dữ liệu'];
function role(){return String(window.SchoolOsBackend?.currentUser?.()?.role||'STAFF').toUpperCase();}
function currentSchool(){return (window.state?.schools||[]).find(s=>s.id===window.current)||null;}
function setDisabled(id,disabled,reason){const el=document.getElementById(id);if(!el)return;el.disabled=!!disabled;const f=el.closest('.field');if(f){f.style.opacity=disabled?'.68':'';let note=f.querySelector('.permission-note');if(disabled&&!note){note=document.createElement('div');note.className='form-note permission-note';note.textContent=reason||'Trường thông tin này do cấp quản lý cập nhật.';f.appendChild(note)}else if(!disabled&&note)note.remove();}}
function fillStatus(){const el=document.getElementById('esStatus'),s=currentSchool();if(!el||!s)return;const r=role(),list=r==='ADMIN'?ALL_STATUS:r==='LEADER'?LEADER_STATUS:[s.status||'Chưa tiếp cận'];const values=[s.status,...list].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);el.innerHTML=values.map(v=>'<option value="'+String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">'+v+'</option>').join('');el.value=s.status||values[0]||'';}
function apply(){const m=document.getElementById('schoolEditForm');if(!m||!m.classList.contains('open'))return;const r=role();fillStatus();if(r==='ADMIN'){
 ['esRegion','esType','esStatus','esOwner','esAction','esDate','esRisk','esChildren','esSource','esSteam','esPolicy','esRenewal'].forEach(id=>setDisabled(id,false));
}else if(r==='LEADER'){
 ['esRegion','esType','esSource'].forEach(id=>setDisabled(id,true,'Dữ liệu nền do Admin quản trị.'));['esStatus','esOwner','esAction','esDate','esRisk','esChildren','esSteam','esPolicy','esRenewal'].forEach(id=>setDisabled(id,false));
}else{
 ['esRegion','esType','esStatus','esOwner','esSource','esRenewal'].forEach(id=>setDisabled(id,true,'Nhân viên không có quyền thay đổi trường thông tin quản trị này.'));['esAction','esDate','esRisk','esChildren','esSteam','esPolicy'].forEach(id=>setDisabled(id,false));
}
let banner=m.querySelector('#schoolPermissionBanner');if(!banner){banner=document.createElement('div');banner.id='schoolPermissionBanner';banner.style.cssText='margin:10px 0 4px;padding:9px 11px;border-radius:10px;background:#f7f8fa;color:#68707c;font-size:11px;line-height:1.45';m.querySelector('.form')?.before(banner)}banner.textContent=r==='ADMIN'?'Quản trị viên: có quyền cập nhật toàn bộ hồ sơ.':r==='LEADER'?'Trưởng nhóm: cập nhật vận hành và trạng thái trong nhóm; dữ liệu nền do Admin quản trị.':'Nhân viên: cập nhật thông tin thực địa và bước tiếp theo; các trường quản trị được khóa.';
}
const obs=new MutationObserver(()=>apply());obs.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
setInterval(apply,700);
})();
