const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createContext, runInContext } = require('node:vm');
const source = readFileSync(join(__dirname, '..', 'background.js'), 'utf8');
function harness({ split = false, splitFails = false } = {}) {
  const tabs = new Map([[10, {id:10,windowId:1,index:0,url:'https://example.org/'}]]);
  const windows = new Map([[1,{id:1,left:30,top:40,width:1200,height:800,state:'normal'}]]);
  const values = {};
  const updates = [];
  const messages = [];
  let pipExitError;
  let navigationError;
  const listeners = {};
  let nextTab = 11, nextWindow = 2, created = 0;
  const event = name => ({ addListener(fn) { listeners[name] = fn; } });
  const copy = value => JSON.parse(JSON.stringify(value));
  const chrome = {
    storage: {session: {
      async get(key) { return {[key]:values[key] && copy(values[key])}; },
      async set(object) { Object.assign(values,copy(object)); },
      async remove(key) { delete values[key]; }
    }},
    action: {onClicked:event('action'),async setBadgeText(){},async setTitle(){}},
    runtime: {onMessage:event('message')},
    windows: {
      async get(id) { if (!windows.has(id)) throw Error('window missing'); return copy(windows.get(id)); },
      async getLastFocused() { return copy(windows.get(1)); },
      async create(options) {
        created++;
        const w = {id:nextWindow++,left:0,top:0,width:1200,height:800,state:'normal',...options};
        let tab;
        if (options.tabId) { tab = tabs.get(options.tabId); tab.windowId = w.id; tab.index=0; }
        else { tab={id:nextTab++,windowId:w.id,index:0,url:options.url}; tabs.set(tab.id,tab); }
        windows.set(w.id,w);
        return {...copy(w),tabs:[copy(tab)]};
      },
      async update(id, options) { updates.push({id,...options}); Object.assign(windows.get(id),options); return copy(windows.get(id)); }
    },
    tabs: {
      onRemoved:event('removed'),
      async get(id) { if (!tabs.has(id)) throw Error('tab missing'); return copy(tabs.get(id)); },
      async create(options) {const tab={id:nextTab++,index:0,...options};tabs.set(tab.id,tab);return copy(tab);},
      async update(id, options) { if (!tabs.has(id)) throw Error('tab missing'); if(options.url && navigationError) throw Error(navigationError); Object.assign(tabs.get(id),options); return copy(tabs.get(id)); },
      async move(id, options) { Object.assign(tabs.get(id),options);return copy(tabs.get(id)); },
      async remove(id) { tabs.delete(id); },
      async sendMessage(id, message) { messages.push({id, ...message}); if (message.type === 'pip-exit' && pipExitError) return {error:pipExitError}; }
    }
  };
  if (split) {
    chrome.tabs.createSplit = async ids => {
      if (splitFails) throw Error('Split View disabled');
      ids.forEach(id => tabs.get(id).splitViewId=77);
      return 77;
    };
    chrome.tabs.unsplit = async () => tabs.forEach(tab => delete tab.splitViewId);
  }
  const context = createContext({chrome,URL});
  context.importScripts = filename => runInContext(readFileSync(join(__dirname, '..', filename), 'utf8'), context);
  runInContext(source,context);
  return {tabs,windows,updates,values,messages,
    failPiPExit(error) {pipExitError=error;},
    failNavigation(error) {navigationError=error;},
    get state() {return values.viewer;}, get created(){return created;},
    async launch() {await listeners.action(tabs.get(10));},
    async message(message, role='main') {
      const tab = tabs.get(role==='main' ? values.viewer.mainTabId : values.viewer.mosaicTabId);
      return new Promise(resolve => listeners.message(message,{tab,frameId:0,url:tab.url},resolve));
    },
    async closeMain() {const id=values.viewer.mainTabId;tabs.delete(id);await listeners.removed(id);}
    ,async closeMosaic() {const id=values.viewer.mosaicTabId;tabs.delete(id);await listeners.removed(id);}
  };
}

