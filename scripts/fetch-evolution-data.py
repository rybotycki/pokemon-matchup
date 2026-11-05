"""Restore the exact source snapshots used by build-evolution.py (Python 3)."""
import concurrent.futures,hashlib,json,pathlib,urllib.request
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/'scripts/evolution-sources.json').read_text())
def fetch(entry):
 path=root/entry['path']
 if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()==entry['sha256']:return
 with urllib.request.urlopen(entry['url'],timeout=45) as response:data=response.read()
 if hashlib.sha256(data).hexdigest()!=entry['sha256']:raise ValueError('Source checksum mismatch: '+entry['path'])
 path.parent.mkdir(parents=True,exist_ok=True);temp=path.with_suffix(path.suffix+'.part');temp.write_bytes(data);temp.replace(path)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(fetch,manifest['files']))
print('Verified source snapshots:',len(manifest['files']))
