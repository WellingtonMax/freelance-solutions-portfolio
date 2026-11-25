const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { resolve } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const app = {
  home:'', history:'workspace/', excel:'01-excel-rescue/try.html', sales:'02-sales-intelligence/sample-explorer.html',
  api:'03-api-bridge/mapper.html', crm:'04-crm-lead-intelligence/demo-ui.html', landing:'05-landing-page-studio/index.html',
  quote:'06-document-factory/demo-ui.html', quality:'07-data-quality-auditor/demo-ui.html', changes:'08-site-change-monitor/demo-ui.html',
  docflow:'demos/document-flow/', paw:'demos/vet-loyalty/', lab:'products/stratasignal/demo/report.html',
};

async function main() {
  // Include an arbitrary subdirectory like GitHub Pages' /repository-name/.
  const root = resolve(__dirname, '..'), port = process.env.TEST_PORT || '8971';
  const repo = root.split(/[\\/]/).at(-1);
  const base = process.env.DEMO_URL || `http://127.0.0.1:${port}/${repo}/`;
  const server = process.env.DEMO_URL ? null : spawn('python', ['-m','http.server',port,'--bind','127.0.0.1','--directory',resolve(root,'..')], { stdio:'ignore' });
  let browser;
  try {
    if (server) for (let attempt=0; attempt<40; attempt++) {
      if (await fetch(base).then(res => res.ok, () => false)) break;
      await new Promise(done => setTimeout(done,100));
    }
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox'] } : {});
    const ctx = await browser.newContext({ acceptDownloads:true });
    const errors = [], remote = [];
    const guard = resource => {
      if (!resource.url().startsWith(base)) remote.push(resource.url());
    };
    ctx.on('request', guard);
    const watch = tab => {
      tab.on('pageerror', error => errors.push([tab.url(),error.message]));
      tab.on('console', msg => { if (msg.type() === 'error') errors.push([tab.url(),msg.text()]); });
      return tab;
    };
    const page = watch(await ctx.newPage());
    page.setDefaultTimeout(5000);
    const open = async (key, tab=page) => assert((await tab.goto(base+app[key])).ok(), key);
    const check = async (selector, expected, tab=page) => {
      try { await tab.waitForFunction(([s,t]) => document.querySelector(s)?.textContent.includes(t), [selector,expected]); }
      catch (error) {
        throw new Error(`Expected "${expected}" at ${tab.url()} ${selector}, got "${await tab.locator(selector).first().textContent()}"; browser errors: ${JSON.stringify(errors)}`, {cause:error});
      }
    };
    const click = selector => page.locator(selector).click();
    const save = async (tab=page) => {
      await tab.getByRole('button',{name:'Save run',exact:true}).click();
      await check('.local-history [role=status]', 'Run saved in this browser.', tab);
    };
    const download = async (selector, filename) => {
      const task = page.waitForEvent('download');
      await click(selector);
      const file = await task;
      assert.equal(file.suggestedFilename(), filename);
      const stream = await file.createReadStream(), chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      return Buffer.concat(chunks);
    };
    const noOverflow = async label => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label);
    for (const width of [320,375,768,1280]) {
      await page.setViewportSize({width,height:820});
      for (const key of Object.keys(app)) {
        await open(key); await noOverflow(`${key} at ${width}px`);
      }
    }
    await open('home');
    assert.equal(await page.locator('.grid article:visible').count(),7);
    await page.selectOption('#catalog-theme','Operations');
    assert.equal(await page.locator('.grid article:visible').count(),2);
    await check('#catalog-status','Showing 2 of 7');
    await open('excel');
    await click('#sample'); await check('#totals','1 accepted'); await save();
    await open('sales');
    await page.selectOption('#category','Travel'); await check('#revenue','$90.00'); await save();
    await open('api');
    await click('#preview'); await check('#summary','3 records'); await save();
    assert.match((await download('#download','api-bridge-fictional-export.csv')).toString(), /River Demo/);
    await page.getByRole('checkbox',{name:'amount',exact:true}).uncheck();
    assert(await page.locator('#download').isDisabled());
    assert.equal(await page.locator('#summary').textContent(), '');
    await click('#preview'); await check('#summary','3 columns');
    await open('crm');
    await page.selectOption('#filter','Suppressed');
    await check('#result','Showing 2 fictional companies'); await check('#details','Opted out'); await save();
    await open('landing');
    await page.locator('#full-name').fill('Fictional Person');
    await page.locator('#email').fill('synthetic@example.test');
    await page.locator('#message').fill('This is a synthetic portfolio enquiry.');
    await click('#enquiry button'); await check('#feedback','Fields look valid'); await save();
    await open('quote');
    await page.locator('#qty').fill('4'); await page.locator('#discount').fill('15');
    await check('#stats','$425.00'); await save();
    await open('quality');
    await check('#result','Showing 4 of 4');
    await page.selectOption('#filter','Duplicate ID'); await check('#result','Showing 2 of 4');
    assert.match((await download('#download','catalog-audit-findings.csv')).toString(), /3,Duplicate ID/);
    await save();
    await open('changes');
    await check('#result','4 lines shown');
    assert.match((await download('#download','snapshot-diff.txt')).toString(), /\+ Price \$120/);
    await save();
    await open('docflow');
    await check('#status','Ready: all custom fields mapped.');
    assert.match((await download('#btn-csv','variable_mapping_SAMPLE.csv')).toString(), /Client.Company/);
    await save();
    await open('paw');
    await page.setViewportSize({width:320,height:720});
    for (const nav of ['members','rewards','transactions','settings','overview']) {
      await click(`[data-view="${nav}"]`); await noOverflow(`PawLedger ${nav}`);
    }
    await click('[data-view=members]');
    await page.locator('#search').fill(' OLIVIA ');
    await check('#member-count','1 member shown');
    await page.locator('#search').fill('missing synthetic member');
    await check('#member-count','0 members shown');
    await check('.table-wrap','No matching fictional members.');
    await click('[data-view=overview]');
    await page.getByRole('button',{name:'New member'}).click();
    assert(await page.locator('#name').evaluate(el => document.activeElement === el));
    await page.keyboard.press('Escape');
    assert(await page.locator('[data-action=add]').evaluate(el => document.activeElement === el));
    await click('[data-action=add]');
    await page.locator('#name').fill('Fictional Alias Input');
    await page.locator('#pet').fill('Sample Pet');
    await page.locator('#email').fill('alias@example.test');
    await page.getByRole('button',{name:'Enroll member',exact:true}).click();
    await click('[data-action=purchase]');
    await page.locator('#person').selectOption({ label:'Fictional Alias Input · Sample Pet' });
    await page.locator('#amount').fill('220.00');
    await page.locator('#modal').getByRole('button',{name:'Record purchase',exact:true}).click();
    await click('.checkpoint summary'); await click('#checkpoint-save');
    await check('#checkpoint-status','Simulation saved');
    await page.reload();
    await click('.checkpoint summary'); await click('#checkpoint-load');
    await check('#checkpoint-status','Saved simulation restored');
    await click('[data-view=transactions]');
    await check('.table-wrap','$220.00'); await check('.table-wrap','Demo member 8');
    assert(!(await page.locator('.table-wrap').textContent()).includes('Fictional Alias Input'));
    await save();
    await click('#checkpoint-clear'); await check('#checkpoint-status','Saved simulation deleted');
    await click('#checkpoint-load'); await check('#checkpoint-status','No saved simulation yet.');

    // Two writes issued together from separate tabs must not clobber the same SQLite file.
    const other = watch(await ctx.newPage());
    await open('sales'); await open('quote',other);
    await Promise.all([save(),save(other)]);
    await other.close();
    await open('history');
    await check('#status','12 of 12 saved runs');
    await page.selectOption('#project','quote');
    await check('#status','2 of 12 saved runs');
    const binary = await download('#export','portfolio-runs.sqlite3');
    assert.equal(binary.subarray(0,16).toString(), 'SQLite format 3\0');
    assert(!binary.includes('synthetic@example.test'));
    assert(!binary.includes('Fictional Alias Input'));
    assert(!binary.includes('checkpoint'));
    await page.locator('#runs button').first().click();
    await check('#status','1 of 11 saved runs');
    await page.reload();
    await check('#status','11 of 11 saved runs');
    await click('#clear'); await click('#cancel-clear'); await check('#status','11 of 11 saved runs');
    await click('#clear'); await click('#confirm-clear'); await check('#status','0 of 0 saved runs');
    await page.reload(); await check('#status','0 of 0 saved runs');
    assert.deepEqual(remote, [], 'no off-origin requests');
    assert.deepEqual(errors, [], 'no browser errors');
    console.log('Passed: 13 routes × 4 widths, 10 demo saves, concurrent writes, download/delete, and PawLedger restore.');
  } finally {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      server.kill();
      await once(server,'exit');
    }
  }
}
main().catch(error => { console.error(error); process.exitCode=1; });
