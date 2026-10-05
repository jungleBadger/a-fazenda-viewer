// Shared list of the original RecordPlus pages; no embedded players.
(() => {
  const codes = ['Y2hhbm5lbCNyNy5jb20jZjE4c2luYWwx', 'Y2hhbm5lbCNyNy5jb20jZjE4c2luYWwy', 'Y2hhbm5lbCNyNy5jb20jZjE4c2luYWwz', 'Y2hhbm5lbCNyNy5jb20jZjE4c2luYWw0', 'Y2hhbm5lbCNyNy5jb20jZjE4c2luYWw1', 'Y2hhbm5lbCNyNy5jb20jZjE4c2luYWw2', 'Y2hhbm5lbCNyNy5jb20jZjE4bW9zYWljbw'];
  globalThis.FazendaViewer = {
    urls: codes.map(code => `https://www.recordplus.com/player/channel/${code}`),
    styles: `
      :host{all:initial;display:block;color-scheme:dark}*{box-sizing:border-box}
      .bar{background:#171a17;color:#f1f2ed;font:14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;gap:20px;align-items:center;flex-wrap:wrap;padding:12px 20px;border-bottom:1px solid #343a33;box-shadow:0 3px 14px #0003}
      .brand,.channels,.modes{display:flex;align-items:center}.brand{gap:8px;white-space:nowrap}.brand strong{font-size:14px;font-weight:650;letter-spacing:-.2px}.badge{font-size:11px;font-weight:600;letter-spacing:.3px;color:#c1c7bb;border:1px solid #3b4337;border-radius:5px;padding:3px 5px}
      .channels{gap:6px}.modes{gap:8px;border-left:1px solid #3b4337;padding-left:20px}
      button{font:inherit;font-size:13px;font-weight:600;line-height:20px;min-height:40px;white-space:nowrap;cursor:pointer;border:1px solid #3d453a;background:#222720;color:#e0e5dc;border-radius:8px;padding:9px 12px;box-shadow:inset 0 1px 0 #ffffff08;transition:background-color .12s,border-color .12s}
      button:hover{background:#30382b;border-color:#616d55}.channels button[aria-pressed=true]{background:#e3c879;border-color:#e3c879;color:#25271e;box-shadow:none}
      .modes button[aria-pressed=true]{background:#343e2d;border-color:#829271;color:#f3f6ee}.view-action{border-color:#737e60;background:#2a3224;color:#eef2e7}
      button:focus-visible{outline:2px solid #e3c879;outline-offset:3px}
      .shortcuts{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:12px;color:#bac3b0;white-space:nowrap}kbd{font:inherit;font-weight:650;color:#dbe1d2}
      .status,.hint{background:#171a17;padding:0 20px 12px;font:13px/1.5 system-ui,sans-serif;color:#d9e1cf}.status:empty,.hint[hidden]{display:none}.status{color:#f0c1b6}.hint strong{font-weight:650}
      @media(max-width:1100px){.bar{gap:12px}.modes{padding-left:12px}.shortcuts{display:none}}
      @media(max-width:760px){.bar{gap:12px;padding:12px}.brand{width:100%}.channels{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));width:100%}.channels button{padding:9px 6px}.modes{border-left:0;padding-left:0;flex-wrap:wrap}.status,.hint{padding:0 12px 12px}}
      @media(prefers-reduced-motion:reduce){button{transition:none}}
    `
  };
})();
