(() => {
  if (window.top !== window) return;
  const first = FazendaViewer.urls[0];
  // Old viewer bookmarks now open a real, top-level player instead of blocked frames.
  if (new URL(location.href).searchParams.get('fazenda_viewer') === '1') {
    location.replace(first);
    return;
  }
  let mounted = false;
  let currentRole;
  let visible = false;
  let presentation = 'side';
  let preparing = false;
  const watchedVideos = new WeakSet();
  let host, root;
  const send = async message => {
    const response = await chrome.runtime.sendMessage(message);
    if (response?.error) throw Error(response.error);
    return response;
  };
  function reflect() {
    if (!root) return;
    const button = root.getElementById('toggle');
    const label = currentRole === 'mosaic'
      ? (visible && presentation === 'pip' ? 'Fechar miniplayer' : 'Abrir miniplayer')
      : (visible && presentation === 'pip' ? 'Fechar miniplayer' : 'Mosaico flutuante');
    if (button.textContent !== label) button.textContent = label;
    const pipVisible = String(visible && presentation === 'pip');
    if (button.getAttribute('aria-pressed') !== pipVisible) button.setAttribute('aria-pressed', pipVisible);
    const side = root.getElementById('side');
    const sideLabel = visible && presentation === 'side' ? 'Ocultar lado a lado' : 'Ver lado a lado';
    if (side.textContent !== sideLabel) side.textContent = sideLabel;
    if (side.getAttribute('aria-pressed') !== String(visible && presentation === 'side')) side.setAttribute('aria-pressed', String(visible && presentation === 'side'));
    root.getElementById('pip-hint').hidden = currentRole !== 'mosaic' || presentation !== 'pip' || visible;
    const code = location.pathname.split('/').pop();
    root.querySelectorAll('[data-signal]').forEach(button => {
      const pressed = String(code === FazendaViewer.urls[Number(button.dataset.signal) - 1].split('/').pop());
      if (button.getAttribute('aria-pressed') !== pressed) button.setAttribute('aria-pressed', pressed);
    });
  }
  function report(error) {
    if (root) root.getElementById('status').textContent = `${error.message} Se você atualizou a extensão, recarregue esta página.`;
  }
  async function selectSignal(signal) {
    const current = location.pathname.split('/').pop();
    if (currentRole === 'main' && current !== FazendaViewer.urls[signal - 1].split('/').pop()) globalThis.FazendaTransition?.show(Date.now() + 1800, signal);
    try {
      const result = await send({type:'select', signal});
      if (result?.changed === false) globalThis.FazendaTransition?.finish();
      return result;
    } catch (error) {
      globalThis.FazendaTransition?.finish();
      throw error;
    }
  }
  function watchVideo(video) {
    if (watchedVideos.has(video)) return;
    watchedVideos.add(video);
    video.addEventListener('playing', () => globalThis.FazendaTransition?.finish());
    if (currentRole !== 'mosaic') return;
    video.addEventListener('enterpictureinpicture', () => {
      visible = true; preparing = false; presentation = 'pip'; reflect();
      send({type:'pip-state', visible:true}).catch(report);
    });
    video.addEventListener('leavepictureinpicture', () => {
      // A switch back to side-by-side already sets its presentation locally.
      if (presentation !== 'pip') return;
      visible = false; preparing = false; video.pause(); reflect();
      send({type:'pip-state', visible:false}).catch(report);
    });
  }
  async function toggleVideoPiP() {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }
    const video = document.querySelector('video');
    if (!video || video.readyState === 0 || !video.videoWidth) throw Error('Espere o vídeo do mosaico carregar e tente novamente. Se necessário, clique em Play.');
    if (!document.pictureInPictureEnabled || typeof video.requestPictureInPicture !== 'function' || video.disablePictureInPicture) throw Error('Miniplayer indisponível para este vídeo. Use Ver lado a lado.');
    watchVideo(video);
    video.muted = true;
    // Both calls run directly in the button/key gesture, before any await.
    video.play().catch(() => {});
    try { await video.requestPictureInPicture(); }
    catch { throw Error('Não foi possível abrir o miniplayer. Clique em Abrir miniplayer na aba do mosaico ou use Ver lado a lado.'); }
  }
  function mount(role) {
    if (mounted || !document.documentElement) return;
    mounted = true;
    currentRole = role;
    host = document.createElement('div');
    host.id = 'fazenda-local-controls';
    host.style.cssText = 'position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:2147483647!important;';
    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${FazendaViewer.styles}</style><div class="bar" role="toolbar" aria-label="Controles do Fazenda viewer">
    <div class="brand"><strong>${role === 'mosaic' ? 'Mosaico' : 'Fazenda viewer'}</strong><span class="badge">${role === 'mosaic' ? 'Sem som' : 'F18'}</span></div>
    <div class="channels" role="group" aria-label="Selecionar sinal principal">
    ${Array.from({length:6}, (_, i) => `<button data-signal="${i+1}" aria-keyshortcuts="${i+1}" title="Tecla ${i+1}">Sinal ${i+1}</button>`).join('')}
    </div><div class="modes" role="group" aria-label="Exibir mosaico">
    <button class="view-action" id="toggle" aria-pressed="false" aria-keyshortcuts="M" title="M: abrir ou fechar o miniplayer do mosaico">Mosaico flutuante</button><button id="side" aria-pressed="false">Ver lado a lado</button>
    ${role === 'mosaic' ? '<button id="return-main">Voltar ao sinal</button>' : ''}</div>
    <span class="shortcuts"><kbd>1–6</kbd> sinais <span aria-hidden="true">·</span> <kbd>M</kbd> mosaico</span></div>
    <div class="hint" id="pip-hint" hidden>Espere o vídeo carregar e clique em <strong>Abrir miniplayer</strong> (ou pressione M). Você volta ao sinal principal. Deixe esta aba aberta.</div><div class="status" role="status" id="status"></div>`;
    document.documentElement.append(host);
    const perform = async action => {
      const status = root.getElementById('status');
      try { status.textContent = ''; await action(); }
      catch (error) { report(error); }
    };
    root.querySelectorAll('[data-signal]').forEach(button => button.addEventListener('click', () => perform(() => selectSignal(Number(button.dataset.signal)))));
    root.getElementById('toggle').addEventListener('click', () => perform(() => {
      if (currentRole === 'mosaic') return toggleVideoPiP();
      return send({type:'floating'}).then(state => { visible = Boolean(state.visible); preparing = Boolean(state.preparing); presentation = state.presentation; reflect(); });
    }));
    root.getElementById('side').addEventListener('click', () => perform(async () => {
      const state = await send({type:'toggle'}); visible = Boolean(state.visible); preparing = false; presentation = 'side'; reflect();
    }));
    root.getElementById('return-main')?.addEventListener('click', () => perform(() => send({type:'return-main'})));
    // Capture shortcuts before the player handles number seeking or M for mute.
    window.addEventListener('keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      // composedPath includes fields inside our toolbar and the site's shadow DOM.
      if (event.composedPath().some(node => node.isContentEditable || node.matches?.('input,textarea,select,[role="textbox"],[role="combobox"]'))) return;
      const signal = /^[1-6]$/.test(event.key) ? Number(event.key) : null;
      const mosaic = event.key.toLowerCase() === 'm';
      if (!signal && !mosaic) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (signal) perform(() => selectSignal(signal));
      else root.getElementById('toggle').click();
    }, {capture:true});
    // Expand a recognized native player without moving its video or controls.
    const prepare = () => {
      if (!host.isConnected) document.documentElement.append(host);
      const height = Math.ceil(host.getBoundingClientRect().height);
      globalThis.FazendaTransition?.resize(height);
      const video = document.querySelector('video');
      if (video) watchVideo(video);
      if (video && video.readyState >= 2 && !video.paused && video.videoWidth) globalThis.FazendaTransition?.finish();
      if (video && currentRole === 'mosaic') {
        video.muted = true;
        watchVideo(video);
        if (!visible && !preparing && !document.pictureInPictureElement && !video.paused) video.pause();
      }
      const player = video?.closest('.bitmovinplayer-container, .jwplayer, .video-js, .shaka-video-container, [data-testid="video-player"]');
      if (player) {
        const values = {position:'fixed',top:`${height}px`,left:'0',width:'100vw',height:`calc(100vh - ${height}px)`,'max-width':'none','max-height':'none','z-index':'2147483646'};
        for (const [key,value] of Object.entries(values)) if (player.style.getPropertyValue(key) !== value) player.style.setProperty(key,value,'important');
      }
      reflect();
    };
    prepare();
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; prepare(); });
    }).observe(document.documentElement, { childList:true, subtree:true });
    window.addEventListener('resize', prepare);
    // Interval also handles SPA channel changes and new player instances.
    setInterval(prepare, 1500);
  }
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message.type === 'pip-exit' && currentRole === 'mosaic') {
      const exit = document.pictureInPictureElement ? document.exitPictureInPicture() : Promise.resolve();
      exit.then(() => reply({ok:true}), error => reply({error:error.message}));
      return true;
    }
    if (message.type !== 'viewer-state') return;
    visible = Boolean(message.visible);
    preparing = Boolean(message.preparing);
    presentation = message.presentation || 'side';
    reflect();
    const video = document.querySelector('video');
    if (currentRole === 'mosaic' && video) {
      video.muted = true;
      if (visible || preparing) video.play().catch(() => {}); else video.pause();
    }
  });
  let attempts = 0;
  async function connect() {
    try {
      const state = await send({type:'state'});
      if (state?.managed) {
        visible = state.visible;
        preparing = Boolean(state.preparing);
        presentation = state.presentation || 'side';
        if (state.role === 'main') globalThis.FazendaTransition?.show(state.transitionUntil, state.transitionSignal);
        if (!document.documentElement) {
          if (++attempts < 12) setTimeout(connect, 50);
          return;
        }
        mount(state.role);
        return;
      }
    } catch { return; }
    if (++attempts < 12) setTimeout(connect, 500);
  }
  // Connect before DOMContentLoaded so the site's transient dialog is covered early.
  connect();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { if (!mounted) connect(); }, {once:true});
})();
