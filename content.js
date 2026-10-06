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
  let shortcutsEnabled = true;
  let toolbarAutoHide = false;
  let toolbarVisibility;
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
    syncToolbarNotice();
  }
  function syncToolbarNotice() {
    if (root) toolbarVisibility?.setGuards({notice:Boolean(root.getElementById('status').textContent.trim()) || !root.getElementById('pip-hint').hidden});
  }
  function report(error) {
    if (root) root.getElementById('status').textContent = `${error.message} Se você atualizou a extensão, recarregue esta página.`;
    syncToolbarNotice();
  }
  function applyToolbarPreference(value) {
    toolbarAutoHide = Boolean(value);
    if (root) root.getElementById('toolbar-auto-hide').checked = toolbarAutoHide;
    toolbarVisibility?.setEnabled(toolbarAutoHide);
  }
  function reflectShortcuts() {
    if (!root) return;
    root.getElementById('shortcuts-enabled').checked = shortcutsEnabled;
    for (const button of [...root.querySelectorAll('[data-signal]'), root.getElementById('toggle')]) {
      const key = button.dataset.signal || 'M';
      if (shortcutsEnabled) {
        button.setAttribute('aria-keyshortcuts', key);
        button.setAttribute('title', `Tecla ${key}`);
      } else {
        button.removeAttribute('aria-keyshortcuts');
        button.removeAttribute('title');
      }
    }
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
    host.lang = 'pt-BR';
    host.style.cssText = 'position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:2147483647!important;';
    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${FazendaViewer.styles}</style><div class="surface" id="viewer-surface"><div class="bar" role="group" aria-label="Controles do Fazenda viewer">
    <div class="brand"><div class="brand-name"><strong>${role === 'mosaic' ? 'Mosaico' : 'A Fazenda'}</strong><span class="brand-kind">viewer</span></div><span class="badge">${role === 'mosaic' ? 'Sem som' : 'F18'}</span></div>
    <div class="channels" role="group" aria-label="Selecionar sinal principal">
    ${Array.from({length:6}, (_, i) => `<button type="button" data-signal="${i+1}">Sinal ${i+1}</button>`).join('')}
    </div><div class="modes" role="group" aria-label="Exibir mosaico">
    <button type="button" class="view-action" id="toggle" aria-pressed="false">Mosaico flutuante</button><button type="button" id="side" aria-pressed="false">Ver lado a lado</button>
    ${role === 'mosaic' ? '<button type="button" id="return-main">Voltar ao sinal</button>' : ''}</div>
    <div class="overflow" id="more-group">
      <button type="button" class="more-button" id="more" aria-label="Mais opções" aria-expanded="false" aria-controls="more-panel"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></button>
      <section class="more-panel" id="more-panel" aria-label="Atalhos e projeto" hidden>
        <h2>Atalhos de teclado</h2>
        <dl class="shortcut-list"><dt><kbd>1 a 6</kbd></dt><dd>Trocar o sinal principal</dd><dt><kbd>M</kbd></dt><dd>${role === 'mosaic' ? 'Abrir ou fechar o miniplayer' : 'Preparar ou fechar o mosaico flutuante'}</dd></dl>
        <label class="shortcut-setting"><input type="checkbox" id="shortcuts-enabled" checked>Ativar atalhos de teclado</label>
        <p>Funcionam nesta página, fora de campos de texto. Para abrir o miniplayer, use M na aba do mosaico.</p>
        <label class="shortcut-setting"><input type="checkbox" id="toolbar-auto-hide">Ocultar barra automaticamente</label>
        <p>Reaparece no topo ou com <kbd>Alt + Shift + F</kbd>. Permanece aberta enquanto você usa os controles.</p>
        <a class="github-link" id="github-link" href="https://github.com/jungleBadger/a-fazenda-viewer" target="_blank" rel="noopener noreferrer">Projeto no GitHub<span aria-hidden="true">↗</span><span class="sr-only"> (abre em nova aba)</span></a>
      </section>
    </div></div>
    <div class="hint" id="pip-hint" hidden>Espere o vídeo carregar e clique em <strong>Abrir miniplayer</strong> (ou pressione M). Você volta ao sinal principal. Deixe esta aba aberta.</div><div class="status" role="status" id="status"></div></div>
    <button type="button" class="reveal-button" id="reveal-controls" aria-label="Mostrar controles" aria-expanded="false" aria-controls="viewer-surface" aria-keyshortcuts="Alt+Shift+F" hidden>Controles <span aria-hidden="true">⌄</span></button>`;
    document.documentElement.append(host);
    // Register on the document because font-face rules in shadow roots vary by browser.
    if (typeof FontFace === 'function' && document.fonts) {
      const typeface = new FontFace('Fazenda Display', `url("${chrome.runtime.getURL('fonts/Teko-Bold.ttf')}")`, {weight:'700',display:'swap'});
      document.fonts.add(typeface);
      typeface.load().then(prepare).catch(() => {});
    }
    const perform = async action => {
      const status = root.getElementById('status');
      try { status.textContent = ''; syncToolbarNotice(); await action(); }
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
    const more = root.getElementById('more');
    const morePanel = root.getElementById('more-panel');
    const moreGroup = root.getElementById('more-group');
    const surface = root.getElementById('viewer-surface');
    const revealButton = root.getElementById('reveal-controls');
    toolbarVisibility = FazendaToolbar.create({render:({enabled, expanded}) => {
      surface.dataset.autoHide = String(enabled);
      surface.dataset.collapsed = String(!expanded);
      surface.inert = !expanded;
      if (expanded) surface.removeAttribute('aria-hidden'); else surface.setAttribute('aria-hidden', 'true');
      revealButton.hidden = !enabled || expanded;
      revealButton.setAttribute('aria-expanded', String(expanded));
      prepare();
    }});
    applyToolbarPreference(toolbarAutoHide);
    const revealToolbar = (focus = false) => {
      const focusWasOnHandle = root.activeElement === revealButton;
      toolbarVisibility.reveal();
      if (focus || focusWasOnHandle) root.querySelectorAll('[data-signal]')[0].focus();
    };
    revealButton.addEventListener('click', () => revealToolbar(true));
    revealButton.addEventListener('pointerenter', () => revealToolbar());
    surface.addEventListener('pointerenter', () => toolbarVisibility.setGuards({hovered:true}));
    surface.addEventListener('pointerleave', () => toolbarVisibility.setGuards({hovered:false}));
    surface.addEventListener('focusin', () => toolbarVisibility.setGuards({focused:true}));
    surface.addEventListener('focusout', () => requestAnimationFrame(() => toolbarVisibility.setGuards({focused:surface.contains(root.activeElement)})));
    window.addEventListener('pointermove', event => {
      if (toolbarAutoHide && event.clientY <= 8) revealToolbar();
    });
    root.getElementById('toolbar-auto-hide').addEventListener('change', event => {
      applyToolbarPreference(event.target.checked);
      chrome.storage.local.set({toolbarAutoHide}).catch(report);
    });
    const setMoreOpen = (open, returnFocus = false) => {
      more.setAttribute('aria-expanded', String(open));
      morePanel.hidden = !open;
      toolbarVisibility.setGuards({menu:open});
      if (returnFocus) more.focus();
    };
    more.addEventListener('click', () => setMoreOpen(morePanel.hidden));
    moreGroup.addEventListener('focusout', event => {
      if (event.relatedTarget && !moreGroup.contains(event.relatedTarget)) setMoreOpen(false);
    });
    window.addEventListener('pointerdown', event => {
      if (!event.composedPath().includes(moreGroup)) setMoreOpen(false);
    }, {capture:true});
    root.getElementById('shortcuts-enabled').addEventListener('change', event => {
      shortcutsEnabled = event.target.checked;
      reflectShortcuts();
      chrome.storage.local.set({keyboardShortcutsEnabled:shortcutsEnabled}).catch(report);
    });
    reflectShortcuts();
    // Capture shortcuts before the player handles number seeking or M for mute.
    window.addEventListener('keydown', event => {
      if (toolbarAutoHide && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && !event.isComposing && (event.code === 'KeyF' || event.key.toLowerCase() === 'f')) {
        event.preventDefault(); event.stopImmediatePropagation();
        revealToolbar(true);
        return;
      }
      if (!morePanel.hidden) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
          setMoreOpen(false, true);
        } else if (/^[1-6m]$/i.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
          // Keep help available without triggering playback shortcuts on either page.
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        return;
      }
      if (toolbarAutoHide && event.key === 'Escape' && surface.contains(root.activeElement) && !root.getElementById('status').textContent.trim() && root.getElementById('pip-hint').hidden) {
        event.preventDefault(); event.stopImmediatePropagation();
        revealButton.hidden = false; revealButton.focus();
        toolbarVisibility.setGuards({focused:false, hovered:false});
        toolbarVisibility.collapse();
        return;
      }
      if (!shortcutsEnabled) return;
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
    function prepare() {
      if (!host.isConnected) document.documentElement.append(host);
      const height = toolbarAutoHide ? 0 : Math.ceil(host.getBoundingClientRect().height);
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
    }
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
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.keyboardShortcutsEnabled) {
      shortcutsEnabled = changes.keyboardShortcutsEnabled.newValue !== false;
      reflectShortcuts();
    }
    if (area === 'local' && changes.toolbarAutoHide) applyToolbarPreference(changes.toolbarAutoHide.newValue);
  });
  let attempts = 0;
  async function connect() {
    try {
      const state = await send({type:'state'});
      if (state?.managed) {
        const preferences = await chrome.storage.local.get({keyboardShortcutsEnabled:true, toolbarAutoHide:false});
        shortcutsEnabled = preferences.keyboardShortcutsEnabled !== false;
        toolbarAutoHide = preferences.toolbarAutoHide === true;
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