test('opens an original top-level player in a dedicated window', async () => {
  const h=harness(); await h.launch();
  assert.match(h.tabs.get(h.state.mainTabId).url,/\/player\/channel\//);
  assert.equal(h.windows.get(h.state.mainWindowId).type,'normal');
  assert.deepEqual(h.updates,[]);
  await h.launch();
  assert.equal(h.created,1,'repeat clicks reuse the viewer');
});

test('new main documents receive a bounded transition deadline; failures clear it', async()=>{
  const h=harness();await h.launch();
  await h.message({type:'select',signal:1});assert.equal(h.state.transitionUntil,undefined);
  const before=Date.now();await h.message({type:'select',signal:2});
  const state=await h.message({type:'state'});
  assert.equal(state.transitionSignal,2);
  assert.ok(state.transitionUntil>=before && state.transitionUntil<=Date.now()+1800);
  h.failNavigation('Navigation failed');
  const failed=await h.message({type:'select',signal:3});
  assert.equal(failed.error,'Navigation failed');
  assert.equal(h.state.transitionUntil,undefined);
  assert.equal(h.state.transitionSignal,undefined);
});

test('switching signals leaves the loaded mosaic unchanged', async () => {
  const h=harness();await h.launch();await h.message({type:'toggle'});
  const mosaic={...h.tabs.get(h.state.mosaicTabId)};
  const answer=await h.message({type:'select',signal:4},'mosaic');
  assert.equal(answer.ok,true);
  assert.match(h.tabs.get(h.state.mainTabId).url,/ZjE4c2luYWw0$/);
  assert.deepEqual(h.tabs.get(h.state.mosaicTabId),mosaic);
  assert.equal(h.created,2);
  assert.ok(h.updates.every(update=>update.id!==1),'original browser window is untouched');
});

test('selecting the current signal does not restart the page or player', async () => {
  const h=harness();await h.launch();
  const before={...h.tabs.get(h.state.mainTabId)};
  const answer=await h.message({type:'select',signal:1});
  assert.equal(answer.changed,false);
  assert.deepEqual(h.tabs.get(h.state.mainTabId),before);
  assert.equal(h.updates.length,0);
});

test('hiding and restoring reuses the mosaic and restores the main bounds', async () => {
  const h=harness();await h.launch();await h.message({type:'toggle'});
  const id=h.state.mosaicTabId;
  await h.message({type:'toggle'});
  assert.equal(h.state.visible,false);
  assert.equal(h.windows.get(h.state.mosaicWindowId).state,'minimized');
  assert.equal(h.windows.get(h.state.mainWindowId).width,1200);
  await h.message({type:'toggle'});
  assert.equal(h.state.visible,true);
  assert.equal(h.state.mosaicTabId,id);
  assert.equal(h.tabs.get(id).muted,true);
  assert.equal(h.created,2);
});

test('native Split View parks and restores the same mosaic tab', async () => {
  const h=harness({split:true});await h.launch();await h.message({type:'toggle'});
  const id=h.state.mosaicTabId;
  assert.equal(h.state.splitId,77);
  assert.equal(h.created,1);
  await h.message({type:'toggle'});
  assert.equal(h.state.visible,false);
  assert.equal(h.windows.get(h.state.mosaicWindowId).state,'minimized');
  await h.message({type:'toggle'});
  assert.equal(h.state.splitId,77);
  assert.equal(h.state.mosaicTabId,id);
  assert.equal(h.tabs.get(id).windowId,h.state.mainWindowId);
});

test('disabled Split View falls back without creating a duplicate mosaic', async () => {
  const h=harness({split:true,splitFails:true});await h.launch();await h.message({type:'toggle'});
  assert.equal(h.state.visible,true);
  assert.equal(h.state.splitId,undefined);
  assert.equal(h.tabs.size,3); // original tab, main player, mosaic
  assert.notEqual(h.state.mainWindowId,h.state.mosaicWindowId);
});

test('closing the viewer closes its companion but preserves the original browser tab', async () => {
  const h=harness();await h.launch();await h.message({type:'toggle'});
  const mosaic=h.state.mosaicTabId;
  await h.closeMain();
  assert.equal(h.values.viewer,undefined);
  assert.equal(h.tabs.has(mosaic),false);
  assert.equal(h.tabs.has(10),true);
});

test('floating mode opens a muted source tab without creating or resizing a second window', async () => {
  const h=harness();await h.launch();
  await h.message({type:'floating'});
  assert.equal(h.created,1);
  assert.equal(h.state.presentation,'pip');
  assert.equal(h.state.visible,false,'visible only after real PiP event');
  assert.equal(h.state.preparing,true);
  const mosaic=h.tabs.get(h.state.mosaicTabId);
  assert.equal(mosaic.windowId,h.state.mainWindowId);
  assert.equal(mosaic.active,true,'source needs a user gesture');
  assert.equal(mosaic.muted,true);
  assert.ok(h.updates.every(update=>!('width' in update)));
  await h.message({type:'pip-state',visible:true},'mosaic');
  assert.equal(h.state.visible,true);
  assert.equal(h.state.preparing,false);
  assert.equal(h.tabs.get(h.state.mainTabId).active,true);
});

test('closing PiP preserves the source and reopening requests a gesture in the same tab', async () => {
  const h=harness();await h.launch();await h.message({type:'floating'});
  const id=h.state.mosaicTabId;
  await h.message({type:'pip-state',visible:true},'mosaic');
  await h.message({type:'floating'});
  assert.ok(h.messages.some(message=>message.id===id && message.type==='pip-exit'));
  assert.equal(h.state.visible,false);
  assert.equal(h.tabs.has(id),true);
  await h.message({type:'floating'});
  assert.equal(h.state.mosaicTabId,id);
  assert.equal(h.created,1);
  assert.equal(h.state.preparing,true);
});

test('manual PiP close updates state without moving focus or resizing the main window', async () => {
  const h=harness();await h.launch();await h.message({type:'floating'});
  await h.message({type:'pip-state',visible:true},'mosaic');
  const count=h.updates.length;
  await h.message({type:'pip-state',visible:false},'mosaic');
  assert.equal(h.state.visible,false);
  assert.equal(h.state.preparing,false);
  assert.equal(h.updates.length,count);
});

test('switching signals keeps floating PiP and its source tab alive', async () => {
  const h=harness();await h.launch();await h.message({type:'floating'});
  await h.message({type:'pip-state',visible:true},'mosaic');
  const mosaic={...h.tabs.get(h.state.mosaicTabId)};
  await h.message({type:'select',signal:6});
  assert.equal(h.state.visible,true);
  assert.deepEqual(h.tabs.get(h.state.mosaicTabId),mosaic);
});

test('converting side view to floating restores main size and reuses its mosaic', async () => {
  const h=harness();await h.launch();await h.message({type:'toggle'});
  const id=h.state.mosaicTabId;
  await h.message({type:'floating'});
  assert.equal(h.state.mosaicTabId,id);
  assert.equal(h.tabs.get(id).windowId,h.state.mainWindowId);
  assert.equal(h.windows.get(h.state.mainWindowId).width,1200);
  await h.message({type:'pip-state',visible:true},'mosaic');
  await h.message({type:'toggle'});
  assert.equal(h.state.presentation,'side');
  assert.equal(h.state.visible,true);
  await h.message({type:'pip-state',visible:false},'mosaic');
  assert.equal(h.state.visible,true,'late PiP leave must not hide side view');
});

test('failed PiP exit keeps visible state so the user can close it manually', async () => {
  const h=harness();await h.launch();await h.message({type:'floating'});
  await h.message({type:'pip-state',visible:true},'mosaic');
  h.failPiPExit('PiP exit failed');
  const answer=await h.message({type:'floating'});
  assert.equal(answer.error,'PiP exit failed');
  assert.equal(h.state.visible,true);
});

test('returning before PiP opens cancels preparation and closing source leaves main size untouched', async () => {
  const h=harness();await h.launch();await h.message({type:'floating'});
  await h.message({type:'return-main'},'mosaic');
  assert.equal(h.state.preparing,false);
  const count=h.updates.length;
  await h.closeMosaic();
  assert.equal(h.state.mosaicTabId,undefined);
  assert.equal(h.updates.length,count);
});
