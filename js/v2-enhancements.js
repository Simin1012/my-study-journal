(()=>{
'use strict';
const S=window.MomoV2Storage,B=window.MomoLegacyBridge;
if(!S||!B)return;
const $=id=>document.getElementById(id);
const toolbarStyle=document.createElement('style');toolbarStyle.textContent="\n.v2-toolbar{position:sticky;top:0;z-index:12;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:9px;max-width:1150px;margin:0 auto 16px;padding:11px 16px;background:rgba(255,255,255,.97);border:1px solid #e2e9f3;border-radius:14px;box-shadow:0 3px 12px #23324c10}\n.v2-toolbar-date,.v2-lang{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:650}.v2-toolbar-date .input,.v2-lang .input{min-width:125px;max-width:180px}.v2-toolbar button{white-space:nowrap}\n@media(max-width:480px){.v2-toolbar{padding:9px;gap:7px}.v2-toolbar-date .input{min-width:135px;max-width:155px}.v2-toolbar button{font-size:11px;padding:9px 8px}.v2-lang span{display:none}.v2-lang .input{min-width:82px}}\n";document.head.append(toolbarStyle);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const lang=()=>localStorage.getItem(S.LANG_KEY)==='ja'?'ja':'zh';
const t=(zh,ja)=>lang()==='ja'?ja:zh;
const safeSave=d=>{try{S.write(d);return true}catch(e){alert(t('保存失败，请检查浏览器存储空间','保存できません。ブラウザの容量をご確認ください'));return false}};
const download=(name,body)=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([body],{type:'application/json;charset=utf-8'}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)};
const main=$('v2-mainline-root');
const aiCss=document.createElement('style');aiCss.textContent='.v2-mainline-guide{border-left:4px solid #416dd4!important}.v2-mainline-guide p{line-height:1.8}.v2-guide-steps{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.v2-guide-steps span{border-radius:20px;background:#eff4ff;padding:8px 12px;font-size:12px;font-weight:650}.v2-ai-prominent{border:2px solid #c7d7fa!important;background:#f5f9ff!important}.v2-ai-import{padding:14px;background:#fff;border-radius:12px;border:1px solid #dce6f6}.v2-ai-import textarea{min-height:110px}.v2-ai-prominent h2{margin-bottom:8px}.v2-ai-guide{background:#fff;border:1px solid #dce5f6;border-radius:12px;padding:12px;margin:12px 0}.v2-ai-guide ol{line-height:1.9;padding-left:22px;margin:8px 0}.v2-ai-new{margin:12px 0}.v2-ai-new summary{cursor:pointer;font-weight:650;color:#365ca5}';document.head.append(aiCss);
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
 main.innerHTML='<div class="v2-extra"><div class="card"><div class="card-head"><h2>'+t('① 学习方向（长期）','① 学習テーマ（長期）')+'</h2><button class="btn primary" id="mlAdd">'+t('＋添加另一条学习主线','＋学習テーマを追加')+'</button></div><div class="field"><label>'+t('我现在要学的方向','学習テーマを選択')+'</label><select class="input" id="mlSelect">'+d.mainlines.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></div>'+(p?'<div class="field"><label>'+t('长期目标（例如能根据设计书写 Java 代码）','長期目標（例：設計書から Java のコードを書く）')+'</label><input class="input" id="mlGoal" value="'+esc(p.goal)+'"></div><div class="field"><label>'+t('目前学到哪里（如 Section 11 / Lesson 65）','現在の進捗（例：Section 11 / Lesson 65）')+'</label><input class="input" id="mlProgress" value="'+esc(p.progress||'')+'" placeholder="Section 11 / Lesson 65"></div><div class="v2-actions"><button class="btn primary" id="mlSave">'+t('保存主线信息','保存')+'</button><button class="btn" id="mlArchive">'+(p.status==='paused'?t('恢复主线','再開'):t('暂停主线','一時停止'))+'</button></div>':'<p class="hint">'+t('先创建一条长期学习主线。','まずメインタスクを作成してください。')+'</p>')+'</div>'+
 (p?'<div class="card"><h2>'+t('② 今天具体学什么','② 今日取り組む内容')+'</h2><p class="hint">'+esc(date())+' · '+t('先添加任务；学完后在下方填写实际分钟、选择状态并保存。未填实际时间表示未记录。','まずタスクを追加し、学習後に実績（分）と状態を入力して保存します。空欄は未記録です。')+'</p><div id="mlTasks"></div><div class="field"><label>'+t('今天的学习内容（例如复习方法）','今日の学習内容（例：メソッドの復習）')+'</label><input class="input" id="mlTaskName" placeholder="'+t('如：Section 11 方法练习','例：Section 11 メソッド練習')+'"></div><div class="v2-inline"><input class="input" id="mlTaskStart" type="time" aria-label="计划开始时刻"><input class="input" id="mlTaskMinutes" type="number" min="0" placeholder="'+t('计划分钟（例如45）','予定（分、例：45）')+'"><button class="btn primary" id="mlTaskAdd">'+t('添加到今天的计划','今日の計画に追加')+'</button></div></div><div class="card"><h2>'+t('③ 学完后写点笔记（可选）','③ 学習後のメモ（任意）')+'</h2><p class="hint">'+t('代码仅保存到当前浏览器；请勿输入公司机密代码。','コードはブラウザに保存されます。機密情報は入力しないでください。')+'</p><div id="mlNotes"></div></div><div class="card" id="mlAiCard"><h2>'+t('④ 把已讨论的 ChatGPT 计划导入网站（可选）','④ ChatGPT で相談済みの計画を取り込む（任意）')+'</h2><p class="hint">'+t('例如：你已经把 Udemy 进度截图发给 ChatGPT，它也给出了今天的学习安排。这时不用重新规划，点击下方按钮，把刚才讨论的计划转换成网站任务。','例：Udemy の進捗画像を ChatGPT に送って今日の予定を相談済みなら、もう一度計画し直す必要はありません。以下のボタンから計画をタスクに変換できます。')+'</p><div class="v2-ai-guide"><strong>'+t('已有 ChatGPT 计划：','ChatGPT で計画が決まっている場合：')+'</strong><ol><li>'+t('点击「复制转换指令」','「変換用指示をコピー」を押す')+'</li><li>'+t('回到之前发截图的同一个 ChatGPT 对话，粘贴并发送','進捗画像を送った元の ChatGPT 会話に貼り付ける')+'</li><li>'+t('复制 ChatGPT 返回的任务 JSON，粘贴到下方并预览导入','返されたタスク JSON を下の欄に貼り付けてプレビューする')+'</li></ol></div><div class="v2-actions"><button class="btn primary" id="mlFromChat">'+t('复制「把刚才的计划转换为任务」指令','相談済みの計画をタスクに変換する指示をコピー')+'</button></div><p class="hint">'+t('网站不能直接读取聊天截图或历史记录；只需在原来的聊天里转换一次，不需要重新上传截图。','サイトはチャット履歴や画像を自動取得できません。元の会話で変換するだけで、画像の再送信は不要です。')+'</p><details class="v2-ai-new"><summary>'+t('没有讨论过计划？点击这里让 ChatGPT 从头制定','まだ計画がない場合：ChatGPT に相談する')+'</summary><div class="v2-inline"><label>'+t('今天有多少分钟可以学习','今日使える時間（分）')+'<input class="input" id="mlAiHours" type="number" min="0" max="1440" placeholder="120"></label><label>'+t('想优先学习什么','優先学習項目')+'<input class="input" id="mlAiFocus" placeholder="Java / SQL"></label></div><p class="hint"><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">'+t('打开 ChatGPT（新标签页）','ChatGPT を開く（別タブ）')+'</a></p><div class="v2-actions"><button class="btn" id="mlPrompt">'+t('复制给 ChatGPT 的问题','ChatGPT に送る質問をコピー')+'</button><button class="btn" id="mlReview">'+t('复制通勤复习材料','復習用データをコピー')+'</button></div></details><section class="v2-ai-import"><h3>'+t('把 ChatGPT 返回的任务清单粘贴在这里','ChatGPT のタスクリストをここに貼り付ける')+'</h3><p class="hint">{"tasks":[{"title":"Section 11","plannedMinutes":60}]}</p><textarea class="input" id="mlImport" placeholder="JSON"></textarea><div class="v2-actions"><button class="btn" id="mlPreview">'+t('预览要加入的任务','追加するタスクをプレビュー')+'</button><button class="btn primary" id="mlApply" disabled>'+t('确认添加到今天','今日の予定に追加')+'</button></div><div id="mlImportPreview" role="status"></div></section></div>':'')+'</div>';
 const container=main.querySelector('.v2-extra'),aiCard=$('mlAiCard');
 const guide=document.createElement('section');guide.className='card v2-mainline-guide';
 guide.innerHTML=p
   ?'<h2>'+t('主线 = 长期学习方向，不是每天都要完成的任务','メインタスクは長期的な学習テーマです')+'</h2><p class="hint">'+t('例：主线是“Java 学习”，今天的任务是“学习方法 45 分钟”。先在下面添加今天的任务；学完回来填实际时间和完成状态。今日页和计划页会自动显示这些任务，不用重复添加。','例：長期テーマは「Java 学習」、今日のタスクは「メソッドを45分学習」。下に追加し、終了後に実績時間と状態を記録します。今日・計画画面にも表示されるため二重登録は不要です。')+'</p><div class="v2-guide-steps"><span>'+t('1. 选学习方向','1. 学習テーマを選ぶ')+'</span><span>'+t('2. 写今天的计划','2. 今日の予定を書く')+'</span><span>'+t('3. 学完记录实际情况','3. 学習後に実績を記録')+'</span></div>'
   :'<h2>'+t('什么是“主线”？','「メインタスク」とは？')+'</h2><p>'+t('主线就是长期坚持的学习方向，例如 Java、SQL、日本语。只需创建一次，以后每天在同一主线下记录学习任务。','Java・SQL・日本語など、継続して学ぶテーマです。一度作成すると、毎日のタスクを同じテーマに記録できます。')+'</p><div class="field"><label for="mlQuickName">'+t('① 先创建一个学习方向','① まず学習テーマを作成')+'</label><input class="input" id="mlQuickName" placeholder="'+t('例如：Java 学习','例：Java 学習')+'"></div><div class="field"><label for="mlQuickGoal">'+t('长期目标（可不填）','長期目標（任意）')+'</label><input class="input" id="mlQuickGoal" placeholder="'+t('例如：熟悉 Java，能按设计书写代码','例：設計書から Java コードを書けるようになる')+'"></div><button class="btn primary" id="mlQuickCreate">'+t('创建主线，开始记录每天的学习','テーマを作成して記録を始める')+'</button><p class="hint">'+t('创建后：添加今天学什么 → 学完填实际分钟 → 保存。','作成後：今日の予定を追加 → 学習後の実績を入力 → 保存。')+'</p>';
 container.prepend(guide);
 if(!p)$('mlQuickCreate').onclick=()=>{
   const name=$('mlQuickName').value.trim(),goal=$('mlQuickGoal').value.trim();
   if(!name){alert(t('请先填写学习方向名称','学習テーマ名を入力してください'));return}
   const created=S.addMainline(name,goal);selected=created.id;render();
 };

 if(aiCard){aiCard.classList.add('v2-ai-prominent')}
 else {
   const intro=document.createElement('section');intro.className='card v2-ai-prominent';
   intro.innerHTML='<h2>'+t('AI 学习计划助手 · ChatGPT','AI 学習計画アシスタント · ChatGPT')+'</h2><p>'+t('先创建一条学习主线（例如 Java 或 SQL），就能复制计划需求给 ChatGPT，并把生成的每日计划导入网站。','先に Java や SQL のメインタスクを作成すると、ChatGPT への相談と日別計画の取り込みが利用できます。')+'</p><button type="button" class="btn primary" id="mlAiCreate">'+t('① 创建主线并开始规划','① メインタスクを作って計画を立てる')+'</button>';
   container.append(intro);$('mlAiCreate').onclick=addProject;
 }
 $('mlAdd').onclick=addProject;
 $('mlSelect').onchange=e=>{selected=e.target.value;render()};
 if(!p)return;
 $('mlSave').onclick=()=>{const d=get(),x=project(d);x.goal=$('mlGoal').value;x.progress=$('mlProgress').value;if(safeSave(d))render()};
 $('mlArchive').onclick=()=>{const d=get(),x=project(d);x.status=x.status==='paused'?'active':'paused';if(safeSave(d))render()};
 $('mlTaskAdd').onclick=()=>{const title=$('mlTaskName').value.trim(),raw=$('mlTaskMinutes').value,n=raw===''?null:Number(raw);if(!title||n!==null&&(!Number.isFinite(n)||n<0||n>1440)){alert(t('请填写有效任务名称和分钟数','タスク名と時間を確認してください'));return}S.addDailyTask(date(),selected,{title,plannedMinutes:n,start:$('mlTaskStart').value});render()};
 renderTasks();renderNotes();
 $('mlPrompt').onclick=()=>{const d=get(),x=project(d);copy('请帮我整理学习与成长记录V2的主线任务计划，先讨论合理性，再输出可导入的JSON格式：{"tasks":[{"title":"任务名称","plannedMinutes":60}]}，只输出有效 JSON 时不要添加 Markdown 代码围栏。主线：'+x.name+'；长期目标：'+x.goal+'；当前进度：'+(x.progress||'未记录')+'；今日可用时间：'+($('mlAiHours').value||'未填写')+'分钟；优先事项：'+($('mlAiFocus').value||'未填写')+'。请区分最低、主要和挑战目标，保留独立代码练习与复习时间。')};
 $('mlReview').onclick=()=>{const d=get(),tasks=(d.daily[date()]||[]).filter(x=>x.mainlineId===selected);copy('请根据以下学习记录进行日中双语通勤复习，一次只问一题，等我回答后再纠正。日期：'+date()+'。主线：'+p.name+'\n'+tasks.map(x=>JSON.stringify(x)).join('\n'))};
 $('mlPreview').onclick=()=>{draftImport=null;$('mlApply').disabled=true;try{const obj=JSON.parse($('mlImport').value);if(!obj||!Array.isArray(obj.tasks)||obj.tasks.length===0||obj.tasks.length>50)throw Error('tasks must contain 1-50 items');const tasks=obj.tasks.map(x=>{if(!x||typeof x.title!=='string'||!x.title.trim()||x.title.length>200||!Number.isFinite(x.plannedMinutes)||x.plannedMinutes<0||x.plannedMinutes>1440)throw Error('Invalid title/minutes');return {title:x.title.trim(),plannedMinutes:x.plannedMinutes}});draftImport=tasks;$('mlImportPreview').textContent=tasks.map(x=>x.title+' · '+x.plannedMinutes+'分').join('\n');$('mlImportPreview').style.whiteSpace='pre-line';$('mlApply').disabled=false}catch(e){$('mlImportPreview').textContent=t('格式不正确：','形式が正しくありません：')+e.message}};
 $('mlApply').onclick=()=>{if(!draftImport)return;if(!confirm(t('确认将'+draftImport.length+'项任务加入今天？','今日のタスクに追加しますか？')))return;const d=get();const arr=d.daily[date()]||[];const now=Date.now();draftImport.forEach((x,i)=>arr.push({id:'import-'+now+'-'+i,mainlineId:selected,title:x.title,plannedMinutes:x.plannedMinutes,actualMinutes:null,status:'planned',notes:'',codeSnippets:[]}));d.daily[date()]=arr;if(safeSave(d)){draftImport=null;render()}};
}
function endOf(start,minutes){if(!start||minutes===null||minutes===undefined||!Number.isFinite(Number(minutes)))return '';const parts=start.split(':').map(Number);if(parts.length!==2||parts.some(Number.isNaN))return '';const n=(parts[0]*60+parts[1]+Number(minutes))%1440;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function renderTasks(){
 const d=get(),tasks=(d.daily[date()]||[]).filter(x=>x.mainlineId===selected);
 $('mlTasks').innerHTML=tasks.length?tasks.map(x=>'<div class="v2-item" data-task="'+esc(x.id)+'"><div class="v2-inline"><strong>'+esc(taskLabel(x))+'</strong><select class="input" data-status><option value="planned" '+(x.status==='planned'?'selected':'')+'>'+t('未开始','未開始')+'</option><option value="progress" '+(x.status==='progress'?'selected':'')+'>'+t('进行中','進行中')+'</option><option value="done" '+(x.status==='done'?'selected':'')+'>'+t('已完成','完了')+'</option><option value="postponed" '+(x.status==='postponed'?'selected':'')+'>'+t('延期','延期')+'</option></select></div><div class="v2-inline"><label>'+t('计划','予定')+'：'+(x.plannedMinutes??'—')+'分</label><input class="input" type="time" data-start value="'+esc(x.start||'')+'" aria-label="'+t('开始时刻','開始時刻')+'"><input class="input" type="number" min="0" max="1440" data-actual placeholder="'+t('实际分钟（未记录留空）','実績（分）')+'" value="'+(x.actualMinutes??'')+'"></div><div class="v2-status">'+(x.start?esc(x.start)+' → '+(endOf(x.start,x.plannedMinutes)||'—'):'')+'</div><div class="v2-actions"><button class="btn" data-save>'+t('保存','保存')+'</button><button class="btn" data-remove>'+t('删除','削除')+'</button></div></div>').join(''):'<p class="hint">'+t('今天尚无主线任务','今日のタスクはありません')+'</p>';
 $('mlTasks').onclick=e=>{const b=e.target.closest('button'),row=e.target.closest('[data-task]');if(!b||!row)return;const d=get(),arr=d.daily[date()]||[],i=arr.findIndex(x=>x.id===row.dataset.task);if(i<0)return;if(b.hasAttribute('data-remove')){if(!confirm(t('删除此任务？','削除しますか？')))return;arr.splice(i,1)}else if(b.hasAttribute('data-save')){const raw=row.querySelector('[data-actual]').value,n=raw===''?null:Number(raw);if(n!==null&&(!Number.isFinite(n)||n<0||n>1440)){alert(t('实际分钟无效','実績時間が無効です'));return}arr[i].actualMinutes=n;arr[i].start=row.querySelector('[data-start]').value;arr[i].status=row.querySelector('[data-status]').value}else return;if(safeSave(d))render()};
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
function setupToolbar(){
 const header=document.querySelector('.top'),bar=document.createElement('div');
 bar.className='v2-toolbar';bar.id='v2Toolbar';
 bar.innerHTML='<label class="v2-toolbar-date"><span id="v2DateCaption">记录日期</span><input type="date" class="input" id="v2GlobalDate" aria-label="记录日期"></label><button type="button" class="btn" id="v2GoBackup">备份与恢复</button>';
 header.insertAdjacentElement('afterend',bar);
 $('v2GlobalDate').value=date();
 $('v2GlobalDate').addEventListener('change',()=>{if(!$('v2GlobalDate').value)return;$('date').value=$('v2GlobalDate').value;$('date').dispatchEvent(new Event('change',{bubbles:true}));});
 $('date').addEventListener('change',()=>{$('v2GlobalDate').value=date()});
 $('v2GoBackup').onclick=()=>{B.goV2('stats');applyLanguage()};
}
function setupLanguage(){
 const header=$('v2Toolbar'),wrap=document.createElement('label');wrap.className='v2-lang';wrap.innerHTML='<span>Language</span><select class="input" id="v2Language"><option value="zh">中文</option><option value="ja">日本語</option></select>';header.prepend(wrap);$('v2Language').value=lang();
 $('v2Language').onchange=e=>{localStorage.setItem(S.LANG_KEY,e.target.value);applyLanguage();render()};
 applyLanguage();
}
function applyLanguage(){
 const ja=lang()==='ja';
 document.documentElement.lang=ja?'ja':'zh-CN';
 document.title=t('学习与成长记录','学習・成長記録');
 document.querySelectorAll('.v2-nav button').forEach(b=>{
   const names={today:['今日','今日'],plan:['计划','計画'],mainline:['主线','メイン'],journal:['日记','日記'],stats:['统计','統計']};
   const label=names[b.dataset.page];const textNode=[...b.childNodes].find(n=>n.nodeType===3);
   if(label&&textNode)textNode.textContent=label[ja?1:0];
 });
 if(window.MomoI18n)window.MomoI18n.apply();
}
function dailySummary(key=date()){
 const d=get().reviews[key]||{};
 if(Object.prototype.hasOwnProperty.call(d,'mergedSummary'))return String(d.mergedSummary??'');
 const old=key===date()?B.record().reflection:(B.getDb()[key]?.reflection||'');
 return [...new Set([old,d.feeling,d.summary].map(x=>String(x||'').trim()).filter(Boolean))].join('\n\n');
}
function setupJournal(){
 const host=$('v2-diary');if(!host)return;
 const legacy=$('reflection')?.closest('.field');
 if(legacy){legacy.hidden=true;legacy.style.display='none'}
 const box=document.createElement('div');box.className='card v2-extra';
 box.innerHTML='<h2 id="v2JournalExtraTitle">'+t('总结','振り返り')+'</h2><p class="hint">'+t('记录今天学了什么、遇到的问题和感受。学习感想与今日总结合并在这里，旧内容会保留。','今日学んだこと・疑問・感想をまとめて記録します。以前の内容も残ります。')+'</p><div class="field"><label for="v2DaySummary">'+t('总结','振り返り')+'</label><textarea class="input" id="v2DaySummary" rows="7" placeholder="'+t('今天的学习情况、收获、感想、下次改进……','今日の学習内容・成果・感想・次に改善したいこと……')+'"></textarea></div><button class="btn primary" id="v2SaveJournalExtra">'+t('保存总结','振り返りを保存')+'</button>';
 host.append(box);
 const load=()=>{$('v2DaySummary').value=dailySummary()};
 $('v2SaveJournalExtra').onclick=()=>{
   const d=get();d.reviews[date()]={...(d.reviews[date()]||{}),mergedSummary:$('v2DaySummary').value};
   if(safeSave(d))B.toast(t('总结已保存','振り返りを保存しました'));
 };
 $('date').addEventListener('change',()=>setTimeout(()=>{load();render();if(typeof window.MomoV2Refresh==='function')window.MomoV2Refresh()},0));
 load();
}
function setupOverview(){
 const slot=$('v2-today-slot'),box=document.createElement('div');box.className='card';box.innerHTML='<div class="card-head"><h2 id="v2OverviewTitle">今日主线任务</h2><button class="btn" id="v2OverviewOpen">查看主线</button></div><div id="v2OverviewTasks"></div>';slot.prepend(box);
 $('v2OverviewOpen').onclick=()=>B.goV2('mainline');
 const update=()=>{const d=get(),tasks=d.daily[date()]||[];$('v2OverviewTasks').innerHTML=tasks.length?tasks.map(x=>'<div class="record">'+esc(x.title)+' · '+(x.status==='done'?t('已完成','完了'):x.status==='progress'?t('进行中','進行中'):t('未完成/未开始','未完了・未開始'))+'</div>').join(''):'<p class="hint">'+t('尚无主线任务','メインタスクはまだありません')+'</p>'};
 const orig=B.goV2;B.goV2=p=>{orig(p);if(p==='mainline')render();if(p==='today')update();if(p==='journal')$('v2DaySummary').value=dailySummary();applyLanguage()};
 document.querySelector('.v2-nav').addEventListener('click',()=>{update();render();applyLanguage()});
 window.MomoV2Refresh=update;update();
}
function setupPlanAndStats(){
 const plan=$('v2-plan'),stats=$('v2-stats');
 if(plan){const card=document.createElement('div');card.className='card';card.innerHTML='<h2 id="v2LinkedPlanTitle">白天主线学习计划</h2><p class="hint" id="v2LinkedPlanHint">主线任务的时间与状态在主线页面管理，此处只读取，不重复创建。</p><div id="v2LinkedPlan"></div><button class="btn" id="v2LinkedPlanOpen">管理主线任务</button>';plan.append(card);$('v2LinkedPlanOpen').onclick=()=>B.goV2('mainline')}
 if(stats){const card=document.createElement('div');card.className='card';card.innerHTML='<h2 id="v2LinkedStatsTitle">主线学习统计</h2><p class="hint" id="v2LinkedStatsHint">未记录实际时间不计入时长。</p><div id="v2LinkedStats"></div>';stats.append(card)}
 const refresh=()=>{const d=get(),tasks=d.daily[date()]||[];if($('v2LinkedPlan'))$('v2LinkedPlan').innerHTML=tasks.length?tasks.map(x=>'<div class="record">'+esc(x.title)+' · '+(x.plannedMinutes??'—')+t('分钟','分')+' · '+(x.actualMinutes===null?t('实际未记录','実績未記録'):x.actualMinutes+t('分钟','分'))+'</div>').join(''):'<p class="hint">'+t('暂无主线计划','予定なし')+'</p>';if($('v2LinkedStats')){const all=Object.values(d.daily).flat().filter(x=>x&&typeof x==='object');const total=all.reduce((n,x)=>n+(typeof x.actualMinutes==='number'?x.actualMinutes:0),0);const known=all.filter(x=>typeof x.actualMinutes==='number').length;const done=all.filter(x=>x.status==='done').length;$('v2LinkedStats').textContent=t('累计有记录的主线学习：','記録済みの学習時間：')+total+t('分钟；有实际时间的任务 ','分、実績記録タスク ')+known+t('项；已完成 ','件、完了 ')+done+t('项','件')}};
 document.querySelector('.v2-nav').addEventListener('click',()=>setTimeout(refresh,0));$('date').addEventListener('change',()=>setTimeout(refresh,0));window.MomoV2RefreshAll=refresh;refresh();
}
setupBackup();setupToolbar();setupLanguage();setupJournal();setupOverview();setupPlanAndStats();render();
})();