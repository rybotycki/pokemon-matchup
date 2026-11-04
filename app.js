'use strict';
const DATA = window.POKE_DATA;
const COLORS = {normal:'#a8a878',fire:'#f08030',water:'#6890f0',electric:'#e7c632',grass:'#78c850',ice:'#98d8d8',fighting:'#e55b53',poison:'#bb71cb',ground:'#c3a45a',flying:'#a890f0',psychic:'#f85888',bug:'#a8b820',rock:'#b8a038',ghost:'#9982bc',dragon:'#9270f9',dark:'#a38a78',steel:'#b8b8d0',fairy:'#ee99ac'};
const title = s => s[0].toUpperCase()+s.slice(1);
function normalize(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/♀/g,' female ').replace(/♂/g,' male ').replace(/alolan/g,'alola').replace(/galarian/g,'galar').replace(/hisuian/g,'hisui').replace(/paldean/g,'paldea').replace(/[^a-z0-9]+/g,' ').trim();}
function effectiveness(types){return Object.keys(DATA.chart).map(type=>({type,multiplier:types.reduce((v,def)=>v*DATA.chart[type][def],1)}));}
const indexed = DATA.pokemon.map(p=>({...p,terms:normalize(p.name+' '+p.slug),numeric:String(p.dex)}));
function searchPokemon(value){const q=normalize(value);if(!q)return [];const tokens=q.split(' ');return indexed.filter(p=>tokens.every(t=>p.terms.includes(t))||p.numeric===q).sort((a,b)=>{const rank=p=>normalize(p.name)===q?0:p.slug===q?0:p.numeric===q?1:normalize(p.name).startsWith(q)?2:3;return rank(a)-rank(b)||a.dex-b.dex||a.pokemonId-b.pokemonId||a.id-b.id;}).slice(0,30);}
const search=document.querySelector('#search'),list=document.querySelector('#suggestions'),status=document.querySelector('#search-status'),result=document.querySelector('#result');
let matches=[],active=-1,current=null;
const pokemonControls=document.querySelector('#pokemon-controls'),typeControls=document.querySelector('#type-controls');
const pokemonMode=document.querySelector('#mode-pokemon'),typesMode=document.querySelector('#mode-types');
const firstType=document.querySelector('#type-first'),secondType=document.querySelector('#type-second');
for(const type of Object.keys(DATA.chart).sort()){
 for(const field of [firstType,secondType]){
  const option=document.createElement('option');option.value=type;option.textContent=title(type);field.append(option);
 }
}
firstType.value='fire';
// Custom colored picker; native selects retain the selected values only.
const typeTriggers=new Map();
let activeTypeField=null;
const typeGrid=document.createElement('div');typeGrid.className='type-grid';typeGrid.hidden=true;typeGrid.id='type-grid';typeGrid.setAttribute('role','group');
typeControls.append(typeGrid);
for(const field of [firstType,secondType]){
 field.hidden=true;
 const trigger=document.createElement('button');trigger.type='button';trigger.className='type-trigger';trigger.id=field.id+'-trigger';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','type-grid');
 document.querySelector('label[for="'+field.id+'"]').htmlFor=trigger.id;
 field.after(trigger);typeTriggers.set(field,trigger);
 trigger.addEventListener('click',()=>{
  if(activeTypeField===field){closeTypePicker();return;}
  closeTypePicker();activeTypeField=field;trigger.setAttribute('aria-expanded','true');
  typeGrid.setAttribute('aria-label',field===firstType?'Wybierz pierwszy typ':'Wybierz drugi typ');typeGrid.replaceChildren();
  for(const option of field.options){
   const button=document.createElement('button');button.type='button';button.className='type-choice';button.dataset.type=option.value;button.disabled=option.disabled;
   button.setAttribute('aria-pressed',String(option.value===field.value));
   if(option.value)button.append(badge(option.value));else{button.textContent='＋ Brak drugiego typu';button.classList.add('type-none');}
   button.addEventListener('click',()=>{field.value=option.value;field.dispatchEvent(new Event('change'));closeTypePicker();trigger.focus();});
   typeGrid.append(button);
  }
  typeGrid.hidden=false;
 });
}
function closeTypePicker(){typeGrid.hidden=true;activeTypeField=null;for(const trigger of typeTriggers.values())trigger.setAttribute('aria-expanded','false');}
function syncTypePickers(){
 for(const [field,trigger] of typeTriggers){
  trigger.replaceChildren();
  if(field.value)trigger.append(badge(field.value));else{const text=document.createElement('span');text.className='type-placeholder';text.textContent='＋ Dodaj typ';trigger.append(text);}
  const chevron=document.createElement('span');chevron.className='type-chevron';chevron.textContent='⌄';chevron.setAttribute('aria-hidden','true');trigger.append(chevron);
  trigger.setAttribute('aria-label',(field===firstType?'Pierwszy typ: ':'Drugi typ: ')+(field.value?title(field.value):'Brak'));
 }
}
document.addEventListener('click',e=>{if(!typeControls.contains(e.target))closeTypePicker();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeTypeField){const trigger=typeTriggers.get(activeTypeField);closeTypePicker();trigger.focus();}});
typeGrid.addEventListener('keydown',e=>{
 const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];if(!keys.includes(e.key))return;
 const buttons=[...typeGrid.querySelectorAll('button:not(:disabled)')],i=buttons.indexOf(document.activeElement);if(i<0)return;
 e.preventDefault();const columns=getComputedStyle(typeGrid).gridTemplateColumns.split(' ').length;
 const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns}[e.key];
 const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+step+buttons.length)%buttons.length;buttons[next].focus();
});

