'use strict';
const fs=require('node:fs'),vm=require('node:vm'),a=require('node:assert/strict');
const context={window:{}};vm.createContext(context);for(const f of ['data.js','evolution-data.js','evolution-engine.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
const data=context.window.EVOLUTION_DATA,engine=context.window.EvolutionEngine,pokemon=context.window.POKE_DATA.pokemon;
const view=(slug,game)=>engine.view(data,pokemon.find(p=>p.slug===slug),game);
const targets=v=>v.descendants.map(e=>e.toNode.species);
const cond=(v,n)=>v.descendants.find(e=>e.toNode.species===n)?.condition;
a.match(cond(view('eevee','sword'),470),/Leaf Stone/);a.match(cond(view('eevee','diamond'),470),/Moss Rock.*Eterna Forest/);a.match(cond(view('eevee','brilliant-diamond'),470),/Moss Rock/);a.doesNotMatch(cond(view('eevee','brilliant-diamond'),470),/Leaf Stone/);a.ok(!targets(view('eevee','heartgold')).includes(470));a.ok(!targets(view('eevee','firered')).includes(196));a.match(cond(view('eevee','gold'),196),/przyjaźń.*dzień/);
a.match(cond(view('sliggoo','x'),706),/deszcz/);a.match(cond(view('pancham','sword'),675),/drużynie.*Dark/);
a.deepEqual(Array.from(targets(view('meowth-galar','sword'))),[863]);a.deepEqual(Array.from(targets(view('meowth-alola','sun'))),[53]);a.ok(!view('meowth-galar','x').available);
a.match(cond(view('ursaring','legends-arceus'),901),/Peat Block.*pełni/);a.ok(!targets(view('ursaring','scarlet')).includes(901));a.match(cond(view('stantler','legends-arceus'),899),/Agile Style.*20/);a.ok(!targets(view('stantler','sword')).includes(899));
a.match(cond(view('haunter','legends-arceus'),94),/Linking Cord/);a.doesNotMatch(cond(view('haunter','legends-arceus'),94),/wymiana/);a.match(cond(view('haunter','sword'),94),/wymiana/);
a.ok(targets(view('cosmoem','sword')).includes(791));a.ok(!targets(view('cosmoem','sword')).includes(792));a.ok(targets(view('cosmoem','shield')).includes(792));a.ok(!targets(view('cosmoem','shield')).includes(791));
a.ok(targets(view('rockruff','sun')).length===1);a.ok(targets(view('rockruff','moon')).length===1);
a.ok(view('charizard','x').transformations.some(t=>t.title==='Mega Charizard X'&&t.condition.includes('Charizardite X')));a.ok(view('charizard','x').transformations.some(t=>t.title==='Mega Charizard Y'));
a.ok(!view('charizard','sword').transformations.some(t=>t.kind==='Mega Ewolucja'));a.ok(view('charizard','sword').transformations.some(t=>t.kind==='Gigantamax'));a.ok(view('charizard','scarlet').transformations.some(t=>t.kind==='Terastalizacja'));
a.ok(!view('zacian','sword').transformations.some(t=>t.title==='Dynamax'));a.ok(view('eternatus','sword').transformations.some(t=>t.title==='Brak Dynamax'));
a.ok(view('charizard','red').transformations.length===0);a.ok(!view('venusaur','sword').ancestors.some(e=>e.fromNode.species!==1&&e.fromNode.species!==2));
a.ok(!view('dreepy','red').available);a.equal(view('charizard','sword').ancestors[0].fromNode.species,4);a.equal(view('charizard','sword').ancestors.length,2);
a.ok(!view('floette-red','legends-za').transformations.length);a.ok(view('floette-eternal','legends-za').transformations.some(t=>t.kind==='Mega Ewolucja'));
a.match(view('terapagos','scarlet').transformations[0].condition,/Stellar/);a.match(view('ogerpon','scarlet').transformations[0].condition,/maski/);
a.deepEqual(Array.from(view('clefairy','red').node.types),['normal']);a.deepEqual(Array.from(view('clefairy','x').node.types),['fairy']);a.deepEqual(Array.from(view('magnemite','red').node.types),['electric']);a.deepEqual(Array.from(view('magnemite','gold').node.types),['electric','steel']);
let edges=0;
for(const [id,table] of Object.entries(data.tables)){
 const nodes=new Map(table.nodes.map(n=>[n.id,n]));a.equal(nodes.size,table.nodes.length);for(const n of table.nodes){a.ok(n.types.length>=1&&n.types.length<=2);a.ok(n.types.every(t=>Object.hasOwn(context.window.POKE_DATA.chart,t)));}
 for(const e of table.edges){a.ok(nodes.has(e.from),id+': missing source');a.ok(nodes.has(e.to),id+': missing target');a.equal(nodes.get(e.from).chain,nodes.get(e.to).chain,id+': unrelated species connected');a.ok(e.condition&&!e.condition.includes('Warunek specjalny'));edges++;}
 for(const m of table.megas)a.ok(!m.condition.includes('odpowiedni Mega Stone'));
}
for(const g of data.games){a.ok(data.tables[g.table]);const v=view('eevee',g.id);if(v.available)a.ok(v.ancestors.length===0);}
console.log(`PASS: ${data.games.length} games, ${edges} evolution rules, historical methods, regional forms, pre-evolutions, version branches, Mega X/Y, Dynamax/Gigantamax, Terastalization, unavailable species.`);
