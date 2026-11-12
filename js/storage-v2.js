/* V2 additive storage. Existing keys are intentionally left untouched. */
(function(){
  'use strict';
  const KEY='momo-study-mainlines-v2';
  const LANG_KEY='momo-study-language-v2';
  const safeParse=(s,fallback)=>{try{return JSON.parse(s)}catch{return fallback}};
  const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'id-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const initial=()=>({version:2,mainlines:[],daily:{},reviews:{}});
  function read(){
    const v=safeParse(localStorage.getItem(KEY),null);
    if(!isObject(v)||v.version!==2||!Array.isArray(v.mainlines)||!isObject(v.daily)||!isObject(v.reviews))return initial();
    return v;
  }
  function write(data){
    if(!isObject(data)||data.version!==2||!Array.isArray(data.mainlines)||!isObject(data.daily)||!isObject(data.reviews))throw Error('Invalid V2 data');
    localStorage.setItem(KEY,JSON.stringify(data));
  }
  function addMainline(name,goal){
    if(typeof name!=='string'||!name.trim())throw Error('Name required');
    const d=read(),v={id:id(),name:name.trim(),goal:String(goal||''),status:'active',createdAt:new Date().toISOString(),stages:[]};
    d.mainlines.push(v);write(d);return v;
  }
  function addDailyTask(date,mainlineId,task){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid date');
    const d=read();
    if(!d.mainlines.some(m=>m.id===mainlineId))throw Error('Unknown mainline');
    if(!isObject(task)||typeof task.title!=='string'||!task.title.trim())throw Error('Invalid task');
    const t={id:id(),mainlineId,title:task.title.trim(),plannedMinutes:Number.isFinite(task.plannedMinutes)&&task.plannedMinutes>=0?task.plannedMinutes:null,actualMinutes:null,start:/^([01]\d|2[0-3]):[0-5]\d$/.test(String(task.start||''))?task.start:'',status:'planned',notes:'',codeSnippets:[]};
    (d.daily[date]??=[]).push(t);write(d);return t;
  }
  function exportAll(){
    const old=['momo-study-journal-v1','momo-study-task-names-v1','momo-study-default-plan-v2'];
    return {format:'momo-study-full-backup',version:2,exportedAt:new Date().toISOString(),legacy:Object.fromEntries(old.map(k=>[k,safeParse(localStorage.getItem(k),null)])),mainline:read(),language:localStorage.getItem(LANG_KEY)||'zh'};
  }
  function validateBackup(v){
    return isObject(v)&&v.format==='momo-study-full-backup'&&v.version===2&&isObject(v.legacy)&&isObject(v.mainline)&&v.mainline.version===2&&Array.isArray(v.mainline.mainlines)&&isObject(v.mainline.daily)&&isObject(v.mainline.reviews);
  }
  window.MomoV2Storage=Object.freeze({read,write,addMainline,addDailyTask,exportAll,validateBackup,KEY,LANG_KEY});
})();
