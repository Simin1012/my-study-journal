(()=>{
'use strict';
const S=window.MomoV2Storage,B=window.MomoLegacyBridge;
if(!S||!B)return;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const lang=()=>localStorage.getItem(S.LANG_KEY)==='ja'?'ja':'zh';
const t=(zh,ja)=>lang()==='ja'?ja:zh;
const safeSave=d=>{try{S.write(d);return true}catch(e){alert(t('保存失败，请检查浏览器存储空间','保存できません。ブラウザの容量をご確認ください'));return false}};
const download=(name,body)=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([body],{type:'application/json;charset=utf-8'}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)};
const main=$('v2-mainline-root');
let selected='',editing='',draftImport=null;
const date=()=>B.getCurrent();
const get=()=>S.read();
const project=d=>d.mainlines.find(x=>x.id===selected);
const taskLabel=x=>x.title||'';
function addProject(){
 const name=prompt(t('新主线名称（如 Java 基础复习）','新しいメインタスク名'));
 if(!name?.trim())return;
 const goal=prompt(t('长期目标（可以以后修改）','長期目標（後から変更できます）'))||'';
 const p=S.addMainline(name,goal);selected=p.id;render();
}
function render(){
 const d=get();if(!d.mainlines.some(x=>x.id===selected))selected=d.mainlines[0]?.id||'';
 const p=project(d);
 main.innerHTML='<div class="v2-extra"><div class="card"><div class="card-head"><h2>'+t('长期主线','メインタスク')+'</h2><button class="btn primary" id="mlAdd">'+t('＋新增主线','＋追加')+'</button></div><div class="field"><label>'+t('选择主线','タスクを選択')+'</label><select class="input" id="mlSelect">'+d.mainlines.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></div>'+(p?'<div class="field"><label>'+t('长期目标','長期目標')+'</label><input class="input" id="mlGoal" value="'+esc(p.goal)+'"></div><div class="field"><label>'+t('当前学习进度','現在の進捗')+'</label><input class="input" id="mlProgress" value="'+esc(p.progress||'')+'" placeholder="Section 11 / Lesson 65"></div><div class="v2-actions"><button class="btn primary" id="mlSave">'+t('保存主线信息','保存')+'</button><button class="btn" id="mlArchive">'+(p.status==='paused'?t('恢复主线','再開'):t('暂停主线','一時停止'))+'</button></div>':'<p class="hint">'+t('先创建一条长期学习主线。','まずメインタスクを作成してください。')+'</p>')+'</div>'+
 (p?'<div class="card"><h2>'+t('今日执行','今日の実行')+'</h2><p class="hint">'+esc(date())+' · '+t('计划与实际分别记录；未填实际时间不等于0。','予定と実績は別々に記録します。')+'</p><div id="mlTasks"></div><div class="field"><label>'+t('新增任务名称','新規タスク')+'</label><input class="input" id="mlTaskName" placeholder="'+t('如：Section 11 方法练习','例：Section 11 メソッド練習')+'"></div><div class="v2-inline"><input class="input" id="mlTaskMinutes" type="number" min="0" placeholder="'+t('计划分钟','予定（分）')+'"><button class="btn primary" id="mlTaskAdd">'+t('添加今日任务','今日のタスクに追加')+'</button></div></div><div class="card"><h2>'+t('学习记录与代码','学習記録とコード')+'</h2><p class="hint">'+t('代码仅保存到当前浏览器；请勿输入公司机密代码。','コードはブラウザに保存されます。機密情報は入力しないでください。')+'</p><div id="mlNotes"></div></div><div class="card"><h2>'+t('ChatGPT协作与通勤复习','ChatGPTと復習')+'</h2><p class="hint">'+t('复制计划需求给ChatGPT；讨论后粘贴结构化JSON并预览导入。','計画をコピーしてChatGPTで相談し、JSONをプレビューして取り込みます。')+'</p><div class="v2-actions"><button class="btn" id="mlPrompt">'+t('复制规划需求','計画の依頼をコピー')+'</button><button class="btn" id="mlReview">'+t('复制通勤复习材料','復習用データをコピー')+'</button></div><details><summary>'+t('导入AI生成的任务JSON','AIタスクJSONの取り込み')+'</summary><p class="hint">{"tasks":[{"title":"Section 11","plannedMinutes":60}]}</p><textarea class="input" id="mlImport" placeholder="JSON"></textarea><div class="v2-actions"><button class="btn" id="mlPreview">'+t('检查并预览','確認・プレビュー')+'</button><button class="btn primary" id="mlApply" disabled>'+t('确认导入','取り込みを確定')+'</button></div><div id="mlImportPreview"></div></details></div>':'')+'</div>';
 $('mlAdd').onclick=addProject;
 $('mlSelect').onchange=e=>{selected=e.target.value;render()};
 if(!p)return;
 $('mlSave').onclick=()=>{const d=get(),x=project(d);x.goal=$('mlGoal').value;x.progress=$('mlProgress').value;if(safeSave(d))render()};
 $('mlArchive').onclick=()=>{const d=get(),x=project(d);x.status=x.status==='paused'?'active':'paused';if(safeSave(d))render()};
 $('mlTaskAdd').onclick=()=>{const title=$('mlTaskName').value.trim(),raw=$('mlTaskMinutes').value,n=raw===''?null:Number(raw);if(!title||n!==null&&(!Number.isFinite(n)||n<0||n>1440)){alert(t('请填写有效任务名称和分钟数','タスク名と時間を確認してください'));return}S.addDailyTask(date(),selected,{title,plannedMinutes:n});render()};
 renderTasks();renderNotes();
 $('mlPrompt').onclick=()=>{const d=get(),x=project(d);copy('请帮我整理学习与成长记录V2的主线任务计划，先讨论合理性，再输出可导入的JSON格式：{"tasks":[{"title":"任务名称","plannedMinutes":60}]}。主线：'+x.name+'；长期目标：'+x.goal+'；当前进度：'+(x.progress||'未记录')+'。请区分最低、主要和挑战目标，保留独立代码练习与复习时间。')};
 $('mlReview').onclick=()=>{const d=get(),tasks=(d.daily[date()]||[]).filter(x=>x.mainlineId===selected);copy('请根据以下学习记录进行日中双语通勤复习，一次只问一题，等我回答后再纠正。日期：'+date()+'。主线：'+p.name+'\n'+tasks.map(x=>JSON.stringify(x)).join('\n'))};
 $('mlPreview').onclick=()=>{draftImport=null;$('mlApply').disabled=true;try{const obj=JSON.parse($('mlImport').value);if(!obj||!Array.isArray(obj.tasks)||obj.tasks.length===0||obj.tasks.length>50)throw Error('tasks must contain 1-50 items');const tasks=obj.tasks.map(x=>{if(!x||typeof x.title!=='string'||!x.title.trim()||x.title.length>200||!Number.isFinite(x.plannedMinutes)||x.plannedMinutes<0||x.plannedMinutes>1440)throw Error('Invalid title/minutes');return {title:x.title.trim(),plannedMinutes:x.plannedMinutes}});draftImport=tasks;$('mlImportPreview').textContent=tasks.map(x=>x.title+' · '+x.plannedMinutes+'分').join('\n');$('mlImportPreview').style.whiteSpace='pre-line';$('mlApply').disabled=false}catch(e){$('mlImportPreview').textContent=t('格式不正确：','形式が正しくありません：')+e.message}};
 $('mlApply').onclick=()=>{if(!draftImport)return;if(!confirm(t('确认将'+draftImport.length+'项任务加入今天？','今日のタスクに追加しますか？')))return;const d=get();const arr=d.daily[date()]||[];const now=Date.now();draftImport.forEach((x,i)=>arr.push({id:'import-'+now+'-'+i,mainlineId:selected,title:x.title,plannedMinutes:x.plannedMinutes,actualMinutes:null,status:'planned',notes:'',codeSnippets:[]}));d.daily[date()]=arr;if(safeSave(d)){draftImport=null;render()}};
}
function renderTasks(){
 const d=get(),tasks=(d.daily[date()]||[]).filter(x=>x.mainlineId===selected);
 $('mlTasks').innerHTML=tasks.length?tasks.map(x=>'<div class="v2-item" data-task="'+esc(x.id)+'"><div class="v2-inline"><strong>'+esc(taskLabel(x))+'</strong><select class="input" data-status><option value="planned" '+(x.status==='planned'?'selected':'')+'>'+t('未开始','未開始')+'</option><option value="progress" '+(x.status==='progress'?'selected':'')+'>'+t('进行中','進行中')+'</option><option value="done" '+(x.status==='done'?'selected':'')+'>'+t('已完成','完了')+'</option><option value="postponed" '+(x.status==='postponed'?'selected':'')+'>'+t('延期','延期')+'</option></select></div><div class="v2-inline"><label>'+t('计划','予定')+'：'+(x.plannedMinutes??'—')+'分</label><input class="input" type="number" min="0" max="1440" data-actual placeholder="'+t('实际分钟（未记录留空）','実績（分）')+'" value="'+(x.actualMinutes??'')+'"></div><div class="v2-actions"><button class="btn" data-save>'+t('保存','保存')+'</button><button class="btn" data-remove>'+t('删除','削除')+'</button></div></div>').join(''):'<p class="hint">'+t('今天尚无主线任务','今日のタスクはありません')+'</p>';
 $('mlTasks').onclick=e=>{const b=e.target.closest('button'),row=e.target.closest('[data-task]');if(!b||!row)return;const d=get(),arr=d.daily[date()]||[],i=arr.findIndex(x=>x.id===row.dataset.task);if(i<0)return;if(b.hasAttribute('data-remove')){if(!confirm(t('删除此任务？','削除しますか？')))return;arr.splice(i,1)}else if(b.hasAttribute('data-save')){const raw=row.querySelector('[data-actual]').value,n=raw===''?null:Number(raw);if(n!==null&&(!Number.isFinite(n)||n<0||n>1440)){alert(t('实际分钟无效','実績時間が無効です'));return}arr[i].actualMinutes=n;arr[i].status=row.querySelector('[data-status]').value}else return;if(safeSave(d))render()};
}
function renderNotes(){
 const d=get(),tasks=(d.daily[date()]||[]).filter(x=>x.mainlineId===selected);
 $('mlNotes').innerHTML=tasks.length?tasks.map(x=>'<div class="v2-item" data-note="'+esc(x.id)+'"><strong>'+esc(x.title)+'</strong><div class="field"><label>'+t('知识点与疑问','学習内容・疑問')+'</label><textarea class="input" data-notes>'+esc(x.notes||'')+'</textarea></div><div class="field"><label>'+t('代码练习（可多次保存，追加代码片段）','コード練習（追加保存）')+'</label><textarea class="input" data-code placeholder="Java / SQL"></textarea></div><div class="v2-actions"><button class="btn primary" data-save-note>'+t('保存笔记','メモを保存')+'</button><button class="btn" data-add-code>'+t('添加代码片段','コードを追加')+'</button></div>'+(x.codeSnippets||[]).map((c,i)=>'<details><summary>'+t('代码片段','コード')+' '+(i+1)+'</summary><pre>'+esc(c.code)+'</pre></details>').join('')+'</div>').join(''):'<p class="hint">'+t('先添加今日任务。','まずタスクを追加してください。')+'</p>';
 $('mlNotes').onclick=e=>{const b=e.target.closest('button'),row=e.target.closest('[data-note]');if(!b||!row)return;const d=get(),x=(d.daily[date()]||[]).find(x=>x.id===row.dataset.note);if(!x)return;if(b.hasAttribute('data-save-note'))x.notes=row.querySelector('[data-notes]').value;else if(b.hasAttribute('data-add-code')){const c=row.querySelector('[data-code]').value;if(!c.trim())return;x.codeSnippets??=[];x.codeSnippets.push({code:c,createdAt:new Date().toISOString()})}else return;if(safeSave(d))render()};
}
function copy(s){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>B.toast(t('已复制','コピーしました'))).catch(()=>fallback(s));else fallback(s)}
function fallback(s){const el=document.createElement('textarea');el.value=s;document.body.append(el);el.select();document.execCommand('copy');el.remove();B.toast(t('已复制','コピーしました'))}
function setupBackup(){
 const bar=document.querySelector('.top-right');
 const btn=document.createElement('button');btn.className='btn';btn.id='v2FullExport';btn.textContent=t('完整备份V2','全データを保存');bar.append(btn);
 btn.onclick=()=>download('study-journal-v2-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(S.exportAll(),null,2));
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;bar.append(input);
 const imp=document.createElement('button');imp.className='btn';imp.textContent=t('恢复完整备份','全データを復元');bar.append(imp);
 imp.onclick=()=>input.click();
 input.onchange=async()=>{const file=input.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!S.validateBackup(data))throw Error('Invalid backup format');const count=Object.keys(data.legacy['momo-study-journal-v1']?.records||data.legacy['momo-study-journal-v1']||{}).length;if(!confirm(t('将恢复完整备份，可能覆盖当前记录。备份包含约','バックアップを復元します。記録数：')+count+t('条旧记录。请先导出当前完整备份。','。現在のデータを先に保存してください。')))return;const keys=['momo-study-journal-v1','momo-study-task-names-v1','momo-study-default-plan-v2'];const snapshot=Object.fromEntries([...keys,S.KEY,S.LANG_KEY].map(k=>[k,localStorage.getItem(k)]));try{keys.forEach(k=>{if(data.legacy[k]!==null&&data.legacy[k]!==undefined)localStorage.setItem(k,JSON.stringify(data.legacy[k]))});S.write(data.mainline);localStorage.setItem(S.LANG_KEY,data.language==='ja'?'ja':'zh');alert(t('恢复完成，页面将重新载入。','復元しました。再読み込みします。'));location.reload()}catch(e){Object.entries(snapshot).forEach(([k,v])=>v===null?localStorage.removeItem(k):localStorage.setItem(k,v));throw e}}catch(e){alert(t('恢复失败：','復元失敗：')+e.message)}finally{input.value=''}};
}
function setupLanguage(){
 const header=document.querySelector('.top-right'),wrap=document.createElement('label');wrap.className='v2-lang';wrap.innerHTML='<span>Language</span><select class="input" id="v2Language"><option value="zh">中文</option><option value="ja">日本語</option></select>';header.prepend(wrap);$('v2Language').value=lang();
 $('v2Language').onchange=e=>{localStorage.setItem(S.LANG_KEY,e.target.value);applyLanguage();render()};
 applyLanguage();
}
const labels={
 '今日朝活':['今日朝活','今日の朝活'],'起床时间':['起床时间','起床時刻'],'出门时间':['出门时间','出発時刻'],'星巴克到达':['星巴克到达','スターバックス到着'],'日记已完成':['日记已完成','日記完了'],'背单词已完成':['背单词已完成','単語学習完了'],'保存今日记录':['保存今日记录','今日の記録を保存'],'复制今日摘要':['复制今日摘要','今日の要約をコピー'],'添加任务':['添加任务','タスクを追加'],'今日整体复盘':['今日整体复盘','今日の振り返り'],'任务名称管理':['任务名称管理','タスク名の管理'],'实际学习分钟':['实际学习分钟','実際の学習時間（分）'],'有记录天数':['有记录天数','記録した日数'],'连续记录天数':['连续记录天数','連続記録日数'],'最近7天记录':['最近7天记录','直近7日間の記録'],'按任务名称统计':['按任务名称统计','タスク別統計'],'导出 CSV':['导出 CSV','CSV出力'],'重新开始时间':['重新开始时间','再開時刻'],'最晚结束时间':['最晚结束时间','終了期限'],'现在重新安排':['现在重新安排','予定を組み直す'],'确认调整':['确认调整','変更を確定'],'预览新安排':['预览新安排','新しい予定を確認'],'读取当前时间':['读取当前时间','現在時刻を取得'],'晨间日记 · 今日记录':['晨间日记 · 今日记录','朝の日記・今日の記録'],'今天的一句话总结':['今天的一句话总结','今日のひとこと'],'小红书 · 今日分享':['小红书 · 今日分享','小紅書・今日のシェア'],'关闭':['关闭','閉じる'],'复制正文':['复制正文','本文をコピー'],'复制标题':['复制标题','タイトルをコピー'],'全部复制':['全部复制','すべてコピー'],'从实际记录生成正文':['从实际记录生成正文','記録から本文を生成'],'确认发布':['确认发布','投稿済みを記録'],
 '今日':['今日','今日'],'计划':['计划','計画'],'主线':['主线','メイン'],'日记':['日记','日記'],'统计':['统计','統計'],
 '学习与成长记录':['学习与成长记录','学習・成長記録'],'计划设置':['计划设置','計画設定'],'主线任务':['主线任务','メインタスク'],'学习统计':['学习统计','学習統計'],
 '备份数据':['备份数据','バックアップ'],'导入备份':['导入备份','復元'],'分享今日记录 · 小红书':['分享今日记录 · 小红书','今日の記録をシェア'],
 '默认计划':['默认计划','標準計画'],'当天计划':['当天计划','当日の計画'],'晨间日记':['晨间日记','朝の日記'],
 '学习任务':['学习任务','学習タスク'],'学习概览':['学习概览','学習概要'],'历史记录':['历史记录','履歴']
};
function applyLanguage(){
 const ja=lang()==='ja';document.documentElement.lang=ja?'ja':'zh-CN';
 document.title=t('学习与成长记录','学習・成長記録');
 document.querySelectorAll('.v2-nav button').forEach(b=>{const span=b.querySelector('span');const key=b.dataset.page;const names={today:['今日','今日'],plan:['计划','計画'],mainline:['主线','メイン'],journal:['日记','日記'],stats:['统计','統計']};if(span&&names[key]){const tail=[...b.childNodes].find(n=>n.nodeType===3);if(tail)tail.textContent=names[key][ja?1:0]}});
 document.querySelectorAll('h1,h2,h3,.v2-tabbar button,.v2-modal button,.v2-modal label,.v2-extra label,.card label,.stat-label,.card-head button,#v2Share,#exportJson,#importBtn,#saveBtn,#copyBtn').forEach(el=>{if(el.children.length)return;const txt=el.textContent.trim(),entry=labels[txt]||Object.values(labels).find(v=>v.includes(txt));if(entry)el.textContent=entry[ja?1:0]});
 const title=document.querySelector('h1.title');if(title)title.textContent=t('学习与成长记录','学習・成長記録');
}
function setupJournal(){
 const host=$('v2-diary');if(!host)return;
 const box=document.createElement('div');box.className='card v2-extra';box.innerHTML='<h2 id="v2JournalExtraTitle">学习感想与今日总结</h2><div class="field"><label id="v2FeelingLabel">学习感想</label><textarea class="input" id="v2DayFeeling"></textarea></div><div class="field"><label id="v2SummaryLabel">今日总结</label><textarea class="input" id="v2DaySummary"></textarea></div><button class="btn primary" id="v2SaveJournalExtra">保存补充日记</button>';host.append(box);
 const load=()=>{const d=get();const v=d.reviews[date()]||{};$('v2DayFeeling').value=v.feeling||'';$('v2DaySummary').value=v.summary||''};
 $('v2SaveJournalExtra').onclick=()=>{const d=get();d.reviews[date()]={...(d.reviews[date()]||{}),feeling:$('v2DayFeeling').value,summary:$('v2DaySummary').value};if(safeSave(d))B.toast(t('已保存','保存しました'))};
 $('date').addEventListener('change',()=>setTimeout(()=>{load();render();if(typeof window.MomoV2Refresh==='function')window.MomoV2Refresh()},0));load();
}
function setupOverview(){
 const slot=$('v2-today-slot'),box=document.createElement('div');box.className='card';box.innerHTML='<div class="card-head"><h2 id="v2OverviewTitle">今日主线任务</h2><button class="btn" id="v2OverviewOpen">查看主线</button></div><div id="v2OverviewTasks"></div>';slot.prepend(box);
 $('v2OverviewOpen').onclick=()=>B.goV2('mainline');
 const update=()=>{const d=get(),tasks=d.daily[date()]||[];$('v2OverviewTasks').innerHTML=tasks.length?tasks.map(x=>'<div class="record">'+esc(x.title)+' · '+(x.status==='done'?t('已完成','完了'):x.status==='progress'?t('进行中','進行中'):t('未完成/未开始','未完了・未開始'))+'</div>').join(''):'<p class="hint">'+t('尚无主线任务','メインタスクはまだありません')+'</p>'};
 const orig=B.goV2;B.goV2=p=>{orig(p);if(p==='mainline')render();if(p==='today')update();if(p==='journal'){$('v2DayFeeling').value=(get().reviews[date()]||{}).feeling||'';$('v2DaySummary').value=(get().reviews[date()]||{}).summary||''}applyLanguage()};
 document.querySelector('.v2-nav').addEventListener('click',()=>setTimeout(()=>{update();render();applyLanguage()},0));
 window.MomoV2Refresh=update;update();
}
function setupPlanAndStats(){
 const plan=$('v2-plan'),stats=$('v2-stats');
 if(plan){const card=document.createElement('div');card.className='card';card.innerHTML='<h2 id="v2LinkedPlanTitle">白天主线学习计划</h2><p class="hint" id="v2LinkedPlanHint">主线任务的时间与状态在主线页面管理，此处只读取，不重复创建。</p><div id="v2LinkedPlan"></div><button class="btn" id="v2LinkedPlanOpen">管理主线任务</button>';plan.append(card);$('v2LinkedPlanOpen').onclick=()=>B.goV2('mainline')}
 if(stats){const card=document.createElement('div');card.className='card';card.innerHTML='<h2 id="v2LinkedStatsTitle">主线学习统计</h2><p class="hint" id="v2LinkedStatsHint">未记录实际时间不计入时长。</p><div id="v2LinkedStats"></div>';stats.append(card)}
 const refresh=()=>{const d=get(),tasks=d.daily[date()]||[];if($('v2LinkedPlan'))$('v2LinkedPlan').innerHTML=tasks.length?tasks.map(x=>'<div class="record">'+esc(x.title)+' · '+(x.plannedMinutes??'—')+t('分钟','分')+' · '+(x.actualMinutes===null?t('实际未记录','実績未記録'):x.actualMinutes+t('分钟','分'))+'</div>').join(''):'<p class="hint">'+t('暂无主线计划','予定なし')+'</p>';if($('v2LinkedStats')){const all=Object.values(d.daily).flat().filter(x=>x&&typeof x==='object');const total=all.reduce((n,x)=>n+(typeof x.actualMinutes==='number'?x.actualMinutes:0),0);const known=all.filter(x=>typeof x.actualMinutes==='number').length;const done=all.filter(x=>x.status==='done').length;$('v2LinkedStats').textContent=t('累计有记录的主线学习：','記録済みの学習時間：')+total+t('分钟；有实际时间的任务 ','分、実績記録タスク ')+known+t('项；已完成 ','件、完了 ')+done+t('项','件')}};
 document.querySelector('.v2-nav').addEventListener('click',()=>setTimeout(refresh,0));$('date').addEventListener('change',()=>setTimeout(refresh,0));window.MomoV2RefreshAll=refresh;refresh();
}
setupBackup();setupLanguage();setupJournal();setupOverview();setupPlanAndStats();render();
})();