// Auto-hide affects presentation only; playback and keyboard focus stay intact.
(() => {
  globalThis.FazendaToolbar = {
    create({render, delay = 2500, setTimer = setTimeout, clearTimer = clearTimeout}) {
      let enabled = false, expanded = true, timer;
      let last;
      const guards = {hovered:false, focused:false, menu:false, notice:false};
      const protectedFromHiding = () => Object.values(guards).some(Boolean);
      const cancel = () => { if (timer !== undefined) clearTimer(timer); timer = undefined; };
      const emit = () => {
        if (last?.enabled === enabled && last.expanded === expanded) return;
        last = {enabled, expanded};
        render({...last});
      };
      const schedule = () => {
        cancel();
        if (!enabled || !expanded || protectedFromHiding()) return;
        timer = setTimer(() => {
          timer = undefined;
          if (enabled && !protectedFromHiding()) { expanded = false; emit(); }
        }, delay);
      };
      return {
        setEnabled(value) {
          enabled = Boolean(value); expanded = true; emit(); schedule();
        },
        reveal() { if (enabled) { expanded = true; emit(); schedule(); } },
        collapse() {
          if (!enabled || guards.focused || guards.menu || guards.notice) return false;
          cancel(); expanded = false; emit(); return true;
        },
        setGuards(update) {
          let changed = false;
          for (const key of Object.keys(guards)) {
            if (key in update && guards[key] !== Boolean(update[key])) {
              guards[key] = Boolean(update[key]); changed = true;
            }
          }
          if (!changed) return;
          if (enabled && protectedFromHiding()) { expanded = true; emit(); }
          schedule();
        }
      };
    }
  };
})();
