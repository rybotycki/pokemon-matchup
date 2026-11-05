'use strict';
// Pure data queries, kept separate from rendering so game-specific rules can be tested.
window.EvolutionEngine = (() => {
 function game(data,id){return data.games.find(g=>g.id===id)||data.games.find(g=>g.id==='sword');}
 function view(data,selected,gameId){
  const g=game(data,gameId),table=data.tables[g.table];
  const special=selected.slug.includes('mega')||selected.slug.includes('gmax')||selected.slug.includes('eternamax')||selected.slug.includes('primal')||selected.slug.includes('stellar')||selected.slug.endsWith('-terastal');
  let node=table.nodes.find(n=>n.formId===selected.id)||table.nodes.find(n=>n.pokemonId===selected.pokemonId);
  if(!node&&special)node=table.nodes.find(n=>n.species===selected.dex&&n.form===0);
  const byId=new Map(table.nodes.map(n=>[n.id,n]));
  let edges=table.edges.filter(e=>{
   if([36,37,38].includes(e.method)&&e.arg!==g.version)return false;
   return true;
  });
  // Separate existing forms from evolutions that can actually occur in this game.
  if(g.table==='gg')edges=edges.filter(e=>e.from!=='808:0');
  if(!node)return {game:g,node:null,selected,ancestors:[],descendants:[],branches:[],available:false,transformations:[]};
  const chain=edges.filter(e=>byId.get(e.from)?.chain===node.chain);
  function walk(direction){const seen=new Set([node.id]),found=[];let changed=true;
   while(changed){changed=false;for(const e of chain){const a=direction==='up'?e.to:e.from,b=direction==='up'?e.from:e.to;if(seen.has(a)&&!found.includes(e)){found.push(e);if(!seen.has(b)){seen.add(b);changed=true;}}}}
   return found;
  }
  const ancestors=walk('up'),descendants=walk('down');
  const convert=e=>({...e,fromNode:byId.get(e.from),toNode:byId.get(e.to)});
  const branches=chain.filter(e=>!ancestors.includes(e)&&!descendants.includes(e));
  return {game:g,node,selected,ancestors:combine(ancestors.reverse().map(convert)),descendants:combine(descendants.map(convert)),branches:combine(branches.map(convert)),available:true,special,transformations:transforms(data,node,g)};
 }
 function combine(edges){const map=new Map();for(const e of edges){const key=e.from+'>'+e.to;if(!map.has(key))map.set(key,{...e,conditions:[e.condition]});else if(!map.get(key).conditions.includes(e.condition))map.get(key).conditions.push(e.condition);}return [...map.values()].map(e=>({...e,condition:e.conditions.join(' LUB ')}));}
 function transforms(data,node,g){
  const out=[],species=node.species,table=data.tables[g.table];
  for(const m of table.megas.filter(m=>m.species===species&&!/alola|galar|hisui|paldea/.test(node.slug)&&(species!==670||node.form===5)))out.push({kind:'Mega Ewolucja',title:m.name,condition:m.condition+(species===718?'; wymagana Complete Forme':species===670?'; tylko Eternal Flower Floette':''),pokemonId:m.pokemonId,slug:m.slug});
  if(['ao','sm','uu','za'].includes(g.table)&&[382,383].includes(species))out.push({kind:'Pierwotna przemiana',title:species===382?'Primal Kyogre':'Primal Groudon',condition:species===382?'Blue Orb; automatyczna przemiana w walce':'Red Orb; automatyczna przemiana w walce',slug:species===382?'kyogre-primal':'groudon-primal'});
  if(['uu'].includes(g.table)&&species===800)out.push({kind:'Ultra Burst',title:'Ultra Necrozma',condition:'Dusk Mane lub Dawn Wings Necrozma trzyma Ultranecrozium Z; użyj Ultra Burst w walce',slug:'necrozma-ultra'});
  if(g.table==='swsh'){
   if(![888,889,890].includes(species))out.push({kind:'Dynamax',title:'Dynamax',condition:'Dynamax Band; tylko w miejscach dopuszczających Dynamax. Raz na walkę, na 3 tury. Typ i etap ewolucji nie zmieniają się.'});
   let variants=data.gmax.filter(m=>m.species===species);
   if(species===892)variants=variants.filter(m=>m.slug.includes(node.form===1?'rapid':'single'));
   if(species===849)variants=variants.slice(0,1);
   for(const m of variants){let condition='osobnik z Gigantamax Factor: odpowiedni Max Raid lub Max Soup z 3 Max Mushrooms (Isle of Armor). Przemiana w walce trwa 3 tury.';
    if(species===809)condition='specjalny Melmetal z Gigantamax Factor z Pokémon HOME. Max Soup nie działa na Melmetala.';
    if(species===892)condition='Gigantamax Factor po Max Soup z Max Honey i 3 Max Mushrooms (Isle of Armor); użyj w walce z Dynamax.';
    if([25,52,133].includes(species))condition+=' Osobnik z Gigantamax Factor nie ewoluuje; usuń czynnik przez Max Soup, aby móc go ewoluować.';
    out.push({kind:'Gigantamax',title:m.name,condition,pokemonId:m.pokemonId,slug:m.slug});
   }
   if([888,889,890].includes(species))out.push({kind:'Dynamax',title:'Brak Dynamax',condition:'Zacian, Zamazenta i Eternatus nie mogą używać Dynamax. Eternamax Eternatus jest formą fabularną, niedostępną do używania przez gracza.'});
  }
  if(g.table==='sv'){
   let condition='Tera Orb; raz na walkę. Typ obronny zmienia się na Tera Type osobnika. Zwykły Tera Type można zmienić za 50 Tera Shards tego typu. Stellar Tera Type wymaga dostępu do Indigo Disk.';
   if(species===1017)condition='Tera Orb. Tera Type zależy od maski: Teal → Grass, Wellspring → Water, Hearthflame → Fire, Cornerstone → Rock. Nie można zmienić go Tera Shards ani nadać Stellar.';
   if(species===1024)condition='W walce Tera Shift zmienia Normal Form w Terastal Form. Po Terastalizacji powstaje Stellar Form. Tera Type jest ustalony na Stellar; nie można go zmienić.';
   out.push({kind:'Terastalizacja',title:species===1024?'Terastal → Stellar Terapagos':'Terastalizacja',condition,slug:species===1024?'terapagos-stellar':undefined});
  }
  return out;
 }
 return {game,view,transforms};
})();
