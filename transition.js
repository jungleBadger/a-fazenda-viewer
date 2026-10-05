// A short cosmetic cover for channel navigation. It never changes authorization.
(() => {
  let cover, timer, deadline = 0, currentSignal, top = 0;
  function finish() {
    clearTimeout(timer);
    cover?.remove();
    cover = null;
    deadline = 0;
    currentSignal = undefined;
  }
  function resize(height) {
    top = Math.max(0, height);
    if (cover) cover.style.setProperty('top', `${top}px`, 'important');
  }
  function show(until, signal) {
    const now = Date.now();
    if (!Number.isFinite(until) || until <= now || !Number.isInteger(signal) || signal < 1 || signal > 6) return;
    const next = Math.min(until, now + 1800);
    if (cover && next === deadline && signal === currentSignal) return;
    finish();
    deadline = next;
    currentSignal = signal;
    cover = document.createElement('div');
    cover.id = 'fazenda-signal-transition';
    cover.setAttribute('role', 'status');
    cover.setAttribute('aria-live', 'polite');
    cover.style.cssText = `position:fixed!important;inset:0!important;top:${top}px!important;z-index:2147483646!important;background:#080a08!important;color:#d5dccd!important;display:grid!important;place-items:center!important;font:14px/1.5 system-ui,sans-serif!important;pointer-events:none!important;`;
    cover.textContent = `Abrindo sinal ${signal}…`;
    const attach = () => { if (cover && Date.now() < deadline) document.documentElement?.append(cover); };
    if (document.documentElement) attach();
    else document.addEventListener('DOMContentLoaded', attach, {once:true});
    timer = setTimeout(finish, deadline - now);
  }
  globalThis.FazendaTransition = {show, finish, resize};
})();
