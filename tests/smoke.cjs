const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);return res.end();}
  fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'text/plain');res.end(b);
  });
});
function listen(){return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)))}
(async()=>{
  const port=await listen();let browser,page;
  const errors=[];
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    page=await browser.newPage({viewport:{width:1280,height:800},acceptDownloads:true});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
    await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'networkidle'});
    assert.equal(await page.title(),'学习与成长记录');
    assert.equal(await page.locator('.v2-nav button').count(),5);
    for(const dest of ['plan','journal','stats','today']){
      await page.locator('.v2-nav button[data-page="'+dest+'"]').click();
      assert.ok(await page.locator('#v2-'+dest).evaluate(el=>el.classList.contains('active')),'navigation '+dest);
    }
    await page.locator('.v2-nav button[data-page="mainline"]').click();
    assert.ok(await page.locator('#mlAdd').isVisible(),'mainline add visible');
    const prompts=['Java复习','掌握Section17'];
    page.on('dialog',async dlg=>{if(dlg.type()==='prompt')await dlg.accept(prompts.shift()||'');else await dlg.accept()});
    await page.locator('#mlAdd').click();
    assert.equal(await page.locator('#mlSelect option').count(),1);
    await page.locator('#mlProgress').fill('Section 11 Lesson 65');
    await page.locator('#mlSave').click();
    await page.locator('#mlTaskName').fill('Java メソッド练习');
    await page.locator('#mlTaskMinutes').fill('45');
    await page.locator('#mlTaskAdd').click();
    assert.equal(await page.locator('[data-task]').count(),1);
    await page.locator('[data-task] [data-status]').selectOption('done');
    await page.locator('[data-task] [data-actual]').fill('0');
    await page.locator('[data-task] [data-save]').click();
    assert.equal(await page.locator('[data-task] [data-actual]').inputValue(),'0');
    await page.locator('[data-note] [data-notes]').fill('了解方法的参数与返回值');
    await page.locator('[data-note] [data-save-note]').click();
    await page.locator('[data-note] [data-code]').fill('public int add(int a,int b){return a+b;}');
    await page.locator('[data-note] [data-add-code]').click();
    assert.match(await page.locator('#mlNotes pre').first().textContent(),/public int add/);
    await page.reload({waitUntil:'networkidle'});
    await page.locator('.v2-nav button[data-page="mainline"]').click();
    assert.equal(await page.locator('#mlProgress').inputValue(),'Section 11 Lesson 65');
    assert.equal(await page.locator('[data-task] [data-actual]').inputValue(),'0');
    assert.match(await page.locator('[data-note] [data-notes]').inputValue(),/了解方法/);
    await page.locator('#v2Language').selectOption('ja');
    assert.equal(await page.title(),'学習・成長記録');
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('#v2Language').inputValue(),'ja');
    await page.locator('#v2Language').selectOption('zh');
    await page.locator('.v2-nav button[data-page="today"]').click();
    assert.match(await page.locator('#v2OverviewTasks').innerText(),/Java メソッド练习/);
    await page.locator('#v2Share').click();
    assert.match(await page.locator('#v2Body').inputValue(),/【晨间日记】/);
    assert.match(await page.locator('#v2Body').inputValue(),/Java メソッド练习/);
    await page.locator('#v2CloseShare').click();
    await page.locator('.v2-nav button[data-page="stats"]').click();
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#v2FullExport').click()]);
    assert.match(download.suggestedFilename(),/^study-journal-v2-/);
    const content=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(content.format,'momo-study-full-backup');
    assert.equal(content.mainline.mainlines.length,1);
    assert.equal(content.mainline.daily[Object.keys(content.mainline.daily)[0]][0].actualMinutes,0);
    assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
    const mobile=await browser.newPage({viewport:{width:375,height:812},isMobile:true});
    mobile.on('pageerror',e=>errors.push('mobile: '+e.message));
    await mobile.goto('http://127.0.0.1:'+port+'/index.html');
    assert.equal(await mobile.locator('.v2-nav button').count(),5);
    await mobile.locator('.v2-nav button[data-page="mainline"]').click();
    assert.ok(await mobile.locator('#mlAdd').isVisible());
    assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
    console.log('PASS: 5 navigation tabs, mainline CRUD, notes/code, storage reload, bilingual, sharing, backup, mobile');
  }catch(e){console.error('FAIL: '+e.stack);if(page){fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});await page.screenshot({path:path.join(__dirname,'screenshots','failure.png'),fullPage:true}).catch(()=>{})}process.exitCode=1}
  finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})();