importScripts('viewer-ui.js');
const urls = FazendaViewer.urls;
const read = async () => (await chrome.storage.session.get('viewer')).viewer;
const write = viewer => chrome.storage.session.set({ viewer });
const findTab = async id => { try { return await chrome.tabs.get(id); } catch { return null; } };
let pending = Promise.resolve();
const serial = operation => { const result = pending.then(operation); pending = result.catch(() => {}); return result; };
function bounds(w) { return { left: w.left ?? 0, top: w.top ?? 0, width: w.width ?? 1200, height: w.height ?? 800 }; }
function tile(area) {
  const width = Math.max(800, area.width);
  const side = Math.max(400, Math.round(width * .34));
  return { main: { ...area, width: width - side }, mosaic: { ...area, left: area.left + width - side, width: side } };
}
async function broadcast(state) {
  for (const id of [state.mainTabId, state.mosaicTabId]) {
    if (id) chrome.tabs.sendMessage(id, { type: 'viewer-state', visible: state.visible, presentation: state.presentation || 'side', preparing: Boolean(state.preparing) }).catch(() => {});
  }
}
async function exitMosaicPiP(id) {
  const response = await chrome.tabs.sendMessage(id, {type:'pip-exit'});
  if (response?.error) throw Error(response.error);
}
async function start(source) {
  const previous = await read();
  const existing = previous && await findTab(previous.mainTabId);
  if (existing) {
    await chrome.windows.update(existing.windowId, { focused: true });
    await chrome.tabs.update(existing.id, { active: true });
    return;
  }
  const original = source?.windowId ? await chrome.windows.get(source.windowId) : await chrome.windows.getLastFocused();
  const area = bounds(original);
  const selected = urls.slice(0, 6).find(url => source?.url?.startsWith(url)) || urls[0];
  const window = await chrome.windows.create({ url: selected, type: 'normal', ...area });
  const state = { mainTabId: window.tabs[0].id, mainWindowId: window.id, area, visible: false };
  await write(state);
  await broadcast(state);
}
async function toggle(state) {
  const main = await findTab(state.mainTabId);
  if (!main) throw Error('Abra o viewer pelo ícone da extensão.');
  let mosaic = state.mosaicTabId && await findTab(state.mosaicTabId);
  if (state.presentation === 'pip') {
    if (mosaic && state.visible) await exitMosaicPiP(mosaic.id);
    state.visible = false;
    state.preparing = false;
  }
  state.presentation = 'side';
  if (state.visible && mosaic) {
    if (state.splitId !== undefined) {
      await chrome.tabs.unsplit(state.splitId);
      const parked = await chrome.windows.create({ tabId: mosaic.id, type: 'normal', state: 'minimized' });
      state.mosaicWindowId = parked.id;
      delete state.splitId;
    } else {
      await chrome.windows.update(mosaic.windowId, { state: 'minimized' });
      await chrome.windows.update(main.windowId, { state: 'normal', ...state.area });
    }
    state.visible = false;
    await chrome.tabs.update(main.id, { active: true });
    await chrome.windows.update(main.windowId, { focused: true });
  } else {
    state.area = bounds(await chrome.windows.get(main.windowId));
    // Native Split View uses top-level tabs; it is available to extensions in Chrome 155+.
    if (typeof chrome.tabs.createSplit === 'function' && typeof chrome.tabs.unsplit === 'function') {
      if (mosaic) mosaic = await chrome.tabs.move(mosaic.id, { windowId: main.windowId, index: main.index + 1 });
      else mosaic = await chrome.tabs.create({ windowId: main.windowId, index: main.index + 1, url: urls[6], active: false });
      state.mosaicTabId = mosaic.id;
      await chrome.tabs.update(mosaic.id, { muted: true });
      try {
        state.splitId = await chrome.tabs.createSplit([main.id, mosaic.id]);
        state.mosaicWindowId = main.windowId;
      } catch {
        // Older/disabled Split View: use two dedicated windows, with no embedding.
        const layout = tile(state.area);
        const side = await chrome.windows.create({ tabId: mosaic.id, type: 'normal', ...layout.mosaic, focused: false });
        state.mosaicWindowId = side.id;
        await chrome.windows.update(main.windowId, { state: 'normal', ...layout.main });
      }
    } else {
      const layout = tile(state.area);
      if (mosaic) {
        await chrome.windows.update(mosaic.windowId, { state: 'normal', ...layout.mosaic, focused: false });
        state.mosaicWindowId = mosaic.windowId;
      } else {
        const side = await chrome.windows.create({ url: urls[6], type: 'normal', ...layout.mosaic, focused: false });
        mosaic = side.tabs[0];
        state.mosaicTabId = mosaic.id;
        state.mosaicWindowId = side.id;
      }
      await chrome.tabs.update(mosaic.id, { muted: true });
      await chrome.windows.update(main.windowId, { state: 'normal', ...layout.main });
    }
    state.visible = true;
    await chrome.tabs.update(main.id, { active: true });
    await chrome.windows.update(main.windowId, { focused: true });
  }
  await write(state);
  await broadcast(state);
  return { visible: state.visible };
}
async function focusMain(state) {
  const main = await findTab(state.mainTabId);
  if (main) {
    await chrome.tabs.update(main.id, {active:true});
    await chrome.windows.update(main.windowId, {focused:true});
  }
}
async function floating(state) {
  const main = await findTab(state.mainTabId);
  if (!main) throw Error('Abra o viewer pelo ícone da extensão.');
  let mosaic = state.mosaicTabId && await findTab(state.mosaicTabId);
  if (state.presentation === 'pip' && state.visible && mosaic) {
    // Exiting PiP needs no gesture in the source tab; entering does.
    await exitMosaicPiP(mosaic.id);
    state.visible = false;
    state.preparing = false;
    await write(state);
    await broadcast(state);
    await focusMain(state);
    return {visible:false, presentation:'pip', preparing:false};
  }
  // Restore the full main window before moving a side-by-side mosaic to a tab.
  if (state.presentation !== 'pip' && state.visible && mosaic) await toggle(state);
  if (mosaic && mosaic.windowId !== main.windowId) {
    mosaic = await chrome.tabs.move(mosaic.id, {windowId:main.windowId, index:main.index + 1});
  } else if (!mosaic) {
    mosaic = await chrome.tabs.create({windowId:main.windowId, index:main.index + 1, url:urls[6], active:false});
  }
  state.mosaicTabId = mosaic.id;
  state.mosaicWindowId = main.windowId;
  state.presentation = 'pip';
  state.visible = false;
  state.preparing = true;
  await chrome.tabs.update(mosaic.id, {muted:true});
  await write(state);
  await broadcast(state);
  // Activate the source page so its button/key can supply the PiP user gesture.
  await chrome.tabs.update(mosaic.id, {active:true});
  await chrome.windows.update(main.windowId, {focused:true});
  return {visible:false, presentation:'pip', preparing:true};
}
chrome.action.onClicked.addListener(tab => serial(() => start(tab)).catch(async error => {
  await chrome.action.setBadgeText({ text: '!' });
  await chrome.action.setTitle({ title: `Fazenda viewer: ${error.message}` });
}));
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (!sender.tab || sender.frameId !== 0 || !/^https:\/\/(www\.)?recordplus\.com\//.test(sender.url || '')) return;
  serial(async () => {
    const state = await read();
    const role = state && (sender.tab.id === state.mainTabId ? 'main' : sender.tab.id === state.mosaicTabId ? 'mosaic' : null);
    if (!role) return { managed: false };
    if (message.type === 'state') return { managed: true, role, visible: state.visible, presentation: state.presentation || 'side', preparing: Boolean(state.preparing), transitionUntil: state.transitionUntil, transitionSignal: state.transitionSignal };
    if (message.type === 'toggle') return toggle(state);
    if (message.type === 'floating') return floating(state);
    if (message.type === 'return-main') {
      if (state.presentation === 'pip' && !state.visible) {
        state.preparing = false;
        await write(state);
        await broadcast(state);
      }
      await focusMain(state);
      return {ok:true};
    }
    if (message.type === 'pip-state' && role === 'mosaic' && typeof message.visible === 'boolean') {
      // Stale leave events must not hide a newly opened side-by-side mosaic.
      if (!message.visible && state.presentation !== 'pip') return {ok:true};
      if (message.visible) {
        if (state.splitId !== undefined) { await chrome.tabs.unsplit(state.splitId); delete state.splitId; }
        if (sender.tab.windowId !== state.mainWindowId) {
          await chrome.windows.update(state.mainWindowId, {state:'normal', ...state.area});
          await chrome.windows.update(sender.tab.windowId, {state:'minimized'});
        }
      }
      state.presentation = 'pip';
      state.visible = message.visible;
      state.preparing = false;
      await write(state);
      await broadcast(state);
      if (message.visible) await focusMain(state);
      return {ok:true};
    }
    if (message.type === 'select' && Number.isInteger(message.signal) && message.signal >= 1 && message.signal <= 6) {
      const current = await findTab(state.mainTabId);
      if (current?.url && new URL(current.url).pathname === new URL(urls[message.signal - 1]).pathname) return { ok: true, changed: false };
      // Persist before navigation; a fixed deadline keeps real errors visible.
      state.transitionUntil = Date.now() + 1800;
      state.transitionSignal = message.signal;
      await write(state);
      try { await chrome.tabs.update(state.mainTabId, { url: urls[message.signal - 1], active: true }); }
      catch (error) {
        delete state.transitionUntil;
        delete state.transitionSignal;
        await write(state);
        throw error;
      }
      await chrome.windows.update(state.mainWindowId, { focused: true });
      return { ok: true };
    }
    return { error: 'Comando desconhecido.' };
  }).then(reply, error => reply({ error: error.message }));
  return true;
});
chrome.tabs.onRemoved.addListener(id => serial(async () => {
  const state = await read();
  if (!state) return;
  if (id === state.mainTabId) {
    await chrome.storage.session.remove('viewer');
    if (state.mosaicTabId && await findTab(state.mosaicTabId)) await chrome.tabs.remove(state.mosaicTabId);
  } else if (id === state.mosaicTabId) {
    state.visible = false;
    state.preparing = false;
    delete state.mosaicTabId; delete state.mosaicWindowId;
    if (state.presentation !== 'pip' && state.splitId === undefined && await findTab(state.mainTabId)) await chrome.windows.update(state.mainWindowId, { state: 'normal', ...state.area });
    delete state.splitId;
    await write(state);
    await broadcast(state);
  }
}).catch(() => {}));
