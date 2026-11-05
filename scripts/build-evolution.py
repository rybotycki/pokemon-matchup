"""Build game-specific evolution data. Python 3; source snapshots in data/evolution/.
PKHeX evolution/personal tables: GPL-3.0. PokéAPI labels: BSD-3-Clause.
See EVOLUTION-SOURCES.md for provenance and the refresh command.
"""
import csv,json,pathlib,struct,datetime,re
ROOT=pathlib.Path(__file__).resolve().parents[1]
RAW=ROOT/'data/evolution';PK=RAW/'pkhex'
def csvs(name,base=RAW):
 with (base/(name+'.csv')).open() as f:return list(csv.DictReader(f))
def u16(b,n):return struct.unpack_from('<H',b,n)[0]
ps={int(x['id']):x for x in csvs('pokemon',ROOT/'data')}
sp={int(x['id']):x for x in csvs('pokemon_species')}
forms=csvs('pokemon_forms',ROOT/'data')
labels={int(x['pokemon_form_id']):x['pokemon_name'] for x in csvs('pokemon_form_names',ROOT/'data') if x['local_language_id']=='9' and x['pokemon_name']}
snames={int(x['pokemon_species_id']):x['name'] for x in csvs('pokemon_species_names',ROOT/'data') if x['local_language_id']=='9'}
items=(PK/'text_Items_en.txt').read_text(encoding='utf-8-sig').splitlines()
item_labels={int(x['item_id']):x['name'] for x in csvs('item_names') if x['local_language_id']=='9'}
item_idx={(int(x['generation_id']),int(x['game_index'])):item_labels.get(int(x['item_id']),'') for x in csvs('item_game_indices')}
moves={int(x['move_id']):x['name'] for x in csvs('move_names') if x['local_language_id']=='9'}
# PokeAPI's Maushold display order differs from its game form index.
def formindex(f):
 species=int(ps[int(f['pokemon_id'])]['species_id']);slug=f['identifier']
 if species==925:return 0 if 'three' in slug else 1
 if species==25 and '-cap' in slug:return {'original':1,'hoenn':2,'sinnoh':3,'unova':4,'kalos':5,'alola':6,'partner':7,'world':9}.get(f['form_identifier'].replace('-cap',''),1)
 if species==133 and 'starter' in slug:return 1
 return int(f['form_order'])-1
by_species={}
for f in forms:by_species.setdefault(int(ps[int(f['pokemon_id'])]['species_id']),[]).append(f)
vg={int(x['id']):int(x['generation_id']) for x in csvs('version_groups')}
def form_meta(species,form,gen,mega=False):
 candidates=[f for f in by_species.get(species,[]) if formindex(f)==form and vg.get(int(f['introduced_in_version_group_id']),99)<=gen and ('gmax' not in f['identifier'])]
 if not mega:candidates=[f for f in candidates if f['is_mega']=='0' and f['is_battle_only']=='0']
 if not candidates:
  if form==0:candidates=[f for f in by_species.get(species,[]) if int(f['id'])==species]
  if not candidates:return None
 f=min(candidates,key=lambda f:int(f['id']));name=labels.get(int(f['id'])) or snames[species]
 if species==869:name=name.replace('Strawberry Sweet','').strip(' -·')
 return {'id':f'{species}:{form}','species':species,'form':form,'formId':int(f['id']),'name':name,'slug':f['identifier'],'pokemonId':int(f['pokemon_id']),'chain':int(sp[species]['evolution_chain_id'])}
