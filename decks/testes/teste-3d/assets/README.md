# Assets do slide de teste 3D

O modelo `brain.glb` (~12 MB) não é versionado no git. Para baixar:

```powershell
Invoke-WebRequest "https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/v1.2/models/Allen_M_Brain.glb" -OutFile brain.glb
```

Fonte: Allen Human Brain Atlas, via HuBMAP CCF 3D Reference Object Library
(repositório `hubmapconsortium/ccf-releases`, pasta `v1.2/models`).
Licença: CC BY 4.0, atribuição já incluída no rodapé do slide.

Para visualizar o slide, sirva a pasta `decks/teste-3d/` por HTTP
(ex: `npx http-server decks/teste-3d -p 8137`); aberto via `file://` o
navegador bloqueia o fetch do .glb.
