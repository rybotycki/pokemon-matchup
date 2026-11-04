"""Build a local snapshot from PokeAPI CSV files (data/). Python 3, no dependencies."""
import csv,json,pathlib,datetime
root=pathlib.Path(__file__).resolve().parents[1]
def rows(name):
 with (root/'data'/f'{name}.csv').open() as f:return list(csv.DictReader(f))
types={r['id']:r['identifier'] for r in rows('types') if int(r['id'])<=18}
names={r['pokemon_species_id']:r['name'] for r in rows('pokemon_species_names') if r['local_language_id']=='9'}
fnames={r['pokemon_form_id']:r for r in rows('pokemon_form_names') if r['local_language_id']=='9'}
pt={}
for r in rows('pokemon_types'):pt.setdefault(r['pokemon_id'],[]).append(types[r['type_id']])
pokemon={r['id']:r for r in rows('pokemon')}
entries=[]
for f in rows('pokemon_forms'):
 p=pokemon.get(f['pokemon_id'])
 if not p or p['id'] not in pt:continue
 n=fnames.get(f['id'],{})
 base=names.get(p['species_id'],p['identifier'].title())
 suffix=f['form_identifier'].replace('-',' ').title()
 label=n.get('pokemon_name') or (base+' · '+(n.get('form_name') or suffix) if suffix else base)
 entries.append({'id':int(f['id']),'pokemonId':int(p['id']),'dex':int(p['species_id']),'name':label,'slug':f['identifier'],'types':pt[p['id']]})
chart={t:{} for t in types.values()}
for r in rows('type_efficacy'):
 if r['damage_type_id'] in types and r['target_type_id'] in types:
  chart[types[r['damage_type_id']]][types[r['target_type_id']]]=int(r['damage_factor'])/100
payload={'date':datetime.date.today().isoformat(),'pokemon':entries,'chart':chart}
(root/'data.js').write_text('window.POKE_DATA = '+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(entries),'forms;',len({p['dex'] for p in entries}),'species')