# Personal tables describe supported forms, not wild encounter availability.
configs={
 'rb':('g1',1,151,28,None,None,None),'y':('g1',1,151,28,None,None,None),
 'gs':('g2',2,251,32,None,None,None),'c':('g2',2,251,32,None,None,None),
 'rs':('g3',3,386,28,None,None,None),'e':('g3',3,386,28,None,None,None),'fr':('g3',3,386,28,None,None,None),'lg':('g3',3,386,28,None,None,None),
 'dp':('g4',4,493,44,0x2a,0x29,None),'pt':('g4',4,493,44,0x2a,0x29,None),'hgss':('g4',4,493,44,0x2a,0x29,None),
 'bw':('g5',5,649,60,0x1c,0x20,None),'b2w2':('g5',5,649,76,0x1c,0x20,None),
 'xy':('g6',6,721,64,0x1c,0x20,None),'ao':('g6',6,721,80,0x1c,0x20,None),
 'sm':('uu',7,802,84,0x1c,0x20,None),'uu':('uu',7,807,84,0x1c,0x20,None),'gg':('gg',7,809,84,0x1c,0x20,None),
 'swsh':('ss',8,898,176,0x1e,0x20,(0x21,0x40)),'bdsp':('bs',8,493,68,0x1e,0x20,(0x21,0x40)),
 'la':('la',8,905,176,0x1e,0x20,(0x21,0x40)),
 'sv':('sv',9,1025,80,0x18,0x1a,(0x1c,0xff)),'za':('za',9,1025,80,0x18,0x1a,(0x1c,0xff))}
# Known per-title differences inside a generation's shared legality tables are resolved below.
games=[]
def add(slug,name,table,version,group):games.append({'id':slug,'name':name,'table':table,'version':version,'generation':configs[table][1],'group':group})
for row in [('red','Red','rb',35,1),('blue','Blue','rb',36,1),('yellow','Yellow','y',38,2),('gold','Gold','gs',39,3),('silver','Silver','gs',40,3),('crystal','Crystal','c',41,4),('ruby','Ruby','rs',2,5),('sapphire','Sapphire','rs',1,5),('emerald','Emerald','e',3,6),('firered','FireRed','fr',4,7),('leafgreen','LeafGreen','lg',5,7),('diamond','Diamond','dp',10,8),('pearl','Pearl','dp',11,8),('platinum','Platinum','pt',12,9),('heartgold','HeartGold','hgss',7,10),('soulsilver','SoulSilver','hgss',8,10),('black','Black','bw',21,11),('white','White','bw',20,11),('black-2','Black 2','b2w2',23,14),('white-2','White 2','b2w2',22,14),('x','X','xy',24,15),('y','Y','xy',25,15),('omega-ruby','Omega Ruby','ao',27,16),('alpha-sapphire','Alpha Sapphire','ao',26,16),('sun','Sun','sm',30,17),('moon','Moon','sm',31,17),('ultra-sun','Ultra Sun','uu',32,18),('ultra-moon','Ultra Moon','uu',33,18),('lets-go-pikachu',"Let's Go, Pikachu!",'gg',42,19),('lets-go-eevee',"Let's Go, Eevee!",'gg',43,19),('sword','Sword','swsh',44,20),('shield','Shield','swsh',45,20),('brilliant-diamond','Brilliant Diamond','bdsp',48,23),('shining-pearl','Shining Pearl','bdsp',49,23),('legends-arceus','Legends: Arceus','la',47,24),('scarlet','Scarlet','sv',50,25),('violet','Violet','sv',51,25),('legends-za','Legends: Z-A','za',52,30)]:add(*row)
# Complete Mega Stone label mapping, including Z-A additions.
stone_species={
 'Gengarite':94,'Gardevoirite':282,'Ampharosite':181,'Venusaurite':3,'Charizardite X':6,'Charizardite Y':6,'Blastoisinite':9,'Mewtwonite X':150,'Mewtwonite Y':150,'Blazikenite':257,'Medichamite':308,'Houndoominite':229,'Aggronite':306,'Banettite':354,'Tyranitarite':248,'Scizorite':212,'Pinsirite':127,'Aerodactylite':142,'Lucarionite':448,'Abomasite':460,'Kangaskhanite':115,'Gyaradosite':130,'Absolite':359,'Alakazite':65,'Heracronite':214,'Mawilite':303,'Manectite':310,'Garchompite':445,'Latiasite':380,'Latiosite':381,'Swampertite':260,'Sceptilite':254,'Sablenite':302,'Altarianite':334,'Galladite':475,'Audinite':531,'Metagrossite':376,'Sharpedonite':319,'Slowbronite':80,'Steelixite':208,'Pidgeotite':18,'Glalitite':362,'Diancite':719,'Cameruptite':323,'Lopunnite':428,'Salamencite':373,'Beedrillite':15,
 'Clefablite':36,'Victreebelite':71,'Starminite':121,'Dragoninite':149,'Meganiumite':154,'Feraligite':160,'Skarmorite':227,'Froslassite':478,'Heatranite':485,'Darkranite':491,'Emboarite':500,'Excadrite':530,'Scolipite':545,'Scraftinite':560,'Eelektrossite':604,'Chandelurite':609,'Chesnaughtite':652,'Delphoxite':655,'Greninjite':658,'Pyroarite':668,'Floettite':670,'Malamarite':687,'Barbaracite':689,'Dragalgite':691,'Hawluchanite':701,'Zygardite':718,'Drampanite':780,'Zeraorite':807,'Falinksite':870,
 'Raichunite X':26,'Raichunite Y':26,'Chimechite':358,'Absolite Z':359,'Staraptite':398,'Garchompite Z':445,'Lucarionite Z':448,'Golurkite':623,'Meowsticite':678,'Crabominite':740,'Golisopite':768,'Magearnite':801,'Scovillainite':952,'Baxcalibrite':998,'Tatsugirinite':978,'Glimmoranite':970}
