const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const source = readFileSync(join(__dirname, '..', 'content.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
async function harness({ role='mosaic', blocked=false, ready=true }={}) {
  const messages=[], listeners={}, videoEvents={}, transitions=[];
  let gesture=false, requested=0, paused=0, keyHandler, runtimeHandler;
  const state={managed:true,role,visible:false,presentation:'pip',preparing:true};
  const element = () => ({textContent:'',hidden:false,dataset:{},attrs:{},
    getAttribute(name){return this.attrs[name];},setAttribute(name,value){this.attrs[name]=value;},
    addEventListener(name,fn){this[name]=fn;},click(){this.clickHandler?.();}
  });
  const buttons=Array.from({length:6},(_,i)=>Object.assign(element(),{dataset:{signal:String(i+1)}}));
  const ids=Object.fromEntries(['toggle','side','return-main','status','pip-hint'].map(id=>[id,element()]));
  for(const button of [...buttons,...Object.values(ids)]) button.addEventListener=(name,fn)=>{button[name==='click'?'clickHandler':name]=fn;};
  const root={innerHTML:'',getElementById:id=>ids[id],querySelectorAll:()=>buttons};
  const host={style:{},isConnected:false,attachShadow:()=>root,getBoundingClientRect:()=>({height:60})};
  const document={readyState:'complete',pictureInPictureEnabled:true,pictureInPictureElement:null,
    documentElement:{append(){host.isConnected=true;}},createElement:()=>host,querySelector:()=>video};
  const video={readyState:ready?4:0,videoWidth:ready?640:0,disablePictureInPicture:blocked,muted:false,paused:false,
    addEventListener(name,fn){videoEvents[name]=fn;},closest(){return null;},
    play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;paused++;},
    requestPictureInPicture(){assert.equal(gesture,true,'PiP must run during source-page gesture');requested++;document.pictureInPictureElement=this;videoEvents.enterpictureinpicture();return Promise.resolve();}
  };
  document.exitPictureInPicture=()=>{document.pictureInPictureElement=null;videoEvents.leavepictureinpicture();return Promise.resolve();};
  const window={addEventListener(name,fn,options){listeners[name]=options;if(name==='keydown')keyHandler=fn;}};window.top=window;
  const chrome={runtime:{onMessage:{addListener(fn){runtimeHandler=fn;}},
    async sendMessage(message){messages.push(message);if(message.type==='state')return state;if(message.type==='floating')return {visible:false,presentation:'pip',preparing:true};return {ok:true};}
  }};
  const urls=Array.from({length:7},(_,i)=>`https://www.recordplus.com/player/channel/s${i+1}`);
  runInNewContext(source,{window,document,chrome,FazendaViewer:{urls},FazendaTransition:{show(until,signal){if(until)transitions.push({signal});},finish(){},resize(){}},URL,location:{href:urls[0],pathname:'/player/channel/s1'},MutationObserver:class{observe(){}},setInterval(){},setTimeout(){},requestAnimationFrame(fn){fn();},console});
  await flush();
  return {messages,video,ids,listeners,transitions,get requested(){return requested;},get paused(){return paused;},
    async click(id){gesture=true;ids[id].click();gesture=false;await flush();},
    async key(key,extra={}){const event={key,repeat:false,composedPath:()=>[],preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};gesture=true;keyHandler(event);gesture=false;await flush();return event;},
    async state(update){runtimeHandler({type:'viewer-state',...state,...update},{},()=>{});await flush();},
    async exit(){await new Promise(resolve=>runtimeHandler({type:'pip-exit'},{},resolve));await flush();},
    async close(){await document.exitPictureInPicture();await flush();}
    ,async nativePiP(){videoEvents.enterpictureinpicture?.();await flush();}
  };
}

test('source click opens muted PiP in the gesture and reports real enter/leave events', async()=>{
  const h=await harness();await h.click('toggle');
  assert.equal(h.requested,1);assert.equal(h.video.muted,true);
  assert.ok(h.messages.some(message=>message.type==='pip-state'&&message.visible===true));
  assert.equal(h.ids.toggle.textContent,'Fechar miniplayer');
  await h.close();
  assert.ok(h.messages.some(message=>message.type==='pip-state'&&message.visible===false));
  assert.equal(h.video.paused,true);
  assert.equal(h.ids.toggle.textContent,'Abrir miniplayer');
});

test('signal switching covers only the main page and skips the current signal', async()=>{
  const main=await harness({role:'main'});
  await main.key('1');assert.equal(main.transitions.length,0);
  await main.key('2');assert.deepEqual(main.transitions,[{signal:2}]);
  const mosaic=await harness();await mosaic.key('3');
  assert.equal(mosaic.transitions.length,0,'the playing mosaic must not be covered');
});

test('state broadcasts never try to open PiP without a user gesture', async()=>{
  const h=await harness();await h.state({visible:false,preparing:true});
  assert.equal(h.requested,0);assert.equal(h.video.paused,false);
  await h.state({visible:false,preparing:false});assert.equal(h.video.paused,true);
});

test('main button prepares the source tab rather than requesting PiP on the main video', async()=>{
  const h=await harness({role:'main'});await h.click('toggle');
  assert.equal(h.requested,0);
  assert.ok(h.messages.some(message=>message.type==='floating'));
});

test('native PiP on the main signal does not claim that the mosaic is floating', async()=>{
  const h=await harness({role:'main'});await h.nativePiP();
  assert.equal(h.ids.toggle.textContent,'Mosaico flutuante');
  assert.equal(h.messages.some(message=>message.type==='pip-state'),false);
});

test('blocked and unloaded video retain working fallback controls and explain the limitation', async()=>{
  const blocked=await harness({blocked:true});await blocked.click('toggle');
  assert.equal(blocked.requested,0);assert.match(blocked.ids.status.textContent,/Ver lado a lado/);
  await blocked.click('side');assert.ok(blocked.messages.some(message=>message.type==='toggle'));
  const loading=await harness({ready:false});await loading.click('toggle');
  assert.equal(loading.requested,0);assert.match(loading.ids.status.textContent,/Espere o vídeo/);
});

test('remote close exits PiP without a gesture and pauses the mosaic', async()=>{
  const h=await harness();await h.click('toggle');await h.exit();
  assert.equal(h.video.paused,true);
  assert.ok(h.messages.some(message=>message.type==='pip-state'&&message.visible===false));
});

test('M is captured for PiP; held keys, modifiers and editing fields remain safe', async()=>{
  const h=await harness();
  assert.equal(h.listeners.keydown.capture,true);
  await h.key('m',{repeat:true});assert.equal(h.requested,0);
  await h.key('m',{metaKey:true});assert.equal(h.requested,0);
  await h.key('m',{composedPath:()=>[{isContentEditable:true}]});assert.equal(h.requested,0);
  const event=await h.key('m');assert.equal(h.requested,1);assert.equal(event.stopped,true);
  await h.key('4');assert.ok(h.messages.some(message=>message.type==='select'&&message.signal===4));
});
