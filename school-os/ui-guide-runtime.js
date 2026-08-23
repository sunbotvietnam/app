/* Sunbot School OS - role-aware guidance and UI polish */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let originals={};

  const TAB_HELP={
    overview:'Xem tình hình hiện tại và việc cần làm tiếp theo. Trường đang theo dõi nên luôn có bước tiếp theo và hạn xử lý.',
    people:'Ghi đúng người quyết định, người ảnh hưởng và đầu mối tài chính. Không dùng phần này như một danh bạ đơn thuần.',
    engagement:'Sau mỗi cuộc gọi, họp hoặc email, ghi kết quả chính và việc cần làm tiếp theo.',
    tasks:'Mỗi việc cần có nội dung rõ, người phụ trách và hạn hoàn thành. Không dùng phần này để lưu ghi chú.',
    opps:'Chỉ tạo Cơ hội khi trường có tín hiệu kinh doanh thật. Cập nhật theo thông tin thực tế, không ước lượng cảm tính.',
    renewal:'Theo dõi khả năng tiếp tục, mở rộng và những nội dung cần bàn giao khi đã chốt.'
  };

  const STAFF_GUIDE=`
    <div class="guide-intro"><b>Mục tiêu</b><p>Mỗi ngày biết rõ trường nào cần xử lý, việc gì phải làm và hạn nào cần chú ý.</p></div>
    <div class="guide-steps">
      <div><span>1</span><b>Hôm nay</b><p>Xử lý việc đến hạn, trường cần chú ý và phản hồi mới.</p></div>
      <div><span>2</span><b>Trường học</b><p>Xem tình hình, đầu mối, bước tiếp theo và hạn xử lý của từng trường.</p></div>
      <div><span>3</span><b>Giao tiếp</b><p>Sau cuộc gọi, họp hoặc email, ghi kết quả và việc tiếp theo. Không chỉ ghi “đã gọi”.</p></div>
      <div><span>4</span><b>Công việc</b><p>Tạo việc khi có hành động cụ thể; luôn ghi người phụ trách và hạn.</p></div>
      <div><span>5</span><b>Cơ hội</b><p>Chỉ tạo khi trường có tín hiệu kinh doanh thật; cập nhật giai đoạn khi tình hình thay đổi.</p></div>
    </div>
    <div class="guide-rule"><b>Cuối ngày:</b> xử lý việc quá hạn và bảo đảm mọi trường đang theo dõi đều có bước tiếp theo.</div>`;

  const MANAGER_GUIDE=`
    <div class="guide-intro"><b>Mục tiêu</b><p>Biết chỗ nào cần can thiệp, ai đang vướng và cơ hội nào cần ưu tiên.</p></div>
    <div class="guide-steps">
      <div><span>1</span><b>Hôm nay</b><p>Xem trường rủi ro, việc quá hạn, cơ hội đứng yên và phản hồi quan trọng chưa xử lý.</p></div>
      <div><span>2</span><b>Hiệu suất bán hàng</b><p>Xem nỗ lực, kỷ luật hoàn thành, chất lượng cơ hội và kết quả. Không đánh giá chỉ bằng số cuộc gọi.</p></div>
      <div><span>3</span><b>Cơ hội</b><p>Kiểm tra nhu cầu, người quyết định, nguồn tiền, thời điểm, chính sách và khả năng triển khai.</p></div>
      <div><span>4</span><b>Dự báo & gia hạn</b><p>Xem giá trị dự kiến, thời điểm có thể chốt và trường cần gia hạn trước 60–90 ngày.</p></div>
      <div><span>5</span><b>Hướng dẫn nhân viên</b><p>Khi một cơ hội đứng yên, hỏi “đang vướng ở đâu và bước tiếp theo là gì?” thay vì chỉ hỏi “sao chưa chốt?”.</p></div>
    </div>
    <div class="guide-rule"><b>Nguyên tắc:</b> danh sách cơ hội phải phản ánh đúng thực tế. Cơ hội không còn khả năng tiếp tục cần được cập nhật, không giữ lại để làm đẹp số liệu.</div>`;

  function managerRole(){
    const u=window.SchoolOsBackend?.currentUser?.();
    if(u)return ['SUPER_ADMIN','ADMIN','LEADER'].includes(u.role);
    return $('roleMode')?.value==='manager';
  }

  function installStyle(){
    if($('guideStyle'))return;
    const s=document.createElement('style');s.id='guideStyle';s.textContent=`
      .context-help{margin:0 0 14px;padding:10px 12px;border:1px solid #e7eaee;border-radius:10px;background:#f8f9fb;color:#66707c;font-size:11px;line-height:1.5}
      .guide-modal .modalbox{width:min(760px,96vw);padding:0;overflow:hidden}.guide-head{padding:20px 22px 14px;border-bottom:1px solid var(--line);display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.guide-head h2{margin:0;font-size:20px}.guide-head p{margin:4px 0 0;color:var(--muted);font-size:12px}.guide-body{padding:18px 22px 22px}.guide-switch{display:flex;gap:6px;margin-bottom:14px}.guide-switch button{border:1px solid var(--line);background:#fff;border-radius:9px;padding:7px 10px;font-size:11px;font-weight:750;color:#66707c}.guide-switch button.active{background:#252b33;color:#fff;border-color:#252b33}.guide-intro{padding:12px 13px;background:#fff7f1;border:1px solid #ffd9bd;border-radius:11px;margin-bottom:12px}.guide-intro b{font-size:12px}.guide-intro p{margin:4px 0 0;color:#6e6259;font-size:11px;line-height:1.5}.guide-steps{display:grid;gap:7px}.guide-steps>div{display:grid;grid-template-columns:28px 120px 1fr;gap:9px;align-items:start;padding:9px 0;border-bottom:1px solid #edf0f3}.guide-steps>div:last-child{border-bottom:0}.guide-steps span{width:24px;height:24px;border-radius:8px;background:#f1f3f5;display:grid;place-items:center;font-size:10px;font-weight:850}.guide-steps b{font-size:12px;padding-top:3px}.guide-steps p{margin:2px 0 0;color:var(--muted);font-size:11px;line-height:1.45}.guide-rule{margin-top:12px;padding:11px 12px;border-radius:10px;background:#f7f8fa;color:#5e6874;font-size:11px;line-height:1.5}.guide-btn{white-space:nowrap}
      @media(max-width:700px){.guide-btn{width:34px;height:34px;padding:0;font-size:0}.guide-btn:after{content:'?';font-size:15px;font-weight:850}.guide-steps>div{grid-template-columns:28px 1fr}.guide-steps p{grid-column:2}.context-help{font-size:10.5px}}
    `;document.head.appendChild(s);
  }

  function installGuide(){
    installStyle();
    const top=document.querySelector('.top'),avatar=top?.querySelector('.avatar');
    if(top&&avatar&&!$('guideBtn')){
      const b=document.createElement('button');b.id='guideBtn';b.className='btn guide-btn';b.textContent='Hướng dẫn';b.title='Hướng dẫn sử dụng';b.onclick=openGuide;top.insertBefore(b,avatar);
    }
    if(!$('guideModal')){
      const m=document.createElement('div');m.className='modal guide-modal';m.id='guideModal';
      m.innerHTML=`<div class="modalbox"><div class="guide-head"><div><h2>Hướng dẫn nhanh</h2><p id="guideSubtitle"></p></div><button class="close" id="guideClose" aria-label="Đóng">×</button></div><div class="guide-body"><div class="guide-switch" id="guideSwitch"></div><div id="guideContent"></div></div></div>`;
      document.body.appendChild(m);$('guideClose').onclick=closeGuide;m.onclick=e=>{if(e.target===m)closeGuide();};
    }
  }

  function openGuide(){
    const mgr=managerRole();
    $('guideSwitch').innerHTML=mgr?'<button data-guide="manager" class="active">Quản lý</button><button data-guide="staff">Nhân viên</button>':'';
    if(mgr)$('guideSwitch').querySelectorAll('button').forEach(b=>b.onclick=()=>showGuide(b.dataset.guide));
    showGuide(mgr?'manager':'staff');$('guideModal').classList.add('open');
  }
  function closeGuide(){$('guideModal')?.classList.remove('open');}
  function showGuide(kind){
    const mgr=kind==='manager';$('guideSubtitle').textContent=mgr?'Tập trung vào chỗ cần can thiệp và bước tiếp theo.':'Đúng việc, đúng trường, đúng thời điểm.';
    $('guideContent').innerHTML=mgr?MANAGER_GUIDE:STAFF_GUIDE;
    $('guideSwitch')?.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.guide===kind));
  }

  function contextualHelp(){
    const body=$('dBody');if(!body)return;
    body.querySelector('.context-help')?.remove();
    const msg=TAB_HELP[window.currentTab];if(!msg)return;
    const d=document.createElement('div');d.className='context-help';d.textContent=msg;body.prepend(d);
  }

  function cleanVisibleCopy(){
    document.title='Sunbot School OS';
    document.querySelectorAll('.brand small').forEach(x=>x.textContent='Phát triển trường');
    const forecast=$('forecast');if(forecast){
      const small=forecast.querySelector('.sectionhead small');if(small&&/demo/i.test(small.textContent))small.textContent='Giá trị dự kiến theo tiến độ';
    }
    const b=$('backendBtn'),u=window.SchoolOsBackend?.currentUser?.();
    if(b){
      if(u?.role==='SUPER_ADMIN'){b.textContent='Cài đặt';b.style.display='';}
      else b.style.display='none';
    }
    const body=$('dBody');if(body&&window.currentTab==='renewal'){
      body.querySelectorAll('.recommend p').forEach(p=>{
        if(/school_id|Sales OS|không nhồi/i.test(p.textContent))p.textContent='Khi đã chốt, cần bàn giao đủ: hợp đồng, mức học phí, số trẻ, chương trình, robot, giáo viên, lịch bắt đầu và các cam kết đặc biệt.';
      });
    }
  }

  function patch(){
    originals.renderDrawer=window.renderDrawer;
    if(originals.renderDrawer)window.renderDrawer=function(){const r=originals.renderDrawer.apply(this,arguments);cleanVisibleCopy();contextualHelp();return r;};
    originals.refresh=window.refresh;
    if(originals.refresh)window.refresh=function(){const r=originals.refresh.apply(this,arguments);cleanVisibleCopy();return r;};
    originals.setMode=window.setMode;
    if(originals.setMode)window.setMode=function(){const r=originals.setMode.apply(this,arguments);cleanVisibleCopy();return r;};
  }

  function init(){installGuide();patch();cleanVisibleCopy();contextualHelp();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.SchoolOsGuide={open:openGuide,close:closeGuide};
})();