# Resolve a Mega Stone by the form's X/Y/Z suffix; no fuzzy name matching.
def stone_for(species,slug):
 options=[x for x,s in stone_species.items() if s==species]
 suffix=slug.rsplit('-',1)[-1].upper()
 if suffix in ['X','Y','Z']:return next((x for x in options if x.endswith(' '+suffix)),None)
 return next((x for x in options if not x.endswith((' X',' Y',' Z'))),None)
def item(arg,gen):
 if gen<=3:return item_idx.get((gen,arg),f'przedmiot #{arg}')
 return items[arg] if arg<len(items) else f'przedmiot #{arg}'
def move(arg):return moves.get(arg,f'ruch #{arg}')
def conditions(method,arg,level,source,target,table,gen):
 lv=f'poziom {level} lub wyższy' if level else 'awans o poziom'
 if table in ['la','za']:lv=f'osiągnij poziom {level}, następnie wybierz ewolucję' if level else 'wybierz ewolucję po spełnieniu warunków'
 friendship='przyjaźń co najmniej '+('160' if gen>=8 else '220')
 text={1:f'{lv}; {friendship}',2:f'{lv}; {friendship}; dzień',3:f'{lv}; {friendship}; noc',4:lv,5:'wymiana z innym graczem',6:'wymiana, gdy trzyma '+item(arg,gen),7:'wymień Shelmeta za Karrablasta lub odwrotnie',8:'użyj '+item(arg,gen),9:lv+'; Attack > Defense',10:lv+'; Attack = Defense',11:lv+'; Attack < Defense',12:lv+'; ukryta wartość osobnika daje tę gałąź (ok. 50%)',13:lv+'; ukryta wartość osobnika daje tę gałąź (ok. 50%)',14:lv,15:'Nincada ewoluuje od poziomu 20; wolne miejsce w drużynie i zwykły Poké Ball w torbie',16:lv+'; Beauty co najmniej 170',17:'samiec; użyj '+item(arg,gen),18:'samica; użyj '+item(arg,gen),19:lv+'; dzień; trzymany '+item(arg,gen),20:lv+'; noc; trzymany '+item(arg,gen),21:lv+'; zna '+move(arg),22:lv+'; w drużynie '+snames.get(arg,str(arg)),23:lv+'; samiec',24:lv+'; samica',25:lv+'; specjalne pole magnetyczne',26:lv+'; w pobliżu Moss Rock',27:lv+'; w pobliżu Ice Rock',28:lv+'; odwróć konsolę do góry nogami (nie sam ekran)',29:lv+'; zna ruch Fairy; '+('przyjaźń co najmniej 160' if gen>=8 else 'Affection co najmniej 2 serca (Pokémon-Amie / Refresh)'),30:lv+'; w drużynie Pokémon typu Dark',31:lv+'; deszcz lub mgła w świecie gry (nie pogoda wywołana ruchem)',32:lv+'; dzień',33:lv+'; noc',34:lv+'; samica',36:lv,37:lv+'; dzień',38:lv+'; noc',39:lv+'; Mount Lanakila',40:lv+'; zmierzch; Rockruff z Own Tempo',41:lv+'; w Ultra Space (poza Alolą)',42:'użyj '+item(arg,gen)+' w Ultra Space (poza Alolą)',43:'wykonaj 3 trafienia krytyczne w jednej walce',44:'strać co najmniej 49 HP bez omdlenia; przejdź pod kamiennym łukiem w Dusty Bowl',46:lv+'; odpowiednia natura dla Amped Form',47:lv+'; odpowiednia natura dla Low Key Form',48:'pokaż Scroll of Darkness w Tower of Darkness (Isle of Armor)',49:'pokaż Scroll of Waters w Tower of Waters (Isle of Armor)',50:lv+' po przejściu 1000 kroków w trybie Let’s Go; Pokémon musi być poza Poké Ballem',51:lv+' podczas połączenia z innym graczem przez Union Circle',52:'poziom 25 lub wyższy w walce; Family of Three: ukryta wartość osobnika, szansa 1%',53:'poziom 25 lub wyższy w walce; Family of Four: ukryta wartość osobnika, szansa 99%',54:f'zbierz {arg or 999} Gimmighoul Coins; '+lv,55:'pokonaj 3 Bisharpy prowadzące grupy Pawniardów i trzymające Leader’s Crest; następnie awans o poziom',56:'użyj Rage Fist 20 razy; następnie '+lv,57:lv+'; zna Hyper Drill; Two-Segment Form: ukryta wartość osobnika, szansa 99%',58:lv+'; zna Hyper Drill; Three-Segment Form: ukryta wartość osobnika, szansa 1%',59:'samiec; co najmniej 294 obrażeń od odrzutu bez omdlenia',60:'samica; co najmniej 294 obrażeń od odrzutu bez omdlenia',62:'użyj Barb Barrage 20 razy; wybierz ewolucję',90:'użyj Peat Block podczas pełni księżyca',91:'użyj Psyshield Bash w Agile Style 20 razy; wybierz ewolucję',92:'użyj Barb Barrage w Strong Style 20 razy; wybierz ewolucję'}
 if method in [46,47]:
  natures=['Hardy','Brave','Adamant','Naughty','Docile','Impish','Lax','Hasty','Jolly','Naive','Rash','Sassy','Quirky'] if method==46 else ['Lonely','Bold','Relaxed','Timid','Serious','Modest','Mild','Quiet','Bashful','Calm','Gentle','Careful']
  return lv+'; natura: '+', '.join(natures)+'. Mint nie zmienia wariantu ewolucji.'
 if method==15 and gen==3:return 'Nincada ewoluuje od poziomu 20; wolne miejsce w drużynie'
 if method==45:
  recipes=['dzień; zgodnie z zegarem, krócej niż 5 s','dzień; przeciwnie do zegara, krócej niż 5 s','noc; zgodnie z zegarem, krócej niż 5 s','noc; przeciwnie do zegara, co najmniej 5 s','noc; zgodnie z zegarem, co najmniej 5 s','noc; przeciwnie do zegara, krócej niż 5 s','dzień; przeciwnie do zegara, co najmniej 5 s','dzień; zgodnie z zegarem, co najmniej 5 s','zmierzch, 19:00–19:59; dowolny kierunek, co najmniej 10 s']
  return 'Milcery trzyma dowolny Sweet; obróć postać: '+recipes[target['form']%9]+'. Rodzaj Sweet zmienia dekorację.'
 if table=='la' and method in [48,49]:return 'użyj '+item(arg,gen)+(' w dzień' if method==48 else ' w nocy')
 if table=='sv' and method in [48,49]:return 'użyj '+('Scroll of Darkness' if method==48 else 'Scroll of Waters')
 if table in ['la','za'] and method in [59,60]:return text[method]+'; wybierz ewolucję'
 if table=='sv' and method in [59,60]:return text[method]+'; następnie awans o poziom'
 if table=='za' and method==28:return lv+'; obróć konsolę / kontroler zgodnie z wymaganiem gry'
 if table in ['la','za'] and method==19:return 'użyj '+item(arg,gen)+' w dzień'
 if table in ['la','za'] and method==20:return 'użyj '+item(arg,gen)+' w nocy'
 if table=='gg' and source['species']==25 and source['form']!=0:return ''
 if gen==2 and source['species']==133 and target['species'] in [196,197]:return 'awans o poziom; przyjaźń co najmniej 220; '+('dzień' if target['species']==196 else 'noc')
 return text.get(method,f'Warunek specjalny (metoda {method}); sprawdź źródło gry')

