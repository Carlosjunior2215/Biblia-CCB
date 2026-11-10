# Bíblia CCB

App de Bíblia gratuito, sem login, que funciona sem internet e pode ser instalado no celular.
Também serve de vitrine para o **CCB Gestão do GEM** ([musicaccb.com.br](https://musicaccb.com.br)).

## O que o app faz

- Ler por livro e capítulo (abas Antigo e Novo Testamento, grade de capítulos, capítulos lidos)
- Buscar por palavra (sem se importar com acentos) ou por referência (`jo 3:16`, `Salmos 23`)
- Marcar versículos com 5 cores, favoritar, copiar
- Compartilhar versículo como imagem (WhatsApp/Status), com 3 fundos
- 4 tamanhos de letra, modo claro, escuro ou automático
- Hinário com busca por número/título, favoritos e recentes (letras: veja abaixo)
- Funciona offline: na primeira visita, guarda a Bíblia inteira (~4 MB) no aparelho
- Instalável (PWA): no navegador do celular, “Adicionar à tela inicial”
- Favoritos, marcações e leitura ficam só no aparelho (localStorage); nada é enviado a servidor

## Texto bíblico

**Bíblia Livre (BLIVRE)** © Diego Santos, Mario Sérgio e Marco Teles, licença
[Creative Commons Atribuição 4.0](https://creativecommons.org/licenses/by/4.0/deed.pt-br).
A licença exige dar o crédito, que aparece na tela inicial e em “Sobre o app”.
Não usamos ARC/ARA porque têm direitos da SBB.

Os arquivos em `data/biblia/` são gerados pelo script `scripts/build_data.py` a partir do JSON
de [eversondeveloper/bibialivrejson](https://github.com/eversondeveloper/bibialivrejson):

```bash
python3 scripts/build_data.py caminho/biblialivrecorrecao1.json
```

O script confere se saíram 66 livros e 31.102 versículos.

## Hinário

`data/hinos.json` tem os números 1 a 480 sem título e sem letra. O formato de cada hino:

```json
{ "n": 13, "titulo": "Título", "partes": [
  { "tipo": "estrofe", "rotulo": "1", "linhas": ["linha 1", "linha 2"] },
  { "tipo": "coro", "rotulo": "Coro", "linhas": ["linha 1"] }
] }
```

As letras só devem ser incluídas com autorização de quem tem os direitos.

## Estrutura

```
index.html              página única do app
manifest.webmanifest    dados para instalar no celular
sw.js                   service worker (modo offline)
.htaccess               HTTPS, compactação e cache na HostGator
css/app.css             estilos (cores em variáveis; modo escuro troca as variáveis)
js/app.js               navegação entre telas (#/, #/livros, #/ler/sl/23, #/buscar, ...)
js/dados.js             leitura da Bíblia, busca, referências, versículo do dia, hinos
js/store.js             o que o usuário salva no aparelho
js/imagem.js            gera a imagem do versículo
js/views/*.js           uma tela por arquivo
data/                   Bíblia e hinário em JSON
scripts/build_data.py   gera data/ a partir da fonte
```

Sem framework e sem etapa de build: são arquivos estáticos, prontos para qualquer hospedagem.

## Testar no computador

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

## Publicar na HostGator

1. No cPanel, crie o subdomínio (ex.: `biblia.musicaccb.com.br`) e ative o SSL grátis (AutoSSL).
2. No **Gerenciador de Arquivos**, abra a pasta do subdomínio e envie todos os arquivos
   deste repositório, **menos** a pasta `scripts/` (não é usada no site).
3. Confira se o `.htaccess` foi junto (ative “Mostrar arquivos ocultos”).
4. Abra o endereço no celular e teste.

**Ao publicar uma versão nova**, aumente `VERSAO` no início de `sw.js` (ex.: `v1` → `v2`).
Sem isso, os celulares continuam com a versão antiga guardada.

## Link no Música CCB

Basta um link “Bíblia” apontando para o endereço do app, por exemplo
`<a href="https://biblia.musicaccb.com.br">Bíblia</a>`. Para abrir direto num capítulo:
`https://biblia.musicaccb.com.br/#/ler/sl/23`.
