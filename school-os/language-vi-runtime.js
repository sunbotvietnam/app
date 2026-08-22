/* Sunbot School OS - Vietnamese-first language layer */
(function(){
  'use strict';

  // Chỉ đổi chữ người dùng nhìn thấy. Không đổi mã dữ liệu, API hay tên trường.
  const replacements = [
    // Cụm dài: ưu tiên câu tự nhiên, ngắn, rõ hành động.
    [/Theo dõi sau tiếp cận đã thực hiện;\s*/gi,''],
    [/Follow-up sau khi gửi hồ sơ/gi,'Theo dõi sau khi gửi hồ sơ'],
    [/Follow-up hồ sơ đã gửi/gi,'Theo dõi hồ sơ đã gửi'],
    [/Follow-up account brief đã gửi/gi,'Theo dõi hồ sơ trường đã gửi'],
    [/Follow-up account hiện hữu/gi,'Trao đổi với trường đang hợp tác'],
    [/Cần tập trung follow-up đúng hạn\.?/gi,'Cần xử lý các việc đến hạn đúng thời gian.'],
    [/tín hiệu nóng chưa được follow-up/gi,'tín hiệu quan tâm cao chưa được xử lý'],
    [/pipeline phải phản ánh thực tế/gi,'Danh sách cơ hội phải phản ánh đúng thực tế'],
    [/chất lượng pipeline/gi,'chất lượng cơ hội'],
    [/Giá trị cơ hội quy đổi/gi,'Giá trị dự kiến theo tiến độ'],
    [/route-to-school/gi,'cách tiếp cận trường'],
    [/site minh chứng/gi,'điểm minh chứng'],
    [/account brief/gi,'hồ sơ tóm tắt của trường'],
    [/account review/gi,'rà soát trường đang hợp tác'],
    [/teacher-transfer/gi,'chuyển giao cho giáo viên'],
    [/decision maker/gi,'người quyết định'],
    [/hot signal/gi,'tín hiệu quan tâm cao'],
    [/tracked link/gi,'liên kết theo dõi'],
    [/cold outreach/gi,'tiếp cận chủ động'],
    [/win rate/gi,'tỷ lệ chốt'],
    [/weighted pipeline/gi,'giá trị dự kiến theo tiến độ'],

    // Vai trò và thao tác.
    [/\bSUPER_ADMIN\b/g,'Quản trị cao nhất'],
    [/\bStaff\b/gi,'Nhân viên'],
    [/\bManager\b/gi,'Quản lý'],
    [/\bAdmin\b/gi,'Quản trị viên'],
    [/\bOwner\b/gi,'Người phụ trách'],
    [/\bCoaching\b/gi,'Hướng dẫn nhân viên'],

    // Bán hàng / quản lý quan hệ.
    [/\bfollow-up\b/gi,'theo dõi'],
    [/\bpipeline\b/gi,'danh sách cơ hội'],
    [/\bforecast\b/gi,'dự báo'],
    [/\brenewal\b/gi,'gia hạn'],
    [/\bchurn\b/gi,'nguy cơ dừng hợp tác'],
    [/\bdiscovery\b/gi,'trao đổi tìm hiểu nhu cầu'],
    [/\bstakeholder\b/gi,'người liên quan'],
    [/\blead\b/gi,'trường tiềm năng'],
    [/\bprospect\b/gi,'trường tiềm năng'],
    [/\bopportunity\b/gi,'cơ hội'],
    [/\bopportunities\b/gi,'cơ hội'],
    [/\bstage\b/gi,'giai đoạn'],
    [/\bactivity\b/gi,'hoạt động'],
    [/\bengagement\b/gi,'trao đổi'],
    [/\boutreach\b/gi,'tiếp cận'],
    [/\bqualified\b/gi,'đã đủ điều kiện'],
    [/\bqualification\b/gi,'mức độ phù hợp'],
    [/\bscorecard\b/gi,'bảng đánh giá'],
    [/\bscore\b/gi,'điểm'],
    [/\bWon\b/g,'Đã chốt'],
    [/\bLost\b/g,'Không thành công'],

    // Tiêu chí đánh giá cơ hội.
    [/\bFit\b/g,'Phù hợp'],
    [/\bNeed\b/g,'Nhu cầu'],
    [/\bAuthority\b/g,'Đúng người quyết định'],
    [/\bFunding\b/g,'Nguồn tiền'],
    [/\bTiming\b/g,'Thời điểm'],
    [/\bRegulation\b/g,'Chính sách'],
    [/\bCapacity\b/g,'Năng lực triển khai'],

    // Từ chuyên môn không cần thiết với người dùng nội bộ.
    [/\bproposal\b/gi,'đề xuất'],
    [/\bresearch\b/gi,'nghiên cứu'],
    [/\bvendor\b/gi,'đơn vị cung cấp'],
    [/\bcontacts\b/gi,'đầu mối liên hệ'],
    [/\bcontact\b/gi,'đầu mối'],
    [/\bwatchlist\b/gi,'danh sách theo dõi'],
    [/\btrigger\b/gi,'tín hiệu'],
    [/\bevidence\b/gi,'minh chứng'],
    [/\beconomics\b/gi,'hiệu quả kinh tế'],
    [/\boperator\b/gi,'đơn vị vận hành'],
    [/\bbenchmark\b/gi,'đối chiếu tham khảo'],
    [/\bintelligence\b/gi,'nghiên cứu thị trường'],
    [/\bentity\b/gi,'pháp nhân'],
    [/\bcanonical school\b/gi,'trường chính thức'],
    [/\bpartnership\b/gi,'hợp tác'],
    [/\bprivate\b/gi,'tư thục'],
    [/\bpublic\b/gi,'công lập'],
    [/\bpilot\b/gi,'thí điểm'],
    [/\bCAPEX\b/g,'đầu tư thiết bị'],
    [/\basset-light\b/gi,'ít đầu tư tài sản'],
    [/\bre-entry\b/gi,'tiếp cận lại'],
    [/\bre-activate\b/gi,'kết nối lại'],
    [/\bincumbent\b/gi,'đơn vị đang cung cấp'],
    [/\bgap analysis\b/gi,'phân tích phần còn thiếu'],
    [/\bcase\b/gi,'trường hợp'],
    [/\bsite\b/gi,'điểm'],
    [/\bemail log\b/gi,'lịch sử gửi email'],
    [/\bhotline\b/gi,'đường dây nóng'],
    [/\bwebsite\b/gi,'trang web'],
    [/\brefresh\b/gi,'cập nhật']
  ];

  function translateString(value){
    if(!value || typeof value!=='string') return value;
    let out=value;
    replacements.forEach(([pattern,replacement])=>{ out=out.replace(pattern,replacement); });
    // Dọn lỗi lặp/ khoảng trắng sau thay thế.
    out=out.replace(/tín hiệu\s+tín hiệu/gi,'tín hiệu')
           .replace(/phù hợp\s+phù hợp/gi,'phù hợp')
           .replace(/\s+([,.;:])/g,'$1')
           .replace(/[ \t]{2,}/g,' ')
           .trim();
    return out;
  }

  function translateNode(root){
    if(!root) return;
    if(root.nodeType===Node.TEXT_NODE){
      const next=translateString(root.nodeValue);
      if(next!==root.nodeValue) root.nodeValue=next;
      return;
    }
    if(root.nodeType!==Node.ELEMENT_NODE && root.nodeType!==Node.DOCUMENT_NODE) return;
    if(root.nodeType===Node.ELEMENT_NODE){
      ['placeholder','title','aria-label'].forEach(attr=>{
        if(root.hasAttribute && root.hasAttribute(attr)){
          const oldValue=root.getAttribute(attr);
          const newValue=translateString(oldValue);
          if(newValue!==oldValue) root.setAttribute(attr,newValue);
        }
      });
      if(root.tagName==='INPUT' && ['button','submit','reset'].includes((root.type||'').toLowerCase())) root.value=translateString(root.value);
    }
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>translateNode(n));
  }

  function run(){ translateNode(document.body); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();

  const observer=new MutationObserver(mutations=>{
    mutations.forEach(m=>{
      m.addedNodes.forEach(n=>translateNode(n));
      if(m.type==='characterData') translateNode(m.target);
    });
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});

  window.SchoolOsVietnameseLanguage={translateString,refresh:run};
})();