tables={}
for table,(backend,gen,maximum,size,fo,fc,flag) in configs.items():
 personal=(PK/('personal_'+table)).read_bytes();raw=(PK/('evos_'+backend+'.pkl')).read_bytes();count=u16(raw,2)
 def entry(s,f=0):
  if s>maximum or (s+1)*size>len(personal):return None,None
  base=personal[s*size:(s+1)*size];index=s
  if f:
   if fc is None or f>=base[fc]:return None,None
   offset=u16(base,fo)
   index=offset+f-1 if offset else s
  if (index+1)*size>len(personal):return None,None
  data=personal[index*size:(index+1)*size]
  if flag and not(data[flag[0]]&flag[1]):return None,None
  if table=='gg' and s>151 and s not in [808,809]:return None,None
  return index,data
 nodes={};indices={}
 for s in range(1,maximum+1):
  ix,base=entry(s)
  if base is None:continue
  for f in range(max(base[fc],1) if fc else 1):
   index,data=entry(s,f)
   if data is None:continue
   meta=form_meta(s,f,gen)
   if meta is None:continue
   # Partner Pikachu/Eevee and cap Pikachu do not evolve.
   if s==670 and f==5 and table!='za':continue
   nodes[meta['id']]=meta;indices[index]=meta['id']
 edges=[]
 for key,n in list(nodes.items()):
  ix,data=entry(n['species'],n['form']);source_index=ix if gen>=7 else n['species']
  if table=='sm' and n['form']:
   ref=(PK/'personal_uu').read_bytes();base=ref[n['species']*84:(n['species']+1)*84];offset=u16(base,0x1c)
   source_index=offset+n['form']-1 if offset else n['species']
  if source_index>=count:continue
  if n['species'] in [25,133] and n['form']!=0:continue
  a,z=struct.unpack_from('<HH',raw,4+2*source_index)
  for off in range(a,z,8):
   method,_,arg,species,form,level=struct.unpack_from('<BBHHBB',raw,off)
   form=n['form'] if form==255 else form
   target=nodes.get(f'{species}:{form}')
   if not target:continue
   # No trade-triggered evolution in Legends: Arceus, nor regional rocks in HGSS/FRLG.
   if table=='la' and method in [5,6,7]:continue
   if table=='bdsp' and species==470 and method==8:continue
   if table=='hgss' and method in [25,26,27]:continue
   if table in ['fr','lg'] and species in [196,197]:continue
   if table=='sm' and (method in [40,41,42] or species>802):continue
   if table=='sm' and method==39:method=4
   if table=='sm' and method in [37,38]:arg-=2
   # Original D/P does not allow Piloswine's move evolution until a later context? The native rule remains.
   if gen==6 and n['species']==705 and species==706:method=31
   cond=conditions(method,arg,level,n,target,table,gen)
   locations={25:{'dp':'Mt. Coronet','pt':'Mt. Coronet','bw':'Chargestone Cave','b2w2':'Chargestone Cave','xy':'Route 13','ao':'New Mauville','sm':'Vast Poni Canyon','uu':'Vast Poni Canyon lub Blush Mountain','bdsp':'Mt. Coronet','la':'Coronet Highlands'},26:{'dp':'Eterna Forest','pt':'Eterna Forest','bw':'Pinwheel Forest','b2w2':'Pinwheel Forest','xy':'Route 20 / Winding Woods','ao':'Petalburg Woods','sm':'Lush Jungle','uu':'Lush Jungle','bdsp':'Eterna Forest','la':'The Heartwood, Obsidian Fieldlands'},27:{'dp':'Route 217','pt':'Route 217','bw':'Twist Mountain','b2w2':'Twist Mountain','xy':'Frost Cavern','ao':'lodowe pomieszczenie Shoal Cave','sm':'Mount Lanakila','uu':'Mount Lanakila','bdsp':'Route 217','la':'Ice Rock, Alabaster Icelands'}}
   place=locations.get(method,{}).get(table)
   if place:cond+=' — '+place
   if not cond:continue
   if n['species']==133 and species in [196,197] and gen>=6 and table!='bdsp':cond+='; nie zna ruchu Fairy (inaczej Sylveon)'
   if method==16 and table in ['xy','bw','b2w2','swsh','sv']:cond+='; Beauty musi być wcześniej uzyskane w grze z konkursami i zachowane po transferze'
   edges.append({'from':key,'to':target['id'],'method':method,'arg':arg,'level':level,'condition':cond})
 # Species-presence nodes can have no evolution method in this game's context.
 megas=[]
 if table in ['xy','ao','sm','uu','gg','za']:
  for f in forms:
   s=int(ps[int(f['pokemon_id'])]['species_id']);idx=formindex(f)
   if f['is_mega']!='1' or vg.get(int(f['introduced_in_version_group_id']),99)>gen:continue
   _,pdata=entry(s,idx)
   if pdata is None:continue
   if table=='gg' and s>151:continue
   # XY's personal data may contain unused forms; only forms introduced in XY are allowed.
   introduced=int(f['introduced_in_version_group_id'])
   if table=='xy' and introduced not in [15]:continue
   if table in ['ao','sm','uu','gg'] and introduced not in [15,16]:continue
   if table=='za' and s==384: # Rayquaza needs the game-specific Z-A stone in this title.
    condition='zna Dragon Ascent; odblokowana Mega Ewolucja (bez Mega Stone)'
   elif s==384:condition='zna Dragon Ascent; odblokowana Mega Ewolucja; bez trzymanego Z-Crystala'
   else:
    stone=stone_for(s,f['identifier']);condition='odblokowana Mega Ewolucja i Key Stone / Mega Ring; '+(stone or 'odpowiedni Mega Stone')
   megas.append({'species':s,'name':labels.get(int(f['id']),f['identifier']),'slug':f['identifier'],'pokemonId':int(f['pokemon_id']),'condition':condition})
 tables[table]={'nodes':list(nodes.values()),'edges':edges,'megas':megas}
 print(table,len(nodes),len(edges),len(megas))
gmax=[]
for f in forms:
 if 'gmax' in f['identifier']:
  gmax.append({'species':int(ps[int(f['pokemon_id'])]['species_id']),'name':labels.get(int(f['id']),f['identifier']),'slug':f['identifier'],'pokemonId':int(f['pokemon_id']),'introduced':int(f['introduced_in_version_group_id'])})
# Regional names / future-game nodes remain searchable even when unavailable.
meta={str(s):{'name':snames[s],'chain':int(x['evolution_chain_id']),'generation':int(x['generation_id'])} for s,x in sp.items()}
payload={'date':datetime.date.today().isoformat(),'games':games,'tables':tables,'species':meta,'gmax':gmax}
(ROOT/'evolution-data.js').write_text('window.EVOLUTION_DATA = '+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'data/LICENSE-PKHeX.txt').write_text((PK/'LICENSE').read_text())