function setMode(mode){
 closeTypePicker();
 const custom=mode==='types';pokemonControls.hidden=custom;typeControls.hidden=!custom;
 pokemonMode.setAttribute('aria-pressed',String(!custom));typesMode.setAttribute('aria-pressed',String(custom));hide();
}
function customTypes(types){return {custom:true,types,name:types.map(title).join(' / '),slug:'types/'+types.join('+')};}
function updateTypes(){
 if(secondType.value===firstType.value)secondType.value='';
 for(const option of secondType.options)option.disabled=option.value===firstType.value;
 select(customTypes([firstType.value,...(secondType.value?[secondType.value]:[])]));
}
firstType.addEventListener('change',updateTypes);secondType.addEventListener('change',updateTypes);
pokemonMode.addEventListener('click',()=>select(current||indexed.find(p=>p.slug==='charizard')));
typesMode.addEventListener('click',updateTypes);
function badge(type){const s=document.createElement('span');s.className='badge';s.style.setProperty('--type',COLORS[type]);s.textContent=title(type);return s;}
function hide(){list.hidden=true;search.setAttribute('aria-expanded','false');search.removeAttribute('aria-activedescendant');active=-1;}
function showSuggestions(){matches=searchPokemon(search.value);list.replaceChildren();active=-1;search.removeAttribute('aria-activedescendant');if(!search.value.trim()){hide();return;}for(const [i,p] of matches.entries()){const li=document.createElement('li');li.id='option-'+i;li.role='option';li.setAttribute('aria-selected','false');const no=document.createElement('span');no.className='dex';no.textContent='#'+String(p.dex).padStart(4,'0');const name=document.createElement('span');name.className='suggest-name';name.textContent=p.name;li.append(no,name);li.addEventListener('click',()=>select(p,true));list.append(li);}if(!matches.length){const li=document.createElement('li');li.className='empty-option';li.role='presentation';li.textContent='Brak wyników. Sprawdź angielską nazwę lub numer.';list.append(li);}status.textContent=matches.length?`Liczba podpowiedzi: ${matches.length}. Użyj strzałek i Enter.`:'Brak wyników.';list.hidden=false;search.setAttribute('aria-expanded','true');}
function mark(){[...list.children].forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));if(active>=0){search.setAttribute('aria-activedescendant','option-'+active);list.children[active].scrollIntoView({block:'nearest'});}}
function select(p,focus=false,updateURL=true){setMode(p.custom?'types':'pokemon');
if(p.custom){firstType.value=p.types[0];secondType.value=p.types[1]||'';for(const option of secondType.options)option.disabled=option.value===firstType.value;}
else{current=p;search.value=p.name;}
syncTypePickers();hide();render(p);if(updateURL){const u=new URL(location.href);u.hash=p.slug;history.replaceState(null,'',u);}if(focus)search.focus();}
function render(p){result.replaceChildren();const card=document.createElement('article');card.className='result-card';const head=document.createElement('div');head.className='pokemon-head';const details=document.createElement('div');const dex=document.createElement('span');dex.className='dex-label';dex.textContent=p.custom?'TYPY OBRONNE':'PRZECIWNIK / #'+String(p.dex).padStart(4,'0');const name=document.createElement('h2');name.className='pokemon-name';name.textContent=p.name;const types=document.createElement('div');types.className='type-badges';p.types.forEach(t=>types.append(badge(t)));details.append(dex,name,types);if(!p.custom){const art=document.createElement('div');art.className='pokemon-art';art.setAttribute('aria-hidden','true');const img=document.createElement('img');img.alt='';img.width=112;img.height=112;img.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+p.pokemonId+'.png';img.addEventListener('error',()=>{const fallback=document.createElement('span');fallback.textContent='◒';art.replaceChildren(fallback);});art.append(img);head.append(details,art);}else{head.append(details);}const body=document.createElement('div');body.className='results-body';const values=effectiveness(p.types);
const groups=[{v:4,label:'Największa słabość',color:'#b02e35'},{v:2,label:'Super effective',color:'#b02e35'},{v:1,label:'Normalne obrażenia',color:'#263c42'},{v:.5,label:'Not very effective',color:'#865600'},{v:.25,label:'Silna odporność',color:'#865600'},{v:0,label:'Brak efektu',color:'#596974'}];
for(const g of groups){const section=document.createElement('section');section.className='group';section.dataset.multiplier=String(g.v);section.style.setProperty('--group-color',g.color);const label=document.createElement('div');label.className='group-title';const mult=document.createElement('strong');mult.textContent=({'.5':'½','.25':'¼'}[String(g.v)]||String(g.v))+'×';// Normalize fractional labels explicitly.
if(g.v===.5)mult.textContent='½×';if(g.v===.25)mult.textContent='¼×';const caption=document.createElement('span');caption.textContent=g.label;label.append(mult,caption);const attacks=document.createElement('div');attacks.className='attack-list';const filtered=values.filter(v=>v.multiplier===g.v);if(filtered.length)filtered.forEach(v=>attacks.append(badge(v.type)));else{const none=document.createElement('span');none.className='none';none.textContent='Brak';attacks.append(none);}section.append(label,attacks);body.append(section);}card.append(head,body);result.append(card);}
search.addEventListener('input',showSuggestions);search.addEventListener('focus',()=>{if(search.value&&search.value!==current?.name)showSuggestions();});search.addEventListener('keydown',e=>{if(e.key==='Escape'){hide();return;}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)showSuggestions();if(!matches.length)return;active=(active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length;mark();}if(e.key==='Enter'){e.preventDefault();if(!list.hidden&&matches.length)select(matches[active<0?0:active],true);else if(search.value!==current?.name){const found=searchPokemon(search.value);if(found.length)select(found[0],true);else showSuggestions();}}});document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))hide();});document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();if(!typeControls.hidden){typeTriggers.get(firstType).focus();}else{search.focus();search.select();}}});document.querySelectorAll('[data-slug]').forEach(button=>button.addEventListener('click',()=>{const p=indexed.find(p=>p.slug===button.dataset.slug);if(p)select(p);}));
document.querySelector('#count').textContent=new Set(indexed.map(p=>p.dex)).size+' Pokémonów · '+indexed.length+' form';document.querySelector('#date').textContent='Baza '+DATA.date;
function fromHash(){let slug;try{slug=decodeURIComponent(location.hash.slice(1));}catch{slug='';}if(slug.startsWith('types/')){
 const types=slug.slice(6).split('+');
 if(types.length>=1&&types.length<=2&&new Set(types).size===types.length&&types.every(t=>Object.hasOwn(DATA.chart,t)))return customTypes(types);
 return null;
}
return indexed.find(p=>p.slug===slug);}
select(fromHash()||indexed.find(p=>p.slug==='charizard'),false,false);window.addEventListener('hashchange',()=>{const p=fromHash();if(p)select(p,false,false);});

// A native button keeps the Poké Ball usable with touch, Enter and Space.
const pokeBall=document.querySelector('.hero-ball');
pokeBall.addEventListener('click',()=>{
 const opened=pokeBall.classList.toggle('is-open');
 pokeBall.setAttribute('aria-pressed',String(opened));
 pokeBall.setAttribute('aria-label',opened?'Zamknij Poké Ball':'Otwórz Poké Ball');
 pokeBall.title=opened?'Zamknij Poké Ball':'Otwórz Poké Ball';
});
