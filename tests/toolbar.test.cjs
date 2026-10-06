const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
const source = readFileSync(join(__dirname, '..', 'toolbar.js'), 'utf8');

function harness() {
  const context = {};
  runInNewContext(source, context);
  let now = 0, next = 0, state;
  const timers = new Map();
  const toolbar = context.FazendaToolbar.create({
    render(value) { state = {enabled:value.enabled, expanded:value.expanded}; },
    setTimer(fn, delay) { const id = next++; timers.set(id, {at:now+delay, fn}); return id; },
    clearTimer(id) { timers.delete(id); }
  });
  return {toolbar, get state(){return state;}, advance(ms) {
    const until = now + ms;
    while (true) {
      const due = [...timers].filter(([, timer])=>timer.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];
      if (!due) break;
      now = due[1].at; timers.delete(due[0]); due[1].fn();
    }
    now = until;
  }};
}

test('toolbar remains visible by default; optional auto-hide waits 2.5 seconds', ()=>{
  const h=harness();h.toolbar.setEnabled(false);h.advance(10000);
  assert.deepEqual(h.state,{enabled:false,expanded:true});
  h.toolbar.setEnabled(true);h.advance(2499);assert.equal(h.state.expanded,true);
  h.advance(1);assert.equal(h.state.expanded,false);
});

test('pointer, keyboard focus, open menu and notices each protect the toolbar', ()=>{
  for (const guard of ['hovered','focused','menu','notice']) {
    const h=harness();h.toolbar.setEnabled(true);h.toolbar.setGuards({[guard]:true});
    h.advance(10000);assert.equal(h.state.expanded,true,guard);
    h.toolbar.setGuards({[guard]:false});h.advance(2500);assert.equal(h.state.expanded,false,guard);
  }
});

test('unchanged player updates cannot postpone hiding indefinitely', ()=>{
  const h=harness();h.toolbar.setEnabled(true);h.advance(1500);
  h.toolbar.setGuards({notice:false});h.advance(1000);
  assert.equal(h.state.expanded,false);
});

test('repeated preference notifications preserve the hide deadline and collapsed state', ()=>{
  const h=harness();h.toolbar.setEnabled(true);h.advance(1500);
  h.toolbar.setEnabled(true);h.advance(1000);
  assert.equal(h.state.expanded,false,'a storage echo must not restart the deadline');
  h.toolbar.setEnabled(true);
  assert.equal(h.state.expanded,false,'a storage echo must not reopen the bar');
});

test('reveal restores controls, and disabling auto-hide cancels pending timers', ()=>{
  const h=harness();h.toolbar.setEnabled(true);h.advance(2500);
  h.toolbar.reveal();assert.equal(h.state.expanded,true);
  h.advance(1000);h.toolbar.setEnabled(false);h.advance(10000);
  assert.deepEqual(h.state,{enabled:false,expanded:true});
});

test('old hide deadlines cannot interrupt a new interaction or hide focused controls', ()=>{
  const h=harness();h.toolbar.setEnabled(true);h.advance(2400);
  h.toolbar.setGuards({hovered:true});h.advance(1000);
  h.toolbar.setGuards({hovered:false});h.advance(2400);assert.equal(h.state.expanded,true);
  h.toolbar.setGuards({focused:true});assert.equal(h.toolbar.collapse(),false);
  h.advance(10000);assert.equal(h.state.expanded,true);
  h.toolbar.setGuards({focused:false});assert.equal(h.toolbar.collapse(),true);
});
