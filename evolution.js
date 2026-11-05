'use strict';
(() => {
 const attackTab=document.querySelector('#tab-matchups'),evoTab=document.querySelector('#tab-evolutions');
 const attackPanel=document.querySelector('#matchup-panel'),evoPanel=document.querySelector('#evolution-panel');
 const evoSearch=document.querySelector('#evo-search'),suggestions=document.querySelector('#evo-suggestions'),searchStatus=document.querySelector('#evo-search-status');
 const output=document.querySelector('#evo-result'),gamePicker=document.querySelector('#evo-game-picker'),gameName=document.querySelector('#evo-game-name'),gamesList=document.querySelector('#evo-games');
 let evoPokemon=indexed.find(p=>p.slug==='charizard'),evoGame='sword',page='matchups',lastAttackHash=location.hash,loaded=null,revision=0,matches=[],active=-1;
 try{const stored=localStorage.getItem('pokematch-game');if(stored)evoGame=stored;}catch{}
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function data(){return window.EVOLUTION_DATA;}
 function loadData(){
  if(data())return Promise.resolve(data());if(loaded)return loaded;
  loaded=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='evolution-data.js?v=9';s.onload=()=>resolve(data());s.onerror=()=>{s.remove();loaded=null;reject(new Error('Nie udało się wczytać bazy ewolucji. Sprawdź połączenie i spróbuj ponownie.'));};document.head.append(s);});return loaded;
 }
 function writeRoute(){const u=new URL(location.href);u.hash='evolutions/'+evoGame+'/'+evoPokemon.slug;history.replaceState(null,'',u);}
 function route(){let raw;try{raw=decodeURIComponent(location.hash.slice(1));}catch{return null;}if(!raw.startsWith('evolutions/'))return null;const [,g,...slug]=raw.split('/');return {game:g,pokemon:indexed.find(p=>p.slug===slug.join('/'))};}
 function closeSuggestions(){suggestions.hidden=true;evoSearch.setAttribute('aria-expanded','false');evoSearch.removeAttribute('aria-activedescendant');active=-1;}
 function choose(p,focus=false){evoPokemon=p;evoSearch.value=p.name;closeSuggestions();writeRoute();render();if(focus)evoSearch.focus();}
 function showSuggestions(){matches=searchPokemon(evoSearch.value);suggestions.replaceChildren();active=-1;if(!evoSearch.value.trim()){closeSuggestions();return;}
  matches.forEach((p,i)=>{const li=el('li');li.id='evo-option-'+i;li.role='option';li.setAttribute('aria-selected','false');li.append(el('span','dex','#'+String(p.dex).padStart(4,'0')),el('span','suggest-name',p.name));li.addEventListener('click',()=>choose(p,true));suggestions.append(li);});
  if(!matches.length)suggestions.append(el('li','empty-option','Brak wyników. Wpisz angielską nazwę lub numer.'));
  suggestions.hidden=false;evoSearch.setAttribute('aria-expanded','true');searchStatus.textContent=matches.length?'Podpowiedzi: '+matches.length+'. Użyj strzałek i Enter.':'Brak wyników.';
 }
 function buildGames(){if(gamesList.children.length)return;for(const gen of [...new Set(data().games.map(g=>g.generation))].reverse()){
  const section=el('section','game-generation');section.append(el('h3','', 'Generacja '+gen));const row=el('div','game-options');
  for(const g of data().games.filter(g=>g.generation===gen)){const b=el('button','game-option',g.name);b.type='button';b.dataset.game=g.id;b.addEventListener('click',()=>{evoGame=g.id;try{localStorage.setItem('pokematch-game',g.id);}catch{}gamePicker.open=false;writeRoute();render();gamePicker.querySelector('summary').focus();});row.append(b);}section.append(row);gamesList.append(section);
 }}
 function thumb(id){const img=el('img','evo-thumb');img.alt='';img.width=64;img.height=64;img.loading='lazy';img.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+id+'.png';img.addEventListener('error',()=>img.hidden=true);return img;}
 function typeBadges(n){
  const box=el('span','type-badges evo-types');
  const types=n.types||indexed.find(p=>p.id===n.formId||p.pokemonId===n.pokemonId)?.types||[];
  for(const type of types)box.append(badge(type));
  return box;
 }
 function nodeButton(n){const b=el('button','evo-node');b.type='button';const label=el('span','evo-node-details');label.append(el('span','evo-node-name',n.name),typeBadges(n));b.append(thumb(n.pokemonId),label);b.addEventListener('click',()=>{const p=indexed.find(p=>p.id===n.formId)||indexed.find(p=>p.pokemonId===n.pokemonId);if(p)choose(p);});return b;}
 function edgeCards(parent,heading,edges,empty){const block=el('section','evo-section');block.append(el('h3','evo-section-title',heading));
  if(!edges.length)block.append(el('p','evo-empty',empty));
  for(const e of edges){const card=el('article','evo-edge'),line=el('div','evo-edge-line');line.append(nodeButton(e.fromNode),el('span','evo-arrow','→'),nodeButton(e.toNode));card.append(line,el('p','evo-condition',e.condition));block.append(card);}parent.append(block);
 }
 function render(){if(!data())return;const view=EvolutionEngine.view(data(),evoPokemon,evoGame);evoGame=view.game.id;gameName.textContent=view.game.name;
  for(const button of gamesList.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.game===evoGame));
  output.replaceChildren();const card=el('article','result-card evolution-card');const header=el('div','pokemon-head');const info=el('div');info.append(el('span','dex-label',view.game.name.toUpperCase()+' / #'+String(evoPokemon.dex).padStart(4,'0')),el('h2','pokemon-name',view.node?.name||evoPokemon.name));info.append(typeBadges(view.node||evoPokemon));header.append(info,thumb(view.node?.pokemonId||evoPokemon.pokemonId));card.append(header);const body=el('div','evolution-body');card.append(body);
  if(!view.available){body.append(el('p','evo-notice','Ten Pokémon lub ta forma nie jest obsługiwana w '+view.game.name+'. Zmień grę, aby sprawdzić jej ewolucje.'));output.append(card);return;}
  if(view.special)body.append(el('p','evo-notice','Wybrana forma jest przemianą. Poniżej znajdziesz linię ewolucyjną bazowego Pokémona, a dostępne przemiany w osobnej sekcji.'));
  if(evoPokemon.slug.includes('gmax')&&[25,52,133].includes(evoPokemon.dex)&&view.game.table==='swsh')body.append(el('p','evo-notice','Gigantamax Factor blokuje ewolucję tego osobnika. Usuń go przez Max Soup (Isle of Armor), aby móc ewoluować.'));
  edgeCards(body,'Preewolucje',view.ancestors,'Brak wcześniejszego etapu w tej grze. Preewolucja nie oznacza, że można cofnąć ewolucję.');
  edgeCards(body,'Dalsze ewolucje',view.descendants,'Brak dalszej ewolucji tej formy w wybranej grze.');
  if(view.branches.length){const details=el('details','evo-branches');details.append(el('summary','', 'Inne odgałęzienia tej rodziny ('+view.branches.length+')'));edgeCards(details,'Pozostałe ścieżki',view.branches,'');body.append(details);}
  const section=el('section','evo-section transformations');section.append(el('h3','evo-section-title','Przemiany w walce'));
  if(!view.transformations.length)section.append(el('p','evo-empty','Brak Mega Ewolucji, Dynamaxu, Gigantamaxu lub Terastalizacji dla tej formy w wybranej grze.'));
  for(const t of view.transformations){const item=el('article','transformation-card');const top=el('div','transformation-top');const label=el('div');label.append(el('span','transformation-kind',t.kind),el('h4','',t.title));top.append(label);const pictured=indexed.find(p=>p.slug===t.slug);if(pictured)label.append(typeBadges(pictured));else if(t.kind==='Dynamax')label.append(typeBadges(view.node));if(t.pokemonId||pictured)top.append(thumb(t.pokemonId||pictured.pokemonId));item.append(top,el('p','evo-condition',t.condition));section.append(item);}
  section.append(el('p','evo-footnote','Przemiany są tymczasowe i nie zastępują ewolucji. Dla przemian późniejszego etapu wybierz go w powyższej linii.'));body.append(section);output.append(card);
 }
 async function activate(next,update=true){
  const token=++revision;if(page==='matchups'&&next==='evolutions')lastAttackHash=location.hash;
  page=next;const evo=next==='evolutions';attackPanel.hidden=evo;evoPanel.hidden=!evo;document.querySelector('#matchup-explanation').hidden=evo;document.querySelector('#evolution-sources').hidden=!evo;
  attackTab.setAttribute('aria-selected',String(!evo));evoTab.setAttribute('aria-selected',String(evo));attackTab.tabIndex=evo?-1:0;evoTab.tabIndex=evo?0:-1;
  document.querySelector('.intro h1').replaceChildren(document.createTextNode(evo?'Sprawdź ':'Sprawdź '),el('span','',evo?'ewolucje.':'typy ataków.'));
  if(!evo){closeSuggestions();if(update){const u=new URL(location.href);u.hash=lastAttackHash&&!lastAttackHash.startsWith('#evolutions/')?lastAttackHash:'#charizard';history.replaceState(null,'',u);}return;}
  output.replaceChildren(el('p','evo-loading','Wczytuję ewolucje i warunki dla poszczególnych gier…'));
  try{await loadData();if(token!==revision||page!=='evolutions')return;buildGames();evoGame=EvolutionEngine.game(data(),evoGame).id;evoSearch.value=evoPokemon.name;if(update)writeRoute();render();}
  catch(error){if(token!==revision)return;output.replaceChildren(el('p','evo-notice',error.message));const retry=el('button','retry-button','Spróbuj ponownie');retry.type='button';retry.addEventListener('click',()=>activate('evolutions',update));output.append(retry);}
 }
 attackTab.addEventListener('click',()=>activate('matchups'));
 evoTab.addEventListener('click',()=>{if(page==='matchups'&&!location.hash.startsWith('#types/')){const p=fromHash();if(p&&!p.custom)evoPokemon=p;}activate('evolutions');});
 document.querySelector('.page-tabs').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'matchups':e.key==='End'?'evolutions':page==='matchups'?'evolutions':'matchups';activate(next);(next==='matchups'?attackTab:evoTab).focus();}});
 evoSearch.addEventListener('input',showSuggestions);evoSearch.addEventListener('focus',()=>{if(evoSearch.value!==evoPokemon.name)showSuggestions();});
 evoSearch.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSuggestions();return;}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(suggestions.hidden)showSuggestions();if(!matches.length)return;active=(active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length;[...suggestions.children].forEach((n,i)=>n.setAttribute('aria-selected',String(i===active)));evoSearch.setAttribute('aria-activedescendant','evo-option-'+active);suggestions.children[active].scrollIntoView?.({block:'nearest'});}if(e.key==='Enter'){e.preventDefault();if(matches.length&&!suggestions.hidden)choose(matches[Math.max(active,0)],true);else if(evoSearch.value!==evoPokemon.name){showSuggestions();if(matches.length)choose(matches[0],true);}}});
 document.addEventListener('click',e=>{if(!e.target.closest('.evo-search-wrap'))closeSuggestions();if(!gamePicker.contains(e.target))gamePicker.open=false;});
 document.addEventListener('keydown',e=>{if(page==='evolutions'&&e.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();evoSearch.focus();evoSearch.select();}if(e.key==='Escape'&&gamePicker.open){gamePicker.open=false;gamePicker.querySelector('summary').focus();}});
 window.addEventListener('hashchange',()=>{const r=route();if(r){evoGame=r.game;if(r.pokemon)evoPokemon=r.pokemon;activate('evolutions',false);}else{lastAttackHash=location.hash;activate('matchups',false);}});
 const initial=route();if(initial){evoGame=initial.game;if(initial.pokemon)evoPokemon=initial.pokemon;activate('evolutions',false);}
})();
