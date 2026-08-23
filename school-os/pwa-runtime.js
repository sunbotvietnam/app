/* Sunbot School OS PWA install + update runtime */
(function(){
'use strict';
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
let deferredPrompt=null;
function addMeta(name,content){if(document.querySelector(`meta[name="${name}"]`))return;const m=document.createElement('meta');m.name=name;m.content=content;document.head.appendChild(m);}
function ensureHead(){
  if(!document.querySelector('link[rel="manifest"]')){const l=document.createElement('link');l.rel='manifest';l.href='manifest.webmanifest';document.head.appendChild(l);}
  if(!document.querySelector('link[rel="icon"]')){const l=document.createElement('link');l.rel='icon';l.href='icon.svg';l.type='image/svg+xml';document.head.appendChild(l);}
  if(!document.querySelector('link[rel="apple-touch-icon"]')){const l=document.createElement('link');l.rel='apple-touch-icon';l.href='apple-touch-icon.png';document.head.appendChild(l);}
  addMeta('theme-color','#f47a2a');
  addMeta('apple-mobile-web-app-capable','yes');
  addMeta('apple-mobile-web-app-status-bar-style','default');
  addMeta('apple-mobile-web-app-title','Sunbot School');
  addMeta('mobile-web-app-capable','yes');
}
function toast(msg){if(window.toast)return window.toast(msg);let t=document.getElementById('pwaToast');if(!t){t=document.createElement('div');t.id='pwaToast';t.style.cssText='position:fixed;left:50%;bottom:78px;transform:translateX(-50%);z-index:9999;background:#1d2530;color:#fff;padding:10px 14px;border-radius:10px;font:600 12px system-ui;box-shadow:0 8px 28px rgba(0,0,0,.2);max-width:90vw;text-align:center';document.body.appendChild(t);}t.textContent=msg;setTimeout(()=>t.remove(),3500);}
function modalIOS(){
  let m=document.getElementById('pwaInstallHelp');if(m)m.remove();m=document.createElement('div');m.id='pwaInstallHelp';m.style.cssText='position:fixed;inset:0;z-index:10000;background:rgba(17,24,39,.48);display:grid;place-items:end center;padding:16px';
  m.innerHTML='<div style="width:min(520px,100%);background:#fff;border-radius:20px;padding:20px;font-family:system-ui;color:#1d2530;box-shadow:0 24px 80px rgba(0,0,0,.28)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><b style="font-size:18px">Cài Sunbot lên iPhone/iPad</b><p style="margin:6px 0 14px;color:#68717d;font-size:13px">Safari không hiện nút cài tự động. Làm 3 bước sau:</p></div><button id="pwaClose" style="border:0;background:#f1f3f5;border-radius:9px;width:34px;height:34px;font-size:18px">×</button></div><ol style="margin:0;padding-left:21px;line-height:1.7;font-size:14px"><li>Mở trang này bằng <b>Safari</b>.</li><li>Chạm nút <b>Chia sẻ</b> (Share).</li><li>Chọn <b>Thêm vào Màn hình chính</b> (Add to Home Screen) rồi xác nhận.</li></ol><p style="margin:14px 0 0;color:#68717d;font-size:12px">Sau khi cài, icon Sunbot sẽ nằm trên màn hình và mở như một ứng dụng độc lập.</p></div>';
  document.body.appendChild(m);m.querySelector('#pwaClose').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove();};
}
function makeInstallButton(){
  if(isStandalone()||document.getElementById('pwaInstallBtn'))return;
  const btn=document.createElement('button');btn.id='pwaInstallBtn';btn.textContent='Cài ứng dụng';btn.title='Cài Sunbot lên điện thoại';btn.style.cssText='border:1px solid #ffd1b2;background:#fff7ef;color:#a9531e;border-radius:10px;padding:8px 11px;font:750 12px system-ui;white-space:nowrap';
  btn.onclick=async()=>{
    if(isIOS()){modalIOS();return;}
    if(deferredPrompt){deferredPrompt.prompt();const choice=await deferredPrompt.userChoice;deferredPrompt=null;if(choice&&choice.outcome==='accepted')btn.remove();return;}
    toast('Trên Android: mở menu trình duyệt → Cài đặt ứng dụng / Thêm vào màn hình chính.');
  };
  const top=document.querySelector('.top');if(top){const avatar=top.querySelector('.avatar');if(avatar)top.insertBefore(btn,avatar);else top.appendChild(btn);}else{btn.style.cssText+=';position:fixed;right:14px;top:14px;z-index:5000';document.body.appendChild(btn);}
}
function installEvents(){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;makeInstallButton();});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;document.getElementById('pwaInstallBtn')?.remove();toast('Đã cài Sunbot – Phát triển trường.');});
}
async function registerSW(){
  if(!('serviceWorker' in navigator))return;
  try{
    const reg=await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
    reg.update().catch(()=>{});
    if(reg.waiting){reg.waiting.postMessage({type:'SKIP_WAITING'});}
    reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){w.postMessage({type:'SKIP_WAITING'});toast('Sunbot vừa có bản cập nhật mới. Bản mới sẽ dùng ở lần mở tiếp theo.');}});});
  }catch(e){console.warn('School OS PWA service worker:',e);}
}
function init(){ensureHead();installEvents();registerSW();if(!isStandalone()&&isIOS())makeInstallButton();setTimeout(()=>{if(!isStandalone()&&deferredPrompt)makeInstallButton();},1200);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.SchoolOsPWA={install:()=>{if(isIOS())return modalIOS();makeInstallButton();document.getElementById('pwaInstallBtn')?.click();},isStandalone};
})();
