# PokéMatch

Statyczna wyszukiwarka słabości Pokémonów. Wszystkie gatunki i formy dostępne w dołączonym zrzucie PokéAPI, angielskie nazwy typów i podpowiedzi. Interfejs po polsku. Obliczenia uwzględniają dwa typy obronne, bez Abilities, przedmiotów, pogody i wyjątków konkretnych ruchów. Współczesna tabela typów od generacji VI.

## GitHub Pages

1. Utwórz publiczne repozytorium `pokemon-matchup`.
2. Wgraj **zawartość** tego folderu do głównego katalogu gałęzi `main`.
3. Otwórz **Settings → Pages → Build and deployment**.
4. Wybierz **Deploy from a branch**, gałąź **main**, katalog **/ (root)** i **Save**.
5. Po zakończeniu publikacji otwórz adres pokazany w Pages.

Nie potrzeba instalacji zależności, klucza API ani kompilacji. Plik `.nojekyll` wyłącza zbędne przetwarzanie Jekyll. Ścieżki są względne, więc strona działa również pod adresem repozytorium, np. `/pokemon-matchup/`.

## Obsługa

Wpisz angielską nazwę, fragment nazwy, formę (np. `alolan ninetales`) lub numer Pokédexu. Wybierz wynik myszą lub strzałkami i Enter. Escape zamyka podpowiedzi; `/` ustawia kursor w wyszukiwarce. Adres z `#nazwa-formy` można skopiować.

Otwórz `index.html` bezpośrednio, by używać lokalnie. Dane i logika działają bez internetu; fonty i obrazki są dodatkami pobieranymi z zewnątrz, z lokalnym zastępnikiem. Wersja hostowana wymaga załadowania strony z internetu (nie jest instalowaną aplikacją offline).

## Dane i aktualizacja

Źródło: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv (PokéAPI, BSD-3-Clause). Pliki CSV dołączono w `data/`. PokéMatch nie obiecuje obecności Pokémonów ani form nieobecnych w tym źródle. Formy kosmetyczne mogą mieć identyczne typy; ich miniatury przedstawiają odpowiadający im wariant z bazy Pokémon.

Aby odświeżyć: pobierz z powyższego źródła pliki o tych samych nazwach co w `data/`, następnie uruchom `python3 scripts/build-data.py`. Wgraj zmienione dane i `data.js` do repozytorium.

Testy: `node scripts/test.cjs`.

Pokémon i związane postacie należą do Nintendo, Game Freak i Creatures. Projekt fanowski, nieoficjalny. Obrazki: https://github.com/PokeAPI/sprites.
