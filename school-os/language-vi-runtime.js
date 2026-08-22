/* Sunbot School OS - Vietnamese-first language layer */
(function(){
  'use strict';

  const replacements = [
    [/\bStaff\b/gi,'Nhân viên'],
    [/\bManager\b/gi,'Quản lý'],
    [/\bAdmin\b/gi,'Quản trị viên'],
    [/\bSUPER_ADMIN\b/g,'Quản trị cao nhất'],
    [/\bfollow-up\b/gi,'theo dõi'],
    [/\bproposal\b/gi,'đề xuất'],
    [/\bresearch\b/gi,'nghiên cứu'],
    [/\bvendor\b/gi,'đơn vị cung cấp'],
    [/\bcontact\b/gi,'đầu mối'],
    [/\bcontacts\b/gi,'đầu mối liên hệ'],
    [/\bwatchlist\b/gi,'danh sách theo dõi'],
    [/\btrigger\b/gi,'tín hiệu phù hợp'],
    [/\bevidence\b/gi,'minh chứng'],
    [/\beconomics\b/gi,'hiệu quả kinh tế'],
    [/\baccount brief\b/gi,'bản tóm tắt hồ sơ trường'],
    [/\baccount review\b/gi,'rà soát trường đang hợp tác'],
    [/\bteacher-transfer\b/gi,'chuyển giao cho giáo viên'],
    [/\boperator\b/gi,'đơn vị vận hành'],
    [/\bbenchmark\b/gi,'đối chiếu tham khảo'],
    [/\bintelligence\b/gi,'nghiên cứu thị trường'],
    [/\bpipeline\b/gi,'chuỗi cơ hội'],
    [/\bforecast\b/gi,'dự báo'],
    [/\brenewal\b/gi,'gia hạn'],
    [/\bchurn\b/gi,'nguy cơ dừng hợp tác'],
    [/\bdiscovery\b/gi,'trao đổi tìm hiểu nhu cầu'],
    [/\bowner\b/gi,'người phụ trách'],
    [/\bstakeholder\b/gi,'người liên quan'],
    [/\bdecision maker\b/gi,'người quyết định'],
    [/\bhot signal\b/gi,'tín hiệu quan tâm cao'],
    [/\btracked link\b/gi,'liên kết theo dõi'],
    [/\bCold outreach\b/gi,'Tiếp cận chủ động'],
    [/\bWon\b/g,'Đã chốt'],
    [/\bLost\b/g,'Không thành công']
  ];

  function translateString(value){
    if(!value || typeof value!=='string') return value;
    let out=value;
    replacements.forEach(([pattern,replacement])=>{ out=out.replace(pattern,replacement); });
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
      if(root.tagName==='INPUT' && ['button','submit','reset'].includes((root.type||'').toLowerCase())){
        root.value=translateString(root.value);
      }
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
