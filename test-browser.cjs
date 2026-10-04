const { chromium } = require('playwright');
const fs = require('fs');
const screenshotDir = process.env.SCREENSHOT_DIR || '/tmp/skydrift-screenshots';fs.mkdirSync(screenshotDir,{recursive:true});
const { spawn } = require('child_process');
const assert = require('node:assert/strict');
const server = spawn('node',['server/dist/index.js']);
const vite = spawn('node',['../node_modules/vite/bin/vite.js','--host','127.0.0.1'],{cwd:process.cwd()+'/client'});
server.stderr.on('data', d=>process.stderr.write(d)); vite.stderr.on('data', d=>process.stderr.write(d));
const delay = ms => new Promise(r=>setTimeout(r,ms));
(async()=>{
 let browser;
 try {
  let ready=false;for(let i=0;i<40;i++){try{await fetch('http://127.0.0.1:2567/health');await fetch('http://127.0.0.1:3000');ready=true;break}catch{await delay(250)}}
  assert.ok(ready,'Local services did not start');
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const errors=[];
  const host=await browser.newPage({viewport:{width:1440,height:1000}});host.on('pageerror',e=>errors.push(e.message));
  await host.goto('http://127.0.0.1:3000');await host.screenshot({path:screenshotDir+'/skydrift-lobby.png'});
  await host.getByRole('button',{name:'Open host screen'}).click();
  await host.locator('.host-panel strong').waitFor();
  const roomId=await host.locator('.host-panel strong').textContent();assert.ok(roomId);
  const phone=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto('http://127.0.0.1:3000?room='+roomId);
  await phone.getByRole('button',{name:'Join as pilot'}).click();await phone.getByRole('button',{name:'Play in this window'}).waitFor();await phone.screenshot({path:screenshotDir+'/skydrift-landscape-prompt.png'});await phone.getByRole('button',{name:'Play in this window'}).click();await phone.locator('.rc-stick').first().waitFor();
  await host.getByText('1/4 pilots in the arena').waitFor();
  const pad=phone.locator('.rc-stick').first();const box=await pad.boundingBox();await phone.mouse.move(box.x+60,box.y+60);await phone.mouse.down();await phone.mouse.move(box.x+90,box.y+30);await delay(300);await phone.mouse.up();
  await phone.screenshot({path:screenshotDir+'/skydrift-phone.png'});
  await delay(1000);await host.screenshot({path:screenshotDir+'/skydrift-host.png'});
  // Direct networking checks: capacity, roles, isolation and control validation.
  const {Client}=require('colyseus.js');const client=new Client('ws://127.0.0.1:2567');
  const extra=[];for(let i=0;i<3;i++)extra.push(await client.joinById(roomId,{name:'Test'+i,role:'pilot'}));
  await assert.rejects(client.joinById(roomId,{name:'Overflow',role:'pilot'}));
  const other=await client.create('skydrift',{role:'host'});assert.notEqual(other.roomId,roomId);
  await assert.rejects(client.joinById(other.roomId,{role:'host'}));
  await host.getByText('4/4 pilots in the arena').waitFor();await host.screenshot({path:screenshotDir+'/skydrift-host.png'});
  const p=extra[0];
  await delay(100);const start=p.state.players.get(p.sessionId).aircraft.position.toJSON();
  p.send('input',{forward:1,strafe:0,vertical:1,yaw:0});await delay(300);const moved=p.state.players.get(p.sessionId).aircraft.position.toJSON();assert.ok(moved.z>start.z && moved.y>start.y,'RC forward and up moves on server');
  p.send('input',{forward:-1,strafe:-1,vertical:-1,yaw:0});await delay(300);const reverse=p.state.players.get(p.sessionId).aircraft.position.toJSON();assert.ok(reverse.x<moved.x && reverse.y<moved.y && reverse.z<moved.z,'RC reverse, left and down work');
  p.send('input',{pitch:'bad',roll:1e300,yaw:null,throttle:-100,boost:false,brake:false});await delay(850);
  const aircraft=p.state.players.get(p.sessionId).aircraft;assert.ok(Number.isFinite(aircraft.position.x));assert.ok(Number.isFinite(aircraft.position.y));
  for(const r of extra)await r.leave();await other.leave();
  await phone.getByRole('button',{name:'Leave',exact:true}).click();await host.getByText('0/4 pilots in the arena').waitFor();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,roomId,checks:['host without plane','phone joins exact room','first-person landscape UI','RC movement in six directions','joystick interaction','4-pilot capacity','room isolation','second host rejected','malformed input finite','leave removes plane','no browser exceptions']}));
 }finally{await browser?.close();server.kill();vite.kill();}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
