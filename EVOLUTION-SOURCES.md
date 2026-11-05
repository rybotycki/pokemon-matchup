# Evolution data

`evolution-data.js` is a generated, local snapshot. It is downloaded by the browser only when the Evolutions tab opens. No keys or live API are required for normal usage.

The game profiles cover 38 individual main-series RPG versions, from Red/Blue to Legends: Z-A. Modern profiles include updates, HOME-supported species and DLC. Presence in a personal table is **not** a wild encounter, availability, event or DLC ownership guide. Pokémon GO and Champions are outside this view.

## Sources and licensing

- [PokéAPI](https://github.com/PokeAPI/pokeapi): species, form labels, items, moves and family membership. BSD-3-Clause; license in `data/LICENSE-PokeAPI.txt`.
- [PKHeX](https://github.com/kwsch/PKHeX): binary evolution and personal tables for each game context. The corresponding generated evolution dataset is derived from GPL-3.0 data; license in `data/LICENSE-PKHeX.txt`. Exact upstream commit IDs and per-file checksums are in `scripts/evolution-sources.json`. Source snapshots are recoverable using the fetcher below.
- [Official Gigantamax mechanics](https://swordshield.pokemon.com/en-us/gameplay/gigantamax/), [official Terastal description](https://scarletviolet.pokemon.com/en-us/news/terastal_phenomenon/), and [official Mega Evolution overview](https://legends.pokemon.com/en-us/mega-pokemon).

The parser reads the documented eight-byte evolution method records and personal/form indices. Game-specific corrections in `scripts/build-evolution.py` resolve shared-generation table exceptions, e.g. HGSS's absent evolution rocks, FRLG's absent time-based Eevee evolutions, D/P vs BDSP, Gen VI Goodra's rain, SM's regional form indices, Legends: Arceus's manual/item methods and per-title version branches.

Mega Stones and special transformation rules are represented separately from permanent evolutions. Dynamax/Gigantamax, Mega Evolution and Terastalization are never treated as additional permanent evolution stages. A transformation on a later evolution is shown when that stage is selected.

## Rebuild and verify

```sh
python3 scripts/fetch-evolution-data.py
python3 scripts/build-evolution.py
node scripts/test.cjs
node scripts/test-evolution.cjs
```

The fetcher restores pinned source bytes and verifies checksums. It does not silently replace them with current upstream data. To intentionally update the data, review new upstream snapshots, update the lock and relevant mappings, rebuild and rerun the fixtures. The rules and compatibility flags reflect these snapshots, not a claim of validation against every possible in-game state.

The pure-query engine is `evolution-engine.js`; UI, lazy loading and routing are in `evolution.js`. URLs use `#evolutions/<game>/<pokemon-form>`. Existing Pokémon and `#types/fire+flying` URLs retain their original matchup behavior. The selected game is remembered locally when browser storage permits it.
