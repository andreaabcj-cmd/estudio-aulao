# Créditos dos recursos

| Recurso | Fonte | Licença |
|---|---|---|
| Efeitos (`assets/fx`) | [PixelFX](https://github.com/patch-gg) | MIT (`assets/fx/LICENSE_pixelfx.txt`) |
| Ícones (`assets/icones`) | [Tabler Icons](https://tabler.io/icons) | MIT |
| Lutadores (`assets/lutadores`) | Dark Fantasy Pixel Pack / LootStrike (willYEE, itch.io) | CC0 |
| Fontes (`assets/fontes`) | Lexend, Tiny5 e Dancing Script (OFL), m5x7 (CC0) | licenças em `assets/fontes` |
| Personagens (`assets/bonecos`) | próprios | do projeto |
| Fotos de pessoas (`assets/pessoas`) | geradas por IA; pessoas inventadas | do projeto |
| Trilhas (`assets/musicas`) | geradas com ACE-Step | do projeto |
| Sons, efeitos de apresentação e gráficos | feitos em código (`src/`) | do projeto |

## Artes dos jogos (`assets/jogos`)
Pacotes de terceiros, incluídos aqui para o app funcionar. **Não é permitido reutilizar estes arquivos soltos fora deste projeto**; cada pacote mantém a licença do autor.

- **Espadachim, Guerreira do machado, Sombra, Arqueiro élfico, Cavaleiro glacial, Água-viva, Coração de gelo, Serafim:** elie automata.
- **Voidstalker, Fungal Horde, Obsidian Crab, Female Hero, monstrinhos, fundos e pacotes de tiro em 1ª pessoa:** itch.io.
- **Dex, Maya, Nico, Rocco:** [spritekitchen](https://spritekitchen.itch.io/).
- **MonoPixelArt:** Character Pack e Forest Monsters (itch.io).

As artes do Pênalti e da Missão tática (`assets/jogos/ia`) foram geradas por IA; os efeitos e a música da Missão tática foram feitos para este projeto.

## Mapas e bandeiras (`assets/mapas`)
- **Contornos de países e estados:** [Natural Earth](https://www.naturalearthdata.com/), domínio público (países 1:110m; estados 1:10m, simplificados).
- **Bandeiras:** [flag-icons](https://github.com/lipis/flag-icons), de Panayiotis Lipiridis, licença MIT.
- **d3-geo e d3-array:** Mike Bostock, licença ISC.

## Personagens desenhados (`assets/desenhados`)
Ilustrações planas geradas por IA para este projeto (poses e expressões), sem marcas nem logos.

## Overlays (`assets/overlays`)
- **Papel amassado:** textura cedida pelo autor do projeto.
- Os demais overlays (grão, poeira, vinheta, TV, caderno, quadriculado, gibi, luz, neon, pixels, vidro) são desenhados em código, sem imagem.

## Interativos novos (`src/hf_*.js`)
Ideias de movimento inspiradas nas peças do [HyperFrames](https://github.com/heygen-com/hyperframes) (HeyGen, licença Apache 2.0). O código foi escrito do zero para este projeto, sem copiar arquivos de lá.

## Exportar animado (assets/vendor/, 16/11)
- **mp4-muxer 5.1.3:** Vanilagy, licença MIT (github.com/Vanilagy/mp4-muxer). Monta o arquivo MP4 com os quadros gravados pelo próprio navegador.
- **gifenc 1.0.3:** Matt DesLauriers, licença MIT (github.com/mattdesl/gifenc). Monta o GIF. Só o "export" foi trocado por `window.gifenc`.
- **Conferido com o pacote oficial do npm (16/11):** `mp4-muxer.js` é igual byte a byte a `mp4-muxer@5.1.3/build/mp4-muxer.js` (SHA-256 `bba88082053511b898c921e71a865478821a674d779ba0c7028c78c921fecaf6`). O miolo de `gifenc.js` é igual a `gifenc@1.0.3/dist/gifenc.esm.js` (SHA-256 do original `217761244379253ba5815510d3048a4fb1f4c4dbe9fb51a5cfbfe26f34eec093`); a cópia daqui tem SHA-256 `51220e863ba08eb020ba147481abc88e6c89f000843ce8734afdc047f5f62bf4` por causa do comentário e do `window.gifenc`.
