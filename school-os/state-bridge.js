/* Bridge V3 lexical globals to runtime modules without modifying UI source. */
(function(){
  'use strict';
  try{
    Object.defineProperty(window,'state',{configurable:true,get:function(){return state;},set:function(v){state=v;}});
    Object.defineProperty(window,'current',{configurable:true,get:function(){return current;},set:function(v){current=v;}});
    Object.defineProperty(window,'currentTab',{configurable:true,get:function(){return currentTab;},set:function(v){currentTab=v;}});
  }catch(e){console.error('Không khởi tạo được state bridge',e);}
})();
