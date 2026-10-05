const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {runInNewContext}=require('node:vm');
const source=readFileSync(join(__dirname,'..','transition.js'),'utf8');
function harness({early=false}={}){
  let now=1000,next=0;
  const nodes=[],timers=new Map(),listeners={};
  const parent={append(node){node.connected=true;}};
  const document={documentElement:early?null:parent,
    createElement(){const node={attrs:{},style:{setProperty(k,v){this[k]=v;}},connected:false,setAttribute(k,v){this.attrs[k]=v;},remove(){this.connected=false;}};nodes.push(node);return node;},
    addEventListener(name,fn){listeners[name]=fn;}
  };
  const context={document,Date:{now:()=>now},setTimeout(fn,delay){const id=++next;timers.set(id,{fn,at:now+delay});return id;},clearTimeout(id){timers.delete(id);}};
  runInNewContext(source,context);
  return {ui:context.FazendaTransition,nodes,document,
    advance(ms){now+=ms;for(const [id,timer] of [...timers]) if(timer.at<=now){timers.delete(id);timer.fn();}},
    ready(){document.documentElement=parent;listeners.DOMContentLoaded?.();}
  };
}
test('authorization/player failures are exposed after at most 1.8 seconds',()=>{
  const h=harness();h.ui.show(999999,2);
  assert.equal(h.nodes[0].connected,true);
  assert.match(h.nodes[0].textContent,/sinal 2/);
  h.advance(1799);assert.equal(h.nodes[0].connected,true);
  h.advance(1);assert.equal(h.nodes[0].connected,false);
});
test('expired or invalid transition state never masks the page',()=>{
  const h=harness();for(const [until,signal] of [[1000,1],[NaN,1],[2800,7],[2800,0],[2800,'2']])h.ui.show(until,signal);
  assert.equal(h.nodes.length,0);
});
test('playback readiness and early DOM timing cannot leave a stuck cover',()=>{
  const h=harness({early:true});h.ui.show(2800,1);h.ready();
  assert.equal(h.nodes[0].connected,true);h.ui.resize(72);
  assert.equal(h.nodes[0].style.top,'72px');
  h.ui.finish();assert.equal(h.nodes[0].connected,false);
  const late=harness({early:true});late.ui.show(2800,1);late.advance(1800);late.ready();
  assert.equal(late.nodes[0].connected,false);
});
test('repeated handshakes keep the absolute deadline and rapid switching replaces covers',()=>{
  const h=harness();h.ui.show(2800,1);h.advance(600);h.ui.show(2800,1);
  assert.equal(h.nodes.length,1);h.advance(1200);assert.equal(h.nodes[0].connected,false);
  h.ui.show(4600,2);h.ui.show(4600,3);
  // Same deadline still needs to show the newly selected signal.
  assert.equal(h.nodes.filter(node=>node.connected).length,1);
  assert.match(h.nodes.find(node=>node.connected).textContent,/sinal 3/);
  h.advance(1800);assert.equal(h.nodes.filter(node=>node.connected).length,0);
});
